"use strict";
/**
 * test_secure_uploads_patch.js
 * Comprehensive security regression suite for exact file authorization in backend/secureUploads.js.
 * Connects to a dedicated temporary local database and drops it on completion.
 * Creates and cleans up temporary test files in backend/uploads.
 */

const http = require("http");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const express = require("express");

const TEST_DB_NAME = `crm_isolated_uploads_patch_test_${Date.now()}`;
const TEST_URI = `mongodb://127.0.0.1:27017/${TEST_DB_NAME}`;
const TEST_JWT_SECRET = "test_security_patch_secret_key_12345";

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

// Ensure JWT_SECRET is set for testing
process.env.JWT_SECRET = TEST_JWT_SECRET;

const uploadsDir = path.resolve(__dirname, "uploads");
const docsDir = path.join(uploadsDir, "documents");
const ticketsDir = path.join(uploadsDir, "tickets");

// Ensure directories exist
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
if (!fs.existsSync(ticketsDir)) fs.mkdirSync(ticketsDir, { recursive: true });

// Track test files to clean up
const createdFiles = [];
function createTestFile(dir, filename, content) {
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, content);
  createdFiles.push(filePath);
  return filePath;
}

async function runSecuritySuite() {
  console.log("================================================================================");
  console.log("   SECURE UPLOADS EXACT FILE AUTHORIZATION PATCH VERIFICATION SUITE              ");
  console.log("================================================================================");
  console.log(`Connecting to ISOLATED database: ${TEST_URI}`);

  await mongoose.connect(TEST_URI);
  console.log(`Connected successfully. Active DB: ${mongoose.connection.name}`);

  // Load modules to register schemas
  require("./admin"); // Registers User, Client, SupportTicket, etc.
  const ClientDocument = require("./models/ClientDocument");
  const User = mongoose.models.User;
  const Client = mongoose.models.Client;
  const SupportTicket = mongoose.models.SupportTicket;

  const app = express();
  const secureUploads = require("./secureUploads");
  app.use("/uploads", secureUploads);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // ── Setup Test Users & Clients ───────────────────────────────────────────
    const client1Id = new mongoose.Types.ObjectId();
    const client2Id = new mongoose.Types.ObjectId();
    const userClient1Id = new mongoose.Types.ObjectId();
    const userClient2Id = new mongoose.Types.ObjectId();
    const userAdminId = new mongoose.Types.ObjectId();
    const userEmployeeId = new mongoose.Types.ObjectId();

    await User.create([
      { _id: userClient1Id, name: "Client One User", email: "client1@example.com", password: "password123", role: "client", clientId: client1Id, status: "Active" },
      { _id: userClient2Id, name: "Client Two User", email: "client2@example.com", password: "password123", role: "client", clientId: client2Id, status: "Active" },
      { _id: userAdminId,   name: "Admin User",      email: "admin@example.com",   password: "password123", role: "admin",  status: "Active" },
      { _id: userEmployeeId,name: "Employee User",   email: "emp@example.com",     password: "password123", role: "employee", status: "Active" },
    ]);

    const tokenClient1 = jwt.sign({ userId: userClient1Id }, TEST_JWT_SECRET);
    const tokenClient2 = jwt.sign({ userId: userClient2Id }, TEST_JWT_SECRET);
    const tokenAdmin   = jwt.sign({ userId: userAdminId }, TEST_JWT_SECRET);
    const tokenEmployee= jwt.sign({ userId: userEmployeeId }, TEST_JWT_SECRET);

    // ── 1. Authorized File Access (Client 1 accessing own document) ──────────
    console.log("\n[1] Authorized file access & security headers");
    const file1Content = "PDF-MAGIC-BYTES: Client 1 Agreement Document Content";
    const file1Name = `test-c1-${Date.now()}.pdf`;
    createTestFile(docsDir, file1Name, file1Content);

    await ClientDocument.create({
      clientId: client1Id,
      name: "Client 1 Agreement",
      fileUrl: `/uploads/documents/${file1Name}`,
      fileName: file1Name,
      mimeType: "application/pdf",
      isDeleted: false,
    });

    const res1 = await fetch(`${baseUrl}/uploads/documents/${file1Name}`, {
      headers: { Authorization: `Bearer ${tokenClient1}` },
    });
    const body1 = await res1.text();

    assert("Status is 200 OK", res1.status === 200);
    assert("Content matches file bytes", body1 === file1Content);
    assert("X-Content-Type-Options: nosniff present", res1.headers.get("x-content-type-options") === "nosniff");
    assert("Cache-Control is private", res1.headers.get("cache-control")?.includes("private"));
    assert("Content-Disposition defaults to inline", res1.headers.get("content-disposition")?.startsWith("inline"));

    // Query parameter token support (?token=...)
    const res1QueryToken = await fetch(`${baseUrl}/uploads/documents/${file1Name}?token=${tokenClient1}`);
    assert("Query param ?token= succeeds with 200 OK", res1QueryToken.status === 200);

    // Download disposition support (?download=true)
    const res1Download = await fetch(`${baseUrl}/uploads/documents/${file1Name}?download=true`, {
      headers: { Authorization: `Bearer ${tokenClient1}` },
    });
    assert("Query param ?download=true sets attachment disposition", res1Download.headers.get("content-disposition")?.startsWith("attachment"));

    // ── 2. Unauthorized File Access (Missing / Invalid Token) ────────────────
    console.log("\n[2] Unauthorized file access (missing or invalid credentials)");
    const resNoToken = await fetch(`${baseUrl}/uploads/documents/${file1Name}`);
    assert("Missing token returns 401", resNoToken.status === 401);

    const resBadToken = await fetch(`${baseUrl}/uploads/documents/${file1Name}`, {
      headers: { Authorization: "Bearer invalid.fake.token" },
    });
    assert("Invalid token returns 401", resBadToken.status === 401);

    // ── 3. Cross-Client Access Denial ────────────────────────────────────────
    console.log("\n[3] Cross-client access denial");
    const resCrossClient = await fetch(`${baseUrl}/uploads/documents/${file1Name}`, {
      headers: { Authorization: `Bearer ${tokenClient2}` },
    });
    assert("Client 2 denied access to Client 1's file (403 Forbidden)", resCrossClient.status === 403);

    // ── 4. Filenames Containing Multiple Periods ─────────────────────────────
    console.log("\n[4] Filenames containing multiple periods");
    const fileDottedName = `report.v1.2.final.${Date.now()}.pdf`;
    createTestFile(docsDir, fileDottedName, "DOTTED-FILENAME-CONTENT");

    await ClientDocument.create({
      clientId: client1Id,
      name: "Dotted Report",
      fileUrl: `/uploads/documents/${fileDottedName}`,
      fileName: fileDottedName,
      isDeleted: false,
    });

    const resDotted = await fetch(`${baseUrl}/uploads/documents/${fileDottedName}`, {
      headers: { Authorization: `Bearer ${tokenClient1}` },
    });
    assert("Client 1 accessing dotted filename returns 200 OK", resDotted.status === 200);

    const resDottedC2 = await fetch(`${baseUrl}/uploads/documents/${fileDottedName}`, {
      headers: { Authorization: `Bearer ${tokenClient2}` },
    });
    assert("Client 2 accessing dotted filename is rejected with 403", resDottedC2.status === 403);

    // ── 5. Regex Metacharacters in Filename ───────────────────────────────────
    console.log("\n[5] Regex metacharacters in filename");
    const regexSafeName = `doc+test[1].${Date.now()}.pdf`;
    createTestFile(docsDir, regexSafeName, "REGEX-CHARS-CONTENT");

    await ClientDocument.create({
      clientId: client1Id,
      name: "Regex Char Doc",
      fileUrl: `/uploads/documents/${regexSafeName}`,
      fileName: regexSafeName,
      isDeleted: false,
    });

    const resRegexChar = await fetch(`${baseUrl}/uploads/documents/${encodeURIComponent(regexSafeName)}`, {
      headers: { Authorization: `Bearer ${tokenClient1}` },
    });
    assert("Exact regex character filename returns 200 OK for owner", resRegexChar.status === 200);

    // Attempting to match Client 1's file using wildcard regex pattern
    const resWildcard = await fetch(`${baseUrl}/uploads/documents/doc.*.pdf`, {
      headers: { Authorization: `Bearer ${tokenClient1}` },
    });
    assert("Literal regex wildcard does not match existing document (404/403)", resWildcard.status === 404 || resWildcard.status === 403);

    // ── 6. Similar Filenames Collision Prevention ────────────────────────────
    console.log("\n[6] Similar filenames collision prevention");
    const fileSub = `test-report-${Date.now()}.pdf`;
    const fileSuper = `confidential-test-report-${Date.now()}.pdf`;
    createTestFile(docsDir, fileSub, "SUBSTRING-CONTENT");
    createTestFile(docsDir, fileSuper, "SUPERSTRING-CONFIDENTIAL-CONTENT");

    // Client 1 owns the short file, Client 2 owns the long confidential file
    await ClientDocument.create({
      clientId: client1Id,
      name: "Short Report",
      fileUrl: `/uploads/documents/${fileSub}`,
      fileName: fileSub,
      isDeleted: false,
    });
    await ClientDocument.create({
      clientId: client2Id,
      name: "Long Confidential Report",
      fileUrl: `/uploads/documents/${fileSuper}`,
      fileName: fileSuper,
      isDeleted: false,
    });

    // Client 1 requests Client 2's file whose name contains fileSub as a substring
    const resSubMatch = await fetch(`${baseUrl}/uploads/documents/${fileSuper}`, {
      headers: { Authorization: `Bearer ${tokenClient1}` },
    });
    assert("Client 1 denied access to Client 2's file containing similar substring (403)", resSubMatch.status === 403);

    // ── 7. Identical Basenames in Different Directories ───────────────────────
    console.log("\n[7] Identical basenames in different directories");
    const sharedBasename = `invoice-${Date.now()}.pdf`;
    createTestFile(docsDir, sharedBasename, "DOCUMENTS-FOLDER-CONTENT");
    createTestFile(ticketsDir, sharedBasename, "TICKETS-FOLDER-CONTENT");

    // Client 1 owns the ticket attachment, Client 2 owns the document
    await SupportTicket.create({
      clientId: client1Id,
      ticketCode: "TKT-101",
      title: "Ticket with invoice",
      productName: "ERP System",
      clientName: "Client One",
      description: "Test ticket description",
      attachments: [{ fileUrl: `/uploads/tickets/${sharedBasename}`, fileName: sharedBasename }],
      isDeleted: false,
    });
    await ClientDocument.create({
      clientId: client2Id,
      name: "Client 2 Document Invoice",
      fileUrl: `/uploads/documents/${sharedBasename}`,
      fileName: sharedBasename,
      isDeleted: false,
    });

    // Client 1 accessing tickets folder returns 200 OK with ticket content
    const resTicketSameName = await fetch(`${baseUrl}/uploads/tickets/${sharedBasename}`, {
      headers: { Authorization: `Bearer ${tokenClient1}` },
    });
    assert("Client 1 authorized for tickets folder copy", resTicketSameName.status === 200);
    const ticketBytes = await resTicketSameName.text();
    assert("Ticket copy returns TICKETS-FOLDER-CONTENT", ticketBytes === "TICKETS-FOLDER-CONTENT");

    // Client 1 accessing documents folder copy is DENIED (owned by Client 2)
    const resDocSameName = await fetch(`${baseUrl}/uploads/documents/${sharedBasename}`, {
      headers: { Authorization: `Bearer ${tokenClient1}` },
    });
    assert("Client 1 DENIED access to documents folder copy with identical basename (403)", resDocSameName.status === 403);

    // ── 8 & 9. Path Traversal & Encoded / Double-Encoded Traversal ────────────
    console.log("\n[8 & 9] Path traversal and encoded / double-encoded attempts");
    const resTrav1 = await fetch(`${baseUrl}/uploads/..%2fpackage.json`, {
      headers: { Authorization: `Bearer ${tokenClient1}` },
    });
    assert("Single-encoded traversal rejected (403/404)", resTrav1.status === 403 || resTrav1.status === 404);

    const resTrav2 = await fetch(`${baseUrl}/uploads/%252e%252e%252fpackage.json`, {
      headers: { Authorization: `Bearer ${tokenClient1}` },
    });
    assert("Double-encoded traversal (%252e%252e%252f) rejected (403/404)", resTrav2.status === 403 || resTrav2.status === 404);

    const resNullByte = await fetch(`${baseUrl}/uploads/documents/${file1Name}%00.jpg`, {
      headers: { Authorization: `Bearer ${tokenClient1}` },
    });
    assert("Null-byte request rejected (403/400)", resNullByte.status === 403 || resNullByte.status === 400);

    // ── 10. Absolute Path / Direct Upload Access Attempt ─────────────────────
    console.log("\n[10] Direct upload folder bypass attempt");
    // Requesting a file directly at /uploads/test.txt (without folder segment)
    const resDirectFile = await fetch(`${baseUrl}/uploads/${file1Name}`, {
      headers: { Authorization: `Bearer ${tokenClient1}` },
    });
    assert("Direct file access outside 2-segment category rejected (403/404)", resDirectFile.status === 403 || resDirectFile.status === 404);

    // ── 11. Soft-Deleted Document Denial ─────────────────────────────────────
    console.log("\n[11] Soft-deleted document denial");
    const softDelName = `deleted-doc-${Date.now()}.pdf`;
    createTestFile(docsDir, softDelName, "SOFT-DELETED-CONTENT");

    await ClientDocument.create({
      clientId: client1Id,
      name: "Deleted Doc",
      fileUrl: `/uploads/documents/${softDelName}`,
      fileName: softDelName,
      isDeleted: true,
      deletedAt: new Date(),
    });

    const resSoftDel = await fetch(`${baseUrl}/uploads/documents/${softDelName}`, {
      headers: { Authorization: `Bearer ${tokenClient1}` },
    });
    assert("Client 1 accessing soft-deleted document is rejected (403 Forbidden)", resSoftDel.status === 403);

    // ── 12. Missing Document Metadata Denial ──────────────────────────────────
    console.log("\n[12] Missing document metadata denial");
    const untrackedName = `untracked-${Date.now()}.pdf`;
    createTestFile(docsDir, untrackedName, "UNTRACKED-CONTENT");
    // No DB record created

    const resUntracked = await fetch(`${baseUrl}/uploads/documents/${untrackedName}`, {
      headers: { Authorization: `Bearer ${tokenClient1}` },
    });
    assert("File with no database record denied for client (403 Forbidden)", resUntracked.status === 403);

    // ── 13. Legacy Relative File References Compatibility ────────────────────
    console.log("\n[13] Legacy relative file reference compatibility");
    const legacyName = `legacy-doc-${Date.now()}.pdf`;
    createTestFile(docsDir, legacyName, "LEGACY-FILE-CONTENT");

    // Stored with bare filename or relative path without leading slash
    await ClientDocument.create({
      clientId: client1Id,
      name: "Legacy Doc",
      fileUrl: `uploads/documents/${legacyName}`,
      fileName: legacyName,
      isDeleted: false,
    });

    const resLegacy = await fetch(`${baseUrl}/uploads/documents/${legacyName}`, {
      headers: { Authorization: `Bearer ${tokenClient1}` },
    });
    assert("Legacy stored relative path (uploads/documents/...) resolves to 200 OK", resLegacy.status === 200);

    // ── 14. Exact File-Byte Matching Verification ────────────────────────────
    console.log("\n[14] Exact file-byte matching verification");
    const binaryData = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35, 0x0a, 0x00, 0xff, 0xfe]);
    const binName = `binary-test-${Date.now()}.pdf`;
    createTestFile(docsDir, binName, binaryData);

    await ClientDocument.create({
      clientId: client1Id,
      name: "Binary Test",
      fileUrl: `/uploads/documents/${binName}`,
      fileName: binName,
      isDeleted: false,
    });

    const resBin = await fetch(`${baseUrl}/uploads/documents/${binName}`, {
      headers: { Authorization: `Bearer ${tokenClient1}` },
    });
    const binBuffer = Buffer.from(await resBin.arrayBuffer());
    assert("Returned buffer matches exact binary file bytes on disk", binBuffer.equals(binaryData));

    // ── 15. Admin and Employee Access Verification ───────────────────────────
    console.log("\n[15] Admin and Employee access verification");
    const resAdmin = await fetch(`${baseUrl}/uploads/documents/${file1Name}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert("Admin can access client document (200 OK)", resAdmin.status === 200);

    const resEmployee = await fetch(`${baseUrl}/uploads/documents/${file1Name}`, {
      headers: { Authorization: `Bearer ${tokenEmployee}` },
    });
    assert("Employee can access staff-accessible document (200 OK)", resEmployee.status === 200);

    // ── 16. Missing File 404 Verification ────────────────────────────────────
    console.log("\n[16] Missing file returns 404");
    const resMissing = await fetch(`${baseUrl}/uploads/documents/non-existent-file-9999.pdf`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert("Non-existent file returns 404", resMissing.status === 404);

  } finally {
    // Teardown HTTP server
    server.close();

    // Clean up temporary files on disk
    console.log("\n[Teardown] Cleaning up temporary test files on disk...");
    for (const f of createdFiles) {
      try {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      } catch (e) {
        console.error("Failed to delete test file:", f);
      }
    }

    // Drop isolated test database
    console.log(`[Teardown] Dropping isolated test database: ${TEST_DB_NAME}...`);
    try {
      await mongoose.connection.dropDatabase();
      console.log("Test database dropped successfully.");
    } catch (e) {
      console.error("Failed to drop database:", e.message);
    }
    await mongoose.disconnect();
  }

  console.log("\n================================================================================");
  console.log(`SECURITY SUITE SUMMARY: ${passed} passed, ${failed} failed`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("All exact file authorization security checks PASSED successfully.");
    process.exit(0);
  }
}

runSecuritySuite().catch((err) => {
  console.error("Security suite runner exception:", err);
  process.exit(1);
});
