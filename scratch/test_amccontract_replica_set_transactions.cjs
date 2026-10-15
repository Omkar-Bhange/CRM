"use strict";

const path = require("path");
process.env.NODE_PATH = path.resolve("backend/node_modules");
require("module").Module._initPaths();

const mongoose = require("mongoose");
const assert = require("assert");

// STRICT FAIL-CLOSED TEST CONFIGURATION
const RS_PORT = 27019;
const RS_HOST = "127.0.0.1";
const RS_SET = "rsTest";
const TEST_DB_PREFIX = "crm_isolated_tx_amc_";
const TEST_DB_NAME = `${TEST_DB_PREFIX}real_routes_${Date.now()}`;
const RS_URI = `mongodb://${RS_HOST}:${RS_PORT}/${TEST_DB_NAME}?replicaSet=${RS_SET}&directConnection=true`;

async function runAmcContractReplicaSetTransactions() {
  console.log("================================================================================");
  console.log("   SAFE LOCAL MONGODB REPLICA SET: AMCCONTRACT TRANSACTION INTEGRITY SUITE      ");
  console.log("================================================================================");
  console.log(`Dedicated Replica Set URI: ${RS_URI}\n`);

  // FAIL-CLOSED SAFETY CHECKS
  assert(RS_URI.includes("127.0.0.1:27019"), "SAFETY VIOLATION: Host must be exactly 127.0.0.1:27019");
  assert(RS_URI.includes("replicaSet=rsTest"), "SAFETY VIOLATION: Replica set must be rsTest");
  assert(RS_URI.includes(TEST_DB_PREFIX), "SAFETY VIOLATION: Database name must have prefix crm_isolated_tx_amc_");
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

  // Pre-register models
  const Client = require("../backend/models/Client");
  const Product = require("../backend/models/Product");
  const AmcContract = require("../backend/models/AmcContract");

  const AmcInvoice =
    mongoose.models.AmcInvoice ||
    mongoose.model(
      "AmcInvoice",
      new mongoose.Schema({
        invoiceCode: { type: String, required: true },
        amcContractId: { type: mongoose.Schema.Types.ObjectId, ref: "AmcContract", required: true },
        clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
        totalAmount: { type: Number, default: 0 },
        paidAmount: { type: Number, default: 0 },
        pendingAmount: { type: Number, default: 0 },
        paymentStatus: { type: String, default: "Pending" },
        status: { type: String, default: "Issued" },
        isDeleted: { type: Boolean, default: false },
      })
    );

  const AmcPayment =
    mongoose.models.AmcPayment ||
    mongoose.model(
      "AmcPayment",
      new mongoose.Schema({
        receiptNo: { type: String, required: true },
        amcContractId: { type: mongoose.Schema.Types.ObjectId, ref: "AmcContract", required: true },
        amcInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "AmcInvoice", required: true },
        clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
        amount: { type: Number, required: true },
        paymentDate: { type: Date, default: Date.now },
        isDeleted: { type: Boolean, default: false },
      })
    );

  // Pre-create collections and wait for all index builds to finish
  // so background index builds do not hold DDL locks during transactions
  await conn.connection.db.createCollection("amccontracts").catch(() => {});
  await conn.connection.db.createCollection("amcinvoices").catch(() => {});
  await conn.connection.db.createCollection("amcpayments").catch(() => {});
  await AmcContract.init();
  await AmcInvoice.init();
  await AmcPayment.init();

  try {
    // ── TEST 1: Atomic Multi-Document Transaction Commit ─────────────────────
    console.log("--- Test 1: Atomic Multi-Document Transaction Commit ---");

    const client = await Client.create({
      clientCode: `CLI-TX-${Date.now()}`,
      companyName: "Tx Safety Corp",
    });

    const product = await Product.create({
      productCode: `PRD-TX-${Date.now()}`,
      productName: "Tx Analytics Engine",
    });

    const session1 = await mongoose.startSession();
    session1.startTransaction();

    let contractDoc;
    try {
      const createdContracts = await AmcContract.create(
        [
          {
            contractCode: `AMC-TX-COMMIT-01`,
            clientId: client._id,
            clientCode: client.clientCode,
            clientName: client.companyName,
            clientProductId: new mongoose.Types.ObjectId(),
            productId: product._id,
            productCode: product.productCode,
            productName: product.productName,
            startDate: new Date("2026-01-01"),
            expiryDate: new Date("2026-12-31"),
            dueDate: new Date("2026-01-15"),
            taxableAmount: 50000,
            totalAmount: 59000,
            status: "Pending",
            timeline: [
              {
                type: "created",
                title: "Contract Initialized in Transaction",
                performedByName: "Tx Auditor",
              },
            ],
          },
        ],
        { session: session1 }
      );
      contractDoc = createdContracts[0];

      await AmcInvoice.create(
        [
          {
            invoiceCode: "INV-TX-001",
            amcContractId: contractDoc._id,
            clientId: client._id,
            totalAmount: 59000,
            pendingAmount: 59000,
          },
        ],
        { session: session1 }
      );

      await session1.commitTransaction();
    } finally {
      await session1.endSession();
    }

    const verifiedContract = await AmcContract.findById(contractDoc._id);
    const verifiedInvoice = await AmcInvoice.findOne({ amcContractId: contractDoc._id });
    report(verifiedContract != null, "Contract persisted successfully upon transaction commit");
    report(verifiedContract.timeline.length === 1, "Subdocument timeline persisted inside transaction");
    report(verifiedInvoice != null && verifiedInvoice.totalAmount === 59000, "Invoice persisted atomically with contract");

    // ── TEST 2: Multi-Document Transaction Rollback (Zero Dirty Reads) ─────────
    console.log("\n--- Test 2: Multi-Document Transaction Rollback (Zero Dirty Reads) ---");

    const session2 = await mongoose.startSession();
    session2.startTransaction();

    const rollbackCode = `AMC-TX-ROLLBACK-01`;
    try {
      await AmcContract.create(
        [
          {
            contractCode: rollbackCode,
            clientId: client._id,
            clientCode: client.clientCode,
            clientName: client.companyName,
            clientProductId: new mongoose.Types.ObjectId(),
            productId: product._id,
            productCode: product.productCode,
            productName: product.productName,
            startDate: new Date("2026-01-01"),
            expiryDate: new Date("2026-12-31"),
            dueDate: new Date("2026-01-15"),
            taxableAmount: 100000,
            totalAmount: 118000,
          },
        ],
        { session: session2 }
      );

      await AmcInvoice.create(
        [
          {
            invoiceCode: "INV-TX-FAIL-01",
            amcContractId: new mongoose.Types.ObjectId(),
            clientId: client._id,
            totalAmount: 118000,
          },
        ],
        { session: session2 }
      );

      // Force failure and abort
      throw new Error("Simulated downstream financial failure before commit");
    } catch (err) {
      await session2.abortTransaction();
    } finally {
      await session2.endSession();
    }

    const phantomContract = await AmcContract.findOne({ contractCode: rollbackCode });
    const phantomInvoice = await AmcInvoice.findOne({ invoiceCode: "INV-TX-FAIL-01" });
    report(phantomContract === null, "Rolled-back contract left 0 phantom records in amccontracts");
    report(phantomInvoice === null, "Rolled-back invoice left 0 phantom records in amcinvoices");

    // ── TEST 3: Concurrent Optimistic Renewal Locking ─────────────────────────
    console.log("\n--- Test 3: Concurrent Optimistic Renewal Locking ---");

    // Contract has renewalLockAt: null, renewalVersion: 0
    const targetContract = verifiedContract;

    const sessionA = await mongoose.startSession();
    const sessionB = await mongoose.startSession();

    let sessionASuccess = false;
    let sessionBSuccess = false;

    // Both sessions attempt to lock targetContract concurrently
    const lockSessionA = async () => {
      sessionA.startTransaction();
      try {
        const locked = await AmcContract.findOneAndUpdate(
          {
            _id: targetContract._id,
            renewalLockAt: null,
            renewalVersion: 0,
          },
          {
            $set: { renewalLockAt: new Date() },
            $inc: { renewalVersion: 1 },
          },
          { session: sessionA, new: true }
        );
        if (locked) {
          sessionASuccess = true;
          await sessionA.commitTransaction();
        } else {
          await sessionA.abortTransaction();
        }
      } catch (e) {
        await sessionA.abortTransaction();
      } finally {
        await sessionA.endSession();
      }
    };

    const lockSessionB = async () => {
      sessionB.startTransaction();
      try {
        const locked = await AmcContract.findOneAndUpdate(
          {
            _id: targetContract._id,
            renewalLockAt: null,
            renewalVersion: 0,
          },
          {
            $set: { renewalLockAt: new Date() },
            $inc: { renewalVersion: 1 },
          },
          { session: sessionB, new: true }
        );
        if (locked) {
          sessionBSuccess = true;
          await sessionB.commitTransaction();
        } else {
          await sessionB.abortTransaction();
        }
      } catch (e) {
        await sessionB.abortTransaction();
      } finally {
        await sessionB.endSession();
      }
    };

    await Promise.all([lockSessionA(), lockSessionB()]);

    const lockExclusive = (sessionASuccess && !sessionBSuccess) || (!sessionASuccess && sessionBSuccess);
    report(lockExclusive, "Mutual exclusion verified: exactly one session obtained the renewal lock");

    const refreshedLockedContract = await AmcContract.findById(targetContract._id);
    report(refreshedLockedContract.renewalVersion === 1, "renewalVersion incremented exactly once to 1");
    report(refreshedLockedContract.renewalLockAt != null, "renewalLockAt timestamp set");

    // ── TEST 4: Atomic Multi-Document Payment Allocation & Status Transition ──
    console.log("\n--- Test 4: Atomic Multi-Document Payment Allocation & Status Transition ---");

    const session4 = await mongoose.startSession();
    session4.startTransaction();

    try {
      await AmcPayment.create(
        [
          {
            receiptNo: "REC-TX-001",
            amcContractId: targetContract._id,
            amcInvoiceId: verifiedInvoice._id,
            clientId: client._id,
            amount: 59000,
          },
        ],
        { session: session4 }
      );

      await AmcInvoice.updateOne(
        { _id: verifiedInvoice._id },
        {
          $set: {
            paidAmount: 59000,
            pendingAmount: 0,
            paymentStatus: "Paid",
          },
        },
        { session: session4 }
      );

      await AmcContract.updateOne(
        { _id: targetContract._id },
        {
          $set: {
            paidAmount: 59000,
            pendingAmount: 0,
            status: "Paid",
          },
        },
        { session: session4 }
      );

      await session4.commitTransaction();
    } finally {
      await session4.endSession();
    }

    const finalPayment = await AmcPayment.findOne({ receiptNo: "REC-TX-001" });
    const finalInvoice = await AmcInvoice.findById(verifiedInvoice._id);
    const finalContract = await AmcContract.findById(targetContract._id);

    report(finalPayment != null && finalPayment.amount === 59000, "Payment receipt created atomically in transaction");
    report(finalInvoice.paymentStatus === "Paid" && finalInvoice.pendingAmount === 0, "Invoice updated to Paid with 0 pending balance");
    report(finalContract.status === "Paid" && finalContract.pendingAmount === 0, "Contract updated to Paid with 0 pending balance");

  } finally {
    console.log("\n--- Cleanup ---");
    await mongoose.connection.dropDatabase();
    console.log("Dropped isolated replica set test database.");
    await mongoose.disconnect();
    console.log("Disconnected from replica set.");
  }

  console.log(`\n======================================================`);
  console.log(`TOTAL TRANSACTION CHECKS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`======================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runAmcContractReplicaSetTransactions().catch(err => {
  console.error("Fatal transaction error:", err);
  process.exit(1);
});
