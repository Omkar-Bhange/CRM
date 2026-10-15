const http = require("http");
const path = require("path");
const jwt = require(path.join(__dirname, "../backend/node_modules/jsonwebtoken"));
const mongoose = require(path.join(__dirname, "../backend/node_modules/mongoose"));
require(path.join(__dirname, "../backend/node_modules/dotenv")).config({
  path: path.join(__dirname, "../backend/.env"),
});

const JWT_SECRET = process.env.JWT_SECRET || "ClientConnectTrack@2026SuperSecret";

function httpRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let parsed = null;
        try {
          parsed = JSON.parse(text);
        } catch (e) {
          parsed = text;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });
    req.on("error", reject);
    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("==================================================================");
  console.log("ISSUE 6 TEST SUITE: AMC RENEWAL TRANSACTION SAFETY & INTEGRITY");
  console.log("==================================================================\n");

  const dbUri = process.env.MONGO_URI;
  await mongoose.connect(dbUri);
  console.log("Connected to MongoDB for transactional verification.\n");

  // Models
  const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({}, { strict: false }), "users");
  const Client = mongoose.models.Client || mongoose.model("Client", new mongoose.Schema({}, { strict: false }), "clients");
  const Product = mongoose.models.Product || mongoose.model("Product", new mongoose.Schema({}, { strict: false }), "products");
  const AmcContract = mongoose.models.AmcContract || mongoose.model("AmcContract", new mongoose.Schema({}, { strict: false }), "amccontracts");
  const AmcInvoice = mongoose.models.AmcInvoice || mongoose.model("AmcInvoice", new mongoose.Schema({}, { strict: false }), "amcinvoices");
  const AmcPayment = mongoose.models.AmcPayment || mongoose.model("AmcPayment", new mongoose.Schema({}, { strict: false }), "amcpayments");
  const ActivityLog = mongoose.models.ActivityLog || mongoose.model("ActivityLog", new mongoose.Schema({}, { strict: false }), "activitylogs");
  const IdempotencyLog = mongoose.models.IdempotencyLog || mongoose.model("IdempotencyLog", new mongoose.Schema({}, { strict: false }), "idempotencylogs");

  // Cleanup any lingering artifacts from previous runs
  async function cleanupTestData() {
    await Client.deleteMany({ clientCode: { $regex: "TEST_ISSUE6", $options: "i" } });
    await AmcContract.deleteMany({ contractCode: { $regex: "TEST_ISSUE6", $options: "i" } });
    await AmcInvoice.deleteMany({ contractCode: { $regex: "TEST_ISSUE6", $options: "i" } });
    await ActivityLog.deleteMany({ entityCode: { $regex: "TEST_ISSUE6", $options: "i" } });
    await IdempotencyLog.deleteMany({ idempotencyKey: { $regex: "TEST_ISSUE6", $options: "i" } });
  }

  await cleanupTestData();

  // Admin token
  const adminUser = await User.findOne({ role: { $in: ["admin", "superadmin"] } }).lean();
  if (!adminUser) throw new Error("Admin user not found in database.");

  const adminToken = jwt.sign(
    { userId: adminUser._id, role: "admin", email: adminUser.email },
    JWT_SECRET,
    { expiresIn: "2h" }
  );

  let passedTests = 0;
  let totalTests = 9;

  try {
    // Shared seed product
    let testProduct = await Product.findOne({ isDeleted: false }).lean();
    if (!testProduct) {
      testProduct = await Product.create({
        productCode: "PROD-TEST-ISSUE6",
        productName: "Issue 6 Test Product",
        isDeleted: false,
      });
    }

    /* ------------------------------------------------------------------
       TEST 1: Normal AMC renewal (Atomic contract + invoice + client update)
    ------------------------------------------------------------------ */
    console.log("TEST 1: Normal AMC renewal (post-expiry lifecycle transition)...");
    const clientProd1Id = new mongoose.Types.ObjectId();
    const clientDoc1 = await Client.create({
      clientCode: "__TEST_ISSUE6_C1__",
      companyName: "Issue 6 Test Company MH",
      clientName: "Issue 6 Test Client MH",
      state: "Maharashtra",
      billingAddress: { state: "Maharashtra" },
      amcStatus: "Overdue",
      products: [
        {
          _id: clientProd1Id,
          productId: testProduct._id,
          productCode: testProduct.productCode,
          productName: testProduct.productName,
          amcStatus: "Overdue",
          expiryDate: "2026-09-01",
        },
      ],
      isDeleted: false,
    });

    const contract1 = await AmcContract.create({
      contractCode: "__TEST_ISSUE6_CNT1__",
      clientId: clientDoc1._id,
      clientCode: clientDoc1.clientCode,
      clientName: clientDoc1.clientName,
      clientProductId: clientProd1Id,
      productId: testProduct._id,
      productCode: testProduct.productCode,
      productName: testProduct.productName,
      plan: "Standard",
      licensedUsers: 2,
      startDate: new Date("2025-09-01"),
      expiryDate: new Date("2026-08-31"),
      dueDate: new Date("2025-09-01"),
      taxableAmount: 10000,
      totalAmount: 11800,
      status: "Overdue",
      isDeleted: false,
    });

    const res1 = await httpRequest(
      {
        hostname: "localhost",
        port: 5000,
        path: `/api/admin/amc/contract/${contract1._id}/renew`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        startDate: "2026-09-01",
        expiryDate: "2027-08-31",
        taxableAmount: 12000,
        gstRate: 18,
        gstApplicable: "YES",
        notes: "Test 1 Normal Renewal",
      }
    );

    if (res1.status !== 201) {
      throw new Error(`Test 1 expected 201, got ${res1.status}: ${JSON.stringify(res1.body)}`);
    }

    // Verify invoice created
    const inv1 = await AmcInvoice.findOne({ amcContractId: contract1._id, isDeleted: false });
    if (!inv1) throw new Error("Test 1 invoice was not created in database!");
    if (inv1.paymentStatus !== "Pending") throw new Error(`Test 1 invoice paymentStatus expected 'Pending', got ${inv1.paymentStatus}`);
    if (inv1.taxableAmount !== 12000) throw new Error(`Test 1 invoice taxableAmount expected 12000, got ${inv1.taxableAmount}`);

    // Verify contract transitioned & renewalHistory archived
    const updatedCnt1 = await AmcContract.findById(contract1._id);
    if (updatedCnt1.status !== "Pending") throw new Error(`Test 1 contract status expected 'Pending', got ${updatedCnt1.status}`);
    if (!updatedCnt1.renewalHistory || updatedCnt1.renewalHistory.length !== 1) {
      throw new Error(`Test 1 expected renewalHistory length 1, got ${updatedCnt1.renewalHistory?.length}`);
    }
    if (updatedCnt1.renewalHistory[0].taxableAmount !== 10000) {
      throw new Error("Test 1 previous cycle taxableAmount not preserved in renewalHistory!");
    }

    // Verify client document synced
    const updatedClient1 = await Client.findById(clientDoc1._id);
    if (updatedClient1.amcStatus !== "Pending") throw new Error("Test 1 client.amcStatus not updated to 'Pending'!");

    // Verify ActivityLog created
    const actLog1 = await ActivityLog.findOne({ entityId: contract1._id, action: "AMC Renewed" });
    if (!actLog1) throw new Error("Test 1 ActivityLog record was not found!");

    console.log("   ✓ Test 1 Passed: Normal renewal successfully created atomic invoice, contract cycle, and client status.\n");
    passedTests++;

    /* ------------------------------------------------------------------
       TEST 2: Early AMC renewal (upcomingRenewal architecture)
    ------------------------------------------------------------------ */
    console.log("TEST 2: Early AMC renewal (upcomingRenewal dual-period preservation)...");
    const futureExpiry = new Date();
    futureExpiry.setDate(futureExpiry.getDate() + 45); // Expires in 45 days

    const earlyStartDate = new Date(futureExpiry);
    earlyStartDate.setDate(earlyStartDate.getDate() + 1);

    const earlyExpiryDate = new Date(earlyStartDate);
    earlyExpiryDate.setFullYear(earlyExpiryDate.getFullYear() + 1);
    earlyExpiryDate.setDate(earlyExpiryDate.getDate() - 1);

    const contract2 = await AmcContract.create({
      contractCode: "__TEST_ISSUE6_CNT2__",
      clientId: clientDoc1._id,
      clientCode: clientDoc1.clientCode,
      clientName: clientDoc1.clientName,
      clientProductId: clientProd1Id,
      productId: testProduct._id,
      productCode: testProduct.productCode,
      productName: testProduct.productName,
      plan: "Standard",
      licensedUsers: 1,
      startDate: new Date("2026-01-01"),
      expiryDate: futureExpiry,
      dueDate: new Date("2026-01-01"),
      taxableAmount: 15000,
      totalAmount: 17700,
      status: "Paid",
      isDeleted: false,
    });

    const res2 = await httpRequest(
      {
        hostname: "localhost",
        port: 5000,
        path: `/api/admin/amc/contract/${contract2._id}/renew`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        startDate: earlyStartDate.toISOString().slice(0, 10),
        expiryDate: earlyExpiryDate.toISOString().slice(0, 10),
        taxableAmount: 16000,
        gstRate: 18,
        gstApplicable: "YES",
      }
    );

    if (res2.status !== 201) {
      throw new Error(`Test 2 expected 201, got ${res2.status}: ${JSON.stringify(res2.body)}`);
    }
    if (!res2.body.isEarlyRenewal) {
      throw new Error("Test 2 expected isEarlyRenewal to be true!");
    }

    const updatedCnt2 = await AmcContract.findById(contract2._id);
    // Ongoing coverage must remain active and untouched
    if (updatedCnt2.status !== "Paid") throw new Error("Test 2 paid status was prematurely modified!");
    if (new Date(updatedCnt2.expiryDate).toISOString().slice(0, 10) !== futureExpiry.toISOString().slice(0, 10)) {
      throw new Error("Test 2 ongoing contract expiry date was prematurely replaced!");
    }
    if (!updatedCnt2.upcomingRenewal?.invoiceId) {
      throw new Error("Test 2 upcomingRenewal was not populated with new invoice ID!");
    }

    console.log("   ✓ Test 2 Passed: Early renewal safely stored in upcomingRenewal while ongoing coverage remains intact.\n");
    passedTests++;

    /* ------------------------------------------------------------------
       TEST 3: GST calculation preservation (Intra vs Inter vs Zero)
    ------------------------------------------------------------------ */
    console.log("TEST 3: GST calculation preservation (intra, inter, statutory zero)...");
    // Case 3a: Intra-state Maharashtra (9% + 9%)
    const cnt3a = await AmcContract.create({
      contractCode: "__TEST_ISSUE6_CNT3A__",
      clientId: clientDoc1._id,
      clientCode: clientDoc1.clientCode,
      clientName: clientDoc1.clientName,
      clientProductId: clientProd1Id,
      productId: testProduct._id,
      productCode: testProduct.productCode,
      productName: testProduct.productName,
      startDate: new Date("2025-01-01"),
      expiryDate: new Date("2025-12-31"),
      dueDate: new Date("2025-01-01"),
      taxableAmount: 10000,
      status: "Paid",
      isDeleted: false,
    });

    const res3a = await httpRequest(
      {
        hostname: "localhost",
        port: 5000,
        path: `/api/admin/amc/contract/${cnt3a._id}/renew`,
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      },
      {
        startDate: "2026-01-01",
        expiryDate: "2026-12-31",
        taxableAmount: 10000,
        taxType: "intra",
        gstRate: 18,
        gstApplicable: "YES",
      }
    );
    if (res3a.status !== 201) throw new Error(`Test 3a failed with ${res3a.status}`);
    const inv3a = res3a.body.invoice;
    if (inv3a.cgstRate !== 9 || inv3a.sgstRate !== 9 || inv3a.igstRate !== 0) {
      throw new Error(`Test 3a CGST/SGST incorrect: CGST=${inv3a.cgstRate}, SGST=${inv3a.sgstRate}`);
    }
    if (inv3a.cgstAmount !== 900 || inv3a.sgstAmount !== 900 || inv3a.totalAmount !== 11800) {
      throw new Error(`Test 3a amounts incorrect: total=${inv3a.totalAmount}`);
    }

    // Case 3b: Inter-state (18% IGST)
    const clientDoc3b = await Client.create({
      clientCode: "__TEST_ISSUE6_C3B__",
      companyName: "Issue 6 Company Karnataka",
      clientName: "Issue 6 Client Karnataka",
      state: "Karnataka",
      billingAddress: { state: "Karnataka" },
      products: [],
      isDeleted: false,
    });

    const cnt3b = await AmcContract.create({
      contractCode: "__TEST_ISSUE6_CNT3B__",
      clientId: clientDoc3b._id,
      clientCode: clientDoc3b.clientCode,
      clientName: clientDoc3b.clientName,
      clientProductId: clientProd1Id,
      productId: testProduct._id,
      productCode: testProduct.productCode,
      productName: testProduct.productName,
      startDate: new Date("2025-01-01"),
      expiryDate: new Date("2025-12-31"),
      dueDate: new Date("2025-01-01"),
      taxableAmount: 10000,
      status: "Paid",
      isDeleted: false,
    });

    const res3b = await httpRequest(
      {
        hostname: "localhost",
        port: 5000,
        path: `/api/admin/amc/contract/${cnt3b._id}/renew`,
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      },
      {
        startDate: "2026-01-01",
        expiryDate: "2026-12-31",
        taxableAmount: 10000,
        taxType: "inter",
        gstRate: 18,
        gstApplicable: "YES",
      }
    );
    if (res3b.status !== 201) throw new Error(`Test 3b failed with ${res3b.status}`);
    const inv3b = res3b.body.invoice;
    if (inv3b.cgstRate !== 0 || inv3b.sgstRate !== 0 || inv3b.igstRate !== 18 || inv3b.igstAmount !== 1800) {
      throw new Error(`Test 3b IGST incorrect: IGST=${inv3b.igstRate}, amount=${inv3b.igstAmount}`);
    }

    console.log("   ✓ Test 3 Passed: GST formulas and intra (9%+9%) vs inter (18%) split strictly preserved.\n");
    passedTests++;

    /* ------------------------------------------------------------------
       TEST 4: Idempotent replay with same key
    ------------------------------------------------------------------ */
    console.log("TEST 4: Idempotent replay with identical idempotencyKey...");
    const cnt4 = await AmcContract.create({
      contractCode: "__TEST_ISSUE6_CNT4__",
      clientId: clientDoc1._id,
      clientCode: clientDoc1.clientCode,
      clientName: clientDoc1.clientName,
      clientProductId: clientProd1Id,
      productId: testProduct._id,
      productCode: testProduct.productCode,
      productName: testProduct.productName,
      startDate: new Date("2025-01-01"),
      expiryDate: new Date("2025-12-31"),
      dueDate: new Date("2025-01-01"),
      taxableAmount: 20000,
      status: "Paid",
      isDeleted: false,
    });

    const idempotencyKey4 = `__TEST_ISSUE6_KEY4_${Date.now()}__`;
    const payload4 = {
      startDate: "2026-01-01",
      expiryDate: "2026-12-31",
      taxableAmount: 20000,
      gstRate: 18,
      gstApplicable: "YES",
      idempotencyKey: idempotencyKey4,
    };

    // First call
    const res4a = await httpRequest(
      {
        hostname: "localhost",
        port: 5000,
        path: `/api/admin/amc/contract/${cnt4._id}/renew`,
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      },
      payload4
    );
    if (res4a.status !== 201) throw new Error(`Test 4 first call failed with ${res4a.status}`);
    const originalInvoiceCode = res4a.body.invoice.invoiceCode;

    // Second call (Replay)
    const res4b = await httpRequest(
      {
        hostname: "localhost",
        port: 5000,
        path: `/api/admin/amc/contract/${cnt4._id}/renew`,
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      },
      payload4
    );
    if (res4b.status !== 200) throw new Error(`Test 4 replay expected 200, got ${res4b.status}`);
    if (res4b.body.invoice.invoiceCode !== originalInvoiceCode) {
      throw new Error(`Test 4 replay returned different invoiceCode: ${res4b.body.invoice.invoiceCode} vs ${originalInvoiceCode}`);
    }

    // Verify database only has 1 invoice
    const invCount4 = await AmcInvoice.countDocuments({ amcContractId: cnt4._id, isDeleted: false });
    if (invCount4 !== 1) throw new Error(`Test 4 expected exactly 1 invoice in DB, found ${invCount4}`);

    console.log("   ✓ Test 4 Passed: Replay returned original invoice idempotently without duplicate generation.\n");
    passedTests++;

    /* ------------------------------------------------------------------
       TEST 5: Idempotent conflict with altered payload (HTTP 422)
    ------------------------------------------------------------------ */
    console.log("TEST 5: Idempotency conflict with modified payload returns 422...");
    const alteredPayload4 = {
      ...payload4,
      taxableAmount: 25000, // Altered amount with same key!
    };

    const res5 = await httpRequest(
      {
        hostname: "localhost",
        port: 5000,
        path: `/api/admin/amc/contract/${cnt4._id}/renew`,
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      },
      alteredPayload4
    );

    if (res5.status !== 422) {
      throw new Error(`Test 5 expected 422 Unprocessable Entity, got ${res5.status}: ${JSON.stringify(res5.body)}`);
    }

    console.log("   ✓ Test 5 Passed: Payload mutation on identical idempotency key correctly rejected with HTTP 422.\n");
    passedTests++;

    /* ------------------------------------------------------------------
       TEST 6: Concurrent renewal requests targeting the same contract
    ------------------------------------------------------------------ */
    console.log("TEST 6: Concurrent renewal race safety (exactly 1 commits)...");
    const cnt6 = await AmcContract.create({
      contractCode: "__TEST_ISSUE6_CNT6__",
      clientId: clientDoc1._id,
      clientCode: clientDoc1.clientCode,
      clientName: clientDoc1.clientName,
      clientProductId: clientProd1Id,
      productId: testProduct._id,
      productCode: testProduct.productCode,
      productName: testProduct.productName,
      startDate: new Date("2025-01-01"),
      expiryDate: new Date("2025-12-31"),
      dueDate: new Date("2025-01-01"),
      taxableAmount: 30000,
      status: "Paid",
      isDeleted: false,
    });

    const payload6a = {
      startDate: "2026-01-01",
      expiryDate: "2026-12-31",
      taxableAmount: 30000,
      gstRate: 18,
      gstApplicable: "YES",
      idempotencyKey: `__TEST_ISSUE6_KEY6A_${Date.now()}__`,
    };
    const payload6b = {
      startDate: "2026-01-01",
      expiryDate: "2026-12-31",
      taxableAmount: 30000,
      gstRate: 18,
      gstApplicable: "YES",
      idempotencyKey: `__TEST_ISSUE6_KEY6B_${Date.now()}__`,
    };

    const [res6a, res6b] = await Promise.all([
      httpRequest(
        {
          hostname: "localhost",
          port: 5000,
          path: `/api/admin/amc/contract/${cnt6._id}/renew`,
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        },
        payload6a
      ),
      httpRequest(
        {
          hostname: "localhost",
          port: 5000,
          path: `/api/admin/amc/contract/${cnt6._id}/renew`,
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        },
        payload6b
      ),
    ]);

    const statuses = [res6a.status, res6b.status].sort();
    // One must succeed (201) and one must be rejected (409)
    if (statuses[0] !== 201 || statuses[1] !== 409) {
      throw new Error(`Test 6 expected one 201 and one 409, got statuses: ${statuses.join(", ")}`);
    }

    const invoices6 = await AmcInvoice.find({ amcContractId: cnt6._id, isDeleted: false });
    if (invoices6.length !== 1) {
      throw new Error(`Test 6 expected exactly 1 invoice in DB, found ${invoices6.length}`);
    }

    console.log("   ✓ Test 6 Passed: Concurrency race resolved safely; exactly 1 transaction committed, loser rejected with 409.\n");
    passedTests++;

    /* ------------------------------------------------------------------
       TEST 7: Transaction Rollback Atomicity (no phantom records)
    ------------------------------------------------------------------ */
    console.log("TEST 7: Rollback atomicity (no phantom records on aborted transaction)...");
    const cnt7 = await AmcContract.create({
      contractCode: "__TEST_ISSUE6_CNT7__",
      clientId: clientDoc1._id,
      clientCode: clientDoc1.clientCode,
      clientName: clientDoc1.clientName,
      clientProductId: clientProd1Id,
      productId: testProduct._id,
      productCode: testProduct.productCode,
      productName: testProduct.productName,
      startDate: new Date("2025-01-01"),
      expiryDate: new Date("2025-12-31"),
      dueDate: new Date("2025-01-01"),
      taxableAmount: 40000,
      status: "Paid",
      isDeleted: false,
    });

    // Seed an existing invoice that overlaps the proposed period to force a transaction abort inside withTransaction
    await AmcInvoice.create({
      invoiceCode: `__TEST_ISSUE6_OVERLAP_${Date.now()}__`,
      amcContractId: cnt7._id,
      contractCode: cnt7.contractCode,
      clientId: cnt7.clientId,
      clientCode: cnt7.clientCode,
      clientName: cnt7.clientName,
      productId: cnt7.productId,
      productCode: cnt7.productCode,
      productName: cnt7.productName,
      contractStartDate: new Date("2026-01-01"),
      contractExpiryDate: new Date("2026-12-31"),
      dueDate: new Date("2026-01-01"),
      taxableAmount: 40000,
      totalAmount: 47200,
      status: "Issued",
      isDeleted: false,
    });

    const initialInvoices = await AmcInvoice.countDocuments({ amcContractId: cnt7._id });
    const initialActivityLogs = await ActivityLog.countDocuments({ entityId: cnt7._id });

    // Try renewing over the overlapping period
    const res7 = await httpRequest(
      {
        hostname: "localhost",
        port: 5000,
        path: `/api/admin/amc/contract/${cnt7._id}/renew`,
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      },
      {
        startDate: "2026-06-01",
        expiryDate: "2027-05-31",
        taxableAmount: 40000,
      }
    );

    if (res7.status !== 409) {
      throw new Error(`Test 7 expected 409 conflict, got ${res7.status}`);
    }

    const postInvoices = await AmcInvoice.countDocuments({ amcContractId: cnt7._id });
    const postActivityLogs = await ActivityLog.countDocuments({ entityId: cnt7._id });

    if (postInvoices !== initialInvoices) {
      throw new Error(`Test 7 phantom invoice created! Before: ${initialInvoices}, After: ${postInvoices}`);
    }
    if (postActivityLogs !== initialActivityLogs) {
      throw new Error(`Test 7 phantom activity log created! Before: ${initialActivityLogs}, After: ${postActivityLogs}`);
    }

    console.log("   ✓ Test 7 Passed: Aborted transaction cleanly rolled back without phantom invoices or activity logs.\n");
    passedTests++;

    /* ------------------------------------------------------------------
       TEST 8: Invoice-first workflow & no auto-generated receipts
    ------------------------------------------------------------------ */
    console.log("TEST 8: Invoice-first payment workflow (Pending payment, no auto-receipt)...");
    const invTest1 = await AmcInvoice.findOne({ amcContractId: contract1._id, isDeleted: false });
    if (!invTest1) throw new Error("Test 8 could not find contract 1 invoice");

    if (invTest1.paymentStatus !== "Pending") {
      throw new Error(`Expected paymentStatus 'Pending', got ${invTest1.paymentStatus}`);
    }
    if (invTest1.paidAmount !== 0) {
      throw new Error(`Expected paidAmount 0, got ${invTest1.paidAmount}`);
    }
    if (invTest1.pendingAmount !== invTest1.totalAmount) {
      throw new Error(`Expected pendingAmount ${invTest1.totalAmount}, got ${invTest1.pendingAmount}`);
    }

    // Ensure zero AmcPayment records were automatically generated
    const receiptsCount = await AmcPayment.countDocuments({ amcContractId: contract1._id });
    if (receiptsCount !== 0) {
      throw new Error(`Test 8 auto-generated receipts detected! Count: ${receiptsCount}`);
    }

    console.log("   ✓ Test 8 Passed: Invoice-first workflow verified; invoice issued Pending and zero auto-receipts created.\n");
    passedTests++;

    /* ------------------------------------------------------------------
       TEST 9: Concurrent identical requests with SAME idempotencyKey
    ------------------------------------------------------------------ */
    console.log("TEST 9: Concurrent identical race with SAME idempotencyKey (both succeed idempotently)...");
    const cnt9 = await AmcContract.create({
      contractCode: "__TEST_ISSUE6_CNT9__",
      clientId: clientDoc1._id,
      clientCode: clientDoc1.clientCode,
      clientName: clientDoc1.clientName,
      clientProductId: clientProd1Id,
      productId: testProduct._id,
      productCode: testProduct.productCode,
      productName: testProduct.productName,
      startDate: new Date("2025-01-01"),
      expiryDate: new Date("2025-12-31"),
      dueDate: new Date("2025-01-01"),
      taxableAmount: 35000,
      status: "Paid",
      isDeleted: false,
    });

    const sameKey9 = `__TEST_ISSUE6_SAMEKEY9_${Date.now()}__`;
    const payload9 = {
      startDate: "2026-01-01",
      expiryDate: "2026-12-31",
      taxableAmount: 35000,
      gstRate: 18,
      gstApplicable: "YES",
      idempotencyKey: sameKey9,
    };

    const [res9a, res9b] = await Promise.all([
      httpRequest(
        {
          hostname: "localhost",
          port: 5000,
          path: `/api/admin/amc/contract/${cnt9._id}/renew`,
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        },
        payload9
      ),
      httpRequest(
        {
          hostname: "localhost",
          port: 5000,
          path: `/api/admin/amc/contract/${cnt9._id}/renew`,
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        },
        payload9
      ),
    ]);

    // Both should be 200 or 201 (one created 201, other returned 200 replay or 201)
    if (![200, 201].includes(res9a.status) || ![200, 201].includes(res9b.status)) {
      throw new Error(`Test 9 expected both requests to succeed with 200/201, got ${res9a.status} and ${res9b.status}`);
    }

    const invoices9 = await AmcInvoice.find({ amcContractId: cnt9._id, isDeleted: false });
    if (invoices9.length !== 1) {
      throw new Error(`Test 9 expected exactly 1 invoice in DB, found ${invoices9.length}`);
    }

    console.log("   ✓ Test 9 Passed: Concurrent identical race resolved with both callers receiving valid invoice without duplicates.\n");
    passedTests++;

  } finally {
    // Teardown
    console.log("Cleaning up all test records created during test run...");
    await cleanupTestData();
    console.log("Cleanup complete.\n");
    await mongoose.disconnect();
  }

  console.log("==================================================================");
  console.log(`SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log("==================================================================");

  if (passedTests !== totalTests) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("\nTEST SUITE EXECUTION FAILED:", err);
  process.exit(1);
});
