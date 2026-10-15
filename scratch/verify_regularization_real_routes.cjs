"use strict";

const http = require("http");
const path = require("path");

// Load backend dependencies
const dotenv = require(path.join(__dirname, "../backend/node_modules/dotenv"));
dotenv.config({ path: path.join(__dirname, "../backend/.env") });

const mongoose = require(path.join(__dirname, "../backend/node_modules/mongoose"));
const express = require(path.join(__dirname, "../backend/node_modules/express"));
const jwt = require(path.join(__dirname, "../backend/node_modules/jsonwebtoken"));

const TEST_DB_NAME = `crm_audit_regularization_hotfix_${Date.now()}`;
const TEST_MONGO_URI = `mongodb://127.0.0.1:27017/${TEST_DB_NAME}`;
const JWT_SECRET = process.env.JWT_SECRET || "crm_jwt_secret_dev_key_12345";
process.env.JWT_SECRET = JWT_SECRET;

// Ensure NO global.policy workaround is present
delete global.policy;

let passed = 0;
let failed = 0;

function assert(description, condition) {
  if (condition) {
    console.log(`  [PASS] ${description}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${description}`);
    failed++;
  }
}

function doRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        let parsed = null;
        try {
          parsed = JSON.parse(body);
        } catch (e) {
          parsed = body;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });
    req.on("error", reject);
    if (postData) {
      req.write(typeof postData === "string" ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runHotfixVerification() {
  console.log("================================================================================");
  console.log("  HOTFIX VERIFICATION: REAL ATTENDANCE REGULARIZATION ROUTE");
  console.log("================================================================================");

  // STEP 6: Fail closed if database points to operational Atlas or remote host
  if (!TEST_MONGO_URI.includes("127.0.0.1") && !TEST_MONGO_URI.includes("localhost")) {
    throw new Error(`SECURITY ALERT: Attempting to connect to non-local MongoDB URI: ${TEST_MONGO_URI}`);
  }

  // STEP 4: Confirm zero global.policy workaround
  assert("No global.policy variable exists in global scope", global.policy === undefined);

  console.log(`[Setup] Connecting to isolated local database: ${TEST_MONGO_URI}`);
  await mongoose.connect(TEST_MONGO_URI);
  console.log(`[Connected] Host: ${mongoose.connection.host}, DB Name: ${mongoose.connection.name}`);
  assert("Connected strictly to 127.0.0.1 / localhost", mongoose.connection.host === "127.0.0.1" || mongoose.connection.host === "localhost");
  assert("Database name is dynamic isolated test name", mongoose.connection.name === TEST_DB_NAME);

  let server;

  try {
    // 1. Load SystemSettings model
    const SystemSettings = require(path.join(__dirname, "../backend/models/SystemSettings"));

    // 2. Load auth module to register User model
    require(path.join(__dirname, "../backend/auth"));
    const User = mongoose.models.User;
    assert("User model registered via backend/auth", Boolean(User));

    // 3. Load employee module to register Employee model
    require(path.join(__dirname, "../backend/employee"));
    const Employee = mongoose.models.Employee;
    assert("Employee model registered via backend/employee", Boolean(Employee));

    // 4. Load real production attendance-v2 router
    const attendanceV2Router = require(path.join(__dirname, "../backend/attendance-v2"));
    assert("backend/attendance-v2 router successfully required", typeof attendanceV2Router === "function");

    const AttendanceRegularization = require(path.join(__dirname, "../backend/models/AttendanceRegularization"));
    assert("AttendanceRegularization model centralized require", Boolean(AttendanceRegularization));

    const AttendanceV2 = mongoose.models.AttendanceV2;
    assert("AttendanceV2 model available", Boolean(AttendanceV2));

    // 5. Seed test data
    console.log("\n[Setup] Seeding test database with system settings (Policy Config 1: Sunday-only off)...");
    const sysSettings = await SystemSettings.create({
      settingsKey: "system",
      workingHours: {
        officeStartTime: "10:00",
        officeEndTime: "18:00",
        lateAfterMinutes: 15,
        fullDayHours: 8,
        halfDayHours: 4,
        weeklyOff: ["Sunday"],
      },
    });

    const adminUser = await User.create({
      name: "Admin Auditor",
      email: `admin_${Date.now()}@test.com`,
      password: "hashed_dummy_password",
      role: "admin",
      status: "Active",
    });

    const emp1User = await User.create({
      name: "Alice Developer",
      email: `alice_${Date.now()}@test.com`,
      password: "hashed_dummy_password",
      role: "employee",
      status: "Active",
    });

    const emp2User = await User.create({
      name: "Bob Designer",
      email: `bob_${Date.now()}@test.com`,
      password: "hashed_dummy_password",
      role: "employee",
      status: "Active",
    });

    const emp1Profile = await Employee.create({
      userId: emp1User._id,
      name: "Alice Developer",
      email: `alice_${Date.now()}@test.com`,
      employeeCode: "EMP001",
      department: "Development",
      role: "Software Engineer",
      joiningDate: "2026-01-01",
      status: "Free",
    });

    const emp2Profile = await Employee.create({
      userId: emp2User._id,
      name: "Bob Designer",
      email: `bob_${Date.now()}@test.com`,
      employeeCode: "EMP002",
      department: "Support",
      role: "Support Engineer",
      joiningDate: "2026-01-01",
      status: "Free",
    });

    console.log(`Seeded Admin User: ${adminUser._id} (role: ${adminUser.role})`);
    console.log(`Seeded Emp1: User=${emp1User._id}, Employee=${emp1Profile._id} (${emp1Profile.employeeCode})`);
    console.log(`Seeded Emp2: User=${emp2User._id}, Employee=${emp2Profile._id} (${emp2Profile.employeeCode})`);

    // 6. Generate JWTs
    const adminToken = jwt.sign({ userId: adminUser._id }, JWT_SECRET, { expiresIn: "1h" });
    const emp1Token = jwt.sign({ userId: emp1User._id }, JWT_SECRET, { expiresIn: "1h" });
    const emp2Token = jwt.sign({ userId: emp2User._id }, JWT_SECRET, { expiresIn: "1h" });

    // 7. Mount REAL Express Application matching server.js mount path:
    // server.js lines 242-245: app.use("/api/attendance", attendanceV2Routes);
    const app = express();
    app.use(express.json());
    app.use("/api/attendance", attendanceV2Router);

    // Global error handler matching server.js lines 1984-2060
    app.use((error, req, res, next) => {
      if (res.headersSent) return next(error);
      return res.status(error.statusCode || error.status || 500).json({
        success: false,
        message: error.message || "Internal server error.",
      });
    });

    server = await new Promise((resolve) => {
      const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });
    const port = server.address().port;
    console.log(`[Express] Real production attendance router listening on http://127.0.0.1:${port}/api/attendance\n`);

    // =========================================================================
    // SECTION 1: AUTHENTICATION AND AUTHORIZATION
    // =========================================================================
    console.log("--- Section 1: Authentication and Authorization Verification ---");

    // 1.1 Unauthenticated request rejected with 401 AUTH_REQUIRED
    const unauthRes = await doRequest({
      hostname: "127.0.0.1",
      port,
      path: "/api/attendance/regularization/my",
      method: "GET",
    });
    assert("Unauthenticated GET /api/attendance/regularization/my returns 401", unauthRes.status === 401);
    assert("Unauthenticated code is AUTH_REQUIRED", unauthRes.body.code === "AUTH_REQUIRED");

    // 1.2 Admin attempting to submit employee regularization returns 403 (findEmployee requires role: employee)
    const adminSubmitRes = await doRequest(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/attendance/regularization",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        date: "2026-08-03",
        requestType: "Absent Correction",
        requestedLoginTime: "10:00",
        requestedLogoutTime: "18:00",
        reason: "Admin trying to submit",
      }
    );
    assert("Admin account submitting employee regularization returns 403", adminSubmitRes.status === 403);
    assert("Message states Employee account is required", adminSubmitRes.body.message === "Employee account is required.");

    // 1.3 Employee attempting to access admin list returns 403
    const empAdminListRes = await doRequest({
      hostname: "127.0.0.1",
      port,
      path: "/api/attendance/admin/regularizations",
      method: "GET",
      headers: {
        Authorization: `Bearer ${emp1Token}`,
      },
    });
    assert("Employee accessing GET /api/attendance/admin/regularizations returns 403", empAdminListRes.status === 403);
    assert("Message states Admin account is required", empAdminListRes.body.message === "Admin account is required.");

    // =========================================================================
    // SECTION 2: INPUT VALIDATION PRESERVATION
    // =========================================================================
    console.log("\n--- Section 2: Input Validation Rules Preservation ---");

    // 2.1 Missing required date / requestType / reason
    const missingDateRes = await doRequest(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/attendance/regularization",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${emp1Token}`,
        },
      },
      {
        date: "",
        requestType: "Absent Correction",
        reason: "Valid reason",
      }
    );
    assert("Missing date returns 400", missingDateRes.status === 400);

    const missingReasonRes = await doRequest(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/attendance/regularization",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${emp1Token}`,
        },
      },
      {
        date: "2026-08-03",
        requestType: "Absent Correction",
        reason: "   ", // whitespace only
      }
    );
    assert("Missing / whitespace reason returns 400", missingReasonRes.status === 400);

    // 2.2 Invalid date format (not YYYY-MM-DD)
    const badDateFormatRes = await doRequest(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/attendance/regularization",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${emp1Token}`,
        },
      },
      {
        date: "03-08-2026",
        requestType: "Absent Correction",
        requestedLoginTime: "10:00",
        requestedLogoutTime: "18:00",
        reason: "Date format test",
      }
    );
    assert("Invalid date format returns 400", badDateFormatRes.status === 400);
    assert("Message states YYYY-MM-DD format required", badDateFormatRes.body.message.includes("YYYY-MM-DD"));

    // 2.3 Future date rejected
    const futureRes = await doRequest(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/attendance/regularization",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${emp1Token}`,
        },
      },
      {
        date: "2029-12-31",
        requestType: "Absent Correction",
        requestedLoginTime: "10:00",
        requestedLogoutTime: "18:00",
        reason: "Future date attempt",
      }
    );
    assert("Future date returns 400", futureRes.status === 400);
    assert("Message states future attendance cannot be corrected", futureRes.body.message.includes("Future attendance cannot be corrected"));

    // 2.4 Date before joining date rejected
    const beforeJoiningRes = await doRequest(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/attendance/regularization",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${emp1Token}`,
        },
      },
      {
        date: "2025-12-15", // Joining is 2026-01-01
        requestType: "Absent Correction",
        requestedLoginTime: "10:00",
        requestedLogoutTime: "18:00",
        reason: "Before joining",
      }
    );
    assert("Date before joining date returns 400", beforeJoiningRes.status === 400);
    assert("Message mentions joining date", beforeJoiningRes.body.message.includes("joining date"));

    // 2.5 Inverted login/logout time rejected
    const badTimeOrderRes = await doRequest(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/attendance/regularization",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${emp1Token}`,
        },
      },
      {
        date: "2026-08-03",
        requestType: "Absent Correction",
        requestedLoginTime: "18:00",
        requestedLogoutTime: "10:00",
        reason: "Inverted time",
      }
    );
    assert("Logout time before login time returns 400", badTimeOrderRes.status === 400);
    assert("Message states logout must be after login", badTimeOrderRes.body.message.includes("after requested login time"));

    // =========================================================================
    // SECTION 3: WEEKLY-OFF POLICY CONFIGURATION TESTING (TWO CONFIGURATIONS)
    // =========================================================================
    console.log("\n--- Section 3: Dynamic Weekly-Off Policy Testing (Two Configurations) ---");

    // CONFIGURATION 1: weeklyOff = ["Sunday"]
    console.log("[Policy Config 1] Testing with weeklyOff = ['Sunday']...");
    // 2026-08-02 is Sunday -> Must be rejected as weekly off
    const sundayRes = await doRequest(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/attendance/regularization",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${emp1Token}`,
        },
      },
      {
        date: "2026-08-02", // Sunday
        requestType: "Absent Correction",
        requestedLoginTime: "10:00",
        requestedLogoutTime: "18:00",
        reason: "Sunday work",
      }
    );
    assert("[Config 1] Sunday returns 400 on weeklyOff=['Sunday']", sundayRes.status === 400);
    assert("[Config 1] Message states not required on weekly off", sundayRes.body.message.includes("weekly off"));

    // CONFIGURATION 2: Update SystemSettings to weeklyOff = ["Saturday", "Sunday"]
    console.log("[Policy Config 2] Updating SystemSettings to weeklyOff = ['Saturday', 'Sunday']...");
    await SystemSettings.updateOne(
      { settingsKey: "system" },
      { $set: { "workingHours.weeklyOff": ["Saturday", "Sunday"] } }
    );

    // 2026-08-08 is Saturday -> Under Config 2, must NOW be rejected as weekly off!
    const saturdayRes = await doRequest(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/attendance/regularization",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${emp1Token}`,
        },
      },
      {
        date: "2026-08-08", // Saturday
        requestType: "Absent Correction",
        requestedLoginTime: "10:00",
        requestedLogoutTime: "18:00",
        reason: "Saturday work attempt",
      }
    );
    assert("[Config 2] Saturday returns 400 on weeklyOff=['Saturday', 'Sunday']", saturdayRes.status === 400);
    assert("[Config 2] Message states not required on weekly off", saturdayRes.body.message.includes("weekly off"));

    // Revert SystemSettings back to standard Sunday-only for remainder of test
    await SystemSettings.updateOne(
      { settingsKey: "system" },
      { $set: { "workingHours.weeklyOff": ["Sunday"] } }
    );

    // =========================================================================
    // SECTION 4: VALID SUBMISSION & HOTFIX PROOF (NO 500, STATUS PENDING)
    // =========================================================================
    console.log("\n--- Section 4: Hotfix Verification on Valid Submission ---");

    // Confirm that global.policy is STILL undefined
    assert("global.policy remains completely undefined", global.policy === undefined);

    // Submit for Monday 2026-08-03 (past valid workday)
    // Pass spoofed employee details to verify anti-impersonation
    const validSubmitRes = await doRequest(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/attendance/regularization",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${emp1Token}`,
        },
      },
      {
        employeeId: emp2Profile._id.toString(), // SPOOF ATTEMPT: pointing to Bob
        employeeCode: "EMP999_SPOOFED",         // SPOOF ATTEMPT
        employeeName: "Bob The Impersonated",   // SPOOF ATTEMPT
        date: "2026-08-03",                     // Monday
        requestType: "Absent Correction",
        requestedLoginTime: "10:00",
        requestedLogoutTime: "18:30",
        reason: "Network power outage during day",
      }
    );

    // HOTFIX VERIFICATION CORE: Must return 201 Created (NOT 500 Internal Server Error!)
    assert("HOTFIX SUCCESS: Valid submission returns 201 (NOT 500!)", validSubmitRes.status === 201);
    assert("Response success is true", validSubmitRes.body.success === true);

    const createdReq = validSubmitRes.body.data;
    assert("Created request status is 'Pending'", createdReq.status === "Pending");
    assert("Anti-impersonation: employeeId is Alice's ID", createdReq.employeeId === emp1Profile._id.toString());
    assert("Anti-impersonation: employeeCode is EMP001", createdReq.employeeCode === "EMP001");
    assert("Anti-impersonation: employeeName is Alice Developer", createdReq.employeeName === "Alice Developer");
    const submittedId = createdReq._id;

    // Verify document in MongoDB
    const persistedDoc = await AttendanceRegularization.findById(submittedId);
    assert("Regularization document is persisted in database", Boolean(persistedDoc));
    assert("Persisted document status is 'Pending'", persistedDoc.status === "Pending");

    // 4.2 Duplicate pending submission check: must return 409 Conflict
    const dupRes = await doRequest(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/attendance/regularization",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${emp1Token}`,
        },
      },
      {
        date: "2026-08-03",
        requestType: "Absent Correction",
        requestedLoginTime: "10:15",
        requestedLogoutTime: "18:30",
        reason: "Duplicate pending check",
      }
    );
    assert("Duplicate pending submission returns 409 Conflict", dupRes.status === 409);
    assert("Message confirms pending correction already exists", dupRes.body.message.includes("pending correction already exists"));

    // =========================================================================
    // SECTION 5: EMPLOYEE VIEW AND CROSS-TENANT ISOLATION
    // =========================================================================
    console.log("\n--- Section 5: Employee Query and Cross-Employee Isolation ---");

    // 5.1 Emp1 queries own regularizations
    const emp1ListRes = await doRequest({
      hostname: "127.0.0.1",
      port,
      path: "/api/attendance/regularization/my",
      method: "GET",
      headers: {
        Authorization: `Bearer ${emp1Token}`,
      },
    });
    assert("Emp1 GET /regularization/my returns 200", emp1ListRes.status === 200);
    assert("Emp1 sees submitted request", emp1ListRes.body.data.some((r) => r._id === submittedId));

    // 5.2 Emp2 queries own regularizations (Must NOT see Emp1's requests)
    const emp2ListRes = await doRequest({
      hostname: "127.0.0.1",
      port,
      path: "/api/attendance/regularization/my",
      method: "GET",
      headers: {
        Authorization: `Bearer ${emp2Token}`,
      },
    });
    assert("Emp2 GET /regularization/my returns 200", emp2ListRes.status === 200);
    assert("Emp2 cannot view Alice's requests (Isolation)", !emp2ListRes.body.data.some((r) => r._id === submittedId));
    assert("Emp2 list is empty", emp2ListRes.body.data.length === 0);

    // 5.3 Emp2 attempts to cancel Emp1's regularization -> 404
    const emp2CancelEmp1Res = await doRequest({
      hostname: "127.0.0.1",
      port,
      path: `/api/attendance/regularization/${submittedId}/cancel`,
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${emp2Token}`,
      },
    });
    assert("Emp2 cancelling Emp1 request returns 404", emp2CancelEmp1Res.status === 404);
    assert("Message states request not found", emp2CancelEmp1Res.body.message.includes("not found"));

    // =========================================================================
    // SECTION 6: ADMIN APPROVAL AND ATTENDANCE CALCULATION
    // =========================================================================
    console.log("\n--- Section 6: Admin Approval & Attendance Mutation ---");

    // 6.1 Admin lists regularizations
    const adminListRes = await doRequest({
      hostname: "127.0.0.1",
      port,
      path: "/api/attendance/admin/regularizations?status=Pending",
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    assert("Admin GET /api/attendance/admin/regularizations returns 200", adminListRes.status === 200);
    assert("Admin sees pending request", adminListRes.body.data.some((r) => r._id === submittedId));

    // 6.2 Admin approves the request
    const adminApproveRes = await doRequest(
      {
        hostname: "127.0.0.1",
        port,
        path: `/api/attendance/admin/regularizations/${submittedId}/review`,
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        status: "Approved",
        reviewNote: "Verified with department head. Outage confirmed.",
      }
    );

    assert("Admin PUT /review with status Approved returns 200", adminApproveRes.status === 200);
    assert("Response confirms attendance updated successfully", adminApproveRes.body.message.includes("attendance updated successfully"));
    assert("Request status updated to 'Approved'", adminApproveRes.body.data.status === "Approved");
    assert("Request reviewedBy is 'Admin Auditor'", adminApproveRes.body.data.reviewedBy === "Admin Auditor");
    assert("attendanceId is populated on regularization", Boolean(adminApproveRes.body.data.attendanceId));
    assert("appliedAt is populated on regularization", Boolean(adminApproveRes.body.data.appliedAt));

    const linkedAttendanceId = adminApproveRes.body.data.attendanceId;

    // 6.3 Verify the actual AttendanceV2 document in MongoDB
    console.log("\n[Database Verification] Inspecting real AttendanceV2 document in database...");
    const attendanceDoc = await AttendanceV2.findById(linkedAttendanceId);
    assert("AttendanceV2 document exists in database", Boolean(attendanceDoc));
    assert("AttendanceV2 employeeId matches Alice", attendanceDoc.employeeId.toString() === emp1Profile._id.toString());
    assert("AttendanceV2 employeeCode is EMP001", attendanceDoc.employeeCode === "EMP001");
    assert("AttendanceV2 date is 2026-08-03", attendanceDoc.date === "2026-08-03");
    assert("AttendanceV2 status is 'Present'", attendanceDoc.status === "Present");
    assert("AttendanceV2 workStatus is 'Logged Out'", attendanceDoc.workStatus === "Logged Out");
    assert("AttendanceV2 loginTime is populated", Boolean(attendanceDoc.loginTime));
    assert("AttendanceV2 logoutTime is populated", Boolean(attendanceDoc.logoutTime));
    assert("AttendanceV2 totalWorkedMinutes is 510 (8.5h computed)", attendanceDoc.totalWorkedMinutes === 510);
    assert("AttendanceV2 workingMinutes matches totalWorkedMinutes", attendanceDoc.workingMinutes === 510);
    assert("AttendanceV2 note contains regularized audit trail", attendanceDoc.note.includes("[Regularized: Absent Correction]"));

    console.log(`  Attendance Details: Status=${attendanceDoc.status}, WorkedMinutes=${attendanceDoc.totalWorkedMinutes}, Note=${attendanceDoc.note}`);

    // 6.4 Re-reviewing already approved request returns 400
    const reReviewRes = await doRequest(
      {
        hostname: "127.0.0.1",
        port,
        path: `/api/attendance/admin/regularizations/${submittedId}/review`,
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        status: "Rejected",
        reviewNote: "Trying to reverse approval",
      }
    );
    assert("Re-reviewing already approved request returns 400", reReviewRes.status === 400);
    assert("Message confirms already approved", reReviewRes.body.message.includes("already approved"));

    // =========================================================================
    // SECTION 7: REJECTION LIFECYCLE VERIFICATION
    // =========================================================================
    console.log("\n--- Section 7: Rejection Lifecycle Verification ---");

    // 7.1 Submit a second request for Tuesday 2026-08-04
    const submitReq2Res = await doRequest(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/attendance/regularization",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${emp1Token}`,
        },
      },
      {
        date: "2026-08-04", // Tuesday
        requestType: "Absent Correction",
        requestedLoginTime: "10:00",
        requestedLogoutTime: "18:00",
        reason: "Missed punch due to meeting",
      }
    );
    assert("Second submission on 2026-08-04 returns 201", submitReq2Res.status === 201);
    const req2Id = submitReq2Res.body.data._id;

    // 7.2 Admin rejects the request
    const adminRejectRes = await doRequest(
      {
        hostname: "127.0.0.1",
        port,
        path: `/api/attendance/admin/regularizations/${req2Id}/review`,
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        status: "Rejected",
        reviewNote: "Meeting logs do not match claimed hours.",
      }
    );

    assert("Admin PUT /review with status Rejected returns 200", adminRejectRes.status === 200);
    assert("Response confirms correction rejected", adminRejectRes.body.message.includes("rejected"));
    assert("Request status updated to 'Rejected'", adminRejectRes.body.data.status === "Rejected");
    assert("attendanceId remains null on rejection", adminRejectRes.body.data.attendanceId === null);
    assert("appliedAt remains null on rejection", adminRejectRes.body.data.appliedAt === null);

    // Verify in DB that no attendance was created for 2026-08-04
    const attendanceDoc2 = await AttendanceV2.findOne({
      employeeId: emp1Profile._id,
      date: "2026-08-04",
    });
    assert("No AttendanceV2 document created for rejected request", attendanceDoc2 === null);

  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log("\n[Teardown] HTTP server closed.");
    }

    console.log(`[Teardown] Dropping isolated test database: ${mongoose.connection.name}...`);
    await mongoose.connection.db.dropDatabase();
    console.log(`[Teardown] Dropped test database: ${TEST_DB_NAME}`);
    await mongoose.disconnect();
    console.log("[Teardown] Disconnected from MongoDB.");
  }

  console.log("\n================================================================================");
  console.log(`HOTFIX AUDIT RESULTS: TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("ALL REAL PRODUCTION ATTENDANCE REGULARIZATION HOTFIX CHECKS PASSED!");
    process.exit(0);
  }
}

runHotfixVerification().catch((err) => {
  console.error("Unhandled error during hotfix audit:", err);
  process.exit(1);
});
