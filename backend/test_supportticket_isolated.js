"use strict";
/**
 * test_supportticket_isolated.js
 * Isolated functional integration test suite for the centralized SupportTicket model.
 * Connects to a dedicated temporary local database and drops it on completion.
 */

const mongoose = require("mongoose");

const TEST_DB_NAME = `crm_isolated_ticket_test_${Date.now()}`;
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

async function runIsolatedTests() {
  console.log("================================================================================");
  console.log("   SUPPORTTICKET MODEL ISOLATED FUNCTIONAL INTEGRATION TEST                     ");
  console.log("================================================================================");
  console.log(`Connecting to ISOLATED database: ${TEST_URI}`);
  console.log(`Target Database Name: ${TEST_DB_NAME}`);

  await mongoose.connect(TEST_URI);
  console.log(`Connected successfully. Active DB: ${mongoose.connection.name}`);

  try {
    const SupportTicket = require("./models/SupportTicket");

    // ── 1. Model registration & collection name ──────────────────────────────
    console.log("\n[1] Model registration & collection name");
    assert("Model name is SupportTicket", SupportTicket.modelName === "SupportTicket");
    assert("Collection name is supporttickets", SupportTicket.collection.name === "supporttickets");
    assert("mongoose.models.SupportTicket matches export", mongoose.models.SupportTicket === SupportTicket);

    // ── 2. Index building & verification on live MongoDB instance ────────────
    console.log("\n[2] Index building & verification");
    await SupportTicket.init();
    const mongoIndexes = await SupportTicket.collection.indexes();
    console.log(
      "  Built MongoDB indexes:",
      JSON.stringify(mongoIndexes.map((i) => ({ key: i.key, name: i.name, unique: i.unique })))
    );

    assert("ticketCode unique index exists in MongoDB", mongoIndexes.some((idx) => idx.key.ticketCode === 1 && idx.unique === true));
    assert("clientId index exists in MongoDB", mongoIndexes.some((idx) => idx.key.clientId === 1));
    assert("productName index exists in MongoDB", mongoIndexes.some((idx) => idx.key.productName === 1));
    assert("source index exists in MongoDB", mongoIndexes.some((idx) => idx.key.source === 1));
    assert("priority index exists in MongoDB", mongoIndexes.some((idx) => idx.key.priority === 1));
    assert("status index exists in MongoDB", mongoIndexes.some((idx) => idx.key.status === 1));
    assert("assignedEmployeeId index exists in MongoDB", mongoIndexes.some((idx) => idx.key.assignedEmployeeId === 1));
    assert("dueDate index exists in MongoDB", mongoIndexes.some((idx) => idx.key.dueDate === 1));
    assert("linkedTaskId index exists in MongoDB", mongoIndexes.some((idx) => idx.key.linkedTaskId === 1));
    assert("isDeleted index exists in MongoDB", mongoIndexes.some((idx) => idx.key.isDeleted === 1));
    assert(
      "Compound index { clientId: 1, status: 1, createdAt: -1 } exists in MongoDB",
      mongoIndexes.some((idx) => idx.key.clientId === 1 && idx.key.status === 1 && idx.key.createdAt === -1)
    );
    assert(
      "Compound index { assignedEmployeeId: 1, status: 1 } exists in MongoDB",
      mongoIndexes.some((idx) => idx.key.assignedEmployeeId === 1 && idx.key.status === 1)
    );
    assert("Text index exists in MongoDB", mongoIndexes.some((idx) => idx.key._fts === "text"));

    // ── 3. Successful creation with defaults ─────────────────────────────────
    console.log("\n[3] Successful creation with defaults");
    const clientId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();

    const ticket1 = await SupportTicket.create({
      ticketCode: "TKT-TEST-001",
      title: "Cannot generate GST monthly report",
      description: "Clicking export results in empty PDF download.",
      clientId: clientId,
      clientName: "Alpha Enterprises",
      productName: "Billing ERP",
      productId: productId,
      createdBy: userId,
      createdByName: "Admin User",
    });

    assert("ticket1 persisted with _id", Boolean(ticket1._id));
    assert("ticketCode uppercase", ticket1.ticketCode === "TKT-TEST-001");
    assert("module default General", ticket1.module === "General");
    assert("category default Other", ticket1.category === "Other");
    assert("source default Admin", ticket1.source === "Admin");
    assert("priority default Medium", ticket1.priority === "Medium");
    assert("status default New", ticket1.status === "New");
    assert("assignedEmployeeId default null", ticket1.assignedEmployeeId === null);
    assert("assignedEmployeeName default Unassigned", ticket1.assignedEmployeeName === "Unassigned");
    assert("spentMinutes default 0", ticket1.spentMinutes === 0);
    assert("isDeleted default false", ticket1.isDeleted === false);
    assert("replies default empty array", Array.isArray(ticket1.replies) && ticket1.replies.length === 0);
    assert("internalNotes default empty array", Array.isArray(ticket1.internalNotes) && ticket1.internalNotes.length === 0);
    assert("attachments default empty array", Array.isArray(ticket1.attachments) && ticket1.attachments.length === 0);
    assert("callLogs default empty array", Array.isArray(ticket1.callLogs) && ticket1.callLogs.length === 0);
    assert("timeline default empty array", Array.isArray(ticket1.timeline) && ticket1.timeline.length === 0);
    assert("clientFeedback default null", ticket1.clientFeedback === null);
    assert("createdAt timestamp populated", ticket1.createdAt instanceof Date);
    assert("updatedAt timestamp populated", ticket1.updatedAt instanceof Date);

    // ── 4. Validation error tests ────────────────────────────────────────────
    console.log("\n[4] Validation error tests");

    // Missing ticketCode
    let valErr = null;
    try {
      await SupportTicket.create({
        title: "Test",
        description: "Test",
        clientId,
        clientName: "Test",
        productName: "Test",
      });
    } catch (e) {
      valErr = e;
    }
    assert("Missing ticketCode rejects", Boolean(valErr && valErr.name === "ValidationError"));

    // Missing title
    valErr = null;
    try {
      await SupportTicket.create({
        ticketCode: "TKT-ERR-001",
        description: "Test",
        clientId,
        clientName: "Test",
        productName: "Test",
      });
    } catch (e) {
      valErr = e;
    }
    assert("Missing title rejects with custom message", Boolean(valErr && valErr.errors.title));

    // Missing description
    valErr = null;
    try {
      await SupportTicket.create({
        ticketCode: "TKT-ERR-002",
        title: "Test",
        clientId,
        clientName: "Test",
        productName: "Test",
      });
    } catch (e) {
      valErr = e;
    }
    assert("Missing description rejects with custom message", Boolean(valErr && valErr.errors.description));

    // Missing clientId
    valErr = null;
    try {
      await SupportTicket.create({
        ticketCode: "TKT-ERR-003",
        title: "Test",
        description: "Test",
        clientName: "Test",
        productName: "Test",
      });
    } catch (e) {
      valErr = e;
    }
    assert("Missing clientId rejects", Boolean(valErr && valErr.errors.clientId));

    // Missing productName
    valErr = null;
    try {
      await SupportTicket.create({
        ticketCode: "TKT-ERR-004",
        title: "Test",
        description: "Test",
        clientId,
        clientName: "Test",
      });
    } catch (e) {
      valErr = e;
    }
    assert("Missing productName rejects with custom message", Boolean(valErr && valErr.errors.productName));

    // Invalid status enum
    valErr = null;
    try {
      await SupportTicket.create({
        ticketCode: "TKT-ERR-005",
        title: "Test",
        description: "Test",
        clientId,
        clientName: "Test",
        productName: "Test",
        status: "InvalidStatus",
      });
    } catch (e) {
      valErr = e;
    }
    assert("Invalid status enum rejects", Boolean(valErr && valErr.errors.status));

    // Invalid category enum
    valErr = null;
    try {
      await SupportTicket.create({
        ticketCode: "TKT-ERR-006",
        title: "Test",
        description: "Test",
        clientId,
        clientName: "Test",
        productName: "Test",
        category: "InvalidCategory",
      });
    } catch (e) {
      valErr = e;
    }
    assert("Invalid category enum rejects", Boolean(valErr && valErr.errors.category));

    // Duplicate ticketCode unique constraint
    let dupErr = null;
    try {
      await SupportTicket.create({
        ticketCode: "TKT-TEST-001",
        title: "Duplicate Ticket Code",
        description: "Test",
        clientId,
        clientName: "Test",
        productName: "Test",
      });
    } catch (e) {
      dupErr = e;
    }
    assert("Duplicate ticketCode triggers E11000 duplicate key error", Boolean(dupErr && dupErr.code === 11000));

    // ── 5. Subdocument operations ────────────────────────────────────────────
    console.log("\n[5] Subdocument operations");
    const empId = new mongoose.Types.ObjectId();

    // Timeline
    ticket1.timeline.push({
      type: "created",
      title: "Ticket Created",
      description: "Initial ticket logged via admin portal",
      performedBy: userId,
      performedByName: "Admin User",
      performedByRole: "admin",
    });

    // Replies (Public and Internal)
    ticket1.replies.push({
      message: "We are looking into your GST report issue.",
      replyType: "Public",
      authorId: empId,
      authorName: "Support Tech",
      authorRole: "employee",
    });
    ticket1.replies.push({
      message: "Check SQL query for GST ledger aggregation.",
      replyType: "Internal",
      authorId: userId,
      authorName: "Admin User",
      authorRole: "admin",
    });

    // Internal notes
    ticket1.internalNotes.push({
      note: "Client reported issue after upgrading to v2.1.0.",
      authorId: empId,
      authorName: "Support Tech",
      authorRole: "employee",
    });

    // Attachments
    ticket1.attachments.push({
      fileName: "error_screenshot.png",
      fileUrl: "/uploads/tickets/error_screenshot.png",
      fileType: "image/png",
      fileSize: 204800,
      uploadedBy: userId,
      uploadedByName: "Admin User",
      uploadedByRole: "admin",
    });

    // Call logs
    ticket1.callLogs.push({
      callType: "Incoming",
      contactPerson: "Rajesh Sharma",
      mobile: "9876543210",
      duration: "5 mins",
      summary: "Discussed error details and requested screenshot.",
      loggedBy: empId,
      loggedByName: "Support Tech",
      loggedByRole: "employee",
    });

    await ticket1.save();

    const reloaded = await SupportTicket.findById(ticket1._id);
    assert("Timeline length is 1", reloaded.timeline.length === 1);
    assert("Replies length is 2", reloaded.replies.length === 2);
    assert("Public reply matches", reloaded.replies[0].replyType === "Public");
    assert("Internal reply matches", reloaded.replies[1].replyType === "Internal");
    assert("Internal notes length is 1", reloaded.internalNotes.length === 1);
    assert("Attachments length is 1", reloaded.attachments.length === 1);
    assert("Call logs length is 1", reloaded.callLogs.length === 1);
    assert("Subdocuments have _ids", Boolean(reloaded.replies[0]._id && reloaded.attachments[0]._id));

    // ── 6. Client Feedback subdocument ───────────────────────────────────────
    console.log("\n[6] Client Feedback subdocument");
    reloaded.clientFeedback = {
      rating: 5,
      comment: "Issue resolved promptly. Thank you!",
      submittedAt: new Date(),
      submittedByClientId: clientId,
      submittedByName: "Rajesh Sharma",
    };
    await reloaded.save();

    const feedbackCheck = await SupportTicket.findById(ticket1._id);
    assert("clientFeedback rating is 5", feedbackCheck.clientFeedback.rating === 5);
    assert("clientFeedback comment matches", feedbackCheck.clientFeedback.comment === "Issue resolved promptly. Thank you!");
    assert("clientFeedback submittedByName matches", feedbackCheck.clientFeedback.submittedByName === "Rajesh Sharma");

    // Invalid feedback rating (> 5)
    let fbErr = null;
    try {
      feedbackCheck.clientFeedback.rating = 6;
      await feedbackCheck.save();
    } catch (e) {
      fbErr = e;
    }
    assert("Feedback rating > 5 rejects", Boolean(fbErr && fbErr.name === "ValidationError"));

    // ── 7. SLA and Status Transitions ────────────────────────────────────────
    console.log("\n[7] SLA and Status Transitions");
    const freshTicket = await SupportTicket.findById(ticket1._id);
    freshTicket.clientFeedback.rating = 5; // restore valid rating

    // Assignment
    freshTicket.assignedEmployeeId = empId;
    freshTicket.assignedEmployeeName = "Support Tech";
    freshTicket.assignedEmployeeCode = "EMP-042";
    freshTicket.assignedAt = new Date();
    freshTicket.status = "Assigned";
    freshTicket.firstResponseDueAt = new Date(Date.now() + 3600000);
    freshTicket.resolutionDueAt = new Date(Date.now() + 14400000);
    await freshTicket.save();

    let assigned = await SupportTicket.findById(freshTicket._id);
    assert("Status changed to Assigned", assigned.status === "Assigned");
    assert("assignedEmployeeId populated", Boolean(assigned.assignedEmployeeId));
    assert("firstResponseDueAt populated", Boolean(assigned.firstResponseDueAt));

    // First Response
    assigned.firstResponseAt = new Date();
    assigned.slaFirstResponseMinutes = 45;
    assigned.status = "In Progress";
    await assigned.save();

    let responded = await SupportTicket.findById(freshTicket._id);
    assert("Status changed to In Progress", responded.status === "In Progress");
    assert("firstResponseAt recorded", Boolean(responded.firstResponseAt));
    assert("slaFirstResponseMinutes is 45", responded.slaFirstResponseMinutes === 45);

    // Resolution & Linked Task
    const taskId = new mongoose.Types.ObjectId();
    responded.status = "Resolved";
    responded.resolvedAt = new Date();
    responded.firstResolvedAt = responded.resolvedAt;
    responded.slaResolutionMinutes = 180;
    responded.resolutionNote = "Updated GST report format template to v2.1.1.";
    responded.rootCause = "Template version mismatch during upgrade.";
    responded.linkedTaskId = taskId;
    responded.linkedTaskCode = "TSK-GST-001";
    await responded.save();

    let resolved = await SupportTicket.findById(freshTicket._id);
    assert("Status changed to Resolved", resolved.status === "Resolved");
    assert("resolvedAt recorded", Boolean(resolved.resolvedAt));
    assert("linkedTaskId recorded", Boolean(resolved.linkedTaskId));
    assert("linkedTaskCode recorded", resolved.linkedTaskCode === "TSK-GST-001");

    // Closure
    resolved.status = "Closed";
    resolved.closedAt = new Date();
    await resolved.save();

    let closed = await SupportTicket.findById(freshTicket._id);
    assert("Status changed to Closed", closed.status === "Closed");
    assert("closedAt recorded", Boolean(closed.closedAt));

    // ── 8. Soft Delete and Query Filtering ───────────────────────────────────
    console.log("\n[8] Soft Delete and Query Filtering");
    const activeCountBefore = await SupportTicket.countDocuments({ isDeleted: false });
    assert("Active tickets before soft delete is 1", activeCountBefore === 1);

    closed.isDeleted = true;
    await closed.save();

    const activeCountAfter = await SupportTicket.countDocuments({ isDeleted: false });
    const totalCount = await SupportTicket.countDocuments({});
    assert("Active tickets after soft delete is 0", activeCountAfter === 0);
    assert("Total tickets count remains 1", totalCount === 1);

  } finally {
    // ── Teardown: Drop isolated test database ────────────────────────────────
    console.log("\n[9] Teardown & Database cleanup");
    try {
      console.log(`Dropping isolated test database: ${TEST_DB_NAME}...`);
      await mongoose.connection.dropDatabase();
      console.log("Database dropped successfully.");
    } catch (dropErr) {
      console.error("Warning: Failed to drop test database:", dropErr.message);
    }
    await mongoose.disconnect();
    console.log("Disconnected from isolated test MongoDB instance.");
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n================================================================================");
  console.log(`TOTAL ISOLATED CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("All isolated SupportTicket integration checks passed successfully!");
    process.exit(0);
  }
}

runIsolatedTests().catch((err) => {
  console.error("Unhandled error in isolated tests:", err);
  process.exit(1);
});
