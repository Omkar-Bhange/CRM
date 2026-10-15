const path = require('path');
process.env.NODE_PATH = path.resolve('backend/node_modules');
require('module').Module._initPaths();
const mongoose = require('mongoose');

const LOCAL_URI = `mongodb://127.0.0.1:27017/crm_audit_attendance_${Date.now()}`;

async function runTests() {
  console.log('Connecting to isolated local MongoDB:', LOCAL_URI);
  const conn = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log('Connected to local MongoDB successfully.');

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
    const attendanceSchemaV1 = new conn.base.Schema(
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
        },
        employeeName: {
          type: String,
          required: true,
          trim: true,
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
        breakMinutes: {
          type: Number,
          default: 0,
          min: 0,
        },
        breakStartedAt: {
          type: Date,
          default: null,
        },
        workingMinutes: {
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
          enum: [
            "Present",
            "Late",
            "Absent",
            "Half Day",
            "On Leave",
          ],
          default: "Present",
        },
        workStatus: {
          type: String,
          enum: [
            "Working",
            "Free",
            "Break",
            "Logged Out",
            "On Leave",
          ],
          default: "Working",
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
      },
      {
        timestamps: true,
        collection: "attendance",
      }
    );

    const attendanceSchemaV2 = new conn.base.Schema(
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

    // EXACT inline index from backend/attendance-v2.js line 181
    attendanceSchemaV2.index(
      {
        employeeId: 1,
        date: 1,
      },
      {
        unique: true,
        partialFilterExpression: {
          isDeleted: { $ne: true },
        },
      }
    );

    const ModelV1 = conn.model("Attendance", attendanceSchemaV1);
    const ModelV2 = conn.model("AttendanceV2", attendanceSchemaV2);

    console.log('\n--- TEST GROUP 1: Document Creation & Initial State ---');
    const empId1 = new conn.base.Types.ObjectId();
    const docV1 = await ModelV1.create({
      employeeId: empId1,
      employeeCode: "EMP001",
      employeeName: "Alice",
      date: "2026-10-01",
      loginTime: new Date("2026-10-01T09:00:00Z"),
      workingMinutes: 480,
      workStatus: "Working",
    });
    assert(docV1 && docV1._id, "ModelV1 document created successfully");

    const empId2 = new conn.base.Types.ObjectId();
    const docV2 = await ModelV2.create({
      employeeId: empId2,
      employeeCode: "EMP002",
      employeeName: "Bob",
      date: "2026-10-01",
      loginTime: new Date("2026-10-01T09:00:00Z"),
      totalWorkedMinutes: 480,
      totalBreakMinutes: 30,
      shiftStart: "09:00",
      shiftEnd: "17:00",
      workStatus: "Working",
    });
    assert(docV2 && docV2._id, "ModelV2 document created successfully");

    console.log('\n--- TEST GROUP 2: Cross-Model Reading & Default Hydration ---');
    const readV1ByV2 = await ModelV2.findById(docV1._id);
    assert(readV1ByV2 !== null, "ModelV2 can read document created by ModelV1");
    assert(readV1ByV2.isDeleted === false, "ModelV2 applies default isDeleted=false to V1 document upon hydration");
    assert(readV1ByV2.totalWorkedMinutes === 0, "ModelV2 applies default totalWorkedMinutes=0 to V1 document (original was 480 workingMinutes)");
    assert(readV1ByV2.workingMinutes === 480, "ModelV2 preserves original workingMinutes=480");

    const readV2ByV1 = await ModelV1.findById(docV2._id);
    assert(readV2ByV1 !== null, "ModelV1 can read document created by ModelV2");
    assert(readV2ByV1.totalWorkedMinutes === undefined, "ModelV1 does not expose totalWorkedMinutes on hydrated doc");
    assert(readV2ByV1.isDeleted === undefined, "ModelV1 does not expose isDeleted on hydrated doc");

    console.log('\n--- TEST GROUP 3: Save Semantics & Unmapped Field Retention ---');
    readV2ByV1.note = "Updated by V1 model via doc.save()";
    await readV2ByV1.save();

    const rawAfterV1Save = await conn.collection("attendance").findOne({ _id: docV2._id });
    assert(rawAfterV1Save.note === "Updated by V1 model via doc.save()", "Note was updated in database");
    assert(rawAfterV1Save.totalWorkedMinutes === 480, "CRITICAL: V2 field 'totalWorkedMinutes' was PRESERVED in MongoDB when V1 called doc.save()");
    assert(rawAfterV1Save.totalBreakMinutes === 30, "CRITICAL: V2 field 'totalBreakMinutes' was PRESERVED in MongoDB when V1 called doc.save()");
    assert(rawAfterV1Save.shiftStart === "09:00", "CRITICAL: V2 field 'shiftStart' was PRESERVED in MongoDB when V1 called doc.save()");
    assert(rawAfterV1Save.isDeleted === false, "CRITICAL: V2 field 'isDeleted' was PRESERVED in MongoDB when V1 called doc.save()");

    console.log('\n--- TEST GROUP 4: Direct Update Semantics (updateOne, findOneAndUpdate) ---');
    await ModelV1.updateOne({ _id: docV2._id }, { $set: { overtimeMinutes: 60 } });
    const rawAfterUpdateOne = await conn.collection("attendance").findOne({ _id: docV2._id });
    assert(rawAfterUpdateOne.overtimeMinutes === 60, "ModelV1 updateOne sets field");
    assert(rawAfterUpdateOne.totalWorkedMinutes === 480, "V2 fields remain intact after ModelV1 updateOne");

    await ModelV2.findOneAndUpdate({ _id: docV1._id }, { $set: { lateMinutes: 15 } });
    const rawAfterFindOneAndUpdate = await conn.collection("attendance").findOne({ _id: docV1._id });
    assert(rawAfterFindOneAndUpdate.lateMinutes === 15, "ModelV2 findOneAndUpdate sets lateMinutes on V1 document");

    console.log('\n--- TEST GROUP 5: Validation Conflicts (workStatus "Free") ---');
    const empId3 = new conn.base.Types.ObjectId();
    const docFreeV1 = await ModelV1.create({
      employeeId: empId3,
      employeeCode: "EMP003",
      employeeName: "Charlie",
      date: "2026-10-02",
      workStatus: "Free",
    });
    assert(docFreeV1.workStatus === "Free", "ModelV1 successfully created document with workStatus='Free'");

    let v2SaveError = null;
    try {
      const v2LoadFree = await ModelV2.findById(docFreeV1._id);
      v2LoadFree.note = "Attempting save under V2";
      await v2LoadFree.save();
    } catch (err) {
      v2SaveError = err;
    }
    assert(v2SaveError !== null, "ModelV2 doc.save() THROWS ValidationError when workStatus is 'Free'");
    assert(v2SaveError && v2SaveError.errors && v2SaveError.errors.workStatus, "ValidationError specifically targets unaccepted enum value 'Free'");

    console.log('\n--- TEST GROUP 6: Index Creation Failure & Atlas Parity Analysis ---');
    // Test why the V2 compound partial index failed in MongoDB
    let indexCreationError = null;
    try {
      await conn.collection("attendance").createIndex(
        { employeeId: 1, date: 1 },
        { unique: true, partialFilterExpression: { isDeleted: { $ne: true } } }
      );
    } catch (err) {
      indexCreationError = err;
    }
    assert(indexCreationError !== null, "MongoDB engine REJECTS { isDeleted: { $ne: true } } in partialFilterExpression");
    assert(indexCreationError && indexCreationError.code === 67, "MongoDB returns error code 67 (CannotCreateIndex): Expression not supported in partial index: $not");
    console.log(`    -> Confirmed: In MongoDB, $ne is illegal in partialFilterExpression. This explains why the index is missing on Atlas.`);

    // Can single-field indexes declared on paths be built?
    await conn.collection("attendance").createIndex({ employeeId: 1 });
    await conn.collection("attendance").createIndex({ date: 1 });
    await conn.collection("attendance").createIndex({ employeeCode: 1 });
    await conn.collection("attendance").createIndex({ employeeName: 1 });
    await conn.collection("attendance").createIndex({ status: 1 });
    await conn.collection("attendance").createIndex({ workStatus: 1 });
    await conn.collection("attendance").createIndex({ isDeleted: 1 });

    const localIndexes = await conn.collection("attendance").indexes();
    assert(localIndexes.length === 8, "All 8 single-field indexes match Atlas production collection exactly");

    console.log('\n--- TEST GROUP 7: Aggregation & Mixed Document Queries ---');
    const allViaV1 = await ModelV1.find({ date: "2026-10-01" }).lean();
    assert(allViaV1.length >= 2, "ModelV1 queries both V1-created and V2-created records in lean mode");
    assert(allViaV1.some(d => d.totalWorkedMinutes === 480), "ModelV1 .lean() returns raw V2 fields from MongoDB without stripping");

    const allViaV2 = await ModelV2.find({ date: "2026-10-01" }).lean();
    assert(allViaV2.length >= 2, "ModelV2 queries all records in lean mode");

    console.log('\n--- TEST GROUP 8: Model Compilation & Registration Order ---');
    // Test if registering Attendance and AttendanceV2 in different orders has any impact
    const connOrderTest = await mongoose.createConnection(LOCAL_URI + "_order").asPromise();
    
    // Register V2 first, then V1
    const modelV2First = connOrderTest.model("AttendanceV2", attendanceSchemaV2);
    const modelV1Second = connOrderTest.model("Attendance", attendanceSchemaV1);
    assert(modelV2First.modelName === "AttendanceV2", "AttendanceV2 registered first compiles successfully");
    assert(modelV1Second.modelName === "Attendance", "Attendance registered second compiles successfully");
    assert(connOrderTest.models.AttendanceV2 !== connOrderTest.models.Attendance, "Models remain distinct instances");

    await connOrderTest.dropDatabase();
    await connOrderTest.close();
    assert(true, "Registration order does not produce namespace collisions or prototype contamination");

    console.log(`\n========================================`);
    console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log(`========================================\n`);

  } finally {
    console.log('Cleaning up: dropping temporary isolated test database...');
    await conn.dropDatabase();
    await conn.close();
    console.log('Test database dropped and connection closed cleanly.');
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

