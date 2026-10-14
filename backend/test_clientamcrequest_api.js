"use strict";

const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "node_modules");
require("module").Module._initPaths();

const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const http = require("http");
const dotenv = require("dotenv");
const fs = require("fs");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const TEST_DB_URI = `mongodb://127.0.0.1:27017/crm_real_clientamcrequest_routes_${Date.now()}`;
const JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-123456";

async function runRealClientAmcRequestRouteTests() {
  console.log("=== REAL CLIENTAMCREQUEST ROUTER INTEGRATION & SECURITY TEST ===");
  console.log("Connecting to local isolated MongoDB:", TEST_DB_URI);

  const conn = await mongoose.connect(TEST_DB_URI);
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

  // Pre-register referenced models
  const User =
    mongoose.models.User ||
    mongoose.model(
      "User",
      new mongoose.Schema({
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        role: { type: String, required: true },
        status: { type: String, default: "Active" },
      })
    );

  const Employee =
    mongoose.models.Employee ||
    mongoose.model(
      "Employee",
      new mongoose.Schema({
        name: { type: String, required: true },
        employeeCode: { type: String, required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: { type: String, default: "Active" },
      })
    );

  const Client = require("./models/Client");
  const Product = require("./models/Product");
  const ClientAmcRequest = require("./models/ClientAmcRequest");
  const AppCounter = require("./models/AppCounter");

  // AmcContract model registration for client.js / admin.js queries
  const AmcContract =
    mongoose.models.AmcContract ||
    mongoose.model(
      "AmcContract",
      new mongoose.Schema({
        contractCode: { type: String, required: true },
        clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
        clientName: { type: String, default: "" },
        clientCode: { type: String, default: "" },
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        productName: { type: String, default: "AMC Support Package" },
        startDate: { type: Date, default: Date.now },
        endDate: { type: Date, default: () => new Date(Date.now() + 365 * 86400000) },
        expiryDate: { type: Date, default: () => new Date(Date.now() + 365 * 86400000) },
        isDeleted: { type: Boolean, default: false },
        status: { type: String, default: "Active" },
      })
    );

  // Setup test actors
  const adminUser = await User.create({
    name: "System Administrator",
    email: `admin_amc_${Date.now()}@test.local`,
    role: "admin",
    status: "Active",
  });

  const clientUserA = await User.create({
    name: "Client Alpha User",
    email: `alpha_${Date.now()}@test.local`,
    role: "client",
    status: "Active",
  });

  const clientUserB = await User.create({
    name: "Client Beta User",
    email: `beta_${Date.now()}@test.local`,
    role: "client",
    status: "Active",
  });

  const clientA = await Client.create({
    clientCode: `CLI-A-${Date.now()}`,
    companyName: "Alpha Logistics Pvt Ltd",
    contactPerson: "Alice Alpha",
    email: clientUserA.email,
    userId: clientUserA._id,
    mobile: "9876543210",
    city: "Mumbai",
    status: "Active",
  });

  const clientB = await Client.create({
    clientCode: `CLI-B-${Date.now()}`,
    companyName: "Beta Manufacturing Ltd",
    contactPerson: "Bob Beta",
    email: clientUserB.email,
    userId: clientUserB._id,
    mobile: "9123456789",
    city: "Pune",
    status: "Active",
  });

  // Create contract for Client A and contract for Client B
  const contractA = await AmcContract.create({
    contractCode: `AMC-A-001`,
    clientId: clientA._id,
    clientName: clientA.companyName,
    clientCode: clientA.clientCode,
    productName: "Alpha ERP System",
  });

  const contractB = await AmcContract.create({
    contractCode: `AMC-B-001`,
    clientId: clientB._id,
    clientName: clientB.companyName,
    clientCode: clientB.clientCode,
    productName: "Beta Inventory System",
  });

  // JWT Tokens
  const adminToken = jwt.sign(
    { userId: adminUser._id.toString(), role: "admin", email: adminUser.email, name: adminUser.name },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  const clientAToken = jwt.sign(
    { userId: clientUserA._id.toString(), role: "client", email: clientUserA.email, name: clientUserA.name },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  const clientBToken = jwt.sign(
    { userId: clientUserB._id.toString(), role: "client", email: clientUserB.email, name: clientUserB.name },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  // Mount real application routers
  const app = express();
  app.use(express.json());

  const clientRouter = require("./client");
  const adminRouter = require("./admin");

  app.use("/api/client", clientRouter);
  app.use("/api/admin", adminRouter);

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`Test Express server listening on port ${port}\n`);

  function makeRequest(method, pathUrl, body = null, token = null) {
    return new Promise((resolve, reject) => {
      const payload = body ? JSON.stringify(body) : null;
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (payload) headers["Content-Length"] = Buffer.byteLength(payload);

      const req = http.request(
        {
          hostname: "127.0.0.1",
          port,
          path: pathUrl,
          method,
          headers,
        },
        res => {
          let data = "";
          res.on("data", chunk => (data += chunk));
          res.on("end", () => {
            let json = null;
            try {
              json = JSON.parse(data);
            } catch (e) {
              json = data;
            }
            resolve({ status: res.statusCode, data: json });
          });
        }
      );

      req.on("error", reject);
      if (payload) req.write(payload);
      req.end();
    });
  }

  let createdRequestIdA = null;
  let createdRequestCodeA = null;

  try {
    // ── SCENARIO 1: Client submits a valid renewal request ────────────────────
    console.log("--- Scenario 1: Valid Renewal Request Submission ---");
    const res1 = await makeRequest(
      "POST",
      "/api/client/amc/renewal-request",
      {
        contractId: contractA._id.toString(),
        requestType: "AMC Renewal",
        renewalPeriod: "1 Year",
        remarks: "Need 1 year renewal for Alpha ERP",
      },
      clientAToken
    );

    assert(res1.status === 201, "POST /api/client/amc/renewal-request returns 201 Created");
    assert(res1.data.success === true, "Response payload indicates success: true");
    assert(res1.data.data && res1.data.data.requestCode, "Response contains generated requestCode");
    assert(res1.data.data.status === "Submitted", "Initial status is 'Submitted'");
    assert(res1.data.data.requestType === "AMC Renewal", "requestType is 'AMC Renewal'");

    createdRequestIdA = res1.data.data.id || res1.data.data._id;
    createdRequestCodeA = res1.data.data.requestCode;

    // Verify activeRequestKey stored in DB
    const docInDb = await ClientAmcRequest.findById(createdRequestIdA);
    assert(
      docInDb.activeRequestKey === `${clientA._id}:${contractA._id}:AMC Renewal`,
      "Database document contains activeRequestKey matching `${clientId}:${contractId}:${requestType}`"
    );

    // ── SCENARIO 2: Duplicate active request rejection (409 Conflict) ─────────
    console.log("\n--- Scenario 2: Duplicate Active Request Rejection ---");
    const res2 = await makeRequest(
      "POST",
      "/api/client/amc/renewal-request",
      {
        contractId: contractA._id.toString(),
        requestType: "AMC Renewal",
        renewalPeriod: "1 Year",
        remarks: "Attempting second active renewal request",
      },
      clientAToken
    );

    assert(res2.status === 409, "POST /api/client/amc/renewal-request returns 409 Conflict for duplicate active request");
    assert(res2.data.success === false, "Duplicate request response indicates success: false");

    // ── SCENARIO 3: Client fetches own requests ─────────────────────────────
    console.log("\n--- Scenario 3: Client Fetches Own Requests ---");
    const res3 = await makeRequest("GET", "/api/client/amc/requests", null, clientAToken);
    assert(res3.status === 200, "GET /api/client/amc/requests returns 200 OK");
    assert(Array.isArray(res3.data.data), "Response data is an array");
    const foundReq = res3.data.data.find(r => r.requestCode === createdRequestCodeA);
    assert(Boolean(foundReq), "Client A's request list contains newly created request");

    // ── SCENARIO 4: Tenant Isolation ─────────────────────────────────────────
    console.log("\n--- Scenario 4: Tenant Isolation Security ---");
    // Client B cannot see Client A's request in their list
    const res4List = await makeRequest("GET", "/api/client/amc/requests", null, clientBToken);
    const clientBSeesA = res4List.data.data.some(r => r.requestCode === createdRequestCodeA);
    assert(!clientBSeesA, "Tenant Isolation: Client B request list does NOT contain Client A's request");

    // Client B cannot submit request for Client A's contract
    const res4CrossSubmit = await makeRequest(
      "POST",
      "/api/client/amc/renewal-request",
      {
        contractId: contractA._id.toString(),
        requestType: "AMC Renewal",
        renewalPeriod: "1 Year",
      },
      clientBToken
    );
    assert(res4CrossSubmit.status === 404, "Tenant Isolation: Client B cannot submit request against Client A's contract (404)");

    // Client B cannot cancel Client A's request
    const res4CrossCancel = await makeRequest(
      "PATCH",
      `/api/client/amc/requests/${createdRequestIdA}/cancel`,
      { remarks: "Malicious cancel attempt" },
      clientBToken
    );
    assert(res4CrossCancel.status === 404, "Tenant Isolation: Client B cannot cancel Client A's request (404)");

    // ── SCENARIO 5: Client cancels request & activeRequestKey cleared ─────────
    console.log("\n--- Scenario 5: Client Cancellation & Key Clearance ---");
    const res5 = await makeRequest(
      "PATCH",
      `/api/client/amc/requests/${createdRequestIdA}/cancel`,
      { remarks: "Changed my mind, cancelling request" },
      clientAToken
    );
    assert(res5.status === 200, "PATCH /api/client/amc/requests/:id/cancel returns 200 OK");
    assert(res5.data.data.status === "Cancelled", "Request status updated to 'Cancelled'");

    // Verify DB cleared activeRequestKey
    const cancelledDbDoc = await ClientAmcRequest.findById(createdRequestIdA);
    assert(cancelledDbDoc.status === "Cancelled", "Database status is 'Cancelled'");
    assert(cancelledDbDoc.activeRequestKey === null, "activeRequestKey cleared to null in database");

    // ── SCENARIO 6: Re-submit after cancellation succeeds ────────────────────
    console.log("\n--- Scenario 6: Re-submission After Cancellation ---");
    const res6 = await makeRequest(
      "POST",
      "/api/client/amc/renewal-request",
      {
        contractId: contractA._id.toString(),
        requestType: "AMC Renewal",
        renewalPeriod: "1 Year",
        remarks: "New valid renewal request after prior was cancelled",
      },
      clientAToken
    );
    assert(res6.status === 201, "POST /api/client/amc/renewal-request succeeds with 201 after prior cancellation");
    const newActiveId = res6.data.data.id || res6.data.data._id;
    const newDbDoc = await ClientAmcRequest.findById(newActiveId);
    assert(newDbDoc.activeRequestKey !== null, "New active request successfully acquired activeRequestKey");

    // ── SCENARIO 7: Admin lists requests with filters ────────────────────────
    console.log("\n--- Scenario 7: Admin Lists Requests ---");
    const res7All = await makeRequest("GET", "/api/admin/amc-requests", null, adminToken);
    assert(res7All.status === 200, "GET /api/admin/amc-requests returns 200 OK for admin");
    assert(res7All.data.success === true, "Admin request listing success: true");
    assert(Array.isArray(res7All.data.data), "Admin request listing returned data array");
    assert(res7All.data.data.length >= 2, "Admin sees all requests across clients");

    const res7Filtered = await makeRequest("GET", "/api/admin/amc-requests?status=Submitted", null, adminToken);
    assert(res7Filtered.status === 200, "GET /api/admin/amc-requests with status filter returns 200 OK");
    assert(
      res7Filtered.data.data.every(r => r.status === "Submitted"),
      "Filtered admin listing contains only 'Submitted' requests"
    );

    // ── SCENARIO 8: Admin updates status to Under Review & Quotation Ready ───
    console.log("\n--- Scenario 8: Admin Workflow Transitions ---");
    // Transition to Under Review
    const res8Review = await makeRequest(
      "PATCH",
      `/api/admin/amc-requests/${newActiveId}/status`,
      {
        status: "Under Review",
        adminNotes: "Assigned to sales executive for quotation",
      },
      adminToken
    );
    assert(res8Review.status === 200, "PATCH /api/admin/amc-requests/:id/status to 'Under Review' returns 200 OK");
    assert(res8Review.data.data.status === "Under Review", "Status updated to 'Under Review'");
    assert(res8Review.data.data.adminNotes === "Assigned to sales executive for quotation", "Admin notes recorded");

    // Transition to Quotation Ready
    const res8Quote = await makeRequest(
      "PATCH",
      `/api/admin/amc-requests/${newActiveId}/status`,
      {
        status: "Quotation Ready",
        quotationAmount: 55000,
        quotationDetails: "Comprehensive 1-year coverage including 2 on-site health checks",
        adminNotes: "Quotation generated and sent to client",
      },
      adminToken
    );
    assert(res8Quote.status === 200, "PATCH /api/admin/amc-requests/:id/status to 'Quotation Ready' returns 200 OK");
    assert(res8Quote.data.data.status === "Quotation Ready", "Status updated to 'Quotation Ready'");
    assert(res8Quote.data.data.quotationAmount === 55000, "Quotation amount recorded");

    // ── SCENARIO 9: Admin retrieves request details and quotation file ──────
    console.log("\n--- Scenario 9: Admin Retrieves Request & Quotation ---");
    // 9.1 Fetch request details including quotationAmount and quotationDetails
    const res9Details = await makeRequest(
      "GET",
      `/api/admin/amc-requests/${newActiveId}`,
      null,
      adminToken
    );
    assert(res9Details.status === 200, "GET /api/admin/amc-requests/:id returns 200 OK");
    assert(res9Details.data.success === true, "Request details query success: true");
    assert(res9Details.data.data.quotationAmount === 55000, "Quotation details include amount 55,000");
    assert(
      res9Details.data.data.quotationDetails.includes("Comprehensive 1-year coverage"),
      "Quotation details string matches"
    );

    // 9.2 Fetch quotation document endpoint (file stream)
    const tempQuotePath = path.resolve(__dirname, "uploads/quotations/test_quote.pdf");
    fs.mkdirSync(path.dirname(tempQuotePath), { recursive: true });
    fs.writeFileSync(tempQuotePath, "%PDF-1.4 test quotation content");

    await ClientAmcRequest.findByIdAndUpdate(newActiveId, {
      quotationDocument: {
        fileName: "test_quote.pdf",
        fileUrl: "/uploads/quotations/test_quote.pdf",
        filePath: tempQuotePath,
        fileSize: 31,
        mimeType: "application/pdf",
        uploadedAt: new Date(),
      },
    });

    const res9File = await makeRequest(
      "GET",
      `/api/admin/amc-requests/${newActiveId}/quotation`,
      null,
      adminToken
    );
    assert(res9File.status === 200, "GET /api/admin/amc-requests/:id/quotation streams file with 200 OK");
    assert(res9File.data.includes("%PDF-1.4"), "Quotation document content streamed correctly");

    // Clean up temp file
    try { fs.unlinkSync(tempQuotePath); } catch (_) {}

    // ── SCENARIO 10: Admin completes request & activeRequestKey cleared ──────
    console.log("\n--- Scenario 10: Admin Completion & Final Key Clearance ---");
    const res10 = await makeRequest(
      "PATCH",
      `/api/admin/amc-requests/${newActiveId}/status`,
      {
        status: "Completed",
        remarks: "Payment received and AMC contract renewed successfully",
      },
      adminToken
    );
    assert(res10.status === 200, "PATCH /api/admin/amc-requests/:id/status to 'Completed' returns 200 OK");
    assert(res10.data.data.status === "Completed", "Status is 'Completed'");

    const completedDbDoc = await ClientAmcRequest.findById(newActiveId);
    assert(completedDbDoc.status === "Completed", "Database record has status 'Completed'");
    assert(completedDbDoc.activeRequestKey === null, "activeRequestKey cleared to null on completion");

  } finally {
    // Teardown
    console.log("\n--- Teardown: Stopping server & dropping isolated database ---");
    server.close();
    try {
      await conn.connection.dropDatabase();
      console.log("Isolated database dropped cleanly.");
    } catch (cleanupErr) {
      console.error("Cleanup error dropping test database:", cleanupErr.message);
    }
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }

  console.log(`\n========================================`);
  console.log(`TOTAL ROUTE CHECKS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runRealClientAmcRequestRouteTests().catch(err => {
  console.error("Fatal error in route test suite:", err);
  process.exit(1);
});

