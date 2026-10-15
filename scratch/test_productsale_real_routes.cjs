"use strict";

const path = require("path");
process.env.NODE_PATH = path.resolve("backend/node_modules");
require("module").Module._initPaths();

const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const http = require("http");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve("backend/.env") });

const TEST_DB_URI = `mongodb://127.0.0.1:27017/crm_real_ps_routes_${Date.now()}`;
const JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-123456";

async function runRealProductSaleRouteTests() {
  console.log("=== REAL PRODUCTSALE ROUTER INTEGRATION & SECURITY TEST ===");
  console.log("Connecting to local isolated MongoDB:", TEST_DB_URI);

  const conn = await mongoose.connect(TEST_DB_URI);
  console.log("Connected to isolated test database successfully.\n");

  // Mock startSession for standalone local MongoDB instance (supports session.withTransaction)
  const origStartSession = mongoose.startSession;
  mongoose.startSession = async function(...args) {
    const realSession = await origStartSession.apply(mongoose, args);
    realSession.withTransaction = async function(fn) {
      return fn(realSession);
    };
    return realSession;
  };

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

  // Mount real router under /api/admin
  app.use("/api/admin", adminRouter);

  // Start HTTP server
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`Test Express server listening on port ${port}\n`);

  function makeRequest(method, pathUrl, body = null, token = null) {
    return new Promise((resolve, reject) => {
      const payload = body ? JSON.stringify(body) : null;
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (payload) headers["Content-Length"] = Buffer.byteLength(payload);

      const req = http.request(
        {
          hostname: "127.0.0.1",
          port,
          path: pathUrl,
          method,
          headers,
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
    // Setup test admin user and JWT token
    const adminUser = await User.create({
      name: "Admin User",
      email: `admin_${Date.now()}@crm.test`,
      role: "admin",
      status: "Active",
    });

    const token = jwt.sign(
      { userId: adminUser._id.toString(), role: "admin", email: adminUser.email },
      JWT_SECRET
    );

    // Setup client and product in DB (state: Maharashtra for same-state CGST+SGST calculation)
    const testClient = await Client.create({
      clientCode: "CLI-RT-001",
      companyName: "Apex Industrial Corp",
      contactPerson: "Vikram Malhotra",
      email: "vikram@apex.test",
      mobile: "9822012345",
      state: "Maharashtra",
      billingAddress: "Nariman Point, Mumbai",
    });

    const testProduct = await Product.create({
      productCode: "PROD-INV-01",
      productName: "Inventory Management ERP",
      basePrice: 75000,
    });

    // ── TEST 1: POST /api/admin/product-sales validation ────────────────────
    console.log("--- Test 1: POST /api/admin/product-sales Validation ---");
    const emptyRes = await makeRequest("POST", "/api/admin/product-sales", {}, token);
    assert(emptyRes.status === 400, "POST /product-sales returns 400 when body is empty");
    assert(emptyRes.data.success === false, "Returns success: false for invalid body");

    // Invalid clientId
    const invalidClientRes = await makeRequest("POST", "/api/admin/product-sales", {
      clientId: "invalid_id",
      items: [{ productId: testProduct._id }],
    }, token);
    assert(invalidClientRes.status === 400, "POST /product-sales returns 400 for invalid clientId");

    // ── TEST 2: Valid Creation via POST /api/admin/product-sales ────────────
    console.log("\n--- Test 2: Valid Creation via POST /api/admin/product-sales ---");
    const createPayload = {
      clientId: testClient._id.toString(),
      saleDate: "2026-03-10",
      invoiceNo: "INV-APEX-001",
      dueDate: "2026-04-10",
      items: [
        {
          productId: testProduct._id.toString(),
          productCode: testProduct.productCode,
          productName: testProduct.productName,
          version: "v3.0.0",
          licenceType: "Annual Licence",
          licensedUsers: 5,
          quantity: 1,
          rate: 75000,
          grossAmount: 75000,
          discountAmount: 5000,
          taxableAmount: 70000,
          gstRate: 18,
          cgstAmount: 6300,
          sgstAmount: 6300,
          igstAmount: 0,
          totalAmount: 82600,
          warrantyMonths: 12,
          supportType: "Premium",
          installationStatus: "Installed",
          amcApplicable: true,
          proposedAmcAmount: 15000,
          notes: "Real API router creation test",
        },
      ],
      discountAmount: 0,
      roundOff: 0,
      notes: "Commercial sale via real router",
    };

    const createRes = await makeRequest("POST", "/api/admin/product-sales", createPayload, token);
    assert(createRes.status === 201 || createRes.status === 200, `POST /product-sales returns 200/201 (got ${createRes.status})`);
    assert(createRes.data && createRes.data.success === true, "Response reports success: true");
    const createdSale = createRes.data.data || createRes.data.sale;
    assert(createdSale && createdSale._id, "Created sale returned with _id");
    assert(createdSale.clientCode === "CLI-RT-001", "Client snapshot clientCode populated correctly");
    assert(createdSale.totalAmount === 82600, `Total amount matches calculation (expected 82600, got ${createdSale.totalAmount})`);
    assert(createdSale.paymentStatus === "Unpaid", "Initial paymentStatus is Unpaid");

    const saleId = createdSale._id;

    // Verify client products array was atomically updated
    const updatedClient = await Client.findById(testClient._id);
    assert(updatedClient.products.length >= 1, "Client.products array synced with new product sale");
    assert(updatedClient.products[0].productCode === "PROD-INV-01", "Client product code matches");

    // ── TEST 3: GET /api/admin/product-sales (List & Filter) ────────────────
    console.log("\n--- Test 3: GET /api/admin/product-sales List & Filter ---");
    const listRes = await makeRequest("GET", "/api/admin/product-sales", null, token);
    assert(listRes.status === 200, "GET /product-sales returns 200");
    const salesList = listRes.data.data || listRes.data.sales || listRes.data;
    assert(Array.isArray(salesList) && salesList.length >= 1, "GET /product-sales returns list containing created sale");

    // Filter by clientId
    const filterRes = await makeRequest("GET", `/api/admin/product-sales?clientId=${testClient._id}`, null, token);
    assert(filterRes.status === 200, "GET /product-sales with clientId filter returns 200");
    const filteredList = filterRes.data.data || filterRes.data.sales || filterRes.data;
    assert(filteredList.length >= 1, "Filter returned matching record");

    // GET /api/admin/client/:id/product-sales
    const clientSalesRes = await makeRequest("GET", `/api/admin/client/${testClient._id}/product-sales`, null, token);
    assert(clientSalesRes.status === 200, "GET /client/:id/product-sales returns 200");

    // ── TEST 4: GET /api/admin/product-sales/:id (Detail) ───────────────────
    console.log("\n--- Test 4: GET /api/admin/product-sales/:id Detail ---");
    const detailRes = await makeRequest("GET", `/api/admin/product-sales/${saleId}`, null, token);
    assert(detailRes.status === 200, "GET /product-sales/:id returns 200");
    const detailData = detailRes.data.data || detailRes.data.sale || detailRes.data;
    assert(detailData._id === saleId, "Detail returns correct sale record");
    assert(detailData.items && detailData.items.length === 1, "Detail includes items subdocuments");

    // ── TEST 5: POST /api/admin/product-sales/:id/payment (Record Payment) ──
    console.log("\n--- Test 5: POST /api/admin/product-sales/:id/payment ---");
    const paymentPayload = {
      amount: 40000,
      paymentDate: "2026-03-15",
      mode: "Bank Transfer",
      referenceNo: "NEFT-12345678",
      notes: "Advance installment",
    };

    const payRes = await makeRequest("POST", `/api/admin/product-sales/${saleId}/payment`, paymentPayload, token);
    assert(payRes.status === 200 || payRes.status === 201, `POST /product-sales/:id/payment returns 200/201 (got ${payRes.status})`);
    
    // Verify ProductSale was updated
    const saleAfterPayment = await ProductSale.findById(saleId);
    assert(saleAfterPayment.paidAmount === 40000, "ProductSale.paidAmount updated to 40,000");
    assert(saleAfterPayment.pendingAmount === 42600, "ProductSale.pendingAmount updated to 42,600");
    assert(saleAfterPayment.paymentStatus === "Partially Paid", "ProductSale.paymentStatus updated to 'Partially Paid'");

    // Pay remainder
    const fullPayPayload = {
      amount: 42600,
      paymentDate: "2026-03-20",
      mode: "Cheque",
      referenceNo: "CHQ-987654",
      notes: "Final settlement",
    };
    const fullPayRes = await makeRequest("POST", `/api/admin/product-sales/${saleId}/payment`, fullPayPayload, token);
    assert(fullPayRes.status === 200 || fullPayRes.status === 201, `Second payment recorded (got ${fullPayRes.status})`);
    const saleSettled = await ProductSale.findById(saleId);
    assert(saleSettled.paidAmount === 82600, "ProductSale.paidAmount is now full 82,600");
    assert(saleSettled.pendingAmount === 0, "ProductSale.pendingAmount is 0");
    assert(saleSettled.paymentStatus === "Paid", "ProductSale.paymentStatus is 'Paid'");

    // ── TEST 6: GET /api/admin/product-sales-summary (Financial Metrics) ────
    console.log("\n--- Test 6: GET /api/admin/product-sales-summary ---");
    const summaryRes = await makeRequest("GET", "/api/admin/product-sales-summary", null, token);
    assert(summaryRes.status === 200, "GET /product-sales-summary returns 200");
    assert(summaryRes.data && summaryRes.data.success === true, "Summary reports success: true");

    // ── TEST 7: PATCH /api/admin/product-sales/:id/cancel ───────────────────
    console.log("\n--- Test 7: PATCH /api/admin/product-sales/:id/cancel ---");
    // Create an unpaid sale to test cancellation
    const cancelSale = await ProductSale.create({
      saleCode: "SAL-CAN-0001",
      saleNumber: 99,
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
      paymentStatus: "Unpaid",
      status: "Confirmed",
    });

    const cancelRes = await makeRequest("PATCH", `/api/admin/product-sales/${cancelSale._id}/cancel`, {
      reason: "Client request cancellation",
    }, token);
    assert(cancelRes.status === 200, `PATCH /product-sales/:id/cancel returns 200 (got ${cancelRes.status})`);
    
    // Verify status in database
    const cancelledInDb = await ProductSale.findById(cancelSale._id);
    assert(cancelledInDb.status === "Cancelled", "Sale document marked status: 'Cancelled'");

  } finally {
    console.log("\n--- Cleanup ---");
    mongoose.startSession = origStartSession;
    await new Promise(resolve => server.close(resolve));
    console.log("Closed test HTTP server.");
    try {
      await conn.connection.dropDatabase();
      console.log("Dropped isolated route test database.");
      await mongoose.disconnect();
      console.log("Disconnected cleanly from test database.");
    } catch (e) {
      console.error("Cleanup error:", e);
    }
  }

  console.log(`\n=== REAL ROUTE RESULTS: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runRealProductSaleRouteTests().catch(err => {
  console.error("Real route test execution failed:", err);
  process.exit(1);
});
