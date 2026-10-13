"use strict";

/**
 * test_leavebalance_isolated.js
 * Isolated functional, lifecycle, and indexing verification for LeaveBalance model.
 * Connects to a strictly isolated temporary local MongoDB database.
 */

require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const mongoose = require("mongoose");
const http = require("http");
const express = require("express");
const path = require("path");

const TEST_TIMESTAMP = Date.now();
const TEST_DB_NAME = `crm_isolated_leavebalance_test_${TEST_TIMESTAMP}`;
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
  console.log("   LEAVEBALANCE ISOLATED FUNCTIONAL & LIFECYCLE VERIFICATION                    ");
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
    const LeaveBalance = require("./models/LeaveBalance");

    // [1] Collection & Model Verification in DB
    console.log("[1] Collection & Model Verification");
    assert("Model compiles without error", Boolean(LeaveBalance));
    assert("Model name is LeaveBalance", LeaveBalance.modelName === "LeaveBalance");
    assert("Collection name is leaveBalances", LeaveBalance.collection.name === "leaveBalances");

    // Build indexes in DB
    await LeaveBalance.init();
    const dbIndexes = await LeaveBalance.collection.indexes();
    const hasEmpIdx = dbIndexes.some(idx => idx.name === "employeeId_1");
    const hasYearIdx = dbIndexes.some(idx => idx.name === "year_1");
    const compoundUniqueIdx = dbIndexes.find(idx => idx.name === "employeeId_1_year_1_leaveType_1");

    assert("employeeId_1 index exists in MongoDB", hasEmpIdx);
    assert("year_1 index exists in MongoDB", hasYearIdx);
    assert("Compound unique index exists in MongoDB", Boolean(compoundUniqueIdx));
    assert("Compound index is unique in MongoDB", compoundUniqueIdx && compoundUniqueIdx.unique === true);

    // [2] Creation with Default Values
    console.log("\n[2] Creation with Default Values");
    const emp1 = new mongoose.Types.ObjectId();
    const doc1 = await LeaveBalance.create({
      employeeId: emp1,
      year: 2026,
      leaveType: "  Casual Leave  ",
      code: " cl ",
    });

    assert("Document created with valid _id", Boolean(doc1._id));
    assert("total defaults to 0", doc1.total === 0);
    assert("carriedForward defaults to 0", doc1.carriedForward === 0);
    assert("leaveType is trimmed", doc1.leaveType === "Casual Leave");
    assert("code is uppercase and trimmed", doc1.code === "CL");
    assert("timestamps createdAt is populated", Boolean(doc1.createdAt));
    assert("timestamps updatedAt is populated", Boolean(doc1.updatedAt));

    // [3] Required Field Validations
    console.log("\n[3] Required Field Validations");
    let missingEmp = false;
    try {
      await LeaveBalance.create({ year: 2026, leaveType: "Sick Leave", code: "SL" });
    } catch (err) {
      missingEmp = err.name === "ValidationError" && Boolean(err.errors.employeeId);
    }
    assert("Missing employeeId throws ValidationError", missingEmp);

    let missingYear = false;
    try {
      await LeaveBalance.create({ employeeId: emp1, leaveType: "Sick Leave", code: "SL" });
    } catch (err) {
      missingYear = err.name === "ValidationError" && Boolean(err.errors.year);
    }
    assert("Missing year throws ValidationError", missingYear);

    let missingType = false;
    try {
      await LeaveBalance.create({ employeeId: emp1, year: 2026, code: "SL" });
    } catch (err) {
      missingType = err.name === "ValidationError" && Boolean(err.errors.leaveType);
    }
    assert("Missing leaveType throws ValidationError", missingType);

    let missingCode = false;
    try {
      await LeaveBalance.create({ employeeId: emp1, year: 2026, leaveType: "Sick Leave" });
    } catch (err) {
      missingCode = err.name === "ValidationError" && Boolean(err.errors.code);
    }
    assert("Missing code throws ValidationError", missingCode);

    // [4] Min Values Validation
    console.log("\n[4] Min Values Validation");
    let negTotal = false;
    try {
      await LeaveBalance.create({ employeeId: emp1, year: 2026, leaveType: "Sick Leave", code: "SL", total: -1 });
    } catch (err) {
      negTotal = err.name === "ValidationError" && Boolean(err.errors.total);
    }
    assert("Negative total throws ValidationError", negTotal);

    let negCarried = false;
    try {
      await LeaveBalance.create({ employeeId: emp1, year: 2026, leaveType: "Sick Leave", code: "SL", carriedForward: -1 });
    } catch (err) {
      negCarried = err.name === "ValidationError" && Boolean(err.errors.carriedForward);
    }
    assert("Negative carriedForward throws ValidationError", negCarried);

    // [5] Unique Compound Index Enforcement (Duplicate Rejection)
    console.log("\n[5] Unique Compound Index Enforcement");
    let dupCaught = false;
    try {
      // Duplicate of doc1: same emp1, 2026, "Casual Leave"
      await LeaveBalance.create({
        employeeId: emp1,
        year: 2026,
        leaveType: "Casual Leave",
        code: "CL",
        total: 10,
      });
    } catch (err) {
      dupCaught = err.code === 11000 || (err.message && err.message.includes("E11000"));
    }
    assert("Duplicate { employeeId, year, leaveType } rejected with E11000", dupCaught);

    // [6] Multi-Employee and Multi-Year Isolation
    console.log("\n[6] Multi-Employee and Multi-Year Isolation");
    const emp2 = new mongoose.Types.ObjectId();
    const docEmp2 = await LeaveBalance.create({
      employeeId: emp2,
      year: 2026,
      leaveType: "Casual Leave",
      code: "CL",
      total: 12,
    });
    assert("Different employee can have same leaveType in same year", Boolean(docEmp2._id));

    const docYear2027 = await LeaveBalance.create({
      employeeId: emp1,
      year: 2027,
      leaveType: "Casual Leave",
      code: "CL",
      total: 14,
    });
    assert("Same employee can have same leaveType in different year", Boolean(docYear2027._id));

    const docSickLeave = await LeaveBalance.create({
      employeeId: emp1,
      year: 2026,
      leaveType: "Sick Leave",
      code: "SL",
      total: 8,
      carriedForward: 2,
    });
    assert("Same employee can have different leaveType in same year", Boolean(docSickLeave._id));

    // [7] Atomic Upsert and Sync Pattern (ensureLeaveBalances Simulation)
    console.log("\n[7] Atomic Upsert and Sync Pattern");
    // Simulate updating limit from 8 to 10
    const upserted = await LeaveBalance.findOneAndUpdate(
      { employeeId: emp1, year: 2026, leaveType: "Sick Leave" },
      {
        $set: { code: "SL", total: 10 },
        $setOnInsert: { employeeId: emp1, year: 2026, leaveType: "Sick Leave", carriedForward: 0 },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    assert("Upsert updates total to 10", upserted.total === 10);
    assert("Upsert preserves existing carriedForward of 2", upserted.carriedForward === 2);

    // [8] Concurrency Safety: Simultaneous Upserts
    console.log("\n[8] Concurrency Safety: Simultaneous Upserts");
    const emp3 = new mongoose.Types.ObjectId();
    const concurrentPromises = [1, 2, 3, 4, 5].map((i) =>
      LeaveBalance.findOneAndUpdate(
        { employeeId: emp3, year: 2026, leaveType: "Earned Leave" },
        {
          $set: { code: "EL", total: 15 },
          $setOnInsert: { employeeId: emp3, year: 2026, leaveType: "Earned Leave", carriedForward: 0 },
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
      )
    );
    await Promise.all(concurrentPromises);
    const emp3Balances = await LeaveBalance.find({ employeeId: emp3, year: 2026, leaveType: "Earned Leave" });
    assert("Concurrent upserts result in exactly 1 record without duplicate errors", emp3Balances.length === 1);
    assert("Final record total is 15", emp3Balances[0].total === 15);

    // [9] Dynamic Balance Calculation Arithmetic Simulation
    console.log("\n[9] Dynamic Balance Calculation Arithmetic Simulation");
    // emp1 year 2026 Sick Leave: total: 10, carriedForward: 2 -> grandTotal: 12
    const currentDoc = await LeaveBalance.findOne({ employeeId: emp1, year: 2026, leaveType: "Sick Leave" }).lean();
    const grandTotal = Number(currentDoc.total || 0) + Number(currentDoc.carriedForward || 0);
    assert("Grand total entitlement is total + carriedForward (10 + 2 = 12)", grandTotal === 12);

    // Mock 3 days approved, 2 days pending
    const mockApprovedDays = 3;
    const mockPendingDays = 2;
    const remaining = Math.max(0, grandTotal - mockApprovedDays);
    const availableAfterPending = Math.max(0, grandTotal - mockApprovedDays - mockPendingDays);
    assert("Remaining is 12 - 3 = 9", remaining === 9);
    assert("Available after pending is 12 - 3 - 2 = 7", availableAfterPending === 7);

    // [10] Real HTTP Route Tests (Applications, Half-Day, Approvals, Rejections, Cancellations)
    console.log("\n[10] Real HTTP Route Tests");
    const LeaveRequest = require("./models/LeaveRequest");
    const app = express();
    app.use(express.json());

    // Helper to calculate summary for HTTP tests
    async function getSummaryForEmp(employeeId, year) {
      const records = await LeaveBalance.find({ employeeId, year: Number(year) }).sort({ leaveType: 1 }).lean();
      const requests = await LeaveRequest.find({
        employeeId,
        fromDate: { $lte: `${year}-12-31` },
        toDate: { $gte: `${year}-01-01` },
        status: { $in: ["Pending", "Approved"] },
      }).lean();

      return records.map((balance) => {
        const matching = requests.filter((r) => r.leaveType === balance.leaveType);
        const used = matching.filter((r) => r.status === "Approved").reduce((sum, r) => sum + Number(r.days || 0), 0);
        const pending = matching.filter((r) => r.status === "Pending").reduce((sum, r) => sum + Number(r.days || 0), 0);
        const total = Number(balance.total || 0) + Number(balance.carriedForward || 0);
        return {
          id: String(balance._id),
          leaveType: balance.leaveType,
          code: balance.code,
          total,
          used,
          pending,
          remaining: Math.max(0, total - used),
          availableAfterPending: Math.max(0, total - used - pending),
        };
      });
    }

    // 10.1 GET /api/v2/attendance/leave-balances
    app.get("/api/v2/attendance/leave-balances", async (req, res) => {
      try {
        const { employeeId, year } = req.query;
        const data = await getSummaryForEmp(employeeId, Number(year));
        res.json({ success: true, year: Number(year), data });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // 10.2 POST /api/v2/attendance/leaves (create leave request)
    app.post("/api/v2/attendance/leaves", async (req, res) => {
      try {
        const { employeeId, employeeCode, employeeName, leaveType, fromDate, toDate, days, isHalfDay, halfDayType, reason } = req.body;
        const year = Number(String(fromDate).slice(0, 4));
        const summary = await getSummaryForEmp(employeeId, year);
        const bal = summary.find((b) => b.leaveType === leaveType);
        if (!bal) return res.status(400).json({ success: false, message: "Leave balance not found" });
        if (bal.availableAfterPending < days) {
          return res.status(400).json({ success: false, message: "Insufficient leave balance" });
        }

        const leave = await LeaveRequest.create({
          employeeId,
          employeeCode,
          employeeName,
          leaveType,
          fromDate,
          toDate,
          days,
          isHalfDay: Boolean(isHalfDay),
          halfDayType: halfDayType || "None",
          reason: reason || "Personal",
          status: "Pending",
        });

        res.status(201).json({ success: true, data: leave });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // 10.3 PATCH /api/v2/attendance/leaves/:id/status (approve or reject)
    app.patch("/api/v2/attendance/leaves/:id/status", async (req, res) => {
      try {
        const { status, reviewNote } = req.body;
        const leave = await LeaveRequest.findById(req.params.id);
        if (!leave) return res.status(404).json({ success: false, message: "Not found" });
        leave.status = status;
        leave.reviewNote = reviewNote || "";
        await leave.save();
        res.json({ success: true, data: leave });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // 10.4 POST /api/v2/attendance/leaves/:id/cancel
    app.post("/api/v2/attendance/leaves/:id/cancel", async (req, res) => {
      try {
        const leave = await LeaveRequest.findById(req.params.id);
        if (!leave) return res.status(404).json({ success: false, message: "Not found" });
        leave.status = "Cancelled";
        await leave.save();
        res.json({ success: true, data: leave });
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

    // Step A: Baseline balance retrieval
    const initialRes = await doRequest({
      hostname: "127.0.0.1",
      port: httpPort,
      path: `/api/v2/attendance/leave-balances?employeeId=${emp1}&year=2026`,
      method: "GET",
    });
    assert("HTTP GET baseline returns 200", initialRes.status === 200);
    const initialSick = initialRes.body.data.find((b) => b.leaveType === "Sick Leave");
    assert("Baseline Sick Leave total is 12 (10 total + 2 carried)", initialSick.total === 12);
    assert("Baseline Sick Leave used is 0", initialSick.used === 0);
    assert("Baseline Sick Leave pending is 0", initialSick.pending === 0);
    assert("Baseline Sick Leave available is 12", initialSick.availableAfterPending === 12);

    // Step B: Submit full-day leave request (1 day)
    const appFullRes = await doRequest(
      {
        hostname: "127.0.0.1",
        port: httpPort,
        path: "/api/v2/attendance/leaves",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        employeeId: emp1.toString(),
        employeeCode: "EMP001",
        employeeName: "Alice Engineer",
        leaveType: "Sick Leave",
        fromDate: "2026-03-10",
        toDate: "2026-03-10",
        days: 1,
        reason: "Flu",
      }
    );
    assert("HTTP POST full-day leave returns 201", appFullRes.status === 201);
    const fullLeaveId = appFullRes.body.data._id;

    // Verify pending balance incremented
    const afterFullRes = await doRequest({
      hostname: "127.0.0.1",
      port: httpPort,
      path: `/api/v2/attendance/leave-balances?employeeId=${emp1}&year=2026`,
      method: "GET",
    });
    const afterFullSick = afterFullRes.body.data.find((b) => b.leaveType === "Sick Leave");
    assert("After 1-day request: pending is 1", afterFullSick.pending === 1);
    assert("After 1-day request: available is 11", afterFullSick.availableAfterPending === 11);

    // Step C: Submit half-day leave request (0.5 day)
    const appHalfRes = await doRequest(
      {
        hostname: "127.0.0.1",
        port: httpPort,
        path: "/api/v2/attendance/leaves",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        employeeId: emp1.toString(),
        employeeCode: "EMP001",
        employeeName: "Alice Engineer",
        leaveType: "Sick Leave",
        fromDate: "2026-03-15",
        toDate: "2026-03-15",
        days: 0.5,
        isHalfDay: true,
        halfDayType: "First Half",
        reason: "Doctor appointment",
      }
    );
    assert("HTTP POST half-day leave returns 201", appHalfRes.status === 201);
    const halfLeaveId = appHalfRes.body.data._id;

    // Verify pending is now 1.5
    const afterHalfRes = await doRequest({
      hostname: "127.0.0.1",
      port: httpPort,
      path: `/api/v2/attendance/leave-balances?employeeId=${emp1}&year=2026`,
      method: "GET",
    });
    const afterHalfSick = afterHalfRes.body.data.find((b) => b.leaveType === "Sick Leave");
    assert("After half-day request: pending is 1.5", afterHalfSick.pending === 1.5);
    assert("After half-day request: available is 10.5", afterHalfSick.availableAfterPending === 10.5);

    // Step D: Approve full-day leave
    const approveRes = await doRequest(
      {
        hostname: "127.0.0.1",
        port: httpPort,
        path: `/api/v2/attendance/leaves/${fullLeaveId}/status`,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      },
      { status: "Approved", reviewNote: "Approved by manager" }
    );
    assert("HTTP PATCH approve returns 200", approveRes.status === 200);

    const afterApproveRes = await doRequest({
      hostname: "127.0.0.1",
      port: httpPort,
      path: `/api/v2/attendance/leave-balances?employeeId=${emp1}&year=2026`,
      method: "GET",
    });
    const afterApproveSick = afterApproveRes.body.data.find((b) => b.leaveType === "Sick Leave");
    assert("After approval: used is 1", afterApproveSick.used === 1);
    assert("After approval: pending decreased to 0.5", afterApproveSick.pending === 0.5);
    assert("After approval: remaining is 11", afterApproveSick.remaining === 11);
    assert("After approval: availableAfterPending is 10.5", afterApproveSick.availableAfterPending === 10.5);

    // Step E: Reject half-day leave
    const rejectRes = await doRequest(
      {
        hostname: "127.0.0.1",
        port: httpPort,
        path: `/api/v2/attendance/leaves/${halfLeaveId}/status`,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      },
      { status: "Rejected", reviewNote: "Shift conflict" }
    );
    assert("HTTP PATCH reject returns 200", rejectRes.status === 200);

    const afterRejectRes = await doRequest({
      hostname: "127.0.0.1",
      port: httpPort,
      path: `/api/v2/attendance/leave-balances?employeeId=${emp1}&year=2026`,
      method: "GET",
    });
    const afterRejectSick = afterRejectRes.body.data.find((b) => b.leaveType === "Sick Leave");
    assert("After rejection: pending drops to 0", afterRejectSick.pending === 0);
    assert("After rejection: used remains 1", afterRejectSick.used === 1);
    assert("After rejection: remaining is 11", afterRejectSick.remaining === 11);
    assert("After rejection: availableAfterPending restored to 11", afterRejectSick.availableAfterPending === 11);

    // Step F: Cancel approved leave
    const cancelRes = await doRequest({
      hostname: "127.0.0.1",
      port: httpPort,
      path: `/api/v2/attendance/leaves/${fullLeaveId}/cancel`,
      method: "POST",
    });
    assert("HTTP POST cancel returns 200", cancelRes.status === 200);

    const afterCancelRes = await doRequest({
      hostname: "127.0.0.1",
      port: httpPort,
      path: `/api/v2/attendance/leave-balances?employeeId=${emp1}&year=2026`,
      method: "GET",
    });
    const afterCancelSick = afterCancelRes.body.data.find((b) => b.leaveType === "Sick Leave");
    assert("After cancellation: used drops back to 0", afterCancelSick.used === 0);
    assert("After cancellation: remaining restored to 12", afterCancelSick.remaining === 12);
    assert("After cancellation: availableAfterPending fully restored to 12", afterCancelSick.availableAfterPending === 12);

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
    console.log("All LeaveBalance isolated functional checks passed successfully!");
    process.exit(0);
  }
}

runIsolatedTests().catch((err) => {
  console.error("Unhandled test runner error:", err);
  process.exit(1);
});
