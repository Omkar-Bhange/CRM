"use strict";

const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "../backend/node_modules");
require("module").Module._initPaths();

const http = require("http");
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const assert = require("assert");

const employeeRoutes = require("../backend/employee");
const authRoutes = require("../backend/auth");
const attendanceRoutes = require("../backend/attendance");

const Employee = require("../backend/models/Employee");

const JWT_SECRET = process.env.JWT_SECRET || "crm_jwt_secret_for_isolated_test_suite_2026";
process.env.JWT_SECRET = JWT_SECRET;

const TEST_DB_URI = `mongodb://127.0.0.1:27017/crm_employee_real_routes_${Date.now()}`;

function makeRequest(server, options, bodyData) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const reqOptions = {
      hostname: "127.0.0.1",
      port,
      path: options.path,
      method: options.method,
      headers: Object.assign(
        { "Content-Type": "application/json" },
        options.headers || {}
      ),
    };

    const req = http.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on("error", reject);
    if (bodyData) {
      req.write(typeof bodyData === "string" ? bodyData : JSON.stringify(bodyData));
    }
    req.end();
  });
}

async function runRealEmployeeRouteTests() {
  console.log("======================================================");
  console.log("   REAL PRODUCTION EMPLOYEE ROUTE & SECURITY TESTS");
  console.log("======================================================\n");

  let passed = 0;
  let failed = 0;

  function check(name, condition, extraInfo) {
    if (condition) {
      passed++;
      console.log(`  ✓ ${name}`);
    } else {
      failed++;
      console.error(`  ✗ ${name} (FAILED)`);
      if (extraInfo) console.error("    Details:", extraInfo);
      throw new Error(`Assertion failed: ${name}`);
    }
  }

  // Preflight check
  assert(TEST_DB_URI.includes("127.0.0.1"), "Must use local MongoDB");
  assert(TEST_DB_URI.includes("crm_employee_real_routes_"), "Must use isolated db");

  console.log(`Connecting to isolated test database: ${TEST_DB_URI}...`);
  await mongoose.connect(TEST_DB_URI);
  console.log("Connected successfully.\n");

  const app = express();
  app.use(express.json());

  // Mount real production routers
  app.use("/api/auth", authRoutes);
  app.use("/api/employee", employeeRoutes);
  app.use("/api/attendance", attendanceRoutes);

  // Global error handler
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ success: false, message: err.message });
  });

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const assignedPort = server.address().port;
  console.log(`Test Express server listening on 127.0.0.1:${assignedPort}\n`);

  try {
    const User = mongoose.models.User || mongoose.model("User");

    // Seed Admin User
    const adminUser = await User.create({
      name: "Super Admin",
      email: "admin@nexora.com",
      password: "hashedpassword123",
      role: "admin",
      status: "Active",
    });

    const adminToken = jwt.sign(
      { userId: adminUser._id.toString(), email: adminUser.email, role: "admin" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Seed Regular Employee User
    const regularUser = await User.create({
      name: "Existing Employee",
      email: "regular@nexora.com",
      password: "hashedpassword123",
      role: "employee",
      status: "Active",
    });

    const regularEmp = await Employee.create({
      userId: regularUser._id,
      employeeCode: "REG001",
      name: "Existing Employee",
      email: "regular@nexora.com",
      role: "Support",
      department: "Support",
      status: "Free",
    });

    const regularToken = jwt.sign(
      { userId: regularUser._id.toString(), email: regularUser.email, role: "employee" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // ── Test 1: Admin Creates Employee via POST /api/employee/employees ─────
    console.log("--- 1. Real Route: Admin Creates Employee ---");
    const createRes = await makeRequest(
      server,
      {
        path: "/api/employee/employees",
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
      },
      {
        employeeCode: "NEW101",
        name: "Alice Johnson",
        email: "alice.johnson@nexora.com",
        mobile: "9876543210",
        role: "Developer",
        department: "Development",
        joiningDate: "2026-10-15",
        status: "Free",
        password: "SecretPassword123!",
      }
    );

    console.log("createRes status:", createRes.status, "body:", createRes.body);
    check("Admin employee creation returns HTTP 201", createRes.status === 201);
    check("Response reports success true", createRes.body && createRes.body.success === true);
    check("Employee record persisted in database", Boolean(createRes.body.data && createRes.body.data._id));
    check("Employee code normalized to NEW101", createRes.body.data.employeeCode === "NEW101");

    const createdEmpDb = await Employee.findOne({ employeeCode: "NEW101" });
    check("Persisted employee found via Employee model", createdEmpDb != null);
    check("User login account linked", createdEmpDb.userId != null);

    // ── Test 2: Duplicate employeeCode Rejected with 409 ────────────────────
    console.log("\n--- 2. Real Route: Duplicate employeeCode Rejected ---");
    const dupCodeRes = await makeRequest(
      server,
      {
        path: "/api/employee/employees",
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
      },
      {
        employeeCode: "NEW101", // duplicate
        name: "Another Alice",
        email: "different.email@nexora.com",
        role: "Developer",
        password: "SecretPassword123!",
      }
    );

    check("Duplicate employeeCode returns HTTP 409", dupCodeRes.status === 409);
    check("Rejection message indicates code already exists", dupCodeRes.body.message.includes("already exists"));

    // ── Test 3: Duplicate email Rejected with 409 ──────────────────────────
    console.log("\n--- 3. Real Route: Duplicate email Rejected ---");
    const dupEmailRes = await makeRequest(
      server,
      {
        path: "/api/employee/employees",
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
      },
      {
        employeeCode: "DIFF999",
        name: "Different Name",
        email: "alice.johnson@nexora.com", // duplicate
        role: "Developer",
        password: "SecretPassword123!",
      }
    );

    check("Duplicate email returns HTTP 409", dupEmailRes.status === 409);
    check("Rejection message mentions email already exists", dupEmailRes.body.message.includes("email already exists"));

    // ── Test 4: Admin Updates Employee via PUT /api/employee/employees/:id ─
    console.log("\n--- 4. Real Route: Admin Updates Employee ---");
    const updateRes = await makeRequest(
      server,
      {
        path: `/api/employee/employees/${createdEmpDb._id}`,
        method: "PUT",
        headers: { Authorization: `Bearer ${adminToken}` },
      },
      {
        name: "Alice J. Updated",
        role: "Lead Architect",
        department: "Development",
        status: "Working",
      }
    );

    check("Admin update returns HTTP 200", updateRes.status === 200);
    check("Updated name reflected in response", updateRes.body.data.name === "Alice J. Updated");
    check("Updated role reflected in response", updateRes.body.data.role === "Lead Architect");

    const refreshedEmp = await Employee.findById(createdEmpDb._id);
    check("Database reflects updated status 'Working'", refreshedEmp.status === "Working");

    // ── Test 5: Authorization Security: Non-Admin Forbidden to Manage ───────
    console.log("\n--- 5. Security: Non-Admin Access Denied ---");
    const forbiddenRes = await makeRequest(
      server,
      {
        path: "/api/employee/employees",
        method: "POST",
        headers: { Authorization: `Bearer ${regularToken}` },
      },
      {
        employeeCode: "HACK001",
        name: "Unauthorized Employee",
        email: "unauth@nexora.com",
        role: "Dev",
        password: "SecretPassword123!",
      }
    );

    check("Regular employee cannot create employees (HTTP 403)", forbiddenRes.status === 403);
    check("Error message indicates access denied", forbiddenRes.body.message.toLowerCase().includes("denied") || forbiddenRes.body.message.toLowerCase().includes("access"));

    // ── Test 6: Employee Retrieves Own Profile via GET /api/employee/me ────
    console.log("\n--- 6. Real Route: Employee Retrieves Own Profile ---");
    const profileRes = await makeRequest(
      server,
      {
        path: "/api/employee/me",
        method: "GET",
        headers: { Authorization: `Bearer ${regularToken}` },
      },
      null
    );

    check("Employee retrieves own profile (HTTP 200)", profileRes.status === 200);
    check("Profile employeeCode matches regularEmp", profileRes.body.data.employeeCode === "REG001");
    check("Profile email matches regularUser", profileRes.body.data.email === "regular@nexora.com");

    // ── Test 7: Employee Attendance Route Compatibility ────────────────────
    console.log("\n--- 7. Real Route: Attendance Query Compatibility ---");
    const attMeRes = await makeRequest(
      server,
      {
        path: "/api/attendance/attendance/me",
        method: "GET",
        headers: { Authorization: `Bearer ${regularToken}` },
      },
      null
    );

    check("Attendance query executes without schema resolution error", attMeRes.status === 200 || attMeRes.status === 404);

  } finally {
    console.log("\n--- Cleanup ---");
    await new Promise((resolve) => server.close(resolve));
    console.log("Closed test HTTP server.");
    try {
      await mongoose.connection.dropDatabase();
      console.log("Dropped isolated test database successfully.");
    } catch (e) {
      console.error("Cleanup warning:", e.message);
    }
    await mongoose.disconnect();
    console.log("Disconnected from isolated test database.\n");
  }

  console.log("======================================================");
  console.log(`TOTAL REAL ROUTE EMPLOYEE CHECKS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log("======================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runRealEmployeeRouteTests().catch((err) => {
  console.error("Fatal error in real employee route tests:", err);
  process.exit(1);
});
