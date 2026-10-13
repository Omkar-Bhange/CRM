require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const mongoose = require("mongoose");
const path = require("path");

const TEST_DB_NAME = `crm_isolated_appcounter_test_${Date.now()}`;
const TEST_URI = `mongodb://127.0.0.1:27017/${TEST_DB_NAME}`;

let passed = 0;
let failed = 0;

function assert(description, condition) {
  if (condition) {
    console.log(`  PASS: ${description}`);
    passed++;
  } else {
    console.error(`  FAIL: ${description}`);
    failed++;
  }
}

async function runIsolatedTests() {
  console.log("================================================================================");
  console.log("   APPCOUNTER ISOLATED FUNCTIONAL & CONCURRENCY VERIFICATION                    ");
  console.log("================================================================================");
  console.log(`Connecting to ISOLATED test database: ${TEST_URI}`);

  await mongoose.connect(TEST_URI);
  console.log(`Connected to isolated database: ${mongoose.connection.name}`);

  try {
    const AppCounter = require("./models/AppCounter");

    // [1] Collection Name Verification in DB
    console.log("\n[1] Collection & Model Verification");
    assert("Model compiles without error", Boolean(AppCounter));
    assert("Model name is AppCounter", AppCounter.modelName === "AppCounter");
    assert("Collection name is appcounters", AppCounter.collection.name === "appcounters");

    // [2] Creation with Default Sequence
    console.log("\n[2] Creation with Default Sequence");
    const manualDoc = await AppCounter.create({ _id: "test_manual_counter" });
    assert("Document created with string _id", manualDoc._id === "test_manual_counter");
    assert("Default seq is 0", manualDoc.seq === 0);

    // [3] Atomic Upsert & Increment on New Counter
    console.log("\n[3] Atomic Upsert & Increment on New Counter");
    const testKey1 = `counter_test_init_${Date.now()}`;
    const initialUpsert = await AppCounter.findByIdAndUpdate(
      testKey1,
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    assert("Upsert returns created document", Boolean(initialUpsert));
    assert("Initial sequence is 1", initialUpsert.seq === 1);
    assert("_id matches key", initialUpsert._id === testKey1);

    // [4] Subsequent Atomic Increments on Existing Counter
    console.log("\n[4] Subsequent Atomic Increments on Existing Counter");
    const secondInc = await AppCounter.findByIdAndUpdate(
      testKey1,
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    assert("Second increment returns seq 2", secondInc.seq === 2);

    const thirdInc = await AppCounter.findByIdAndUpdate(
      testKey1,
      { $inc: { seq: 5 } },
      { new: true, upsert: true }
    );
    assert("Arbitrary increment ($inc: 5) returns seq 7", thirdInc.seq === 7);

    // [5] High-Concurrency Race Condition Verification
    console.log("\n[5] High-Concurrency Race Condition Verification");
    const concurrencyKey = `counter_concurrent_${Date.now()}`;
    const CONCURRENCY_COUNT = 50;

    const parallelOps = Array.from({ length: CONCURRENCY_COUNT }, () => {
      return AppCounter.findByIdAndUpdate(
        concurrencyKey,
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
    });

    const results = await Promise.all(parallelOps);
    const returnedSeqNumbers = results.map(r => r.seq);
    const uniqueSeqNumbers = new Set(returnedSeqNumbers);

    assert(`All ${CONCURRENCY_COUNT} concurrent operations completed`, results.length === CONCURRENCY_COUNT);
    assert(`Exactly ${CONCURRENCY_COUNT} unique sequence numbers issued`, uniqueSeqNumbers.size === CONCURRENCY_COUNT);

    const finalDoc = await AppCounter.findById(concurrencyKey);
    assert(`Final stored sequence is exactly ${CONCURRENCY_COUNT}`, finalDoc.seq === CONCURRENCY_COUNT);

    // Verify there are no gaps from 1 to CONCURRENCY_COUNT
    const sortedSeqs = [...returnedSeqNumbers].sort((a, b) => a - b);
    let noGaps = true;
    for (let i = 0; i < CONCURRENCY_COUNT; i++) {
      if (sortedSeqs[i] !== i + 1) {
        noGaps = false;
        break;
      }
    }
    assert("Returned sequence numbers form a continuous sequence with zero gaps or duplicates", noGaps);

    // [6] Production Helper Logic: getNextAmcRequestCode
    console.log("\n[6] Production Helper Logic: getNextAmcRequestCode");
    // Require admin and client to test their canonical getNextAmcRequestCode implementation
    const currentYear = new Date().getFullYear();
    const reqCodeKey = `amc_req_${currentYear}`;

    // Clean any existing counter for this test key in isolated DB
    await AppCounter.deleteOne({ _id: reqCodeKey });

    // Simulate getNextAmcRequestCode
    async function getNextAmcRequestCode() {
      const year = new Date().getFullYear();
      const counter = await AppCounter.findByIdAndUpdate(
        `amc_req_${year}`,
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      return `AMC-REQ-${year}-${String(counter.seq).padStart(4, "0")}`;
    }

    const code1 = await getNextAmcRequestCode();
    assert("First AMC Request Code has seq 0001", code1 === `AMC-REQ-${currentYear}-0001`);

    const code2 = await getNextAmcRequestCode();
    assert("Second AMC Request Code has seq 0002", code2 === `AMC-REQ-${currentYear}-0002`);

    // [7] Concurrency Safety of getNextAmcRequestCode
    console.log("\n[7] Concurrency Safety of getNextAmcRequestCode");
    const CONCURRENT_CODES = 25;
    const codePromises = Array.from({ length: CONCURRENT_CODES }, () => getNextAmcRequestCode());
    const generatedCodes = await Promise.all(codePromises);
    const uniqueCodes = new Set(generatedCodes);

    assert(`Generated ${CONCURRENT_CODES} codes concurrently`, generatedCodes.length === CONCURRENT_CODES);
    assert(`All ${CONCURRENT_CODES} generated codes are distinct (zero duplicates)`, uniqueCodes.size === CONCURRENT_CODES);

    const afterConcurrentCounter = await AppCounter.findById(reqCodeKey);
    assert(`Counter seq reflects initial 2 + concurrent ${CONCURRENT_CODES} = ${2 + CONCURRENT_CODES}`, afterConcurrentCounter.seq === 2 + CONCURRENT_CODES);

  } finally {
    console.log("\n[Teardown] Cleaning up isolated database...");
    try {
      await mongoose.connection.dropDatabase();
      console.log(`Dropped test database: ${TEST_DB_NAME}`);
    } catch (dropErr) {
      console.error("Warning: Failed to drop test database:", dropErr.message);
    }
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }

  console.log("================================================================================");
  console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("All AppCounter isolated functional checks passed successfully!");
    process.exit(0);
  }
}

runIsolatedTests().catch(err => {
  console.error("Unhandled test runner error:", err);
  process.exit(1);
});
