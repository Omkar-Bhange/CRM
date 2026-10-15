"use strict";
/**
 * test_systemsettings_isolated.js
 * Functional integration test for SystemSettings model extraction.
 * Runs against a dedicated, isolated local database to prevent any
 * operational database writes.
 */

const mongoose = require("mongoose");
const path = require("path");

const TEST_DB_NAME = `crm_isolated_settings_test_${Date.now()}`;
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

async function runSettingsFunctionalTests() {
  console.log("================================================================================");
  console.log("   SYSTEMSETTINGS ISOLATED FUNCTIONAL INTEGRATION TEST                          ");
  console.log("================================================================================");
  console.log(`Connecting to ISOLATED database: ${TEST_URI}`);
  console.log(`Target Database Name: ${TEST_DB_NAME}`);

  await mongoose.connect(TEST_URI);
  console.log(`Connected successfully. Active DB: ${mongoose.connection.name}`);

  try {
    const SystemSettings = require("./models/SystemSettings");
    const settingsModule = require("./settings");

    // Ensure indexes are built
    await SystemSettings.init();

    // 1. Initial State: DB has 0 settings documents
    console.log("\n[1] Initial State");
    const count0 = await SystemSettings.countDocuments();
    assert("Initial settings document count is 0", count0 === 0);

    // 2. Missing settings initialization / creation
    console.log("\n[2] Creation of initial singleton settings");
    const doc1 = await SystemSettings.create({
      settingsKey: "system",
      company: {
        companyName: "Total Solution",
        workspaceName: "Client Connect",
        country: "India",
        financialYearStart: "04",
        dateFormat: "DD/MM/YYYY",
        timezone: "Asia/Kolkata",
      },
      workingHours: {
        officeStartTime: "09:00",
        officeEndTime: "18:00",
        lateAfterMinutes: 10,
        fullDayHours: 8,
        halfDayHours: 4,
        autoMarkAbsent: true,
      },
      notifications: {
        amcReminderDays: 30,
        taskDueReminderHours: 4,
        dailySummaryEnabled: true,
      },
      roles: [
        {
          name: "Owner / Administrator",
          description: "Full access to every module.",
          permissions: ["Clients", "Settings", "Tickets", "Attendance"],
          status: "Active",
          isSystem: true,
        },
      ],
      taskStatuses: [
        { name: "Assigned", order: 1, isFinal: false, status: "Active", isSystem: true },
        { name: "Completed", order: 2, isFinal: true, status: "Active", isSystem: true },
      ],
      priorities: [
        { name: "High", responseHours: 4, color: "Rose", status: "Active", isSystem: true },
        { name: "Medium", responseHours: 8, color: "Slate", status: "Active", isSystem: true },
      ],
      leaveTypes: [
        { name: "Casual Leave", code: "CL", yearlyLimit: 12, paid: true, status: "Active" },
      ],
    });
    assert("First settings document created with _id", !!doc1._id);
    assert("settingsKey is 'system'", doc1.settingsKey === "system");

    const count1 = await SystemSettings.countDocuments();
    assert("Settings document count is exactly 1", count1 === 1);

    // 3. Singleton verification: Duplicate key constraint
    console.log("\n[3] Singleton constraint check: prevent duplicate settings document");
    let duplicateRejected = false;
    try {
      await SystemSettings.create({
        settingsKey: "system",
        company: { companyName: "Duplicate Org" },
      });
    } catch (err) {
      if (err.code === 11000 || (err.message && err.message.includes("E11000"))) {
        duplicateRejected = true;
      }
    }
    assert("Second document with settingsKey='system' was rejected by unique index (E11000)", duplicateRejected);

    const countAfterDup = await SystemSettings.countDocuments();
    assert("Document count remains strictly 1 after rejected duplicate", countAfterDup === 1);

    // 4. Read operations via different consumers
    console.log("\n[4] Consumer reads consistency");
    // (a) Read via SystemSettings model directly
    const readDirect = await SystemSettings.findOne({ settingsKey: "system" }).lean();
    assert("Direct read retrieves companyName", readDirect.company.companyName === "Total Solution");
    assert("Direct read retrieves workingHours", readDirect.workingHours.officeStartTime === "09:00");
    assert("Direct read retrieves notifications", readDirect.notifications.amcReminderDays === 30);

    // (b) Read via mongoose.models.SystemSettings (as used in attendance-v2.js and client.js)
    const ModelFromMongoose = mongoose.models.SystemSettings;
    const readViaRegistry = await ModelFromMongoose.findOne({ settingsKey: "system" }).lean();
    assert("Global mongoose.models.SystemSettings read matches direct read", readViaRegistry._id.toString() === doc1._id.toString());
    assert("Global read retrieves priorities", readViaRegistry.priorities.length === 2);
    assert("Global read retrieves leaveTypes", readViaRegistry.leaveTypes.length === 1);

    // (c) Read via settingsModule.SystemSettings (as used in admin.js)
    const readViaSettingsExport = await settingsModule.SystemSettings.findOne({ settingsKey: "system" }).lean();
    assert("Settings module export read matches document _id", readViaSettingsExport._id.toString() === doc1._id.toString());

    // 5. Update operations target the same document
    console.log("\n[5] Update operations target the same document");
    const updatedDoc = await SystemSettings.findOneAndUpdate(
      { settingsKey: "system" },
      {
        $set: {
          "company.companyName": "Total Solution Enterprise",
          "workingHours.lateAfterMinutes": 15,
          "notifications.amcReminderDays": 45,
          version: 2,
        },
      },
      { returnDocument: "after" }
    );
    assert("Updated document has modified companyName", updatedDoc.company.companyName === "Total Solution Enterprise");
    assert("Updated document has lateAfterMinutes=15", updatedDoc.workingHours.lateAfterMinutes === 15);
    assert("Updated document has amcReminderDays=45", updatedDoc.notifications.amcReminderDays === 45);
    assert("Updated document has version=2", updatedDoc.version === 2);
    assert("Updated document preserves same _id", updatedDoc._id.toString() === doc1._id.toString());

    const countAfterUpdate = await SystemSettings.countDocuments();
    assert("Document count remains strictly 1 after update", countAfterUpdate === 1);

    // 6. Persistence after simulated query
    console.log("\n[6] Persistence validation");
    const reloaded = await SystemSettings.findOne({ settingsKey: "system" }).lean();
    assert("Persisted companyName is 'Total Solution Enterprise'", reloaded.company.companyName === "Total Solution Enterprise");
    assert("Persisted lateAfterMinutes is 15", reloaded.workingHours.lateAfterMinutes === 15);
    assert("Persisted amcReminderDays is 45", reloaded.notifications.amcReminderDays === 45);
    assert("Persisted version is 2", reloaded.version === 2);

    // 7. Array subdocuments manipulation
    console.log("\n[7] Array subdocuments (Roles, Priorities, TaskStatuses, LeaveTypes)");
    const docWithArrays = await SystemSettings.findOne({ settingsKey: "system" });
    assert("Roles contains 1 role", docWithArrays.roles.length === 1);
    assert("Role name is 'Owner / Administrator'", docWithArrays.roles[0].name === "Owner / Administrator");
    assert("Priorities contains 2 priorities", docWithArrays.priorities.length === 2);
    assert("TaskStatuses contains 2 statuses", docWithArrays.taskStatuses.length === 2);
    assert("LeaveTypes contains 1 leave type", docWithArrays.leaveTypes.length === 1);
    assert("LeaveType code is 'CL'", docWithArrays.leaveTypes[0].code === "CL");

    console.log("\n================================================================================");
    console.log(`   FUNCTIONAL VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED           `);
    console.log("================================================================================");
  } finally {
    // Always clean up isolated test database
    console.log(`\nDropping isolated test database: ${TEST_DB_NAME}...`);
    await mongoose.connection.db.dropDatabase();
    console.log("Test database successfully dropped.");
    await mongoose.disconnect();
    console.log("Mongoose disconnected.");
  }

  if (failed === 0) {
    console.log("\nALL FUNCTIONAL SETTINGS TESTS PASSED [OK]");
    process.exit(0);
  } else {
    console.error("\nSOME FUNCTIONAL SETTINGS TESTS FAILED [FAIL]");
    process.exit(1);
  }
}

runSettingsFunctionalTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
