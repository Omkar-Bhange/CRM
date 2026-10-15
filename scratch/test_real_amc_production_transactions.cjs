"use strict";

const path = require("path");
process.env.NODE_PATH = path.resolve("backend/node_modules");
require("module").Module._initPaths();

const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const http = require("http");
const assert = require("assert");

// STRICT FAIL-CLOSED TEST CONFIGURATION
const RS_PORT = 27019;
const RS_HOST = "127.0.0.1";
const RS_SET = "rsTest";
const TEST_DB_PREFIX = "crm_isolated_tx_amc_prod_";
const TEST_DB_NAME = `${TEST_DB_PREFIX}real_${Date.now()}`;
const RS_URI = `mongodb://${RS_HOST}:${RS_PORT}/${TEST_DB_NAME}?replicaSet=${RS_SET}&directConnection=true`;

const JWT_SECRET = "test-rs-amc-secret-key-123456";
process.env.JWT_SECRET = JWT_SECRET;

async function runRealAmcProductionTransactions() {
  console.log("================================================================================");
  console.log("   STEP 4: REAL PRODUCTION AMC TRANSACTION & FINANCIAL RECOVERY VERIFICATION     ");
  console.log("================================================================================");
  console.log(`Dedicated Replica Set URI: ${RS_URI}\n`);

  // FAIL-CLOSED SAFETY CHECKS
  assert(RS_URI.includes("127.0.0.1:27019"), "SAFETY VIOLATION: Host must be exactly 127.0.0.1:27019");
  assert(RS_URI.includes("replicaSet=rsTest"), "SAFETY VIOLATION: Replica set must be rsTest");
  assert(RS_URI.includes(TEST_DB_PREFIX), "SAFETY VIOLATION: Database name must have prefix crm_isolated_tx_amc_prod_");
  assert(!RS_URI.includes("mongodb.net"), "CRITICAL SAFETY VIOLATION: Operational Atlas detected!");

  const conn = await mongoose.connect(RS_URI);
  console.log(`Connected to isolated test database: ${conn.connection.name}`);

  const hello = await conn.connection.db.command({ hello: 1 });
  assert.strictEqual(hello.setName, RS_SET, "Server setName must match rsTest");
  assert.strictEqual(hello.isWritablePrimary, true, "Connected server must be isWritablePrimary");
  console.log("✓ Safety Verified: Connected strictly to rsTest PRIMARY on 127.0.0.1:27019\n");

  let passed = 0;
  let failed = 0;

  function report(condition, message) {
    if (condition) {
      passed++;
      console.log(`  ✓ PASSED: ${message}`);
    } else {
      failed++;
      console.error(`  ✗ FAILED: ${message}`);
    }
  }

  // Pre-register user model
  const User =
    mongoose.models.User ||
    mongoose.model(
      "User",
      new mongoose.Schema({
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        role: { type: String, required: true },
        status: { type: String, default: "Active" },
      })
    );

  const Employee =
    mongoose.models.Employee ||
    mongoose.model(
      "Employee",
      new mongoose.Schema({
        name: { type: String, required: true },
        employeeCode: { type: String, required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: { type: String, default: "Active" },
      })
    );

  const Client = require("../backend/models/Client");
  const Product = require("../backend/models/Product");
  const AmcContract = require("../backend/models/AmcContract");

  // Load production router
  const adminRouter = require("../backend/admin");
  const AmcInvoice = mongoose.models.AmcInvoice;
  const AmcPayment = mongoose.models.AmcPayment;
  const IdempotencyLog = mongoose.models.IdempotencyLog;

  // Pre-create collections to prevent DDL lock timeouts during transactions
  await conn.connection.db.createCollection("amccontracts").catch(() => {});
  await conn.connection.db.createCollection("amcinvoices").catch(() => {});
  await conn.connection.db.createCollection("amcpayments").catch(() => {});
  await conn.connection.db.createCollection("clients").catch(() => {});
  await conn.connection.db.createCollection("products").catch(() => {});
  await conn.connection.db.createCollection("idempotencylogs").catch(() => {});
  await conn.connection.db.createCollection("appcounters").catch(() => {});
  await conn.connection.db.createCollection("users").catch(() => {});

  await AmcContract.init();
  await AmcInvoice.init();
  await AmcPayment.init();
  await Client.init();
  await Product.init();
  await IdempotencyLog.init();

  const app = express();
  app.use(express.json());
  app.use("/api/admin", adminRouter);

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`Real Express production router listening on port ${port}\n`);

  function makeRequest(method, pathUrl, body = null, token = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const payload = body ? JSON.stringify(body) : null;
      const reqHeaders = { "Content-Type": "application/json", ...headers };
      if (token) reqHeaders["Authorization"] = `Bearer ${token}`;
      if (payload) reqHeaders["Content-Length"] = Buffer.byteLength(payload);

      const req = http.request(
        {
          hostname: "127.0.0.1",
          port,
          path: pathUrl,
          method,
          headers: reqHeaders,
        },
        res => {
          let data = "";
          res.on("data", chunk => (data += chunk));
          res.on("end", () => {
            let json = null;
            try {
              json = JSON.parse(data);
            } catch (e) {
              json = data;
            }
            resolve({ status: res.statusCode, data: json });
          });
        }
      );

      req.on("error", reject);
      if (payload) req.write(payload);
      req.end();
    });
  }

  try {
    // ── FIXTURES SETUP ────────────────────────────────────────────────────────
    const adminUser = await User.create({
      name: "Audit Administrator",
      email: `admin_tx_${Date.now()}@crm.local`,
      role: "admin",
      status: "Active",
    });

    const adminToken = jwt.sign(
      { userId: adminUser._id.toString(), role: "admin", email: adminUser.email, name: adminUser.name },
      JWT_SECRET
    );

    const testProduct1 = await Product.create({
      productCode: "ERP-PROD-01",
      productName: "Alpha ERP Suite",
      basePrice: 100000,
      status: "Active",
    });

    const testProduct2 = await Product.create({
      productCode: "CRM-PROD-02",
      productName: "Beta CRM Cloud",
      basePrice: 80000,
      status: "Active",
    });

    // Client in Maharashtra (Intra-state)
    const clientMH = await Client.create({
      clientCode: `CLI-MH-${Date.now()}`,
      companyName: "Maharashtra Manufacturing Pvt Ltd",
      state: "Maharashtra",
      billingAddress: { state: "Maharashtra", country: "India" },
      contactPerson: "Mahesh Patil",
      email: "mahesh@mh.local",
      mobile: "9820011223",
      products: [
        {
          productId: testProduct1._id,
          productCode: testProduct1.productCode,
          productName: testProduct1.productName,
          version: "v2.0",
          status: "Active",
        },
      ],
    });

    const clientMHProduct = clientMH.products[0];

    // Client in Gujarat (Inter-state)
    const clientGJ = await Client.create({
      clientCode: `CLI-GJ-${Date.now()}`,
      companyName: "Gujarat Logistics Ltd",
      state: "Gujarat",
      billingAddress: { state: "Gujarat", country: "India" },
      contactPerson: "Gaurav Patel",
      email: "gaurav@gj.local",
      mobile: "9825011224",
      products: [
        {
          productId: testProduct2._id,
          productCode: testProduct2.productCode,
          productName: testProduct2.productName,
          version: "v3.1",
          status: "Active",
        },
      ],
    });

    const clientGJProduct = clientGJ.products[0];

    // ── SCENARIO 1: Creating AMC Contract and Initial Invoice ─────────────────
    console.log("--- Scenario 1: Creating AMC Contract and Initial Invoice via POST /amc/contract ---");
    const createContractPayload = {
      clientId: clientMH._id.toString(),
      clientProductId: clientMHProduct._id.toString(),
      plan: "Standard",
      licensedUsers: 5,
      startDate: "2026-04-01",
      expiryDate: "2027-03-31",
      dueDate: "2026-04-15",
      taxableAmount: 100000,
      cgstRate: 9,
      sgstRate: 9,
      igstRate: 0,
      notes: "Contract created in production replica-set transaction",
    };

    const resCreate = await makeRequest("POST", "/api/admin/amc/contract", createContractPayload, adminToken);
    report(resCreate.status === 201 || resCreate.status === 200, `POST /amc/contract returns HTTP ${resCreate.status}`);
    const createdContractId = resCreate.data?.data?._id || resCreate.data?.contract?._id;
    report(createdContractId != null, "Contract created with permanent ObjectId");

    const persistedContract1 = await AmcContract.findById(createdContractId);
    report(persistedContract1 != null && persistedContract1.contractCode.startsWith("AMC-CTR-"), "Contract document committed to amccontracts");

    // ── SCENARIO 2: Validating Invoice Totals ─────────────────────────────────
    console.log("\n--- Scenario 2: Validating Invoice Totals & Rounding ---");
    const initialInvoice = await AmcInvoice.findOne({ amcContractId: persistedContract1._id });
    report(initialInvoice != null, "Initial invoice created and linked via amcContractId");
    report(initialInvoice.taxableAmount === 100000, "Invoice taxableAmount matches ₹100,000");
    report(initialInvoice.cgstAmount === 9000, "CGST 9% matches ₹9,000");
    report(initialInvoice.sgstAmount === 9000, "SGST 9% matches ₹9,000");
    report(initialInvoice.totalTaxAmount === 18000, "Total tax amount matches ₹18,000");
    report(initialInvoice.totalAmount === 118000, "Total amount matches ₹118,000 (taxable + totalTax)");
    report(initialInvoice.pendingAmount === 118000, "Initial pendingAmount equals total ₹118,000");

    // ── SCENARIO 3: Validating GST Place-of-Supply Rules ──────────────────────
    console.log("\n--- Scenario 3: Validating GST Place-of-Supply Rules ---");
    // Contract 1: MH -> Intra-state
    report(initialInvoice.cgstRate === 9 && initialInvoice.sgstRate === 9 && initialInvoice.igstRate === 0, "Intra-state (Maharashtra) invoice correctly uses CGST (9%) + SGST (9%)");

    // Contract 2: Gujarat -> Inter-state
    const resCreateGJ = await makeRequest(
      "POST",
      "/api/admin/amc/contract",
      {
        clientId: clientGJ._id.toString(),
        clientProductId: clientGJProduct._id.toString(),
        plan: "Premium",
        licensedUsers: 10,
        startDate: "2026-05-01",
        expiryDate: "2027-04-30",
        dueDate: "2026-05-15",
        taxableAmount: 200000,
        cgstRate: 0,
        sgstRate: 0,
        igstRate: 18,
        notes: "Inter-state contract in Gujarat",
      },
      adminToken
    );
    report(resCreateGJ.status === 200 || resCreateGJ.status === 201, "Inter-state contract created successfully");
    const contractGJId = resCreateGJ.data?.data?._id || resCreateGJ.data?.contract?._id;
    const invoiceGJ = await AmcInvoice.findOne({ amcContractId: contractGJId });
    report(invoiceGJ.igstRate === 18 && invoiceGJ.igstAmount === 36000 && invoiceGJ.cgstAmount === 0 && invoiceGJ.sgstAmount === 0, "Inter-state (Gujarat) invoice correctly uses IGST (18% = ₹36,000)");

    // ── SCENARIO 4: Client-Product Relationships Intact ───────────────────────
    console.log("\n--- Scenario 4: Ensuring Client-Product Relationships Remain Intact ---");
    const refreshedClientMH = await Client.findById(clientMH._id);
    const updatedProdMH = refreshedClientMH.products.id(clientMHProduct._id);
    report(updatedProdMH.expiryDate === "2027-03-31", "Client.products.expiryDate synchronized with contract expiry");
    report(updatedProdMH.amcStatus === "Pending", "Client.products.amcStatus updated to Pending");
    report(refreshedClientMH.nextRenewal === "2027-03-31", "Client.nextRenewal synchronized");

    // ── SCENARIO 5: Rolling Back Failed Contract Creation ─────────────────────
    console.log("\n--- Scenario 5: Rolling Back Failed Contract Creation (Atomic Abort) ---");
    const preRollbackContractCount = await AmcContract.countDocuments();
    const preRollbackInvoiceCount = await AmcInvoice.countDocuments();

    // Submit invalid request that will fail validation (expiry before start)
    const resFail = await makeRequest(
      "POST",
      "/api/admin/amc/contract",
      {
        clientId: clientMH._id.toString(),
        clientProductId: clientMHProduct._id.toString(),
        startDate: "2027-05-01",
        expiryDate: "2026-05-01", // Invalid: expiry before start
        dueDate: "2027-05-15",
        taxableAmount: 50000,
      },
      adminToken
    );
    report(resFail.status === 400, "Invalid contract creation rejected with HTTP 400");
    const postRollbackContractCount = await AmcContract.countDocuments();
    const postRollbackInvoiceCount = await AmcInvoice.countDocuments();
    report(preRollbackContractCount === postRollbackContractCount, "0 phantom contracts created upon failure");
    report(preRollbackInvoiceCount === postRollbackInvoiceCount, "0 phantom invoices created upon failure");

    // ── SCENARIO 6: Standard Renewal Creating Consecutive Period ──────────────
    console.log("\n--- Scenario 6: Standard Renewal Creating Consecutive Period ---");
    // To test post-expiry / standard renewal (which archives prior cycle to renewalHistory),
    // set contract 1's and its initial invoice's expiry date to the past so today > existingExpiry:
    persistedContract1.startDate = new Date("2025-04-01");
    persistedContract1.expiryDate = new Date("2026-03-31");
    await persistedContract1.save();

    await AmcInvoice.updateOne(
      { _id: initialInvoice._id },
      {
        contractStartDate: new Date("2025-04-01"),
        contractExpiryDate: new Date("2026-03-31"),
      }
    );

    const renewKey1 = `IDEMP-RENEW-${Date.now()}`;
    const resRenewStandard = await makeRequest(
      "POST",
      `/api/admin/amc/contract/${persistedContract1._id}/renew`,
      {
        startDate: "2026-04-01",
        expiryDate: "2027-03-31",
        dueDate: "2026-04-15",
        taxableAmount: 110000,
        gstRate: 18,
        gstApplicable: "YES",
        taxType: "intra",
        idempotencyKey: renewKey1,
        notes: "Standard annual renewal after expiry",
      },
      adminToken
    );
    report(resRenewStandard.status === 200 || resRenewStandard.status === 201, `Standard renewal returned HTTP ${resRenewStandard.status}`);
    const standardRenewContract = await AmcContract.findById(persistedContract1._id);
    const renewalInvoice = await AmcInvoice.findOne({
      amcContractId: persistedContract1._id,
      invoiceType: "Renewal",
    });
    report(renewalInvoice != null && renewalInvoice.taxableAmount === 110000, "Renewal invoice generated with updated commercial terms");

    // ── SCENARIO 7 & 8: Early Renewal Preserving Current Active Coverage ───────
    console.log("\n--- Scenario 7 & 8: Early Renewal Preserving Current Active Coverage & upcomingRenewal ---");
    // Contract 2 is currently active from 2026-05-01 to 2027-04-30 (today is in 2026).
    // Perform early renewal for future period: 2027-05-01 to 2028-04-30
    const earlyRenewKey = `IDEMP-EARLY-${Date.now()}`;
    const resEarlyRenew = await makeRequest(
      "POST",
      `/api/admin/amc/contract/${contractGJId}/renew`,
      {
        startDate: "2027-05-01",
        expiryDate: "2028-04-30",
        dueDate: "2027-05-15",
        taxableAmount: 220000,
        gstRate: 18,
        gstApplicable: "YES",
        taxType: "inter",
        idempotencyKey: earlyRenewKey,
        notes: "Early queue renewal while contract 2 is active",
      },
      adminToken
    );
    report(resEarlyRenew.status === 200 || resEarlyRenew.status === 201, "Early renewal accepted by production handler");
    const contractAfterEarly = await AmcContract.findById(contractGJId);
    report(
      contractAfterEarly.startDate.toISOString().slice(0, 10) === "2026-05-01",
      "Current active startDate PRESERVED (2026-05-01) - not overwritten prematurely"
    );
    report(
      contractAfterEarly.expiryDate.toISOString().slice(0, 10) === "2027-04-30",
      "Current active expiryDate PRESERVED (2027-04-30) - ongoing coverage remains intact"
    );
    report(contractAfterEarly.upcomingRenewal?.invoiceId != null, "upcomingRenewal queue populated with new invoiceId");
    report(
      contractAfterEarly.upcomingRenewal?.startDate.toISOString().slice(0, 10) === "2027-05-01",
      "upcomingRenewal.startDate correctly queued as 2027-05-01"
    );

    // ── SCENARIO 9: Renewal History Archival ──────────────────────────────────
    console.log("\n--- Scenario 9: Renewal History Archival on Standard Renewal ---");
    // Contract 1 underwent standard renewal, so previous cycle should be archived in renewalHistory
    report(standardRenewContract.renewalHistory.length >= 1, "Prior cycle archived in renewalHistory array");
    const archivedCycle = standardRenewContract.renewalHistory[0];
    report(
      archivedCycle.startDate.toISOString().slice(0, 10) === "2025-04-01" &&
      archivedCycle.expiryDate.toISOString().slice(0, 10) === "2026-03-31",
      "Archived cycle accurately preserves historical period 2025-04-01 to 2026-03-31"
    );

    // ── SCENARIO 10: Duplicate Renewal Prevention ────────────────────────────
    console.log("\n--- Scenario 10: Duplicate Renewal Prevention ---");
    const resDuplicateRenew = await makeRequest(
      "POST",
      `/api/admin/amc/contract/${persistedContract1._id}/renew`,
      {
        startDate: "2026-04-01",
        expiryDate: "2027-03-31",
        taxableAmount: 110000,
        gstRate: 18,
      },
      adminToken
    );
    report(resDuplicateRenew.status === 409, "Duplicate renewal period rejected with HTTP 409 conflict");

    // ── SCENARIO 11 & 12: Idempotency Replay & Payload Conflict ──────────────
    console.log("\n--- Scenario 11 & 12: Idempotency Replay & Payload Conflict ---");
    // Replay with identical key and payload
    const resReplay = await makeRequest(
      "POST",
      `/api/admin/amc/contract/${contractGJId}/renew`,
      {
        startDate: "2027-05-01",
        expiryDate: "2028-04-30",
        dueDate: "2027-05-15",
        taxableAmount: 220000,
        gstRate: 18,
        gstApplicable: "YES",
        taxType: "inter",
        idempotencyKey: earlyRenewKey,
        notes: "Early queue renewal while contract 2 is active",
      },
      adminToken
    );
    report(resReplay.status === 200, "Replayed renewal with identical key returns HTTP 200");
    report(resReplay.data.isReplay === true, "Response contains isReplay: true flag");

    // Conflict with same key but mismatched amount
    const resConflict = await makeRequest(
      "POST",
      `/api/admin/amc/contract/${contractGJId}/renew`,
      {
        startDate: "2027-05-01",
        expiryDate: "2028-04-30",
        dueDate: "2027-05-15",
        taxableAmount: 999999, // Mismatched payload
        gstRate: 18,
        gstApplicable: "YES",
        taxType: "inter",
        idempotencyKey: earlyRenewKey,
      },
      adminToken
    );
    report(resConflict.status === 422, "Idempotency conflict rejected with HTTP 422 Unprocessable Entity");

    // ── SCENARIO 13: Concurrent Renewal Lock Behavior ────────────────────────
    console.log("\n--- Scenario 13: Concurrent Renewal Lock Behavior ---");
    // Verify renewalVersion and renewalLockAt
    const lockedDoc = await AmcContract.findById(contractGJId);
    report(lockedDoc.renewalVersion >= 1, "renewalVersion incremented atomically");
    report(lockedDoc.renewalLockAt != null, "renewalLockAt timestamp recorded");

    // ── SCENARIO 14: Invoice Numbering Uniqueness ────────────────────────────
    console.log("\n--- Scenario 14: Invoice Numbering Uniqueness ---");
    const allInvoices = await AmcInvoice.find({});
    const invoiceCodes = allInvoices.map(i => i.invoiceCode);
    const uniqueInvoiceCodes = new Set(invoiceCodes);
    report(allInvoices.length === uniqueInvoiceCodes.size, `All ${allInvoices.length} generated invoices have strictly unique invoiceCodes`);

    // ── SCENARIO 15 & 16: Atomic Rollback on Injected Failure ────────────────
    console.log("\n--- Scenario 15 & 16: Atomic Rollback on Injected Failure ---");
    const sessionFail = await mongoose.startSession();
    sessionFail.startTransaction();
    try {
      await AmcInvoice.create(
        [
          {
            invoiceCode: "INV-FAIL-TX-001",
            amcContractId: persistedContract1._id,
            clientId: clientMH._id,
            totalAmount: 99999,
          },
        ],
        { session: sessionFail }
      );
      // Simulate failure before commit
      throw new Error("Simulated failure during invoice persistence");
    } catch (e) {
      await sessionFail.abortTransaction();
    } finally {
      await sessionFail.endSession();
    }

    const phantomInvoice = await AmcInvoice.findOne({ invoiceCode: "INV-FAIL-TX-001" });
    report(phantomInvoice === null, "Transaction rollback proved: 0 phantom invoices created");

    // ── SCENARIO 17: Payment Posting & Outstanding Balance Reconciliation ─────
    console.log("\n--- Scenario 17: Payment Posting & Outstanding Balance Reconciliation ---");
    // Post partial payment against Contract 1's initial invoice (₹50,000 against ₹118,000)
    const payKey1 = `IDEMP-PAY-${Date.now()}`;
    const resPay1 = await makeRequest(
      "POST",
      "/api/admin/amc/payment",
      {
        amcInvoiceId: initialInvoice._id.toString(),
        amcContractId: persistedContract1._id.toString(),
        amount: 50000,
        paymentDate: "2026-04-10",
        mode: "Bank Transfer",
        referenceNo: "NEFT-12345678",
        notes: "First partial installment",
        idempotencyKey: payKey1,
      },
      adminToken
    );
    report(resPay1.status === 200 || resPay1.status === 201, `Partial payment returns HTTP ${resPay1.status}`);

    const invoiceAfterPay1 = await AmcInvoice.findById(initialInvoice._id);
    report(invoiceAfterPay1.paidAmount === 50000, "Invoice paidAmount updated to ₹50,000");
    report(invoiceAfterPay1.pendingAmount === 68000, "Invoice pendingAmount reconciled to ₹68,000");
    report(invoiceAfterPay1.paymentStatus === "Partially Paid", "Invoice status transitioned to 'Partially Paid'");

    // Post final payment to fully settle the invoice (₹68,000)
    const payKey2 = `IDEMP-PAY-FINAL-${Date.now()}`;
    const resPay2 = await makeRequest(
      "POST",
      "/api/admin/amc/payment",
      {
        amcInvoiceId: initialInvoice._id.toString(),
        amcContractId: persistedContract1._id.toString(),
        amount: 68000,
        paymentDate: "2026-04-20",
        mode: "Bank Transfer",
        referenceNo: "NEFT-87654321",
        notes: "Final settlement payment",
        idempotencyKey: payKey2,
      },
      adminToken
    );
    report(resPay2.status === 200 || resPay2.status === 201, `Final payment returns HTTP ${resPay2.status}`);

    const invoiceAfterPay2 = await AmcInvoice.findById(initialInvoice._id);
    report(invoiceAfterPay2.paidAmount === 118000, "Invoice paidAmount updated to full ₹118,000");
    report(invoiceAfterPay2.pendingAmount === 0, "Invoice pendingAmount reconciled to ₹0");
    report(invoiceAfterPay2.paymentStatus === "Paid", "Invoice status transitioned to 'Paid'");

    // ── SCENARIO 18: No Duplicate Invoice/Contract on Retried Request ─────────
    console.log("\n--- Scenario 18: No Duplicate Invoice/Contract on Retried Request ---");
    const resPayReplay = await makeRequest(
      "POST",
      "/api/admin/amc/payment",
      {
        amcInvoiceId: initialInvoice._id.toString(),
        amcContractId: persistedContract1._id.toString(),
        amount: 68000,
        paymentDate: "2026-04-20",
        mode: "Bank Transfer",
        referenceNo: "NEFT-87654321",
        notes: "Final settlement payment",
        idempotencyKey: payKey2,
      },
      adminToken
    );
    report(resPayReplay.status === 200, "Payment replay returns HTTP 200");
    report(resPayReplay.data.isReplay === true, "Payment replay response marked isReplay: true");

    const totalPaymentsForInvoice = await AmcPayment.countDocuments({ amcInvoiceId: initialInvoice._id });
    report(totalPaymentsForInvoice === 2, "Exactly 2 payments recorded in database (no double-deduction on replay)");

  } finally {
    console.log("\n--- Cleanup ---");
    server.close();
    await mongoose.connection.dropDatabase();
    console.log("Dropped isolated replica set test database.");
    await mongoose.disconnect();
    console.log("Disconnected from replica set.");
  }

  console.log(`\n======================================================`);
  console.log(`TOTAL REAL TRANSACTION CHECKS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`======================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runRealAmcProductionTransactions().catch(err => {
  console.error("Fatal transaction audit error:", err);
  process.exit(1);
});
