"use strict";

const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "node_modules");
require("module").Module._initPaths();

const mongoose = require("mongoose");

const TEST_DB_URI = `mongodb://127.0.0.1:27017/crm_test_productsalepayment_${Date.now()}`;

async function runProductSalePaymentIsolatedTests() {
  console.log("=== ISOLATED PRODUCTSALEPAYMENT MODEL TEST SUITE ===");
  console.log("Connecting to isolated local test database:", TEST_DB_URI);

  const conn = await mongoose.connect(TEST_DB_URI);
  console.log("Connected to isolated test database successfully.\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      passed++;
      console.log(`  ✓ ${message}`);
    } else {
      failed++;
      console.error(`  ✗ FAIL: ${message}`);
    }
  }

  // Pre-register referenced models for population tests if not already registered
  const User =
    mongoose.models.User ||
    mongoose.model(
      "User",
      new mongoose.Schema({
        name: { type: String, default: "Test Admin" },
        email: { type: String, default: "admin@example.com" },
        role: { type: String, default: "admin" },
      })
    );

  const Product =
    mongoose.models.Product ||
    require("./models/Product");

  const Client =
    mongoose.models.Client ||
    require("./models/Client");

  const ProductSale =
    mongoose.models.ProductSale ||
    require("./models/ProductSale");

  const ProductSalePayment = require("./models/ProductSalePayment");

  try {
    // ── GROUP 1: Identity & Collection Setup ─────────────────────────────────
    console.log("--- Group 1: Identity & Collection Setup ---");
    assert(ProductSalePayment.modelName === "ProductSalePayment", "Model name is ProductSalePayment");
    assert(ProductSalePayment.collection.name === "productsalepayments", "Physical collection is 'productsalepayments'");

    // Build indexes in the test database
    await ProductSalePayment.createIndexes();
    const liveIndexes = await ProductSalePayment.collection.indexes();
    const hasUniquePaymentCode = liveIndexes.some(idx => idx.key && idx.key.paymentCode === 1 && idx.unique === true);
    const hasCompoundIndex = liveIndexes.some(idx => idx.key && idx.key.productSaleId === 1 && idx.key.paymentDate === -1);
    const hasIdempIndex = liveIndexes.some(idx => idx.key && idx.key.idempotencyKey === 1 && idx.sparse === true);
    assert(hasUniquePaymentCode, "Unique index on paymentCode created on collection");
    assert(hasCompoundIndex, "Compound index { productSaleId: 1, paymentDate: -1 } created on collection");
    assert(hasIdempIndex, "Sparse index on idempotencyKey created on collection");

    // ── GROUP 2: Validation Rules ───────────────────────────────────────────
    console.log("\n--- Group 2: Validation Rules ---");

    // 2.1 Missing required paymentCode
    let err1 = null;
    try {
      await ProductSalePayment.create({
        paymentNumber: 1,
        productSaleId: new mongoose.Types.ObjectId(),
        saleCode: "SAL-001",
        clientId: new mongoose.Types.ObjectId(),
        clientCode: "CLI-001",
        clientName: "Acme Corp",
        amount: 5000,
      });
    } catch (err) {
      err1 = err;
    }
    assert(err1 && err1.errors && err1.errors.paymentCode, "paymentCode is required");

    // 2.2 Missing required paymentNumber
    let err2 = null;
    try {
      await ProductSalePayment.create({
        paymentCode: "PSP-2026-0001",
        productSaleId: new mongoose.Types.ObjectId(),
        saleCode: "SAL-001",
        clientId: new mongoose.Types.ObjectId(),
        clientCode: "CLI-001",
        clientName: "Acme Corp",
        amount: 5000,
      });
    } catch (err) {
      err2 = err;
    }
    assert(err2 && err2.errors && err2.errors.paymentNumber, "paymentNumber is required");

    // 2.3 Invalid paymentNumber (< 1)
    let err3 = null;
    try {
      await ProductSalePayment.create({
        paymentCode: "PSP-2026-0001",
        paymentNumber: 0,
        productSaleId: new mongoose.Types.ObjectId(),
        saleCode: "SAL-001",
        clientId: new mongoose.Types.ObjectId(),
        clientCode: "CLI-001",
        clientName: "Acme Corp",
        amount: 5000,
      });
    } catch (err) {
      err3 = err;
    }
    assert(err3 && err3.errors && err3.errors.paymentNumber, "paymentNumber must be >= 1");

    // 2.4 Missing required productSaleId
    let err4 = null;
    try {
      await ProductSalePayment.create({
        paymentCode: "PSP-2026-0001",
        paymentNumber: 1,
        saleCode: "SAL-001",
        clientId: new mongoose.Types.ObjectId(),
        clientCode: "CLI-001",
        clientName: "Acme Corp",
        amount: 5000,
      });
    } catch (err) {
      err4 = err;
    }
    assert(err4 && err4.errors && err4.errors.productSaleId, "productSaleId is required");

    // 2.5 Missing required saleCode
    let err5 = null;
    try {
      await ProductSalePayment.create({
        paymentCode: "PSP-2026-0001",
        paymentNumber: 1,
        productSaleId: new mongoose.Types.ObjectId(),
        clientId: new mongoose.Types.ObjectId(),
        clientCode: "CLI-001",
        clientName: "Acme Corp",
        amount: 5000,
      });
    } catch (err) {
      err5 = err;
    }
    assert(err5 && err5.errors && err5.errors.saleCode, "saleCode is required");

    // 2.6 Missing required clientId
    let err6 = null;
    try {
      await ProductSalePayment.create({
        paymentCode: "PSP-2026-0001",
        paymentNumber: 1,
        productSaleId: new mongoose.Types.ObjectId(),
        saleCode: "SAL-001",
        clientCode: "CLI-001",
        clientName: "Acme Corp",
        amount: 5000,
      });
    } catch (err) {
      err6 = err;
    }
    assert(err6 && err6.errors && err6.errors.clientId, "clientId is required");

    // 2.7 Missing required clientCode
    let err7 = null;
    try {
      await ProductSalePayment.create({
        paymentCode: "PSP-2026-0001",
        paymentNumber: 1,
        productSaleId: new mongoose.Types.ObjectId(),
        saleCode: "SAL-001",
        clientId: new mongoose.Types.ObjectId(),
        clientName: "Acme Corp",
        amount: 5000,
      });
    } catch (err) {
      err7 = err;
    }
    assert(err7 && err7.errors && err7.errors.clientCode, "clientCode is required");

    // 2.8 Missing required clientName
    let err8 = null;
    try {
      await ProductSalePayment.create({
        paymentCode: "PSP-2026-0001",
        paymentNumber: 1,
        productSaleId: new mongoose.Types.ObjectId(),
        saleCode: "SAL-001",
        clientId: new mongoose.Types.ObjectId(),
        clientCode: "CLI-001",
        amount: 5000,
      });
    } catch (err) {
      err8 = err;
    }
    assert(err8 && err8.errors && err8.errors.clientName, "clientName is required");

    // 2.9 Missing required amount
    let err9 = null;
    try {
      await ProductSalePayment.create({
        paymentCode: "PSP-2026-0001",
        paymentNumber: 1,
        productSaleId: new mongoose.Types.ObjectId(),
        saleCode: "SAL-001",
        clientId: new mongoose.Types.ObjectId(),
        clientCode: "CLI-001",
        clientName: "Acme Corp",
      });
    } catch (err) {
      err9 = err;
    }
    assert(err9 && err9.errors && err9.errors.amount, "amount is required");

    // 2.10 Invalid amount (< 0.01)
    let err10 = null;
    try {
      await ProductSalePayment.create({
        paymentCode: "PSP-2026-0001",
        paymentNumber: 1,
        productSaleId: new mongoose.Types.ObjectId(),
        saleCode: "SAL-001",
        clientId: new mongoose.Types.ObjectId(),
        clientCode: "CLI-001",
        clientName: "Acme Corp",
        amount: 0,
      });
    } catch (err) {
      err10 = err;
    }
    assert(err10 && err10.errors && err10.errors.amount, "amount must be >= 0.01");

    // 2.11 Invalid mode enum
    let err11 = null;
    try {
      await ProductSalePayment.create({
        paymentCode: "PSP-2026-0001",
        paymentNumber: 1,
        productSaleId: new mongoose.Types.ObjectId(),
        saleCode: "SAL-001",
        clientId: new mongoose.Types.ObjectId(),
        clientCode: "CLI-001",
        clientName: "Acme Corp",
        amount: 5000,
        mode: "Cryptocurrency",
      });
    } catch (err) {
      err11 = err;
    }
    assert(err11 && err11.errors && err11.errors.mode, "invalid mode enum rejected");

    // ── GROUP 3: Defaults & Valid Insertion ──────────────────────────────────
    console.log("\n--- Group 3: Defaults & Valid Insertion ---");

    const validDoc = await ProductSalePayment.create({
      paymentCode: "psp-2026-0001", // test lowercase trim / uppercase transform
      paymentNumber: 1,
      productSaleId: new mongoose.Types.ObjectId(),
      saleCode: "sal-2026-0001",
      clientId: new mongoose.Types.ObjectId(),
      clientCode: "cli-001",
      clientName: "  Acme Corp  ",
      amount: 15000.50,
    });

    assert(validDoc.paymentCode === "PSP-2026-0001", "paymentCode trimmed and uppercased");
    assert(validDoc.saleCode === "SAL-2026-0001", "saleCode trimmed and uppercased");
    assert(validDoc.clientCode === "CLI-001", "clientCode trimmed and uppercased");
    assert(validDoc.clientName === "Acme Corp", "clientName trimmed");
    assert(validDoc.mode === "Bank Transfer", "Default mode is 'Bank Transfer'");
    assert(validDoc.referenceNo === "", "Default referenceNo is empty string");
    assert(validDoc.notes === "", "Default notes is empty string");
    assert(validDoc.createdBy === null, "Default createdBy is null");
    assert(validDoc.createdByName === "", "Default createdByName is empty string");
    assert(validDoc.isDeleted === false, "Default isDeleted is false");
    assert(validDoc.deletedAt === null, "Default deletedAt is null");
    assert(validDoc.idempotencyKey === null, "Default idempotencyKey is null");
    assert(validDoc.paymentDate instanceof Date, "paymentDate defaulted to a valid Date");
    assert(validDoc.createdAt instanceof Date, "createdAt timestamp set");
    assert(validDoc.updatedAt instanceof Date, "updatedAt timestamp set");

    // ── GROUP 4: Unique & Index Constraints ─────────────────────────────────
    console.log("\n--- Group 4: Unique & Index Constraints ---");

    // 4.1 Duplicate paymentCode rejected
    let dupErr = null;
    try {
      await ProductSalePayment.create({
        paymentCode: "PSP-2026-0001",
        paymentNumber: 2,
        productSaleId: new mongoose.Types.ObjectId(),
        saleCode: "SAL-2026-0002",
        clientId: new mongoose.Types.ObjectId(),
        clientCode: "CLI-001",
        clientName: "Acme Corp",
        amount: 25000,
      });
    } catch (err) {
      dupErr = err;
    }
    assert(dupErr && dupErr.code === 11000, "Duplicate paymentCode rejected by unique index (E11000)");

    // 4.2 Multiple null idempotencyKeys allowed (sparse index)
    const secondNullIdempDoc = await ProductSalePayment.create({
      paymentCode: "PSP-2026-0002",
      paymentNumber: 2,
      productSaleId: new mongoose.Types.ObjectId(),
      saleCode: "SAL-2026-0002",
      clientId: new mongoose.Types.ObjectId(),
      clientCode: "CLI-001",
      clientName: "Acme Corp",
      amount: 10000,
      idempotencyKey: null,
    });
    assert(secondNullIdempDoc._id, "Second document with null idempotencyKey created successfully (sparse index)");

    // ── GROUP 5: Querying, Sorting & Reference Population ────────────────────
    console.log("\n--- Group 5: Querying, Sorting & Reference Population ---");

    // Create synthetic Client and ProductSale documents to test population
    const testClient = await Client.create({
      clientCode: "CLI-POP-001",
      companyName: "Population Test Corp",
      contactPerson: "Jane Pop",
      email: "jane@poptst.org",
      phone: "+919988776655",
      state: "Maharashtra",
      stateCode: "27",
    });

    const testSale = await ProductSale.create({
      saleCode: "SAL-POP-001",
      saleNumber: 100,
      clientId: testClient._id,
      clientCode: testClient.clientCode,
      clientName: testClient.companyName,
      items: [{
        productId: new mongoose.Types.ObjectId(),
        productCode: "PROD-POP-1",
        productName: "Pop Software",
      }],
      totalAmount: 50000,
      pendingAmount: 30000,
      paidAmount: 20000,
    });

    const populatedPayment = await ProductSalePayment.create({
      paymentCode: "PSP-POP-001",
      paymentNumber: 100,
      productSaleId: testSale._id,
      saleCode: testSale.saleCode,
      clientId: testClient._id,
      clientCode: testClient.clientCode,
      clientName: testClient.companyName,
      amount: 20000,
      mode: "UPI",
      referenceNo: "UPI-POP-1234",
    });

    const fetched = await ProductSalePayment.findById(populatedPayment._id)
      .populate("productSaleId")
      .populate("clientId");

    assert(fetched.productSaleId && fetched.productSaleId.saleCode === "SAL-POP-001", "Populated productSaleId matches saleCode");
    assert(fetched.clientId && fetched.clientId.companyName === "Population Test Corp", "Populated clientId matches companyName");

    // Sorting by paymentDate descending
    const allPayments = await ProductSalePayment.find({ isDeleted: { $ne: true } })
      .sort({ paymentDate: -1, paymentNumber: -1 });
    assert(allPayments.length >= 3, "Query with { isDeleted: { $ne: true } } returned active records");

  } finally {
    console.log("\n--- Cleanup ---");
    try {
      await conn.connection.dropDatabase();
      console.log("Dropped test database successfully.");
      await mongoose.disconnect();
      console.log("Disconnected from isolated test database.");
    } catch (e) {
      console.error("Cleanup error:", e);
    }
  }

  console.log(`\n======================================================`);
  console.log(`TOTAL CHECKS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runProductSalePaymentIsolatedTests().catch(err => {
  console.error("Isolated test execution failed:", err);
  process.exit(1);
});
