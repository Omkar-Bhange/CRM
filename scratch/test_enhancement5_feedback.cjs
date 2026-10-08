const path = require("path");
const jwt = require(path.join(__dirname, "../backend/node_modules/jsonwebtoken"));
const axios = require(path.join(__dirname, "../backend/node_modules/axios"));
const mongoose = require(path.join(__dirname, "../backend/node_modules/mongoose"));
require(path.join(__dirname, "../backend/node_modules/dotenv")).config({ path: path.join(__dirname, "../backend/.env") });

async function runFeedbackVerification() {
  console.log("==================================================================");
  console.log("CLIENT PORTAL ENHANCEMENT 5: CLIENT SATISFACTION FEEDBACK TESTS");
  console.log("==================================================================");

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

  const jwtSecret = process.env.JWT_SECRET;
  const baseUrl = "http://localhost:5000";

  // Connect to DB directly to fetch real test IDs and verify schema
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB Atlas for test assertions.");

  require("../backend/admin");
  require("../backend/auth");
  const Client = mongoose.models.Client || mongoose.model("Client");
  const SupportTicket = mongoose.models.SupportTicket || mongoose.model("SupportTicket");
  const User = mongoose.models.User || mongoose.model("User");

  // Log in client A
  const loginRes = await axios.post(`${baseUrl}/api/auth/login`, {
    email: "r@gmail.com",
    password: "123456",
    role: "client",
  });
  const tokenClientA = loginRes.data.token;
  const userA = await User.findOne({ email: "r@gmail.com" });
  const clientA = await Client.findOne({ userId: userA._id, isDeleted: false });
  if (!clientA) {
    throw new Error("Client A profile not connected to user A");
  }
  console.log(`Authenticated Client A (${clientA.companyName}) via real auth session.`);

  // Find or create Client B for tenant isolation testing
  let clientB = await Client.findOne({ _id: { $ne: clientA._id }, isDeleted: false });
  let userB = clientB?.userId ? await User.findById(clientB.userId) : null;
  if (!userB) {
    // Check if another client user exists
    userB = await User.findOne({ _id: { $ne: userA._id }, role: "client" });
    if (userB) {
      clientB = await Client.findOne({ userId: userB._id, isDeleted: false });
    }
  }

  let tokenClientB;
  if (userB && clientB) {
    tokenClientB = jwt.sign(
      {
        userId: String(userB._id),
        role: "client",
        name: userB.name,
        email: userB.email,
      },
      jwtSecret,
      { expiresIn: "1h" }
    );
  } else {
    // Create temporary User and Client for B
    userB = await User.create({
      name: "Client B Isolation Tester",
      email: `clientb-${Date.now()}@test.com`,
      passwordHash: "dummyhash",
      role: "client",
      isActive: true,
    });
    clientB = await Client.create({
      companyName: "Client B Corp",
      contactPerson: "Bob Test",
      email: userB.email,
      mobile: "9999999999",
      userId: userB._id,
      clientCode: `CL-B-${Date.now().toString().slice(-4)}`,
      status: "Active",
    });
    tokenClientB = jwt.sign(
      {
        userId: String(userB._id),
        role: "client",
        name: userB.name,
        email: userB.email,
      },
      jwtSecret,
      { expiresIn: "1h" }
    );
  }
  console.log(`Client B configured for tenant isolation: ${clientB.companyName}`);

  const adminToken = jwt.sign(
    {
      userId: "6a5727e7c0c95cae46d64bf4",
      role: "admin",
      name: "Admin User",
      email: "totalsolution2023@gmail.com",
    },
    jwtSecret,
    { expiresIn: "1h" }
  );

  // Create a dedicated test ticket for Client A
  const testTicket = await SupportTicket.create({
    ticketCode: `FB-TEST-${Date.now().toString().slice(-6)}`,
    title: "Enhancement 5 Test Ticket",
    description: "Testing client satisfaction feedback workflow and safety checks.",
    clientId: clientA._id,
    clientName: clientA.companyName,
    clientCode: clientA.clientCode,
    contactPerson: clientA.contactPerson,
    productName: "ERP S/W",
    category: "Billing",
    priority: "High",
    status: "New",
    source: "Client Portal",
    slaFirstResponseMinutes: 120,
    slaResolutionMinutes: 480,
    firstResponseDueAt: new Date(Date.now() + 120 * 60000),
    resolutionDueAt: new Date(Date.now() + 480 * 60000),
    slaPolicyVersion: "default-v1",
    timeline: [
      {
        type: "created",
        title: "Ticket created",
        description: "Ticket created for test.",
        performedByName: clientA.contactPerson || "Client",
        performedByRole: "client",
        createdAt: new Date(),
      },
    ],
  });

  const ticketId = String(testTicket._id);
  console.log(`Created test ticket ${testTicket.ticketCode} (${ticketId}) for client ${clientA.companyName}`);

  try {
    // -------------------------------------------------------------
    // TEST 1: Ineligible status rejection (ticket is New)
    // -------------------------------------------------------------
    console.log("\n--- TEST 1: Ineligible Status Rejection ---");
    try {
      await axios.post(
        `${baseUrl}/api/client/tickets/${ticketId}/feedback`,
        { rating: 5, comment: "Too early" },
        { headers: { Authorization: `Bearer ${tokenClientA}` } }
      );
      assert(false, "Should have rejected feedback on 'New' ticket");
    } catch (err) {
      assert(err.response?.status === 400, "Rejected feedback on 'New' ticket with HTTP 400");
      assert(
        err.response?.data?.message?.includes("resolved or closed"),
        `Informative rejection message: ${err.response?.data?.message}`
      );
    }

    // Set ticket to In Progress, verify rejection
    testTicket.status = "In Progress";
    await testTicket.save();
    try {
      await axios.post(
        `${baseUrl}/api/client/tickets/${ticketId}/feedback`,
        { rating: 5 },
        { headers: { Authorization: `Bearer ${tokenClientA}` } }
      );
      assert(false, "Should have rejected feedback on 'In Progress' ticket");
    } catch (err) {
      assert(err.response?.status === 400, "Rejected feedback on 'In Progress' ticket with HTTP 400");
    }

    // Set ticket to Cancelled, verify rejection
    testTicket.status = "Cancelled";
    await testTicket.save();
    try {
      await axios.post(
        `${baseUrl}/api/client/tickets/${ticketId}/feedback`,
        { rating: 5 },
        { headers: { Authorization: `Bearer ${tokenClientA}` } }
      );
      assert(false, "Should have rejected feedback on 'Cancelled' ticket");
    } catch (err) {
      assert(err.response?.status === 400, "Rejected feedback on 'Cancelled' ticket with HTTP 400");
    }

    // Move ticket to Resolved (eligible status)
    testTicket.status = "Resolved";
    testTicket.resolvedAt = new Date();
    testTicket.firstResponseAt = new Date();
    await testTicket.save();

    // -------------------------------------------------------------
    // TEST 2: Rating value validations (1..5 integer)
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: Rating Value Validation ---");
    const invalidRatings = [0, 6, -1, 3.5, "five", null, undefined];
    for (const badRating of invalidRatings) {
      try {
        await axios.post(
          `${baseUrl}/api/client/tickets/${ticketId}/feedback`,
          { rating: badRating },
          { headers: { Authorization: `Bearer ${tokenClientA}` } }
        );
        assert(false, `Should have rejected invalid rating: ${badRating}`);
      } catch (err) {
        assert(err.response?.status === 400, `Rejected bad rating (${badRating}) with HTTP 400`);
      }
    }

    // -------------------------------------------------------------
    // TEST 3: Comment length validation (max 1000 chars)
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: Comment Length Validation ---");
    const oversizedComment = "a".repeat(1001);
    try {
      await axios.post(
        `${baseUrl}/api/client/tickets/${ticketId}/feedback`,
        { rating: 5, comment: oversizedComment },
        { headers: { Authorization: `Bearer ${tokenClientA}` } }
      );
      assert(false, "Should have rejected comment > 1000 characters");
    } catch (err) {
      assert(err.response?.status === 400, "Rejected 1001-character comment with HTTP 400");
    }

    // -------------------------------------------------------------
    // TEST 4: Cross-client isolation (Client B attempting to rate Client A's ticket)
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: Cross-Client Tenant Isolation ---");
    try {
      await axios.post(
        `${baseUrl}/api/client/tickets/${ticketId}/feedback`,
        { rating: 5, comment: "I am client B trying to rate client A's ticket" },
        { headers: { Authorization: `Bearer ${tokenClientB}` } }
      );
      assert(false, "Client B should not be able to rate Client A's ticket");
    } catch (err) {
      assert(err.response?.status === 404, "Cross-client attempt returned 404 Not Found");
    }

    // -------------------------------------------------------------
    // TEST 5: Successful Feedback Submission
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: Successful Feedback Submission ---");
    const snapshotBefore = await SupportTicket.findById(ticketId).lean();

    const validSubmissionRes = await axios.post(
      `${baseUrl}/api/client/tickets/${ticketId}/feedback`,
      { rating: 5, comment: "Excellent support! The issue was resolved quickly and professionally." },
      { headers: { Authorization: `Bearer ${tokenClientA}` } }
    );

    assert(validSubmissionRes.status === 200, "Feedback submitted successfully with HTTP 200");
    assert(validSubmissionRes.data?.success === true, "Response has success: true");
    const returnedData = validSubmissionRes.data?.data;
    assert(returnedData?.clientFeedback?.rating === 5, "Returned clientFeedback.rating is 5");
    assert(
      returnedData?.clientFeedback?.comment === "Excellent support! The issue was resolved quickly and professionally.",
      "Returned clientFeedback.comment matches submitted text"
    );
    assert(Boolean(returnedData?.clientFeedback?.submittedAt), "Returned clientFeedback has submittedAt timestamp");

    // Verify DB state and SLA Immutability
    const snapshotAfter = await SupportTicket.findById(ticketId).lean();
    assert(snapshotAfter.clientFeedback?.rating === 5, "DB persisted clientFeedback.rating == 5");
    assert(
      snapshotAfter.clientFeedback?.submittedByName === (clientA.contactPerson || clientA.companyName),
      `DB persisted submittedByName: ${snapshotAfter.clientFeedback?.submittedByName}`
    );

    // SLA Immutability check
    assert(
      snapshotAfter.slaFirstResponseMinutes === snapshotBefore.slaFirstResponseMinutes,
      "SLA first response minutes untouched"
    );
    assert(
      snapshotAfter.slaResolutionMinutes === snapshotBefore.slaResolutionMinutes,
      "SLA resolution minutes untouched"
    );
    assert(
      new Date(snapshotAfter.firstResponseDueAt).toISOString() === new Date(snapshotBefore.firstResponseDueAt).toISOString(),
      "SLA firstResponseDueAt untouched"
    );
    assert(
      new Date(snapshotAfter.resolutionDueAt).toISOString() === new Date(snapshotBefore.resolutionDueAt).toISOString(),
      "SLA resolutionDueAt untouched"
    );
    assert(
      new Date(snapshotAfter.resolvedAt).toISOString() === new Date(snapshotBefore.resolvedAt).toISOString(),
      "Ticket resolvedAt timestamp untouched"
    );
    assert(snapshotAfter.status === snapshotBefore.status, "Ticket status unchanged by feedback submission");

    // Timeline event check
    const lastTimelineEvent = snapshotAfter.timeline[snapshotAfter.timeline.length - 1];
    assert(lastTimelineEvent?.type === "feedback", "Timeline recorded an event with type: 'feedback'");
    assert(lastTimelineEvent?.title === "Client Feedback Submitted", "Timeline title is 'Client Feedback Submitted'");

    // -------------------------------------------------------------
    // TEST 6: One-Time Submission Enforcement (409 Conflict)
    // -------------------------------------------------------------
    console.log("\n--- TEST 6: One-Time Submission Enforcement ---");
    try {
      await axios.post(
        `${baseUrl}/api/client/tickets/${ticketId}/feedback`,
        { rating: 4, comment: "Attempting to change my review" },
        { headers: { Authorization: `Bearer ${tokenClientA}` } }
      );
      assert(false, "Should have rejected second feedback submission");
    } catch (err) {
      assert(err.response?.status === 409, "Second feedback submission rejected with HTTP 409 Conflict");
      assert(
        err.response?.data?.message?.includes("already been submitted"),
        `Conflict message clear: ${err.response?.data?.message}`
      );
    }

    // -------------------------------------------------------------
    // TEST 7: Reopen preserves historical feedback
    // -------------------------------------------------------------
    console.log("\n--- TEST 7: Reopening Preserves Historical Feedback ---");
    const reopenRes = await axios.post(
      `${baseUrl}/api/client/tickets/${ticketId}/status`,
      { status: "New", note: "Client reopened ticket for additional help" },
      { headers: { Authorization: `Bearer ${tokenClientA}` } }
    );
    assert(reopenRes.status === 200, "Ticket reopened successfully");
    const reopenedDoc = await SupportTicket.findById(ticketId).lean();
    assert(reopenedDoc.status === "New", "Ticket status transitioned to 'New'");
    assert(reopenedDoc.clientFeedback?.rating === 5, "Historical client feedback rating 5 preserved after reopen");
    assert(
      reopenedDoc.clientFeedback?.comment?.includes("Excellent support"),
      "Historical client feedback comment preserved after reopen"
    );

    // -------------------------------------------------------------
    // TEST 8: Admin visibility of client feedback
    // -------------------------------------------------------------
    console.log("\n--- TEST 8: Admin Visibility of Client Feedback ---");
    const adminTicketRes = await axios.get(
      `${baseUrl}/api/admin/ticket/${ticketId}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(adminTicketRes.status === 200, "Admin can retrieve ticket");
    assert(
      adminTicketRes.data?.data?.clientFeedback?.rating === 5,
      "Admin ticket view serializes clientFeedback.rating: 5"
    );
    assert(
      adminTicketRes.data?.data?.clientFeedback?.comment?.includes("Excellent support"),
      "Admin ticket view serializes clientFeedback.comment"
    );

  } finally {
    // Clean up test ticket
    await SupportTicket.findByIdAndDelete(ticketId);
    console.log(`\nCleaned up test ticket ${ticketId}.`);
    await mongoose.disconnect();
  }

  console.log("\n==================================================");
  console.log(`ENHANCEMENT 5 TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runFeedbackVerification().catch((err) => {
  console.error("Unhandled error in test suite:", err);
  process.exit(1);
});
