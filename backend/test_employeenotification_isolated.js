"use strict";
/**
 * test_employeenotification_isolated.js
 * Isolated functional integration test suite for EmployeeNotification model.
 * Connects to a dedicated temporary local database and drops it on completion.
 */

const mongoose = require("mongoose");

const TEST_DB_NAME = `crm_isolated_notif_test_${Date.now()}`;
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
  console.log("   EMPLOYEENOTIFICATION ISOLATED FUNCTIONAL INTEGRATION TEST                     ");
  console.log("================================================================================");
  console.log(`Connecting to ISOLATED database: ${TEST_URI}`);
  console.log(`Target Database Name: ${TEST_DB_NAME}`);

  await mongoose.connect(TEST_URI);
  console.log(`Connected successfully. Active DB: ${mongoose.connection.name}`);

  try {
    const EmployeeNotification = require("./models/EmployeeNotification");

    // Ensure indexes are built
    await EmployeeNotification.init();

    const emp1Id = new mongoose.Types.ObjectId();
    const emp2Id = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();

    // ── 1. Create valid notification ──────────────────────────────────────────
    console.log("\n[1] Create valid notification");
    const notif1 = await EmployeeNotification.create({
      employeeId: emp1Id,
      userId: userId,
      type: "TASK_ASSIGNED",
      title: "New Task: Client Portal Security Audit",
      message: "You have been assigned to audit the client portal endpoints.",
      priority: "high",
      entityType: "task",
      entityId: new mongoose.Types.ObjectId(),
      entityCode: "TSK-101",
      navigationTarget: "tasks",
      dedupKey: "task_assigned_TSK-101",
      metadata: { source: "admin_dispatch", department: "Engineering" },
    });

    assert("Notification created with _id", !!notif1._id);
    assert("employeeId matches", notif1.employeeId.toString() === emp1Id.toString());
    assert("userId matches", notif1.userId.toString() === userId.toString());
    assert("type matches", notif1.type === "TASK_ASSIGNED");
    assert("priority matches", notif1.priority === "high");
    assert("entityType matches", notif1.entityType === "task");
    assert("navigationTarget matches", notif1.navigationTarget === "tasks");
    assert("isRead defaults to false", notif1.isRead === false);
    assert("readAt defaults to null", notif1.readAt === null);
    assert("timestamps createdAt is present", !!notif1.createdAt);
    assert("metadata is populated", notif1.metadata.department === "Engineering");

    // ── 2. Create notification with defaults ──────────────────────────────────
    console.log("\n[2] Create notification with defaults");
    const notif2 = await EmployeeNotification.create({
      employeeId: emp1Id,
      type: "SHIFT_REMINDER",
      title: "Shift starts in 30 minutes",
      message: "Please remember to punch in on time.",
    });

    assert("priority defaults to 'normal'", notif2.priority === "normal");
    assert("entityType defaults to 'other'", notif2.entityType === "other");
    assert("entityId defaults to null", notif2.entityId === null);
    assert("entityCode defaults to empty string", notif2.entityCode === "");
    assert("navigationTarget defaults to 'dashboard'", notif2.navigationTarget === "dashboard");
    assert("dedupKey defaults to empty string", notif2.dedupKey === "");
    assert("userId defaults to null", notif2.userId === null);

    // ── 3. Validation: missing required fields ─────────────────────────────────
    console.log("\n[3] Validation: missing required fields");
    let caughtRequired = false;
    try {
      await EmployeeNotification.create({
        type: "TASK_ASSIGNED",
        title: "Missing Employee",
        message: "No employeeId provided",
      });
    } catch (err) {
      caughtRequired = true;
      assert("Rejects missing employeeId", err.name === "ValidationError" && !!err.errors.employeeId);
    }
    assert("Required employeeId caught", caughtRequired);

    let caughtTitle = false;
    try {
      await EmployeeNotification.create({
        employeeId: emp1Id,
        type: "TASK_ASSIGNED",
        message: "No title provided",
      });
    } catch (err) {
      caughtTitle = true;
      assert("Rejects missing title", err.name === "ValidationError" && !!err.errors.title);
    }
    assert("Required title caught", caughtTitle);

    // ── 4. Validation: invalid enum values ─────────────────────────────────────
    console.log("\n[4] Validation: invalid enum values");
    let caughtBadType = false;
    try {
      await EmployeeNotification.create({
        employeeId: emp1Id,
        type: "INVALID_EVENT_TYPE",
        title: "Test",
        message: "Test",
      });
    } catch (err) {
      caughtBadType = true;
      assert("Rejects invalid type enum", err.name === "ValidationError" && !!err.errors.type);
    }
    assert("Invalid type enum caught", caughtBadType);

    let caughtBadPriority = false;
    try {
      await EmployeeNotification.create({
        employeeId: emp1Id,
        type: "SYSTEM_ANNOUNCEMENT",
        title: "Test",
        message: "Test",
        priority: "critical_emergency",
      });
    } catch (err) {
      caughtBadPriority = true;
      assert("Rejects invalid priority enum", err.name === "ValidationError" && !!err.errors.priority);
    }
    assert("Invalid priority enum caught", caughtBadPriority);

    // ── 5. Compound unique index: { employeeId: 1, dedupKey: 1 } ──────────────
    console.log("\n[5] Compound unique index: { employeeId: 1, dedupKey: 1 }");
    let caughtDup = false;
    try {
      await EmployeeNotification.create({
        employeeId: emp1Id,
        type: "TASK_ASSIGNED",
        title: "Duplicate Task Notification",
        message: "Duplicate message",
        dedupKey: "task_assigned_TSK-101", // same dedupKey as notif1
      });
    } catch (err) {
      caughtDup = true;
      assert("Duplicate (emp1Id + dedupKey) rejected with Mongo duplicate key error (code 11000)", err.code === 11000);
    }
    assert("Duplicate key caught", caughtDup);

    // Same dedupKey for emp2Id MUST SUCCEED (compound per employee)
    const notifEmp2 = await EmployeeNotification.create({
      employeeId: emp2Id,
      type: "TASK_ASSIGNED",
      title: "Task Notification for Emp 2",
      message: "Assigned to Emp 2",
      dedupKey: "task_assigned_TSK-101",
    });
    assert("Same dedupKey for different employeeId succeeds", !!notifEmp2._id);

    // ── 6. Query unread and mark as read ──────────────────────────────────────
    console.log("\n[6] Query unread and mark as read");
    const unreadBefore = await EmployeeNotification.countDocuments({ employeeId: emp1Id, isRead: false });
    assert("Unread count before mark is 2", unreadBefore === 2);

    const now = new Date();
    await EmployeeNotification.updateOne(
      { _id: notif1._id },
      { $set: { isRead: true, readAt: now } }
    );

    const updatedNotif1 = await EmployeeNotification.findById(notif1._id);
    assert("notif1 isRead is true", updatedNotif1.isRead === true);
    assert("notif1 readAt is set", updatedNotif1.readAt instanceof Date);

    const unreadAfterOne = await EmployeeNotification.countDocuments({ employeeId: emp1Id, isRead: false });
    assert("Unread count after marking one is 1", unreadAfterOne === 1);

    // ── 7. Mark all read (POST /api/employee/notifications/mark-all-read) ───────
    console.log("\n[7] Mark all read");
    await EmployeeNotification.updateMany(
      { employeeId: emp1Id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    const unreadAfterAll = await EmployeeNotification.countDocuments({ employeeId: emp1Id, isRead: false });
    assert("Unread count after mark-all-read is 0", unreadAfterAll === 0);

    // ── 8. Delete operations ──────────────────────────────────────────────────
    console.log("\n[8] Delete operations");
    // Clear read for emp1Id
    const deleteResult = await EmployeeNotification.deleteMany({ employeeId: emp1Id, isRead: true });
    assert("deleteMany deleted 2 read notifications", deleteResult.deletedCount === 2);

    const remainingEmp1 = await EmployeeNotification.countDocuments({ employeeId: emp1Id });
    assert("0 notifications remaining for emp1", remainingEmp1 === 0);

    const remainingEmp2 = await EmployeeNotification.countDocuments({ employeeId: emp2Id });
    assert("emp2 notification remains untouched", remainingEmp2 === 1);

  } finally {
    console.log("\n[9] Cleanup temporary test database");
    try {
      await mongoose.connection.dropDatabase();
      console.log(`Dropped test database: ${TEST_DB_NAME}`);
    } catch (err) {
      console.error(`Failed to drop database: ${err.message}`);
    }
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }

  console.log("\n================================================================================");
  console.log(`FUNCTIONAL TEST SUMMARY: ${passed} passed, ${failed} failed`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("All EmployeeNotification functional tests PASSED successfully.");
    process.exit(0);
  }
}

runIsolatedTests().catch(err => {
  console.error("Unhandled test runner exception:", err);
  process.exit(1);
});
