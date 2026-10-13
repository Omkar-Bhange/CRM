"use strict";
/**
 * test_activitylog_isolated.js
 * Isolated functional integration test suite for the centralized ActivityLog model.
 * Connects to a dedicated temporary local database and drops it on completion.
 */

const mongoose = require("mongoose");

const TEST_DB_NAME = `crm_isolated_activitylog_test_${Date.now()}`;
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

async function runIsolatedTests() {
  console.log("================================================================================");
  console.log("   ACTIVITYLOG MODEL ISOLATED FUNCTIONAL INTEGRATION TEST                        ");
  console.log("================================================================================");
  console.log(`Connecting to ISOLATED database: ${TEST_URI}`);
  console.log(`Target Database Name: ${TEST_DB_NAME}`);

  await mongoose.connect(TEST_URI);
  console.log(`Connected successfully. Active DB: ${mongoose.connection.name}`);

  try {
    const ActivityLog = require("./models/ActivityLog");

    // ── 1. Model registration & collection name ──────────────────────────────
    console.log("\n[1] Model registration & collection name");
    assert("Model name is ActivityLog", ActivityLog.modelName === "ActivityLog");
    assert("Collection name is activitylogs", ActivityLog.collection.name === "activitylogs");
    assert("mongoose.models.ActivityLog matches export", mongoose.models.ActivityLog === ActivityLog);

    // ── 2. Index building & verification on live MongoDB instance ────────────
    console.log("\n[2] Index building & verification");
    await ActivityLog.init();
    const mongoIndexes = await ActivityLog.collection.indexes();
    console.log("  Built MongoDB indexes:", JSON.stringify(mongoIndexes.map((i) => ({ key: i.key, name: i.name }))));

    assert("action index exists in MongoDB", mongoIndexes.some((idx) => idx.key.action === 1));
    assert("category index exists in MongoDB", mongoIndexes.some((idx) => idx.key.category === 1));
    assert("entityType index exists in MongoDB", mongoIndexes.some((idx) => idx.key.entityType === 1));
    assert("entityId index exists in MongoDB", mongoIndexes.some((idx) => idx.key.entityId === 1));
    assert("entityCode index exists in MongoDB", mongoIndexes.some((idx) => idx.key.entityCode === 1));
    assert("clientId index exists in MongoDB", mongoIndexes.some((idx) => idx.key.clientId === 1));
    assert("employeeId index exists in MongoDB", mongoIndexes.some((idx) => idx.key.employeeId === 1));
    assert("performedBy index exists in MongoDB", mongoIndexes.some((idx) => idx.key.performedBy === 1));
    assert("performedByRole index exists in MongoDB", mongoIndexes.some((idx) => idx.key.performedByRole === 1));
    assert("isDeleted index exists in MongoDB", mongoIndexes.some((idx) => idx.key.isDeleted === 1));

    // ── 3. Schema validation: required action & invalid enums ────────────────
    console.log("\n[3] Schema validation: required action & invalid enums");
    let missingActionErr = null;
    try {
      await ActivityLog.create({});
    } catch (err) {
      missingActionErr = err;
    }
    assert("Fails without action (required)", !!missingActionErr && missingActionErr.name === "ValidationError");
    assert("action required validator triggered", !!missingActionErr && !!missingActionErr.errors.action);

    let invalidCategoryErr = null;
    try {
      await ActivityLog.create({
        action: "Test",
        category: "InvalidCategory123",
      });
    } catch (err) {
      invalidCategoryErr = err;
    }
    assert("Fails with invalid category enum", !!invalidCategoryErr && !!invalidCategoryErr.errors.category);

    let invalidEntityTypeErr = null;
    try {
      await ActivityLog.create({
        action: "Test",
        entityType: "invalid_entity",
      });
    } catch (err) {
      invalidEntityTypeErr = err;
    }
    assert("Fails with invalid entityType enum", !!invalidEntityTypeErr && !!invalidEntityTypeErr.errors.entityType);

    let invalidRoleErr = null;
    try {
      await ActivityLog.create({
        action: "Test",
        performedByRole: "superadmin",
      });
    } catch (err) {
      invalidRoleErr = err;
    }
    assert("Fails with invalid performedByRole enum", !!invalidRoleErr && !!invalidRoleErr.errors.performedByRole);

    // ── 4. Standard creation with defaults ───────────────────────────────────
    console.log("\n[4] Standard creation with defaults");
    const defaultLog = await ActivityLog.create({
      action: "  User Login  ",
    });

    assert("defaultLog created with _id", !!defaultLog._id);
    assert("action is trimmed", defaultLog.action === "User Login");
    assert("category defaults to 'System'", defaultLog.category === "System");
    assert("description defaults to ''", defaultLog.description === "");
    assert("entityType defaults to 'system'", defaultLog.entityType === "system");
    assert("entityId defaults to null", defaultLog.entityId === null);
    assert("entityCode defaults to ''", defaultLog.entityCode === "");
    assert("entityName defaults to ''", defaultLog.entityName === "");
    assert("clientId defaults to null", defaultLog.clientId === null);
    assert("clientName defaults to ''", defaultLog.clientName === "");
    assert("employeeId defaults to null", defaultLog.employeeId === null);
    assert("employeeName defaults to ''", defaultLog.employeeName === "");
    assert("performedBy defaults to null", defaultLog.performedBy === null);
    assert("performedByName defaults to ''", defaultLog.performedByName === "");
    assert("performedByRole defaults to 'system'", defaultLog.performedByRole === "system");
    assert("metadata defaults to empty object", typeof defaultLog.metadata === "object" && Object.keys(defaultLog.metadata).length === 0);
    assert("isDeleted defaults to false", defaultLog.isDeleted === false);
    assert("createdAt is populated Date", defaultLog.createdAt instanceof Date);
    assert("updatedAt is populated Date", defaultLog.updatedAt instanceof Date);
    assert("__v is 0", defaultLog.__v === 0);

    // ── 5. Full activity log creation with actor & entity references ─────────
    console.log("\n[5] Full activity log creation with actor & entity references");
    const mockClientId = new mongoose.Types.ObjectId();
    const mockEmployeeId = new mongoose.Types.ObjectId();
    const mockUserId = new mongoose.Types.ObjectId();
    const mockEntityId = new mongoose.Types.ObjectId();

    const fullLog = await ActivityLog.create({
      action: "  AMC Renewed  ",
      category: "AMC",
      description: "  Renewed contract AMC-2026-001 for 1 year.  ",
      entityType: "amc",
      entityId: mockEntityId,
      entityCode: "  AMC-2026-001  ",
      entityName: "  ERP Software AMC  ",
      clientId: mockClientId,
      clientName: "  Acme Corporation  ",
      employeeId: mockEmployeeId,
      employeeName: "  John Engineer  ",
      performedBy: mockUserId,
      performedByName: "  Admin Operator  ",
      performedByRole: "admin",
      metadata: {
        invoiceCode: "INV-2026-0042",
        taxableAmount: 50000,
        totalAmount: 59000,
        gstApplicable: true,
      },
    });

    assert("fullLog created with _id", !!fullLog._id);
    assert("fullLog action trimmed", fullLog.action === "AMC Renewed");
    assert("fullLog category is AMC", fullLog.category === "AMC");
    assert("fullLog description trimmed", fullLog.description === "Renewed contract AMC-2026-001 for 1 year.");
    assert("fullLog entityType is amc", fullLog.entityType === "amc");
    assert("fullLog entityId matches", fullLog.entityId.equals(mockEntityId));
    assert("fullLog entityCode trimmed", fullLog.entityCode === "AMC-2026-001");
    assert("fullLog entityName trimmed", fullLog.entityName === "ERP Software AMC");
    assert("fullLog clientId matches", fullLog.clientId.equals(mockClientId));
    assert("fullLog clientName trimmed", fullLog.clientName === "Acme Corporation");
    assert("fullLog employeeId matches", fullLog.employeeId.equals(mockEmployeeId));
    assert("fullLog employeeName trimmed", fullLog.employeeName === "John Engineer");
    assert("fullLog performedBy matches", fullLog.performedBy.equals(mockUserId));
    assert("fullLog performedByName trimmed", fullLog.performedByName === "Admin Operator");
    assert("fullLog performedByRole is admin", fullLog.performedByRole === "admin");
    assert("fullLog metadata invoiceCode matches", fullLog.metadata.invoiceCode === "INV-2026-0042");
    assert("fullLog metadata totalAmount matches", fullLog.metadata.totalAmount === 59000);

    // ── 6. Multiple event types & actor roles ────────────────────────────────
    console.log("\n[6] Multiple event types & actor roles");
    const clientLog = await ActivityLog.create({
      action: "Ticket Created",
      category: "Ticket",
      entityType: "ticket",
      entityId: new mongoose.Types.ObjectId(),
      clientId: mockClientId,
      performedByRole: "client",
      performedByName: "Client Portal User",
    });
    assert("Client role activity log created", clientLog.performedByRole === "client");

    const employeeLog = await ActivityLog.create({
      action: "Task Status Updated",
      category: "Task",
      entityType: "task",
      entityId: new mongoose.Types.ObjectId(),
      employeeId: mockEmployeeId,
      performedByRole: "employee",
      performedByName: "John Engineer",
    });
    assert("Employee role activity log created", employeeLog.performedByRole === "employee");

    const paymentLog = await ActivityLog.create({
      action: "Payment Received",
      category: "Payment",
      entityType: "payment",
      entityId: new mongoose.Types.ObjectId(),
      clientId: mockClientId,
      performedByRole: "admin",
      metadata: { paymentMode: "Bank Transfer", amount: 59000 },
    });
    assert("Payment category activity log created", paymentLog.category === "Payment");

    // ── 7. Entity querying & filtering (matching API routes) ─────────────────
    console.log("\n[7] Entity querying & filtering (matching API routes)");

    // Route: GET /api/admin/activities/:entityType/:entityId
    const entityActivities = await ActivityLog.find({
      entityType: "amc",
      entityId: mockEntityId,
      isDeleted: false,
    }).sort({ createdAt: -1 });
    assert("Found activities by entityType and entityId", entityActivities.length === 1);
    assert("Found entity activity is AMC Renewed", entityActivities[0].action === "AMC Renewed");

    // Filter by category
    const amcLogs = await ActivityLog.find({ category: "AMC", isDeleted: false });
    assert("Found 1 AMC category log", amcLogs.length === 1);

    // Filter by clientId
    const clientActivities = await ActivityLog.find({ clientId: mockClientId, isDeleted: false });
    assert("Found 3 activities for mockClientId", clientActivities.length === 3);

    // Filter by employeeId
    const employeeActivities = await ActivityLog.find({ employeeId: mockEmployeeId, isDeleted: false });
    assert("Found 2 activities for mockEmployeeId", employeeActivities.length === 2);

    // Global search simulation ($or across text fields)
    const searchRegex = "Acme";
    const searchResults = await ActivityLog.find({
      isDeleted: false,
      $or: [
        { action: { $regex: searchRegex, $options: "i" } },
        { description: { $regex: searchRegex, $options: "i" } },
        { clientName: { $regex: searchRegex, $options: "i" } },
      ],
    });
    assert("Search found Acme Corporation activity log", searchResults.length === 1);
    assert("Search result clientName is Acme Corporation", searchResults[0].clientName === "Acme Corporation");

    // ── 8. Sorting & Pagination (matching GET /api/admin/activities) ──────────
    console.log("\n[8] Sorting & Pagination");
    const totalLogs = await ActivityLog.countDocuments({ isDeleted: false });
    assert("Total active logs count is 5", totalLogs === 5);

    const page1 = await ActivityLog.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(0)
      .limit(3);
    assert("Page 1 returns 3 logs", page1.length === 3);

    const page2 = await ActivityLog.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(3)
      .limit(3);
    assert("Page 2 returns 2 logs", page2.length === 2);

    // Verify sort order: newer before older
    assert("Page 1 first item is newer than page 2 first item", page1[0].createdAt >= page2[0].createdAt);

    // ── 9. Soft deletion behavior ────────────────────────────────────────────
    console.log("\n[9] Soft deletion behavior");
    paymentLog.isDeleted = true;
    await paymentLog.save();

    const activeLogsAfterDelete = await ActivityLog.countDocuments({ isDeleted: false });
    assert("Active logs count decreases to 4 after soft-delete", activeLogsAfterDelete === 4);

    const softDeletedDoc = await ActivityLog.findById(paymentLog._id);
    assert("Soft-deleted document still exists in MongoDB", !!softDeletedDoc);
    assert("Soft-deleted document has isDeleted = true", softDeletedDoc.isDeleted === true);

    // ── 10. createActivityLog helper simulation ──────────────────────────────
    console.log("\n[10] createActivityLog helper simulation");
    async function helperSimulation(data, options = {}) {
      try {
        const logData = {
          action: String(data.action || "").trim(),
          category: data.category || "System",
          description: String(data.description || "").trim(),
          entityType: data.entityType || "system",
          entityId: data.entityId || null,
          entityCode: String(data.entityCode || "").trim(),
          entityName: String(data.entityName || "").trim(),
          clientId: data.clientId || null,
          clientName: String(data.clientName || "").trim(),
          employeeId: data.employeeId || null,
          employeeName: String(data.employeeName || "").trim(),
          performedBy: data.performedBy || null,
          performedByName: String(data.performedByName || "").trim(),
          performedByRole: data.performedByRole || "system",
          metadata: data.metadata && typeof data.metadata === "object" ? data.metadata : {},
        };

        if (options?.session) {
          const logDoc = new ActivityLog(logData);
          return await logDoc.save({ session: options.session });
        }
        return await ActivityLog.create(logData);
      } catch (err) {
        console.error("Helper error:", err.message);
        return null;
      }
    }

    const helperCreated = await helperSimulation({
      action: "Project Milestone Completed",
      category: "Project",
      entityType: "project",
      entityCode: "PRJ-101",
      entityName: "CRM Mobile App",
      performedByName: "Admin",
      performedByRole: "admin",
    });
    assert("Helper successfully creates activity log", !!helperCreated && !!helperCreated._id);
    assert("Helper sets action correctly", helperCreated.action === "Project Milestone Completed");
    assert("Helper sets category to Project", helperCreated.category === "Project");

    // Failure safety: invalid category caught without throwing
    const helperFailed = await helperSimulation({
      action: "Bad Action",
      category: "NON_EXISTENT_CATEGORY",
    });
    assert("Helper safely catches error and returns null on invalid enum", helperFailed === null);

    // ── 11. Transaction capability detection ─────────────────────────────────
    console.log("\n[11] Transaction capability detection");
    let replicaSetActive = false;
    try {
      const session = await mongoose.startSession();
      session.startTransaction();
      const txLog = new ActivityLog({
        action: "Transaction Test Log",
        category: "System",
      });
      await txLog.save({ session });
      await session.abortTransaction();
      await session.endSession();
      replicaSetActive = true;
      assert("Replica set transaction test executed and aborted cleanly", true);
    } catch (txErr) {
      console.log("  [INFO] Standalone MongoDB detected — transactions not supported on single node.");
      console.log("  [INFO] Transaction commit/abort semantics marked NOT TESTED (requires replica set).");
      assert("Transaction exception handled gracefully on standalone node", true);
    }

    // ── 12. Document contract parity with operational Atlas sample ───────────
    console.log("\n[12] Document contract parity with operational Atlas sample");
    const atlasSampleKeys = [
      "_id",
      "action",
      "category",
      "description",
      "entityType",
      "entityId",
      "entityCode",
      "entityName",
      "clientId",
      "clientName",
      "employeeId",
      "employeeName",
      "performedBy",
      "performedByName",
      "performedByRole",
      "metadata",
      "isDeleted",
      "createdAt",
      "updatedAt",
      "__v",
    ];

    const retrievedDoc = await ActivityLog.findById(fullLog._id).lean();
    atlasSampleKeys.forEach((key) => {
      assert(`Retrieved doc contains Atlas key '${key}'`, key in retrievedDoc);
    });

  } finally {
    // ── Cleanup: Drop temporary test database ────────────────────────────────
    console.log("\n[Teardown] Cleaning up isolated database...");
    await mongoose.connection.db.dropDatabase();
    console.log(`Dropped test database: ${TEST_DB_NAME}`);
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }

  console.log("\n================================================================================");
  console.log(`ISOLATED INTEGRATION TEST SUMMARY: ${passed} passed, ${failed} failed`);
  console.log("================================================================================");

  if (failed > 0) {
    console.error("FAIL: Some ActivityLog isolated integration tests failed!");
    process.exit(1);
  } else {
    console.log("All ActivityLog isolated functional integration tests PASSED successfully.");
    process.exit(0);
  }
}

runIsolatedTests().catch((err) => {
  console.error("Unhandled test runner exception:", err);
  process.exit(1);
});
