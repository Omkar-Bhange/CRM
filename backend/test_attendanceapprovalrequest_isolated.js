"use strict";

const http = require("http");
const path = require("path");

// Load backend dependencies
const dotenv = require(path.join(__dirname, "node_modules/dotenv"));
dotenv.config({ path: path.join(__dirname, ".env") });

const mongoose = require(path.join(__dirname, "node_modules/mongoose"));
const express = require(path.join(__dirname, "node_modules/express"));
const jwt = require(path.join(__dirname, "node_modules/jsonwebtoken"));

const TEST_DB_NAME = `crm_isolated_approvalrequest_test_${Date.now()}`;
const TEST_MONGO_URI = `mongodb://127.0.0.1:27017/${TEST_DB_NAME}`;
const JWT_SECRET = process.env.JWT_SECRET || "crm_jwt_secret_dev_key_12345";
process.env.JWT_SECRET = JWT_SECRET;

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

async function runIsolatedTests() {
  console.log("================================================================================");
  console.log("   ATTENDANCEAPPROVALREQUEST ISOLATED FUNCTIONAL & LIFECYCLE VERIFICATION       ");
  console.log("================================================================================\n");

  if (!TEST_MONGO_URI.includes("127.0.0.1") && !TEST_MONGO_URI.includes("localhost")) {
    throw new Error(`SECURITY ALERT: Non-local MongoDB URI rejected: ${TEST_MONGO_URI}`);
  }

  console.log(`Connecting to ISOLATED test database: ${TEST_MONGO_URI}`);
  await mongoose.connect(TEST_MONGO_URI);
  console.log(`Connected to isolated database: ${mongoose.connection.name}\n`);

  let server;

  try {
    // [1] Collection & Model Verification
    console.log("[1] Collection & Model Verification");
    const AttendanceApprovalRequest = require("./models/AttendanceApprovalRequest");

    assert("Model compiles without error", Boolean(AttendanceApprovalRequest));
    assert("Model name is AttendanceApprovalRequest", AttendanceApprovalRequest.modelName === "AttendanceApprovalRequest");
    assert("Collection name is attendanceApprovalRequests", AttendanceApprovalRequest.collection.name === "attendanceApprovalRequests");

    await AttendanceApprovalRequest.init();
    const indexes = await AttendanceApprovalRequest.collection.indexes();
    const indexNames = indexes.map((i) => i.name);

    assert("employeeId_1 index exists in MongoDB", indexNames.includes("employeeId_1"));
    assert("employeeCode_1 index exists in MongoDB", indexNames.includes("employeeCode_1"));
    assert("date_1 index exists in MongoDB", indexNames.includes("date_1"));
    assert("requestType_1 index exists in MongoDB", indexNames.includes("requestType_1"));
    assert("status_1 index exists in MongoDB", indexNames.includes("status_1"));
    assert("employeeId_1_date_1_status_1 compound index exists in MongoDB", indexNames.includes("employeeId_1_date_1_status_1"));

    // [2] Creation with Default Values
    console.log("\n[2] Creation with Default Values");
    const emp1 = new mongoose.Types.ObjectId();
    const doc1 = await AttendanceApprovalRequest.create({
      employeeId: emp1,
      employeeCode: "  emp001  ",
      employeeName: "  Alice Developer  ",
      date: "2026-08-20",
    });

    assert("Document created with valid _id", Boolean(doc1._id));
    assert("employeeCode is uppercase and trimmed", doc1.employeeCode === "EMP001");
    assert("employeeName is trimmed", doc1.employeeName === "Alice Developer");
    assert("status defaults to 'Pending'", doc1.status === "Pending");
    assert("requestType defaults to 'Remote Login'", doc1.requestType === "Remote Login");
    assert("approvalType defaults to empty string", doc1.approvalType === "");
    assert("networkType defaults to 'Unknown'", doc1.networkType === "Unknown");
    assert("pcName defaults to empty string", doc1.pcName === "");
    assert("deviceId defaults to empty string", doc1.deviceId === "");
    assert("ipAddress defaults to empty string", doc1.ipAddress === "");
    assert("reviewedBy defaults to null", doc1.reviewedBy === null);
    assert("reviewedByName defaults to empty string", doc1.reviewedByName === "");
    assert("reviewedAt defaults to null", doc1.reviewedAt === null);
    assert("reviewNote defaults to empty string", doc1.reviewNote === "");
    assert("attendanceId defaults to null", doc1.attendanceId === null);
    assert("timestamps createdAt is populated", Boolean(doc1.createdAt));
    assert("timestamps updatedAt is populated", Boolean(doc1.updatedAt));

    // [3] Required Field Validations
    console.log("\n[3] Required Field Validations");
    const checkRequired = async (data, field) => {
      try {
        await AttendanceApprovalRequest.create(data);
        return false;
      } catch (err) {
        return Boolean(err.errors && err.errors[field]);
      }
    };

    assert(
      "Missing employeeId throws ValidationError",
      await checkRequired({ employeeCode: "EMP", employeeName: "Name", date: "2026-08-20" }, "employeeId")
    );
    assert(
      "Missing employeeCode throws ValidationError",
      await checkRequired({ employeeId: emp1, employeeName: "Name", date: "2026-08-20" }, "employeeCode")
    );
    assert(
      "Missing employeeName throws ValidationError",
      await checkRequired({ employeeId: emp1, employeeCode: "EMP", date: "2026-08-20" }, "employeeName")
    );
    assert(
      "Missing date throws ValidationError",
      await checkRequired({ employeeId: emp1, employeeCode: "EMP", employeeName: "Name" }, "date")
    );

    // [4] Enum Validations across All Types
    console.log("\n[4] Enum Validations across All Types");
    const requestTypes = ["Remote Login", "Work From Home", "Client Site", "Office Exception"];
    for (const rt of requestTypes) {
      const created = await AttendanceApprovalRequest.create({
        employeeId: emp1,
        employeeCode: "EMP001",
        employeeName: "Alice",
        date: "2026-08-21",
        requestType: rt,
      });
      assert(`Successfully saved requestType '${rt}'`, created.requestType === rt);
    }

    try {
      await AttendanceApprovalRequest.create({
        employeeId: emp1,
        employeeCode: "EMP001",
        employeeName: "Alice",
        date: "2026-08-21",
        requestType: "InvalidType",
      });
      assert("Invalid requestType throws ValidationError", false);
    } catch (err) {
      assert("Invalid requestType throws ValidationError", Boolean(err.errors?.requestType));
    }

    // [5] Device & Network Metadata Persistence
    console.log("\n[5] Device & Network Metadata Persistence");
    const deviceDoc = await AttendanceApprovalRequest.create({
      employeeId: emp1,
      employeeCode: "EMP001",
      employeeName: "Alice Developer",
      department: "Development",
      date: "2026-08-22",
      requestType: "Remote Login",
      reason: "Working from branch client meeting",
      pcName: "DEV-LAPTOP-04",
      deviceId: "e18a349e7bf28557111a2c23b529df60a54d0e9b755382dd698e0f4ee85d2102",
      ipAddress: "192.168.1.150",
      networkType: "Outside Office",
    });

    assert("pcName persisted correctly", deviceDoc.pcName === "DEV-LAPTOP-04");
    assert("deviceId persisted correctly", deviceDoc.deviceId.length === 64);
    assert("ipAddress persisted correctly", deviceDoc.ipAddress === "192.168.1.150");
    assert("networkType is 'Outside Office'", deviceDoc.networkType === "Outside Office");

    // [6] Compound Index Querying ({ employeeId, date, status })
    console.log("\n[6] Compound Index Querying ({ employeeId, date, status })");
    const foundPending = await AttendanceApprovalRequest.findOne({
      employeeId: emp1,
      date: "2026-08-22",
      status: "Pending",
    }).lean();

    assert("Compound index finds pending request efficiently", Boolean(foundPending));
    assert("Found pending request matches date", foundPending.date === "2026-08-22");

    // [7] Lifecycle & Updates: Approval and Rejection
    console.log("\n[7] Lifecycle & Updates: Approval and Rejection");
    const adminUser = new mongoose.Types.ObjectId();
    const attendanceDocId = new mongoose.Types.ObjectId();

    // 7.1 Approval
    deviceDoc.status = "Approved";
    deviceDoc.approvalType = "Work From Home";
    deviceDoc.reviewedBy = adminUser;
    deviceDoc.reviewedByName = "Admin Auditor";
    deviceDoc.reviewedAt = new Date();
    deviceDoc.reviewNote = "Approved remote workday";
    deviceDoc.attendanceId = attendanceDocId;
    await deviceDoc.save();

    const verifiedApprove = await AttendanceApprovalRequest.findById(deviceDoc._id);
    assert("Status updated to 'Approved'", verifiedApprove.status === "Approved");
    assert("approvalType updated to 'Work From Home'", verifiedApprove.approvalType === "Work From Home");
    assert("reviewedBy linked to admin User", verifiedApprove.reviewedBy.toString() === adminUser.toString());
    assert("reviewedByName is 'Admin Auditor'", verifiedApprove.reviewedByName === "Admin Auditor");
    assert("attendanceId linked successfully", verifiedApprove.attendanceId.toString() === attendanceDocId.toString());

    // 7.2 Rejection
    const rejectDoc = await AttendanceApprovalRequest.create({
      employeeId: emp1,
      employeeCode: "EMP001",
      employeeName: "Alice",
      date: "2026-08-23",
      requestType: "Remote Login",
      status: "Pending",
    });

    rejectDoc.status = "Rejected";
    rejectDoc.reviewedBy = adminUser;
    rejectDoc.reviewedByName = "Admin Auditor";
    rejectDoc.reviewedAt = new Date();
    rejectDoc.reviewNote = "Unrecognized IP address outside designated zone";
    await rejectDoc.save();

    const verifiedReject = await AttendanceApprovalRequest.findById(rejectDoc._id);
    assert("Status updated to 'Rejected'", verifiedReject.status === "Rejected");
    assert("attendanceId remains null on rejection", verifiedReject.attendanceId === null);
    assert("reviewNote records rejection reason", verifiedReject.reviewNote.includes("Unrecognized IP"));

    // [8] Historical Document Compatibility (Atlas Pattern)
    console.log("\n[8] Historical Document Compatibility (Atlas Pattern)");
    const historicalDoc = await AttendanceApprovalRequest.create({
      employeeId: new mongoose.Types.ObjectId("6a8432e2eb643f4087dee336"),
      employeeCode: "E101",
      employeeName: "Viraj Mohite",
      department: "Development",
      date: "2026-08-20",
      requestType: "Remote Login",
      approvalType: "Late Arrival",
      reason: "",
      pcName: "Total4",
      deviceId: "e18a349e7bf28557111a2c23b529df60a54d0e9b755382dd698e0f4ee85d2102",
      ipAddress: "::1",
      networkType: "Outside Office",
      status: "Approved",
      reviewedBy: new mongoose.Types.ObjectId("6a5727e7c0c95cae46d64bf4"),
      reviewedByName: "Admin",
      reviewedAt: new Date("2026-08-20T06:39:04.000Z"),
      attendanceId: new mongoose.Types.ObjectId("6a86a108942bb3e58a6bc045"),
    });

    assert("Historical Atlas document created without error", Boolean(historicalDoc._id));
    assert("Historical employeeCode matches 'E101'", historicalDoc.employeeCode === "E101");
    assert("Historical approvalType is 'Late Arrival'", historicalDoc.approvalType === "Late Arrival");
    assert("Historical ipAddress is '::1'", historicalDoc.ipAddress === "::1");

    // [9] Real Express HTTP Route Integration
    console.log("\n[9] Real Express HTTP Route Integration");

    // Load dependencies required by attendance-v2 router
    require("./models/SystemSettings");
    require("./auth");
    const User = mongoose.models.User;
    require("./employee");
    const Employee = mongoose.models.Employee;
    const attendanceV2Router = require("./attendance-v2");
    const adminRouter = require("./admin");

    const app = express();
    app.use(express.json());
    app.use("/api/attendance", attendanceV2Router);
    app.use("/api/admin", adminRouter);

    server = await new Promise((resolve) => {
      const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });
    const httpPort = server.address().port;

    // Seed real User and Employee documents
    const realAdminUser = await User.create({
      name: "Super Admin",
      email: `admin_${Date.now()}@test.com`,
      password: "dummy_hashed_password",
      role: "admin",
      status: "Active",
    });

    const realEmpUser = await User.create({
      name: "Alice Real",
      email: `alice_${Date.now()}@test.com`,
      password: "dummy_hashed_password",
      role: "employee",
      status: "Active",
    });

    const realEmpProfile = await Employee.create({
      userId: realEmpUser._id,
      name: "Alice Real",
      email: `alice_${Date.now()}@test.com`,
      employeeCode: "EMP901",
      department: "Development",
      role: "Engineer",
      joiningDate: "2026-01-01",
      status: "Free",
    });

    const realAdminToken = jwt.sign({ userId: realAdminUser._id }, JWT_SECRET, { expiresIn: "1h" });
    const realEmpToken = jwt.sign({ userId: realEmpUser._id }, JWT_SECRET, { expiresIn: "1h" });

    // Seed a pending approval request for HTTP testing
    const pendingHttpReq = await AttendanceApprovalRequest.create({
      employeeId: realEmpProfile._id,
      employeeCode: "EMP901",
      employeeName: "Alice Real",
      department: "Development",
      date: "2026-08-25",
      requestType: "Remote Login",
      reason: "Client site deployment",
      status: "Pending",
    });

    // HTTP Test 1: Unauthenticated request rejected with 401
    const httpUnauthRes = await doRequest({
      hostname: "127.0.0.1",
      port: httpPort,
      path: "/api/attendance/admin/approval-requests",
      method: "GET",
    });
    assert("Unauthenticated GET /api/attendance/admin/approval-requests returns 401", httpUnauthRes.status === 401);

    // HTTP Test 2: Employee accessing admin approval requests returns 403
    const httpEmpForbiddenRes = await doRequest({
      hostname: "127.0.0.1",
      port: httpPort,
      path: "/api/attendance/admin/approval-requests",
      method: "GET",
      headers: { Authorization: `Bearer ${realEmpToken}` },
    });
    assert("Employee accessing admin approval-requests returns 403", httpEmpForbiddenRes.status === 403);

    // HTTP Test 3: Admin lists approval requests -> 200
    const httpAdminListRes = await doRequest({
      hostname: "127.0.0.1",
      port: httpPort,
      path: "/api/attendance/admin/approval-requests?status=Pending",
      method: "GET",
      headers: { Authorization: `Bearer ${realAdminToken}` },
    });
    assert("Admin GET /api/attendance/admin/approval-requests returns 200", httpAdminListRes.status === 200);
    assert("Admin sees pending request", httpAdminListRes.body.data.some((r) => r._id === pendingHttpReq._id.toString()));

    // HTTP Test 4: Admin approves remote attendance request via PATCH /admin/approval-requests/:id/approve
    const httpApproveRes = await doRequest(
      {
        hostname: "127.0.0.1",
        port: httpPort,
        path: `/api/attendance/admin/approval-requests/${pendingHttpReq._id}/approve`,
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${realAdminToken}`,
        },
      },
      {
        approvalType: "Client Site",
        reviewNote: "Approved client site deployment",
      }
    );
    assert("Admin PATCH approve returns 200", httpApproveRes.status === 200);
    const approvedRequestData = httpApproveRes.body.data?.request || httpApproveRes.body.data;
    assert("Response status is 'Approved'", approvedRequestData.status === "Approved");
    assert("Response approvalType is 'Client Site'", approvedRequestData.approvalType === "Client Site");
    assert("reviewedBy is populated", Boolean(approvedRequestData.reviewedBy));

    // HTTP Test 5: Re-approving already processed request returns 409 Conflict
    const httpReApproveRes = await doRequest(
      {
        hostname: "127.0.0.1",
        port: httpPort,
        path: `/api/attendance/admin/approval-requests/${pendingHttpReq._id}/approve`,
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${realAdminToken}`,
        },
      },
      { approvalType: "Work From Home" }
    );
    assert("Re-approving processed request returns 409 Conflict", httpReApproveRes.status === 409);

    // HTTP Test 6: Admin rejects another pending request via PATCH /admin/approval-requests/:id/reject
    const pendingHttpReq2 = await AttendanceApprovalRequest.create({
      employeeId: realEmpProfile._id,
      employeeCode: "EMP901",
      employeeName: "Alice Real",
      department: "Development",
      date: "2026-08-26",
      requestType: "Remote Login",
      reason: "No explanation provided",
      status: "Pending",
    });

    const httpRejectRes = await doRequest(
      {
        hostname: "127.0.0.1",
        port: httpPort,
        path: `/api/attendance/admin/approval-requests/${pendingHttpReq2._id}/reject`,
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${realAdminToken}`,
        },
      },
      { reviewNote: "Rejected due to missing justification" }
    );
    assert("Admin PATCH reject returns 200", httpRejectRes.status === 200);
    assert("Response status is 'Rejected'", httpRejectRes.body.data.status === "Rejected");

    // HTTP Test 7: Route in backend/admin.js (GET /api/admin/attendance-approval-requests)
    const httpAdminRouterListRes = await doRequest({
      hostname: "127.0.0.1",
      port: httpPort,
      path: "/api/admin/attendance-approval-requests?status=Approved",
      method: "GET",
      headers: { Authorization: `Bearer ${realAdminToken}` },
    });
    assert("backend/admin.js GET /api/admin/attendance-approval-requests returns 200", httpAdminRouterListRes.status === 200);
    assert("Response count is accurate", httpAdminRouterListRes.body.count >= 1);

    await new Promise((resolve) => server.close(resolve));
    console.log("Real HTTP test server closed successfully.");

  } finally {
    // Teardown
    console.log("\n[Teardown] Cleaning up isolated database...");
    console.log(`Dropping test database: ${mongoose.connection.name}`);
    await mongoose.connection.db.dropDatabase();
    console.log(`Dropped test database: ${TEST_DB_NAME}`);
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }

  console.log("\n================================================================================");
  console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("All AttendanceApprovalRequest isolated functional checks passed successfully!");
    process.exit(0);
  }
}

runIsolatedTests().catch((err) => {
  console.error("Unhandled test runner error:", err);
  process.exit(1);
});
