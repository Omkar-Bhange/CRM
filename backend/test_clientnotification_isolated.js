"use strict";
/**
 * test_clientnotification_isolated.js
 * Isolated functional integration test suite for ClientNotification model.
 * Connects to a dedicated temporary local database and drops it on completion.
 */

const mongoose = require("mongoose");

const TEST_DB_NAME = `crm_isolated_clientnotif_test_${Date.now()}`;
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

// Mirrors formatClientNotification in backend/client.js
function formatClientNotification(n) {
  if (!n) return null;
  return {
    id: String(n._id),
    _id: String(n._id),
    type: n.type,
    title: n.title,
    message: n.message,
    entityType: n.entityType || "other",
    entityCode: n.entityCode || "",
    entityId: n.entityId ? String(n.entityId) : null,
    navigationTarget: n.navigationTarget || "overview",
    isRead: Boolean(n.isRead),
    readAt: n.readAt || null,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  };
}

async function runIsolatedTests() {
  console.log("================================================================================");
  console.log("   CLIENTNOTIFICATION ISOLATED FUNCTIONAL INTEGRATION TEST                       ");
  console.log("================================================================================");
  console.log(`Connecting to ISOLATED database: ${TEST_URI}`);
  console.log(`Target Database Name: ${TEST_DB_NAME}`);

  await mongoose.connect(TEST_URI);
  console.log(`Connected successfully. Active DB: ${mongoose.connection.name}`);

  try {
    const ClientNotification = require("./models/ClientNotification");

    // 1. Model registration & collection name
    console.log("\n[1] Model registration & collection name");
    assert("Model name is ClientNotification", ClientNotification.modelName === "ClientNotification");
    assert("Collection name is clientnotifications", ClientNotification.collection.name === "clientnotifications");

    // Ensure indexes are built
    await ClientNotification.init();

    const client1Id = new mongoose.Types.ObjectId();
    const client2Id = new mongoose.Types.ObjectId();
    const invoiceId = new mongoose.Types.ObjectId();
    const ticketId  = new mongoose.Types.ObjectId();

    // 2. Notification creation (INVOICE_GENERATED)
    console.log("\n[2] Notification creation (INVOICE_GENERATED)");
    const notif1 = await ClientNotification.create({
      clientId: client1Id,
      type: "INVOICE_GENERATED",
      title: "Invoice Generated",
      message: "Invoice AMC-2026-001 for ₹50,000 has been generated.",
      entityType: "invoice",
      entityCode: "AMC-2026-001",
      entityId: invoiceId,
      navigationTarget: "billing",
      dedupKey: `inv_${invoiceId}`,
    });

    assert("Notification 1 created with _id", !!notif1._id);
    assert("clientId matches", notif1.clientId.toString() === client1Id.toString());
    assert("type matches INVOICE_GENERATED", notif1.type === "INVOICE_GENERATED");
    assert("entityType matches invoice", notif1.entityType === "invoice");
    assert("entityCode matches", notif1.entityCode === "AMC-2026-001");
    assert("entityId matches", notif1.entityId.toString() === invoiceId.toString());
    assert("navigationTarget matches billing", notif1.navigationTarget === "billing");
    assert("isRead defaults to false", notif1.isRead === false);
    assert("readAt defaults to null", notif1.readAt === null);
    assert("createdAt is populated", !!notif1.createdAt);
    assert("updatedAt is populated", !!notif1.updatedAt);

    // 3. Notification creation with defaults (TICKET_CREATED)
    console.log("\n[3] Notification creation with defaults (TICKET_CREATED)");
    const notif2 = await ClientNotification.create({
      clientId: client1Id,
      type: "TICKET_CREATED",
      title: "Support Ticket Raised",
      message: "Ticket TKT-001 has been registered.",
      dedupKey: `tkt_created_${ticketId}`,
    });

    assert("entityType defaults to 'other'", notif2.entityType === "other");
    assert("entityCode defaults to empty string", notif2.entityCode === "");
    assert("entityId defaults to null", notif2.entityId === null);
    assert("navigationTarget defaults to 'overview'", notif2.navigationTarget === "overview");

    // 4. Schema validation: missing required fields
    console.log("\n[4] Schema validation: missing required fields");
    let caughtRequired = false;
    try {
      await ClientNotification.create({
        type: "INVOICE_GENERATED",
        title: "Test",
        message: "Missing clientId",
      });
    } catch (err) {
      caughtRequired = true;
      assert("Rejects missing clientId", err.name === "ValidationError" && !!err.errors.clientId);
    }
    assert("Caught missing required clientId", caughtRequired);

    // 5. Schema validation: invalid enum
    console.log("\n[5] Schema validation: invalid enum");
    let caughtEnum = false;
    try {
      await ClientNotification.create({
        clientId: client1Id,
        type: "INVALID_NOTIFICATION_TYPE",
        title: "Bad Type",
        message: "Testing enum rejection",
      });
    } catch (err) {
      caughtEnum = true;
      assert("Rejects invalid type enum", err.name === "ValidationError" && !!err.errors.type);
    }
    assert("Caught invalid type enum", caughtEnum);

    // 6. Deduplication unique index: { clientId: 1, dedupKey: 1 }
    console.log("\n[6] Deduplication unique index: { clientId: 1, dedupKey: 1 }");
    let caughtDup = false;
    try {
      await ClientNotification.create({
        clientId: client1Id,
        type: "INVOICE_GENERATED",
        title: "Duplicate Invoice",
        message: "Duplicate message",
        dedupKey: `inv_${invoiceId}`, // duplicate for client 1
      });
    } catch (err) {
      caughtDup = true;
      assert("Duplicate (client1Id + dedupKey) rejected with Mongo duplicate key error (11000)", err.code === 11000);
    }
    assert("Duplicate key violation caught", caughtDup);

    // Same dedupKey for client2 MUST SUCCEED (compound per client)
    const notifClient2 = await ClientNotification.create({
      clientId: client2Id,
      type: "INVOICE_GENERATED",
      title: "Client 2 Invoice",
      message: "Invoice for client 2",
      dedupKey: `inv_${invoiceId}`,
    });
    assert("Same dedupKey for different clientId succeeds", !!notifClient2._id);

    // 7. Notification listing & client-specific filtering
    console.log("\n[7] Notification listing & client-specific filtering");
    const client1Notifs = await ClientNotification.find({ clientId: client1Id }).sort({ createdAt: -1 });
    assert("Client 1 returns exactly 2 notifications", client1Notifs.length === 2);

    const client2Notifs = await ClientNotification.find({ clientId: client2Id });
    assert("Client 2 returns exactly 1 notification", client2Notifs.length === 1);

    // 8. Cross-client isolation
    console.log("\n[8] Cross-client isolation");
    const crossCheck = client1Notifs.some(n => n.clientId.toString() === client2Id.toString());
    assert("Client 1 query has zero records belonging to Client 2", !crossCheck);

    // 9. Unread count query
    console.log("\n[9] Unread count query");
    const unreadCountBefore = await ClientNotification.countDocuments({ clientId: client1Id, isRead: false });
    assert("Unread count for Client 1 is 2", unreadCountBefore === 2);

    // 10. Mark single notification as read (PATCH /api/client/notifications/:id/read)
    console.log("\n[10] Mark single notification as read");
    const readAtTime = new Date();
    const updated = await ClientNotification.findOneAndUpdate(
      { _id: notif1._id, clientId: client1Id },
      { $set: { isRead: true, readAt: readAtTime } },
      { new: true }
    ).lean();

    assert("Notification marked as isRead=true", updated.isRead === true);
    assert("readAt timestamp recorded", !!updated.readAt);

    const unreadAfterOne = await ClientNotification.countDocuments({ clientId: client1Id, isRead: false });
    assert("Unread count decreases to 1", unreadAfterOne === 1);

    // 11. Mark all as read (PATCH /api/client/notifications/read-all)
    console.log("\n[11] Mark all as read");
    await ClientNotification.updateMany(
      { clientId: client1Id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    const unreadAfterAll = await ClientNotification.countDocuments({ clientId: client1Id, isRead: false });
    assert("Unread count after read-all is 0", unreadAfterAll === 0);

    // Client 2's notification remains unread
    const client2Unread = await ClientNotification.countDocuments({ clientId: client2Id, isRead: false });
    assert("Client 2 notification is still unread (cross-client unaffected)", client2Unread === 1);

    // 12. API response formatting contract verification
    console.log("\n[12] API response formatting contract verification");
    const formatted = formatClientNotification(updated);
    assert("formatted.id matches string _id", formatted.id === String(notif1._id));
    assert("formatted.type matches", formatted.type === "INVOICE_GENERATED");
    assert("formatted.entityType matches invoice", formatted.entityType === "invoice");
    assert("formatted.navigationTarget matches billing", formatted.navigationTarget === "billing");
    assert("formatted.isRead is boolean true", formatted.isRead === true);
    assert("formatted.readAt is populated", !!formatted.readAt);

    // 13. AMC Expiry and Ticket resolved types verification
    console.log("\n[13] All 11 event types support verification");
    const otherTypes = [
      "PAYMENT_RECEIVED", "AMC_EXPIRING", "AMC_RENEWED",
      "AMC_REQUEST_SUBMITTED", "AMC_REQUEST_UPDATED", "AMC_QUOTATION_READY",
      "TICKET_UPDATED", "TICKET_RESOLVED", "DOCUMENT_SHARED"
    ];
    for (const t of otherTypes) {
      const doc = await ClientNotification.create({
        clientId: client1Id,
        type: t,
        title: `Test ${t}`,
        message: `Testing event type ${t}`,
        dedupKey: `type_test_${t}`,
      });
      assert(`Successfully created notification of type ${t}`, doc.type === t);
    }

  } finally {
    console.log("\n[14] Cleanup temporary test database");
    try {
      await mongoose.connection.dropDatabase();
      console.log(`Dropped test database: ${TEST_DB_NAME}`);
    } catch (err) {
      console.error(`Failed to drop database: ${err.message}`);
    }
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }

  console.log("\n================================================================================");
  console.log(`FUNCTIONAL TEST SUMMARY: ${passed} passed, ${failed} failed`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("All ClientNotification functional tests PASSED successfully.");
    process.exit(0);
  }
}

runIsolatedTests().catch(err => {
  console.error("Unhandled test runner exception:", err);
  process.exit(1);
});
