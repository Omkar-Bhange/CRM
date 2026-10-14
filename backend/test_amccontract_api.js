"use strict";

const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "node_modules");
require("module").Module._initPaths();

const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const http = require("http");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const TEST_DB_URI = `mongodb://127.0.0.1:27017/crm_real_amccontract_routes_${Date.now()}`;
const JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-amc-123456";

async function runRealAmcContractRouteTests() {
  console.log("=== REAL AMCCONTRACT ROUTER INTEGRATION & SECURITY TEST ===");
  console.log("Connecting to local isolated MongoDB:", TEST_DB_URI);

  await mongoose.connect(TEST_DB_URI);
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
  const AmcContract = require("./models/AmcContract");

  // Setup test actors
  const adminUser = await User.create({
    name: "System Administrator",
    email: `admin_amc_${Date.now()}@test.local`,
    role: "admin",
    status: "Active",
  });

  const clientUserA = await User.create({
    name: "Client Alpha User",
    email: `alpha_amc_${Date.now()}@test.local`,
    role: "client",
    status: "Active",
  });

  const clientUserB = await User.create({
    name: "Client Beta User",
    email: `beta_amc_${Date.now()}@test.local`,
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

  const productA = await Product.create({
    productCode: "ERP-PRD-01",
    productName: "Alpha ERP System",
  });

  const productB = await Product.create({
    productCode: "CRM-PRD-02",
    productName: "Beta CRM System",
  });

  // Create contract for Client A and contract for Client B
  const contractA = await AmcContract.create({
    contractCode: `AMC-TEST-001`,
    clientId: clientA._id,
    clientName: clientA.companyName,
    clientCode: clientA.clientCode,
    clientProductId: new mongoose.Types.ObjectId(),
    productId: productA._id,
    productCode: productA.productCode,
    productName: productA.productName,
    startDate: new Date("2026-01-01"),
    expiryDate: new Date("2026-12-31"),
    dueDate: new Date("2026-01-15"),
    taxableAmount: 10000,
    totalAmount: 11800,
    plan: "Standard",
    status: "Pending",
  });

  const contractB = await AmcContract.create({
    contractCode: `AMC-TEST-002`,
    clientId: clientB._id,
    clientName: clientB.companyName,
    clientCode: clientB.clientCode,
    clientProductId: new mongoose.Types.ObjectId(),
    productId: productB._id,
    productCode: productB.productCode,
    productName: productB.productName,
    startDate: new Date("2026-03-01"),
    expiryDate: new Date("2027-02-28"),
    dueDate: new Date("2026-03-15"),
    taxableAmount: 20000,
    totalAmount: 23600,
    plan: "Premium",
    status: "Upcoming",
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

  try {
    // ── GROUP 1: Admin Contract Listing & Filtering ──────────────────────────
    console.log("--- Group 1: Admin Contract Listing & Filtering ---");

    const resAll = await makeRequest("GET", "/api/admin/amc/contracts", null, adminToken);
    assert(resAll.status === 200, "GET /api/admin/amc/contracts returns HTTP 200");
    assert(resAll.data && Array.isArray(resAll.data.data), "Returns array of contracts");
    assert(resAll.data.data.length >= 2, "Lists all active contracts");

    const resFilterStatus = await makeRequest("GET", "/api/admin/amc/contracts?status=Pending", null, adminToken);
    assert(resFilterStatus.status === 200, "Filter by status returns HTTP 200");
    const pendingContracts = resFilterStatus.data.data;
    assert(pendingContracts.every(c => c.status === "Pending"), "Filtered results only include Pending status");

    const resFilterPlan = await makeRequest("GET", "/api/admin/amc/contracts?plan=Premium", null, adminToken);
    assert(resFilterPlan.status === 200, "Filter by plan returns HTTP 200");
    const premiumContracts = resFilterPlan.data.data;
    assert(premiumContracts.every(c => c.plan === "Premium"), "Filtered results only include Premium plan");

    const resSearch = await makeRequest("GET", "/api/admin/amc/contracts?search=AMC-TEST-001", null, adminToken);
    assert(resSearch.status === 200, "Search by contractCode returns HTTP 200");
    assert(resSearch.data.data.some(c => c.contractCode === "AMC-TEST-001"), "Search finds contract AMC-TEST-001");

    // ── GROUP 2: Admin Contract Details, Update & Soft Delete ────────────────
    console.log("\n--- Group 2: Admin Contract Details, Update & Soft Delete ---");

    const resDetail = await makeRequest("GET", `/api/admin/amc/contract/${contractA._id}`, null, adminToken);
    assert(resDetail.status === 200, "GET /api/admin/amc/contract/:id returns HTTP 200");
    assert(resDetail.data && resDetail.data.data && resDetail.data.data.contractCode === "AMC-TEST-001", "Returns matching contract details");

    const resInvalidId = await makeRequest("GET", "/api/admin/amc/contract/not-a-valid-id", null, adminToken);
    assert(resInvalidId.status === 400, "Malformed contract ID returns HTTP 400");

    const fakeId = new mongoose.Types.ObjectId();
    const resNotFound = await makeRequest("GET", `/api/admin/amc/contract/${fakeId}`, null, adminToken);
    assert(resNotFound.status === 404, "Nonexistent contract ID returns HTTP 404");

    // Update contract
    const resUpdate = await makeRequest(
      "PUT",
      `/api/admin/amc/contract/${contractA._id}`,
      {
        plan: "Custom",
        notes: "Updated terms during negotiation",
      },
      adminToken
    );
    assert(resUpdate.status === 200, "PUT /api/admin/amc/contract/:id returns HTTP 200");
    const updatedContract = await AmcContract.findById(contractA._id);
    assert(updatedContract.plan === "Custom", "Contract plan updated to 'Custom'");
    assert(updatedContract.notes === "Updated terms during negotiation", "Contract notes updated successfully");

    // Soft delete contract
    const resDelete = await makeRequest("DELETE", `/api/admin/amc/contract/${contractA._id}`, null, adminToken);
    assert(resDelete.status === 200, "DELETE /api/admin/amc/contract/:id returns HTTP 200");

    const deletedDoc = await AmcContract.findById(contractA._id);
    assert(deletedDoc.isDeleted === true, "Contract isDeleted flag set to true in database");

    const resDetailDeleted = await makeRequest("GET", `/api/admin/amc/contract/${contractA._id}`, null, adminToken);
    assert(resDetailDeleted.status === 404, "Soft-deleted contract returns 404 on subsequent detail request");

    // ── GROUP 3: Client AMC Portal Endpoints & Tenant Isolation ──────────────
    console.log("\n--- Group 3: Client AMC Portal Endpoints & Tenant Isolation ---");

    // Client A dashboard
    const resDashA = await makeRequest("GET", "/api/client/amc/dashboard", null, clientAToken);
    assert(resDashA.status === 200, "Client A dashboard returns HTTP 200");
    assert(resDashA.data && resDashA.data.data, "Client A dashboard data exists");

    // Client B dashboard
    const resDashB = await makeRequest("GET", "/api/client/amc/dashboard", null, clientBToken);
    assert(resDashB.status === 200, "Client B dashboard returns HTTP 200");
    assert(
      resDashB.data && resDashB.data.data && resDashB.data.data.currentContract && resDashB.data.data.currentContract.contractCode === "AMC-TEST-002",
      "Client B dashboard reflects Client B's contract AMC-TEST-002"
    );

    // Client B contracts listing
    const resContractsB = await makeRequest("GET", "/api/client/amc/contracts", null, clientBToken);
    assert(resContractsB.status === 200, "Client B contracts list returns HTTP 200");
    assert(Array.isArray(resContractsB.data.data), "Client B received contracts array");
    assert(resContractsB.data.data.length === 1, "Client B sees exactly 1 active contract");
    assert(resContractsB.data.data[0].contractCode === "AMC-TEST-002", "Client B sees only contract AMC-TEST-002");

    // Tenant Isolation: Client A should NOT see Client B's contract
    const resContractsA = await makeRequest("GET", "/api/client/amc/contracts", null, clientAToken);
    assert(resContractsA.status === 200, "Client A contracts list returns HTTP 200");
    assert(
      !resContractsA.data.data.some(c => c.contractCode === "AMC-TEST-002"),
      "Tenant Isolation: Client A cannot see Client B's contract"
    );

    // ── GROUP 4: Security & Authentication Enforcement ───────────────────────
    console.log("\n--- Group 4: Security & Authentication Enforcement ---");

    const resUnauthDash = await makeRequest("GET", "/api/client/amc/dashboard", null, null);
    assert(resUnauthDash.status === 401, "Unauthenticated request to client dashboard returns HTTP 401");

    const resUnauthContracts = await makeRequest("GET", "/api/client/amc/contracts", null, null);
    assert(resUnauthContracts.status === 401, "Unauthenticated request to client contracts returns HTTP 401");

  } finally {
    console.log("\n--- Cleanup ---");
    server.close();
    await mongoose.connection.dropDatabase();
    console.log("Dropped isolated test database successfully.");
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }

  console.log(`\nReal AmcContract Route Test Suite Finished: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runRealAmcContractRouteTests().catch(err => {
  console.error("Fatal error in real AMC route tests:", err);
  process.exit(1);
});
