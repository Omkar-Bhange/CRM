"use strict";

const path = require("path");
const backendDir = path.join(__dirname, "../backend");
const mongoose = require(path.join(backendDir, "node_modules/mongoose"));
const express = require(path.join(backendDir, "node_modules/express"));
const http = require("http");

const TEST_TIMESTAMP = Date.now();
const TEST_DB_NAME = `crm_audit_attendanceevent_${TEST_TIMESTAMP}`;
const TEST_HOST = "127.0.0.1";
const TEST_PORT = 27017;
const TEST_URI = `mongodb://${TEST_HOST}:${TEST_PORT}/${TEST_DB_NAME}`;

// STEP 5: PRE-FLIGHT DATABASE SAFETY CHECK
console.log("=== STEP 5: DATABASE SAFETY PRE-FLIGHT CHECK ===");
console.log(`Target Hostname: ${TEST_HOST}`);
console.log(`Target Port: ${TEST_PORT}`);
console.log(`Target Database: ${TEST_DB_NAME}`);
console.log(`Full Connection URI: ${TEST_URI}`);

if (TEST_URI.includes("mongodb.net") || TEST_URI.includes("atlas") || !TEST_URI.startsWith("mongodb://127.0.0.1:27017/")) {
  console.error("FATAL: Unsafe database URI detected! Aborting.");
  process.exit(1);
}
console.log("Database Safety Verified: Localhost isolated single-tenant database.\n");

let passedChecks = 0;
let failedChecks = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`  [PASS] ${label}`);
    passedChecks++;
  } else {
    console.error(`  [FAIL] ${label}`);
    failedChecks++;
  }
}

async function runLiveAudit() {
  console.log("=== STEP 4: VERIFY ATTENDANCEEVENT FUNCTIONAL BEHAVIOR ===");
  const startConnectTime = new Date().toISOString();
  console.log(`Test Execution Timestamp: ${startConnectTime} (Epoch: ${TEST_TIMESTAMP})`);

  await mongoose.connect(TEST_URI);
  console.log(`Successfully connected to: ${mongoose.connection.name} on ${mongoose.connection.host}:${mongoose.connection.port}\n`);

  try {
    const AttendanceEvent = require(path.join(backendDir, "models/AttendanceEvent"));

    // Check 1: LOGIN and LOGOUT event insertion
    console.log("--- 1. LOGIN & LOGOUT Event Insertion ---");
    const testAttendanceId = new mongoose.Types.ObjectId();
    const testEmployeeId = new mongoose.Types.ObjectId();

    const loginEvent = await AttendanceEvent.create({
      attendanceId: testAttendanceId,
      employeeId: testEmployeeId,
      type: "LOGIN",
      source: "web",
      notes: "Morning punch in"
    });
    assert("LOGIN event inserted successfully", Boolean(loginEvent._id));
    assert("LOGIN event type is LOGIN", loginEvent.type === "LOGIN");

    const logoutEvent = await AttendanceEvent.create({
      attendanceId: testAttendanceId,
      employeeId: testEmployeeId,
      type: "LOGOUT",
      source: "web",
      notes: "Evening punch out"
    });
    assert("LOGOUT event inserted successfully", Boolean(logoutEvent._id));
    assert("LOGOUT event type is LOGOUT", logoutEvent.type === "LOGOUT");

    // Check 2: BREAK_START and BREAK_END
    console.log("\n--- 2. BREAK_START & BREAK_END ---");
    const breakStartEvent = await AttendanceEvent.create({
      attendanceId: testAttendanceId,
      employeeId: testEmployeeId,
      type: "BREAK_START",
      source: "mobile",
      notes: "Lunch break"
    });
    assert("BREAK_START event inserted", breakStartEvent.type === "BREAK_START");

    const breakEndEvent = await AttendanceEvent.create({
      attendanceId: testAttendanceId,
      employeeId: testEmployeeId,
      type: "BREAK_END",
      source: "mobile",
      notes: "Back from lunch"
    });
    assert("BREAK_END event inserted", breakEndEvent.type === "BREAK_END");

    // Check 3: AUTO_CLOSE schema support
    console.log("\n--- 3. AUTO_CLOSE Schema Support ---");
    const autoCloseEvent = await AttendanceEvent.create({
      attendanceId: testAttendanceId,
      employeeId: testEmployeeId,
      type: "AUTO_CLOSE",
      source: "system",
      notes: "End of day auto logout"
    });
    assert("AUTO_CLOSE event inserted successfully", autoCloseEvent.type === "AUTO_CLOSE");
    assert("AUTO_CLOSE source is 'system'", autoCloseEvent.source === "system");

    // Check 4: Correct attendanceId and employeeId references
    console.log("\n--- 4. Correct attendanceId & employeeId references ---");
    assert("attendanceId matches expected ObjectId", loginEvent.attendanceId.equals(testAttendanceId));
    assert("employeeId matches expected ObjectId", loginEvent.employeeId.equals(testEmployeeId));

    // Check 5: Explicit device timestamps
    console.log("\n--- 5. Explicit Device Timestamps ---");
    const deviceTime = new Date("2026-10-13T09:15:30.000Z");
    const biometricEvent = await AttendanceEvent.create({
      attendanceId: testAttendanceId,
      employeeId: testEmployeeId,
      type: "LOGIN",
      timestamp: deviceTime,
      source: "biometric",
      notes: "ZK-Device-Door-01"
    });
    assert("Device timestamp preserved exactly", biometricEvent.timestamp.getTime() === deviceTime.getTime());
    assert("Device source 'biometric' preserved", biometricEvent.source === "biometric");

    // Check 6: Event sorting by timestamp
    console.log("\n--- 6. Event Sorting by Timestamp ---");
    const t1 = new Date("2026-10-13T09:00:00Z");
    const t2 = new Date("2026-10-13T12:00:00Z");
    const t3 = new Date("2026-10-13T12:30:00Z");
    const t4 = new Date("2026-10-13T18:00:00Z");

    const flowAttId = new mongoose.Types.ObjectId();
    const flowEmpId = new mongoose.Types.ObjectId();

    // Insert out of chronological order
    await AttendanceEvent.create({ attendanceId: flowAttId, employeeId: flowEmpId, type: "LOGOUT", timestamp: t4 });
    await AttendanceEvent.create({ attendanceId: flowAttId, employeeId: flowEmpId, type: "BREAK_START", timestamp: t2 });
    await AttendanceEvent.create({ attendanceId: flowAttId, employeeId: flowEmpId, type: "LOGIN", timestamp: t1 });
    await AttendanceEvent.create({ attendanceId: flowAttId, employeeId: flowEmpId, type: "BREAK_END", timestamp: t3 });

    const sortedEvents = await AttendanceEvent.find({ attendanceId: flowAttId }).sort({ timestamp: 1 }).lean();
    assert("Sorted count is exactly 4", sortedEvents.length === 4);
    assert("First event is LOGIN (t1)", sortedEvents[0].type === "LOGIN");
    assert("Second event is BREAK_START (t2)", sortedEvents[1].type === "BREAK_START");
    assert("Third event is BREAK_END (t3)", sortedEvents[2].type === "BREAK_END");
    assert("Fourth event is LOGOUT (t4)", sortedEvents[3].type === "LOGOUT");

    // Check 7: Enum validation & uppercase transformation
    console.log("\n--- 7. Enum Validation & Uppercase Transformation ---");
    const lowerDoc = await AttendanceEvent.create({
      attendanceId: testAttendanceId,
      employeeId: testEmployeeId,
      type: "login" // lowercase input
    });
    assert("Lowercase 'login' transformed to uppercase 'LOGIN'", lowerDoc.type === "LOGIN");

    let invalidEnumCaught = false;
    try {
      await AttendanceEvent.create({
        attendanceId: testAttendanceId,
        employeeId: testEmployeeId,
        type: "INVALID_ACTION"
      });
    } catch (err) {
      invalidEnumCaught = err.name === "ValidationError";
    }
    assert("Invalid enum 'INVALID_ACTION' rejected with ValidationError", invalidEnumCaught);

    // Check 8: Consumer import-order compatibility
    console.log("\n--- 8. Consumer Import-Order Compatibility ---");
    delete require.cache[require.resolve(path.join(backendDir, "models/AttendanceEvent"))];
    const FreshAttendanceEvent = require(path.join(backendDir, "models/AttendanceEvent"));
    assert("Fresh import resolves model cleanly", Boolean(FreshAttendanceEvent));
    assert("Idempotent registration: mongoose.models.AttendanceEvent matches export", mongoose.models.AttendanceEvent === FreshAttendanceEvent);

    // Check 9: AttendanceV2 helper simulation & HTTP route distinction
    console.log("\n--- 9. AttendanceV2 Handlers Compatibility & Real HTTP Route Test ---");
    async function createAttendanceEvent({ attendanceId, employeeId, type, timestamp = new Date(), source = "web", notes = "", session = null }) {
      const doc = new FreshAttendanceEvent({
        attendanceId,
        employeeId,
        type,
        timestamp,
        source,
        notes,
      });
      if (session) {
        await doc.save({ session });
      } else {
        await doc.save();
      }
      return doc;
    }

    const helperDoc = await createAttendanceEvent({
      attendanceId: testAttendanceId,
      employeeId: testEmployeeId,
      type: "LOGIN",
      source: "mobile",
      notes: "Via helper"
    });
    assert("Helper createAttendanceEvent creates document", Boolean(helperDoc._id));

    // Mount real Express HTTP app to test HTTP route behavior
    const app = express();
    app.use(express.json());

    // GET /api/v2/attendance/:id/events (mirrors line 8987 of attendance-v2.js)
    app.get("/api/v2/attendance/:id/events", async (req, res) => {
      try {
        const events = await FreshAttendanceEvent.find({ attendanceId: req.params.id }).sort({ timestamp: 1 });
        res.json({ success: true, count: events.length, data: events });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // POST /api/v2/attendance/punch-in-event (simulates punch-in HTTP event creation)
    app.post("/api/v2/attendance/punch-in-event", async (req, res) => {
      try {
        const event = await createAttendanceEvent({
          attendanceId: req.body.attendanceId,
          employeeId: req.body.employeeId,
          type: "LOGIN",
          source: req.body.source || "web",
          notes: req.body.notes || ""
        });
        res.status(201).json({ success: true, data: event });
      } catch (err) {
        res.status(400).json({ success: false, error: err.message });
      }
    });

    const server = await new Promise(resolve => {
      const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });
    const httpPort = server.address().port;

    // Test real HTTP POST
    const postPayload = JSON.stringify({
      attendanceId: flowAttId.toString(),
      employeeId: flowEmpId.toString(),
      source: "web-http-test",
      notes: "Created via real HTTP"
    });

    const postRes = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: "127.0.0.1",
        port: httpPort,
        path: "/api/v2/attendance/punch-in-event",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postPayload)
        }
      }, res => {
        let body = "";
        res.on("data", chunk => body += chunk);
        res.on("end", () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
      });
      req.on("error", reject);
      req.write(postPayload);
      req.end();
    });

    assert("HTTP POST /api/v2/attendance/punch-in-event returns 201", postRes.status === 201);
    assert("HTTP POST created event type is LOGIN", postRes.data.data.type === "LOGIN");

    // Test real HTTP GET events history
    const getRes = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${httpPort}/api/v2/attendance/${flowAttId}/events`, res => {
        let body = "";
        res.on("data", chunk => body += chunk);
        res.on("end", () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
      }).on("error", reject);
    });

    assert("HTTP GET /api/v2/attendance/:id/events returns 200", getRes.status === 200);
    assert("HTTP GET returns all 5 events for attendance record (4 previous + 1 HTTP post)", getRes.data.count === 5);

    await new Promise(resolve => server.close(resolve));
    console.log("Real HTTP test server closed successfully.");

  } finally {
    // Teardown: Drop ONLY this isolated test database
    console.log("\n--- TEARDOWN: Dropping Isolated Test Database ---");
    console.log(`Dropping test database: ${mongoose.connection.name}`);
    await mongoose.connection.db.dropDatabase();
    console.log(`Database dropped cleanly: ${TEST_DB_NAME}`);
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }

  console.log("\n================================================================================");
  console.log(`AUDIT CHECKS COMPLETE: ${passedChecks} PASSED, ${failedChecks} FAILED`);
  console.log("================================================================================");

  if (failedChecks > 0) {
    process.exit(1);
  }
}

runLiveAudit().catch(err => {
  console.error("Audit failure:", err);
  process.exit(1);
});

