"use strict";

const path = require("path");
process.env.NODE_PATH = path.resolve("backend/node_modules");
require("module").Module._initPaths();

const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const http = require("http");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve("backend/.env") });

const TEST_DB_URI = `mongodb://127.0.0.1:27017/crm_real_client_routes_${Date.now()}`;
const JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-123456";

async function runRealClientRouteTests() {
  console.log("=== REAL CLIENT ROUTER INTEGRATION & SECURITY TEST ===");
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

  // Pre-register models needed by client.js and admin.js
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

  // Require centralized models
  const Client = require(path.resolve("backend/models/Client"));
  const SupportTicket = require(path.resolve("backend/models/SupportTicket"));
  const ActivityLog = require(path.resolve("backend/models/ActivityLog"));
  const AppCounter = require(path.resolve("backend/models/AppCounter"));
  const ClientNotification = require(path.resolve("backend/models/ClientNotification"));
  const Product = require(path.resolve("backend/models/Product"));

  // Create test actors
  const adminUser = await User.create({
    name: "Master Admin",
    email: "admin_client_test@example.com",
    role: "admin",
    status: "Active",
  });

  const clientUser1 = await User.create({
    name: "Client One User",
    email: "client1_test@example.com",
    role: "client",
    status: "Active",
  });

  const clientUser2 = await User.create({
    name: "Client Two User",
    email: "client2_test@example.com",
    role: "client",
    status: "Active",
  });

  const inactiveUser = await User.create({
    name: "Inactive Client",
    email: "inactive_client@example.com",
    role: "client",
    status: "Inactive",
  });

  // Create Client documents linked to client users
  const client1 = await Client.create({
    clientCode: "CLI-101",
    companyName: "Acme Industries",
    contactPerson: "Alice Johnson",
    email: clientUser1.email,
    userId: clientUser1._id,
    mobile: "9876543210",
    city: "Mumbai",
    status: "Active",
    amcStatus: "Paid",
  });

  const client2 = await Client.create({
    clientCode: "CLI-102",
    companyName: "Beta Solutions",
    contactPerson: "Bob Williams",
    email: clientUser2.email,
    userId: clientUser2._id,
    mobile: "9123456780",
    city: "Pune",
    status: "Active",
    amcStatus: "Pending",
  });

  const clientInactive = await Client.create({
    clientCode: "CLI-103",
    companyName: "Dormant Corp",
    email: inactiveUser.email,
    userId: inactiveUser._id,
    status: "Inactive",
  });

  // Generate tokens
  const adminToken = jwt.sign(
    { userId: adminUser._id.toString(), role: adminUser.role, name: adminUser.name },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  const client1Token = jwt.sign(
    { userId: clientUser1._id.toString(), role: clientUser1.role, name: clientUser1.name },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  const client2Token = jwt.sign(
    { userId: clientUser2._id.toString(), role: clientUser2.role, name: clientUser2.name },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  const inactiveToken = jwt.sign(
    { userId: inactiveUser._id.toString(), role: inactiveUser.role, name: inactiveUser.name },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  // Mount real application routers
  const app = express();
  app.use(express.json());

  const clientRoutes = require(path.resolve("backend/client"));
  const adminRoutes = require(path.resolve("backend/admin"));

  app.use("/api/client", clientRoutes);
  app.use("/api/admin", adminRoutes);

  const server = http.createServer(app);
  await new Promise((res) => server.listen(0, res));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  async function request(method, routePath, body = null, token = null) {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${baseUrl}${routePath}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, data };
  }

  try {
    // ── 1. Unauthenticated & Authorization Guards ────────────────────────────
    console.log("--- 1. Authentication & Guard Checks ---");
    const unauthMe = await request("GET", "/api/client/me");
    assert(unauthMe.status === 401, "Unauthenticated GET /api/client/me rejected with HTTP 401");

    const inactiveReq = await request("GET", "/api/client/me", null, inactiveToken);
    assert(inactiveReq.status === 403, "Inactive client account blocked by authMiddleware with HTTP 403");

    // ── 2. Client Profile & Tenant Isolation ─────────────────────────────────
    console.log("\n--- 2. Client Profile & Tenant Isolation (GET /api/client/me) ---");
    const me1 = await request("GET", "/api/client/me", null, client1Token);
    assert(me1.status === 200, "Client 1 accessed /api/client/me with HTTP 200");
    assert(me1.data && me1.data.data && me1.data.data.clientCode === "CLI-101", "Client 1 received own profile (CLI-101)");
    assert(me1.data.data.companyName === "Acme Industries", "Client 1 companyName is accurate");

    const me2 = await request("GET", "/api/client/me", null, client2Token);
    assert(me2.status === 200, "Client 2 accessed /api/client/me with HTTP 200");
    assert(me2.data && me2.data.data && me2.data.data.clientCode === "CLI-102", "Client 2 received own profile (CLI-102)");
    assert(me2.data.data.clientCode !== me1.data.data.clientCode, "CRITICAL: Cross-client tenant isolation confirmed");

    // ── 3. Client Dashboard ──────────────────────────────────────────────────
    console.log("\n--- 3. Client Dashboard (GET /api/client/dashboard) ---");
    const dash1 = await request("GET", "/api/client/dashboard", null, client1Token);
    assert(dash1.status === 200, "Client 1 accessed /api/client/dashboard with HTTP 200");
    assert(dash1.data && dash1.data.success === true, "Dashboard returns success response");

    // ── 4. Client Support Tickets ────────────────────────────────────────────
    console.log("\n--- 4. Support Tickets (GET /api/client/tickets) ---");
    const ticketsRes = await request("GET", "/api/client/tickets", null, client1Token);
    assert(ticketsRes.status === 200, "Client 1 retrieved tickets list with HTTP 200");
    assert(Array.isArray(ticketsRes.data.tickets) || Array.isArray(ticketsRes.data.data), "Tickets list is an array");

    // ── 5. Client AMC Visibility & Contracts ─────────────────────────────────
    console.log("\n--- 5. AMC Visibility (GET /api/client/amc/*) ---");
    const amcDash = await request("GET", "/api/client/amc/dashboard", null, client1Token);
    assert(amcDash.status === 200, "GET /api/client/amc/dashboard returns HTTP 200");

    const amcContracts = await request("GET", "/api/client/amc/contracts", null, client1Token);
    assert(amcContracts.status === 200, "GET /api/client/amc/contracts returns HTTP 200");

    const amcInvoices = await request("GET", "/api/client/amc/invoices", null, client1Token);
    assert(amcInvoices.status === 200, "GET /api/client/amc/invoices returns HTTP 200");

    const amcPayments = await request("GET", "/api/client/amc/payments", null, client1Token);
    assert(amcPayments.status === 200, "GET /api/client/amc/payments returns HTTP 200");

    // ── 6. Client Notifications ──────────────────────────────────────────────
    console.log("\n--- 6. Notifications (GET /api/client/notifications) ---");
    const notifs = await request("GET", "/api/client/notifications", null, client1Token);
    assert(notifs.status === 200, "GET /api/client/notifications returns HTTP 200");

    // ── 7. Admin Client Management & Role Check ──────────────────────────────
    console.log("\n--- 7. Admin Client Management & Role Enforcement ---");
    // Client attempting to access Admin endpoint
    const forbiddenAdmin = await request("GET", "/api/admin/clients", null, client1Token);
    assert(forbiddenAdmin.status === 403, "Client token denied access to /api/admin/clients (HTTP 403)");

    // Admin accessing admin clients listing
    const adminClients = await request("GET", "/api/admin/clients", null, adminToken);
    assert(adminClients.status === 200, "Admin accessed /api/admin/clients with HTTP 200");
    assert(
      Array.isArray(adminClients.data.clients) || Array.isArray(adminClients.data.data),
      "Admin client list returned an array of clients"
    );

    console.log(`\n========================================`);
    console.log(`TOTAL REAL CLIENT ROUTE CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log(`========================================\n`);
  } finally {
    server.close();
    console.log("Cleaning up: dropping temporary isolated database...");
    await conn.connection.dropDatabase();
    await mongoose.disconnect();
    console.log("Teardown complete.");
  }

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("All real Client production router security checks passed successfully!");
    process.exit(0);
  }
}

runRealClientRouteTests().catch((err) => {
  console.error("Real Client route test failed with exception:", err);
  process.exit(1);
});
