"use strict";
/**
 * test_leaverequest_isolated.js
 * Isolated functional integration test suite for LeaveRequest model.
 * Connects to a dedicated temporary local database and drops it on completion.
 */

const mongoose = require("mongoose");

const TEST_DB_NAME = `crm_isolated_leaverequest_test_${Date.now()}`;
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
  console.log("   LEAVEREQUEST MODEL ISOLATED FUNCTIONAL INTEGRATION TEST                       ");
  console.log("================================================================================");
  console.log(`Connecting to ISOLATED database: ${TEST_URI}`);
  console.log(`Target Database Name: ${TEST_DB_NAME}`);

  await mongoose.connect(TEST_URI);
  console.log(`Connected successfully. Active DB: ${mongoose.connection.name}`);

  try {
    const LeaveRequest = require("./models/LeaveRequest");
    const LeaveRequestV2 = mongoose.models.LeaveRequestV2;

    // ── 1. Model registration & collection name ──────────────────────────────
    console.log("\n[1] Model registration & collection name");
    assert("Model name is LeaveRequest", LeaveRequest.modelName === "LeaveRequest");
    assert("Collection name is leaveRequests", LeaveRequest.collection.name === "leaveRequests");
    assert("LeaveRequestV2 alias exists", !!LeaveRequestV2);
    assert("LeaveRequestV2 collection is leaveRequests", LeaveRequestV2.collection.name === "leaveRequests");

    // ── 2. Index building & verification ─────────────────────────────────────
    console.log("\n[2] Index building & verification");
    await LeaveRequest.init();
    const mongoIndexes = await LeaveRequest.collection.indexes();
    console.log("  Built MongoDB indexes:", JSON.stringify(mongoIndexes.map(i => ({ key: i.key, name: i.name }))));

    assert("employeeId index exists in MongoDB", mongoIndexes.some(idx => idx.key.employeeId === 1));
    assert("fromDate index exists in MongoDB", mongoIndexes.some(idx => idx.key.fromDate === 1));
    assert("toDate index exists in MongoDB", mongoIndexes.some(idx => idx.key.toDate === 1));
    assert("status index exists in MongoDB", mongoIndexes.some(idx => idx.key.status === 1));

    // ── 3. Schema validation: required fields ────────────────────────────────
    console.log("\n[3] Schema validation: required fields");
    let missingErr = null;
    try {
      await LeaveRequest.create({});
    } catch (err) {
      missingErr = err;
    }
    assert("Fails validation on empty doc", !!missingErr && missingErr.name === "ValidationError");
    assert("employeeId is required error", !!missingErr.errors.employeeId);
    assert("employeeCode is required error", !!missingErr.errors.employeeCode);
    assert("employeeName is required error", !!missingErr.errors.employeeName);
    assert("leaveType is required error", !!missingErr.errors.leaveType);
    assert("fromDate is required error", !!missingErr.errors.fromDate);
    assert("toDate is required error", !!missingErr.errors.toDate);
    assert("days is required error", !!missingErr.errors.days);

    // ── 4. Validation: minimum days & invalid enums ──────────────────────────
    console.log("\n[4] Validation: minimum days & invalid enums");
    const mockEmp1Id = new mongoose.Types.ObjectId();
    const mockEmp2Id = new mongoose.Types.ObjectId();

    let invalidDaysErr = null;
    try {
      await LeaveRequest.create({
        employeeId: mockEmp1Id,
        employeeCode: "EMP101",
        employeeName: "Alice Developer",
        leaveType: "Casual Leave",
        fromDate: "2026-10-15",
        toDate: "2026-10-15",
        days: 0.25, // Less than min 0.5
      });
    } catch (err) {
      invalidDaysErr = err;
    }
    assert("days < 0.5 rejected by min validator", !!invalidDaysErr && !!invalidDaysErr.errors.days);

    let invalidStatusErr = null;
    try {
      await LeaveRequest.create({
        employeeId: mockEmp1Id,
        employeeCode: "EMP101",
        employeeName: "Alice Developer",
        leaveType: "Casual Leave",
        fromDate: "2026-10-15",
        toDate: "2026-10-15",
        days: 1,
        status: "UnknownStatus",
      });
    } catch (err) {
      invalidStatusErr = err;
    }
    assert("Invalid status rejected by enum validator", !!invalidStatusErr && !!invalidStatusErr.errors.status);

    let invalidDurationErr = null;
    try {
      await LeaveRequest.create({
        employeeId: mockEmp1Id,
        employeeCode: "EMP101",
        employeeName: "Alice Developer",
        leaveType: "Casual Leave",
        fromDate: "2026-10-15",
        toDate: "2026-10-15",
        days: 1,
        duration: "Quarter Day",
      });
    } catch (err) {
      invalidDurationErr = err;
    }
    assert("Invalid duration rejected by enum validator", !!invalidDurationErr && !!invalidDurationErr.errors.duration);

    // ── 5. Standard full-day leave creation & defaults ───────────────────────
    console.log("\n[5] Standard full-day leave creation & defaults");
    const leave1 = await LeaveRequest.create({
      employeeId: mockEmp1Id,
      employeeCode: "  emp101  ",
      employeeName: "  Alice Developer  ",
      department: "  Engineering  ",
      leaveType: "  Casual Leave  ",
      fromDate: "2026-10-20",
      toDate: "2026-10-22",
      days: 3,
      reason: "  Personal family function  ",
    });

    assert("Leave 1 created with _id", !!leave1._id);
    assert("employeeCode trimmed", leave1.employeeCode === "emp101");
    assert("employeeName trimmed", leave1.employeeName === "Alice Developer");
    assert("department trimmed", leave1.department === "Engineering");
    assert("leaveType trimmed", leave1.leaveType === "Casual Leave");
    assert("reason trimmed", leave1.reason === "Personal family function");
    assert("status defaults to Pending", leave1.status === "Pending");
    assert("duration defaults to Full Day", leave1.duration === "Full Day");
    assert("contactDuringLeave defaults to empty string", leave1.contactDuringLeave === "");
    assert("reviewedBy defaults to empty string", leave1.reviewedBy === "");
    assert("reviewNote defaults to empty string", leave1.reviewNote === "");
    assert("approvedAt defaults to null", leave1.approvedAt === null);
    assert("appliedAt is Date", leave1.appliedAt instanceof Date);
    assert("createdAt is populated", !!leave1.createdAt);
    assert("updatedAt is populated", !!leave1.updatedAt);
    assert("__v is present", leave1.__v !== undefined);

    // ── 6. Half-day leave creation ───────────────────────────────────────────
    console.log("\n[6] Half-day leave creation");
    const halfDayLeave = await LeaveRequest.create({
      employeeId: mockEmp1Id,
      employeeCode: "EMP101",
      employeeName: "Alice Developer",
      department: "Engineering",
      leaveType: "Sick Leave",
      fromDate: "2026-10-25",
      toDate: "2026-10-25",
      days: 0.5,
      duration: "First Half",
      reason: "Dentist appointment morning",
      contactDuringLeave: "9876543210",
    });

    assert("Half-day leave created with 0.5 days", halfDayLeave.days === 0.5);
    assert("duration is First Half", halfDayLeave.duration === "First Half");
    assert("contactDuringLeave stored", halfDayLeave.contactDuringLeave === "9876543210");

    // ── 7. Second employee leave creation (for cross-employee testing) ───────
    console.log("\n[7] Second employee leave creation");
    const leave2 = await LeaveRequest.create({
      employeeId: mockEmp2Id,
      employeeCode: "EMP202",
      employeeName: "Bob Designer",
      department: "Design",
      leaveType: "Earned Leave",
      fromDate: "2026-10-20",
      toDate: "2026-10-21",
      days: 2,
      reason: "Vacation",
    });
    assert("Leave 2 for second employee created", !!leave2._id);

    // ── 8. Cross-employee query isolation ────────────────────────────────────
    console.log("\n[8] Cross-employee query isolation");
    const emp1Leaves = await LeaveRequest.find({ employeeId: mockEmp1Id }).sort({ appliedAt: -1 }).lean();
    assert("Employee 1 query returns exactly 2 leaves", emp1Leaves.length === 2);
    assert("Employee 1 query contains ZERO Employee 2 leaves", !emp1Leaves.some(l => String(l.employeeId) === String(mockEmp2Id)));

    const emp2Leaves = await LeaveRequest.find({ employeeId: mockEmp2Id }).lean();
    assert("Employee 2 query returns exactly 1 leave", emp2Leaves.length === 1);
    assert("Employee 2 leave belongs to Bob", emp2Leaves[0].employeeName === "Bob Designer");

    // ── 9. Pending leaves listing (Admin view) ───────────────────────────────
    console.log("\n[9] Pending leaves listing");
    const pendingLeaves = await LeaveRequest.find({ status: "Pending" }).sort({ appliedAt: -1 }).lean();
    assert("Pending query returns 3 pending leaves across all employees", pendingLeaves.length === 3);

    // ── 10. Approval workflow ────────────────────────────────────────────────
    console.log("\n[10] Approval workflow");
    const approvedAtTime = new Date();
    leave1.status = "Approved";
    leave1.reviewedBy = "Manager John";
    leave1.reviewNote = "Approved. Ensure task handover.";
    leave1.approvedAt = approvedAtTime;
    await leave1.save();

    const verifiedApproved = await LeaveRequest.findById(leave1._id).lean();
    assert("Status updated to Approved", verifiedApproved.status === "Approved");
    assert("reviewedBy updated", verifiedApproved.reviewedBy === "Manager John");
    assert("reviewNote updated", verifiedApproved.reviewNote === "Approved. Ensure task handover.");
    assert("approvedAt recorded", !!verifiedApproved.approvedAt);
    assert("updatedAt is updated", verifiedApproved.updatedAt > verifiedApproved.createdAt);

    // ── 11. Rejection workflow ───────────────────────────────────────────────
    console.log("\n[11] Rejection workflow");
    halfDayLeave.status = "Rejected";
    halfDayLeave.reviewedBy = "Manager John";
    halfDayLeave.reviewNote = "Sprint release on this morning. Please reschedule.";
    halfDayLeave.approvedAt = null;
    await halfDayLeave.save();

    const verifiedRejected = await LeaveRequest.findById(halfDayLeave._id).lean();
    assert("Status updated to Rejected", verifiedRejected.status === "Rejected");
    assert("approvedAt remains null on rejection", verifiedRejected.approvedAt === null);
    assert("reviewNote preserved", verifiedRejected.reviewNote === "Sprint release on this morning. Please reschedule.");

    // ── 12. Cancellation workflow (Cancelled by employee) ────────────────────
    console.log("\n[12] Cancellation workflow");
    leave2.status = "Cancelled";
    leave2.reviewNote = "Cancelled by employee.";
    await leave2.save();

    const verifiedCancelled = await LeaveRequest.findById(leave2._id).lean();
    assert("Status updated to Cancelled", verifiedCancelled.status === "Cancelled");

    // ── 13. Date range lookup (Attendance & Reports integration) ─────────────
    console.log("\n[13] Date range lookup simulation");
    // Range query used in attendance reports (lines 5384-5396 & 6443)
    const activeLeavesInRange = await LeaveRequest.find({
      status: "Approved",
      fromDate: { $lte: "2026-10-21" },
      toDate: { $gte: "2026-10-21" },
    }).lean();

    assert("Found approved leave spanning 2026-10-21", activeLeavesInRange.length === 1);
    assert("Found leave is leave1", String(activeLeavesInRange[0]._id) === String(leave1._id));

    // Non-matching range
    const noLeaves = await LeaveRequest.find({
      status: "Approved",
      fromDate: { $lte: "2026-10-10" },
      toDate: { $gte: "2026-10-10" },
    }).lean();
    assert("No approved leaves for unrequested date", noLeaves.length === 0);

    // ── 14. Compatibility via LeaveRequestV2 alias ───────────────────────────
    console.log("\n[14] Compatibility via LeaveRequestV2 alias");
    const v2Docs = await LeaveRequestV2.find({}).lean();
    assert("LeaveRequestV2 reads the exact same documents", v2Docs.length === 3);

    const v2Single = await LeaveRequestV2.findById(leave1._id).lean();
    assert("LeaveRequestV2 reads approved leave document", v2Single && v2Single.status === "Approved");

    // ── 15. API response contract parity ─────────────────────────────────────
    console.log("\n[15] API response contract parity");
    const sample = verifiedApproved;
    assert("API doc has string _id", typeof String(sample._id) === "string");
    assert("API doc has employeeId", !!sample.employeeId);
    assert("API doc has employeeCode", sample.employeeCode === "emp101");
    assert("API doc has employeeName", sample.employeeName === "Alice Developer");
    assert("API doc has department", sample.department === "Engineering");
    assert("API doc has leaveType", sample.leaveType === "Casual Leave");
    assert("API doc has fromDate (YYYY-MM-DD)", /^\d{4}-\d{2}-\d{2}$/.test(sample.fromDate));
    assert("API doc has toDate (YYYY-MM-DD)", /^\d{4}-\d{2}-\d{2}$/.test(sample.toDate));
    assert("API doc has numeric days", typeof sample.days === "number");
    assert("API doc has duration string", typeof sample.duration === "string");
    assert("API doc has status string", typeof sample.status === "string");
    assert("API doc has reviewedBy string", typeof sample.reviewedBy === "string");
    assert("API doc has reviewNote string", typeof sample.reviewNote === "string");
    assert("API doc has appliedAt Date", sample.appliedAt instanceof Date);
    assert("API doc has approvedAt Date", sample.approvedAt instanceof Date);
    assert("API doc has createdAt Date", sample.createdAt instanceof Date);
    assert("API doc has updatedAt Date", sample.updatedAt instanceof Date);

  } finally {
    // ── Teardown ─────────────────────────────────────────────────────────────
    console.log("\n[Teardown] Cleaning up isolated database...");
    try {
      await mongoose.connection.db.dropDatabase();
      console.log(`Dropped test database: ${TEST_DB_NAME}`);
    } catch (dropErr) {
      console.warn("Could not drop test database:", dropErr.message);
    }
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }

  console.log("\n================================================================================");
  console.log(`ISOLATED INTEGRATION TEST SUMMARY: ${passed} passed, ${failed} failed`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runIsolatedTests().catch(err => {
  console.error("Unhandled test runner exception:", err);
  process.exit(1);
});
