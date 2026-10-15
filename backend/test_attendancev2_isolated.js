const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "node_modules");
require("module").Module._initPaths();
const mongoose = require("mongoose");

const TEST_DB_URI = `mongodb://127.0.0.1:27017/crm_test_attendancev2_${Date.now()}`;

async function runIsolatedTests() {
  console.log("=== ISOLATED ATTENDANCE V2 & SHARED-COLLECTION TEST SUITE ===");
  console.log("Connecting to isolated local test database:", TEST_DB_URI);

  const conn = await mongoose.createConnection(TEST_DB_URI).asPromise();
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

  try {
    // Models on isolated connection
    const AttendanceV1 = conn.model("Attendance", require("./models/Attendance").schema);
    const AttendanceV2 = conn.model("AttendanceV2", require("./models/AttendanceV2").schema);

    // Employee schema for populate tests
    const employeeSchema = new conn.base.Schema({
      employeeCode: { type: String, required: true },
      name: { type: String, required: true },
      department: { type: String, default: "" },
    });
    const Employee = conn.model("Employee", employeeSchema);

    // User schema for populate tests
    const userSchema = new conn.base.Schema({
      email: { type: String, required: true },
      name: { type: String, required: true },
    });
    const User = conn.model("User", userSchema);

    // AttendanceEvent schema for populate through ref: "Attendance"
    const AttendanceEvent = conn.model("AttendanceEvent", require("./models/AttendanceEvent").schema);

    // AttendanceApprovalRequest schema for populate through ref: "AttendanceV2"
    const AttendanceApprovalRequest = conn.model(
      "AttendanceApprovalRequest",
      require("./models/AttendanceApprovalRequest").schema
    );

    // Setup helper data
    const testEmployee = await Employee.create({
      employeeCode: "EMP200",
      name: "V2 Test Employee",
      department: "Development",
    });

    const testUser = await User.create({
      email: "v2admin@test.com",
      name: "V2 Admin",
    });

    console.log("--- TEST GROUP 1: Document Creation & Initial State ---");
    // 1. Legacy document creation
    const docV1 = await AttendanceV1.create({
      employeeId: testEmployee._id,
      employeeCode: testEmployee.employeeCode,
      employeeName: testEmployee.name,
      department: testEmployee.department,
      date: "2026-10-15",
      loginTime: new Date("2026-10-15T09:00:00Z"),
      workingMinutes: 480,
      workStatus: "Working",
      createdBy: testUser._id,
    });
    assert(docV1 && docV1._id, "1. Legacy document created via Attendance (V1)");

    // 2. V2 document creation
    const docV2 = await AttendanceV2.create({
      employeeId: testEmployee._id,
      employeeCode: testEmployee.employeeCode,
      employeeName: testEmployee.name,
      department: testEmployee.department,
      date: "2026-10-16",
      loginTime: new Date("2026-10-16T09:00:00Z"),
      totalWorkedMinutes: 450,
      totalBreakMinutes: 30,
      shiftStart: "09:00",
      shiftEnd: "17:00",
      graceMinutes: 15,
      fullDayMinutes: 480,
      halfDayThresholdMinutes: 240,
      workStatus: "Working",
      isDeleted: false,
      createdBy: testUser._id,
    });
    assert(docV2 && docV2._id, "2. Modern document created via AttendanceV2");
    assert(docV2.totalWorkedMinutes === 450, "V2 totalWorkedMinutes persisted");
    assert(docV2.totalBreakMinutes === 30, "V2 totalBreakMinutes persisted");
    assert(docV2.isDeleted === false, "V2 isDeleted defaults to false");

    console.log("\n--- TEST GROUP 2: Cross-Model Reading & Default Hydration ---");
    // 3. V1 reading V2 documents
    const readV2WithV1 = await AttendanceV1.findById(docV2._id);
    assert(readV2WithV1 !== null, "3. V1 can read V2-created document");
    assert(readV2WithV1.date === "2026-10-16", "V1 correctly reads shared collection fields");
    assert(readV2WithV1.totalWorkedMinutes === undefined, "V1 hydrated doc does not expose totalWorkedMinutes");
    const rawV2ViaV1Lean = await AttendanceV1.findById(docV2._id).lean();
    assert(rawV2ViaV1Lean.totalWorkedMinutes === 450, "V1 lean query preserves raw totalWorkedMinutes in MongoDB");

    // 4. V2 reading legacy records
    const readV1WithV2 = await AttendanceV2.findById(docV1._id);
    assert(readV1WithV2 !== null, "4. V2 can read legacy V1 document");
    assert(readV1WithV2.date === "2026-10-15", "V2 reads legacy date");
    assert(readV1WithV2.workingMinutes === 480, "V2 preserves legacy workingMinutes");
    assert(readV1WithV2.totalWorkedMinutes === 0, "V2 applies schema default totalWorkedMinutes=0 to legacy doc");
    assert(readV1WithV2.isDeleted === false, "V2 applies schema default isDeleted=false to legacy doc");

    console.log("\n--- TEST GROUP 3: Save Semantics & Unmapped Field Preservation ---");
    // 5. V1 update preserving V2-specific fields
    readV2WithV1.note = "Updated note via Attendance (V1)";
    readV2WithV1.workingMinutes = 450;
    await readV2WithV1.save();

    const rawAfterV1Save = await conn.collection("attendance").findOne({ _id: docV2._id });
    assert(rawAfterV1Save.note === "Updated note via Attendance (V1)", "V1 note update persisted");
    assert(rawAfterV1Save.totalWorkedMinutes === 450, "5. CRITICAL: V2 field totalWorkedMinutes PRESERVED in DB after V1 save");
    assert(rawAfterV1Save.totalBreakMinutes === 30, "CRITICAL: V2 field totalBreakMinutes PRESERVED in DB after V1 save");
    assert(rawAfterV1Save.shiftStart === "09:00", "CRITICAL: V2 field shiftStart PRESERVED in DB after V1 save");
    assert(rawAfterV1Save.isDeleted === false, "CRITICAL: V2 field isDeleted PRESERVED in DB after V1 save");

    // 6. V2 update preserving unrelated stored fields
    readV1WithV2.note = "Updated note via AttendanceV2";
    readV1WithV2.lateMinutes = 10;
    await readV1WithV2.save();

    const rawAfterV2Save = await conn.collection("attendance").findOne({ _id: docV1._id });
    assert(rawAfterV2Save.note === "Updated note via AttendanceV2", "V2 note update persisted");
    assert(rawAfterV2Save.workingMinutes === 480, "6. Legacy workingMinutes PRESERVED after V2 save");
    assert(rawAfterV2Save.lateMinutes === 10, "V2 lateMinutes persisted");

    console.log("\n--- TEST GROUP 4: Validation & Enum Parity ---");
    // 7. Legacy "Free" accepted by V1
    const docFreeV1 = await AttendanceV1.create({
      employeeId: testEmployee._id,
      employeeCode: testEmployee.employeeCode,
      employeeName: testEmployee.name,
      date: "2026-10-17",
      workStatus: "Free",
    });
    assert(docFreeV1.workStatus === "Free", "7. Legacy 'Free' accepted by V1");

    // 8. Legacy "Free" rejected by V2
    let v2FreeError = null;
    try {
      await AttendanceV2.create({
        employeeId: testEmployee._id,
        employeeCode: testEmployee.employeeCode,
        employeeName: testEmployee.name,
        date: "2026-10-18",
        workStatus: "Free",
      });
    } catch (err) {
      v2FreeError = err;
    }
    assert(v2FreeError !== null, "8. Legacy 'Free' rejected by AttendanceV2 with ValidationError");
    assert(v2FreeError && v2FreeError.errors && v2FreeError.errors.workStatus, "ValidationError specifically targets workStatus");

    // 9. Historical defaults and null handling
    assert(docV2.breakStartedAt === null, "9. breakStartedAt defaults to null");
    assert(docV2.logoutTime === null, "logoutTime defaults to null");
    assert(docV2.overtimeMinutes === 0, "overtimeMinutes defaults to 0");
    assert(docV2.autoClosedReason === "", "autoClosedReason defaults to ''");

    // 10. Soft-deletion handling
    const deletedDoc = await AttendanceV2.create({
      employeeId: testEmployee._id,
      employeeCode: testEmployee.employeeCode,
      employeeName: testEmployee.name,
      date: "2026-10-19",
      isDeleted: true,
      workStatus: "Logged Out",
    });
    assert(deletedDoc.isDeleted === true, "10. Document created with isDeleted: true");
    const activeDocs = await AttendanceV2.find({ employeeId: testEmployee._id, isDeleted: false });
    assert(!activeDocs.some(d => d._id.equals(deletedDoc._id)), "Filtered active query excludes soft-deleted record");

    console.log("\n--- TEST GROUP 5: Querying & Filtering ---");
    // 11. Employee/date queries
    const foundV2 = await AttendanceV2.findOne({
      employeeId: testEmployee._id,
      date: "2026-10-16",
    });
    assert(foundV2 !== null && foundV2.totalWorkedMinutes === 450, "11. Record found by employeeId and date");

    // 12. Model registration independence
    assert(conn.models.Attendance !== conn.models.AttendanceV2, "12. Models registered independently");
    assert(conn.models.Attendance.modelName === "Attendance", "V1 modelName is Attendance");
    assert(conn.models.AttendanceV2.modelName === "AttendanceV2", "V2 modelName is AttendanceV2");

    // 13. Import-order compatibility
    const connOrder = await mongoose.createConnection(TEST_DB_URI + "_ord").asPromise();
    const M1 = connOrder.model("Attendance", require("./models/Attendance").schema);
    const M2 = connOrder.model("AttendanceV2", require("./models/AttendanceV2").schema);
    assert(M1.modelName === "Attendance" && M2.modelName === "AttendanceV2", "13. Compiles in V1 -> V2 order");
    await connOrder.dropDatabase();
    await connOrder.close();

    console.log("\n--- TEST GROUP 6: Population Through Model References ---");
    // 14. Population for AttendanceEvent and AttendanceApprovalRequest
    const evt = await AttendanceEvent.create({
      attendanceId: docV1._id,
      employeeId: testEmployee._id,
      type: "LOGIN",
      source: "web",
    });
    const popEvt = await AttendanceEvent.findById(evt._id).populate("attendanceId");
    assert(popEvt && popEvt.attendanceId && popEvt.attendanceId.date === "2026-10-15", "14a. AttendanceEvent populated via ref: 'Attendance'");

    const apr = await AttendanceApprovalRequest.create({
      employeeId: testEmployee._id,
      employeeCode: testEmployee.employeeCode,
      employeeName: testEmployee.name,
      department: testEmployee.department,
      date: "2026-10-16",
      attendanceId: docV2._id,
      reason: "Remote login approval test",
    });
    const popApr = await AttendanceApprovalRequest.findById(apr._id).populate("attendanceId");
    assert(popApr && popApr.attendanceId && popApr.attendanceId.totalWorkedMinutes === 450, "14b. AttendanceApprovalRequest populated via ref: 'AttendanceV2'");

    console.log("\n--- TEST GROUP 7: Pre-Existing Invalid Partial Index Verification ---");
    // 15. Verify that MongoDB engine rejects { isDeleted: { $ne: true } } in partialFilterExpression
    let indexErr = null;
    try {
      await conn.collection("attendance").createIndex(
        { employeeId: 1, date: 1 },
        { unique: true, partialFilterExpression: { isDeleted: { $ne: true } } }
      );
    } catch (err) {
      indexErr = err;
    }
    assert(indexErr !== null, "15. Confirmed: MongoDB engine rejects { isDeleted: { $ne: true } } in partialFilterExpression");
    assert(indexErr && indexErr.code === 67, "Pre-existing index specification error code is 67 (CannotCreateIndex: Expression not supported in partial index: $not)");
    console.log("    -> Documented pre-existing index failure preserved without masking or suppression.");

    console.log(`\n========================================`);
    console.log(`TOTAL ISOLATED CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log(`========================================\n`);

  } finally {
    console.log("Cleaning up: dropping temporary isolated test database...");
    await conn.dropDatabase();
    await conn.close();
    console.log("Test database dropped and connection closed cleanly.");
  }

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("All AttendanceV2 isolated shared-collection tests passed successfully!");
    process.exit(0);
  }
}

runIsolatedTests().catch((err) => {
  console.error("Isolated test failed with exception:", err);
  process.exit(1);
});
