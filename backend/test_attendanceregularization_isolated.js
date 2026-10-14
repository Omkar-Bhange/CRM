"use strict";

/**
 * test_attendanceregularization_isolated.js
 * Isolated functional, lifecycle, indexing, and HTTP route integration test for AttendanceRegularization model.
 * Connects to a strictly isolated temporary local MongoDB database.
 */

require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const mongoose = require("mongoose");
const http = require("http");
const express = require("express");
const path = require("path");

const TEST_TIMESTAMP = Date.now();
const TEST_DB_NAME = `crm_isolated_regularization_test_${TEST_TIMESTAMP}`;
const TEST_HOST = "127.0.0.1";
const TEST_PORT = 27017;
const TEST_URI = `mongodb://${TEST_HOST}:${TEST_PORT}/${TEST_DB_NAME}`;

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
  console.log("   ATTENDANCEREGULARIZATION ISOLATED FUNCTIONAL & LIFECYCLE VERIFICATION        ");
  console.log("================================================================================");

  // Pre-flight database safety check
  console.log(`Connecting to ISOLATED test database: ${TEST_URI}`);
  if (TEST_URI.includes("mongodb.net") || TEST_URI.includes("atlas") || !TEST_URI.startsWith("mongodb://127.0.0.1:27017/")) {
    console.error("FATAL: Unsafe database URI detected! Aborting.");
    process.exit(1);
  }

  await mongoose.connect(TEST_URI);
  console.log(`Connected to isolated database: ${mongoose.connection.name}\n`);

  try {
    const AttendanceRegularization = require("./models/AttendanceRegularization");

    // [1] Collection & Model Verification in DB
    console.log("[1] Collection & Model Verification");
    assert("Model compiles without error", Boolean(AttendanceRegularization));
    assert("Model name is AttendanceRegularization", AttendanceRegularization.modelName === "AttendanceRegularization");
    assert("Collection name is attendanceRegularizations", AttendanceRegularization.collection.name === "attendanceRegularizations");

    // Build indexes in DB
    await AttendanceRegularization.init();
    const dbIndexes = await AttendanceRegularization.collection.indexes();
    const hasEmpIdx = dbIndexes.some(idx => idx.name === "employeeId_1");
    const hasDateIdx = dbIndexes.some(idx => idx.name === "date_1");
    const hasStatusIdx = dbIndexes.some(idx => idx.name === "status_1");

    assert("employeeId_1 index exists in MongoDB", hasEmpIdx);
    assert("date_1 index exists in MongoDB", hasDateIdx);
    assert("status_1 index exists in MongoDB", hasStatusIdx);

    // [2] Creation with Default Values
    console.log("\n[2] Creation with Default Values");
    const emp1 = new mongoose.Types.ObjectId();
    const doc1 = await AttendanceRegularization.create({
      employeeId: emp1,
      employeeCode: "EMP001",
      employeeName: "Alice Engineer",
      date: "2026-10-14",
      requestType: "Missing Login",
      requestedLoginTime: "09:30",
      reason: "Biometric reader offline",
    });

    assert("Document created with valid _id", Boolean(doc1._id));
    assert("status defaults to 'Pending'", doc1.status === "Pending");
    assert("requestedLogoutTime defaults to empty string", doc1.requestedLogoutTime === "");
    assert("reviewedBy defaults to empty string", doc1.reviewedBy === "");
    assert("reviewNote defaults to empty string", doc1.reviewNote === "");
    assert("reviewedAt defaults to null", doc1.reviewedAt === null);
    assert("attendanceId defaults to null", doc1.attendanceId === null);
    assert("appliedAt defaults to null", doc1.appliedAt === null);
    assert("timestamps createdAt is populated", Boolean(doc1.createdAt));
    assert("timestamps updatedAt is populated", Boolean(doc1.updatedAt));

    // [3] Required Field Validations
    console.log("\n[3] Required Field Validations");
    const requiredChecks = [
      { field: "employeeId", payload: { employeeCode: "E", employeeName: "N", date: "2026-10-14", requestType: "Missing Login", reason: "R" } },
      { field: "employeeCode", payload: { employeeId: emp1, employeeName: "N", date: "2026-10-14", requestType: "Missing Login", reason: "R" } },
      { field: "employeeName", payload: { employeeId: emp1, employeeCode: "E", date: "2026-10-14", requestType: "Missing Login", reason: "R" } },
      { field: "date", payload: { employeeId: emp1, employeeCode: "E", employeeName: "N", requestType: "Missing Login", reason: "R" } },
      { field: "requestType", payload: { employeeId: emp1, employeeCode: "E", employeeName: "N", date: "2026-10-14", reason: "R" } },
      { field: "reason", payload: { employeeId: emp1, employeeCode: "E", employeeName: "N", date: "2026-10-14", requestType: "Missing Login" } },
    ];

    for (const chk of requiredChecks) {
      let errCaught = false;
      try {
        await AttendanceRegularization.create(chk.payload);
      } catch (err) {
        errCaught = err.name === "ValidationError" && Boolean(err.errors[chk.field]);
      }
      assert(`Missing ${chk.field} throws ValidationError`, errCaught);
    }

    // [4] Enum Validations across All 6 Request Types
    console.log("\n[4] Enum Validations across All 6 Request Types");
    const allTypes = [
      "Missing Login",
      "Missing Logout",
      "Incorrect Time",
      "Absent Correction",
      "Work From Home",
      "Client Site",
    ];

    for (const t of allTypes) {
      const typeDoc = await AttendanceRegularization.create({
        employeeId: emp1,
        employeeCode: "EMP001",
        employeeName: "Alice Engineer",
        date: "2026-10-15",
        requestType: t,
        reason: `Testing ${t}`,
      });
      assert(`Successfully saved requestType '${t}'`, typeDoc.requestType === t);
    }

    let invalidTypeCaught = false;
    try {
      await AttendanceRegularization.create({
        employeeId: emp1,
        employeeCode: "EMP001",
        employeeName: "Alice Engineer",
        date: "2026-10-16",
        requestType: "Invalid Custom Type",
        reason: "Testing invalid",
      });
    } catch (err) {
      invalidTypeCaught = err.name === "ValidationError" && Boolean(err.errors.requestType);
    }
    assert("Invalid requestType throws ValidationError", invalidTypeCaught);

    // [5] Querying & Filtering
    console.log("\n[5] Querying & Filtering");
    const emp2 = new mongoose.Types.ObjectId();
    await AttendanceRegularization.create({
      employeeId: emp2,
      employeeCode: "EMP002",
      employeeName: "Bob Smith",
      date: "2026-10-14",
      requestType: "Absent Correction",
      reason: "Field visit",
      status: "Approved",
    });

    const pendingRequests = await AttendanceRegularization.find({ status: "Pending" });
    assert("Find by status: 'Pending' returns correct count (7)", pendingRequests.length === 7);

    const emp2Requests = await AttendanceRegularization.find({ employeeId: emp2 });
    assert("Find by employeeId returns emp2's record", emp2Requests.length === 1 && emp2Requests[0].employeeCode === "EMP002");

    // [6] Existing Pending Request Detection (Duplicate Prevention Logic)
    console.log("\n[6] Existing Pending Request Detection (Duplicate Prevention Logic)");
    const existing = await AttendanceRegularization.findOne({
      employeeId: emp1,
      date: "2026-10-14",
      status: "Pending",
    }).lean();
    assert("Found existing pending request for emp1 on 2026-10-14", Boolean(existing));

    const nonExisting = await AttendanceRegularization.findOne({
      employeeId: emp1,
      date: "2026-12-25",
      status: "Pending",
    }).lean();
    assert("No pending request for emp1 on 2026-12-25", nonExisting === null);

    // [7] Lifecycle & Updates: Approval and Rejection
    console.log("\n[7] Lifecycle & Updates: Approval and Rejection");
    const mockAttId = new mongoose.Types.ObjectId();

    // Approve doc1
    doc1.status = "Approved";
    doc1.reviewedBy = "Admin Manager";
    doc1.reviewNote = "Verified with manager";
    doc1.reviewedAt = new Date();
    doc1.attendanceId = mockAttId;
    doc1.appliedAt = new Date();
    await doc1.save();

    const verifiedApproved = await AttendanceRegularization.findById(doc1._id);
    assert("Status updated to 'Approved'", verifiedApproved.status === "Approved");
    assert("attendanceId linked successfully", verifiedApproved.attendanceId.equals(mockAttId));
    assert("appliedAt is valid Date", Boolean(verifiedApproved.appliedAt));
    assert("reviewedBy matches 'Admin Manager'", verifiedApproved.reviewedBy === "Admin Manager");

    // Reject one of the pending docs
    const docToReject = await AttendanceRegularization.findOne({ employeeId: emp1, requestType: "Missing Logout" });
    docToReject.status = "Rejected";
    docToReject.reviewedBy = "Admin Manager";
    docToReject.reviewNote = "No swipe log found";
    docToReject.reviewedAt = new Date();
    await docToReject.save();

    const verifiedRejected = await AttendanceRegularization.findById(docToReject._id);
    assert("Status updated to 'Rejected'", verifiedRejected.status === "Rejected");
    assert("attendanceId remains null for rejected", verifiedRejected.attendanceId === null);
    assert("reviewNote is 'No swipe log found'", verifiedRejected.reviewNote === "No swipe log found");

    // [8] Historical Document Compatibility
    console.log("\n[8] Historical Document Compatibility");
    const historicalDoc = await AttendanceRegularization.create({
      employeeId: new mongoose.Types.ObjectId("6a5dcaedfb7cfeea6a1bef95"),
      employeeCode: "EMP100",
      employeeName: "OMKAR",
      date: "2026-07-31",
      requestType: "Absent Correction",
      requestedLoginTime: "10:17",
      requestedLogoutTime: "18:18",
      reason: "MY WORK DAY HAS STARTED FROM 31 JUL 2026",
      status: "Pending",
    });
    assert("Historical document format created without error", Boolean(historicalDoc._id));
    assert("Historical document requestedLoginTime matches '10:17'", historicalDoc.requestedLoginTime === "10:17");
    assert("Historical document requestedLogoutTime matches '18:18'", historicalDoc.requestedLogoutTime === "18:18");

    // [9] Real Express HTTP Route Tests
    console.log("\n[9] Real Express HTTP Route Tests");
    const app = express();
    app.use(express.json());

    // Route 1: POST /api/v2/attendance/regularizations (Submission with duplicate pending check)
    app.post("/api/v2/attendance/regularizations", async (req, res) => {
      try {
        const { employeeId, employeeCode, employeeName, date, requestType, requestedLoginTime, requestedLogoutTime, reason } = req.body;
        if (!employeeId || !date || !requestType || !reason) {
          return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const existing = await AttendanceRegularization.findOne({
          employeeId,
          date,
          status: "Pending",
        }).lean();

        if (existing) {
          return res.status(409).json({ success: false, message: "A pending correction already exists for this date." });
        }

        const newReq = await AttendanceRegularization.create({
          employeeId,
          employeeCode,
          employeeName,
          date,
          requestType,
          requestedLoginTime: String(requestedLoginTime || "").trim(),
          requestedLogoutTime: String(requestedLogoutTime || "").trim(),
          reason: String(reason).trim(),
          status: "Pending",
        });

        res.status(201).json({ success: true, data: newReq });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // Route 2: GET /api/v2/attendance/my-regularizations (Employee own requests)
    app.get("/api/v2/attendance/my-regularizations", async (req, res) => {
      try {
        const { employeeId } = req.query;
        const data = await AttendanceRegularization.find({ employeeId }).sort({ createdAt: -1 }).lean();
        res.json({ success: true, count: data.length, data });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // Route 3: GET /api/v2/attendance/regularizations (Admin request list with filters)
    app.get("/api/v2/attendance/regularizations", async (req, res) => {
      try {
        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.date) filter.date = req.query.date;
        const data = await AttendanceRegularization.find(filter).sort({ createdAt: -1 }).lean();
        res.json({ success: true, count: data.length, data });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // Route 4: PUT /api/v2/attendance/admin/regularizations/:id/review (Review / Approve / Reject)
    app.put("/api/v2/attendance/admin/regularizations/:id/review", async (req, res) => {
      try {
        const { status, reviewNote = "" } = req.body;
        if (!["Approved", "Rejected"].includes(status)) {
          return res.status(400).json({ success: false, message: "Status must be Approved or Rejected." });
        }

        const request = await AttendanceRegularization.findById(req.params.id);
        if (!request) {
          return res.status(404).json({ success: false, message: "Attendance correction request not found." });
        }

        if (request.status !== "Pending") {
          return res.status(400).json({ success: false, message: `This request is already ${request.status.toLowerCase()}.` });
        }

        if (status === "Approved") {
          request.attendanceId = new mongoose.Types.ObjectId();
          request.appliedAt = new Date();
        }

        request.status = status;
        request.reviewedBy = "Admin";
        request.reviewNote = String(reviewNote || "").trim();
        request.reviewedAt = new Date();
        await request.save();

        res.json({ success: true, data: request });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    const server = await new Promise((resolve) => {
      const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });
    const httpPort = server.address().port;

    function doRequest(options, postData = null) {
      return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
        });
        req.on("error", reject);
        if (postData) req.write(JSON.stringify(postData));
        req.end();
      });
    }

    // HTTP Test 1: Submit a new regularization
    const httpSubmitRes = await doRequest(
      {
        hostname: "127.0.0.1",
        port: httpPort,
        path: "/api/v2/attendance/regularizations",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        employeeId: emp1.toString(),
        employeeCode: "EMP001",
        employeeName: "Alice Engineer",
        date: "2026-11-01",
        requestType: "Missing Login",
        requestedLoginTime: "09:45",
        reason: "Metro delay",
      }
    );
    assert("HTTP POST /regularizations returns 201", httpSubmitRes.status === 201);
    assert("HTTP POST response has status: 'Pending'", httpSubmitRes.body.data.status === "Pending");
    const submittedId = httpSubmitRes.body.data._id;

    // HTTP Test 2: Duplicate pending submission on same date returns 409 Conflict
    const httpDupRes = await doRequest(
      {
        hostname: "127.0.0.1",
        port: httpPort,
        path: "/api/v2/attendance/regularizations",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        employeeId: emp1.toString(),
        employeeCode: "EMP001",
        employeeName: "Alice Engineer",
        date: "2026-11-01",
        requestType: "Missing Login",
        requestedLoginTime: "09:45",
        reason: "Duplicate attempt",
      }
    );
    assert("HTTP POST duplicate pending request returns 409 Conflict", httpDupRes.status === 409);

    // HTTP Test 3: Employee queries own regularizations
    const httpMyRes = await doRequest({
      hostname: "127.0.0.1",
      port: httpPort,
      path: `/api/v2/attendance/my-regularizations?employeeId=${emp1}`,
      method: "GET",
    });
    assert("HTTP GET /my-regularizations returns 200", httpMyRes.status === 200);
    assert("HTTP GET /my-regularizations contains submitted requests", httpMyRes.body.count >= 1);

    // HTTP Test 4: Admin queries regularizations filtered by status: 'Pending'
    const httpAdminRes = await doRequest({
      hostname: "127.0.0.1",
      port: httpPort,
      path: "/api/v2/attendance/regularizations?status=Pending",
      method: "GET",
    });
    assert("HTTP GET /regularizations?status=Pending returns 200", httpAdminRes.status === 200);
    assert("All returned items have status 'Pending'", httpAdminRes.body.data.every((r) => r.status === "Pending"));

    // HTTP Test 5: Admin approves regularization
    const httpApproveRes = await doRequest(
      {
        hostname: "127.0.0.1",
        port: httpPort,
        path: `/api/v2/attendance/admin/regularizations/${submittedId}/review`,
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      },
      { status: "Approved", reviewNote: "Approved per manager ticket" }
    );
    assert("HTTP PUT /review returns 200 on approval", httpApproveRes.status === 200);
    assert("Updated status is 'Approved'", httpApproveRes.body.data.status === "Approved");
    assert("attendanceId is populated", Boolean(httpApproveRes.body.data.attendanceId));
    assert("appliedAt is populated", Boolean(httpApproveRes.body.data.appliedAt));

    // HTTP Test 6: Re-reviewing approved request returns 400
    const httpReReviewRes = await doRequest(
      {
        hostname: "127.0.0.1",
        port: httpPort,
        path: `/api/v2/attendance/admin/regularizations/${submittedId}/review`,
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      },
      { status: "Rejected", reviewNote: "Trying to reject already approved" }
    );
    assert("Re-reviewing already approved request returns 400", httpReReviewRes.status === 400);

    await new Promise((resolve) => server.close(resolve));
    console.log("Real HTTP test server closed successfully.");

  } finally {
    // Teardown: Drop ONLY this isolated test database
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
    console.log("All AttendanceRegularization isolated functional checks passed successfully!");
    process.exit(0);
  }
}

runIsolatedTests().catch((err) => {
  console.error("Unhandled test runner error:", err);
  process.exit(1);
});
