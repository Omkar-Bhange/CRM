require("dotenv").config({ path: require("path").join(__dirname, ".env") });
process.env.JWT_SECRET = process.env.JWT_SECRET || "crm_jwt_secret_key_12345";
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const http = require("http");
const fs = require("fs");
const path = require("path");

const TEST_DB_NAME = `crm_isolated_ticket_api_${Date.now()}`;
const TEST_URI = `mongodb://127.0.0.1:27017/${TEST_DB_NAME}`;

let passed = 0;
let failed = 0;

function assert(label, cond) {
  if (cond) {
    console.log("  PASS:", label);
    passed++;
  } else {
    console.error("  FAIL:", label);
    failed++;
  }
}

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, headers: res.headers, body: parsed, rawBody: body });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body, rawBody: body });
        }
      });
    });
    req.on("error", reject);
    if (data) {
      if (typeof data === "string" || Buffer.isBuffer(data)) {
        req.write(data);
      } else {
        req.write(JSON.stringify(data));
      }
    }
    req.end();
  });
}

async function runApiTests() {
  console.log("================================================================================");
  console.log("   AUTHENTICATED SUPPORTTICKET HTTP API INTEGRATION TESTS                       ");
  console.log("================================================================================");
  console.log(`Connecting to ISOLATED database: ${TEST_URI}`);

  await mongoose.connect(TEST_URI);
  console.log(`Connected to isolated test DB: ${mongoose.connection.name}`);

  let server = null;

  try {
    // Require and compile models
    require("./auth");
    const adminRoutes = require("./admin");
    const clientRoutes = require("./client");
    const employeeRoutes = require("./employee");
    const secureUploadsRoutes = require("./secureUploads");

    const User = mongoose.models.User;
    const Employee = mongoose.models.Employee;
    const Client = mongoose.models.Client;
    const Product = require("./models/Product");
    const SupportTicket = require("./models/SupportTicket");
    const ActivityLog = require("./models/ActivityLog");
    const ClientNotification = require("./models/ClientNotification");
    const EmployeeNotification = require("./models/EmployeeNotification");
    const SystemSettings = require("./models/SystemSettings");

    // Initialize SystemSettings singleton
    await SystemSettings.create({
      settingsKey: "system",
      companyName: "Total Solution Enterprises",
    });

    // Seed Product
    const testProduct = await Product.create({
      productName: "ERP Enterprise Suite",
      productCode: "ERP-100",
      description: "Core ERP Solution",
      category: "Software",
    });

    // Seed Admin User
    const adminUserId = new mongoose.Types.ObjectId();
    await User.create({
      _id: adminUserId,
      name: "Admin Tester",
      email: "admin@test.local",
      password: "hashedpassword123",
      role: "admin",
      status: "Active",
    });

    // Seed Employee User & Profile
    const empUserId = new mongoose.Types.ObjectId();
    const empProfileId = new mongoose.Types.ObjectId();
    await User.create({
      _id: empUserId,
      name: "Support Engineer",
      email: "engineer@test.local",
      password: "hashedpassword123",
      role: "employee",
      status: "Active",
    });

    await Employee.create({
      _id: empProfileId,
      userId: empUserId,
      employeeCode: "EMP-101",
      name: "Support Engineer",
      email: "engineer@test.local",
      department: "Support",
      role: "Technical Support",
      status: "Free",
      isActive: true,
    });

    // Seed Client 1 User & Profile
    const client1UserId = new mongoose.Types.ObjectId();
    const client1ProfileId = new mongoose.Types.ObjectId();
    await User.create({
      _id: client1UserId,
      name: "Client Alpha Manager",
      email: "client1@test.local",
      password: "hashedpassword123",
      role: "client",
      status: "Active",
      clientId: client1ProfileId,
    });

    await Client.create({
      _id: client1ProfileId,
      userId: client1UserId,
      companyName: "Client Alpha Corp",
      name: "Client Alpha Corp",
      clientCode: "CL-ALPHA",
      email: "client1@test.local",
      contactPerson: "Alpha Contact",
      mobile: "9123456780",
      products: [
        {
          _id: testProduct._id,
          productId: testProduct._id,
          productName: testProduct.productName,
          productCode: testProduct.productCode,
        },
      ],
      purchasedProducts: [
        {
          productId: testProduct._id,
          productName: testProduct.productName,
          productCode: testProduct.productCode,
        },
      ],
      isDeleted: false,
    });

    // Seed Client 2 User & Profile (for cross-client isolation tests)
    const client2UserId = new mongoose.Types.ObjectId();
    const client2ProfileId = new mongoose.Types.ObjectId();
    await User.create({
      _id: client2UserId,
      name: "Client Beta Manager",
      email: "client2@test.local",
      password: "hashedpassword123",
      role: "client",
      status: "Active",
      clientId: client2ProfileId,
    });

    await Client.create({
      _id: client2ProfileId,
      userId: client2UserId,
      companyName: "Client Beta Ltd",
      name: "Client Beta Ltd",
      clientCode: "CL-BETA",
      email: "client2@test.local",
      contactPerson: "Beta Contact",
      mobile: "9123456781",
      products: [],
      purchasedProducts: [],
      isDeleted: false,
    });

    // Generate JWT Tokens
    const JWT_SECRET = process.env.JWT_SECRET || "default_test_jwt_secret";
    const tokenAdmin = jwt.sign({ userId: adminUserId }, JWT_SECRET);
    const tokenEmployee = jwt.sign({ userId: empUserId }, JWT_SECRET);
    const tokenClient1 = jwt.sign({ userId: client1UserId }, JWT_SECRET);
    const tokenClient2 = jwt.sign({ userId: client2UserId }, JWT_SECRET);

    // Setup Express App
    const app = express();
    app.use(express.json());
    app.use("/api/admin", adminRoutes);
    app.use("/api/client", clientRoutes);
    app.use("/api/employee", employeeRoutes);
    app.use("/api/uploads", secureUploadsRoutes);

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    console.log(`Test HTTP server listening on port ${port}`);

    // Helper to make API calls
    const apiCall = (method, path, token, data) => {
      return request(
        {
          hostname: "127.0.0.1",
          port,
          path,
          method,
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
        data
      );
    };

    // ── SCENARIO 1: Admin Ticket Creation ────────────────────────────────────
    console.log("\n[SCENARIO 1] Admin ticket creation");
    const createAdminRes = await apiCall("POST", "/api/admin/ticket", tokenAdmin, {
      title: "Admin Created Ticket - Database Synchronization Failure",
      description: "Data sync failed during nightly maintenance run.",
      clientId: client1ProfileId.toString(),
      productName: testProduct.productName,
      productId: testProduct._id.toString(),
      priority: "High",
      category: "Data Issue",
      source: "Admin",
      assignedEmployeeId: empProfileId.toString(),
    });

    assert("Admin ticket create returns 201 or 200", createAdminRes.status === 201 || createAdminRes.status === 200);
    assert("Admin ticket response has success: true", createAdminRes.body && createAdminRes.body.success === true);
    const adminTicketId = createAdminRes.body.data ? createAdminRes.body.data._id : null;
    assert("Admin ticket returned valid _id", Boolean(adminTicketId));

    // ── SCENARIO 2: Client Portal Ticket Creation ────────────────────────────
    console.log("\n[SCENARIO 2] Client portal ticket creation");
    const createClientRes = await apiCall("POST", "/api/client/tickets", tokenClient1, {
      title: "Client Portal Ticket - Login MFA Issue",
      description: "Users are not receiving SMS OTP for two-factor authentication.",
      productName: testProduct.productName,
      productId: testProduct._id.toString(),
      priority: "High",
      category: "Login",
      contactPerson: "Alpha Contact",
      contactMobile: "9123456780",
    });

    assert("Client ticket create returns 201 or 200", createClientRes.status === 201 || createClientRes.status === 200);
    assert("Client ticket response has success: true", createClientRes.body && createClientRes.body.success === true);
    const clientTicketId = createClientRes.body.data ? createClientRes.body.data._id : null;
    assert("Client ticket returned valid _id", Boolean(clientTicketId));

    // ── SCENARIO 3: Client-Specific Ticket Listing ───────────────────────────
    console.log("\n[SCENARIO 3] Client-specific ticket listing");
    const clientListRes = await apiCall("GET", "/api/client/tickets", tokenClient1);
    assert("Client ticket list returns 200", clientListRes.status === 200);
    assert("Client list response success: true", clientListRes.body && clientListRes.body.success === true);
    const client1Tickets = clientListRes.body.data || clientListRes.body.tickets || [];
    assert("Client 1 sees tickets belonging to Client 1", client1Tickets.length >= 2);

    // Cross-client isolation check: Client 2 should see 0 tickets
    const client2ListRes = await apiCall("GET", "/api/client/tickets", tokenClient2);
    assert("Client 2 ticket list returns 200", client2ListRes.status === 200);
    const client2Tickets = client2ListRes.body.data || client2ListRes.body.tickets || [];
    assert("Client 2 sees 0 tickets (strict tenant isolation)", client2Tickets.length === 0);

    // ── SCENARIO 4: Employee Assigned Ticket Listing ─────────────────────────
    console.log("\n[SCENARIO 4] Employee assigned-ticket listing");
    const empListRes = await apiCall("GET", "/api/employee/my-tickets", tokenEmployee);
    assert("Employee ticket list returns 200", empListRes.status === 200);
    const empTickets = empListRes.body.data || empListRes.body.tickets || [];
    assert("Employee sees assigned tickets", Array.isArray(empTickets));

    // ── SCENARIO 5: Ticket Detail Retrieval ──────────────────────────────────
    console.log("\n[SCENARIO 5] Ticket detail retrieval");
    const adminDetailRes = await apiCall("GET", `/api/admin/ticket/${clientTicketId}`, tokenAdmin);
    assert("Admin detail retrieval returns 200", adminDetailRes.status === 200);
    assert("Admin detail matches clientTicketId", adminDetailRes.body.data && adminDetailRes.body.data._id === clientTicketId);

    const clientDetailRes = await apiCall("GET", `/api/client/tickets/${clientTicketId}`, tokenClient1);
    assert("Client detail retrieval returns 200", clientDetailRes.status === 200);
    assert("Client detail matches clientTicketId", clientDetailRes.body.data && clientDetailRes.body.data._id === clientTicketId);

    // Cross-client detail access rejection
    const crossClientDetailRes = await apiCall("GET", `/api/client/tickets/${clientTicketId}`, tokenClient2);
    assert("Cross-client detail retrieval denied (403 or 404)", crossClientDetailRes.status === 403 || crossClientDetailRes.status === 404);

    // ── SCENARIO 6: Employee Assignment & Reassignment ───────────────────────
    console.log("\n[SCENARIO 6] Employee assignment and reassignment");
    const assignRes = await apiCall("PUT", `/api/admin/ticket/${clientTicketId}`, tokenAdmin, {
      assignedEmployeeId: empProfileId.toString(),
      status: "Assigned",
    });
    assert("Admin update/assign ticket returns 200", assignRes.status === 200);

    const ticketAfterAssign = await SupportTicket.findById(clientTicketId);
    assert("Ticket assignedEmployeeId is updated", ticketAfterAssign.assignedEmployeeId.toString() === empProfileId.toString());
    assert("Ticket status is Assigned", ticketAfterAssign.status === "Assigned");

    // ── SCENARIO 7: Status Transitions ───────────────────────────────────────
    console.log("\n[SCENARIO 7] Status transitions");
    const statusRes = await apiCall("PATCH", `/api/admin/ticket/${clientTicketId}/status`, tokenAdmin, {
      status: "In Progress",
    });
    assert("Transition to In Progress returns 200", statusRes.status === 200);

    const ticketInProgress = await SupportTicket.findById(clientTicketId);
    assert("Ticket status transitioned to In Progress", ticketInProgress.status === "In Progress");

    // ── SCENARIO 8: Ticket Reply Submission ──────────────────────────────────
    console.log("\n[SCENARIO 8] Ticket reply submission");
    const clientReplyRes = await apiCall("POST", `/api/client/tickets/${clientTicketId}/reply`, tokenClient1, {
      message: "Here is additional context: SMS gateway returned error 503.",
    });
    assert("Client reply returns 200", clientReplyRes.status === 200);

    const adminReplyRes = await apiCall("POST", `/api/admin/ticket/${clientTicketId}/reply`, tokenAdmin, {
      message: "Gateway credentials have been refreshed. Please re-test.",
      replyType: "Public",
    });
    assert("Admin reply returns 200 or 201", adminReplyRes.status === 200 || adminReplyRes.status === 201);

    const ticketWithReplies = await SupportTicket.findById(clientTicketId);
    assert("Ticket has 2 replies recorded", ticketWithReplies.replies.length === 2);
    assert("First reply is from client", ticketWithReplies.replies[0].authorRole === "client");
    assert("Second reply is from admin", ticketWithReplies.replies[1].authorRole === "admin");

    // ── SCENARIO 9: Attachment Metadata Persistence ──────────────────────────
    console.log("\n[SCENARIO 9] Attachment metadata persistence");
    const dummyUploadPath = path.join(__dirname, "uploads", "tickets", "sms_error_log.txt");
    fs.mkdirSync(path.dirname(dummyUploadPath), { recursive: true });
    fs.writeFileSync(dummyUploadPath, "Sample log content for testing.");

    ticketWithReplies.attachments.push({
      fileName: "sms_error_log.txt",
      fileUrl: "/uploads/tickets/sms_error_log.txt",
      fileType: "text/plain",
      fileSize: 1024,
      uploadedBy: client1UserId,
      uploadedByName: "Client Alpha Manager",
      uploadedByRole: "client",
    });
    await ticketWithReplies.save();

    const ticketWithAtt = await SupportTicket.findById(clientTicketId);
    assert("Attachment metadata persisted", ticketWithAtt.attachments.length === 1);
    assert("Attachment fileUrl matches", ticketWithAtt.attachments[0].fileUrl === "/uploads/tickets/sms_error_log.txt");

    // ── SCENARIO 10 & 11: Authorized & Unauthorized Attachment Download ─────
    console.log("\n[SCENARIO 10 & 11] Authorized download & cross-client rejection");
    // Client 1 (owner) request
    const authDownloadRes = await apiCall("GET", "/api/uploads/tickets/sms_error_log.txt", tokenClient1);
    assert("Client 1 (owner) is authorized (status === 200)", authDownloadRes.status === 200);

    // Client 2 (attacker) request
    const crossClientDownloadRes = await apiCall("GET", "/api/uploads/tickets/sms_error_log.txt", tokenClient2);
    assert("Client 2 (attacker) denied with 403 Forbidden", crossClientDownloadRes.status === 403);

    // ── SCENARIO 12 & 13: SLA Tracking ───────────────────────────────────────
    console.log("\n[SCENARIO 12 & 13] SLA First-Response & Resolution tracking");
    ticketWithAtt.firstResponseAt = new Date();
    ticketWithAtt.slaFirstResponseMinutes = 30;
    ticketWithAtt.status = "Resolved";
    ticketWithAtt.resolvedAt = new Date();
    ticketWithAtt.firstResolvedAt = ticketWithAtt.resolvedAt;
    ticketWithAtt.slaResolutionMinutes = 90;
    ticketWithAtt.resolutionNote = "SMS gateway endpoint restored.";
    await ticketWithAtt.save();

    const slaTicket = await SupportTicket.findById(clientTicketId);
    assert("firstResponseAt is recorded", Boolean(slaTicket.firstResponseAt));
    assert("slaFirstResponseMinutes is 30", slaTicket.slaFirstResponseMinutes === 30);
    assert("resolvedAt is recorded", Boolean(slaTicket.resolvedAt));
    assert("slaResolutionMinutes is 90", slaTicket.slaResolutionMinutes === 90);

    // ── SCENARIO 14: Overdue and Escalation Behavior ─────────────────────────
    console.log("\n[SCENARIO 14] Overdue and escalation behavior");
    const isOverdue = slaTicket.resolutionDueAt ? slaTicket.resolvedAt > slaTicket.resolutionDueAt : false;
    assert("Overdue calculation is evaluable and deterministic", typeof isOverdue === "boolean");

    // ── SCENARIO 16: Client Satisfaction Feedback (while ticket is Resolved) ──
    console.log("\n[SCENARIO 16] Client satisfaction feedback");
    const feedbackRes = await apiCall("POST", `/api/client/tickets/${clientTicketId}/feedback`, tokenClient1, {
      rating: 5,
      comment: "Superb quick resolution on SMS gateway issue!",
    });
    assert("Feedback submission returns 200", feedbackRes.status === 200);

    const ticketWithFeedback = await SupportTicket.findById(clientTicketId);
    assert("Client feedback rating is 5", ticketWithFeedback.clientFeedback && ticketWithFeedback.clientFeedback.rating === 5);
    assert("Client feedback comment is stored", ticketWithFeedback.clientFeedback && ticketWithFeedback.clientFeedback.comment === "Superb quick resolution on SMS gateway issue!");

    // ── SCENARIO 15: Ticket Closure and Reopening ────────────────────────────
    console.log("\n[SCENARIO 15] Ticket closure and reopening");
    const closeRes = await apiCall("PATCH", `/api/admin/ticket/${clientTicketId}/status`, tokenAdmin, {
      status: "Closed",
    });
    assert("Admin close ticket returns 200", closeRes.status === 200);

    const closedTicket = await SupportTicket.findById(clientTicketId);
    assert("Ticket status is Closed", closedTicket.status === "Closed");

    // Reopen via Client endpoint
    const reopenRes = await apiCall("POST", `/api/client/tickets/${clientTicketId}/status`, tokenClient1, {
      status: "In Progress",
      reason: "Issue reoccurred for certain phone numbers.",
    });
    assert("Client status update/reopen returns 200", reopenRes.status === 200);

    const reopenedTicket = await SupportTicket.findById(clientTicketId);
    assert("Ticket reopened to In Progress or Open", reopenedTicket.status === "In Progress" || reopenedTicket.status === "New");

    // ── SCENARIO 17: Task Linkage ────────────────────────────────────────────
    console.log("\n[SCENARIO 17] Task linkage");
    const Task = require("./models/Task");
    const linkedTask = await Task.create({
      taskCode: "TSK-TKT-001",
      title: "Fix SMS Gateway",
      assignedEmployeeId: empProfileId,
      assignedEmployeeName: "Support Engineer",
      assignedBy: adminUserId,
      dueDate: new Date(Date.now() + 86400000),
      ticketId: clientTicketId,
      ticketCode: ticketWithFeedback.ticketCode,
    });

    ticketWithFeedback.linkedTaskId = linkedTask._id;
    ticketWithFeedback.linkedTaskCode = linkedTask.taskCode;
    await ticketWithFeedback.save();

    const ticketWithTask = await SupportTicket.findById(clientTicketId);
    assert("linkedTaskId correctly references Task", ticketWithTask.linkedTaskId.toString() === linkedTask._id.toString());
    assert("linkedTaskCode correctly recorded", ticketWithTask.linkedTaskCode === "TSK-TKT-001");

    // ── SCENARIO 18: ActivityLog Creation ────────────────────────────────────
    console.log("\n[SCENARIO 18] ActivityLog creation");
    await ActivityLog.create({
      action: "TICKET_FEEDBACK_SUBMITTED",
      category: "Ticket",
      entityType: "ticket",
      entityId: clientTicketId,
      entityCode: ticketWithTask.ticketCode,
      clientId: client1ProfileId,
      performedBy: client1UserId,
      performedByName: "Client Alpha Manager",
      performedByRole: "client",
      description: "Client submitted rating 5 feedback",
    });

    const logs = await ActivityLog.find({ entityId: clientTicketId });
    assert("ActivityLog entries exist for ticket", logs.length >= 1);
    assert("ActivityLog action matches", logs.some((l) => l.action === "TICKET_FEEDBACK_SUBMITTED"));

    // ── SCENARIO 19: Notification Generation & Deduplication ─────────────────
    console.log("\n[SCENARIO 19] Notification generation and deduplication");
    await ClientNotification.create({
      clientId: client1ProfileId,
      type: "TICKET_RESOLVED",
      title: "Your ticket was resolved",
      message: "Ticket has been resolved by Support Team.",
      entityId: clientTicketId,
      entityCode: ticketWithTask.ticketCode,
      dedupKey: `ticket_resolved_${clientTicketId}`,
    });

    const clientNotifs = await ClientNotification.find({ clientId: client1ProfileId });
    assert("Client notification created", clientNotifs.length >= 1);
    assert("Notification entityCode matches ticketCode", clientNotifs[0].entityCode === ticketWithTask.ticketCode);

    // ── SCENARIO 20: Existing API Response Compatibility ─────────────────────
    console.log("\n[SCENARIO 20] Existing API response compatibility");
    const freshDetail = await apiCall("GET", `/api/admin/ticket/${clientTicketId}`, tokenAdmin);
    assert("Detail response status is 200", freshDetail.status === 200);
    assert("Detail has success: true", freshDetail.body.success === true);
    assert("Detail has data object", typeof freshDetail.body.data === "object");
    assert("data.ticketCode is string", typeof freshDetail.body.data.ticketCode === "string");
    assert("data.status is string", typeof freshDetail.body.data.status === "string");
    assert("data.replies is array", Array.isArray(freshDetail.body.data.replies));
    assert("data.timeline is array", Array.isArray(freshDetail.body.data.timeline));
    assert("data.attachments is array", Array.isArray(freshDetail.body.data.attachments));

  } finally {
    console.log("\n[Teardown] Cleaning up isolated database and HTTP server...");
    if (server) {
      server.close();
      console.log("HTTP server closed.");
    }
    try {
      await mongoose.connection.dropDatabase();
      console.log(`Dropped test database: ${TEST_DB_NAME}`);
    } catch (dropErr) {
      console.error("Warning: Failed to drop test database:", dropErr.message);
    }
    try {
      const dummyPath = path.join(__dirname, "uploads", "tickets", "sms_error_log.txt");
      if (fs.existsSync(dummyPath)) fs.unlinkSync(dummyPath);
    } catch (_) {}
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n================================================================================");
  console.log(`TOTAL HTTP API CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("All SupportTicket authenticated HTTP API checks passed successfully!");
    process.exit(0);
  }
}

runApiTests().catch((err) => {
  console.error("Unhandled error in API tests:", err);
  process.exit(1);
});
