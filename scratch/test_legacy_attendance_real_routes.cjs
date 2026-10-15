const path = require('path');
process.env.NODE_PATH = path.resolve('backend/node_modules');
require('module').Module._initPaths();
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const http = require('http');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve('backend/.env') });

const TEST_DB_URI = `mongodb://127.0.0.1:27017/crm_real_routes_${Date.now()}`;
const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-123456';

async function runRealRouteTests() {
  console.log('=== REAL LEGACY ATTENDANCE ROUTER INTEGRATION TEST ===');
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

  // Pre-register models needed by attendance.js and authMiddleware
  // Employee model
  const Employee = mongoose.models.Employee || mongoose.model('Employee', new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    employeeCode: { type: String, required: true },
    name: { type: String, required: true },
    department: { type: String, default: '' },
    role: { type: String, default: '' },
    status: { type: String, default: 'Working' },
  }));

  // User model
  const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
    email: { type: String, required: true },
    role: { type: String, required: true },
    name: { type: String, required: true },
    status: { type: String, default: 'Active' },
  }));

  // Setup test users with status: "Active"
  const adminUser = await User.create({
    email: 'admin@example.com',
    role: 'admin',
    name: 'Admin User',
    status: 'Active',
  });

  const empUser = await User.create({
    email: 'emp@example.com',
    role: 'employee',
    name: 'Regular Employee',
    status: 'Active',
  });

  const testEmp = await Employee.create({
    userId: empUser._id,
    employeeCode: 'EMP101',
    name: 'Regular Employee',
    department: 'Support',
    role: 'Agent',
  });

  // Generate tokens with userId matching authMiddleware expectation
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

  // Mount real router exactly as in backend/server.js line 195
  const attendanceRoutes = require(path.resolve('backend/attendance'));
  app.use('/api/admin', attendanceRoutes);

  // Helper function to make HTTP requests
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
    console.log('\n--- 1. Authentication & Authorization Checks ---');
    // Unauthenticated request
    const unauth = await request('GET', '/api/admin/attendance/test');
    assert(unauth.status === 401, 'Unauthenticated request rejected with HTTP 401');

    // Authenticated admin request to test route
    const authAdmin = await request('GET', '/api/admin/attendance/test', null, adminToken);
    assert(authAdmin.status === 200, 'Authenticated admin access granted (HTTP 200)');
    assert(authAdmin.data && authAdmin.data.success === true, 'Test route confirms attendance API working');

    console.log('\n--- 2. Production Attendance Creation (POST /api/admin/attendance) ---');
    // Admin creates attendance with legacy workStatus: "Free"
    const createRes = await request('POST', '/api/admin/attendance', {
      employeeId: testEmp._id.toString(),
      employeeCode: testEmp.employeeCode,
      employeeName: testEmp.name,
      department: testEmp.department,
      role: testEmp.role,
      date: '2026-10-10',
      loginTime: '2026-10-10T09:30:00.000Z',
      logoutTime: '2026-10-10T17:30:00.000Z',
      workingMinutes: 480,
      breakMinutes: 30,
      status: 'Present',
      workStatus: 'Free', // Testing legacy enum acceptance
      note: 'Created via production router test',
    }, adminToken);

    assert(createRes.status === 201 || createRes.status === 200, 'Admin created attendance successfully (HTTP ' + createRes.status + ')');
    assert(createRes.data && createRes.data.data && createRes.data.data.workStatus === 'Free', 'Legacy workStatus "Free" accepted and persisted');
    const createdId = createRes.data.data._id;

    // Duplicate creation check
    const dupRes = await request('POST', '/api/admin/attendance', {
      employeeId: testEmp._id.toString(),
      employeeCode: testEmp.employeeCode,
      employeeName: testEmp.name,
      date: '2026-10-10',
    }, adminToken);
    assert(dupRes.status === 409, 'Duplicate attendance creation returns HTTP 409 conflict');

    console.log('\n--- 3. Attendance Retrieval (GET /api/admin/attendance) ---');
    const listRes = await request('GET', '/api/admin/attendance', null, adminToken);
    assert(listRes.status === 200, 'Admin listed attendance records (HTTP 200)');
    assert(Array.isArray(listRes.data.data) && listRes.data.data.length >= 1, 'Records array returned');

    console.log('\n--- 4. Attendance Update (PUT /api/admin/attendance/:id) ---');
    const updateRes = await request('PUT', `/api/admin/attendance/${createdId}`, {
      status: 'Late',
      workingMinutes: 450,
      note: 'Updated status to Late',
    }, adminToken);
    assert(updateRes.status === 200, 'Admin updated attendance record (HTTP 200)');
    assert(updateRes.data.data.status === 'Late', 'Status updated to Late');
    assert(updateRes.data.data.workingMinutes === 450, 'workingMinutes updated to 450');

    console.log('\n--- 5. Cross-Version V2 Document Protection on Production Route ---');
    // Insert a document with V2 fields into the database
    const AttendanceV1Model = mongoose.models.Attendance;
    const v2DocRaw = await conn.connection.collection('attendance').insertOne({
      employeeId: testEmp._id,
      employeeCode: testEmp.employeeCode,
      employeeName: testEmp.name,
      department: testEmp.department,
      date: '2026-10-11',
      loginTime: new Date('2026-10-11T09:00:00Z'),
      logoutTime: new Date('2026-10-11T17:00:00Z'),
      workingMinutes: 480,
      totalWorkedMinutes: 480, // V2 field
      totalBreakMinutes: 30,  // V2 field
      shiftStart: '09:00',     // V2 field
      shiftEnd: '17:00',       // V2 field
      isDeleted: false,        // V2 field
      status: 'Present',
      workStatus: 'Working',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const v2DocId = v2DocRaw.insertedId.toString();

    // Now update this document via the REAL production PUT endpoint in attendance.js!
    const v2UpdateRes = await request('PUT', `/api/admin/attendance/${v2DocId}`, {
      note: 'Updated by legacy admin router',
      status: 'Half Day',
    }, adminToken);

    assert(v2UpdateRes.status === 200, 'Production route successfully updated V2-origin document');

    // Verify in MongoDB that V2 fields were NOT erased
    const checkedV2Doc = await conn.connection.collection('attendance').findOne({ _id: new mongoose.Types.ObjectId(v2DocId) });
    assert(checkedV2Doc.status === 'Half Day', 'Updated field persisted');
    assert(checkedV2Doc.totalWorkedMinutes === 480, 'CRITICAL: V2 field totalWorkedMinutes PRESERVED by production PUT route');
    assert(checkedV2Doc.totalBreakMinutes === 30, 'CRITICAL: V2 field totalBreakMinutes PRESERVED by production PUT route');
    assert(checkedV2Doc.shiftStart === '09:00', 'CRITICAL: V2 field shiftStart PRESERVED by production PUT route');
    assert(checkedV2Doc.isDeleted === false, 'CRITICAL: V2 field isDeleted PRESERVED by production PUT route');

    console.log('\n--- 6. Attendance Summary (GET /api/admin/attendance-summary) ---');
    const summaryRes = await request('GET', '/api/admin/attendance-summary?date=2026-10-10', null, adminToken);
    assert(summaryRes.status === 200, 'Attendance summary generated successfully (HTTP 200)');

    console.log('\n--- 7. Attendance Deletion (DELETE /api/admin/attendance/:id) ---');
    const deleteRes = await request('DELETE', `/api/admin/attendance/${createdId}`, null, adminToken);
    assert(deleteRes.status === 200, 'Attendance record deleted successfully (HTTP 200)');
    const deletedCheck = await AttendanceV1Model.findById(createdId);
    assert(deletedCheck === null, 'Document confirmed removed from database');

    console.log(`\n========================================`);
    console.log(`TOTAL ROUTE CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
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
    console.log('All real legacy attendance router tests passed successfully!');
    process.exit(0);
  }
}

runRealRouteTests().catch(err => {
  console.error('Real route test failed with exception:', err);
  process.exit(1);
});
