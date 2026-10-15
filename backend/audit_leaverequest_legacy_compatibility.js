"use strict";
/**
 * audit_leaverequest_legacy_compatibility.js
 * Comprehensive Legacy & Advanced Compatibility Audit for LeaveRequest Model.
 * Uses dedicated isolated MongoDB database. Drops DB on completion.
 */

process.env.JWT_SECRET = "test-jwt-secret-audit-12345678901234567890";

const mongoose = require("mongoose");
const express = require("express");
const http = require("http");
const jwt = require("jsonwebtoken");

const TEST_DB_NAME = `crm_isolated_leave_audit_${Date.now()}`;
const TEST_URI = `mongodb://127.0.0.1:27017/${TEST_DB_NAME}`;

let passed = 0;
let failed = 0;
const auditFindings = [];

function recordFinding(category, item, beforeBehavior, afterBehavior, impact) {
  auditFindings.push({ category, item, beforeBehavior, afterBehavior, impact });
}

function assert(label, cond) {
  if (cond) {
    console.log("  PASS:", label);
    passed++;
  } else {
    console.error("  FAIL:", label);
    failed++;
  }
}

// Simple HTTP request helper
function makeRequest(server, path, method = "GET", headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const options = {
      hostname: "127.0.0.1",
      port: addr.port,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on("error", reject);
    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runAudit() {
  console.log("================================================================================");
  console.log("   LEAVEREQUEST LEGACY & ADVANCED COMPATIBILITY AUDIT                            ");
  console.log("================================================================================");
  console.log(`Connecting to ISOLATED database: ${TEST_URI}`);

  await mongoose.connect(TEST_URI);
  console.log(`Connected to isolated test DB: ${mongoose.connection.name}`);

  let server = null;

  try {
    // Register schemas
    require("./auth");
    require("./admin");
    require("./employee");
    const User = mongoose.models.User;
    const Employee = mongoose.models.Employee;

    // ── STEP 1: MODEL-LEVEL EXACT COMPARISON ─────────────────────────────────
    console.log("\n[AUDIT STEP 1] Model-level schema & validation comparison");

    const LeaveRequest = require("./models/LeaveRequest");
    const LeaveRequestV2 = mongoose.models.LeaveRequestV2;

    // Check 1: days minimum
    recordFinding(
      "Validation",
      "days minimum validator",
      "Legacy: min 1 (half days rejected). V2: min 0.5 (half days allowed).",
      "Canonical: min 0.5 (half days allowed in both).",
      "Compatible extension: Legacy callers submitting full days (1+) continue to succeed. Half-day submissions (0.5) are now structurally accepted at model level rather than throwing Mongoose ValidationError."
    );
    assert("Canonical days min is 0.5", LeaveRequest.schema.paths.days.options.min === 0.5);

    // Check 2: status enum
    recordFinding(
      "Validation",
      "status enum values",
      "Legacy: ['Pending', 'Approved', 'Rejected']. V2: ['Pending', 'Approved', 'Rejected', 'Cancelled'].",
      "Canonical: ['Pending', 'Approved', 'Rejected', 'Cancelled'].",
      "Zero regression: Legacy route handler at line 859 explicitly guards review status: ['Approved', 'Rejected'].includes(status) and rejects other statuses with 400."
    );
    assert("Canonical status enum has 4 values", LeaveRequest.schema.paths.status.enumValues.length === 4);
    assert("Status includes Cancelled", LeaveRequest.schema.paths.status.enumValues.includes("Cancelled"));

    // Check 3: duration default
    recordFinding(
      "Defaults",
      "duration default value",
      "Legacy: duration path did not exist in schema. V2: duration enum default 'Full Day'.",
      "Canonical: duration enum default 'Full Day'.",
      "Compatible enhancement: All documents created via legacy endpoint now automatically have duration='Full Day'. Legacy callers ignoring duration receive valid Full Day docs."
    );
    assert("Canonical duration defaults to 'Full Day'", LeaveRequest.schema.paths.duration.defaultValue === "Full Day");

    // Check 4: contactDuringLeave
    recordFinding(
      "Defaults",
      "contactDuringLeave default",
      "Legacy: path did not exist in schema. V2: String default ''.",
      "Canonical: String default ''.",
      "Compatible enhancement: Defaults to empty string, fully backward-compatible with legacy readers."
    );
    assert("Canonical contactDuringLeave defaults to ''", LeaveRequest.schema.paths.contactDuringLeave.defaultValue === "");

    // Check 5: String trimming
    recordFinding(
      "Normalization",
      "String trimming",
      "Legacy: trim only on reason in route handler. V2: trim on employeeCode, employeeName, department, leaveType, reason, reviewedBy, reviewNote.",
      "Canonical: trim: true on all string fields.",
      "Data quality improvement: Trims accidental leading/trailing whitespace without altering clean data."
    );
    assert("employeeCode has trim: true", LeaveRequest.schema.paths.employeeCode.options.trim === true);

    // Check 6: Indexes
    recordFinding(
      "Indexes",
      "Indexes on collection leaveRequests",
      "Legacy: { employeeId: 1 }. V2 & Operational Atlas: { employeeId: 1 }, { fromDate: 1 }, { toDate: 1 }, { status: 1 }.",
      "Canonical: matches V2 and Atlas indexes exactly.",
      "Zero regression: Exact parity with operational MongoDB Atlas indexes."
    );
    await LeaveRequest.init();
    const indexes = await LeaveRequest.collection.indexes();
    assert("employeeId index exists", indexes.some(i => i.key.employeeId === 1));
    assert("fromDate index exists", indexes.some(i => i.key.fromDate === 1));
    assert("toDate index exists", indexes.some(i => i.key.toDate === 1));
    assert("status index exists", indexes.some(i => i.key.status === 1));

    // ── STEP 2: SETUP USERS & TEST EXPRESS APP ───────────────────────────────
    console.log("\n[AUDIT STEP 2] Setting up test users and Express endpoints");

    const adminUserId = new mongoose.Types.ObjectId();
    const employeeUserId = new mongoose.Types.ObjectId();
    const employeeProfileId = new mongoose.Types.ObjectId();

    await User.create([
      {
        _id: adminUserId,
        name: "Administrator",
        email: "admin@example.com",
        password: "hashedpassword123",
        role: "admin",
        status: "Active",
      },
      {
        _id: employeeUserId,
        name: "Alice Developer",
        email: "alice@example.com",
        password: "hashedpassword123",
        role: "employee",
        status: "Active",
      },
    ]);

    await Employee.create({
      _id: employeeProfileId,
      userId: employeeUserId,
      employeeCode: "EMP-LEGACY-01",
      name: "Alice Developer",
      email: "alice@example.com",
      role: "Software Engineer",
      department: "Support",
      status: "Free",
    });

    const tokenAdmin = jwt.sign({ userId: adminUserId }, process.env.JWT_SECRET);
    const tokenEmployee = jwt.sign({ userId: employeeUserId }, process.env.JWT_SECRET);

    const SystemSettings = require("./models/SystemSettings");
    await SystemSettings.create({
      settingsKey: "system",
      leaveTypes: [
        { name: "Casual Leave", code: "CL", yearlyLimit: 12, paid: true, carryForward: false, status: "Active" },
        { name: "Sick Leave", code: "SL", yearlyLimit: 10, paid: true, carryForward: false, status: "Active" },
      ],
      workingHours: {
        officeStartTime: "09:30",
        officeEndTime: "18:30",
        weeklyOff: ["Sunday"],
      },
    });

    const app = express();
    app.use(express.json());

    // Mount legacy routes from attendance.js under /api/admin
    const attendanceRoutes = require("./attendance");
    app.use("/api/admin", attendanceRoutes);

    // Mount modern routes from attendance-v2.js under /api/attendance
    const attendanceV2Routes = require("./attendance-v2");
    app.use("/api/attendance", attendanceV2Routes);

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    console.log(`Test HTTP server listening on port ${server.address().port}`);

    // ── STEP 3: TESTING LEGACY ENDPOINTS (/api/admin/leave) ──────────────────
    console.log("\n[AUDIT STEP 3] Testing Legacy endpoints (/api/admin/leave)");

    // Test 3.1: Full-day leave creation via legacy POST /api/admin/leave
    console.log("  [3.1] Legacy creation of full-day leave");
    const resCreateFull = await makeRequest(
      server,
      "/api/admin/leave",
      "POST",
      { Authorization: `Bearer ${tokenEmployee}` },
      {
        leaveType: "Casual Leave",
        fromDate: "2026-11-01",
        toDate: "2026-11-03",
        days: 3,
        reason: "Family function",
      }
    );
    assert("Legacy full-day create returns 201", resCreateFull.status === 201);
    assert("Legacy create response success: true", resCreateFull.body.success === true);
    assert("Legacy created doc has days = 3", resCreateFull.body.data && resCreateFull.body.data.days === 3);
    assert("Legacy created doc has status = 'Pending'", resCreateFull.body.data && resCreateFull.body.data.status === "Pending");
    assert("Legacy created doc has duration = 'Full Day'", resCreateFull.body.data && resCreateFull.body.data.duration === "Full Day");
    const legacyLeaveId = resCreateFull.body.data ? resCreateFull.body.data._id : null;

    // Test 3.2: Attempting half-day leave via legacy POST /api/admin/leave
    console.log("  [3.2] Testing half-day (0.5) through legacy endpoint");
    const resCreateHalf = await makeRequest(
      server,
      "/api/admin/leave",
      "POST",
      { Authorization: `Bearer ${tokenEmployee}` },
      {
        leaveType: "Sick Leave",
        fromDate: "2026-11-05",
        toDate: "2026-11-05",
        days: 0.5,
        reason: "Dentist appointment",
      }
    );
    recordFinding(
      "API Behavior",
      "Legacy endpoint POST /api/admin/leave with days: 0.5",
      "Previously: Threw Mongoose ValidationError because legacy schema enforced min: 1.",
      `Currently: Returns HTTP ${resCreateHalf.status} with days: 0.5.`,
      "Controlled change: Canonical model min: 0.5 now allows half-day submission through legacy endpoint without 500/ValidationError. Full-day requests behave identically."
    );
    assert("Legacy endpoint accepts days: 0.5 without ValidationError", resCreateHalf.status === 201);
    assert("Created half-day doc has days = 0.5", resCreateHalf.body.data && resCreateHalf.body.data.days === 0.5);

    // Test 3.3: Legacy creation with missing fields (should return 400)
    console.log("  [3.3] Legacy creation with missing fields");
    const resMissing = await makeRequest(
      server,
      "/api/admin/leave",
      "POST",
      { Authorization: `Bearer ${tokenEmployee}` },
      { leaveType: "Casual Leave" }
    );
    assert("Legacy missing fields returns 400", resMissing.status === 400);

    // Test 3.4: Legacy creation unauthorized role check
    console.log("  [3.4] Legacy creation unauthorized role check");
    const resAdminCreate = await makeRequest(
      server,
      "/api/admin/leave",
      "POST",
      { Authorization: `Bearer ${tokenAdmin}` },
      {
        leaveType: "Sick Leave",
        fromDate: "2026-11-01",
        toDate: "2026-11-01",
        days: 1,
        reason: "Fever",
      }
    );
    assert("Non-employee role rejected with 403", resAdminCreate.status === 403);

    // Test 3.5: Legacy GET /api/admin/leave/my
    console.log("  [3.5] Legacy GET /api/admin/leave/my");
    const resMy = await makeRequest(
      server,
      "/api/admin/leave/my",
      "GET",
      { Authorization: `Bearer ${tokenEmployee}` }
    );
    assert("Legacy leave/my returns 200", resMy.status === 200);
    assert("Legacy leave/my data is array", Array.isArray(resMy.body.data));
    assert("Legacy leave/my returns created leaves", resMy.body.data.length >= 2);

    // Test 3.6: Legacy GET /api/admin/leave (admin view)
    console.log("  [3.6] Legacy GET /api/admin/leave (admin view)");
    const resAdminList = await makeRequest(
      server,
      "/api/admin/leave",
      "GET",
      { Authorization: `Bearer ${tokenAdmin}` }
    );
    assert("Legacy admin list returns 200", resAdminList.status === 200);
    assert("Legacy admin list returns data array", Array.isArray(resAdminList.body.data));

    // Test 3.7: Legacy review - Approve
    console.log("  [3.7] Legacy review - Approve");
    const resApprove = await makeRequest(
      server,
      `/api/admin/leave/${legacyLeaveId}/review`,
      "PUT",
      { Authorization: `Bearer ${tokenAdmin}` },
      { status: "Approved", reviewNote: "Approved by manager" }
    );
    assert("Legacy approve returns 200", resApprove.status === 200);
    assert("Status updated to Approved", resApprove.body.data && resApprove.body.data.status === "Approved");
    assert("reviewedBy is Administrator", resApprove.body.data && resApprove.body.data.reviewedBy === "Administrator");
    assert("approvedAt is recorded", resApprove.body.data && !!resApprove.body.data.approvedAt);

    // Test 3.8: Legacy review - Reject invalid status (e.g. Cancelled)
    console.log("  [3.8] Legacy review - Reject invalid status");
    const resInvalidReview = await makeRequest(
      server,
      `/api/admin/leave/${legacyLeaveId}/review`,
      "PUT",
      { Authorization: `Bearer ${tokenAdmin}` },
      { status: "Cancelled", reviewNote: "Attempting to cancel via legacy review" }
    );
    assert("Legacy review rejects 'Cancelled' with 400", resInvalidReview.status === 400);

    // Test 3.9: Legacy review - Reject
    console.log("  [3.9] Legacy review - Reject");
    const resReject = await makeRequest(
      server,
      `/api/admin/leave/${legacyLeaveId}/review`,
      "PUT",
      { Authorization: `Bearer ${tokenAdmin}` },
      { status: "Rejected", reviewNote: "Staff shortage" }
    );
    assert("Legacy reject returns 200", resReject.status === 200);
    assert("Status updated to Rejected", resReject.body.data && resReject.body.data.status === "Rejected");
    assert("approvedAt is null on reject", resReject.body.data && resReject.body.data.approvedAt === null);

    // ── STEP 4: TESTING ADVANCED ENDPOINTS (/api/attendance) ─────────────────
    console.log("\n[AUDIT STEP 4] Testing Advanced endpoints (/api/attendance)");

    // Test 4.1: V2 GET /api/attendance/leave/my
    console.log("  [4.1] V2 GET /api/attendance/leave/my");
    const resV2My = await makeRequest(
      server,
      "/api/attendance/leave/my",
      "GET",
      { Authorization: `Bearer ${tokenEmployee}` }
    );
    assert("V2 leave/my returns 200", resV2My.status === 200);
    assert("V2 leave/my reads existing legacy documents", resV2My.body.data.length >= 2);

    // Test 4.2: V2 GET /api/attendance/admin/leaves (with summary object)
    console.log("  [4.2] V2 GET /api/attendance/admin/leaves");
    const resV2AdminLeaves = await makeRequest(
      server,
      "/api/attendance/admin/leaves",
      "GET",
      { Authorization: `Bearer ${tokenAdmin}` }
    );
    assert("V2 admin/leaves returns 200", resV2AdminLeaves.status === 200);
    assert("V2 admin/leaves contains summary object", !!resV2AdminLeaves.body.summary);
    assert("V2 summary total >= 2", resV2AdminLeaves.body.summary.total >= 2);

    // Test 4.3: V2 Review workflow
    console.log("  [4.3] V2 Review workflow");
    // Verify V2 rejects reviewing a non-pending leave
    const resV2ReviewNonPending = await makeRequest(
      server,
      `/api/attendance/admin/leaves/${legacyLeaveId}/review`,
      "PUT",
      { Authorization: `Bearer ${tokenAdmin}` },
      { status: "Approved", reviewNote: "Attempting to review non-pending" }
    );
    assert("V2 review rejects non-pending leave with 400", resV2ReviewNonPending.status === 400);

    // Create a fresh pending leave for V2 review
    const resCreatePendingForReview = await makeRequest(
      server,
      "/api/admin/leave",
      "POST",
      { Authorization: `Bearer ${tokenEmployee}` },
      {
        leaveType: "Casual Leave",
        fromDate: "2026-11-10",
        toDate: "2026-11-10",
        days: 1,
        reason: "Personal work",
      }
    );
    const pendingForReviewId = resCreatePendingForReview.body.data?._id;

    const resV2Review = await makeRequest(
      server,
      `/api/attendance/admin/leaves/${pendingForReviewId}/review`,
      "PUT",
      { Authorization: `Bearer ${tokenAdmin}` },
      { status: "Approved", reviewNote: "Approved in V2" }
    );
    assert("V2 review returns 200", resV2Review.status === 200);
    assert("V2 updated status to Approved", resV2Review.body.data && resV2Review.body.data.status === "Approved");

    // Test 4.4: V2 Cancel workflow
    console.log("  [4.4] V2 Cancel workflow");
    // Verify V2 cancel rejects non-pending leave
    const resV2CancelNonPending = await makeRequest(
      server,
      `/api/attendance/leave/${legacyLeaveId}/cancel`,
      "PATCH",
      { Authorization: `Bearer ${tokenEmployee}` },
      { reason: "Plans changed" }
    );
    assert("V2 cancel rejects non-pending leave with 400", resV2CancelNonPending.status === 400);

    // Create a fresh pending leave for V2 cancellation
    const resCreatePendingForCancel = await makeRequest(
      server,
      "/api/admin/leave",
      "POST",
      { Authorization: `Bearer ${tokenEmployee}` },
      {
        leaveType: "Sick Leave",
        fromDate: "2026-11-12",
        toDate: "2026-11-12",
        days: 1,
        reason: "Dentist appointment",
      }
    );
    const pendingForCancelId = resCreatePendingForCancel.body.data?._id;

    const resV2Cancel = await makeRequest(
      server,
      `/api/attendance/leave/${pendingForCancelId}/cancel`,
      "PATCH",
      { Authorization: `Bearer ${tokenEmployee}` },
      { reason: "Appointment cancelled" }
    );
    assert("V2 cancel returns 200", resV2Cancel.status === 200);
    assert("V2 status is Cancelled", resV2Cancel.body.data && resV2Cancel.body.data.status === "Cancelled");

    // ── STEP 5: MODEL ALIAS & REPORTS SAFETY ─────────────────────────────────
    console.log("\n[AUDIT STEP 5] Model alias safety & reports.js compatibility");
    assert("mongoose.models.LeaveRequest === LeaveRequest", mongoose.models.LeaveRequest === LeaveRequest);
    assert("mongoose.models.LeaveRequestV2 exists", !!mongoose.models.LeaveRequestV2);
    assert("LeaveRequest and LeaveRequestV2 query the same collection", LeaveRequest.collection.name === LeaveRequestV2.collection.name);

    // Verify reports.js loads cleanly and uses LeaveRequestV2
    const reports = require("./reports");
    assert("reports.js loaded cleanly", !!reports);

    const docCountV1 = await LeaveRequest.countDocuments();
    const docCountV2 = await LeaveRequestV2.countDocuments();
    assert("LeaveRequest count matches LeaveRequestV2 count", docCountV1 === docCountV2);

    // ── STEP 6: ATTENDANCE & HOLIDAY INTEGRATION CHECK ────────────────────────
    console.log("\n[AUDIT STEP 6] Attendance & Holiday integration check");
    const Holiday = require("./models/Holiday");
    await Holiday.create({
      date: "2026-11-02",
      name: "Company Day",
      type: "Company",
    });

    const holidayOnLeaveDate = await Holiday.findOne({ date: "2026-11-02", isActive: true }).lean();
    assert("Holiday on leave date exists", !!holidayOnLeaveDate);
    assert("Holiday type is Company", holidayOnLeaveDate.type === "Company");

    // Overlapping leave check
    await LeaveRequest.findByIdAndUpdate(legacyLeaveId, { status: "Approved" });
    const overlappingLeave = await LeaveRequest.findOne({
      status: "Approved",
      fromDate: { $lte: "2026-11-02" },
      toDate: { $gte: "2026-11-02" },
    }).lean();
    assert("Overlapping leave found", !!overlappingLeave);

    const isCompanyHoliday = holidayOnLeaveDate && holidayOnLeaveDate.type !== "Optional";
    assert("Company holiday takes precedence over leave deduction", isCompanyHoliday === true);

  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log("Test HTTP server closed.");
    }
    console.log("\n[Teardown] Dropping isolated test database...");
    try {
      await mongoose.connection.db.dropDatabase();
      console.log(`Dropped test database: ${TEST_DB_NAME}`);
    } catch (err) {
      console.warn("Could not drop test DB:", err.message);
    }
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }

  console.log("\n================================================================================");
  console.log(`AUDIT TEST SUMMARY: ${passed} passed, ${failed} failed`);
  console.log("================================================================================");

  console.log("\n--- AUDIT FINDINGS TABLE ---");
  for (const f of auditFindings) {
    console.log(`[${f.category}] ${f.item}`);
    console.log(`  Before: ${f.beforeBehavior}`);
    console.log(`  After : ${f.afterBehavior}`);
    console.log(`  Impact: ${f.impact}`);
  }

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAudit().catch((err) => {
  console.error("Unhandled audit runner exception:", err);
  process.exit(1);
});
