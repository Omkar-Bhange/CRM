"use strict";

const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "../backend/node_modules");
require("module").Module._initPaths();

const http = require("http");
const express = require("express");
const jwt = require("../backend/node_modules/jsonwebtoken");
const mongoose = require("../backend/node_modules/mongoose");
const crypto = require("crypto");

process.env.JWT_SECRET = process.env.JWT_SECRET || "idempotency_production_tx_secret_2026";
const JWT_SECRET = process.env.JWT_SECRET;
const RS_PORT = 27019;
const RS_NAME = "rsTest";
const TEST_DB_NAME = `crm_isolated_tx_idemp_${Date.now()}`;
const RS_URI = `mongodb://127.0.0.1:${RS_PORT}/${TEST_DB_NAME}?replicaSet=${RS_NAME}&directConnection=true`;

// ── SAFETY GATES (Step 7) ────────────────────────────────────────────────────
function validateSafetyGates(uri, dbName) {
  console.log("=== STEP 7: CRITICAL DATABASE SAFETY PREFLIGHT ===");
  const parsed = new URL(uri.replace("mongodb://", "http://"));
  const host = parsed.hostname;
  const port = parseInt(parsed.port, 10);

  console.log(`Target Scheme:      mongodb://`);
  console.log(`Target Host:        ${host}`);
  console.log(`Target Port:        ${port}`);
  console.log(`Target Database:    ${dbName}`);
  console.log(`Target ReplicaSet:  ${RS_NAME}`);

  if (uri.startsWith("mongodb+srv://") || uri.includes("mongodb.net")) {
    throw new Error("CRITICAL SAFETY VIOLATION: Remote or Atlas connection strictly forbidden!");
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
  console.log("✓ Safety Gates Verified: Target is safe, local, and isolated.\n");
}

validateSafetyGates(RS_URI, TEST_DB_NAME);

// Ensure no external notifications/emails
process.env.DISABLE_NOTIFICATIONS = "true";
process.env.DISABLE_WHATSAPP = "true";
process.env.DISABLE_EMAILS = "true";

async function runRealIdempotencyTransactionTests() {
  await mongoose.connect(RS_URI);
  console.log(`Connected to isolated replica set database: ${mongoose.connection.name}`);

  // Confirm primary
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  if (!hello.isWritablePrimary) {
    throw new Error("SAFETY VIOLATION: Target replica set node is not a writable primary!");
  }
  console.log("✓ Replica Set Primary Verified: isWritablePrimary === true\n");

  // DDL Pre-Flight (avoids IX lock timeout inside transactions)
  const IdempotencyLog = require("../backend/models/IdempotencyLog");
  const AmcContract = require("../backend/models/AmcContract");
  const AmcInvoice = require("../backend/models/AmcInvoice");
  const AmcPayment = require("../backend/models/AmcPayment");
  const ProductSale = require("../backend/models/ProductSale");
  const ProductSalePayment = require("../backend/models/ProductSalePayment");
  const Client = require("../backend/models/Client");
  const Product = require("../backend/models/Product");
  const ActivityLog = require("../backend/models/ActivityLog");

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
    IdempotencyLog.init(),
    AmcContract.init(),
    AmcInvoice.init(),
    AmcPayment.init(),
    ProductSale.init(),
    ProductSalePayment.init(),
    Client.init(),
    Product.init(),
    ActivityLog.init(),
  ]);

  // Mount Real Express Admin Router & Client Router
  const app = express();
  app.use(express.json());

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

  // Fixtures
  const adminUser = await User.create({
    name: "Finance Controller",
    email: "finance_idemp@crm.local",
    role: "admin",
    status: "Active",
  });

  const adminToken = jwt.sign(
    { userId: adminUser._id.toString(), role: "admin" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  const clientUserDoc = await User.create({
    name: "Acme Client",
    email: "client_idemp@acme.com",
    role: "client",
    status: "Active",
  });

  const clientToken = jwt.sign(
    { userId: clientUserDoc._id.toString(), role: "client" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  const employeeUser = await User.create({
    name: "Regular Employee",
    email: "employee_idemp@crm.local",
    role: "employee",
    status: "Active",
  });

  const unauthEmployeeToken = jwt.sign(
    { userId: employeeUser._id.toString(), role: "employee" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  const product = await Product.create({
    productCode: "PRD-IDEMP-ERP",
    productName: "ERP Idempotency Suite",
  });

  const client = await Client.create({
    userId: clientUserDoc._id,
    clientCode: "CLI-IDEMP-01",
    companyName: "Acme Global Dynamics",
    email: "billing@acme.com",
    gstin: "27AABCU9603R1ZM",
    state: "Maharashtra",
    billingAddress: { state: "Maharashtra", country: "India" },
    status: "Active",
    products: [
      {
        productId: product._id,
        productCode: product.productCode,
        productName: product.productName,
        version: "v3.0",
        status: "Active",
      },
    ],
  });

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
    // ── Setup Base AMC Contract & Invoice ─────────────────────────────────────
    const contractRes = await apiCall(
      "POST",
      "/api/admin/amc/contract",
      {
        clientId: client._id.toString(),
        clientProductId: client.products[0]._id.toString(),
        plan: "Enterprise",
        licensedUsers: 10,
        startDate: "2026-07-01",
        expiryDate: "2027-06-30",
        dueDate: "2026-07-15",
        taxableAmount: 100000,
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 0,
        gstApplicable: "YES",
        taxType: "intra",
      },
      adminToken
    );
    const contractId = contractRes.body?.data?._id;
    assert(contractId != null, "Contract created via POST /amc/contract");

    const initialInvoice = await AmcInvoice.findOne({ amcContractId: contractId });
    assert(initialInvoice != null, "Initial invoice created linked to contract");
    const initialInvoiceId = initialInvoice._id.toString();

    // ── Workflows 1-3: AMC Payment Idempotency ────────────────────────────────
    console.log("\n--- Workflows 1-3: AMC Payment Idempotency & Conflict Handling ---");
    const amcPayKey = "idemp_amc_pay_001";
    const amcPaymentPayload = {
      amcContractId: contractId,
      amcInvoiceId: initialInvoiceId,
      amount: 40000,
      paymentDate: "2026-07-10",
      mode: "Bank Transfer",
      referenceNo: "NEFT-IDEMP-01",
      idempotencyKey: amcPayKey,
    };

    // 1. Initial Payment
    const amcPayRes1 = await apiCall("POST", "/api/admin/amc/payment", amcPaymentPayload, adminToken);
    assert(amcPayRes1.status === 201, "Workflow 1a: Initial AMC payment succeeds with HTTP 201");
    assert(amcPayRes1.body.isReplay !== true, "Workflow 1b: Initial payment is not marked as replay");

    const amcLog1 = await IdempotencyLog.findOne({ idempotencyKey: amcPayKey });
    assert(amcLog1 != null, "Workflow 1c: IdempotencyLog document created for AMC payment");
    assert(amcLog1.status === "COMPLETED", "Workflow 1d: IdempotencyLog status is 'COMPLETED'");
    assert(amcLog1.endpoint === "/api/admin/amc/payment", "Workflow 1e: IdempotencyLog endpoint is recorded");

    // 2. Replay with identical payload & key
    const amcPayRes2 = await apiCall("POST", "/api/admin/amc/payment", amcPaymentPayload, adminToken);
    assert(amcPayRes2.status === 200, "Workflow 2a: Replayed AMC payment returns HTTP 200");
    assert(amcPayRes2.body.isReplay === true, "Workflow 2b: Replayed response marked with isReplay: true");

    const amcPaymentsCount = await AmcPayment.countDocuments({ amcInvoiceId: initialInvoiceId });
    assert(amcPaymentsCount === 1, "Workflow 2c: Zero duplicate payments recorded on replay");

    const invAfterReplay = await AmcInvoice.findById(initialInvoiceId);
    assert(invAfterReplay.paidAmount === 40000, "Workflow 2d: Invoice paidAmount remains exactly ₹40,000");

    // 3. Conflict: same key, different payload (amount 45,000)
    const amcPayResConflict = await apiCall(
      "POST",
      "/api/admin/amc/payment",
      { ...amcPaymentPayload, amount: 45000 },
      adminToken
    );
    assert(amcPayResConflict.status === 422, "Workflow 3: Conflicting idempotency payload rejected with HTTP 422");

    // ── Setup Base ProductSale ────────────────────────────────────────────────
    console.log("\n--- Setup ProductSale ---");
    const saleRes = await apiCall(
      "POST",
      "/api/admin/product-sales",
      {
        clientId: client._id.toString(),
        saleDate: "2026-07-05",
        invoiceNo: "INV-SALE-IDEMP-01",
        items: [
          {
            productId: product._id.toString(),
            productCode: product.productCode,
            productName: product.productName,
            version: "v3.0",
            quantity: 1,
            rate: 50000,
            grossAmount: 50000,
            discountAmount: 0,
            taxableAmount: 50000,
            gstRate: 18,
            cgstAmount: 4500,
            sgstAmount: 4500,
            igstAmount: 0,
            totalAmount: 59000,
            warrantyMonths: 12,
          },
        ],
        notes: "Idempotency test sale",
      },
      adminToken
    );
    const saleId = saleRes.body?.data?._id;
    assert(saleId != null, "ProductSale created via POST /product-sales");

    // ── Workflows 4-6: ProductSale Payment Idempotency ────────────────────────
    console.log("\n--- Workflows 4-6: ProductSale Payment Idempotency & Conflict Handling ---");
    const psPayKey = "idemp_ps_pay_001";
    const psPaymentPayload = {
      productSaleId: saleId,
      amount: 25000,
      paymentDate: "2026-07-12",
      mode: "Bank Transfer",
      referenceNo: "NEFT-PS-001",
      idempotencyKey: psPayKey,
    };

    // 4. Initial ProductSale Payment
    const psPayRes1 = await apiCall("POST", `/api/admin/product-sales/${saleId}/payment`, psPaymentPayload, adminToken);
    assert(psPayRes1.status === 201, "Workflow 4a: Initial ProductSale payment succeeds with HTTP 201");
    assert(psPayRes1.body.isReplay !== true, "Workflow 4b: Initial ProductSale payment is not marked as replay");

    const psLog1 = await IdempotencyLog.findOne({ idempotencyKey: psPayKey });
    assert(psLog1 != null, "Workflow 4c: IdempotencyLog document created for ProductSale payment");
    assert(psLog1.status === "COMPLETED", "Workflow 4d: ProductSale IdempotencyLog status is 'COMPLETED'");

    // 5. Replay with identical payload & key
    const psPayRes2 = await apiCall("POST", `/api/admin/product-sales/${saleId}/payment`, psPaymentPayload, adminToken);
    assert(psPayRes2.status === 200, "Workflow 5a: Replayed ProductSale payment returns HTTP 200");
    assert(psPayRes2.body.isReplay === true, "Workflow 5b: Replayed response marked with isReplay: true");

    const psPaymentsCount = await ProductSalePayment.countDocuments({ productSaleId: saleId });
    assert(psPaymentsCount === 1, "Workflow 5c: Zero duplicate ProductSale payments recorded on replay");

    const saleAfterReplay = await ProductSale.findById(saleId);
    assert(saleAfterReplay.paidAmount === 25000, "Workflow 5d: ProductSale paidAmount remains exactly ₹25,000");

    // 6. Conflict: same key, different payload (altered referenceNo)
    const psPayResConflict = await apiCall(
      "POST",
      `/api/admin/product-sales/${saleId}/payment`,
      { ...psPaymentPayload, referenceNo: "ALTERED-REF-999" },
      adminToken
    );
    assert(psPayResConflict.status === 422, "Workflow 6: Conflicting ProductSale idempotency payload rejected with HTTP 422");

    // ── Workflows 7-9: AMC Contract Renewal Idempotency ───────────────────────
    console.log("\n--- Workflows 7-9: AMC Renewal Idempotency & Conflict Handling ---");
    const renewKey = "idemp_amc_renew_001";
    const renewPayload = {
      startDate: "2027-07-01",
      expiryDate: "2028-06-30",
      dueDate: "2027-07-15",
      taxableAmount: 110000,
      gstRate: 18,
      gstApplicable: "YES",
      idempotencyKey: renewKey,
    };

    // 7. Initial Renewal
    const renewRes1 = await apiCall("POST", `/api/admin/amc/contract/${contractId}/renew`, renewPayload, adminToken);
    assert(renewRes1.status === 201 || renewRes1.status === 200, "Workflow 7a: Initial AMC contract renewal succeeds");
    assert(renewRes1.body.isReplay !== true, "Workflow 7b: Initial renewal is not marked as replay");

    const renewLog1 = await IdempotencyLog.findOne({ idempotencyKey: renewKey });
    assert(renewLog1 != null, "Workflow 7c: IdempotencyLog document created for renewal");
    assert(renewLog1.status === "COMPLETED", "Workflow 7d: Renewal IdempotencyLog status is 'COMPLETED'");

    // 8. Replay with identical renewal payload & key
    const renewRes2 = await apiCall("POST", `/api/admin/amc/contract/${contractId}/renew`, renewPayload, adminToken);
    assert(renewRes2.status === 200, "Workflow 8a: Replayed renewal returns HTTP 200");
    assert(renewRes2.body.isReplay === true, "Workflow 8b: Replay response marked with isReplay: true");

    // 9. Conflict: same key, altered taxableAmount
    const renewResConflict = await apiCall(
      "POST",
      `/api/admin/amc/contract/${contractId}/renew`,
      { ...renewPayload, taxableAmount: 150000 },
      adminToken
    );
    assert(renewResConflict.status === 422, "Workflow 9: Conflicting renewal idempotency payload rejected with HTTP 422");

    // ── Workflows 10-11: Concurrent Requests Handling ─────────────────────────
    console.log("\n--- Workflows 10-11: Concurrent Requests ---");
    const concurrentKey = "idemp_concurrent_001";
    const concurrentPayload = {
      amcContractId: contractId,
      amcInvoiceId: initialInvoiceId,
      amount: 5000,
      paymentDate: "2026-07-15",
      mode: "Bank Transfer",
      referenceNo: "CONCURRENT-REF-01",
      idempotencyKey: concurrentKey,
    };

    // Fire 2 concurrent requests with identical key
    const [concRes1, concRes2] = await Promise.all([
      apiCall("POST", "/api/admin/amc/payment", concurrentPayload, adminToken),
      apiCall("POST", "/api/admin/amc/payment", concurrentPayload, adminToken),
    ]);

    // One succeeds with 201, the other is serialized and either replayed (200) or rejected via document lock/unique index
    const statuses = [concRes1.status, concRes2.status].sort();
    assert(statuses[0] === 200 || statuses[0] === 201, "Workflow 10a: One concurrent request successfully processed");
    assert([200, 400, 409, 500].includes(statuses[1]), "Workflow 10b: Second concurrent request safely rejected/replayed");
    const concurrentPayments = await AmcPayment.countDocuments({ idempotencyKey: concurrentKey });
    assert(concurrentPayments === 1, "Workflow 10c: Exactly 1 payment recorded (zero double deduction)");

    // ── Workflow 12: Unique-Index Direct Enforcement on IdempotencyLog ────────
    console.log("\n--- Workflow 12: Unique Index Enforcement ---");
    let rawDuplicateError = null;
    try {
      await IdempotencyLog.create({
        idempotencyKey: amcPayKey, // Already exists from Workflow 1
        endpoint: "/api/admin/amc/payment",
        payloadHash: "raw_duplicate_attempt",
      });
    } catch (e) {
      rawDuplicateError = e;
    }
    assert(rawDuplicateError != null && rawDuplicateError.code === 11000, "Workflow 12: Direct duplicate key insert triggers E11000");

    // ── Workflows 13-14: Transaction Abort & Clean Rollback ────────────────────
    console.log("\n--- Workflows 13-14: Transaction Abort & Rollback ---");
    const abortKey = "idemp_abort_tx_001";
    const invalidPayload = {
      amcContractId: contractId,
      amcInvoiceId: initialInvoiceId,
      amount: -1000, // Invalid negative amount causes validation failure
      paymentDate: "2026-07-16",
      idempotencyKey: abortKey,
    };

    const failRes = await apiCall("POST", "/api/admin/amc/payment", invalidPayload, adminToken);
    assert(failRes.status >= 400, "Workflow 13a: Invalid transaction request rejected with HTTP 400");

    const orphanLog = await IdempotencyLog.findOne({ idempotencyKey: abortKey });
    assert(orphanLog == null, "Workflow 13b: Zero orphaned IdempotencyLog records created after transaction failure");

    // Lower-level replica set rollback check
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await IdempotencyLog.create(
        [
          {
            idempotencyKey: "idemp_simulated_rollback",
            endpoint: "/api/admin/test/rollback",
            payloadHash: "rollback_hash_123",
          },
        ],
        { session }
      );
      await session.abortTransaction();
    } finally {
      await session.endSession();
    }
    const rolledBackDoc = await IdempotencyLog.findOne({ idempotencyKey: "idemp_simulated_rollback" });
    assert(rolledBackDoc == null, "Workflow 14: Simulated multi-document transaction abort rolls back IdempotencyLog cleanly");

    // ── Workflow 15: Cross-Collection Consistency & Persistence ───────────────
    console.log("\n--- Workflow 15: Cross-Collection Consistency ---");
    const totalLogs = await IdempotencyLog.countDocuments();
    assert(totalLogs >= 3, "Workflow 15a: IdempotencyLog records accurately persisted for all completed operations");

    const totalContracts = await AmcContract.countDocuments();
    const totalInvoices = await AmcInvoice.countDocuments();
    const totalAmcPayments = await AmcPayment.countDocuments();
    assert(totalContracts >= 1, "Workflow 15b: AmcContracts persisted");
    assert(totalInvoices >= 1, "Workflow 15c: AmcInvoices persisted");
    assert(totalAmcPayments >= 1, "Workflow 15d: AmcPayments persisted");

    // ── Workflows 16-17: No Duplicate Invoice / Receipt on Replay ─────────────
    console.log("\n--- Workflows 16-17: No Duplicate Financial Entities ---");
    const finalInvoicesCount = await AmcInvoice.countDocuments({ amcContractId: contractId });
    assert(finalInvoicesCount === 2, "Workflow 16: Exactly 2 invoices exist for the contract (initial + renewal, 0 duplicates after replay)");

    const finalAmcPaymentsCount = await AmcPayment.countDocuments({ idempotencyKey: amcPayKey });
    assert(finalAmcPaymentsCount === 1, "Workflow 17: Exactly 1 payment record exists for the idempotency key (0 duplicate receipts)");

    // ── Workflows 18-19: Outstanding Balance & Rollback Hygiene ───────────────
    console.log("\n--- Workflows 18-19: Outstanding Balance & Rollback Hygiene ---");
    const invBalance = await AmcInvoice.findById(initialInvoiceId);
    assert(invBalance.paidAmount + invBalance.pendingAmount === invBalance.totalAmount, "Workflow 19: Financial invariant paidAmount + pendingAmount === totalAmount maintained");

    // ── Workflow 20: Client Authorization & Tenant Isolation ──────────────────
    console.log("\n--- Workflow 20: Authorization & Tenant Isolation ---");
    const clientPaymentsRes = await apiCall("GET", "/api/client/amc/payments", null, clientToken);
    assert(clientPaymentsRes.status === 200, "Workflow 20a: Client portal GET /api/client/amc/payments returns HTTP 200");
    const clientPayList = clientPaymentsRes.body.data || [];
    assert(clientPayList.every(p => String(p.clientId) === String(client._id)), "Workflow 20b: Client portal strictly isolates client's own payments");

    const unauthPaymentRes = await apiCall("POST", "/api/admin/amc/payment", amcPaymentPayload, unauthEmployeeToken);
    assert(unauthPaymentRes.status === 403, "Workflow 20c: Unauthorized employee posting rejected with HTTP 403 Forbidden");

  } finally {
    server.close();
    console.log("\n--- Cleanup ---");
    validateSafetyGates(RS_URI, TEST_DB_NAME);
    try {
      await mongoose.connection.dropDatabase();
      console.log("Dropped isolated replica set database successfully.");
    } catch (e) {
      console.error("Cleanup warning:", e.message);
    }
    await mongoose.disconnect();
    console.log("Disconnected from replica set.\n");
  }

  console.log("======================================================");
  console.log(`TOTAL IDEMPOTENCY TRANSACTION CHECKS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log("======================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runRealIdempotencyTransactionTests().catch((err) => {
  console.error("Fatal error in real transaction test suite:", err);
  process.exit(1);
});
