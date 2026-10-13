"use strict";
/**
 * test_amcreminder_isolated.js
 * Isolated functional, validation, and lifecycle test suite for AmcReminder model.
 * Connects to a strictly isolated temporary local MongoDB database.
 */

require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const mongoose = require("mongoose");
const path = require("path");

const TEST_DB_NAME = `crm_isolated_amcreminder_test_${Date.now()}`;
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
  console.log("   AMCREMINDER ISOLATED FUNCTIONAL & LIFECYCLE VERIFICATION                     ");
  console.log("================================================================================");
  console.log(`Connecting to ISOLATED test database: ${TEST_URI}`);

  await mongoose.connect(TEST_URI);
  console.log(`Connected to isolated database: ${mongoose.connection.name}`);

  try {
    const AmcReminder = require("./models/AmcReminder");

    // [1] Collection & Model Verification in DB
    console.log("\n[1] Collection & Model Verification");
    assert("Model compiles without error", Boolean(AmcReminder));
    assert("Model name is AmcReminder", AmcReminder.modelName === "AmcReminder");
    assert("Collection name is amcreminders", AmcReminder.collection.name === "amcreminders");

    // [2] Creation with Default Values & Schema Transforms
    console.log("\n[2] Creation with Default Values & Transforms");
    const testContractId = new mongoose.Types.ObjectId();
    const testClientId = new mongoose.Types.ObjectId();

    const doc1 = await AmcReminder.create({
      amcContractId: testContractId,
      contractCode: "  amc-ctr-2026-0001  ",
      clientId: testClientId,
      clientCode: "  cli-001  ",
      clientName: "  Acme Corp  ",
      channel: "Email",
      message: "  Your AMC contract is expiring soon.  ",
    });

    assert("Document created with valid _id", Boolean(doc1._id));
    assert("contractCode trimmed and uppercase", doc1.contractCode === "AMC-CTR-2026-0001");
    assert("clientCode trimmed and uppercase", doc1.clientCode === "CLI-001");
    assert("clientName trimmed", doc1.clientName === "Acme Corp");
    assert("message trimmed", doc1.message === "Your AMC contract is expiring soon.");
    assert("channel is Email", doc1.channel === "Email");
    assert("status default is 'Sent'", doc1.status === "Sent");
    assert("isDeleted default is false", doc1.isDeleted === false);
    assert("assignedEmployeeName default is 'Unassigned'", doc1.assignedEmployeeName === "Unassigned");
    assert("assignedEmployeeCode default is empty string", doc1.assignedEmployeeCode === "");
    assert("assignedEmployeeId default is null", doc1.assignedEmployeeId === null);
    assert("followUpDate default is null", doc1.followUpDate === null);
    assert("notes default is empty string", doc1.notes === "");
    assert("sentBy default is null", doc1.sentBy === null);
    assert("sentByName default is empty string", doc1.sentByName === "");
    assert("sentAt is valid Date", doc1.sentAt instanceof Date);
    assert("timestamps createdAt is populated", doc1.createdAt instanceof Date);
    assert("timestamps updatedAt is populated", doc1.updatedAt instanceof Date);

    // [3] Validation Rejections (Required Fields)
    console.log("\n[3] Validation Rejections: Required Fields");
    try {
      await AmcReminder.create({
        contractCode: "AMC-01",
        clientId: testClientId,
        clientName: "Acme",
        channel: "SMS",
        message: "Test",
      });
      assert("Missing amcContractId should fail", false);
    } catch (err) {
      assert("Missing amcContractId throws ValidationError", err.name === "ValidationError" && Boolean(err.errors.amcContractId));
    }

    try {
      await AmcReminder.create({
        amcContractId: testContractId,
        clientId: testClientId,
        clientName: "Acme",
        channel: "SMS",
        message: "Test",
      });
      assert("Missing contractCode should fail", false);
    } catch (err) {
      assert("Missing contractCode throws ValidationError", err.name === "ValidationError" && Boolean(err.errors.contractCode));
    }

    try {
      await AmcReminder.create({
        amcContractId: testContractId,
        contractCode: "AMC-01",
        clientName: "Acme",
        channel: "SMS",
        message: "Test",
      });
      assert("Missing clientId should fail", false);
    } catch (err) {
      assert("Missing clientId throws ValidationError", err.name === "ValidationError" && Boolean(err.errors.clientId));
    }

    try {
      await AmcReminder.create({
        amcContractId: testContractId,
        contractCode: "AMC-01",
        clientId: testClientId,
        channel: "SMS",
        message: "Test",
      });
      assert("Missing clientName should fail", false);
    } catch (err) {
      assert("Missing clientName throws ValidationError", err.name === "ValidationError" && Boolean(err.errors.clientName));
    }

    try {
      await AmcReminder.create({
        amcContractId: testContractId,
        contractCode: "AMC-01",
        clientId: testClientId,
        clientName: "Acme",
        message: "Test",
      });
      assert("Missing channel should fail", false);
    } catch (err) {
      assert("Missing channel throws ValidationError", err.name === "ValidationError" && Boolean(err.errors.channel));
    }

    try {
      await AmcReminder.create({
        amcContractId: testContractId,
        contractCode: "AMC-01",
        clientId: testClientId,
        clientName: "Acme",
        channel: "SMS",
      });
      assert("Missing message should fail", false);
    } catch (err) {
      assert("Missing message throws ValidationError", err.name === "ValidationError" && Boolean(err.errors.message));
    }

    // [4] Enum Validation (Channel & Status)
    console.log("\n[4] Enum Validation: Channel & Status");
    const validChannels = ["WhatsApp", "Email", "SMS", "Phone Call"];
    for (const ch of validChannels) {
      const chDoc = await AmcReminder.create({
        amcContractId: testContractId,
        contractCode: "AMC-TEST",
        clientId: testClientId,
        clientName: "Acme",
        channel: ch,
        message: `Testing channel ${ch}`,
      });
      assert(`Channel '${ch}' successfully validated and saved`, chDoc.channel === ch);
    }

    try {
      await AmcReminder.create({
        amcContractId: testContractId,
        contractCode: "AMC-TEST",
        clientId: testClientId,
        clientName: "Acme",
        channel: "Telegram",
        message: "Testing invalid channel",
      });
      assert("Invalid channel 'Telegram' should fail", false);
    } catch (err) {
      assert("Invalid channel throws ValidationError", err.name === "ValidationError" && Boolean(err.errors.channel));
    }

    const validStatuses = ["Sent", "Call Logged", "Failed"];
    for (const st of validStatuses) {
      const stDoc = await AmcReminder.create({
        amcContractId: testContractId,
        contractCode: "AMC-TEST",
        clientId: testClientId,
        clientName: "Acme",
        channel: "Email",
        status: st,
        message: `Testing status ${st}`,
      });
      assert(`Status '${st}' successfully validated and saved`, stDoc.status === st);
    }

    try {
      await AmcReminder.create({
        amcContractId: testContractId,
        contractCode: "AMC-TEST",
        clientId: testClientId,
        clientName: "Acme",
        channel: "Email",
        status: "Delivered",
        message: "Testing invalid status",
      });
      assert("Invalid status 'Delivered' should fail", false);
    } catch (err) {
      assert("Invalid status throws ValidationError", err.name === "ValidationError" && Boolean(err.errors.status));
    }

    // [5] Compound Index & Sorting Behavior ({ amcContractId: 1, sentAt: -1 })
    console.log("\n[5] Compound Index & Query Sorting");
    const contractForSorting = new mongoose.Types.ObjectId();
    const t0 = new Date("2026-01-01T10:00:00Z");
    const t1 = new Date("2026-01-02T10:00:00Z");
    const t2 = new Date("2026-01-03T10:00:00Z");

    await AmcReminder.create([
      {
        amcContractId: contractForSorting,
        contractCode: "AMC-SORT",
        clientId: testClientId,
        clientName: "Client A",
        channel: "Email",
        message: "First reminder",
        sentAt: t0,
      },
      {
        amcContractId: contractForSorting,
        contractCode: "AMC-SORT",
        clientId: testClientId,
        clientName: "Client A",
        channel: "SMS",
        message: "Third reminder",
        sentAt: t2,
      },
      {
        amcContractId: contractForSorting,
        contractCode: "AMC-SORT",
        clientId: testClientId,
        clientName: "Client A",
        channel: "Phone Call",
        message: "Second reminder",
        sentAt: t1,
      },
    ]);

    const sortedReminders = await AmcReminder.find({
      amcContractId: contractForSorting,
      isDeleted: false,
    }).sort({ sentAt: -1 });

    assert("Found exactly 3 reminders for sorted contract", sortedReminders.length === 3);
    assert("First reminder in sort is most recent (t2)", sortedReminders[0].message === "Third reminder");
    assert("Second reminder in sort is intermediate (t1)", sortedReminders[1].message === "Second reminder");
    assert("Third reminder in sort is earliest (t0)", sortedReminders[2].message === "First reminder");

    // [6] Soft Delete Simulation (as in DELETE /api/admin/amc/contract/:id)
    console.log("\n[6] Soft Delete Behavior Simulation");
    await AmcReminder.updateMany(
      { amcContractId: contractForSorting },
      { $set: { isDeleted: true } }
    );

    const activeAfterDelete = await AmcReminder.find({
      amcContractId: contractForSorting,
      isDeleted: false,
    });
    assert("Active reminders after soft-delete is 0", activeAfterDelete.length === 0);

    const deletedCount = await AmcReminder.countDocuments({
      amcContractId: contractForSorting,
      isDeleted: true,
    });
    assert("All 3 documents have isDeleted = true", deletedCount === 3);

    // [7] Route Simulation: POST /api/admin/amc/contract/:id/reminder
    console.log("\n[7] Route Simulation: Reminder Creation with Custom Details");
    const employeeId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();
    const followDate = new Date("2026-02-15T00:00:00Z");

    const routeReminder = await AmcReminder.create({
      amcContractId: testContractId,
      contractCode: "AMC-ROUTE-01",
      clientId: testClientId,
      clientCode: "CLI-ROUTE-01",
      clientName: "Route Test Client",
      channel: "Phone Call",
      message: "Called client regarding AMC renewal terms.",
      assignedEmployeeId: employeeId,
      assignedEmployeeCode: "EMP-042",
      assignedEmployeeName: "Jane Smith",
      followUpDate: followDate,
      notes: "Client requested 10% discount on 3-year term.",
      sentBy: userId,
      sentByName: "Admin Superuser",
      status: "Call Logged",
    });

    assert("Phone Call reminder created successfully", Boolean(routeReminder._id));
    assert("status is 'Call Logged'", routeReminder.status === "Call Logged");
    assert("assignedEmployeeId matches", routeReminder.assignedEmployeeId.equals(employeeId));
    assert("assignedEmployeeCode is EMP-042", routeReminder.assignedEmployeeCode === "EMP-042");
    assert("assignedEmployeeName is Jane Smith", routeReminder.assignedEmployeeName === "Jane Smith");
    assert("followUpDate matches", routeReminder.followUpDate.getTime() === followDate.getTime());
    assert("notes matches", routeReminder.notes === "Client requested 10% discount on 3-year term.");
    assert("sentBy matches", routeReminder.sentBy.equals(userId));
    assert("sentByName matches", routeReminder.sentByName === "Admin Superuser");

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
    console.log("All AmcReminder isolated functional checks passed successfully!");
    process.exit(0);
  }
}

runIsolatedTests().catch(err => {
  console.error("Unhandled test runner error:", err);
  process.exit(1);
});
