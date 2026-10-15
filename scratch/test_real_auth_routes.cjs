"use strict";

const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "../backend/node_modules");
require("module").Module._initPaths();
require("dotenv").config({ path: path.join(__dirname, "../backend/.env") });

const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const assert = require("assert");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key-32chars-min!!";

// Import models & routes
const User = require("../backend/models/User");
const AuthSession = require("../backend/models/AuthSession");
const Employee = require("../backend/models/Employee");
const Client = require("../backend/models/Client");
const authRoutes = require("../backend/auth");

let passCount = 0;
function report(cond, msg) {
  if (cond) {
    passCount++;
    console.log(`  ✓ PASSED: ${msg}`);
  } else {
    console.error(`  ✗ FAILED: ${msg}`);
    process.exit(1);
  }
}

function makeRequest(port, method, pathUrl, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const dataStr = body ? JSON.stringify(body) : null;
    const headers = {
      "Content-Type": "application/json",
    };
    if (dataStr) {
      headers["Content-Length"] = Buffer.byteLength(dataStr);
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path: pathUrl,
        method,
        headers,
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          let json = null;
          try {
            json = JSON.parse(raw);
          } catch (_) {
            json = raw;
          }
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        });
      }
    );
    req.on("error", reject);
    if (dataStr) req.write(dataStr);
    req.end();
  });
}

async function runRealAuthRouteTests() {
  console.log("================================================================================");
  console.log("   REAL PRODUCTION EXPRESS AUTHENTICATION ROUTE & SECURITY AUDIT SUITE          ");
  console.log("================================================================================");

  const testDbName = `crm_isolated_auth_routes_${Date.now()}`;
  const testUri = `mongodb://127.0.0.1:27017/${testDbName}`;

  console.log(`Connecting to isolated test database: ${testDbName}`);
  await mongoose.connect(testUri);
  console.log("Connected to isolated local MongoDB.\n");

  // Ensure User unique indexes
  await User.init();

  // Create real Express app
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  console.log(`Real Express production auth router listening on port ${port}\n`);

  try {
    // 1. Health check
    const health = await makeRequest(port, "GET", "/api/auth/test");
    report(health.status === 200, "GET /api/auth/test returns HTTP 200");
    report(health.data.success === true, "Health check reports success");

    // 2. Register first admin
    const adminRegPayload = {
      name: "Master Admin",
      email: "master.admin@company.com",
      password: "AdminSuperSecret2026!",
    };
    const regRes = await makeRequest(port, "POST", "/api/auth/register-admin", adminRegPayload);
    report(regRes.status === 201, `POST /register-admin succeeds with HTTP 201 (got ${regRes.status})`);
    report(regRes.data.user && regRes.data.user.role === "admin", "Created user has role 'admin'");
    report(regRes.data.token !== undefined, "Access token issued upon registration");

    // 3. Second admin registration rejected (only first admin allowed)
    const dupRegRes = await makeRequest(port, "POST", "/api/auth/register-admin", adminRegPayload);
    report(dupRegRes.status === 403, `Subsequent admin registration rejected with HTTP 403 (got ${dupRegRes.status})`);
    report(dupRegRes.data.message.includes("An administrator already exists"), "Rejection message explains admin already exists");

    // 4. Admin login success
    const loginPayload = {
      email: "master.admin@company.com",
      password: "AdminSuperSecret2026!",
      role: "admin",
    };
    const loginRes = await makeRequest(port, "POST", "/api/auth/login", loginPayload);
    report(loginRes.status === 200, `Admin login returns HTTP 200 (got ${loginRes.status})`);
    report(loginRes.data.success === true, "Admin login success flag is true");
    const adminToken = loginRes.data.token;
    const adminRefreshToken = loginRes.data.refreshToken;
    report(typeof adminToken === "string" && adminToken.length > 20, "Admin access token is valid JWT string");
    report(typeof adminRefreshToken === "string" && adminRefreshToken.length > 20, "Admin refresh token is present");

    // 5. Incorrect password rejection
    const wrongPassRes = await makeRequest(port, "POST", "/api/auth/login", {
      email: "master.admin@company.com",
      password: "TotallyWrongPassword!",
      role: "admin",
    });
    report(wrongPassRes.status === 401, `Incorrect password rejected with HTTP 401 (got ${wrongPassRes.status})`);

    // 6. Unknown email rejection
    const unknownRes = await makeRequest(port, "POST", "/api/auth/login", {
      email: "nonexistent.user@company.com",
      password: "Password123!",
      role: "admin",
    });
    report(unknownRes.status === 401, `Unknown account rejected with HTTP 401 (got ${unknownRes.status})`);

    // 7. Role mismatch rejection
    const roleMismatchRes = await makeRequest(port, "POST", "/api/auth/login", {
      email: "master.admin@company.com",
      password: "AdminSuperSecret2026!",
      role: "employee", // Account is admin, claiming employee
    });
    report(roleMismatchRes.status === 403, `Role mismatch rejected with HTTP 403 (got ${roleMismatchRes.status})`);

    // 8. Create Employee and Client test users
    const empPassHash = await bcrypt.hash("EmployeePass2026!", 12);
    const empUser = await User.create({
      name: "Operations Employee",
      email: "ops.emp@company.com",
      password: empPassHash,
      role: "employee",
      status: "Active",
      employeeCode: "EMP-042",
    });

    const clientPassHash = await bcrypt.hash("ClientPass2026!", 12);
    const clientUser = await User.create({
      name: "Acme Client",
      email: "contact@acme.com",
      password: clientPassHash,
      role: "client",
      status: "Active",
      clientCode: "CLI-900",
      companyName: "Acme Logistics",
    });

    // 9. Employee login
    const empLoginRes = await makeRequest(port, "POST", "/api/auth/login", {
      email: "ops.emp@company.com",
      password: "EmployeePass2026!",
      role: "employee",
    });
    report(empLoginRes.status === 200, `Employee login returns HTTP 200 (got ${empLoginRes.status})`);
    report(empLoginRes.data.user.role === "employee", "Employee user role verified in login response");
    const empToken = empLoginRes.data.token;

    // 10. Client login
    const clientLoginRes = await makeRequest(port, "POST", "/api/auth/login", {
      email: "contact@acme.com",
      password: "ClientPass2026!",
      role: "client",
    });
    report(clientLoginRes.status === 200, `Client login returns HTTP 200 (got ${clientLoginRes.status})`);
    report(clientLoginRes.data.user.role === "client", "Client user role verified in login response");
    const clientToken = clientLoginRes.data.token;

    // 11. Inactive & Blocked user rejection
    await User.create({
      name: "Inactive User",
      email: "inactive@company.com",
      password: await bcrypt.hash("Pass123456", 12),
      role: "employee",
      status: "Inactive",
    });
    const inactiveLogin = await makeRequest(port, "POST", "/api/auth/login", {
      email: "inactive@company.com",
      password: "Pass123456",
      role: "employee",
    });
    report(inactiveLogin.status === 403, `Inactive user login rejected with HTTP 403 (got ${inactiveLogin.status})`);

    await User.create({
      name: "Blocked User",
      email: "blocked@company.com",
      password: await bcrypt.hash("Pass123456", 12),
      role: "client",
      status: "Blocked",
    });
    const blockedLogin = await makeRequest(port, "POST", "/api/auth/login", {
      email: "blocked@company.com",
      password: "Pass123456",
      role: "client",
    });
    report(blockedLogin.status === 403, `Blocked user login rejected with HTTP 403 (got ${blockedLogin.status})`);

    // 12. GET /api/auth/me profile retrieval
    const meRes = await makeRequest(port, "GET", "/api/auth/me", null, adminToken);
    report(meRes.status === 200, `GET /api/auth/me returns HTTP 200 (got ${meRes.status})`);
    report(meRes.data.user.email === "master.admin@company.com", "Profile email matches authenticated user");
    report(meRes.data.user.role === "admin", "Profile role matches authenticated user");

    // 13. Missing and invalid authentication header
    const noAuthRes = await makeRequest(port, "GET", "/api/auth/me");
    report(noAuthRes.status === 401, `Missing auth token rejected with HTTP 401 (got ${noAuthRes.status})`);

    const invalidAuthRes = await makeRequest(port, "GET", "/api/auth/me", null, "invalid.garbage.jwt");
    report(invalidAuthRes.status === 401, `Invalid JWT rejected with HTTP 401 (got ${invalidAuthRes.status})`);

    // 14. Refresh token rotation
    const refreshRes = await makeRequest(port, "POST", "/api/auth/refresh", {
      refreshToken: adminRefreshToken,
    });
    report(refreshRes.status === 200, `POST /api/auth/refresh returns HTTP 200 (got ${refreshRes.status})`);
    report(refreshRes.data.token !== undefined, "New access token issued on refresh");
    const newRefreshToken = refreshRes.data.refreshToken;
    report(newRefreshToken !== adminRefreshToken, "Refresh token was rotated to new value");

    // 15. Replay of old refresh token rejected
    const replayRes = await makeRequest(port, "POST", "/api/auth/refresh", {
      refreshToken: adminRefreshToken, // Old revoked token
    });
    report(replayRes.status === 401, `Replayed/revoked refresh token rejected with HTTP 401 (got ${replayRes.status})`);

    // 16. Logout current session
    const logoutRes = await makeRequest(port, "POST", "/api/auth/logout", {
      refreshToken: newRefreshToken,
    });
    report(logoutRes.status === 200, `POST /api/auth/logout returns HTTP 200 (got ${logoutRes.status})`);

    // 17. Change password route
    const changePassRes = await makeRequest(
      port,
      "POST",
      "/api/auth/change-password",
      {
        currentPassword: "EmployeePass2026!",
        newPassword: "BrandNewEmployeePass2026#",
      },
      empToken
    );
    report(changePassRes.status === 200, `POST /change-password returns HTTP 200 (got ${changePassRes.status})`);

    // 18. Login with new password succeeds, old password fails
    const newLoginRes = await makeRequest(port, "POST", "/api/auth/login", {
      email: "ops.emp@company.com",
      password: "BrandNewEmployeePass2026#",
      role: "employee",
    });
    report(newLoginRes.status === 200, "Login with new password succeeds");

    const oldLoginFail = await makeRequest(port, "POST", "/api/auth/login", {
      email: "ops.emp@company.com",
      password: "EmployeePass2026!",
      role: "employee",
    });
    report(oldLoginFail.status === 401, "Login with previous password rejected");

    // 19. Logout from all devices
    const logoutAllRes = await makeRequest(port, "POST", "/api/auth/logout-all", {}, newLoginRes.data.token);
    report(logoutAllRes.status === 200, `POST /logout-all returns HTTP 200 (got ${logoutAllRes.status})`);

  } finally {
    console.log("\nCleaning up HTTP test server and isolated database...");
    await new Promise((resolve) => server.close(resolve));
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
    console.log("Cleanup completed cleanly.");
  }

  console.log(`\n======================================================`);
  console.log(`TOTAL REAL AUTH ROUTE CHECKS: ${passCount}`);
  console.log(`PASSED: ${passCount}`);
  console.log(`FAILED: 0`);
  console.log(`======================================================`);
}

runRealAuthRouteTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
