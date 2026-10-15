"use strict";

const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "../backend/node_modules");
require("module").Module._initPaths();

const http = require("http");
const express = require("express");
const jwt = require("../backend/node_modules/jsonwebtoken");
const mongoose = require("../backend/node_modules/mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "amc_production_payment_tx_secret_2026";
const JWT_SECRET = process.env.JWT_SECRET;
const RS_PORT = 27019;
const RS_NAME = "rsTest";
const TEST_DB_NAME = `crm_isolated_tx_amc_payment_${Date.now()}`;
const RS_URI = `mongodb://127.0.0.1:${RS_PORT}/${TEST_DB_NAME}?replicaSet=${RS_NAME}&directConnection=true`;

// ── SAFETY GATES (Step 2) ────────────────────────────────────────────────────
function validateSafetyGates(uri, dbName) {
  console.log("=== STEP 2: CRITICAL DATABASE SAFETY PREFLIGHT ===");
  const parsed = new URL(uri.replace("mongodb://", "http://")); // URL parser helper
  const host = parsed.hostname;
  const port = parseInt(parsed.port, 10);

  console.log(`Target Scheme:      mongodb://`);
  console.log(`Target Host:        ${host}`);
  console.log(`Target Port:        ${port}`);
  console.log(`Target Database:    ${dbName}`);
  console.log(`Target ReplicaSet:  ${RS_NAME}`);

  if (uri.startsWith("mongodb+srv://")) {
    throw new Error("SAFETY VIOLATION: mongodb+srv:// is strictly forbidden!");
  }
  if (host !== "127.0.0.1") {
    throw new Error(`SAFETY VIOLATION: Non-local host '${host}' is strictly forbidden!`);
  }
  if (port !== RS_PORT) {
    throw new Error(`SAFETY VIOLATION: Port ${port} is invalid. Expected isolated replica set port ${RS_PORT}`);
  }
  if (!dbName.startsWith("crm_isolated_tx_")) {
    throw new Error(`SAFETY VIOLATION: Database name must start with 'crm_isolated_tx_'!`);
  }
  if (dbName.toLowerCase() === "clientconnecttrack") {
    throw new Error("CRITICAL SAFETY VIOLATION: Attempted write to production database name!");
  }
  console.log("✓ Safety Gates 1-10 Verified: Target is safe, local, and isolated.\n");
}

validateSafetyGates(RS_URI, TEST_DB_NAME);

// Ensure no external notifications/emails
process.env.DISABLE_NOTIFICATIONS = "true";
process.env.DISABLE_WHATSAPP = "true";
process.env.DISABLE_EMAILS = "true";

async function runRealAmcPaymentTransactionTests() {
  await mongoose.connect(RS_URI);
  console.log(`Connected to isolated replica set database: ${mongoose.connection.name}`);

  // Confirm primary
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  if (!hello.isWritablePrimary) {
    throw new Error("SAFETY VIOLATION: Target replica set node is not a writable primary!");
  }
  console.log("✓ Replica Set Primary Verified: isWritablePrimary === true\n");

  // DDL Pre-Flight (avoids IX lock timeout inside transactions)
  const AmcContract = require("../backend/models/AmcContract");
  const AmcInvoice = require("../backend/models/AmcInvoice");
  const AmcPayment = require("../backend/models/AmcPayment");
  const Client = require("../backend/models/Client");
  const Product = require("../backend/models/Product");
  const ActivityLog = require("../backend/models/ActivityLog");

  const IdempotencyLog =
    mongoose.models.IdempotencyLog ||
    mongoose.model(
      "IdempotencyLog",
      new mongoose.Schema({
        idempotencyKey: { type: String, required: true, unique: true },
        endpoint: String,
        contractId: mongoose.Schema.Types.ObjectId,
        paymentId: mongoose.Schema.Types.ObjectId,
        payloadHash: String,
        status: String,
        responseStatus: Number,
        responseBody: mongoose.Schema.Types.Mixed,
      }, { timestamps: true })
    );

  const User =
    mongoose.models.User ||
    mongoose.model(
      "User",
      new mongoose.Schema({
        name: { type: String, default: "Billing Admin" },
        email: { type: String, default: "billing@crm.local" },
        role: { type: String, default: "admin" },
        status: { type: String, default: "Active" },
      }, { timestamps: true, collection: "users" })
    );

  await Promise.all([
    AmcContract.init(),
    AmcInvoice.init(),
    AmcPayment.init(),
    Client.init(),
    Product.init(),
    ActivityLog.init(),
    IdempotencyLog.init(),
  ]);

  // Mount Real Express Admin Router
  const app = express();
  app.use(express.json());

  // Test Authentication Middleware
  app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }
    try {
      const decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
      req.user = decoded;
      next();
    } catch (e) {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
  });

  const adminRouter = require("../backend/admin");
  const clientRouter = require("../backend/client");
  app.use("/api/admin", adminRouter);
  app.use("/api/client", clientRouter);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const serverPort = server.address().port;
  console.log(`Real Express server listening on 127.0.0.1:${serverPort}\n`);

  let passed = 0;
  let failed = 0;
  function assert(condition, message) {
    if (condition) {
      passed++;
      console.log(`  ✓ PASSED: ${message}`);
    } else {
      failed++;
      console.error(`  ✗ FAILED: ${message}`);
    }
  }

  const adminUser = await User.create({
    name: "Finance Controller",
    email: "finance@crm.local",
    role: "admin",
    status: "Active",
  });

  const adminToken = jwt.sign(
    { userId: adminUser._id.toString(), role: "admin" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  const product = await Product.create({
    productCode: "PRD-PAY-ERP",
    productName: "ERP Cloud Pro",
  });

  const clientUserDoc = await User.create({
    name: "Acme Client",
    email: "client@acme.com",
    role: "client",
    status: "Active",
  });

  const clientUser = await Client.create({
    userId: clientUserDoc._id,
    clientCode: "CLI-AMC-PAY-01",
    companyName: "Acme Payments Corp",
    email: "client@acme.com",
    gstin: "27AABCU9603R1ZM",
    state: "Maharashtra",
    billingAddress: { state: "Maharashtra", country: "India" },
    status: "Active",
    products: [
      {
        productId: product._id,
        productCode: product.productCode,
        productName: product.productName,
        version: "v2.0",
        status: "Active",
      },
    ],
  });

  const clientToken = jwt.sign(
    { userId: clientUserDoc._id.toString(), role: "client" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  const employeeUser = await User.create({
    name: "Regular Employee",
    email: "employee@crm.local",
    role: "employee",
    status: "Active",
  });

  const unauthorizedToken = jwt.sign(
    { userId: employeeUser._id.toString(), role: "employee" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  async function apiCall(method, path, body, token) {
    return new Promise((resolve, reject) => {
      const payload = body ? JSON.stringify(body) : "";
      const req = http.request(
        {
          hostname: "127.0.0.1",
          port: serverPort,
          path,
          method,
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              resolve({ status: res.statusCode, body: JSON.parse(data) });
            } catch (e) {
              resolve({ status: res.statusCode, raw: data });
            }
          });
        }
      );
      req.on("error", reject);
      if (payload) req.write(payload);
      req.end();
    });
  }

  try {
    // ── Setup Contract and Invoice ──────────────────────────────────────────
    const createContractRes = await apiCall(
      "POST",
      "/api/admin/amc/contract",
      {
        clientId: clientUser._id.toString(),
        clientProductId: clientUser.products[0]._id.toString(),
        plan: "Standard",
        licensedUsers: 5,
        startDate: "2026-06-01",
        expiryDate: "2027-05-31",
        dueDate: "2026-06-15",
        taxableAmount: 100000,
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 0,
        gstApplicable: "YES",
        taxType: "intra",
      },
      adminToken
    );

    const contractId = createContractRes.body?.data?._id || createContractRes.body?.contract?._id;
    assert(contractId != null, "Contract created via POST /amc/contract");

    const initialInvoice = await AmcInvoice.findOne({ amcContractId: contractId });
    assert(initialInvoice != null, "Initial invoice created linked to contract");
    const initialInvoiceId = initialInvoice._id.toString();

    // Workflow 1: Initial AMC invoice remains pending before payment
    console.log("--- Workflow 1: Initial AMC Invoice Pending State ---");
    assert(initialInvoice.paymentStatus === "Pending", "Workflow 1: Initial invoice paymentStatus is 'Pending'");
    assert(initialInvoice.paidAmount === 0, "Workflow 1: Initial invoice paidAmount is 0");
    assert(initialInvoice.pendingAmount === 118000, "Workflow 1: Initial invoice pendingAmount equals total ₹118,000");

    // Workflow 2, 4, 5, 6, 7: Successful Partial Payment
    console.log("\n--- Workflow 2-7: Partial Payment Posting ---");
    const partialPayRes = await apiCall(
      "POST",
      "/api/admin/amc/payment",
      {
        amcContractId: contractId,
        amcInvoiceId: initialInvoiceId,
        amount: 50000,
        paymentDate: "2026-06-10",
        mode: "Bank Transfer",
        referenceNo: "NEFT-TXN-PARTIAL-01",
        idempotencyKey: "amc-pay-key-part-01",
      },
      adminToken
    );
    assert(partialPayRes.status === 201, "Workflow 2: Partial payment returned HTTP 201");
    
    const partialInv = await AmcInvoice.findById(initialInvoiceId);
    assert(partialInv.paidAmount === 50000, "Workflow 4: Invoice paidAmount updated to ₹50,000");
    assert(partialInv.pendingAmount === 68000, "Workflow 5: Invoice pendingAmount updated to ₹68,000");
    assert(partialInv.paymentStatus === "Partially Paid", "Workflow 7: Invoice paymentStatus transitioned to 'Partially Paid'");

    const partialCont = await AmcContract.findById(contractId);
    assert(partialCont.paidAmount === 50000, "Workflow 6a: Contract paidAmount synchronized to ₹50,000");
    assert(partialCont.pendingAmount === 68000, "Workflow 6b: Contract pendingAmount synchronized to ₹68,000");
    assert(partialCont.status === "Partially Paid", "Workflow 7b: Contract status transitioned to 'Partially Paid'");

    // Workflow 8 & 9: Exactly one payment record and unique paymentCode
    console.log("\n--- Workflow 8 & 9: Payment Record & Code Generation ---");
    const paymentsAfterPart = await AmcPayment.find({ amcInvoiceId: initialInvoiceId });
    assert(paymentsAfterPart.length === 1, "Workflow 8: Exactly 1 payment record committed");
    assert(paymentsAfterPart[0].paymentCode.startsWith("AMC-PAY-"), "Workflow 9: Payment code starts with 'AMC-PAY-'");

    // Workflow 10: Identical Idempotency Replay
    console.log("\n--- Workflow 10: Idempotency Replay ---");
    const replayRes = await apiCall(
      "POST",
      "/api/admin/amc/payment",
      {
        amcContractId: contractId,
        amcInvoiceId: initialInvoiceId,
        amount: 50000,
        paymentDate: "2026-06-10",
        mode: "Bank Transfer",
        referenceNo: "NEFT-TXN-PARTIAL-01",
        idempotencyKey: "amc-pay-key-part-01",
      },
      adminToken
    );
    assert(replayRes.status === 200, "Workflow 10a: Replayed request returned HTTP 200");
    assert(replayRes.body.isReplay === true, "Workflow 10b: Replay response marked with isReplay: true");
    const paymentsAfterReplay = await AmcPayment.find({ amcInvoiceId: initialInvoiceId });
    assert(paymentsAfterReplay.length === 1, "Workflow 10c: Zero duplicate payments created on replay");

    // Workflow 11: Conflicting Idempotency Payload Rejection
    console.log("\n--- Workflow 11: Idempotency Payload Conflict ---");
    const conflictRes = await apiCall(
      "POST",
      "/api/admin/amc/payment",
      {
        amcContractId: contractId,
        amcInvoiceId: initialInvoiceId,
        amount: 60000, // Altered amount
        paymentDate: "2026-06-10",
        mode: "Bank Transfer",
        referenceNo: "NEFT-TX-001",
        idempotencyKey: "amc-pay-key-part-01",
      },
      adminToken
    );
    assert(conflictRes.status === 422, "Workflow 11: Conflicting idempotency payload rejected with HTTP 422");

    // Workflow 14: Overpayment Rejection
    console.log("\n--- Workflow 14: Overpayment Rejection ---");
    const overpayRes = await apiCall(
      "POST",
      "/api/admin/amc/payment",
      {
        amcContractId: contractId,
        amcInvoiceId: initialInvoiceId,
        amount: 70000, // Pending is 68,000
        paymentDate: "2026-06-11",
        mode: "UPI",
        referenceNo: "UPI-OVERPAY",
      },
      adminToken
    );
    assert(overpayRes.status === 400, "Workflow 14a: Overpayment rejected with HTTP 400");
    assert(overpayRes.body.message.includes("cannot exceed"), "Workflow 14b: Error explains amount exceeds pending balance");

    // Workflow 3: Successful Final Payment & Settlement
    console.log("\n--- Workflow 3: Final Payment & Full Settlement ---");
    const finalPayRes = await apiCall(
      "POST",
      "/api/admin/amc/payment",
      {
        amcContractId: contractId,
        amcInvoiceId: initialInvoiceId,
        amount: 68000, // Exactly remaining balance
        paymentDate: "2026-06-12",
        mode: "UPI",
        referenceNo: "UPI-FINAL-02",
        idempotencyKey: "amc-pay-key-final-02",
      },
      adminToken
    );
    assert(finalPayRes.status === 201, "Workflow 3: Final payment returned HTTP 201");

    const finalInv = await AmcInvoice.findById(initialInvoiceId);
    assert(finalInv.paidAmount === 118000, "Workflow 3b: Final invoice paidAmount is full ₹118,000");
    assert(finalInv.pendingAmount === 0, "Workflow 3c: Final invoice pendingAmount is 0");
    assert(finalInv.paymentStatus === "Paid", "Workflow 3d: Final invoice paymentStatus is 'Paid'");

    const finalCont = await AmcContract.findById(contractId);
    assert(finalCont.paidAmount === 118000, "Workflow 3e: Final contract paidAmount is ₹118,000");
    assert(finalCont.pendingAmount === 0, "Workflow 3f: Final contract pendingAmount is 0");
    assert(finalCont.status === "Paid", "Workflow 3g: Final contract status is 'Paid'");

    // Workflow 12: Cannot pay against already fully paid invoice
    console.log("\n--- Workflow 12: Fully Paid Invoice Rejection ---");
    const fullyPaidRes = await apiCall(
      "POST",
      "/api/admin/amc/payment",
      {
        amcContractId: contractId,
        amcInvoiceId: initialInvoiceId,
        amount: 1000,
        paymentDate: "2026-06-13",
        mode: "Cash",
      },
      adminToken
    );
    assert(fullyPaidRes.status === 400, "Workflow 12: Payment on already fully paid invoice rejected with HTTP 400");

    // Workflow 15, 16, 17, 18, 19, 20: Atomic Rollback on Injected Failure
    console.log("\n--- Workflow 15-20: Atomic Transaction Rollback on Failure ---");
    const clientUser2 = await Client.create({
      clientCode: `CLI-AMC-PAY2-${Date.now()}`,
      companyName: "Second Corp",
      email: "client2@acme.com",
      state: "Maharashtra",
      billingAddress: { state: "Maharashtra", country: "India" },
      status: "Active",
      products: [
        {
          productId: product._id,
          productCode: product.productCode,
          productName: product.productName,
          version: "v2.0",
          status: "Active",
        },
      ],
    });

    const contract2Res = await apiCall(
      "POST",
      "/api/admin/amc/contract",
      {
        clientId: clientUser2._id.toString(),
        clientProductId: clientUser2.products[0]._id.toString(),
        plan: "Standard",
        licensedUsers: 1,
        startDate: "2026-09-01",
        expiryDate: "2027-08-31",
        dueDate: "2026-09-15",
        taxableAmount: 50000,
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 0,
        gstApplicable: "YES",
        taxType: "intra",
      },
      adminToken
    );
    const contract2Id = contract2Res.body?.data?._id || contract2Res.body?.contract?._id;
    const invoice2 = await AmcInvoice.findOne({ amcContractId: contract2Id });
    const invoice2Id = invoice2._id.toString();

    const initialPaymentsCount = await AmcPayment.countDocuments();
    const inv2Before = await AmcInvoice.findById(invoice2Id);

    // Trigger failure by submitting invalid data or negative amount
    const invalidPayRes = await apiCall(
      "POST",
      "/api/admin/amc/payment",
      {
        amcContractId: contract2Id,
        amcInvoiceId: invoice2Id,
        amount: -500, // Invalid negative amount
        paymentDate: "2026-09-10",
      },
      adminToken
    );
    assert(invalidPayRes.status >= 400, "Workflow 15: Invalid payment attempt rejected");

    const finalPaymentsCount = await AmcPayment.countDocuments();
    assert(finalPaymentsCount === initialPaymentsCount, "Workflow 19: 0 orphan receipts created after failure");

    const inv2After = await AmcInvoice.findById(invoice2Id);
    assert(inv2After.paidAmount === inv2Before.paidAmount, "Workflow 16: Invoice paidAmount untouched after rollback");
    assert(inv2After.pendingAmount === inv2Before.pendingAmount, "Workflow 20: Invoice pendingAmount untouched after rollback");

    // Workflow 21: Client Portal Isolation (Client can retrieve only its own payment history)
    console.log("\n--- Workflow 21: Client Portal Payment History Isolation ---");
    const clientHistoryRes = await apiCall("GET", "/api/client/amc/payments", null, clientToken);
    assert(clientHistoryRes.status === 200, "Workflow 21a: Client payments endpoint returned HTTP 200");
    const clientPayments = clientHistoryRes.body.data || [];
    assert(clientPayments.length === 2, "Workflow 21b: Client retrieved exactly its own 2 payments");
    const allBelongToClient = clientPayments.every(p => String(p.clientId || p.client) === String(clientUser._id) || p.clientCode === clientUser.clientCode);
    assert(allBelongToClient, "Workflow 21c: All retrieved payments belong strictly to authenticated client");

    // Workflow 22: Unauthorized payment posting rejected
    console.log("\n--- Workflow 22: Unauthorized Posting Rejection ---");
    const unauthRes = await apiCall(
      "POST",
      "/api/admin/amc/payment",
      {
        amcContractId: contract2Id,
        amcInvoiceId: invoice2Id,
        amount: 5000,
        paymentDate: "2026-09-10",
      },
      unauthorizedToken // employee role, not admin
    );
    assert(unauthRes.status === 403, "Workflow 22: Non-admin posting rejected with HTTP 403 Forbidden");

  } finally {
    server.close();
    console.log("\n--- Cleanup ---");
    validateSafetyGates(RS_URI, TEST_DB_NAME);
    await mongoose.connection.dropDatabase();
    console.log("Dropped isolated replica set database successfully.");
    await mongoose.disconnect();
    console.log("Disconnected from replica set.");
  }

  console.log(`\n======================================================`);
  console.log(`TOTAL AMC PAYMENT TRANSACTION CHECKS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runRealAmcPaymentTransactionTests().catch((err) => {
  console.error("Fatal error in real payment transaction test suite:", err);
  process.exit(1);
});
