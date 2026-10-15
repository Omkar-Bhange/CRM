"use strict";
/**
 * test_clientdocument_isolated.js
 * Isolated functional integration test suite for canonical ClientDocument model.
 * Connects to a dedicated temporary local database and drops it on completion.
 */

const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

const TEST_DB_NAME = `crm_isolated_clientdoc_test_${Date.now()}`;
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
  console.log("   CLIENTDOCUMENT ISOLATED FUNCTIONAL INTEGRATION TEST                          ");
  console.log("================================================================================");
  console.log(`Connecting to ISOLATED database: ${TEST_URI}`);
  console.log(`Target Database Name: ${TEST_DB_NAME}`);

  await mongoose.connect(TEST_URI);
  console.log(`Connected successfully. Active DB: ${mongoose.connection.name}`);

  try {
    const ClientDocument = require("./models/ClientDocument");

    // Ensure indexes are built
    await ClientDocument.init();

    const client1Id = new mongoose.Types.ObjectId();
    const client2Id = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();

    // ── 1. Admin metadata document creation ──────────────────────────────────
    console.log("\n[1] Admin metadata document creation (POST /api/admin/client/:id/documents)");
    const adminDoc = await ClientDocument.create({
      clientId: client1Id,
      clientCode: "CLI-001",
      clientName: "Alpha Logistics",
      name: "Service Agreement 2026",
      type: "PDF",
      category: "Agreement",
      size: "2.4 MB",
      notes: "Executed contract copy",
      uploadedByName: "Master Admin",
    });

    assert("Admin doc created with _id", !!adminDoc._id);
    assert("Admin doc has formatted size '2.4 MB'", adminDoc.size === "2.4 MB");
    assert("Admin doc has type 'PDF'", adminDoc.type === "PDF");
    assert("Admin doc has category 'Agreement'", adminDoc.category === "Agreement");
    assert("Admin doc has notes", adminDoc.notes === "Executed contract copy");
    assert("Admin doc has isDeleted=false", adminDoc.isDeleted === false);

    // ── 2. Documents file upload metadata creation ───────────────────────────
    console.log("\n[2] Documents upload metadata creation (POST /api/documents/upload)");
    const uploadDoc = await ClientDocument.create({
      documentCode: "DOC-2026-001",
      clientId: client1Id,
      clientCode: "CLI-001",
      clientName: "Alpha Logistics",
      category: "General",
      productName: "Nexora CRM",
      name: "Q1-Invoice.pdf",
      description: "First quarter maintenance invoice",
      fileName: "Q1-Invoice.pdf",
      fileUrl: "/uploads/documents/1791870000000-Q1-Invoice.pdf",
      mimeType: "application/pdf",
      size: 1048576,
      documentType: "PDF",
      status: "Pending",
      uploadedById: userId,
      uploadedByName: "Master Admin",
      uploadedByRole: "admin",
      createdBy: userId,
      createdByName: "Master Admin",
      updatedBy: userId,
      updatedByName: "Master Admin",
    });

    assert("Upload doc created with _id", !!uploadDoc._id);
    assert("Upload doc has fileName preserved", uploadDoc.fileName === "Q1-Invoice.pdf");
    assert("Upload doc has fileUrl preserved", uploadDoc.fileUrl === "/uploads/documents/1791870000000-Q1-Invoice.pdf");
    assert("Upload doc has mimeType preserved", uploadDoc.mimeType === "application/pdf");
    assert("Upload doc has numeric size 1048576", uploadDoc.size === 1048576);
    assert("Upload doc has category 'General'", uploadDoc.category === "General");
    assert("Upload doc has status 'Pending'", uploadDoc.status === "Pending");
    assert("Upload doc has uploadedById preserved", uploadDoc.uploadedById.toString() === userId.toString());

    // ── 3. Client 2 document for cross-client testing ────────────────────────
    console.log("\n[3] Create Client 2 document for isolation test");
    const client2Doc = await ClientDocument.create({
      documentCode: "DOC-2026-002",
      clientId: client2Id,
      clientCode: "CLI-002",
      clientName: "Beta Manufacturing",
      category: "Legal",
      name: "Beta-NDA.pdf",
      fileName: "Beta-NDA.pdf",
      fileUrl: "/uploads/documents/1791870000001-Beta-NDA.pdf",
      mimeType: "application/pdf",
      size: 512000,
      status: "Verified",
    });
    assert("Client 2 doc created", !!client2Doc._id);

    // ── 4. Admin document listing (GET /api/admin/client/:id/documents) ───────
    console.log("\n[4] Admin document listing query mapping");
    const adminList = await ClientDocument.find({
      clientId: client1Id,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    assert("Admin listing returns 2 documents for client 1", adminList.length === 2);
    const adminMapped = adminList.map((doc) => ({
      id: doc._id,
      name: doc.name,
      type: doc.type,
      category: doc.category,
      size: doc.size,
      uploadedOn: doc.createdAt,
      uploadedBy: doc.uploadedByName,
      notes: doc.notes,
    }));
    assert("Admin mapped array has all required response fields", adminMapped[0].id && adminMapped[0].name !== undefined);

    // ── 5. Client document listing & cross-client isolation ──────────────────
    console.log("\n[5] Client document query scoping & cross-client access denial");
    const client1Docs = await ClientDocument.find({
      clientId: client1Id,
      isDeleted: false,
    }).lean();
    assert("Client 1 query returns client 1 documents", client1Docs.length === 2);
    assert("Client 1 query does NOT include client 2 documents", client1Docs.every(d => d.clientId.toString() === client1Id.toString()));

    const client2Docs = await ClientDocument.find({
      clientId: client2Id,
      isDeleted: false,
    }).lean();
    assert("Client 2 query returns exactly 1 document", client2Docs.length === 1);
    assert("Client 2 query does NOT include client 1 documents", client2Docs.every(d => d.clientId.toString() === client2Id.toString()));

    // ── 6. Issue 1 Secure upload authorization check ─────────────────────────
    console.log("\n[6] Issue 1 secure upload authorization check (secureUploads.js logic)");
    const filenameToLookup = "1791870000000-Q1-Invoice.pdf";

    // Client 1 checks ownership
    const authSuccess = await ClientDocument.findOne({
      clientId: client1Id,
      $or: [
        { fileUrl: { $regex: filenameToLookup } },
        { fileName: filenameToLookup },
      ],
    }).lean();
    assert("Client 1 authorized for own file", !!authSuccess);

    // Client 2 attempts cross-client access to Client 1's file
    const authDenied = await ClientDocument.findOne({
      clientId: client2Id,
      $or: [
        { fileUrl: { $regex: filenameToLookup } },
        { fileName: filenameToLookup },
      ],
    }).lean();
    assert("Client 2 DENIED access to Client 1's file (cross-client blocked)", authDenied === null);

    // ── 7. Document status update, verification, and archiving ───────────────
    console.log("\n[7] Document status transitions (Verify & Archive)");
    const verifiedDoc = await ClientDocument.findByIdAndUpdate(
      uploadDoc._id,
      {
        status: "Verified",
        verifiedById: userId,
        verifiedByName: "QA Engineer",
        verifiedAt: new Date(),
      },
      { returnDocument: "after" }
    );
    assert("Document status transitioned to 'Verified'", verifiedDoc.status === "Verified");
    assert("verifiedByName recorded", verifiedDoc.verifiedByName === "QA Engineer");

    const archivedDoc = await ClientDocument.findByIdAndUpdate(
      uploadDoc._id,
      {
        status: "Archived",
        archivedById: userId,
        archivedByName: "Compliance Officer",
        archivedAt: new Date(),
      },
      { returnDocument: "after" }
    );
    assert("Document status transitioned to 'Archived'", archivedDoc.status === "Archived");
    assert("archivedByName recorded", archivedDoc.archivedByName === "Compliance Officer");

    // ── 8. Soft deletion (DELETE /api/admin/client/:id/documents/:docId) ─────
    console.log("\n[8] Soft deletion verification");
    const softDeleted = await ClientDocument.findOneAndUpdate(
      { _id: adminDoc._id, clientId: client1Id },
      { isDeleted: true, deletedAt: new Date() },
      { returnDocument: "after" }
    );
    assert("Document soft-deleted (isDeleted=true)", softDeleted.isDeleted === true);
    assert("deletedAt recorded", !!softDeleted.deletedAt);

    const activeListAfterDelete = await ClientDocument.find({
      clientId: client1Id,
      isDeleted: false,
    });
    assert("Soft-deleted document excluded from active list", activeListAfterDelete.length === 1);

    // ── 9. Size validator rejection of invalid types ─────────────────────────
    console.log("\n[9] Size validator security checks");
    let objRejected = false;
    try {
      await ClientDocument.create({
        clientId: client1Id,
        name: "malicious.pdf",
        size: { nested: "attack" },
      });
    } catch (err) {
      if (err.name === "ValidationError") objRejected = true;
    }
    assert("Object size input was rejected by validator", objRejected);

    let negRejected = false;
    try {
      await ClientDocument.create({
        clientId: client1Id,
        name: "negative.pdf",
        size: -500,
      });
    } catch (err) {
      if (err.name === "ValidationError") negRejected = true;
    }
    assert("Negative numeric size was rejected by validator", negRejected);

    // ── 10. Compound text search ─────────────────────────────────────────────
    console.log("\n[10] Compound text search verification");
    const searchResults = await ClientDocument.find({
      $text: { $search: "Invoice" },
    }).lean();
    assert("Text search found document matching 'Invoice'", searchResults.length >= 1);
    assert("Search result has correct name", searchResults.some(r => r.name === "Q1-Invoice.pdf"));

    // ── 11. Path traversal protection check ──────────────────────────────────
    console.log("\n[11] Path traversal prevention check");
    const uploadsRoot = path.resolve(__dirname, "uploads");
    const safeFileUrl = "/uploads/documents/test.pdf";
    const maliciousFileUrl = "/uploads/documents/../../etc/passwd";

    function isPathSafe(url) {
      const relPart = url.replace(/^\/uploads\//, "");
      const resolved = path.resolve(uploadsRoot, relPart);
      return resolved.startsWith(uploadsRoot) && !relPart.includes("..");
    }

    assert("Legitimate upload path is contained", isPathSafe(safeFileUrl));
    assert("Directory traversal path is rejected", !isPathSafe(maliciousFileUrl));

    console.log("\n================================================================================");
    console.log(`   INTEGRATION VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED           `);
    console.log("================================================================================");
  } finally {
    console.log(`\nDropping isolated test database: ${TEST_DB_NAME}...`);
    await mongoose.connection.db.dropDatabase();
    console.log("Test database successfully dropped.");
    await mongoose.disconnect();
    console.log("Mongoose disconnected.");
  }

  if (failed === 0) {
    console.log("\nALL CLIENTDOCUMENT INTEGRATION CHECKS PASSED [OK]");
    process.exit(0);
  } else {
    console.error("\nSOME CLIENTDOCUMENT INTEGRATION CHECKS FAILED [FAIL]");
    process.exit(1);
  }
}

runIsolatedTests().catch((err) => {
  console.error("Test execution aborted:", err);
  process.exit(1);
});
