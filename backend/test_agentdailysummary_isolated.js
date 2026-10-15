"use strict";
/**
 * test_agentdailysummary_isolated.js
 * Isolated functional, upsert, and lifecycle test suite for AgentDailySummary model.
 * Connects to a strictly isolated temporary local MongoDB database.
 */

require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const mongoose = require("mongoose");
const path = require("path");

const TEST_DB_NAME = `crm_isolated_agentdailysummary_test_${Date.now()}`;
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
  console.log("   AGENTDAILYSUMMARY ISOLATED FUNCTIONAL & LIFECYCLE VERIFICATION                ");
  console.log("================================================================================");
  console.log(`Connecting to ISOLATED test database: ${TEST_URI}`);

  await mongoose.connect(TEST_URI);
  console.log(`Connected to isolated database: ${mongoose.connection.name}`);

  try {
    const AgentDailySummary = require("./models/AgentDailySummary");

    // [1] Collection & Model Verification in DB
    console.log("\n[1] Collection & Model Verification");
    assert("Model compiles without error", Boolean(AgentDailySummary));
    assert("Model name is AgentDailySummary", AgentDailySummary.modelName === "AgentDailySummary");
    assert("Collection name is agent_daily_summary", AgentDailySummary.collection.name === "agent_daily_summary");

    // Build indexes in DB
    await AgentDailySummary.init();
    const dbIndexes = await AgentDailySummary.collection.indexes();
    const hasUniqueTaskIdx = dbIndexes.some(idx => idx.name === "employee_application_date_task_unique" && idx.unique === true);
    const hasLastSeenIdx = dbIndexes.some(idx => idx.name === "employee_date_last_seen");
    assert("Unique compound index exists in MongoDB", hasUniqueTaskIdx);
    assert("LastSeen compound index exists in MongoDB", hasLastSeenIdx);

    // [2] Creation with Default Values
    console.log("\n[2] Creation with Default Values");
    const emp1Id = new mongoose.Types.ObjectId();
    const dateToday = new Date("2026-10-13T00:00:00.000Z");

    const doc1 = await AgentDailySummary.create({
      employeeId: emp1Id,
      employeeCode: "EMP001",
      employeeName: "Alice Smith",
      pcName: "PC-WORKSTATION-01",
      date: dateToday,
      application: "Visual Studio Code",
    });

    assert("Document created with valid _id", Boolean(doc1._id));
    assert("lastWindowTitle default is empty string", doc1.lastWindowTitle === "");
    assert("totalSeconds default is 0", doc1.totalSeconds === 0);
    assert("sessionCount default is 0", doc1.sessionCount === 0);
    assert("firstSeen default is null", doc1.firstSeen === null);
    assert("lastSeen default is null", doc1.lastSeen === null);
    assert("project default is empty string", doc1.project === "");
    assert("client default is empty string", doc1.client === "");
    assert("category default is 'Other'", doc1.category === "Other");
    assert("activity default is empty string", doc1.activity === "");
    assert("taskId default is null", doc1.taskId === null);
    assert("taskCode default is empty string", doc1.taskCode === "");
    assert("taskTitle default is empty string", doc1.taskTitle === "");
    assert("taskStatus default is empty string", doc1.taskStatus === "");
    assert("ticketId default is null", doc1.ticketId === null);
    assert("timestamps createdAt is populated", doc1.createdAt instanceof Date);
    assert("timestamps updatedAt is populated", doc1.updatedAt instanceof Date);

    // [3] Required Field Validations
    console.log("\n[3] Required Field Validations");
    const requiredChecks = [
      { field: "employeeId", doc: { employeeCode: "E1", employeeName: "N", pcName: "P", date: dateToday, application: "App" } },
      { field: "employeeCode", doc: { employeeId: emp1Id, employeeName: "N", pcName: "P", date: dateToday, application: "App" } },
      { field: "employeeName", doc: { employeeId: emp1Id, employeeCode: "E1", pcName: "P", date: dateToday, application: "App" } },
      { field: "pcName", doc: { employeeId: emp1Id, employeeCode: "E1", employeeName: "N", date: dateToday, application: "App" } },
      { field: "date", doc: { employeeId: emp1Id, employeeCode: "E1", employeeName: "N", pcName: "P", application: "App" } },
      { field: "application", doc: { employeeId: emp1Id, employeeCode: "E1", employeeName: "N", pcName: "P", date: dateToday } },
    ];

    for (const chk of requiredChecks) {
      try {
        await AgentDailySummary.create(chk.doc);
        assert(`Missing ${chk.field} should fail`, false);
      } catch (err) {
        assert(`Missing ${chk.field} throws ValidationError`, err.name === "ValidationError" && Boolean(err.errors[chk.field]));
      }
    }

    // [4] Production Upsert Logic Simulation (as in server.js /api/agent/events)
    console.log("\n[4] Production Upsert Logic Simulation");
    const emp2Id = new mongoose.Types.ObjectId();
    const tStart1 = new Date("2026-10-13T09:00:00.000Z");
    const tEnd1 = new Date("2026-10-13T09:15:00.000Z"); // 900 seconds
    const taskId1 = new mongoose.Types.ObjectId();

    // First session upsert
    const upsert1 = await AgentDailySummary.findOneAndUpdate(
      {
        employeeCode: "EMP002",
        application: "Google Chrome",
        date: dateToday,
        taskId: taskId1,
      },
      {
        $set: {
          employeeId: emp2Id,
          employeeName: "Bob Jones",
          pcName: "PC-WORKSTATION-02",
          lastWindowTitle: "Jira Dashboard - Google Chrome",
          project: "CRM Platform",
          client: "Acme Corp",
          category: "Browsing",
          activity: "Active",
          taskId: taskId1,
          taskCode: "TSK-001",
          taskTitle: "Frontend Fix",
          taskStatus: "In Progress",
          ticketId: null,
          lastSeen: tEnd1,
        },
        $setOnInsert: {
          firstSeen: tStart1,
        },
        $inc: {
          totalSeconds: 900,
          sessionCount: 1,
        },
      },
      {
        upsert: true,
        new: true,
      }
    );

    assert("First upsert creates document", Boolean(upsert1._id));
    assert("firstSeen set on insert", upsert1.firstSeen.getTime() === tStart1.getTime());
    assert("lastSeen set correctly", upsert1.lastSeen.getTime() === tEnd1.getTime());
    assert("totalSeconds is 900", upsert1.totalSeconds === 900);
    assert("sessionCount is 1", upsert1.sessionCount === 1);

    // Second session upsert on same task/application bucket (incremental accumulation)
    const tEnd2 = new Date("2026-10-13T09:30:00.000Z"); // +900 seconds
    const upsert2 = await AgentDailySummary.findOneAndUpdate(
      {
        employeeCode: "EMP002",
        application: "Google Chrome",
        date: dateToday,
        taskId: taskId1,
      },
      {
        $set: {
          employeeId: emp2Id,
          employeeName: "Bob Jones",
          pcName: "PC-WORKSTATION-02",
          lastWindowTitle: "Pull Requests - GitHub",
          lastSeen: tEnd2,
        },
        $setOnInsert: {
          firstSeen: new Date("2026-10-13T09:15:00.000Z"), // should NOT overwrite original
        },
        $inc: {
          totalSeconds: 900,
          sessionCount: 1,
        },
      },
      {
        upsert: true,
        new: true,
      }
    );

    assert("Second upsert modifies existing document (same _id)", upsert2._id.equals(upsert1._id));
    assert("firstSeen remains initial tStart1 (not overwritten)", upsert2.firstSeen.getTime() === tStart1.getTime());
    assert("lastSeen updated to tEnd2", upsert2.lastSeen.getTime() === tEnd2.getTime());
    assert("totalSeconds accumulated to 1800", upsert2.totalSeconds === 1800);
    assert("sessionCount accumulated to 2", upsert2.sessionCount === 2);
    assert("lastWindowTitle updated", upsert2.lastWindowTitle === "Pull Requests - GitHub");

    // [5] Unique Compound Index Collision Enforcement
    console.log("\n[5] Unique Compound Index Collision Enforcement");
    try {
      await AgentDailySummary.create({
        employeeId: emp2Id,
        employeeCode: "EMP002",
        employeeName: "Bob Jones",
        pcName: "PC-WORKSTATION-02",
        date: dateToday,
        application: "Google Chrome",
        taskId: taskId1,
        totalSeconds: 50,
      });
      assert("Duplicate (employeeCode + application + date + taskId) should fail", false);
    } catch (err) {
      assert("Duplicate insert triggers E11000 duplicate key error", err.code === 11000 || (err.name === "MongoServerError" && err.code === 11000));
    }

    // [6] Employee Isolation
    console.log("\n[6] Employee Isolation");
    const emp1Summaries = await AgentDailySummary.find({ employeeCode: "EMP001" });
    const emp2Summaries = await AgentDailySummary.find({ employeeCode: "EMP002" });
    assert("Employee 1 query returns exactly 1 record", emp1Summaries.length === 1);
    assert("Employee 2 query returns exactly 1 record", emp2Summaries.length === 1);
    assert("No cross-employee data leakage", emp1Summaries[0].employeeCode === "EMP001" && emp2Summaries[0].employeeCode === "EMP002");

    // [7] Multi-PC Handling (Different PCs for Same Employee)
    console.log("\n[7] Multi-PC Handling");
    const diffAppDoc = await AgentDailySummary.create({
      employeeId: emp2Id,
      employeeCode: "EMP002",
      employeeName: "Bob Jones",
      pcName: "LAPTOP-HOME-02",
      date: dateToday,
      application: "Slack",
      taskId: null,
      totalSeconds: 600,
      sessionCount: 3,
    });
    assert("Different application on laptop created successfully", Boolean(diffAppDoc._id));
    const emp2AllApps = await AgentDailySummary.find({ employeeCode: "EMP002" });
    assert("Employee 2 has 2 different application summaries across devices", emp2AllApps.length === 2);

    // [8] IST Day-Boundary Handling (UTC 18:30:00 Representation)
    console.log("\n[8] IST Day-Boundary Handling");
    const istDate1 = new Date("2026-10-12T18:30:00.000Z"); // Represents Oct 13 00:00 IST
    const istDate2 = new Date("2026-10-13T18:30:00.000Z"); // Represents Oct 14 00:00 IST

    await AgentDailySummary.create([
      {
        employeeId: emp1Id,
        employeeCode: "EMP001",
        employeeName: "Alice Smith",
        pcName: "PC-01",
        date: istDate1,
        application: "Figma",
        taskId: null,
        totalSeconds: 1200,
      },
      {
        employeeId: emp1Id,
        employeeCode: "EMP001",
        employeeName: "Alice Smith",
        pcName: "PC-01",
        date: istDate2,
        application: "Figma",
        taskId: null,
        totalSeconds: 2400,
      },
    ]);

    const day1Query = await AgentDailySummary.find({
      employeeCode: "EMP001",
      date: istDate1,
    });
    assert("Day 1 query returns records specifically for Day 1", day1Query.length === 1 && day1Query[0].totalSeconds === 1200);

    const day2Query = await AgentDailySummary.find({
      employeeCode: "EMP001",
      date: istDate2,
    });
    assert("Day 2 query returns records specifically for Day 2", day2Query.length === 1 && day2Query[0].totalSeconds === 2400);

    // [9] Sorting by Newest Activity (lastSeen: -1)
    console.log("\n[9] Sorting by Newest Activity (employee_date_last_seen index)");
    const sortedFeed = await AgentDailySummary.find({
      employeeCode: "EMP002",
      date: dateToday,
    }).sort({ lastSeen: -1 });

    assert("Sorted feed returns 2 application records", sortedFeed.length === 2);
    assert("Top record is Chrome with most recent lastSeen", sortedFeed[0].application === "Google Chrome");

    // [10] Reporting Rollup Compatibility (Total Duration Calculation)
    console.log("\n[10] Reporting Rollup Compatibility");
    const allEmp2Records = await AgentDailySummary.find({
      employeeCode: "EMP002",
      date: dateToday,
    }).lean();

    const totalTrackedSeconds = allEmp2Records.reduce((sum, item) => sum + (item.totalSeconds || 0), 0);
    const totalSessions = allEmp2Records.reduce((sum, item) => sum + (item.sessionCount || 0), 0);
    assert("Total tracked seconds calculated accurately (1800 + 600 = 2400)", totalTrackedSeconds === 2400);
    assert("Total sessions calculated accurately (2 + 3 = 5)", totalSessions === 5);

    // [11] Backward Compatibility via require('./agentSession')
    console.log("\n[11] Backward Compatibility Delegation");
    const LegacyModel = require("./agentSession");
    const recordsViaLegacy = await LegacyModel.find({ employeeCode: "EMP001" });
    assert("Querying via require('./agentSession') returns same data", recordsViaLegacy.length === 3);

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
    console.log("All AgentDailySummary isolated functional checks passed successfully!");
    process.exit(0);
  }
}

runIsolatedTests().catch(err => {
  console.error("Unhandled test runner error:", err);
  process.exit(1);
});
