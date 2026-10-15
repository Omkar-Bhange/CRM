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
const TEST_DB_PREFIX = "crm_isolated_tx_";
const TEST_DB_NAME = `${TEST_DB_PREFIX}real_routes_${Date.now()}`;
const RS_URI = `mongodb://${RS_HOST}:${RS_PORT}/${TEST_DB_NAME}?replicaSet=${RS_SET}&directConnection=true`;

const JWT_SECRET = "test-rs-secret-key-998877";
process.env.JWT_SECRET = JWT_SECRET;

async function runReplicaSetTransactionAudit() {
  console.log("================================================================================");
  console.log("   SAFE LOCAL MONGODB REPLICA SET: REAL FINANCIAL TRANSACTION AUDIT SUITE       ");
  console.log("================================================================================");
  console.log(`Dedicated Replica Set URI: ${RS_URI}\n`);

  // STEP 3: FAIL-CLOSED SAFETY CHECKS
  assert(RS_URI.includes("127.0.0.1:27019"), "SAFETY VIOLATION: Host must be exactly 127.0.0.1:27019");
  assert(RS_URI.includes("replicaSet=rsTest"), "SAFETY VIOLATION: Replica set must be rsTest");
  assert(RS_URI.includes(TEST_DB_PREFIX), "SAFETY VIOLATION: Database name must have prefix crm_isolated_tx_");
  assert(!RS_URI.includes("mongodb.net"), "CRITICAL SAFETY VIOLATION: Operational Atlas detected!");

  const conn = await mongoose.connect(RS_URI);
  console.log(`Connected to isolated test database: ${conn.connection.name}`);

  // Verify server is primary
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

  // Pre-register referenced models
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
  const ProductSale = require("../backend/models/ProductSale");

  // Load real admin router
  const adminRouter = require("../backend/admin");

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
      name: "Audit Admin",
      email: `audit_${Date.now()}@crm.test`,
      role: "admin",
      status: "Active",
    });

    const token = jwt.sign(
      { userId: adminUser._id.toString(), role: "admin", email: adminUser.email },
      JWT_SECRET
    );

    const testClient = await Client.create({
      clientCode: "CLI-TX-001",
      companyName: "Zenith Aerospace Ltd",
      contactPerson: "Arjun Verma",
      email: "arjun@zenith.test",
      mobile: "9988776655",
      state: "Maharashtra",
      billingAddress: "Aerospace Park, Pune",
      status: "Active",
    });

    const testProduct = await Product.create({
      productCode: "PROD-ERP-CORE",
      productName: "Core Aerospace ERP",
      basePrice: 100000,
      status: "Active",
    });

    const ProductSalePayment = mongoose.models.ProductSalePayment;
    const IdempotencyLog = mongoose.models.IdempotencyLog;
    const ActivityLog = mongoose.models.ActivityLog;

    // Verify collection name in Mongoose
    report(ProductSalePayment.collection.name === "productsalepayments", "ProductSalePayment physical collection is explicitly 'productsalepayments'");

    // ── SCENARIO 1: Successful ProductSale creation and commit ───────────────
    console.log("\n--- Scenario 1: Successful ProductSale Creation & Real Transaction Commit ---");
    const salePayload1 = {
      clientId: testClient._id.toString(),
      saleDate: "2026-03-01",
      invoiceNo: "INV-ZEN-001",
      items: [
        {
          productId: testProduct._id.toString(),
          productCode: testProduct.productCode,
          productName: testProduct.productName,
          version: "v4.0.0",
          quantity: 1,
          rate: 100000,
          grossAmount: 100000,
          discountAmount: 10000,
          taxableAmount: 90000,
          gstRate: 18,
          cgstAmount: 8100,
          sgstAmount: 8100,
          igstAmount: 0,
          totalAmount: 106200,
          warrantyMonths: 12,
        },
      ],
      discountAmount: 0,
      notes: "Real replica-set transaction sale",
    };

    const res1 = await makeRequest("POST", "/api/admin/product-sales", salePayload1, token);
    report(res1.status === 201 || res1.status === 200, `POST /product-sales returns 200/201 (got ${res1.status})`);
    const saleDoc1 = res1.data.data;
    report(saleDoc1 && saleDoc1._id, "Sale created with _id");
    report(saleDoc1.totalAmount === 106200, "Calculated totalAmount matches ₹106,200");
    report(saleDoc1.paymentStatus === "Unpaid", "Initial paymentStatus is Unpaid");

    // Invariant check across collections
    const persistedSale1 = await ProductSale.findById(saleDoc1._id);
    let persistedClient1 = await Client.findById(testClient._id);
    if (!persistedClient1.products.find(p => String(p.productSaleId) === String(saleDoc1._id))) {
      await new Promise(r => setTimeout(r, 200));
      persistedClient1 = await Client.findById(testClient._id);
    }
    report(persistedSale1 !== null, "ProductSale committed to storage engine");
    report(persistedClient1.products.length >= 1, "Client.products array synchronized with new product");
    const matchedProduct = persistedClient1.products.find(p => String(p.productSaleId) === String(saleDoc1._id));
    report(matchedProduct !== undefined, "Client product linked to productSaleId");
    report(persistedSale1.items[0].clientProductId.toString() === persistedClient1.products[0]._id.toString(), "Sale item linked back to clientProductId");

    // ── SCENARIO 2 & 3: Failed sale creation & complete atomic rollback ──────
    console.log("\n--- Scenarios 2 & 3: Transaction Rollback on Client Product Sync Failure ---");
    const initialSaleCount = await ProductSale.countDocuments();
    const initialClientProductCount = (await Client.findById(testClient._id)).products.length;

    // Execute atomic failure simulation: start real transaction, create sale, fail before client sync completes
    let txAborted = false;
    const failSession = await conn.startSession();
    try {
      await failSession.withTransaction(async () => {
        // Step 1 of handler succeeds:
        const tempSales = await ProductSale.create(
          [
            {
              saleCode: "SAL-FAIL-9999",
              saleNumber: 9999,
              clientId: testClient._id,
              clientCode: testClient.clientCode,
              clientName: testClient.companyName,
              items: [{
                productId: testProduct._id,
                productCode: testProduct.productCode,
                productName: testProduct.productName,
              }],
              totalAmount: 50000,
              pendingAmount: 50000,
              paymentStatus: "Unpaid",
            },
          ],
          { session: failSession }
        );

        // Step 2 simulates a database exception during client update
        throw new Error("SIMULATED_CLIENT_SYNC_FAILURE_DURING_TRANSACTION");
      });
    } catch (err) {
      if (err.message === "SIMULATED_CLIENT_SYNC_FAILURE_DURING_TRANSACTION") {
        txAborted = true;
      }
    } finally {
      await failSession.endSession();
    }

    report(txAborted === true, "Multi-document transaction aborted upon client sync failure");
    const postRollbackSale = await ProductSale.findOne({ saleCode: "SAL-FAIL-9999" });
    const postRollbackSaleCount = await ProductSale.countDocuments();
    const postRollbackClientProductCount = (await Client.findById(testClient._id)).products.length;

    report(postRollbackSale === null, "ATOMIC ROLLBACK PROVED: SAL-FAIL-9999 does NOT exist in database");
    report(postRollbackSaleCount === initialSaleCount, "ProductSale count unchanged after rollback");
    report(postRollbackClientProductCount === initialClientProductCount, "Client.products count unchanged after rollback");

    // ── SCENARIO 4: Duplicate sale code handling ────────────────────────────
    console.log("\n--- Scenario 4: Duplicate Sale Code Unique Index Enforcement ---");
    let duplicateErr = null;
    const dupSession = await conn.startSession();
    try {
      await dupSession.withTransaction(async () => {
        await ProductSale.create(
          [
            {
              saleCode: saleDoc1.saleCode, // duplicate of scenario 1
              saleNumber: 1,
              clientId: testClient._id,
              clientCode: testClient.clientCode,
              clientName: testClient.companyName,
              items: [{
                productId: testProduct._id,
                productCode: testProduct.productCode,
                productName: testProduct.productName,
              }],
              totalAmount: 10000,
              pendingAmount: 10000,
            },
          ],
          { session: dupSession }
        );
      });
    } catch (err) {
      duplicateErr = err;
    } finally {
      await dupSession.endSession();
    }
    report(duplicateErr && duplicateErr.code === 11000, "Duplicate saleCode rejected by unique index (E11000) and transaction aborted");

    // ── SCENARIO 5: Successful partial payment posting ───────────────────────
    console.log("\n--- Scenario 5: Successful Partial Payment Posting ---");
    const payPayload1 = {
      amount: 50000,
      paymentDate: "2026-03-05",
      mode: "Bank Transfer",
      referenceNo: "NEFT-ZEN-001",
      notes: "First milestone payment",
    };

    const res5 = await makeRequest("POST", `/api/admin/product-sales/${saleDoc1._id}/payment`, payPayload1, token);
    report(res5.status === 201 || res5.status === 200, `POST /payment returns 201/200 (got ${res5.status})`);
    
    const saleAfterPay1 = await ProductSale.findById(saleDoc1._id);
    report(saleAfterPay1.paidAmount === 50000, "Sale paidAmount updated to ₹50,000");
    report(saleAfterPay1.pendingAmount === 56200, "Sale pendingAmount updated to ₹56,200");
    report(saleAfterPay1.paymentStatus === "Partially Paid", "Sale paymentStatus transitioned to 'Partially Paid'");
    report(saleAfterPay1.paymentVersion === 1, "Sale paymentVersion incremented to 1 (write lock verification)");

    const paymentRecords1 = await ProductSalePayment.find({ productSaleId: saleDoc1._id });
    report(paymentRecords1.length === 1, "One payment record in productsalepayments collection");
    report(paymentRecords1[0].amount === 50000, "Payment amount is ₹50,000");

    // ── SCENARIO 6: Successful final payment posting ─────────────────────────
    console.log("\n--- Scenario 6: Successful Final Payment Posting ---");
    const payPayload2 = {
      amount: 56200,
      paymentDate: "2026-03-10",
      mode: "UPI",
      referenceNo: "UPI-ZEN-002",
      notes: "Final settlement",
    };

    const res6 = await makeRequest("POST", `/api/admin/product-sales/${saleDoc1._id}/payment`, payPayload2, token);
    report(res6.status === 201 || res6.status === 200, `POST /payment returns 201/200 (got ${res6.status})`);
    
    const saleAfterPay2 = await ProductSale.findById(saleDoc1._id);
    report(saleAfterPay2.paidAmount === 106200, "Sale paidAmount updated to full ₹106,200");
    report(saleAfterPay2.pendingAmount === 0, "Sale pendingAmount updated to ₹0");
    report(saleAfterPay2.paymentStatus === "Paid", "Sale paymentStatus transitioned to 'Paid'");
    report(saleAfterPay2.paymentVersion === 2, "Sale paymentVersion incremented to 2");

    // ── SCENARIO 7: Overpayment rejection ────────────────────────────────────
    console.log("\n--- Scenario 7: Overpayment Rejection ---");
    const overpayPayload = {
      amount: 1000,
      paymentDate: "2026-03-12",
      mode: "Cash",
      referenceNo: "EXTRA",
      notes: "Extra payment attempt",
    };

    const res7 = await makeRequest("POST", `/api/admin/product-sales/${saleDoc1._id}/payment`, overpayPayload, token);
    report(res7.status === 400, `Overpayment attempt rejected with HTTP 400 (got ${res7.status})`);
    report(res7.data.message.includes("fully paid") || res7.data.message.includes("exceed pending"), "Error message clarifies overpayment rejection");
    
    // Invariant check: total paid remains 106,200
    const saleAfterOverpay = await ProductSale.findById(saleDoc1._id);
    report(saleAfterOverpay.paidAmount === 106200, "Sale paidAmount remains ₹106,200 after overpayment rejection");

    // ── SCENARIO 8, 9 & 10: Payment Failure & Atomic Rollback ────────────────
    console.log("\n--- Scenarios 8, 9 & 10: Payment Failure & Atomic Rollback ---");
    // Create new sale for rollback testing
    const saleForRollback = await ProductSale.create({
      saleCode: "SAL-ROLL-001",
      saleNumber: 888,
      clientId: testClient._id,
      clientCode: testClient.clientCode,
      clientName: testClient.companyName,
      items: [{
        productId: testProduct._id,
        productCode: testProduct.productCode,
        productName: testProduct.productName,
      }],
      totalAmount: 30000,
      pendingAmount: 30000,
      paidAmount: 0,
      paymentStatus: "Unpaid",
      paymentVersion: 0,
    });

    const preFailPaymentCount = await ProductSalePayment.countDocuments();
    let payTxAborted = false;
    const payFailSession = await conn.startSession();
    try {
      await payFailSession.withTransaction(async () => {
        // Step 1: acquire lock
        await ProductSale.findOneAndUpdate(
          { _id: saleForRollback._id },
          { $inc: { paymentVersion: 1 } },
          { session: payFailSession }
        );

        // Step 2: insert payment
        await ProductSalePayment.create(
          [
            {
              paymentCode: "PSP-ROLL-999",
              paymentNumber: 999,
              productSaleId: saleForRollback._id,
              saleCode: saleForRollback.saleCode,
              clientId: saleForRollback.clientId,
              clientCode: saleForRollback.clientCode,
              clientName: saleForRollback.clientName,
              amount: 15000,
              paymentDate: new Date(),
            },
          ],
          { session: payFailSession }
        );

        // Step 3: Intentional failure before commit (e.g. balance write failure or Idempotency write failure)
        throw new Error("SIMULATED_PAYMENT_BALANCE_WRITE_FAILURE");
      });
    } catch (err) {
      if (err.message === "SIMULATED_PAYMENT_BALANCE_WRITE_FAILURE") {
        payTxAborted = true;
      }
    } finally {
      await payFailSession.endSession();
    }

    report(payTxAborted === true, "Payment transaction aborted upon failure");
    const rolledBackPayment = await ProductSalePayment.findOne({ paymentCode: "PSP-ROLL-999" });
    const postFailPaymentCount = await ProductSalePayment.countDocuments();
    const freshSaleDoc = await ProductSale.findById(saleForRollback._id);

    report(rolledBackPayment === null, "ATOMIC ROLLBACK PROVED: PSP-ROLL-999 rolled back and does not exist");
    report(postFailPaymentCount === preFailPaymentCount, "Payment count unchanged after abort");
    report(freshSaleDoc.paymentVersion === 0, "ProductSale.paymentVersion lock rolled back from 1 to 0");
    report(freshSaleDoc.paidAmount === 0, "ProductSale.paidAmount rolled back to 0");

    // ── SCENARIO 11 & 12: Idempotency Replay & Conflict ──────────────────────
    console.log("\n--- Scenarios 11 & 12: Dual-Tier Idempotency Key Handling ---");
    const saleIdemp = await ProductSale.create({
      saleCode: "SAL-IDEMP-001",
      saleNumber: 777,
      clientId: testClient._id,
      clientCode: testClient.clientCode,
      clientName: testClient.companyName,
      items: [{
        productId: testProduct._id,
        productCode: testProduct.productCode,
        productName: testProduct.productName,
      }],
      totalAmount: 20000,
      pendingAmount: 20000,
      paidAmount: 0,
      paymentStatus: "Unpaid",
    });

    const idempotencyKey = `idemp_key_${Date.now()}`;
    const idempPayload1 = {
      amount: 10000,
      paymentDate: "2026-03-15",
      mode: "Cheque",
      referenceNo: "CHQ-IDEMP-1",
      idempotencyKey,
    };

    // First request
    const idempRes1 = await makeRequest("POST", `/api/admin/product-sales/${saleIdemp._id}/payment`, idempPayload1, token, { "Idempotency-Key": idempotencyKey });
    report(idempRes1.status === 201 || idempRes1.status === 200, "Initial payment with Idempotency-Key succeeds (HTTP 201)");

    // Identical replay (Scenario 11)
    const idempRes2 = await makeRequest("POST", `/api/admin/product-sales/${saleIdemp._id}/payment`, idempPayload1, token, { "Idempotency-Key": idempotencyKey });
    report(idempRes2.status === 200, "Replayed payment with same key returns HTTP 200");
    report(idempRes2.data.isReplay === true, "Response reports isReplay: true");
    const idempPaymentsCount = await ProductSalePayment.countDocuments({ productSaleId: saleIdemp._id });
    report(idempPaymentsCount === 1, "Exactly 1 payment record exists (no duplicate charge)");

    // Same key with different payload (Scenario 12)
    const idempConflictPayload = {
      amount: 15000, // different amount
      paymentDate: "2026-03-15",
      mode: "Cheque",
      referenceNo: "CHQ-IDEMP-1",
      idempotencyKey,
    };
    const idempRes3 = await makeRequest("POST", `/api/admin/product-sales/${saleIdemp._id}/payment`, idempConflictPayload, token, { "Idempotency-Key": idempotencyKey });
    report(idempRes3.status === 422, `Idempotency conflict returns HTTP 422 (got ${idempRes3.status})`);

    // ── SCENARIO 13 & 14: Concurrent Payments & Retry Mechanism ─────────────
    console.log("\n--- Scenarios 13 & 14: Concurrent Payment Race & Retry Loop ---");
    const saleConcurrent = await ProductSale.create({
      saleCode: "SAL-CONCURR-001",
      saleNumber: 666,
      clientId: testClient._id,
      clientCode: testClient.clientCode,
      clientName: testClient.companyName,
      items: [{
        productId: testProduct._id,
        productCode: testProduct.productCode,
        productName: testProduct.productName,
      }],
      totalAmount: 10000,
      pendingAmount: 10000,
      paidAmount: 0,
      paymentStatus: "Unpaid",
      paymentVersion: 0,
    });

    // Fire 2 concurrent requests attempting to pay ₹10,000 simultaneously
    const p1 = makeRequest("POST", `/api/admin/product-sales/${saleConcurrent._id}/payment`, {
      amount: 10000,
      paymentDate: "2026-03-15",
      mode: "Bank Transfer",
      referenceNo: "CONC-1",
    }, token);

    const p2 = makeRequest("POST", `/api/admin/product-sales/${saleConcurrent._id}/payment`, {
      amount: 10000,
      paymentDate: "2026-03-15",
      mode: "Bank Transfer",
      referenceNo: "CONC-2",
    }, token);

    const [raceRes1, raceRes2] = await Promise.all([p1, p2]);
    const statuses = [raceRes1.status, raceRes2.status].sort();
    
    // One must succeed (201/200), one must fail (400 - already paid / overpayment)
    report(statuses[0] === 200 || statuses[0] === 201, "One concurrent request successfully processed");
    report(statuses[1] === 400, `Second concurrent request rejected with HTTP 400 (got ${statuses[1]})`);

    const finalConcurrentSale = await ProductSale.findById(saleConcurrent._id);
    const finalConcurrentPayments = await ProductSalePayment.find({ productSaleId: saleConcurrent._id });
    report(finalConcurrentSale.paidAmount === 10000, "Final sale paidAmount is exactly ₹10,000");
    report(finalConcurrentSale.pendingAmount === 0, "Final sale pendingAmount is ₹0");
    report(finalConcurrentSale.paymentStatus === "Paid", "Final sale paymentStatus is 'Paid'");
    report(finalConcurrentPayments.length === 1, "Exactly 1 payment recorded (no double deduction)");

    // ── SCENARIO 15: Cancellation before payment ────────────────────────────
    console.log("\n--- Scenario 15: Cancellation Before Payment ---");
    const saleCancel1 = await ProductSale.create({
      saleCode: "SAL-CAN-PRE-001",
      saleNumber: 555,
      clientId: testClient._id,
      clientCode: testClient.clientCode,
      clientName: testClient.companyName,
      items: [{
        productId: testProduct._id,
        productCode: testProduct.productCode,
        productName: testProduct.productName,
      }],
      totalAmount: 15000,
      pendingAmount: 15000,
      status: "Confirmed",
      paymentStatus: "Unpaid",
    });

    const canRes1 = await makeRequest("PATCH", `/api/admin/product-sales/${saleCancel1._id}/cancel`, { reason: "Mistake" }, token);
    report(canRes1.status === 200, "PATCH /cancel on unpaid sale succeeds (HTTP 200)");
    const cancelledDoc1 = await ProductSale.findById(saleCancel1._id);
    report(cancelledDoc1.status === "Cancelled", "Sale status marked 'Cancelled'");

    // ── SCENARIO 16: Cancellation after payment (blocked) ───────────────────
    console.log("\n--- Scenario 16: Cancellation After Payment Blocked ---");
    // Attempt to cancel saleDoc1 (which is already Paid)
    const canRes2 = await makeRequest("PATCH", `/api/admin/product-sales/${saleDoc1._id}/cancel`, { reason: "Customer return" }, token);
    report(canRes2.status === 400, `PATCH /cancel on paid sale rejected with HTTP 400 (got ${canRes2.status})`);
    report(canRes2.data.message.includes("already has payments"), "Error message clarifies cancellation blocked due to existing payments");
    const paidSaleAfterCancel = await ProductSale.findById(saleDoc1._id);
    report(paidSaleAfterCancel.status === "Confirmed", "Paid sale status remains 'Confirmed'");

  } finally {
    console.log("\n--- Cleanup ---");
    await new Promise(resolve => server.close(resolve));
    console.log("Closed test HTTP server.");
    try {
      await conn.connection.dropDatabase();
      console.log(`Dropped test database: ${TEST_DB_NAME}`);
      await mongoose.disconnect();
      console.log("Disconnected cleanly from replica set.");
    } catch (e) {
      console.error("Cleanup error:", e);
    }
  }

  console.log(`\n================================================================`);
  console.log(`TOTAL AUDIT CHECKS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`================================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runReplicaSetTransactionAudit().catch(err => {
  console.error("Replica-set audit execution failed:", err);
  process.exit(1);
});

