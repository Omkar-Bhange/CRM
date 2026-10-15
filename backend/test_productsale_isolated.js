"use strict";

const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "node_modules");
require("module").Module._initPaths();

const mongoose = require("mongoose");

const TEST_DB_URI = `mongodb://127.0.0.1:27017/crm_test_productsale_${Date.now()}`;

async function runProductSaleIsolatedTests() {
  console.log("=== ISOLATED PRODUCTSALE MODEL TEST SUITE ===");
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

  const ProductSale = require("./models/ProductSale");

  try {
    // ── GROUP 1: Identity & Collection Setup ─────────────────────────────────
    console.log("--- Group 1: Identity & Collection Setup ---");
    assert(ProductSale.modelName === "ProductSale", "Model name is ProductSale");
    assert(ProductSale.collection.name === "productsales", "Physical collection is 'productsales'");

    // Build indexes in the test database
    await ProductSale.createIndexes();
    const liveIndexes = await ProductSale.collection.indexes();
    const hasTextIndex = liveIndexes.some(idx => idx.name && idx.name.includes("text"));
    const hasCompoundIndex = liveIndexes.some(idx => idx.key && idx.key.clientId === 1 && idx.key.saleDate === -1);
    const hasUniqueSaleCode = liveIndexes.some(idx => idx.key && idx.key.saleCode === 1 && idx.unique === true);
    assert(hasTextIndex, "Text index created on collection");
    assert(hasCompoundIndex, "Compound index { clientId: 1, saleDate: -1 } created on collection");
    assert(hasUniqueSaleCode, "Unique index on saleCode created on collection");

    // ── GROUP 2: Validation Rules ───────────────────────────────────────────
    console.log("\n--- Group 2: Validation Rules ---");

    // 2.1 Missing required saleCode
    let err1 = null;
    try {
      await ProductSale.create({
        saleNumber: 1,
        clientId: new mongoose.Types.ObjectId(),
        clientCode: "CLI-001",
        clientName: "Acme Corp",
        items: [{
          productId: new mongoose.Types.ObjectId(),
          productCode: "PROD-01",
          productName: "Test Software",
        }],
      });
    } catch (err) {
      err1 = err;
    }
    assert(err1 && err1.errors && err1.errors.saleCode, "saleCode is required");

    // 2.2 Missing required saleNumber
    let err2 = null;
    try {
      await ProductSale.create({
        saleCode: "SAL-2026-0001",
        clientId: new mongoose.Types.ObjectId(),
        clientCode: "CLI-001",
        clientName: "Acme Corp",
        items: [{
          productId: new mongoose.Types.ObjectId(),
          productCode: "PROD-01",
          productName: "Test Software",
        }],
      });
    } catch (err) {
      err2 = err;
    }
    assert(err2 && err2.errors && err2.errors.saleNumber, "saleNumber is required");

    // 2.3 saleNumber min: 1
    let err3 = null;
    try {
      await ProductSale.create({
        saleCode: "SAL-2026-0001",
        saleNumber: 0,
        clientId: new mongoose.Types.ObjectId(),
        clientCode: "CLI-001",
        clientName: "Acme Corp",
        items: [{
          productId: new mongoose.Types.ObjectId(),
          productCode: "PROD-01",
          productName: "Test Software",
        }],
      });
    } catch (err) {
      err3 = err;
    }
    assert(err3 && err3.errors && err3.errors.saleNumber, "saleNumber must be >= 1");

    // 2.4 Missing required clientId
    let err4 = null;
    try {
      await ProductSale.create({
        saleCode: "SAL-2026-0001",
        saleNumber: 1,
        clientCode: "CLI-001",
        clientName: "Acme Corp",
        items: [{
          productId: new mongoose.Types.ObjectId(),
          productCode: "PROD-01",
          productName: "Test Software",
        }],
      });
    } catch (err) {
      err4 = err;
    }
    assert(err4 && err4.errors && err4.errors.clientId, "clientId is required");

    // 2.5 Empty items array fails validator
    let err5 = null;
    try {
      await ProductSale.create({
        saleCode: "SAL-2026-0001",
        saleNumber: 1,
        clientId: new mongoose.Types.ObjectId(),
        clientCode: "CLI-001",
        clientName: "Acme Corp",
        items: [],
      });
    } catch (err) {
      err5 = err;
    }
    assert(err5 && err5.errors && err5.errors.items, "items array cannot be empty");

    // 2.6 Item missing required product fields
    let err6 = null;
    try {
      await ProductSale.create({
        saleCode: "SAL-2026-0001",
        saleNumber: 1,
        clientId: new mongoose.Types.ObjectId(),
        clientCode: "CLI-001",
        clientName: "Acme Corp",
        items: [{
          // missing productId, productCode, productName
          quantity: 2,
        }],
      });
    } catch (err) {
      err6 = err;
    }
    assert(err6 && err6.errors && (err6.errors["items.0.productId"] || err6.message.includes("Product")), "item requires productId, productCode, productName");

    // 2.7 Invalid paymentStatus enum
    let err7 = null;
    try {
      await ProductSale.create({
        saleCode: "SAL-2026-0001",
        saleNumber: 1,
        clientId: new mongoose.Types.ObjectId(),
        clientCode: "CLI-001",
        clientName: "Acme Corp",
        paymentStatus: "NonExistentStatus",
        items: [{
          productId: new mongoose.Types.ObjectId(),
          productCode: "PROD-01",
          productName: "Test Software",
        }],
      });
    } catch (err) {
      err7 = err;
    }
    assert(err7 && err7.errors && err7.errors.paymentStatus, "paymentStatus validates enum");

    // ── GROUP 3: Valid Creation, Defaults & Financial Accuracy ──────────────
    console.log("\n--- Group 3: Valid Creation, Defaults & Financial Accuracy ---");
    const testClient = await Client.create({
      clientCode: "CLI-PS-001",
      companyName: "Prime Global Logistics",
      contactPerson: "Rajesh Kumar",
      email: "rajesh@primeglobal.test",
      mobile: "9876543210",
      state: "Maharashtra",
      billingAddress: "402 Nariman Point, Mumbai",
    });

    const testProduct = await Product.create({
      productCode: "PROD-ERP-01",
      productName: "Enterprise ERP Suite",
      basePrice: 50000,
    });

    const testAdmin = await User.create({
      name: "Super Admin",
      email: "superadmin@crm.test",
      role: "admin",
    });

    const saleDoc = await ProductSale.create({
      saleCode: "sal-2026-0001", // test lowercase trimmed to uppercase
      saleNumber: 1,
      invoiceNo: "inv-2026-001",
      saleDate: new Date("2026-03-01T10:00:00.000Z"),
      invoiceDate: new Date("2026-03-01T10:00:00.000Z"),
      dueDate: new Date("2026-03-31T10:00:00.000Z"),
      clientId: testClient._id,
      clientCode: testClient.clientCode,
      clientName: testClient.companyName,
      contactPerson: testClient.contactPerson,
      mobile: testClient.mobile,
      email: testClient.email,
      state: testClient.state,
      billingAddress: testClient.billingAddress,
      items: [
        {
          productId: testProduct._id,
          productCode: testProduct.productCode,
          productName: testProduct.productName,
          version: "v2.5.0",
          licenceType: "Annual Licence",
          licensedUsers: 10,
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
          supportType: "Premium",
          installationStatus: "Installed",
          amcApplicable: true,
          proposedAmcAmount: 20000,
          notes: "Initial deployment for HQ",
        },
      ],
      grossAmount: 100000,
      discountAmount: 10000,
      taxableAmount: 90000,
      cgstAmount: 8100,
      sgstAmount: 8100,
      igstAmount: 0,
      roundOff: 0,
      totalAmount: 106200,
      paidAmount: 50000,
      pendingAmount: 56200,
      paymentStatus: "Partially Paid",
      status: "Confirmed",
      notes: "First installment received",
      createdBy: testAdmin._id,
      createdByName: testAdmin.name,
    });

    assert(saleDoc._id !== undefined, "Sale created successfully with ObjectId");
    assert(saleDoc.saleCode === "SAL-2026-0001", "saleCode trimmed and uppercased");
    assert(saleDoc.invoiceNo === "INV-2026-001", "invoiceNo trimmed and uppercased");
    assert(saleDoc.paymentStatus === "Partially Paid", "paymentStatus is Partially Paid");
    assert(saleDoc.status === "Confirmed", "status is Confirmed");
    assert(saleDoc.items.length === 1, "items array has 1 subdocument");
    assert(saleDoc.items[0]._id !== undefined, "Item subdocument has its own _id");
    assert(saleDoc.items[0].createdAt !== undefined, "Item subdocument has timestamps.createdAt");
    assert(saleDoc.createdAt !== undefined, "Parent document has timestamps.createdAt");
    assert(saleDoc.updatedAt !== undefined, "Parent document has timestamps.updatedAt");

    // ── GROUP 4: Unique Index Enforcement ───────────────────────────────────
    console.log("\n--- Group 4: Unique Index Enforcement ---");
    let dupErr = null;
    try {
      await ProductSale.create({
        saleCode: "SAL-2026-0001", // duplicate saleCode
        saleNumber: 2,
        clientId: testClient._id,
        clientCode: testClient.clientCode,
        clientName: testClient.companyName,
        items: [
          {
            productId: testProduct._id,
            productCode: testProduct.productCode,
            productName: testProduct.productName,
          },
        ],
      });
    } catch (err) {
      dupErr = err;
    }
    assert(dupErr && dupErr.code === 11000, "Duplicate saleCode blocked by unique index (E11000)");

    // ── GROUP 5: Querying, Sorting & Compound Index ──────────────────────────
    console.log("\n--- Group 5: Querying, Sorting & Compound Index ---");
    // Create second sale for same client with later date
    const sale2 = await ProductSale.create({
      saleCode: "SAL-2026-0002",
      saleNumber: 2,
      saleDate: new Date("2026-04-01T10:00:00.000Z"),
      clientId: testClient._id,
      clientCode: testClient.clientCode,
      clientName: testClient.companyName,
      items: [
        {
          productId: testProduct._id,
          productCode: testProduct.productCode,
          productName: testProduct.productName,
          rate: 25000,
          totalAmount: 29500,
        },
      ],
      totalAmount: 29500,
      paidAmount: 29500,
      pendingAmount: 0,
      paymentStatus: "Paid",
    });

    const clientSales = await ProductSale.find({ clientId: testClient._id })
      .sort({ saleDate: -1 })
      .lean();

    assert(clientSales.length === 2, "Found 2 sales for client");
    assert(clientSales[0].saleCode === "SAL-2026-0002", "First sale in sort is latest saleDate (SAL-2026-0002)");
    assert(clientSales[1].saleCode === "SAL-2026-0001", "Second sale in sort is earlier saleDate (SAL-2026-0001)");

    // Text search
    const textSearchResults = await ProductSale.find({
      $text: { $search: "Enterprise" },
    }).lean();
    assert(textSearchResults.length >= 1, "Text search by product name found matching sale");

    // ── GROUP 6: Population of Referenced Models ────────────────────────────
    console.log("\n--- Group 6: Population of Referenced Models ---");
    const populated = await ProductSale.findById(saleDoc._id)
      .populate("clientId")
      .populate("items.productId")
      .populate("createdBy")
      .exec();

    assert(populated.clientId.companyName === "Prime Global Logistics", "Populated clientId successfully");
    assert(populated.items[0].productId.productName === "Enterprise ERP Suite", "Populated items.productId successfully");
    assert(populated.createdBy.name === "Super Admin", "Populated createdBy successfully");

    // ── GROUP 7: Payment Updates & Soft Delete ──────────────────────────────
    console.log("\n--- Group 7: Payment Updates & Soft Delete ---");
    const updatedSale = await ProductSale.findByIdAndUpdate(
      saleDoc._id,
      {
        paidAmount: 106200,
        pendingAmount: 0,
        paymentStatus: "Paid",
        paymentVersion: 1,
      },
      { new: true }
    );
    assert(updatedSale.paymentStatus === "Paid", "Updated paymentStatus to Paid");
    assert(updatedSale.pendingAmount === 0, "Updated pendingAmount to 0");
    assert(updatedSale.paymentVersion === 1, "Incremented paymentVersion to 1");

    // Soft delete
    await ProductSale.findByIdAndUpdate(saleDoc._id, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: testAdmin._id,
      deletedByName: testAdmin.name,
    });

    const activeSales = await ProductSale.find({ isDeleted: false });
    assert(activeSales.length === 1 && activeSales[0].saleCode === "SAL-2026-0002", "Active sales query filters out soft-deleted document");

  } finally {
    console.log("\n--- Cleanup ---");
    try {
      await conn.connection.dropDatabase();
      console.log("Dropped isolated test database.");
      await mongoose.disconnect();
      console.log("Disconnected cleanly from test database.");
    } catch (e) {
      console.error("Cleanup error:", e);
    }
  }

  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runProductSaleIsolatedTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

