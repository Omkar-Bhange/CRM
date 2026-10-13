"use strict";
/**
 * test_attendanceevent_isolated.js
 * Isolated functional, lifecycle, and indexing verification for AttendanceEvent model.
 * Connects to a strictly isolated temporary local MongoDB database.
 */

require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const mongoose = require("mongoose");
const path = require("path");

const TEST_DB_NAME = `crm_isolated_attendanceevent_test_${Date.now()}`;
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
  console.log("   ATTENDANCEEVENT ISOLATED FUNCTIONAL & LIFECYCLE VERIFICATION                 ");
  console.log("================================================================================");
  console.log(`Connecting to ISOLATED test database: ${TEST_URI}`);

  await mongoose.connect(TEST_URI);
  console.log(`Connected to isolated database: ${mongoose.connection.name}`);

  try {
    const AttendanceEvent = require("./models/AttendanceEvent");

    // [1] Collection & Model Verification in DB
    console.log("\n[1] Collection & Model Verification");
    assert("Model compiles without error", Boolean(AttendanceEvent));
    assert("Model name is AttendanceEvent", AttendanceEvent.modelName === "AttendanceEvent");
    assert("Collection name is attendanceevents", AttendanceEvent.collection.name === "attendanceevents");

    // Build indexes in DB
    await AttendanceEvent.init();
    const dbIndexes = await AttendanceEvent.collection.indexes();
    const hasAttendanceIdIdx = dbIndexes.some(idx => idx.name === "attendanceId_1");
    const hasEmployeeIdIdx = dbIndexes.some(idx => idx.name === "employeeId_1");
    assert("attendanceId index exists in MongoDB", hasAttendanceIdIdx);
    assert("employeeId index exists in MongoDB", hasEmployeeIdIdx);

    // [2] Creation with Default Values
    console.log("\n[2] Creation with Default Values");
    const testAttendanceId1 = new mongoose.Types.ObjectId();
    const testEmployeeId1 = new mongoose.Types.ObjectId();

    const doc1 = await AttendanceEvent.create({
      attendanceId: testAttendanceId1,
      employeeId: testEmployeeId1,
      type: "LOGIN",
    });

    assert("Document created with valid _id", Boolean(doc1._id));
    assert("source default is 'web'", doc1.source === "web");
    assert("notes default is empty string", doc1.notes === "");
    assert("timestamp is valid Date", doc1.timestamp instanceof Date);
    assert("timestamps createdAt is populated", doc1.createdAt instanceof Date);
    assert("timestamps updatedAt is populated", doc1.updatedAt instanceof Date);

    // [3] Required Field Validations
    console.log("\n[3] Required Field Validations");
    try {
      await AttendanceEvent.create({
        employeeId: testEmployeeId1,
        type: "LOGIN",
      });
      assert("Missing attendanceId should fail", false);
    } catch (err) {
      assert("Missing attendanceId throws ValidationError", err.name === "ValidationError" && Boolean(err.errors.attendanceId));
    }

    try {
      await AttendanceEvent.create({
        attendanceId: testAttendanceId1,
        type: "LOGIN",
      });
      assert("Missing employeeId should fail", false);
    } catch (err) {
      assert("Missing employeeId throws ValidationError", err.name === "ValidationError" && Boolean(err.errors.employeeId));
    }

    try {
      await AttendanceEvent.create({
        attendanceId: testAttendanceId1,
        employeeId: testEmployeeId1,
      });
      assert("Missing type should fail", false);
    } catch (err) {
      assert("Missing type throws ValidationError", err.name === "ValidationError" && Boolean(err.errors.type));
    }

    // [4] Enum Validations (5 allowed types)
    console.log("\n[4] Enum Validations");
    const validTypes = ["LOGIN", "LOGOUT", "BREAK_START", "BREAK_END", "AUTO_CLOSE"];
    for (const vType of validTypes) {
      const ev = await AttendanceEvent.create({
        attendanceId: testAttendanceId1,
        employeeId: testEmployeeId1,
        type: vType,
        notes: `Event of type ${vType}`,
      });
      assert(`Type '${vType}' successfully saved`, ev.type === vType);
    }

    // Case normalization (lowercase "login" should uppercase to "LOGIN")
    const lowerEv = await AttendanceEvent.create({
      attendanceId: testAttendanceId1,
      employeeId: testEmployeeId1,
      type: "logout",
    });
    assert("Lowercase 'logout' normalized to 'LOGOUT'", lowerEv.type === "LOGOUT");

    // Invalid enum rejection
    try {
      await AttendanceEvent.create({
        attendanceId: testAttendanceId1,
        employeeId: testEmployeeId1,
        type: "INVALID_EVENT",
      });
      assert("Invalid enum 'INVALID_EVENT' should fail", false);
    } catch (err) {
      assert("Invalid type throws ValidationError", err.name === "ValidationError" && Boolean(err.errors.type));
    }

    // [5] Production Helper Simulation: createAttendanceEvent
    console.log("\n[5] Production Helper Simulation (createAttendanceEvent)");
    function createAttendanceEvent(attendanceId, employeeId, type, source = "web", notes = "") {
      return AttendanceEvent.create({
        attendanceId,
        employeeId,
        type,
        source,
        notes,
        timestamp: new Date(),
      });
    }

    const testAttendanceId2 = new mongoose.Types.ObjectId();
    const testEmployeeId2 = new mongoose.Types.ObjectId();

    const helperLogin = await createAttendanceEvent(testAttendanceId2, testEmployeeId2, "LOGIN", "mobile", "Mobile check-in");
    assert("Helper login created", Boolean(helperLogin._id));
    assert("Helper login source is 'mobile'", helperLogin.source === "mobile");
    assert("Helper login notes match", helperLogin.notes === "Mobile check-in");

    const helperBreakStart = await createAttendanceEvent(testAttendanceId2, testEmployeeId2, "BREAK_START", "web", "Tea break");
    assert("Helper break start created", helperBreakStart.type === "BREAK_START");

    const helperBreakEnd = await createAttendanceEvent(testAttendanceId2, testEmployeeId2, "BREAK_END", "system", "Auto closed break before logout.");
    assert("Helper break end created", helperBreakEnd.type === "BREAK_END");
    assert("Helper break end source is 'system'", helperBreakEnd.source === "system");

    const helperLogout = await createAttendanceEvent(testAttendanceId2, testEmployeeId2, "LOGOUT", "web", "End of shift");
    assert("Helper logout created", helperLogout.type === "LOGOUT");

    // [6] Event Timeline Querying & Ordering (sort by timestamp: 1)
    console.log("\n[6] Event Timeline Querying & Ordering");
    const timeline = await AttendanceEvent.find({ attendanceId: testAttendanceId2 }).sort({ timestamp: 1 });
    assert("Found exactly 4 events for attendance record 2", timeline.length === 4);
    assert("First event in timeline is LOGIN", timeline[0].type === "LOGIN");
    assert("Second event in timeline is BREAK_START", timeline[1].type === "BREAK_START");
    assert("Third event in timeline is BREAK_END", timeline[2].type === "BREAK_END");
    assert("Fourth event in timeline is LOGOUT", timeline[3].type === "LOGOUT");

    // [7] Cross-Employee Isolation
    console.log("\n[7] Cross-Employee Isolation");
    const emp1Events = await AttendanceEvent.find({ employeeId: testEmployeeId1 });
    const emp2Events = await AttendanceEvent.find({ employeeId: testEmployeeId2 });
    assert("Employee 1 events retrieved without leakage", emp1Events.every(e => e.employeeId.equals(testEmployeeId1)));
    assert("Employee 2 events retrieved without leakage", emp2Events.every(e => e.employeeId.equals(testEmployeeId2)));
    assert("Employee 2 has exactly 4 events", emp2Events.length === 4);

    // [8] Idempotent Import Consistency
    console.log("\n[8] Idempotent Import Consistency");
    const FreshModel = require("./models/AttendanceEvent");
    assert("Fresh require returns identical Mongoose model reference", FreshModel === AttendanceEvent);

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
    console.log("All AttendanceEvent isolated functional checks passed successfully!");
    process.exit(0);
  }
}

runIsolatedTests().catch(err => {
  console.error("Unhandled test runner error:", err);
  process.exit(1);
});
