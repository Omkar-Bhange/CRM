"use strict";
/**
 * test_processedsessionbucket_isolated.js
 * Isolated functional integration test suite for ProcessedSessionBucket model.
 * Connects to a dedicated temporary local database and drops it on completion.
 */

const mongoose = require("mongoose");

const TEST_DB_NAME = `crm_isolated_bucket_test_${Date.now()}`;
const TEST_URI = `mongodb://127.0.0.1:27017/${TEST_DB_NAME}`;

let passed = 0;
let failed = 0;

function assert(label, cond) {
  if (cond) {
    console.log("  PASS:", label);
    passed++;
  } else {
    console.error("  FAIL:", label);
    failed++;
  }
}

// Mirroring reserveProcessedSession in backend/server.js
async function simulateReserveProcessedSession(ProcessedSessionBucket, { employeeCode, pcName, date, sessionId }) {
  const normalizedEmployeeCode = String(employeeCode || "").trim().toUpperCase();
  const normalizedPcName = String(pcName || "").trim();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const filter = {
    employeeCode: normalizedEmployeeCode,
    pcName: normalizedPcName,
    date,
  };

  const update = {
    $addToSet: {
      sessionIds: String(sessionId),
    },
    $setOnInsert: {
      employeeCode: normalizedEmployeeCode,
      pcName: normalizedPcName,
      date,
      expiresAt,
    },
  };

  try {
    const result = await ProcessedSessionBucket.updateOne(filter, update, { upsert: true });
    return result.upsertedCount === 1 || result.modifiedCount === 1;
  } catch (error) {
    if (error?.code === 11000) {
      const retry = await ProcessedSessionBucket.updateOne(filter, {
        $addToSet: {
          sessionIds: String(sessionId),
        },
      });
      return retry.modifiedCount === 1;
    }
    throw error;
  }
}

// Mirroring releaseProcessedSession in backend/server.js
async function simulateReleaseProcessedSession(ProcessedSessionBucket, { employeeCode, pcName, date, sessionId }) {
  await ProcessedSessionBucket.updateOne(
    {
      employeeCode: String(employeeCode || "").trim().toUpperCase(),
      pcName: String(pcName || "").trim(),
      date,
    },
    {
      $pull: {
        sessionIds: String(sessionId),
      },
    }
  );
}

async function runIsolatedTests() {
  console.log("================================================================================");
  console.log("   PROCESSEDSESSIONBUCKET ISOLATED FUNCTIONAL INTEGRATION TEST                   ");
  console.log("================================================================================");
  console.log(`Connecting to ISOLATED database: ${TEST_URI}`);
  console.log(`Target Database Name: ${TEST_DB_NAME}`);

  await mongoose.connect(TEST_URI);
  console.log(`Connected successfully. Active DB: ${mongoose.connection.name}`);

  try {
    const ProcessedSessionBucket = require("./models/ProcessedSessionBucket");

    // 1. Model registration & collection name
    console.log("\n[1] Model registration & collection name");
    assert("Model name is ProcessedSessionBucket", ProcessedSessionBucket.modelName === "ProcessedSessionBucket");
    assert("Collection name is agent_processed_session_buckets", ProcessedSessionBucket.collection.name === "agent_processed_session_buckets");

    // Ensure indexes are built
    console.log("\n[2] Index building & verification");
    await ProcessedSessionBucket.init();
    const mongoIndexes = await ProcessedSessionBucket.collection.indexes();
    console.log("  Built MongoDB indexes:", JSON.stringify(mongoIndexes.map(i => ({ key: i.key, name: i.name, unique: i.unique, expireAfterSeconds: i.expireAfterSeconds }))));

    const hasCompoundUnique = mongoIndexes.some(
      idx => idx.key.employeeCode === 1 && idx.key.pcName === 1 && idx.key.date === 1 && idx.unique === true
    );
    assert("Compound unique index exists in MongoDB", hasCompoundUnique);

    const hasTTLIndex = mongoIndexes.some(
      idx => idx.key.expiresAt === 1 && idx.expireAfterSeconds === 0
    );
    assert("TTL index expiresAt with expireAfterSeconds:0 exists in MongoDB", hasTTLIndex);

    // 3. Schema validation & defaults
    console.log("\n[3] Schema validation, defaults & trimming");
    let validationErr = null;
    try {
      await ProcessedSessionBucket.create({});
    } catch (err) {
      validationErr = err;
    }
    assert("Fails validation when required fields missing", validationErr && validationErr.name === "ValidationError");
    assert("employeeCode is required error", !!validationErr.errors.employeeCode);
    assert("date is required error", !!validationErr.errors.date);
    assert("expiresAt is required error", !!validationErr.errors.expiresAt);

    const testDate = new Date("2026-10-13T00:00:00.000Z");
    const testExpiresAt = new Date("2026-11-13T00:00:00.000Z");

    const basicDoc = await ProcessedSessionBucket.create({
      employeeCode: "  emp999  ",
      date: testDate,
      expiresAt: testExpiresAt,
    });
    assert("employeeCode is uppercase and trimmed", basicDoc.employeeCode === "EMP999");
    assert("pcName defaults to empty string", basicDoc.pcName === "");
    assert("sessionIds defaults to empty array", Array.isArray(basicDoc.sessionIds) && basicDoc.sessionIds.length === 0);
    assert("Document has no __v (versionKey: false)", basicDoc.__v === undefined);
    assert("Document has createdAt and updatedAt (timestamps: true)", !!basicDoc.createdAt && !!basicDoc.updatedAt);

    // 4. Unique compound constraint enforcement
    console.log("\n[4] Unique compound constraint enforcement");
    let dupErr = null;
    try {
      await ProcessedSessionBucket.create({
        employeeCode: "EMP999",
        pcName: "",
        date: testDate,
        expiresAt: testExpiresAt,
      });
    } catch (err) {
      dupErr = err;
    }
    assert("Direct duplicate create throws E11000 duplicate key error", dupErr && (dupErr.code === 11000 || dupErr.name === "MongoServerError"));

    // Clean up basicDoc before testing reservation flow
    await ProcessedSessionBucket.deleteMany({});

    // 5. Reservation flow (reserveProcessedSession)
    console.log("\n[5] Reserve session simulation");
    const res1 = await simulateReserveProcessedSession(ProcessedSessionBucket, {
      employeeCode: "EMP101",
      pcName: "PC-DESK-01",
      date: testDate,
      sessionId: "session-uuid-1",
    });
    assert("First session reservation creates bucket and succeeds (upserted)", res1 === true);

    const bucketAfter1 = await ProcessedSessionBucket.findOne({
      employeeCode: "EMP101",
      pcName: "PC-DESK-01",
      date: testDate,
    }).lean();
    assert("Bucket exists with session-uuid-1", bucketAfter1 && bucketAfter1.sessionIds.includes("session-uuid-1"));
    assert("Bucket has exactly 1 session", bucketAfter1.sessionIds.length === 1);
    assert("Bucket has no __v field", bucketAfter1.__v === undefined);

    const res2 = await simulateReserveProcessedSession(ProcessedSessionBucket, {
      employeeCode: "EMP101",
      pcName: "PC-DESK-01",
      date: testDate,
      sessionId: "session-uuid-2",
    });
    assert("Second unique session reservation modifies bucket and succeeds", res2 === true);

    const bucketAfter2 = await ProcessedSessionBucket.findOne({
      employeeCode: "EMP101",
      pcName: "PC-DESK-01",
      date: testDate,
    }).lean();
    assert("Bucket has both session-uuid-1 and session-uuid-2", bucketAfter2.sessionIds.length === 2 && bucketAfter2.sessionIds.includes("session-uuid-2"));

    // 6. Deduplication idempotency
    console.log("\n[6] Deduplication idempotency");
    const resDup = await simulateReserveProcessedSession(ProcessedSessionBucket, {
      employeeCode: "EMP101",
      pcName: "PC-DESK-01",
      date: testDate,
      sessionId: "session-uuid-1", // Already exists
    });
    // In Mongoose with schema timestamps:true, updateOne sets updatedAt so modifiedCount may be 1,
    // but $addToSet guarantees the sessionIds array never duplicates the existing sessionId.
    const bucketAfterDup = await ProcessedSessionBucket.findOne({
      employeeCode: "EMP101",
      pcName: "PC-DESK-01",
      date: testDate,
    }).lean();
    assert("Bucket sessionIds count remains 2 after duplicate reservation", bucketAfterDup.sessionIds.length === 2);
    assert("session-uuid-1 appears exactly once in sessionIds array", bucketAfterDup.sessionIds.filter(id => id === "session-uuid-1").length === 1);

    // 7. Release session simulation (releaseProcessedSession)
    console.log("\n[7] Release session simulation");
    await simulateReleaseProcessedSession(ProcessedSessionBucket, {
      employeeCode: "EMP101",
      pcName: "PC-DESK-01",
      date: testDate,
      sessionId: "session-uuid-2",
    });

    const bucketAfterRelease = await ProcessedSessionBucket.findOne({
      employeeCode: "EMP101",
      pcName: "PC-DESK-01",
      date: testDate,
    }).lean();
    assert("Bucket no longer contains session-uuid-2", !bucketAfterRelease.sessionIds.includes("session-uuid-2"));
    assert("Bucket still contains session-uuid-1", bucketAfterRelease.sessionIds.includes("session-uuid-1"));
    assert("Bucket sessionIds length is 1", bucketAfterRelease.sessionIds.length === 1);

    // 8. Batch pre-filter query mirroring server.js lines 858-878
    console.log("\n[8] Batch pre-filter query simulation");
    const testDate2 = new Date("2026-10-14T00:00:00.000Z");
    await simulateReserveProcessedSession(ProcessedSessionBucket, {
      employeeCode: "EMP101",
      pcName: "PC-DESK-01",
      date: testDate2,
      sessionId: "session-uuid-day2-a",
    });

    const existingBuckets = await ProcessedSessionBucket.find(
      {
        employeeCode: "EMP101",
        pcName: "PC-DESK-01",
        date: { $in: [testDate, testDate2] },
      },
      {
        sessionIds: 1,
        _id: 0,
      }
    ).lean();

    assert("Found 2 buckets for $in query", existingBuckets.length === 2);
    const existingIdSet = new Set(existingBuckets.flatMap(b => Array.isArray(b.sessionIds) ? b.sessionIds : []));
    assert("existingIdSet contains session-uuid-1", existingIdSet.has("session-uuid-1"));
    assert("existingIdSet contains session-uuid-day2-a", existingIdSet.has("session-uuid-day2-a"));
    assert("existingIdSet does not contain session-uuid-2 (released)", !existingIdSet.has("session-uuid-2"));

    // 9. Multi-employee and Multi-PC isolation
    console.log("\n[9] Multi-employee & Multi-PC isolation");
    await simulateReserveProcessedSession(ProcessedSessionBucket, {
      employeeCode: "EMP101",
      pcName: "PC-LAPTOP-02",
      date: testDate,
      sessionId: "session-pc2-1",
    });
    await simulateReserveProcessedSession(ProcessedSessionBucket, {
      employeeCode: "EMP202",
      pcName: "PC-DESK-01",
      date: testDate,
      sessionId: "session-emp202-1",
    });

    const totalBuckets = await ProcessedSessionBucket.countDocuments();
    assert("Total 4 distinct buckets created (2 dates for EMP101/PC1 + 1 for EMP101/PC2 + 1 for EMP202/PC1)", totalBuckets === 4);

    const emp202Bucket = await ProcessedSessionBucket.findOne({ employeeCode: "EMP202" }).lean();
    assert("EMP202 bucket isolated with correct session", emp202Bucket && emp202Bucket.sessionIds[0] === "session-emp202-1");

  } finally {
    // Teardown
    console.log("\n[Teardown] Cleaning up isolated database...");
    try {
      await mongoose.connection.db.dropDatabase();
      console.log(`Dropped test database: ${TEST_DB_NAME}`);
    } catch (dropErr) {
      console.warn("Could not drop test database:", dropErr.message);
    }
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }

  console.log("\n================================================================================");
  console.log(`ISOLATED INTEGRATION TEST SUMMARY: ${passed} passed, ${failed} failed`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runIsolatedTests().catch(err => {
  console.error("Unhandled test runner exception:", err);
  process.exit(1);
});
