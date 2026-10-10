/**
 * NEXORA CRM — Employee TimeLog Notes Backend Verification Test
 */

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ClientConnectTrack";

async function runNotesTest() {
  console.log("================================================================================");
  console.log("   NEXORA CRM: EMPLOYEE TIMELOG NOTES BACKEND VERIFICATION                     ");
  console.log("================================================================================");

  await mongoose.connect(MONGODB_URI);
  console.log(`Connected to database: ${mongoose.connection.name}`);

  require("./admin");
  require("./employee");

  const Employee = mongoose.models.Employee;
  const EmployeeDailyNote = mongoose.models.EmployeeDailyNote;
  const { getISTDateString } = require("./utils/dateUtils");

  let testEmployee = await Employee.findOne().lean();
  if (!testEmployee) {
    testEmployee = {
      _id: new mongoose.Types.ObjectId(),
      employeeCode: "EMP-TEST01",
      name: "Test Employee",
      userId: new mongoose.Types.ObjectId(),
    };
  }

  const todayStr = getISTDateString(new Date());
  console.log(`Testing with employee: ${testEmployee.name} (${testEmployee.employeeCode}), Date: ${todayStr}`);

  // 1. Create a note
  const note = new EmployeeDailyNote({
    employeeId: testEmployee._id,
    employeeCode: testEmployee.employeeCode,
    userId: testEmployee.userId || new mongoose.Types.ObjectId(),
    date: todayStr,
    text: "Test work note: Investigated client query and tested endpoints.",
    completed: false,
  });
  await note.save();
  console.log("  ✅ PASSED: Note created successfully in database (ID:", note._id.toString(), ")");

  // 2. Query notes for today
  const fetchedNotes = await EmployeeDailyNote.find({
    employeeId: testEmployee._id,
    date: todayStr,
  });
  const found = fetchedNotes.find(n => n._id.toString() === note._id.toString());
  if (!found) throw new Error("Created note not found in date query");
  console.log("  ✅ PASSED: Note retrieved successfully in daily query");

  // 3. Update / Toggle note
  found.completed = true;
  await found.save();
  const updatedNote = await EmployeeDailyNote.findById(note._id);
  if (updatedNote.completed !== true) throw new Error("Note completed state did not update");
  console.log("  ✅ PASSED: Note completed status updated successfully");

  // 4. Delete note
  await EmployeeDailyNote.findByIdAndDelete(note._id);
  const deletedCheck = await EmployeeDailyNote.findById(note._id);
  if (deletedCheck) throw new Error("Note was not deleted");
  console.log("  ✅ PASSED: Note deleted successfully from database");

  console.log("================================================================================");
  console.log("   ALL TIMELOG NOTES BACKEND TESTS PASSED (4/4)                                 ");
  console.log("================================================================================");

  await mongoose.disconnect();
}

runNotesTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  });
