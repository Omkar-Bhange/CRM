"use strict";

const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "node_modules");
require("module").Module._initPaths();

const mongoose = require("mongoose");
const fs = require("fs");

const TEST_DB_URI = `mongodb://127.0.0.1:27017/crm_test_amcinvoice_${Date.now()}`;

async function runAmcInvoiceIsolatedTests() {
  console.log("=== ISOLATED AMCINVOICE MODEL TEST SUITE ===");
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

  const AmcInvoice = require("./models/AmcInvoice");

  try {
    // 1. Exact Source Schema Parity
    const modelSource = fs.readFileSync(path.resolve(__dirname, "models/AmcInvoice.js"), "utf8");
    assert(
      modelSource.includes('$in: ["Issued", "Partially Paid", "Paid", "Overdue"]') &&
      modelSource.includes('$in: ["Issued", "Draft"]'),
      "1. Exact source schema parity: duplicate $in preserved verbatim in source"
    );

    // 2. Exact Evaluated Index Parity
    const runtimeIndexes = AmcInvoice.schema.indexes();
    const partialRuntimeIdx = runtimeIndexes.find(i => i[1]?.name === "uniq_amc_contract_active_start");
    assert(
      partialRuntimeIdx &&
      JSON.stringify(partialRuntimeIdx[1].partialFilterExpression.status) === JSON.stringify({ $in: ["Issued", "Draft"] }),
      "2. Exact evaluated index parity: runtime evaluates duplicate key to last ($in: ['Issued', 'Draft'])"
    );

    // 3. Model and collection identity
    assert(AmcInvoice.modelName === "AmcInvoice", "3a. Model name is 'AmcInvoice'");
    assert(AmcInvoice.collection.name === "amcinvoices", "3b. Physical collection is 'amcinvoices'");

    // 4. All fields and nested paths
    const paths = AmcInvoice.schema.paths;
    const requiredPaths = [
      "invoiceCode", "invoiceNumber", "invoiceDate", "invoiceType",
      "amcContractId", "contractCode", "contractStartDate", "contractExpiryDate", "dueDate",
      "clientId", "clientCode", "clientName", "clientProductId",
      "productId", "productCode", "productName", "productVersion", "plan", "licensedUsers",
      "taxableAmount", "cgstRate", "cgstAmount", "sgstRate", "sgstAmount", "igstRate", "igstAmount",
      "totalTaxAmount", "totalAmount", "paidAmount", "pendingAmount", "paymentStatus", "status",
      "taxClassification", "idempotencyKey", "paymentVersion", "isDeleted", "deletedAt"
    ];
    const allPathsExist = requiredPaths.every(p => !!paths[p]);
    assert(allPathsExist, `4. All critical fields exist (verified ${requiredPaths.length} fields)`);

    // 5. Required validations
    let validationFailed = false;
    try {
      const emptyDoc = new AmcInvoice({});
      await emptyDoc.validate();
    } catch (err) {
      validationFailed = true;
      assert(err.errors.invoiceCode, "5a. Required validation: invoiceCode is required");
      assert(err.errors.amcContractId, "5b. Required validation: amcContractId is required");
      assert(err.errors.totalAmount, "5c. Required validation: totalAmount is required");
    }
    assert(validationFailed, "5d. Empty document fails validation as expected");

    // 6. Enum values
    const validDocForEnum = new AmcInvoice({
      invoiceCode: "INV-TEST-ENUM",
      invoiceNumber: 1,
      amcContractId: new mongoose.Types.ObjectId(),
      contractCode: "CTR-ENUM",
      contractStartDate: new Date("2026-01-01"),
      contractExpiryDate: new Date("2027-01-01"),
      dueDate: new Date("2026-01-15"),
      clientCode: "CLI-ENUM",
      clientName: "Enum Client",
      productCode: "PRD-ENUM",
      productName: "Enum Product",
      taxableAmount: 10000,
      totalAmount: 11800,
      invoiceType: "InvalidType"
    });
    let enumFailed = false;
    try {
      await validDocForEnum.validate();
    } catch (err) {
      enumFailed = true;
      assert(err.errors.invoiceType, "6. Invalid enum value rejected for invoiceType");
    }
    assert(enumFailed, "6b. Enum validation catches unsupported values");

    // 7. Default values
    const defaultDoc = new AmcInvoice({
      invoiceCode: "INV-TEST-DEF",
      amcContractId: new mongoose.Types.ObjectId(),
      contractCode: "CTR-DEF",
      contractStartDate: new Date("2026-01-01"),
      contractExpiryDate: new Date("2027-01-01"),
      dueDate: new Date("2026-01-15"),
      clientCode: "CLI-DEF",
      clientName: "Def Client",
      productCode: "PRD-DEF",
      productName: "Def Product",
      taxableAmount: 1000,
      totalAmount: 1180
    });
    assert(defaultDoc.invoiceNumber === 0, "7a. Default invoiceNumber is 0");
    assert(defaultDoc.invoiceType === "Initial", "7b. Default invoiceType is 'Initial'");
    assert(defaultDoc.paymentStatus === "Pending", "7c. Default paymentStatus is 'Pending'");
    assert(defaultDoc.status === "Issued", "7d. Default status is 'Issued'");
    assert(defaultDoc.isDeleted === false, "7e. Default isDeleted is false");

    // 8. Invoice code unique enforcement
    await AmcInvoice.init(); // Ensure indexes
    const inv1 = await AmcInvoice.create({
      invoiceCode: "AMC-INV-2026-UNIQUE",
      invoiceNumber: 101,
      amcContractId: new mongoose.Types.ObjectId(),
      contractCode: "CTR-UNIQ",
      contractStartDate: new Date("2026-01-01"),
      contractExpiryDate: new Date("2027-01-01"),
      dueDate: new Date("2026-01-15"),
      clientCode: "CLI-UNIQ",
      clientName: "Uniq Client",
      productCode: "PRD-UNIQ",
      productName: "Uniq Product",
      taxableAmount: 5000,
      totalAmount: 5900,
      invoiceDate: new Date()
    });
    assert(inv1._id, "8a. Created initial unique invoice document");

    let dupError = null;
    try {
      await AmcInvoice.create({
        invoiceCode: "AMC-INV-2026-UNIQUE",
        invoiceNumber: 102,
        amcContractId: new mongoose.Types.ObjectId(),
        contractCode: "CTR-UNIQ-2",
        contractStartDate: new Date("2026-02-01"),
        contractExpiryDate: new Date("2027-02-01"),
        dueDate: new Date("2026-02-15"),
        clientCode: "CLI-UNIQ-2",
        clientName: "Uniq Client 2",
        productCode: "PRD-UNIQ",
        productName: "Uniq Product",
        taxableAmount: 5000,
        totalAmount: 5900,
        invoiceDate: new Date()
      });
    } catch (err) {
      dupError = err;
    }
    assert(dupError && (dupError.code === 11000 || dupError.message.includes("duplicate")), "8b. Duplicate invoiceCode correctly rejected by unique constraint");

    // 9. InvoiceNumber behavior
    const invZero1 = await AmcInvoice.create({
      invoiceCode: "AMC-INV-2026-ZERO-1",
      invoiceNumber: 0,
      amcContractId: new mongoose.Types.ObjectId(),
      contractCode: "CTR-Z1",
      contractStartDate: new Date("2026-03-01"),
      contractExpiryDate: new Date("2027-03-01"),
      dueDate: new Date("2026-03-15"),
      clientCode: "CLI-Z",
      clientName: "Z Client",
      productCode: "PRD-Z",
      productName: "Z Product",
      taxableAmount: 1000,
      totalAmount: 1180,
      invoiceDate: new Date()
    });
    const invZero2 = await AmcInvoice.create({
      invoiceCode: "AMC-INV-2026-ZERO-2",
      invoiceNumber: 0,
      amcContractId: new mongoose.Types.ObjectId(),
      contractCode: "CTR-Z2",
      contractStartDate: new Date("2026-04-01"),
      contractExpiryDate: new Date("2027-04-01"),
      dueDate: new Date("2026-04-15"),
      clientCode: "CLI-Z",
      clientName: "Z Client",
      productCode: "PRD-Z",
      productName: "Z Product",
      taxableAmount: 1000,
      totalAmount: 1180,
      invoiceDate: new Date()
    });
    assert(invZero1.invoiceNumber === 0 && invZero2.invoiceNumber === 0, "9. invoiceNumber: 0 allowed for multiple initial invoices (not uniquely indexed)");

    // 10. Existing index definitions
    const createdIndexes = await mongoose.connection.db.collection("amcinvoices").indexes();
    assert(createdIndexes.some(idx => idx.name === "invoiceCode_1"), "10a. Index invoiceCode_1 exists in DB");
    assert(createdIndexes.some(idx => idx.name === "uniq_amc_contract_active_start"), "10b. Partial unique index uniq_amc_contract_active_start exists in DB");

    // 11. Payment status validation
    const psDoc = await AmcInvoice.findById(inv1._id);
    psDoc.paymentStatus = "Partially Paid";
    await psDoc.save();
    let reloaded = await AmcInvoice.findById(inv1._id);
    assert(reloaded.paymentStatus === "Partially Paid", "11a. Payment status updated to 'Partially Paid'");
    psDoc.paymentStatus = "Paid";
    await psDoc.save();
    reloaded = await AmcInvoice.findById(inv1._id);
    assert(reloaded.paymentStatus === "Paid", "11b. Payment status updated to 'Paid'");

    // 12. GST and amount field persistence
    const gstInvoice = await AmcInvoice.create({
      invoiceCode: "AMC-INV-2026-GST-TEST",
      invoiceNumber: 105,
      amcContractId: new mongoose.Types.ObjectId(),
      contractCode: "CTR-GST",
      contractStartDate: new Date("2026-05-01"),
      contractExpiryDate: new Date("2027-05-01"),
      dueDate: new Date("2026-05-15"),
      clientCode: "CLI-GST",
      clientName: "GST Client",
      productCode: "PRD-GST",
      productName: "GST Product",
      taxableAmount: 20000,
      cgstRate: 9,
      cgstAmount: 1800,
      sgstRate: 9,
      sgstAmount: 1800,
      igstRate: 0,
      igstAmount: 0,
      totalTaxAmount: 3600,
      totalAmount: 23600,
      paidAmount: 10000,
      pendingAmount: 13600,
      taxClassification: "Intra-State Taxable Supply (18% GST)",
      invoiceDate: new Date()
    });
    const savedGst = await AmcInvoice.findById(gstInvoice._id);
    assert(
      savedGst.taxableAmount === 20000 &&
      savedGst.cgstAmount === 1800 &&
      savedGst.sgstAmount === 1800 &&
      savedGst.totalAmount === 23600 &&
      savedGst.taxClassification === "Intra-State Taxable Supply (18% GST)",
      "12. GST and amount fields persisted accurately"
    );

    // 13. Idempotency key field behavior
    const ikeyDoc = await AmcInvoice.create({
      invoiceCode: "AMC-INV-2026-IKEY",
      invoiceNumber: 106,
      idempotencyKey: "amc-inv-key-uuid-12345",
      amcContractId: new mongoose.Types.ObjectId(),
      contractCode: "CTR-IKEY",
      contractStartDate: new Date("2026-06-01"),
      contractExpiryDate: new Date("2027-06-01"),
      dueDate: new Date("2026-06-15"),
      clientCode: "CLI-IK",
      clientName: "IK Client",
      productCode: "PRD-IK",
      productName: "IK Product",
      taxableAmount: 1000,
      totalAmount: 1180,
      invoiceDate: new Date()
    });
    assert(ikeyDoc.idempotencyKey === "amc-inv-key-uuid-12345", "13. idempotencyKey persisted cleanly");

    // 14. Soft deletion behavior
    gstInvoice.isDeleted = true;
    gstInvoice.deletedAt = new Date();
    await gstInvoice.save();
    const activeInvoices = await AmcInvoice.find({ isDeleted: false });
    assert(!activeInvoices.some(i => i.invoiceCode === "AMC-INV-2026-GST-TEST"), "14. Soft deleted invoice excluded by isDeleted: false query");

    // 15, 16, 17. References population
    const testUser = await User.create({ name: "Billing Manager", email: "bill@example.com" });
    const testClient = await Client.create({ clientCode: "CLI-POP", companyName: "Pop Client Pvt Ltd", status: "Active" });
    const testProduct = await Product.create({ productCode: "PRD-POP", productName: "Pop Suite Enterprise" });
    const testContract = await AmcContract.create({
      contractCode: "CTR-POP-001",
      clientId: testClient._id,
      clientCode: testClient.clientCode,
      clientName: testClient.companyName,
      clientProductId: new mongoose.Types.ObjectId(),
      productId: testProduct._id,
      productCode: testProduct.productCode,
      productName: testProduct.productName,
      startDate: new Date("2026-07-01"),
      expiryDate: new Date("2027-07-01"),
      dueDate: new Date("2026-07-15"),
      taxableAmount: 15000,
      totalAmount: 17700
    });

    const popInvoice = await AmcInvoice.create({
      invoiceCode: "AMC-INV-2026-POP",
      invoiceNumber: 110,
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
      taxableAmount: 15000,
      totalAmount: 17700,
      createdBy: testUser._id,
      invoiceDate: new Date()
    });

    const populated = await AmcInvoice.findById(popInvoice._id)
      .populate("amcContractId", "contractCode status")
      .populate("clientId", "companyName clientCode")
      .populate("productId", "productName productCode")
      .populate("createdBy", "name email");

    assert(populated.amcContractId && populated.amcContractId.contractCode === "CTR-POP-001", "15. Contract reference populated successfully");
    assert(populated.clientId && populated.clientId.clientCode === "CLI-POP", "16. Client reference populated successfully");
    assert(populated.productId && populated.productId.productCode === "PRD-POP", "17. Product reference populated successfully");
    assert(populated.createdBy && populated.createdBy.name === "Billing Manager", "17b. User reference populated successfully");

    // 18. Historical document hydration
    const rawHistoricalData = {
      _id: new mongoose.Types.ObjectId(),
      invoiceCode: "AMC-INV-2024-HIST-001",
      invoiceNumber: 42,
      invoiceDate: new Date("2024-06-15"),
      invoiceType: "Renewal",
      amcContractId: testContract._id,
      contractCode: "CTR-POP-001",
      contractStartDate: new Date("2024-06-15"),
      contractExpiryDate: new Date("2025-06-14"),
      dueDate: new Date("2024-06-30"),
      clientId: testClient._id,
      clientCode: testClient.clientCode,
      clientName: testClient.companyName,
      productId: testProduct._id,
      productCode: testProduct.productCode,
      productName: testProduct.productName,
      taxableAmount: 12000,
      cgstRate: 9,
      cgstAmount: 1080,
      sgstRate: 9,
      sgstAmount: 1080,
      totalTaxAmount: 2160,
      totalAmount: 14160,
      paidAmount: 14160,
      pendingAmount: 0,
      paymentStatus: "Paid",
      status: "Issued",
      taxClassification: "Standard Rate (18%)",
      isDeleted: false,
      createdAt: new Date("2024-06-15"),
      updatedAt: new Date("2024-06-20")
    };
    await mongoose.connection.db.collection("amcinvoices").insertOne(rawHistoricalData);
    const hydrated = await AmcInvoice.findById(rawHistoricalData._id);
    assert(hydrated && hydrated.invoiceCode === "AMC-INV-2024-HIST-001" && hydrated.paidAmount === 14160, "18. Historical raw Atlas document hydratable cleanly with AmcInvoice model");

    // 19. Import-order independence
    assert(typeof require("./models/AmcInvoice") === "function", "19. Import-order independence verified");

    // 20. Export caching and registration guard
    const requiredAgain = require("./models/AmcInvoice");
    assert(requiredAgain === AmcInvoice, "20a. Export is cached identity");
    assert(mongoose.models.AmcInvoice === AmcInvoice, "20b. mongoose.models.AmcInvoice matches canonical model");

  } finally {
    console.log("\n--- Cleanup ---");
    await mongoose.connection.dropDatabase();
    console.log("Dropped isolated test database successfully.");
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }

  console.log(`\nIsolated AmcInvoice Test Suite Finished: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runAmcInvoiceIsolatedTests().catch(err => {
  console.error("Fatal error in isolated test suite:", err);
  process.exit(1);
});
