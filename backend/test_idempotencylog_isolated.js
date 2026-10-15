"use strict";

const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "node_modules");
require("module").Module._initPaths();

const mongoose = require("mongoose");
const crypto = require("crypto");

const TEST_DB_URI = `mongodb://127.0.0.1:27017/crm_test_idempotencylog_${Date.now()}`;

async function runIdempotencyLogIsolatedTests() {
  console.log("=== ISOLATED IDEMPOTENCYLOG MODEL TEST SUITE ===");
  console.log("Connecting to isolated local test database:", TEST_DB_URI);

  await mongoose.connect(TEST_DB_URI);
  console.log("Connected to isolated test database successfully.\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      passed++;
      console.log(`  ✓ ${message}`);
    } else {
      failed++;
      console.error(`  ✗ FAIL: ${message}`);
    }
  }

  const IdempotencyLog = require("./models/IdempotencyLog");

  try {
    // Ensure indexes are built
    await IdempotencyLog.init();

    // ── Test 1: Identity & Collection Name ────────────────────────────────────
    console.log("--- 1. Model & Collection Identity ---");
    assert(IdempotencyLog.modelName === "IdempotencyLog", "Model name is 'IdempotencyLog'");
    assert(IdempotencyLog.collection.name === "idempotencylogs", "Physical collection is 'idempotencylogs'");
    assert(IdempotencyLog.schema.options.timestamps === true, "Timestamps enabled in schema options");

    // ── Test 2: Successful Document Creation with Required Fields ─────────────
    console.log("\n--- 2. Valid Document Creation ---");
    const samplePayloadHash = crypto.createHash("sha256").update(JSON.stringify({ amount: 5000 })).digest("hex");
    const validLog = await IdempotencyLog.create({
      idempotencyKey: "idemp_test_key_001",
      endpoint: "/api/admin/amc/payment",
      payloadHash: samplePayloadHash,
    });
    assert(validLog._id != null, "Valid IdempotencyLog persisted with ObjectId");
    assert(validLog.idempotencyKey === "idemp_test_key_001", "idempotencyKey persisted accurately");
    assert(validLog.endpoint === "/api/admin/amc/payment", "endpoint persisted accurately");
    assert(validLog.payloadHash === samplePayloadHash, "payloadHash persisted accurately");

    // ── Test 3: Default Values ────────────────────────────────────────────────
    console.log("\n--- 3. Default Values ---");
    assert(validLog.status === "IN_PROGRESS", "Default status is 'IN_PROGRESS'");
    assert(validLog.responseStatus === 200, "Default responseStatus is 200");
    assert(validLog.responseBody === null, "Default responseBody is null");
    assert(validLog.createdAt instanceof Date, "createdAt is an instance of Date");
    assert(validLog.updatedAt instanceof Date, "updatedAt is an instance of Date");

    // ── Test 4: Enum Validation on Status ─────────────────────────────────────
    console.log("\n--- 4. Status Enum Validation ---");
    const logCompleted = await IdempotencyLog.create({
      idempotencyKey: "idemp_test_key_completed",
      endpoint: "/api/admin/product-sales/payment",
      payloadHash: samplePayloadHash,
      status: "COMPLETED",
    });
    assert(logCompleted.status === "COMPLETED", "Accepts status 'COMPLETED'");

    const logFailed = await IdempotencyLog.create({
      idempotencyKey: "idemp_test_key_failed",
      endpoint: "/api/admin/amc/contract/renew",
      payloadHash: samplePayloadHash,
      status: "FAILED",
    });
    assert(logFailed.status === "FAILED", "Accepts status 'FAILED'");

    let invalidStatusError = null;
    try {
      await IdempotencyLog.create({
        idempotencyKey: "idemp_test_key_invalid_enum",
        endpoint: "/api/admin/amc/payment",
        payloadHash: samplePayloadHash,
        status: "PENDING", // Invalid enum
      });
    } catch (err) {
      invalidStatusError = err;
    }
    assert(invalidStatusError != null && invalidStatusError.name === "ValidationError", "Rejects invalid status enum 'PENDING'");

    // ── Test 5: Required Fields Validation ────────────────────────────────────
    console.log("\n--- 5. Required Field Constraints ---");
    let missingKeyError = null;
    try {
      await IdempotencyLog.create({
        endpoint: "/api/admin/amc/payment",
        payloadHash: samplePayloadHash,
      });
    } catch (err) {
      missingKeyError = err;
    }
    assert(missingKeyError != null && missingKeyError.errors.idempotencyKey != null, "idempotencyKey is strictly required");

    let missingEndpointError = null;
    try {
      await IdempotencyLog.create({
        idempotencyKey: "idemp_missing_endpoint",
        payloadHash: samplePayloadHash,
      });
    } catch (err) {
      missingEndpointError = err;
    }
    assert(missingEndpointError != null && missingEndpointError.errors.endpoint != null, "endpoint is strictly required");

    let missingHashError = null;
    try {
      await IdempotencyLog.create({
        idempotencyKey: "idemp_missing_hash",
        endpoint: "/api/admin/amc/payment",
      });
    } catch (err) {
      missingHashError = err;
    }
    assert(missingHashError != null && missingHashError.errors.payloadHash != null, "payloadHash is strictly required");

    // ── Test 6: String Trimming Behavior ──────────────────────────────────────
    console.log("\n--- 6. String Trimming ---");
    const trimmedLog = await IdempotencyLog.create({
      idempotencyKey: "  idemp_trimmed_key_002  ",
      endpoint: "  /api/admin/amc/payment  ",
      payloadHash: "  hash_trimmed_123  ",
    });
    assert(trimmedLog.idempotencyKey === "idemp_trimmed_key_002", "idempotencyKey is trimmed");
    assert(trimmedLog.endpoint === "/api/admin/amc/payment", "endpoint is trimmed");
    assert(trimmedLog.payloadHash === "hash_trimmed_123", "payloadHash is trimmed");

    // ── Test 7: Unique Index Enforcement (Duplicate Key E11000) ───────────────
    console.log("\n--- 7. Unique Index Enforcement ---");
    let duplicateKeyError = null;
    try {
      await IdempotencyLog.create({
        idempotencyKey: "idemp_test_key_001", // Duplicate of Test 2
        endpoint: "/api/admin/amc/payment",
        payloadHash: "different_hash_999",
      });
    } catch (err) {
      duplicateKeyError = err;
    }
    assert(duplicateKeyError != null && duplicateKeyError.code === 11000, "Duplicate idempotencyKey rejected by unique index (E11000)");

    // ── Test 8: Complex Response Body Payload Preservation ────────────────────
    console.log("\n--- 8. Complex Response Body Preservation ---");
    const complexResponse = {
      success: true,
      message: "Payment recorded successfully. The invoice is now fully paid.",
      data: {
        payment: {
          id: new mongoose.Types.ObjectId().toString(),
          paymentCode: "AMC-PAY-2026-0001",
          amount: 59000,
          mode: "Bank Transfer",
          referenceNo: "NEFT-12345678",
        },
        invoice: {
          invoiceCode: "INV-2026-0001",
          totalAmount: 59000,
          paidAmount: 59000,
          pendingAmount: 0,
          paymentStatus: "Paid",
        },
        contract: {
          contractCode: "AMC-2026-0001",
          status: "Paid",
          auditMetadata: { tags: ["vip", "annual"], rate: 18.5 },
        },
      },
    };

    const logWithBody = await IdempotencyLog.create({
      idempotencyKey: "idemp_complex_body_key",
      endpoint: "/api/admin/amc/payment",
      payloadHash: samplePayloadHash,
      status: "COMPLETED",
      responseStatus: 201,
      responseBody: complexResponse,
    });

    const retrievedLog = await IdempotencyLog.findById(logWithBody._id);
    assert(retrievedLog.responseStatus === 201, "responseStatus 201 preserved");
    assert(retrievedLog.responseBody.success === true, "responseBody.success preserved");
    assert(retrievedLog.responseBody.data.payment.paymentCode === "AMC-PAY-2026-0001", "responseBody deep paymentCode preserved");
    assert(retrievedLog.responseBody.data.invoice.paymentStatus === "Paid", "responseBody deep invoice paymentStatus preserved");
    assert(retrievedLog.responseBody.data.contract.auditMetadata.rate === 18.5, "responseBody deep nested float rate preserved");

    // ── Test 9: Optional contractId and entityId Linking ──────────────────────
    console.log("\n--- 9. Entity References (contractId, entityId) ---");
    const testContractId = new mongoose.Types.ObjectId();
    const testEntityId = new mongoose.Types.ObjectId();

    const linkedLog = await IdempotencyLog.create({
      idempotencyKey: "idemp_linked_entities",
      endpoint: "/api/admin/amc/contract/renew",
      contractId: testContractId,
      entityId: testEntityId,
      payloadHash: samplePayloadHash,
      status: "COMPLETED",
    });

    assert(linkedLog.contractId.equals(testContractId), "contractId ObjectId linked accurately");
    assert(linkedLog.entityId.equals(testEntityId), "entityId ObjectId linked accurately");

    const foundByContract = await IdempotencyLog.findOne({ contractId: testContractId });
    assert(foundByContract != null && foundByContract.idempotencyKey === "idemp_linked_entities", "Lookup by contractId succeeds");

    const foundByEntity = await IdempotencyLog.findOne({ entityId: testEntityId });
    assert(foundByEntity != null && foundByEntity.idempotencyKey === "idemp_linked_entities", "Lookup by entityId succeeds");

    // ── Test 10: Status Transitions & Updates ─────────────────────────────────
    console.log("\n--- 10. Status Transitions & Updates ---");
    const inProgressLog = await IdempotencyLog.create({
      idempotencyKey: "idemp_transition_key",
      endpoint: "/api/admin/amc/payment",
      payloadHash: samplePayloadHash,
      status: "IN_PROGRESS",
    });

    const updatedLog = await IdempotencyLog.findOneAndUpdate(
      { idempotencyKey: "idemp_transition_key" },
      {
        $set: {
          status: "COMPLETED",
          responseStatus: 200,
          responseBody: { message: "Transition completed" },
        },
      },
      { new: true }
    );
    assert(updatedLog.status === "COMPLETED", "Transition from IN_PROGRESS to COMPLETED succeeds");
    assert(updatedLog.responseBody.message === "Transition completed", "Updated responseBody populated");

    // ── Test 11: TTL Index Verification ───────────────────────────────────────
    console.log("\n--- 11. TTL Index Verification ---");
    const indexes = await IdempotencyLog.collection.indexes();
    const ttlIndex = indexes.find(idx => idx.key.createdAt === 1);
    assert(ttlIndex != null, "TTL index exists on createdAt");
    assert(ttlIndex.expireAfterSeconds === 604800, "expireAfterSeconds is 604,800 (7 days)");

    // ── Test 12: Historical Atlas Telemetry Hydration ─────────────────────────
    console.log("\n--- 12. Historical Atlas Document Hydration ---");
    const atlasSample = {
      idempotencyKey: "idemp_1791529973492_1",
      endpoint: "/api/admin/amc/contract/:id/renew",
      payloadHash: "6cbf932c5890e0c9044d081bc1f22cfa6701bb053531fbf52dc0db721cb4450f",
      status: "COMPLETED",
      responseStatus: 201,
      responseBody: { success: true, message: "Contract renewed" },
      createdAt: new Date("2026-10-09T07:12:54.000Z"),
      updatedAt: new Date("2026-10-09T07:12:54.000Z"),
    };

    const hydratedDoc = new IdempotencyLog(atlasSample);
    const validationErr = hydratedDoc.validateSync();
    assert(validationErr == null, "Atlas sample document validates without schema error");
    assert(hydratedDoc.idempotencyKey === "idemp_1791529973492_1", "Atlas document idempotencyKey matches");
    assert(hydratedDoc.endpoint === "/api/admin/amc/contract/:id/renew", "Atlas document endpoint matches");
    assert(hydratedDoc.status === "COMPLETED", "Atlas document status matches");
    assert(hydratedDoc.responseStatus === 201, "Atlas document responseStatus matches");

    // ── Test 13: Import-Order Independence & Mongoose Model Cache ─────────────
    console.log("\n--- 13. Import-Order Independence ---");
    assert(mongoose.models.IdempotencyLog === IdempotencyLog, "Cached model matches canonical export");

  } finally {
    console.log("\n--- Cleanup ---");
    try {
      await mongoose.connection.dropDatabase();
      console.log("Dropped isolated test database successfully.");
    } catch (e) {
      console.error("Cleanup warning:", e.message);
    }
    await mongoose.disconnect();
    console.log("Disconnected from isolated test database.\n");
  }

  console.log("======================================================");
  console.log(`TOTAL ISOLATED IDEMPOTENCYLOG CHECKS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log("======================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runIdempotencyLogIsolatedTests().catch((err) => {
  console.error("Fatal error in isolated test suite:", err);
  process.exit(1);
});
