const fs = require('fs');
const path = require('path');
const jwt = require('../backend/node_modules/jsonwebtoken');
const mongoose = require('../backend/node_modules/mongoose');

async function runTests() {
  console.log("=== ISSUE 1: PROTECT UPLOADED FILES VERIFICATION ===");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  const BASE_URL = "http://localhost:5000";
  const JWT_SECRET = "ClientConnectTrack@2026SuperSecret";

  // 1. Health check
  try {
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const health = await healthRes.json();
    assert(health.success === true, "Backend health check responds with success: true");
  } catch (err) {
    console.error("Health check failed:", err.message);
    process.exit(1);
  }

  // 2. Unauthenticated request to /uploads/tickets/sample.pdf
  try {
    const unauthRes = await fetch(`${BASE_URL}/uploads/tickets/sample.pdf`);
    const data = await unauthRes.json();
    assert(unauthRes.status === 401, `Unauthenticated request returned 401 (got ${unauthRes.status})`);
    assert(data.code === "AUTH_REQUIRED", `Unauthenticated request code is AUTH_REQUIRED (got ${data.code})`);
  } catch (err) {
    assert(false, `Unauthenticated request error: ${err.message}`);
  }

  // 3. Unauthenticated path traversal attempt (encoded %2e%2e)
  try {
    const traversalRes = await fetch(`${BASE_URL}/uploads/%2e%2e/server.js`);
    assert(traversalRes.status === 401 || traversalRes.status === 403 || traversalRes.status === 404, `Unauthenticated path traversal blocked safely (got ${traversalRes.status})`);
  } catch (err) {
    assert(false, `Unauthenticated path traversal error: ${err.message}`);
  }

  // 4. Request with invalid token
  try {
    const badTokenRes = await fetch(`${BASE_URL}/uploads/tickets/sample.pdf?token=invalid.jwt.token`);
    const data = await badTokenRes.json();
    assert(badTokenRes.status === 401, `Invalid token request returned 401 (got ${badTokenRes.status})`);
    assert(data.code === "INVALID_TOKEN", `Invalid token code is INVALID_TOKEN (got ${data.code})`);
  } catch (err) {
    assert(false, `Invalid token request error: ${err.message}`);
  }

  // Connect to DB briefly to find an active admin user for verified JWT signing
  const MONGO_URI = "mongodb://VirajM123:yivBEn6CdY0coYIz@ac-yydsdkk-shard-00-00.tjkdcqu.mongodb.net:27017,ac-yydsdkk-shard-00-01.tjkdcqu.mongodb.net:27017,ac-yydsdkk-shard-00-02.tjkdcqu.mongodb.net:27017/ClientConnectTrack?tls=true&replicaSet=atlas-gbj92c-shard-0&authSource=admin&retryWrites=true&w=majority";
  await mongoose.connect(MONGO_URI);
  const User = mongoose.model("User", new mongoose.Schema({ role: String, status: String }));
  const adminUser = await User.findOne({ role: "admin", status: "Active" }).lean();
  const clientUser = await User.findOne({ role: "client", status: "Active" }).lean();
  await mongoose.disconnect();

  if (!adminUser) {
    console.error("No active admin user found in database.");
    process.exit(1);
  }

  const adminToken = jwt.sign({ userId: adminUser._id, role: "admin" }, JWT_SECRET, { expiresIn: '1h' });

  // Create temporary test file in uploads/tickets/
  const uploadsTicketsDir = path.resolve(__dirname, "..", "backend", "uploads", "tickets");
  if (!fs.existsSync(uploadsTicketsDir)) {
    fs.mkdirSync(uploadsTicketsDir, { recursive: true });
  }
  const testFileName = `test-audit-${Date.now()}.txt`;
  const testFilePath = path.join(uploadsTicketsDir, testFileName);
  fs.writeFileSync(testFilePath, "Confidential CRM Attachment Data Verification");

  try {
    // 5a. Authenticated access via Authorization: Bearer header
    const headerRes = await fetch(`${BASE_URL}/uploads/tickets/${testFileName}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const headerText = await headerRes.text();
    assert(headerRes.status === 200, `Authenticated file access via Authorization header returned 200 (got ${headerRes.status})`);
    assert(headerText.includes("Confidential CRM Attachment Data"), "File content streamed correctly with header");
    assert(headerRes.headers.get("x-content-type-options") === "nosniff", "Header X-Content-Type-Options: nosniff present");
    assert(headerRes.headers.get("cache-control")?.includes("private"), "Header Cache-Control: private present");

    // 5b. Authenticated access via URL query param (?token=)
    const queryRes = await fetch(`${BASE_URL}/uploads/tickets/${testFileName}?token=${encodeURIComponent(adminToken)}`);
    const queryText = await queryRes.text();
    assert(queryRes.status === 200, `Authenticated file access via ?token= query param returned 200 (got ${queryRes.status})`);
    assert(queryText.includes("Confidential CRM Attachment Data"), "Query token streamed file content correctly");

    // 5c. Path traversal attack with valid token (encoded %2e%2e)
    const authTraversalRes = await fetch(`${BASE_URL}/uploads/%2e%2e/server.js?token=${encodeURIComponent(adminToken)}`);
    assert(authTraversalRes.status === 403 || authTraversalRes.status === 404, `Authenticated path traversal blocked with 403/404 (got ${authTraversalRes.status})`);

    // 5d. Non-existent file with valid token
    const notFoundRes = await fetch(`${BASE_URL}/uploads/tickets/does-not-exist-xyz.pdf?token=${encodeURIComponent(adminToken)}`);
    assert(notFoundRes.status === 404, `Missing file with valid token returned 404 (got ${notFoundRes.status})`);

    // 5e. Unauthorized client accessing an admin ticket file not belonging to client
    if (clientUser) {
      const clientToken = jwt.sign({ userId: clientUser._id, role: "client" }, JWT_SECRET, { expiresIn: '1h' });
      const clientRes = await fetch(`${BASE_URL}/uploads/tickets/${testFileName}?token=${encodeURIComponent(clientToken)}`);
      assert(clientRes.status === 403, `Unrelated client blocked from accessing file with 403 Forbidden (got ${clientRes.status})`);
    }

  } finally {
    // Clean up test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  }

  console.log(`\n=== SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
