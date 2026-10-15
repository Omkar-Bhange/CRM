const path = require('path');
process.env.NODE_PATH = path.resolve('backend/node_modules');
require('module').Module._initPaths();
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const http = require('http');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve('backend/.env') });

const TEST_DB_URI = `mongodb://127.0.0.1:27017/crm_real_routes_v2_${Date.now()}`;
const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-123456';

async function runRealRouteV2Tests() {
  console.log('=== REAL ATTENDANCE V2 ROUTER INTEGRATION TEST ===');
  console.log('Connecting to local MongoDB:', TEST_DB_URI);

  const conn = await mongoose.connect(TEST_DB_URI);
  console.log('Connected to local MongoDB successfully.');

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

  // Pre-register models needed by attendance-v2.js and authMiddleware
  const Employee = mongoose.models.Employee || mongoose.model('Employee', new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    employeeCode: { type: String, required: true },
    name: { type: String, required: true },
    department: { type: String, default: 'Engineering' },
    role: { type: String, default: 'Developer' },
    status: { type: String, default: 'Working' },
  }));

  const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
    email: { type: String, required: true },
    role: { type: String, required: true },
    name: { type: String, required: true },
    status: { type: String, default: 'Active' },
  }));

  const AgentDevice = require(path.resolve('backend/models/AgentDevice'));
  const SystemSettings = require(path.resolve('backend/models/SystemSettings'));

  // Setup test users
  const adminUser = await User.create({
    email: 'v2admin@example.com',
    role: 'admin',
    name: 'Admin User',
    status: 'Active',
  });

  const empUser = await User.create({
    email: 'v2emp@example.com',
    role: 'employee',
    name: 'V2 Employee',
    status: 'Active',
  });

  const testEmp = await Employee.create({
    userId: empUser._id,
    employeeCode: 'EMP301',
    name: 'V2 Employee',
    department: 'Engineering',
    role: 'Developer',
  });

  // Setup approved device for office login bypass
  const testDevice = await AgentDevice.create({
    deviceId: 'DEV-TEST-V2-001',
    deviceType: 'Windows PC',
    token: 'test-agent-token-hash-12345',
    employeeCode: testEmp.employeeCode,
    employeeName: testEmp.name,
    isActive: true,
    isApproved: true,
  });

  // Generate tokens
  const adminToken = jwt.sign(
    { userId: adminUser._id.toString(), role: adminUser.role, name: adminUser.name },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const empToken = jwt.sign(
    { userId: empUser._id.toString(), role: empUser.role, name: empUser.name },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Create Express app mounting the REAL production router
  const app = express();
  app.use(express.json());

  // Mount real router exactly as in backend/server.js lines 243-244
  const attendanceV2Routes = require(path.resolve('backend/attendance-v2'));
  app.use('/api/attendance', attendanceV2Routes);

  // Start HTTP server
  const server = http.createServer(app);
  await new Promise(res => server.listen(0, res));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  async function request(method, routePath, body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

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
    console.log('\n--- 1. Authentication & Route Guard Checks ---');
    // Unauthenticated
    const unauth = await request('POST', '/api/attendance/login', {});
    assert(unauth.status === 401, 'Unauthenticated /login rejected with HTTP 401');

    console.log('\n--- 2. Employee Punch-In (POST /api/attendance/login) ---');
    const loginRes = await request('POST', '/api/attendance/login', {
      deviceId: testDevice.deviceId,
      agentRegistered: true,
      agentEmployeeCode: testEmp.employeeCode,
      pcName: 'TEST-WORKSTATION',
    }, empToken);

    assert(loginRes.status === 201, 'Employee login succeeded (HTTP 201 Created)');
    assert(loginRes.data && loginRes.data.success === true, 'Login response confirms success');
    assert(loginRes.data.data && loginRes.data.data.employeeCode === 'EMP301', 'Attendance record created for EMP301');
    assert(loginRes.data.data.workStatus === 'Working', 'Initial workStatus is Working');

    // Second login should return already logged in
    const secondLogin = await request('POST', '/api/attendance/login', {
      deviceId: testDevice.deviceId,
      agentRegistered: true,
      agentEmployeeCode: testEmp.employeeCode,
    }, empToken);
    assert(secondLogin.status === 200, 'Second login returns HTTP 200');
    assert(secondLogin.data.message === 'You are already logged in.', 'Second login message confirms active session');

    console.log('\n--- 3. Today Attendance Retrieval (GET /api/attendance/today) ---');
    const todayRes = await request('GET', '/api/attendance/today', null, empToken);
    assert(todayRes.status === 200, 'GET /today returns HTTP 200');
    assert(todayRes.data.data && todayRes.data.data.employeeCode === 'EMP301', 'Today attendance retrieved accurately');
    assert(todayRes.data.data.totalWorkedMinutes !== undefined, 'V2 field totalWorkedMinutes present in response');

    console.log('\n--- 4. Break Management (POST /api/attendance/break/start & end) ---');
    const startBreak = await request('POST', '/api/attendance/break/start', {}, empToken);
    assert(startBreak.status === 200, 'POST /break/start returns HTTP 200');
    assert(startBreak.data.data && startBreak.data.data.workStatus === 'Break', 'WorkStatus transitioned to Break');

    const endBreak = await request('POST', '/api/attendance/break/end', {}, empToken);
    assert(endBreak.status === 200, 'POST /break/end returns HTTP 200');
    assert(endBreak.data.data && endBreak.data.data.workStatus === 'Working', 'WorkStatus transitioned back to Working');

    console.log('\n--- 5. Employee Punch-Out (POST /api/attendance/logout) ---');
    const logoutRes = await request('POST', '/api/attendance/logout', {}, empToken);
    assert(logoutRes.status === 200, 'POST /logout returns HTTP 200');
    assert(logoutRes.data.data && logoutRes.data.data.workStatus === 'Logged Out', 'WorkStatus transitioned to Logged Out');
    assert(logoutRes.data.data.logoutTime !== null, 'logoutTime populated in record');

    console.log('\n--- 6. Attendance History (GET /api/attendance/history) ---');
    const historyRes = await request('GET', '/api/attendance/history', null, empToken);
    assert(historyRes.status === 200, 'GET /history returns HTTP 200');
    assert(Array.isArray(historyRes.data.data) && historyRes.data.data.length >= 1, 'History records array returned');

    console.log('\n--- 7. Admin Restrictions & Endpoints ---');
    // Non-admin employee access to admin endpoint
    const forbiddenRes = await request('GET', '/api/attendance/admin/today', null, empToken);
    assert(forbiddenRes.status === 403, 'Non-admin employee blocked from /admin/today (HTTP 403)');

    // Admin access to admin today endpoint
    const adminTodayRes = await request('GET', '/api/attendance/admin/today', null, adminToken);
    assert(adminTodayRes.status === 200, 'Admin accessed /admin/today successfully (HTTP 200)');
    assert(adminTodayRes.data && adminTodayRes.data.success === true, 'Admin today response confirms success');

    // Admin access to admin overview
    const adminOverviewRes = await request('GET', '/api/attendance/admin/overview', null, adminToken);
    assert(adminOverviewRes.status === 200, 'Admin accessed /admin/overview successfully (HTTP 200)');

    console.log(`\n========================================`);
    console.log(`TOTAL V2 ROUTE CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log(`========================================\n`);

  } finally {
    server.close();
    console.log('Cleaning up: dropping temporary isolated database...');
    await conn.connection.dropDatabase();
    await mongoose.disconnect();
    console.log('Teardown complete.');
  }

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('All real AttendanceV2 production router tests passed successfully!');
    process.exit(0);
  }
}

runRealRouteV2Tests().catch(err => {
  console.error('Real route V2 test failed with exception:', err);
  process.exit(1);
});
