const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "node_modules");
require("module").Module._initPaths();
const mongoose = require("mongoose");

const TEST_DB_URI = `mongodb://127.0.0.1:27017/crm_test_attendance_${Date.now()}`;

async function runIsolatedTests() {
  console.log("=== ISOLATED ATTENDANCE (V1) & SHARED-COLLECTION TEST SUITE ===");
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

    // Load actual V2 schema from backend/attendance-v2.js
    // Reconstruct the exact schema of AttendanceV2
    const attendanceV2Schema = new conn.base.Schema(
      {
        employeeId: {
          type: conn.base.Schema.Types.ObjectId,
          ref: "Employee",
          required: true,
          index: true,
        },
        employeeCode: {
          type: String,
          required: true,
          trim: true,
          uppercase: true,
          index: true,
        },
        employeeName: {
          type: String,
          required: true,
          trim: true,
          index: true,
        },
        department: {
          type: String,
          default: "",
          trim: true,
        },
        role: {
          type: String,
          default: "",
          trim: true,
        },
        date: {
          type: String,
          required: true,
          index: true,
        },
        loginTime: {
          type: Date,
          default: null,
        },
        logoutTime: {
          type: Date,
          default: null,
        },
        breakStartedAt: {
          type: Date,
          default: null,
        },
        breakMinutes: {
          type: Number,
          default: 0,
          min: 0,
        },
        totalBreakMinutes: {
          type: Number,
          default: 0,
          min: 0,
        },
        workingMinutes: {
          type: Number,
          default: 0,
          min: 0,
        },
        totalWorkedMinutes: {
          type: Number,
          default: 0,
          min: 0,
        },
        shiftStart: {
          type: String,
          default: "10:00",
          trim: true,
        },
        shiftEnd: {
          type: String,
          default: "18:00",
          trim: true,
        },
        graceMinutes: {
          type: Number,
          default: 15,
          min: 0,
        },
        fullDayMinutes: {
          type: Number,
          default: 480,
          min: 0,
        },
        halfDayThresholdMinutes: {
          type: Number,
          default: 240,
          min: 0,
        },
        lateMinutes: {
          type: Number,
          default: 0,
          min: 0,
        },
        earlyLogoutMinutes: {
          type: Number,
          default: 0,
          min: 0,
        },
        overtimeMinutes: {
          type: Number,
          default: 0,
          min: 0,
        },
        status: {
          type: String,
          enum: ["Present", "Late", "Absent", "Half Day", "On Leave"],
          default: "Present",
          index: true,
        },
        workStatus: {
          type: String,
          enum: ["Working", "Break", "Logged Out", "On Leave"],
          default: "Working",
          index: true,
        },
        isAutoClosed: {
          type: Boolean,
          default: false,
        },
        autoClosedReason: {
          type: String,
          default: "",
          trim: true,
        },
        note: {
          type: String,
          default: "",
          trim: true,
        },
        createdBy: {
          type: conn.base.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
        updatedBy: {
          type: conn.base.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
        isDeleted: {
          type: Boolean,
          default: false,
          index: true,
        },
      },
      {
        timestamps: true,
        collection: "attendance",
      }
    );

    const AttendanceV2 = conn.model("AttendanceV2", attendanceV2Schema);

    // Setup helper data
    const testEmployee = await Employee.create({
      employeeCode: "EMP099",
      name: "Test Employee",
      department: "Engineering",
    });

    const testUser = await User.create({
      email: "admin@test.com",
      name: "Admin User",
    });

    console.log("--- TEST GROUP 1: Document Creation & Initial State ---");
    // 1. Legacy Attendance document creation
    const docV1 = await AttendanceV1.create({
      employeeId: testEmployee._id,
      employeeCode: testEmployee.employeeCode,
      employeeName: testEmployee.name,
      department: testEmployee.department,
      date: "2026-10-01",
      loginTime: new Date("2026-10-01T09:00:00Z"),
      workingMinutes: 480,
      workStatus: "Working",
      createdBy: testUser._id,
    });
    assert(docV1 && docV1._id, "1. Legacy Attendance document created successfully");
    assert(docV1.status === "Present", "V1 default status is 'Present'");
    assert(docV1.workStatus === "Working", "V1 default workStatus is 'Working'");

    // 2. AttendanceV2 document creation
    const docV2 = await AttendanceV2.create({
      employeeId: testEmployee._id,
      employeeCode: testEmployee.employeeCode,
      employeeName: testEmployee.name,
      department: testEmployee.department,
      date: "2026-10-02",
      loginTime: new Date("2026-10-02T09:00:00Z"),
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
    assert(docV2 && docV2._id, "2. AttendanceV2 document created successfully");

    console.log("\n--- TEST GROUP 2: Cross-Model Reading & Default Hydration ---");
    // 3. V1 reading V2-created documents
    const readV2WithV1 = await AttendanceV1.findById(docV2._id);
    assert(readV2WithV1 !== null, "3. V1 can read document created by V2");
    assert(readV2WithV1.date === "2026-10-02", "V1 correctly reads shared collection fields");
    assert(readV2WithV1.totalWorkedMinutes === undefined, "V1 hydrated instance hides unmapped V2 fields");

    // 4. V2 reading V1-created documents
    const readV1WithV2 = await AttendanceV2.findById(docV1._id);
    assert(readV1WithV2 !== null, "4. V2 can read document created by V1");
    assert(readV1WithV2.date === "2026-10-01", "V2 correctly reads V1 document fields");
    assert(readV1WithV2.workingMinutes === 480, "V2 preserves workingMinutes from V1");
    assert(readV1WithV2.totalWorkedMinutes === 0, "V2 applies schema default totalWorkedMinutes=0 to V1 doc in memory");

    console.log("\n--- TEST GROUP 3: Save Semantics & Unmapped Field Preservation ---");
    // 5. V1 updates preserving V2-only fields
    readV2WithV1.note = "Updated note via Attendance V1 doc.save()";
    readV2WithV1.breakMinutes = 45;
    await readV2WithV1.save();

    const rawAfterV1Save = await conn.collection("attendance").findOne({ _id: docV2._id });
    assert(rawAfterV1Save.note === "Updated note via Attendance V1 doc.save()", "V1 note update persisted");
    assert(rawAfterV1Save.breakMinutes === 45, "V1 breakMinutes update persisted");
    assert(rawAfterV1Save.totalWorkedMinutes === 450, "5. CRITICAL: V2 field 'totalWorkedMinutes' was PRESERVED in DB after V1 save");
    assert(rawAfterV1Save.totalBreakMinutes === 30, "CRITICAL: V2 field 'totalBreakMinutes' was PRESERVED in DB after V1 save");
    assert(rawAfterV1Save.shiftStart === "09:00", "CRITICAL: V2 field 'shiftStart' was PRESERVED in DB after V1 save");
    assert(rawAfterV1Save.isDeleted === false, "CRITICAL: V2 field 'isDeleted' was PRESERVED in DB after V1 save");

    // 6. V2 updates preserving existing legacy data where applicable
    readV1WithV2.note = "Updated note via AttendanceV2 doc.save()";
    readV1WithV2.totalWorkedMinutes = 480;
    await readV1WithV2.save();

    const rawAfterV2Save = await conn.collection("attendance").findOne({ _id: docV1._id });
    assert(rawAfterV2Save.note === "Updated note via AttendanceV2 doc.save()", "V2 note update persisted");
    assert(rawAfterV2Save.workingMinutes === 480, "6. Legacy 'workingMinutes' was PRESERVED after V2 save");
    assert(rawAfterV2Save.totalWorkedMinutes === 480, "V2 added 'totalWorkedMinutes' safely");

    console.log("\n--- TEST GROUP 4: Validation & Enum Parity ---");
    // 7. Legacy "Free" enum behavior
    const docFree = await AttendanceV1.create({
      employeeId: testEmployee._id,
      employeeCode: testEmployee.employeeCode,
      employeeName: testEmployee.name,
      date: "2026-10-03",
      workStatus: "Free",
    });
    assert(docFree && docFree.workStatus === "Free", "7. Legacy 'Free' enum value successfully persisted in V1");

    // 8. Different status enum and default behavior
    let v2FreeError = null;
    try {
      await AttendanceV2.create({
        employeeId: testEmployee._id,
        employeeCode: testEmployee.employeeCode,
        employeeName: testEmployee.name,
        date: "2026-10-04",
        workStatus: "Free", // invalid in V2
      });
    } catch (err) {
      v2FreeError = err;
    }
    assert(v2FreeError !== null, "8. V2 throws ValidationError for workStatus 'Free'");
    assert(v2FreeError && v2FreeError.errors && v2FreeError.errors.workStatus, "Error specifically targets workStatus enum validation");

    // 9. Required field validation
    let reqError = null;
    try {
      await AttendanceV1.create({
        // missing employeeId, employeeCode, employeeName, date
        workStatus: "Working",
      });
    } catch (err) {
      reqError = err;
    }
    assert(reqError !== null, "9. Required fields enforced on Attendance (V1)");
    assert(reqError && reqError.errors.employeeId, "employeeId required");
    assert(reqError && reqError.errors.employeeCode, "employeeCode required");
    assert(reqError && reqError.errors.employeeName, "employeeName required");
    assert(reqError && reqError.errors.date, "date required");

    // 10. Timestamp persistence
    assert(docV1.createdAt instanceof Date, "10. createdAt timestamp populated");
    assert(docV1.updatedAt instanceof Date, "updatedAt timestamp populated");

    console.log("\n--- TEST GROUP 5: Querying & Filtering ---");
    // 11. Employee/date filtering
    const foundDoc = await AttendanceV1.findOne({
      employeeId: testEmployee._id,
      date: "2026-10-01",
    });
    assert(foundDoc !== null, "11. Attendance record found by employeeId and date");

    // 12. Mixed historical document querying
    const allAttendance = await AttendanceV1.find({
      employeeId: testEmployee._id,
    }).lean();
    assert(allAttendance.length === 3, "12. V1 finds all 3 records (V1-created and V2-created) on shared collection");
    const dates = allAttendance.map((d) => d.date).sort();
    assert(JSON.stringify(dates) === JSON.stringify(["2026-10-01", "2026-10-02", "2026-10-03"]), "All dates found in lean query");

    console.log("\n--- TEST GROUP 6: Population Through Model References ---");
    // 13. Population through ref: "Attendance" (AttendanceEvent)
    const event = await AttendanceEvent.create({
      attendanceId: docV1._id,
      employeeId: testEmployee._id,
      type: "LOGIN",
      source: "web",
      notes: "Test login event",
    });

    const populatedEvent = await AttendanceEvent.findById(event._id).populate("attendanceId");
    assert(populatedEvent !== null, "13. AttendanceEvent found");
    assert(
      populatedEvent.attendanceId && populatedEvent.attendanceId.employeeCode === "EMP099",
      "AttendanceEvent populated successfully through ref: 'Attendance'"
    );

    // 14. Population through ref: "AttendanceV2" (AttendanceApprovalRequest)
    const approvalReq = await AttendanceApprovalRequest.create({
      employeeId: testEmployee._id,
      employeeCode: testEmployee.employeeCode,
      employeeName: testEmployee.name,
      department: testEmployee.department,
      date: "2026-10-02",
      attendanceId: docV2._id,
      reason: "Remote work approval test",
    });

    const populatedReq = await AttendanceApprovalRequest.findById(approvalReq._id).populate("attendanceId");
    assert(populatedReq !== null, "14. AttendanceApprovalRequest found");
    assert(
      populatedReq.attendanceId && populatedReq.attendanceId.totalWorkedMinutes === 450,
      "AttendanceApprovalRequest populated successfully through ref: 'AttendanceV2'"
    );

    console.log("\n--- TEST GROUP 7: Model Registration & Import Order ---");
    // 15. Model registration and import-order independence
    const conn2 = await mongoose.createConnection(TEST_DB_URI + "_order").asPromise();
    // Register V2 first, then V1
    const M2 = conn2.model("AttendanceV2", attendanceV2Schema);
    const M1 = conn2.model("Attendance", require("./models/Attendance").schema);

    assert(M2.modelName === "AttendanceV2", "15. AttendanceV2 registered first");
    assert(M1.modelName === "Attendance", "Attendance registered second");
    assert(conn2.models.Attendance !== conn2.models.AttendanceV2, "Separate model instances verified");
    await conn2.dropDatabase();
    await conn2.close();

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
    console.log("All Attendance (V1) isolated shared-collection tests passed successfully!");
    process.exit(0);
  }
}

runIsolatedTests().catch((err) => {
  console.error("Isolated test failed with exception:", err);
  process.exit(1);
});

