"use strict";
/**
 * test_employeedailynote_isolated.js
 * Isolated functional integration test suite for EmployeeDailyNote model.
 * Connects to a dedicated temporary local database and drops it on completion.
 */

const mongoose = require("mongoose");

const TEST_DB_NAME = `crm_isolated_dailynote_test_${Date.now()}`;
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

// Mirrors format in backend/employee.js
function formatDailyNote(n) {
  if (!n) return null;
  return {
    id: n._id,
    _id: n._id,
    text: n.text,
    completed: !!n.completed,
    date: n.date,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  };
}

async function runIsolatedTests() {
  console.log("================================================================================");
  console.log("   EMPLOYEEDAILYNOTE ISOLATED FUNCTIONAL INTEGRATION TEST                         ");
  console.log("================================================================================");
  console.log(`Connecting to ISOLATED database: ${TEST_URI}`);
  console.log(`Target Database Name: ${TEST_DB_NAME}`);

  await mongoose.connect(TEST_URI);
  console.log(`Connected successfully. Active DB: ${mongoose.connection.name}`);

  try {
    const EmployeeDailyNote = require("./models/EmployeeDailyNote");

    // 1. Model registration & collection name
    console.log("\n[1] Model registration & collection name");
    assert("Model name is EmployeeDailyNote", EmployeeDailyNote.modelName === "EmployeeDailyNote");
    assert("Collection name is employeedailynotes", EmployeeDailyNote.collection.name === "employeedailynotes");

    // Ensure indexes are built
    await EmployeeDailyNote.init();

    const emp1Id = new mongoose.Types.ObjectId();
    const emp2Id = new mongoose.Types.ObjectId();
    const user1Id = new mongoose.Types.ObjectId();
    const user2Id = new mongoose.Types.ObjectId();

    // 2. Daily note creation
    console.log("\n[2] Daily note creation");
    const note1 = await EmployeeDailyNote.create({
      employeeId: emp1Id,
      employeeCode: "emp-001", // test lowercase conversion
      userId: user1Id,
      date: "2026-10-13",
      text: "Investigated file authorization patch in secureUploads.js",
      completed: false,
    });

    assert("Note 1 created with _id", !!note1._id);
    assert("employeeId matches", note1.employeeId.toString() === emp1Id.toString());
    assert("employeeCode converted to uppercase EMP-001", note1.employeeCode === "EMP-001");
    assert("userId matches", note1.userId.toString() === user1Id.toString());
    assert("date matches 2026-10-13", note1.date === "2026-10-13");
    assert("text matches", note1.text === "Investigated file authorization patch in secureUploads.js");
    assert("completed defaults to false", note1.completed === false);
    assert("createdAt populated", !!note1.createdAt);
    assert("updatedAt populated", !!note1.updatedAt);

    // 3. Multiple notes on the same date for the same employee
    console.log("\n[3] Multiple notes on same date for same employee");
    const note2 = await EmployeeDailyNote.create({
      employeeId: emp1Id,
      employeeCode: "EMP-001",
      userId: user1Id,
      date: "2026-10-13",
      text: "Completed EmployeeDailyNote model extraction and tests",
      completed: true,
    });
    assert("Second note on same date created with _id", !!note2._id);

    // 4. Note on a different date
    console.log("\n[4] Note on a different date");
    const noteYesterday = await EmployeeDailyNote.create({
      employeeId: emp1Id,
      employeeCode: "EMP-001",
      userId: user1Id,
      date: "2026-10-12",
      text: "Yesterday note: reviewed ClientNotification deduplication",
      completed: true,
    });
    assert("Yesterday note created", !!noteYesterday._id);

    // 5. Note for a second employee
    console.log("\n[5] Note for a second employee");
    const noteEmp2 = await EmployeeDailyNote.create({
      employeeId: emp2Id,
      employeeCode: "EMP-002",
      userId: user2Id,
      date: "2026-10-13",
      text: "Employee 2 note: worked on frontend UI components",
      completed: false,
    });
    assert("Employee 2 note created", !!noteEmp2._id);

    // 6. Validation: missing required fields
    console.log("\n[6] Validation: missing required fields");
    let caughtEmpId = false;
    try {
      await EmployeeDailyNote.create({
        employeeCode: "EMP-001",
        userId: user1Id,
        date: "2026-10-13",
        text: "Missing employeeId",
      });
    } catch (err) {
      caughtEmpId = true;
      assert("Rejects missing employeeId", err.name === "ValidationError" && !!err.errors.employeeId);
    }
    assert("Caught missing employeeId", caughtEmpId);

    let caughtText = false;
    try {
      await EmployeeDailyNote.create({
        employeeId: emp1Id,
        employeeCode: "EMP-001",
        userId: user1Id,
        date: "2026-10-13",
      });
    } catch (err) {
      caughtText = true;
      assert("Rejects missing text", err.name === "ValidationError" && !!err.errors.text);
    }
    assert("Caught missing text", caughtText);

    let caughtDate = false;
    try {
      await EmployeeDailyNote.create({
        employeeId: emp1Id,
        employeeCode: "EMP-001",
        userId: user1Id,
        text: "Missing date",
      });
    } catch (err) {
      caughtDate = true;
      assert("Rejects missing date", err.name === "ValidationError" && !!err.errors.date);
    }
    assert("Caught missing date", caughtDate);

    // 7. Date filtering and sorting
    console.log("\n[7] Date filtering and sorting");
    const todayNotesEmp1 = await EmployeeDailyNote.find({
      employeeId: emp1Id,
      date: "2026-10-13",
    }).sort({ createdAt: 1 });

    assert("Today notes for Employee 1 returns exactly 2 notes", todayNotesEmp1.length === 2);
    assert("First note matches note1", todayNotesEmp1[0]._id.toString() === note1._id.toString());
    assert("Second note matches note2", todayNotesEmp1[1]._id.toString() === note2._id.toString());

    const yesterdayNotesEmp1 = await EmployeeDailyNote.find({
      employeeId: emp1Id,
      date: "2026-10-12",
    });
    assert("Yesterday notes returns exactly 1 note", yesterdayNotesEmp1.length === 1);
    assert("Yesterday note ID matches", yesterdayNotesEmp1[0]._id.toString() === noteYesterday._id.toString());

    // 8. Employee scoping and cross-employee isolation
    console.log("\n[8] Employee scoping and cross-employee isolation");
    const emp2Notes = await EmployeeDailyNote.find({ employeeId: emp2Id });
    assert("Employee 2 query returns exactly 1 note", emp2Notes.length === 1);
    assert("Employee 2 note belongs to emp2Id", emp2Notes[0].employeeId.toString() === emp2Id.toString());

    const crossCheck = todayNotesEmp1.some(n => n.employeeId.toString() === emp2Id.toString());
    assert("Employee 1 query contains ZERO records belonging to Employee 2", !crossCheck);

    // 9. Daily note editing (PATCH/PUT /api/employee/time-log/notes/:id)
    console.log("\n[9] Daily note editing");
    const noteToUpdate = await EmployeeDailyNote.findOne({ _id: note1._id, employeeId: emp1Id });
    noteToUpdate.completed = true;
    noteToUpdate.text = "Updated text: verified all regression suites";
    noteToUpdate.updatedAt = new Date();
    await noteToUpdate.save();

    const reloadedNote1 = await EmployeeDailyNote.findById(note1._id);
    assert("completed updated to true", reloadedNote1.completed === true);
    assert("text updated", reloadedNote1.text === "Updated text: verified all regression suites");
    assert("updatedAt is updated Date", reloadedNote1.updatedAt instanceof Date);

    // 10. API response format compatibility
    console.log("\n[10] API response format compatibility");
    const formatted = formatDailyNote(reloadedNote1);
    assert("formatted.id matches _id", formatted.id.toString() === note1._id.toString());
    assert("formatted.text matches", formatted.text === "Updated text: verified all regression suites");
    assert("formatted.completed is boolean true", formatted.completed === true);
    assert("formatted.date is 2026-10-13", formatted.date === "2026-10-13");
    assert("formatted.createdAt is present", !!formatted.createdAt);
    assert("formatted.updatedAt is present", !!formatted.updatedAt);

    // 11. Delete note (DELETE /api/employee/time-log/notes/:id)
    console.log("\n[11] Delete note");
    const deletedNote = await EmployeeDailyNote.findOneAndDelete({
      _id: note2._id,
      employeeId: emp1Id,
    });
    assert("findOneAndDelete returns deleted note", !!deletedNote);

    const remainingToday = await EmployeeDailyNote.find({
      employeeId: emp1Id,
      date: "2026-10-13",
    });
    assert("Remaining today notes for Employee 1 is 1", remainingToday.length === 1);

    const emp2StillExists = await EmployeeDailyNote.findById(noteEmp2._id);
    assert("Employee 2 note remains untouched", !!emp2StillExists);

  } finally {
    console.log("\n[12] Cleanup temporary test database");
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
    console.log("All EmployeeDailyNote functional tests PASSED successfully.");
    process.exit(0);
  }
}

runIsolatedTests().catch(err => {
  console.error("Unhandled test runner exception:", err);
  process.exit(1);
});
