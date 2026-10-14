"use strict";

const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "node_modules");
require("module").Module._initPaths();

const mongoose = require("mongoose");

const TEST_DB_URI = `mongodb://127.0.0.1:27017/crm_test_amccontract_${Date.now()}`;

async function runAmcContractIsolatedTests() {
  console.log("=== ISOLATED AMCCONTRACT MODEL TEST SUITE ===");
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

  const Employee =
    mongoose.models.Employee ||
    mongoose.model(
      "Employee",
      new mongoose.Schema({
        name: { type: String, default: "Support Tech" },
        employeeCode: { type: String, default: "EMP-001" },
        email: { type: String, default: "tech@example.com" },
      })
    );

  const Product =
    mongoose.models.Product ||
    require("./models/Product");

  const Client =
    mongoose.models.Client ||
    require("./models/Client");

  const AmcInvoice =
    mongoose.models.AmcInvoice ||
    mongoose.model(
      "AmcInvoice",
      new mongoose.Schema({
        invoiceCode: { type: String, default: "INV-2026-001" },
        totalAmount: { type: Number, default: 11800 },
      })
    );

  const AmcContract = require("./models/AmcContract");

  try {
    // ── GROUP 1: Identity & Collection Setup ─────────────────────────────────
    console.log("--- Group 1: Identity & Collection Setup ---");
    assert(AmcContract.modelName === "AmcContract", "Model name is AmcContract");
    assert(AmcContract.collection.name === "amccontracts", "Physical collection is 'amccontracts'");

    // Build standard valid indexes on collection
    await AmcContract.syncIndexes();

    const liveIndexes = await AmcContract.collection.indexes();
    const hasUniqueContractCode = liveIndexes.some(
      idx => idx.key && idx.key.contractCode === 1 && idx.unique === true
    );
    const hasCompoundIdx = liveIndexes.some(
      idx => idx.key && idx.key.clientId === 1 && idx.key.productId === 1 && idx.key.expiryDate === 1
    );
    const hasTextIdx = liveIndexes.some(
      idx => idx.key && idx.key._fts === "text"
    );

    assert(hasUniqueContractCode, "Unique index on contractCode exists");
    assert(hasCompoundIdx, "Compound index on { clientId: 1, productId: 1, expiryDate: 1 } exists");
    assert(hasTextIdx, "Text index on contract fields exists");

    // ── GROUP 2: Schema Defaults and Validations ──────────────────────────────
    console.log("\n--- Group 2: Schema Defaults and Validations ---");

    const sampleClientId = new mongoose.Types.ObjectId();
    const sampleProductId = new mongoose.Types.ObjectId();
    const sampleClientProductId = new mongoose.Types.ObjectId();

    const contract1 = await AmcContract.create({
      contractCode: "AMC-CTR-TEST-001",
      clientId: sampleClientId,
      clientCode: "CLI-001",
      clientName: "Alpha Corp",
      clientProductId: sampleClientProductId,
      productId: sampleProductId,
      productCode: "PROD-ERP",
      productName: "Enterprise ERP",
      startDate: new Date("2026-01-01"),
      expiryDate: new Date("2026-12-31"),
      dueDate: new Date("2026-01-15"),
      taxableAmount: 10000,
    });

    assert(contract1._id != null, "Contract created with valid fields");
    assert(contract1.plan === "Standard", "Default plan is 'Standard'");
    assert(contract1.licensedUsers === 1, "Default licensedUsers is 1");
    assert(contract1.status === "Pending", "Default status is 'Pending'");
    assert(contract1.reminderStatus === "Not Sent", "Default reminderStatus is 'Not Sent'");
    assert(contract1.cgstRate === 9, "Default cgstRate is 9");
    assert(contract1.sgstRate === 9, "Default sgstRate is 9");
    assert(contract1.igstRate === 0, "Default igstRate is 0");
    assert(contract1.isDeleted === false, "Default isDeleted is false");
    assert(contract1.renewalVersion === 0, "Default renewalVersion is 0");
    assert(Array.isArray(contract1.timeline) && contract1.timeline.length === 0, "Default timeline is empty array");
    assert(Array.isArray(contract1.documents) && contract1.documents.length === 0, "Default documents is empty array");
    assert(Array.isArray(contract1.renewalHistory) && contract1.renewalHistory.length === 0, "Default renewalHistory is empty array");

    // Required fields validation
    let missingFieldErr = null;
    try {
      await AmcContract.create({
        contractCode: "AMC-FAIL-001",
      });
    } catch (err) {
      missingFieldErr = err;
    }
    assert(missingFieldErr != null && missingFieldErr.name === "ValidationError", "Rejects creation when required fields are missing");

    // Invalid enum validation
    let invalidEnumErr = null;
    try {
      await AmcContract.create({
        contractCode: "AMC-CTR-TEST-BADENUM",
        clientId: sampleClientId,
        clientCode: "CLI-001",
        clientName: "Alpha Corp",
        clientProductId: sampleClientProductId,
        productId: sampleProductId,
        productCode: "PROD-ERP",
        productName: "Enterprise ERP",
        startDate: new Date("2026-01-01"),
        expiryDate: new Date("2026-12-31"),
        dueDate: new Date("2026-01-15"),
        taxableAmount: 10000,
        plan: "UltraSuper",
      });
    } catch (err) {
      invalidEnumErr = err;
    }
    assert(invalidEnumErr != null && invalidEnumErr.errors && invalidEnumErr.errors.plan, "Rejects invalid plan enum");

    // Min value validation
    let negativeAmountErr = null;
    try {
      await AmcContract.create({
        contractCode: "AMC-CTR-TEST-BADAMT",
        clientId: sampleClientId,
        clientCode: "CLI-001",
        clientName: "Alpha Corp",
        clientProductId: sampleClientProductId,
        productId: sampleProductId,
        productCode: "PROD-ERP",
        productName: "Enterprise ERP",
        startDate: new Date("2026-01-01"),
        expiryDate: new Date("2026-12-31"),
        dueDate: new Date("2026-01-15"),
        taxableAmount: -500,
      });
    } catch (err) {
      negativeAmountErr = err;
    }
    assert(negativeAmountErr != null && negativeAmountErr.errors && negativeAmountErr.errors.taxableAmount, "Rejects negative taxableAmount");

    // ── GROUP 3: Subdocuments Operations ─────────────────────────────────────
    console.log("\n--- Group 3: Subdocuments Operations ---");

    contract1.timeline.push({
      type: "created",
      title: "Contract Created",
      description: "Initial AMC contract setup",
      performedByName: "Admin User",
      performedByRole: "admin",
    });

    contract1.documents.push({
      documentType: "AMC Agreement",
      fileName: "contract_agreement.pdf",
      storedFileName: "123456_contract_agreement.pdf",
      relativePath: "uploads/amc/123456_contract_agreement.pdf",
      mimeType: "application/pdf",
      fileSize: 102400,
    });

    const testInvoice = await AmcInvoice.create({
      invoiceCode: "INV-HIST-001",
      totalAmount: 11800,
    });

    contract1.renewalHistory.push({
      cycleNumber: 1,
      contractCode: contract1.contractCode,
      previousInvoiceId: testInvoice._id,
      previousInvoiceCode: testInvoice.invoiceCode,
      totalAmount: 11800,
      taxableAmount: 10000,
      paidAmount: 11800,
      status: "Paid",
      plan: "Standard",
    });

    contract1.upcomingRenewal = {
      invoiceId: testInvoice._id,
      invoiceCode: "INV-UPC-002",
      startDate: new Date("2027-01-01"),
      expiryDate: new Date("2027-12-31"),
      dueDate: new Date("2027-01-15"),
      taxableAmount: 12000,
      totalAmount: 14160,
      gstApplicable: "YES",
      taxType: "intra",
      paymentStatus: "Pending",
    };

    await contract1.save();

    const reloaded = await AmcContract.findById(contract1._id);
    assert(reloaded.timeline.length === 1 && reloaded.timeline[0].title === "Contract Created", "Persists timeline subdocument");
    assert(reloaded.documents.length === 1 && reloaded.documents[0].fileName === "contract_agreement.pdf", "Persists documents subdocument");
    assert(reloaded.renewalHistory.length === 1 && reloaded.renewalHistory[0].cycleNumber === 1, "Persists renewalHistory subdocument");
    assert(reloaded.upcomingRenewal.invoiceCode === "INV-UPC-002" && reloaded.upcomingRenewal.taxableAmount === 12000, "Persists upcomingRenewal embedded object");

    // ── GROUP 4: Unique Index Enforcement (contractCode) ──────────────────────
    console.log("\n--- Group 4: Unique Index Enforcement (contractCode) ---");

    let duplicateErr = null;
    try {
      await AmcContract.create({
        contractCode: "AMC-CTR-TEST-001", // duplicate of contract1
        clientId: sampleClientId,
        clientCode: "CLI-002",
        clientName: "Beta Corp",
        clientProductId: sampleClientProductId,
        productId: sampleProductId,
        productCode: "PROD-ERP",
        productName: "Enterprise ERP",
        startDate: new Date("2026-02-01"),
        expiryDate: new Date("2027-01-31"),
        dueDate: new Date("2026-02-15"),
        taxableAmount: 15000,
      });
    } catch (err) {
      duplicateErr = err;
    }
    assert(duplicateErr != null && duplicateErr.code === 11000, "Duplicate contractCode triggers MongoDB E11000 error");

    // ── GROUP 5: Population, Status Transitions & Soft Deletion ───────────────
    console.log("\n--- Group 5: Population, Status Transitions & Soft Deletion ---");

    const adminUser = await User.create({ name: "Super Admin", email: "super@crm.local" });
    const staffEmp = await Employee.create({ name: "Field Tech", employeeCode: "EMP-042" });
    const realClient = await Client.create({ clientCode: "CLI-REAL-01", companyName: "Real Client Ltd" });
    const realProduct = await Product.create({ productCode: "PRD-REAL-01", productName: "Real Suite" });

    const contract2 = await AmcContract.create({
      contractCode: "AMC-CTR-TEST-002",
      clientId: realClient._id,
      clientCode: realClient.clientCode,
      clientName: realClient.companyName,
      clientProductId: new mongoose.Types.ObjectId(),
      productId: realProduct._id,
      productCode: realProduct.productCode,
      productName: realProduct.productName,
      assignedEmployeeId: staffEmp._id,
      assignedEmployeeCode: staffEmp.employeeCode,
      assignedEmployeeName: staffEmp.name,
      createdBy: adminUser._id,
      createdByName: adminUser.name,
      startDate: new Date("2026-06-01"),
      expiryDate: new Date("2027-05-31"),
      dueDate: new Date("2026-06-15"),
      taxableAmount: 20000,
      totalAmount: 23600,
      status: "Upcoming",
    });

    const populatedContract = await AmcContract.findById(contract2._id)
      .populate("clientId", "companyName clientCode")
      .populate("productId", "productName productCode")
      .populate("assignedEmployeeId", "name employeeCode")
      .populate("createdBy", "name email");

    assert(populatedContract.clientId && populatedContract.clientId.companyName === "Real Client Ltd", "Populated clientId successfully");
    assert(populatedContract.productId && populatedContract.productId.productCode === "PRD-REAL-01", "Populated productId successfully");
    assert(populatedContract.assignedEmployeeId && populatedContract.assignedEmployeeId.employeeCode === "EMP-042", "Populated assignedEmployeeId successfully");
    assert(populatedContract.createdBy && populatedContract.createdBy.email === "super@crm.local", "Populated createdBy successfully");

    // Status transitions
    populatedContract.status = "Partially Paid";
    populatedContract.paidAmount = 10000;
    populatedContract.pendingAmount = 13600;
    await populatedContract.save();

    let checkDoc = await AmcContract.findById(contract2._id);
    assert(checkDoc.status === "Partially Paid" && checkDoc.paidAmount === 10000, "Updated status to 'Partially Paid'");

    populatedContract.status = "Paid";
    populatedContract.paidAmount = 23600;
    populatedContract.pendingAmount = 0;
    await populatedContract.save();

    checkDoc = await AmcContract.findById(contract2._id);
    assert(checkDoc.status === "Paid" && checkDoc.pendingAmount === 0, "Updated status to 'Paid'");

    // Soft deletion
    populatedContract.isDeleted = true;
    populatedContract.deletedAt = new Date();
    populatedContract.deletedBy = adminUser._id;
    populatedContract.deletedByName = adminUser.name;
    await populatedContract.save();

    const activeContracts = await AmcContract.find({ isDeleted: false });
    assert(activeContracts.length === 1 && activeContracts[0].contractCode === "AMC-CTR-TEST-001", "Soft-deleted contract excluded by isDeleted: false query");

  } finally {
    console.log("\n--- Cleanup ---");
    await mongoose.connection.dropDatabase();
    console.log("Dropped isolated test database successfully.");
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }

  console.log(`\nIsolated AmcContract Test Suite Finished: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runAmcContractIsolatedTests().catch(err => {
  console.error("Fatal error in isolated test suite:", err);
  process.exit(1);
});
