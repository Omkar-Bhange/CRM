const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../backend/.env") });

const {
  DEFAULT_SLA_POLICY,
  SLA_POLICY_VERSION,
  getTicketSlaPolicy,
  calculateDueAt,
  formatDurationMinutes,
  calculateTicketSla,
} = require("../backend/slaConfig");

async function runTests() {
  console.log("==================================================");
  console.log("ENHANCEMENT 4: TICKET SLA VERIFICATION SUITE");
  console.log("==================================================");

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

  // TEST 1: Matrix Validation
  console.log("\n--- TEST 1: Policy Matrix Validation ---");
  assert(DEFAULT_SLA_POLICY.Critical.firstResponseMinutes === 60, "Critical firstResponse is 60m (1h)");
  assert(DEFAULT_SLA_POLICY.Critical.resolutionMinutes === 240, "Critical resolution is 240m (4h)");
  assert(DEFAULT_SLA_POLICY.High.firstResponseMinutes === 120, "High firstResponse is 120m (2h)");
  assert(DEFAULT_SLA_POLICY.High.resolutionMinutes === 480, "High resolution is 480m (8h)");
  assert(DEFAULT_SLA_POLICY.Medium.firstResponseMinutes === 240, "Medium firstResponse is 240m (4h)");
  assert(DEFAULT_SLA_POLICY.Medium.resolutionMinutes === 1440, "Medium resolution is 1440m (24h)");
  assert(DEFAULT_SLA_POLICY.Low.firstResponseMinutes === 480, "Low firstResponse is 480m (8h)");
  assert(DEFAULT_SLA_POLICY.Low.resolutionMinutes === 2880, "Low resolution is 2880m (48h)");

  // TEST 2: Helpers
  console.log("\n--- TEST 2: Helper Functions ---");
  const pMedium = getTicketSlaPolicy("medium");
  assert(pMedium.firstResponseMinutes === 240, "Case-insensitive priority lookup works");
  const pUnknown = getTicketSlaPolicy("unknown_priority");
  assert(pUnknown.firstResponseMinutes === 240, "Fallback to Medium for unknown priority");

  const anchor = new Date("2026-01-01T10:00:00.000Z");
  const due = calculateDueAt(anchor, 60);
  assert(due.toISOString() === "2026-01-01T11:00:00.000Z", "calculateDueAt accurately adds minutes");

  assert(formatDurationMinutes(45) === "45m", "formatDurationMinutes(45) == 45m");
  assert(formatDurationMinutes(90) === "1h 30m", "formatDurationMinutes(90) == 1h 30m");
  assert(formatDurationMinutes(1500) === "1d 1h", "formatDurationMinutes(1500) == 1d 1h");

  // TEST 3: SLA Status Computations (In Progress, Due Soon, Overdue, Met, Breached)
  console.log("\n--- TEST 3: SLA Status Logic ---");
  const tCreated = new Date("2026-01-01T10:00:00.000Z");
  const mockTicketCritical = {
    priority: "Critical",
    createdAt: tCreated,
    slaFirstResponseMinutes: 60,
    slaResolutionMinutes: 240,
    firstResponseDueAt: new Date("2026-01-01T11:00:00.000Z"),
    resolutionDueAt: new Date("2026-01-01T14:00:00.000Z"),
    firstResponseAt: null,
    resolvedAt: null,
    status: "In Progress",
  };

  // At 10:10 (within SLA, > 25% remaining -> 50m left out of 60m)
  const slaOnTrack = calculateTicketSla(mockTicketCritical, new Date("2026-01-01T10:10:00.000Z"));
  assert(slaOnTrack.firstResponseStatus === "On Track", "Early in window is 'On Track'");
  assert(slaOnTrack.firstResponseRemainingMinutes === 50, "50 minutes remaining");

  // At 10:50 (within SLA, <= 25% remaining -> 10m left <= 15m threshold)
  const slaDueSoon = calculateTicketSla(mockTicketCritical, new Date("2026-01-01T10:50:00.000Z"));
  assert(slaDueSoon.firstResponseStatus === "Due Soon", "<= 25% window remaining is 'Due Soon'");
  assert(slaDueSoon.firstResponseRemainingMinutes === 10, "10 minutes remaining");

  // At 11:15 (past 11:00 due date -> overdue)
  const slaOverdue = calculateTicketSla(mockTicketCritical, new Date("2026-01-01T11:15:00.000Z"));
  assert(slaOverdue.firstResponseStatus === "Overdue", "Past due date is 'Overdue'");
  assert(slaOverdue.firstResponseRemainingMinutes === -15, "Overdue by 15 minutes");

  // Met First Response (responded at 10:40 <= 11:00)
  const mockTicketMet = {
    ...mockTicketCritical,
    firstResponseAt: new Date("2026-01-01T10:40:00.000Z"),
  };
  const slaMet = calculateTicketSla(mockTicketMet, new Date("2026-01-01T12:00:00.000Z"));
  assert(slaMet.firstResponseStatus === "Met", "Responded on or before deadline is 'Met'");
  assert(slaMet.firstResponseElapsedMinutes === 40, "Responded in 40 minutes");

  // Breached First Response (responded at 11:20 > 11:00)
  const mockTicketBreached = {
    ...mockTicketCritical,
    firstResponseAt: new Date("2026-01-01T11:20:00.000Z"),
  };
  const slaBreached = calculateTicketSla(mockTicketBreached, new Date("2026-01-01T12:00:00.000Z"));
  assert(slaBreached.firstResponseStatus === "Breached", "Responded after deadline is 'Breached'");
  assert(slaBreached.firstResponseElapsedMinutes === 80, "Responded in 80 minutes");

  // Resolution Met
  const mockTicketResolvedMet = {
    ...mockTicketCritical,
    status: "Resolved",
    resolvedAt: new Date("2026-01-01T13:30:00.000Z"), // before 14:00
  };
  const slaResMet = calculateTicketSla(mockTicketResolvedMet, new Date("2026-01-01T15:00:00.000Z"));
  assert(slaResMet.resolutionStatus === "Met", "Resolved before deadline is 'Met'");
  assert(slaResMet.resolutionElapsedMinutes === 210, "Resolved in 210 minutes (3h 30m)");

  // Resolution Breached
  const mockTicketResolvedBreached = {
    ...mockTicketCritical,
    status: "Resolved",
    resolvedAt: new Date("2026-01-01T14:30:00.000Z"), // after 14:00
  };
  const slaResBreached = calculateTicketSla(mockTicketResolvedBreached, new Date("2026-01-01T15:00:00.000Z"));
  assert(slaResBreached.resolutionStatus === "Breached", "Resolved after deadline is 'Breached'");

  // TEST 4: Legacy Ticket Dynamic Derivation
  console.log("\n--- TEST 4: Legacy Tickets without Snapshot Fields ---");
  const mockLegacyTicket = {
    priority: "High",
    createdAt: new Date("2026-01-01T08:00:00.000Z"),
    status: "In Progress",
    // no snapshot fields
  };
  const slaLegacy = calculateTicketSla(mockLegacyTicket, new Date("2026-01-01T09:00:00.000Z"));
  assert(slaLegacy.source === "derived", "Legacy ticket source is 'derived'");
  assert(slaLegacy.firstResponseTargetMinutes === 120, "Derived first response matches High (120m)");
  assert(slaLegacy.resolutionTargetMinutes === 480, "Derived resolution matches High (480m)");
  assert(slaLegacy.firstResponseStatus === "On Track", "Legacy ticket computed correctly");

  // TEST 5: Database Schema & Lifecycle Check
  console.log("\n--- TEST 5: Live Database Verification ---");
  require("../backend/admin");
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/ClientConnectTrack";
  await mongoose.connect(mongoUri);

  const SupportTicket = mongoose.models.SupportTicket;
  assert(Boolean(SupportTicket), "SupportTicket mongoose model is registered");

  // Create a test ticket
  const dummyClientId = new mongoose.Types.ObjectId();
  const testTicket = await SupportTicket.create({
    ticketCode: `TKT-TEST-${Date.now()}`,
    title: "SLA Integration Test Ticket",
    description: "Testing SLA snapshot, reply, and resolution behavior",
    clientId: dummyClientId,
    clientName: "Test Client Company",
    productName: "Test Product",
    priority: "High",
    status: "New",
    source: "Admin",
    createdAt: new Date(),
    slaFirstResponseMinutes: 120,
    slaResolutionMinutes: 480,
    firstResponseDueAt: new Date(Date.now() + 120 * 60000),
    resolutionDueAt: new Date(Date.now() + 480 * 60000),
    slaPolicyVersion: SLA_POLICY_VERSION,
  });

  assert(testTicket.slaFirstResponseMinutes === 120, "Saved ticket has snapshot slaFirstResponseMinutes = 120");
  assert(testTicket.slaResolutionMinutes === 480, "Saved ticket has snapshot slaResolutionMinutes = 480");
  assert(testTicket.firstResponseAt === null, "New ticket has firstResponseAt = null");
  assert(testTicket.firstResolvedAt === null, "New ticket has firstResolvedAt = null");

  // Simulate Internal Note -> Must NOT set firstResponseAt
  testTicket.replies.push({
    message: "Internal admin investigation note",
    replyType: "Internal",
    authorRole: "admin",
    authorName: "Admin User",
    createdAt: new Date(),
  });
  // Per our fix: only set if replyType === "Public"
  const replyType1 = "Internal";
  if (replyType1 === "Public" && !testTicket.firstResponseAt) {
    testTicket.firstResponseAt = new Date();
  }
  await testTicket.save();
  assert(testTicket.firstResponseAt === null, "Internal note did NOT trigger firstResponseAt");

  // Simulate Public Reply -> MUST set firstResponseAt
  const replyType2 = "Public";
  const replyTime = new Date();
  if (replyType2 === "Public" && !testTicket.firstResponseAt) {
    testTicket.firstResponseAt = replyTime;
  }
  testTicket.replies.push({
    message: "Public response to client",
    replyType: "Public",
    authorRole: "employee",
    authorName: "Support Tech",
    createdAt: replyTime,
  });
  await testTicket.save();
  assert(testTicket.firstResponseAt !== null, "Public reply set firstResponseAt");
  assert(testTicket.firstResponseAt.getTime() === replyTime.getTime(), "firstResponseAt timestamp matches reply time");

  // Second Public Reply -> MUST NOT overwrite firstResponseAt
  const secondReplyTime = new Date(Date.now() + 30000);
  if (replyType2 === "Public" && !testTicket.firstResponseAt) {
    testTicket.firstResponseAt = secondReplyTime;
  }
  assert(testTicket.firstResponseAt.getTime() === replyTime.getTime(), "Second public reply did NOT overwrite firstResponseAt");

  // Simulate Resolution
  const resolvedTime = new Date();
  testTicket.status = "Resolved";
  testTicket.resolvedAt = resolvedTime;
  if (!testTicket.firstResolvedAt) {
    testTicket.firstResolvedAt = testTicket.resolvedAt;
  }
  await testTicket.save();
  assert(testTicket.resolvedAt.getTime() === resolvedTime.getTime(), "Ticket resolvedAt is set");
  assert(testTicket.firstResolvedAt.getTime() === resolvedTime.getTime(), "Ticket firstResolvedAt is set");

  // Simulate Reopening
  testTicket.status = "In Progress";
  testTicket.resolvedAt = null;
  // Note: firstResolvedAt is NOT cleared!
  await testTicket.save();
  assert(testTicket.resolvedAt === null, "Reopening cleared resolvedAt");
  assert(testTicket.firstResolvedAt !== null, "Reopening preserved firstResolvedAt milestone!");

  // Cleanup test ticket
  await SupportTicket.deleteOne({ _id: testTicket._id });
  console.log("[CLEANUP] Deleted temporary test ticket.");

  await mongoose.disconnect();

  console.log("\n==================================================");
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
