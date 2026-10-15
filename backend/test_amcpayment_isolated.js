"use strict";

const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "node_modules");
require("module").Module._initPaths();

const mongoose = require("mongoose");
const fs = require("fs");

const TEST_DB_URI = `mongodb://127.0.0.1:27017/crm_test_amcpayment_${Date.now()}`;

async function runAmcPaymentIsolatedTests() {
  console.log("=== ISOLATED AMCPAYMENT MODEL TEST SUITE ===");
  console.log("Connecting to isolated local test database:", TEST_DB_URI);

  await mongoose.connect(TEST_DB_URI);
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

  // Pre-register referenced models for population
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

  const AmcContract =
    mongoose.models.AmcContract ||
    require("./models/AmcContract");

  const AmcInvoice =
    mongoose.models.AmcInvoice ||
    require("./models/AmcInvoice");

  const AmcPayment = require("./models/AmcPayment");

  try {
    // 1. Exact Source Schema Parity
    const modelSource = fs.readFileSync(path.resolve(__dirname, "models/AmcPayment.js"), "utf8");
    assert(modelSource.includes('collection: "amcpayments"'), "1. Source declares collection 'amcpayments'");
    assert(modelSource.includes('min: 0.01'), "1b. Source declares amount min: 0.01");

    // 2. Model & Collection Identity
    assert(AmcPayment.modelName === "AmcPayment", "2a. Model name is 'AmcPayment'");
    assert(AmcPayment.collection.name === "amcpayments", "2b. Collection name is 'amcpayments'");

    // 3. Required Fields & Validators
    let validationFailed = false;
    try {
      const emptyDoc = new AmcPayment({});
      await emptyDoc.validate();
    } catch (err) {
      validationFailed = true;
      assert(err.errors.paymentCode, "3a. paymentCode is required");
      assert(err.errors.amcContractId, "3b. amcContractId is required");
      assert(err.errors.amcInvoiceId, "3c. amcInvoiceId is required");
      assert(err.errors.contractCode, "3d. contractCode is required");
      assert(err.errors.clientId, "3e. clientId is required");
      assert(err.errors.clientName, "3f. clientName is required");
      assert(err.errors.amount, "3g. amount is required");
      assert(err.errors.paymentDate, "3h. paymentDate is required");
    }
    assert(validationFailed, "3i. Empty document validation rejected as expected");

    // 4. Payment Mode Enums
    const validDocForEnum = new AmcPayment({
      paymentCode: "AMC-PAY-ENUM-TEST",
      amcContractId: new mongoose.Types.ObjectId(),
      amcInvoiceId: new mongoose.Types.ObjectId(),
      contractCode: "CTR-ENUM",
      clientId: new mongoose.Types.ObjectId(),
      clientName: "Enum Client",
      amount: 1000,
      paymentDate: new Date(),
      mode: "CryptoCurrency" // Invalid mode
    });
    let enumFailed = false;
    try {
      await validDocForEnum.validate();
    } catch (err) {
      enumFailed = true;
      assert(err.errors.mode, "4a. Invalid payment mode rejected");
    }
    assert(enumFailed, "4b. Enum validation catches unsupported payment modes");

    // 5. Defaults
    const defaultDoc = new AmcPayment({
      paymentCode: "AMC-PAY-DEF-TEST",
      amcContractId: new mongoose.Types.ObjectId(),
      amcInvoiceId: new mongoose.Types.ObjectId(),
      contractCode: "CTR-DEF",
      clientId: new mongoose.Types.ObjectId(),
      clientName: "Def Client",
      amount: 500,
      paymentDate: new Date()
    });
    assert(defaultDoc.mode === "Bank Transfer", "5a. Default mode is 'Bank Transfer'");
    assert(defaultDoc.invoiceCode === "", "5b. Default invoiceCode is ''");
    assert(defaultDoc.clientCode === "", "5c. Default clientCode is ''");
    assert(defaultDoc.productCode === "", "5d. Default productCode is ''");
    assert(defaultDoc.productName === "", "5e. Default productName is ''");
    assert(defaultDoc.referenceNo === "", "5f. Default referenceNo is ''");
    assert(defaultDoc.notes === "", "5g. Default notes is ''");
    assert(defaultDoc.isDeleted === false, "5h. Default isDeleted is false");

    // 6. Unique Payment Code Enforcement
    await AmcPayment.init();
    const pay1 = await AmcPayment.create({
      paymentCode: "AMC-PAY-2026-UNIQUE-01",
      amcContractId: new mongoose.Types.ObjectId(),
      amcInvoiceId: new mongoose.Types.ObjectId(),
      contractCode: "CTR-UNIQ",
      clientId: new mongoose.Types.ObjectId(),
      clientName: "Uniq Client",
      amount: 1500,
      paymentDate: new Date()
    });
    assert(pay1._id, "6a. Created initial payment document");

    let dupError = null;
    try {
      await AmcPayment.create({
        paymentCode: "AMC-PAY-2026-UNIQUE-01",
        amcContractId: new mongoose.Types.ObjectId(),
        amcInvoiceId: new mongoose.Types.ObjectId(),
        contractCode: "CTR-UNIQ-2",
        clientId: new mongoose.Types.ObjectId(),
        clientName: "Uniq Client 2",
        amount: 2500,
        paymentDate: new Date()
      });
    } catch (err) {
      dupError = err;
    }
    assert(dupError && (dupError.code === 11000 || dupError.message.includes("duplicate")), "6b. Duplicate paymentCode rejected by unique constraint");

    // 7. Index Declarations in DB
    const dbIndexes = await mongoose.connection.db.collection("amcpayments").indexes();
    assert(dbIndexes.some(i => i.name === "paymentCode_1"), "7a. Index paymentCode_1 exists in DB");
    assert(dbIndexes.some(i => i.name === "amcContractId_1_paymentDate_-1"), "7b. Compound index amcContractId_1_paymentDate_-1 exists in DB");

    // 8. Amount Validation
    let zeroAmountError = null;
    try {
      const zeroDoc = new AmcPayment({
        paymentCode: "AMC-PAY-ZERO",
        amcContractId: new mongoose.Types.ObjectId(),
        amcInvoiceId: new mongoose.Types.ObjectId(),
        contractCode: "CTR-ZERO",
        clientId: new mongoose.Types.ObjectId(),
        clientName: "Zero Client",
        amount: 0,
        paymentDate: new Date()
      });
      await zeroDoc.validate();
    } catch (err) {
      zeroAmountError = err;
    }
    assert(zeroAmountError && zeroAmountError.errors.amount, "8. Zero or sub-0.01 amount rejected by validator");

    // 9. Soft Deletion
    const softDelDoc = await AmcPayment.create({
      paymentCode: "AMC-PAY-SOFTDEL",
      amcContractId: new mongoose.Types.ObjectId(),
      amcInvoiceId: new mongoose.Types.ObjectId(),
      contractCode: "CTR-SD",
      clientId: new mongoose.Types.ObjectId(),
      clientName: "SD Client",
      amount: 2000,
      paymentDate: new Date()
    });
    softDelDoc.isDeleted = true;
    await softDelDoc.save();

    const activeList = await AmcPayment.find({ isDeleted: false });
    assert(!activeList.some(p => p.paymentCode === "AMC-PAY-SOFTDEL"), "9. Soft deleted payment excluded from active queries");

    // 10, 11, 12, 13, 14. References Population
    const testUser = await User.create({ name: "Payment Auditor", email: "audit@example.com" });
    const testClient = await Client.create({ clientCode: "CLI-PAYPOP", companyName: "PayPop Ltd", status: "Active" });
    const testProduct = await Product.create({ productCode: "PRD-PAYPOP", productName: "PayPop Solution" });
    const testContract = await AmcContract.create({
      contractCode: "CTR-PAYPOP-001",
      clientId: testClient._id,
      clientCode: testClient.clientCode,
      clientName: testClient.companyName,
      clientProductId: new mongoose.Types.ObjectId(),
      productId: testProduct._id,
      productCode: testProduct.productCode,
      productName: testProduct.productName,
      startDate: new Date("2026-08-01"),
      expiryDate: new Date("2027-08-01"),
      dueDate: new Date("2026-08-15"),
      taxableAmount: 10000,
      totalAmount: 11800
    });
    const testInvoice = await AmcInvoice.create({
      invoiceCode: "AMC-INV-PAYPOP-001",
      amcContractId: testContract._id,
      contractCode: testContract.contractCode,
      contractStartDate: testContract.startDate,
      contractExpiryDate: testContract.expiryDate,
      dueDate: testContract.dueDate,
      clientId: testClient._id,
      clientCode: testClient.clientCode,
      clientName: testClient.companyName,
      productId: testProduct._id,
      productCode: testProduct.productCode,
      productName: testProduct.productName,
      taxableAmount: 10000,
      totalAmount: 11800,
      invoiceDate: new Date()
    });

    const populatedPayment = await AmcPayment.create({
      paymentCode: "AMC-PAY-POPULATED",
      amcContractId: testContract._id,
      amcInvoiceId: testInvoice._id,
      contractCode: testContract.contractCode,
      invoiceCode: testInvoice.invoiceCode,
      clientId: testClient._id,
      clientCode: testClient.clientCode,
      clientName: testClient.companyName,
      productId: testProduct._id,
      productCode: testProduct.productCode,
      productName: testProduct.productName,
      amount: 5900,
      paymentDate: new Date(),
      mode: "UPI",
      referenceNo: "UPI/12345/TXN",
      receivedBy: testUser._id,
      receivedByName: testUser.name
    });

    const populated = await AmcPayment.findById(populatedPayment._id)
      .populate("amcContractId", "contractCode status")
      .populate("amcInvoiceId", "invoiceCode totalAmount paymentStatus")
      .populate("clientId", "companyName clientCode")
      .populate("productId", "productName productCode")
      .populate("receivedBy", "name email");

    assert(populated.amcContractId && populated.amcContractId.contractCode === "CTR-PAYPOP-001", "10. amcContractId populated successfully");
    assert(populated.amcInvoiceId && populated.amcInvoiceId.invoiceCode === "AMC-INV-PAYPOP-001", "11. amcInvoiceId populated successfully");
    assert(populated.clientId && populated.clientId.clientCode === "CLI-PAYPOP", "12. clientId populated successfully");
    assert(populated.productId && populated.productId.productCode === "PRD-PAYPOP", "13. productId populated successfully");
    assert(populated.receivedBy && populated.receivedBy.email === "audit@example.com", "14. receivedBy user populated successfully");

    // 15. Aggregation Compatibility (Payment sum per invoice)
    await AmcPayment.create({
      paymentCode: "AMC-PAY-POPULATED-2",
      amcContractId: testContract._id,
      amcInvoiceId: testInvoice._id,
      contractCode: testContract.contractCode,
      invoiceCode: testInvoice.invoiceCode,
      clientId: testClient._id,
      clientName: testClient.companyName,
      amount: 5900,
      paymentDate: new Date()
    });

    const aggTotals = await AmcPayment.aggregate([
      { $match: { amcInvoiceId: testInvoice._id, isDeleted: false } },
      { $group: { _id: "$amcInvoiceId", totalPaid: { $sum: "$amount" }, count: { $sum: 1 } } }
    ]);
    assert(aggTotals.length === 1 && aggTotals[0].totalPaid === 11800 && aggTotals[0].count === 2, "15. Payment aggregation matches expected invoice total ₹11,800 across 2 payments");

    // 16. Historical Raw Document Hydration
    const rawHistoricalData = {
      _id: new mongoose.Types.ObjectId(),
      paymentCode: "AMC-PAY-2024-HIST-999",
      idempotencyKey: null,
      amcContractId: testContract._id,
      amcInvoiceId: testInvoice._id,
      contractCode: "CTR-PAYPOP-001",
      invoiceCode: "AMC-INV-PAYPOP-001",
      clientId: testClient._id,
      clientCode: testClient.clientCode,
      clientName: testClient.companyName,
      productId: testProduct._id,
      productCode: testProduct.productCode,
      productName: testProduct.productName,
      amount: 2500,
      paymentDate: new Date("2024-05-10"),
      mode: "Bank Transfer",
      referenceNo: "NEFT-789012",
      notes: "Historical payment record",
      receivedBy: testUser._id,
      receivedByName: "Admin",
      isDeleted: false,
      createdAt: new Date("2024-05-10"),
      updatedAt: new Date("2024-05-10")
    };
    await mongoose.connection.db.collection("amcpayments").insertOne(rawHistoricalData);
    const hydrated = await AmcPayment.findById(rawHistoricalData._id);
    assert(hydrated && hydrated.paymentCode === "AMC-PAY-2024-HIST-999" && hydrated.amount === 2500, "16. Historical Atlas document hydrated cleanly with AmcPayment model");

    // 17. Import-Order Independence & Singleton Registration
    assert(typeof require("./models/AmcPayment") === "function", "17a. Import-order independence verified");
    assert(mongoose.models.AmcPayment === AmcPayment, "17b. mongoose.models.AmcPayment matches singleton");

  } finally {
    console.log("\n--- Cleanup ---");
    await mongoose.connection.dropDatabase();
    console.log("Dropped isolated test database successfully.");
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }

  console.log(`\nIsolated AmcPayment Test Suite Finished: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runAmcPaymentIsolatedTests().catch(err => {
  console.error("Fatal error in isolated test suite:", err);
  process.exit(1);
});

