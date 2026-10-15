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
  console.log("ISSUE 7 TEST SUITE: BILLING, PAYMENTS & FINANCIAL DATA INTEGRITY");
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
  const ProductSale = mongoose.models.ProductSale || mongoose.model("ProductSale", new mongoose.Schema({}, { strict: false }), "productsales");
  const ProductSalePayment = mongoose.models.ProductSalePayment || mongoose.model("ProductSalePayment", new mongoose.Schema({}, { strict: false }), "productsalepayments");
  const ActivityLog = mongoose.models.ActivityLog || mongoose.model("ActivityLog", new mongoose.Schema({}, { strict: false }), "activitylogs");
  const IdempotencyLog = mongoose.models.IdempotencyLog || mongoose.model("IdempotencyLog", new mongoose.Schema({}, { strict: false }), "idempotencylogs");

  // Cleanup any lingering artifacts from previous runs
  async function cleanupTestData() {
    await Client.deleteMany({ clientCode: { $regex: "TEST_ISSUE7", $options: "i" } });
    await AmcContract.deleteMany({ contractCode: { $regex: "TEST_ISSUE7", $options: "i" } });
    await AmcInvoice.deleteMany({ contractCode: { $regex: "TEST_ISSUE7", $options: "i" } });
    await AmcPayment.deleteMany({ contractCode: { $regex: "TEST_ISSUE7", $options: "i" } });
    await ProductSale.deleteMany({ saleCode: { $regex: "TEST_ISSUE7", $options: "i" } });
    await ProductSalePayment.deleteMany({ saleCode: { $regex: "TEST_ISSUE7", $options: "i" } });
    await ActivityLog.deleteMany({ entityCode: { $regex: "TEST_ISSUE7", $options: "i" } });
    await IdempotencyLog.deleteMany({ idempotencyKey: { $regex: "TEST_ISSUE7", $options: "i" } });
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
  let totalTests = 12;

  try {
    // Shared seed product
    let testProduct = await Product.findOne({ isDeleted: false }).lean();
    if (!testProduct) {
      testProduct = await Product.create({
        productCode: "PROD-TEST-ISSUE7",
        productName: "Issue 7 Test Product",
        isDeleted: false,
      });
    }

    /* ------------------------------------------------------------------
       TEST 1: Normal AMC Payment Recording & Ledger Balance Update
    ------------------------------------------------------------------ */
    console.log("TEST 1: Normal AMC Payment recording and ledger balance update...");
    const clientProd1Id = new mongoose.Types.ObjectId();
    const client1 = await Client.create({
      clientCode: "__TEST_ISSUE7_C1__",
      companyName: "Issue 7 Test Company 1",
      clientName: "Issue 7 Contact 1",
      state: "Maharashtra",
      amcStatus: "Pending",
      products: [{
        _id: clientProd1Id,
        productId: testProduct._id,
        productCode: testProduct.productCode,
        productName: testProduct.productName,
        amcStatus: "Pending",
      }],
    });

    const contract1 = await AmcContract.create({
      contractCode: "AMC-TEST_ISSUE7-001",
      clientId: client1._id,
      clientCode: client1.clientCode,
      clientName: client1.companyName,
      clientProductId: clientProd1Id,
      productId: testProduct._id,
      productCode: testProduct.productCode,
      productName: testProduct.productName,
      plan: "Standard",
      startDate: new Date("2026-01-01"),
      expiryDate: new Date("2026-12-31"),
      dueDate: new Date("2026-01-15"),
      taxableAmount: 10000,
      cgstRate: 9,
      cgstAmount: 900,
      sgstRate: 9,
      sgstAmount: 900,
      igstRate: 0,
      igstAmount: 0,
      totalTaxAmount: 1800,
      totalAmount: 11800,
      paidAmount: 0,
      pendingAmount: 11800,
      status: "Pending",
      isDeleted: false,
    });

    const invoice1 = await AmcInvoice.create({
      invoiceCode: "AMC-INV-2026-TEST_ISSUE7-001",
      invoiceDate: new Date(),
      invoiceType: "Initial",
      amcContractId: contract1._id,
      contractCode: contract1.contractCode,
      contractStartDate: contract1.startDate,
      contractExpiryDate: contract1.expiryDate,
      dueDate: contract1.dueDate,
      clientId: client1._id,
      clientCode: client1.clientCode,
      clientName: client1.companyName,
      clientProductId: clientProd1Id,
      productId: testProduct._id,
      productCode: testProduct.productCode,
      productName: testProduct.productName,
      taxableAmount: 10000,
      cgstRate: 9,
      cgstAmount: 900,
      sgstRate: 9,
      sgstAmount: 900,
      totalTaxAmount: 1800,
      totalAmount: 11800,
      paidAmount: 0,
      pendingAmount: 11800,
      paymentStatus: "Pending",
      status: "Issued",
      isDeleted: false,
    });

    contract1.currentInvoiceId = invoice1._id;
    contract1.currentInvoiceCode = invoice1.invoiceCode;
    await contract1.save();

    const payRes1 = await httpRequest({
      hostname: "localhost",
      port: 5000,
      path: "/api/admin/amc/payment",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
    }, {
      amcInvoiceId: invoice1._id.toString(),
      amount: 11800,
      paymentDate: "2026-01-10",
      mode: "Bank Transfer",
      referenceNo: "NEFT-TEST-001",
      notes: "Full payment test",
    });

    if (payRes1.status === 201 && payRes1.body.success) {
      const invCheck = await AmcInvoice.findById(invoice1._id);
      const contCheck = await AmcContract.findById(contract1._id);
      const clientCheck = await Client.findById(client1._id);

      if (
        invCheck.paidAmount === 11800 &&
        invCheck.pendingAmount === 0 &&
        invCheck.paymentStatus === "Paid" &&
        contCheck.paidAmount === 11800 &&
        contCheck.pendingAmount === 0 &&
        contCheck.status === "Paid" &&
        clientCheck.amcStatus === "Paid" &&
        clientCheck.products[0].amcStatus === "Paid"
      ) {
        console.log("  [PASS] Full AMC payment recorded, invoice & contract & client status set to 'Paid' with 0 pending.");
        passedTests++;
      } else {
        console.error("  [FAIL] Inconsistent balances after full payment:", { clientCheck, invCheckStatus: invCheck.paymentStatus, contCheckStatus: contCheck.status });
      }
    } else {
      console.error("  [FAIL] AMC payment request failed:", payRes1.body);
    }

    /* ------------------------------------------------------------------
       TEST 2: Partial AMC Payments in Installments (Partially Paid -> Paid)
    ------------------------------------------------------------------ */
    console.log("\nTEST 2: Partial AMC payments across two installments...");
    const clientProd2Id = new mongoose.Types.ObjectId();
    const client2 = await Client.create({
      clientCode: "__TEST_ISSUE7_C2__",
      companyName: "Issue 7 Test Company 2",
      clientName: "Issue 7 Contact 2",
      state: "Maharashtra",
      amcStatus: "Pending",
      products: [{
        _id: clientProd2Id,
        productId: testProduct._id,
        productCode: testProduct.productCode,
        productName: testProduct.productName,
        amcStatus: "Pending",
      }],
    });

    const contract2 = await AmcContract.create({
      contractCode: "AMC-TEST_ISSUE7-002",
      clientId: client2._id,
      clientCode: client2.clientCode,
      clientName: client2.companyName,
      clientProductId: clientProd2Id,
      productId: testProduct._id,
      productCode: testProduct.productCode,
      productName: testProduct.productName,
      plan: "Premium",
      startDate: new Date("2026-01-01"),
      expiryDate: new Date("2026-12-31"),
      dueDate: new Date("2026-01-15"),
      taxableAmount: 20000,
      cgstRate: 9,
      cgstAmount: 1800,
      sgstRate: 9,
      sgstAmount: 1800,
      igstRate: 0,
      igstAmount: 0,
      totalTaxAmount: 3600,
      totalAmount: 23600,
      paidAmount: 0,
      pendingAmount: 23600,
      status: "Pending",
      isDeleted: false,
    });

    const invoice2 = await AmcInvoice.create({
      invoiceCode: "AMC-INV-2026-TEST_ISSUE7-002",
      invoiceDate: new Date(),
      invoiceType: "Initial",
      amcContractId: contract2._id,
      contractCode: contract2.contractCode,
      contractStartDate: contract2.startDate,
      contractExpiryDate: contract2.expiryDate,
      dueDate: contract2.dueDate,
      clientId: client2._id,
      clientCode: client2.clientCode,
      clientName: client2.companyName,
      clientProductId: clientProd2Id,
      productId: testProduct._id,
      productCode: testProduct.productCode,
      productName: testProduct.productName,
      taxableAmount: 20000,
      cgstRate: 9,
      cgstAmount: 1800,
      sgstRate: 9,
      sgstAmount: 1800,
      totalTaxAmount: 3600,
      totalAmount: 23600,
      paidAmount: 0,
      pendingAmount: 23600,
      paymentStatus: "Pending",
      status: "Issued",
      isDeleted: false,
    });

    contract2.currentInvoiceId = invoice2._id;
    contract2.currentInvoiceCode = invoice2.invoiceCode;
    await contract2.save();

    // Installment 1: ₹10,000
    const partRes1 = await httpRequest({
      hostname: "localhost",
      port: 5000,
      path: "/api/admin/amc/payment",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
    }, {
      amcInvoiceId: invoice2._id.toString(),
      amount: 10000,
      paymentDate: "2026-01-10",
      mode: "Bank Transfer",
      referenceNo: "PART-TEST-001",
    });

    const invAfterPart1 = await AmcInvoice.findById(invoice2._id);
    const contAfterPart1 = await AmcContract.findById(contract2._id);

    // Installment 2: ₹13,600
    const partRes2 = await httpRequest({
      hostname: "localhost",
      port: 5000,
      path: "/api/admin/amc/payment",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
    }, {
      amcInvoiceId: invoice2._id.toString(),
      amount: 13600,
      paymentDate: "2026-01-20",
      mode: "UPI",
      referenceNo: "UPI-TEST-002",
    });

    const invAfterPart2 = await AmcInvoice.findById(invoice2._id);
    const contAfterPart2 = await AmcContract.findById(contract2._id);

    if (
      partRes1.status === 201 &&
      invAfterPart1.paidAmount === 10000 &&
      invAfterPart1.pendingAmount === 13600 &&
      invAfterPart1.paymentStatus === "Partially Paid" &&
      contAfterPart1.status === "Partially Paid" &&
      partRes2.status === 201 &&
      invAfterPart2.paidAmount === 23600 &&
      invAfterPart2.pendingAmount === 0 &&
      invAfterPart2.paymentStatus === "Paid" &&
      contAfterPart2.status === "Paid"
    ) {
      console.log("  [PASS] Installment 1 correctly transitioned to 'Partially Paid' (pending ₹13,600); Installment 2 completed to 'Paid' (pending ₹0).");
      passedTests++;
    } else {
      console.error("  [FAIL] Partial payments balance transition incorrect:", { invAfterPart1, invAfterPart2 });
    }

    /* ------------------------------------------------------------------
       TEST 3: Overpayment Prevention (Reject Amount > Pending)
    ------------------------------------------------------------------ */
    console.log("\nTEST 3: Overpayment prevention (reject amount > pending)...");
    const overpayRes = await httpRequest({
      hostname: "localhost",
      port: 5000,
      path: "/api/admin/amc/payment",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
    }, {
      amcInvoiceId: invoice2._id.toString(), // Already fully paid!
      amount: 500,
      paymentDate: "2026-01-25",
      mode: "Cash",
    });

    if (overpayRes.status === 400 && overpayRes.body.message.includes("already fully paid")) {
      console.log("  [PASS] Overpayment on fully paid invoice correctly rejected with HTTP 400.");
      passedTests++;
    } else {
      console.error("  [FAIL] Overpayment was not rejected with 400:", overpayRes);
    }

    /* ------------------------------------------------------------------
       TEST 4: Reference Number Requirement for Bank/UPI/Card/Cheque
    ------------------------------------------------------------------ */
    console.log("\nTEST 4: Reference number requirement for electronic payments...");
    const missingRefRes = await httpRequest({
      hostname: "localhost",
      port: 5000,
      path: "/api/admin/amc/payment",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
    }, {
      amcInvoiceId: invoice1._id.toString(),
      amount: 100,
      paymentDate: "2026-01-25",
      mode: "Bank Transfer",
      referenceNo: "", // Missing reference number!
    });

    if (missingRefRes.status === 400 && missingRefRes.body.message.includes("Reference number is required")) {
      console.log("  [PASS] Electronic payment without reference number correctly rejected with HTTP 400.");
      passedTests++;
    } else {
      console.error("  [FAIL] Missing reference number was not rejected:", missingRefRes);
    }

    /* ------------------------------------------------------------------
       TEST 5: Idempotency Replay on Double-Click / Duplicate Requests
    ------------------------------------------------------------------ */
    console.log("\nTEST 5: Idempotency replay on duplicate request / double-click...");
    const clientProd3Id = new mongoose.Types.ObjectId();
    const client3 = await Client.create({
      clientCode: "__TEST_ISSUE7_C3__",
      companyName: "Issue 7 Test Company 3",
      state: "Maharashtra",
      amcStatus: "Pending",
      products: [{
        _id: clientProd3Id,
        productId: testProduct._id,
        productCode: testProduct.productCode,
        productName: testProduct.productName,
        amcStatus: "Pending",
      }],
    });

    const contract3 = await AmcContract.create({
      contractCode: "AMC-TEST_ISSUE7-003",
      clientId: client3._id,
      clientCode: client3.clientCode,
      clientName: client3.companyName,
      clientProductId: clientProd3Id,
      productId: testProduct._id,
      productCode: testProduct.productCode,
      productName: testProduct.productName,
      plan: "Standard",
      startDate: new Date("2026-01-01"),
      expiryDate: new Date("2026-12-31"),
      dueDate: new Date("2026-01-15"),
      taxableAmount: 10000,
      totalTaxAmount: 1800,
      totalAmount: 11800,
      paidAmount: 0,
      pendingAmount: 11800,
      status: "Pending",
      isDeleted: false,
    });

    const invoice3 = await AmcInvoice.create({
      invoiceCode: "AMC-INV-2026-TEST_ISSUE7-003",
      invoiceDate: new Date(),
      invoiceType: "Initial",
      amcContractId: contract3._id,
      contractCode: contract3.contractCode,
      contractStartDate: contract3.startDate,
      contractExpiryDate: contract3.expiryDate,
      dueDate: contract3.dueDate,
      clientId: client3._id,
      clientCode: client3.clientCode,
      clientName: client3.companyName,
      clientProductId: clientProd3Id,
      productId: testProduct._id,
      productCode: testProduct.productCode,
      productName: testProduct.productName,
      taxableAmount: 10000,
      totalTaxAmount: 1800,
      totalAmount: 11800,
      paidAmount: 0,
      pendingAmount: 11800,
      paymentStatus: "Pending",
      status: "Issued",
      isDeleted: false,
    });

    contract3.currentInvoiceId = invoice3._id;
    contract3.currentInvoiceCode = invoice3.invoiceCode;
    await contract3.save();

    const idempotencyKey1 = `IDEMP_TEST_ISSUE7_${Date.now()}`;

    // Request 1
    const idempReq1 = await httpRequest({
      hostname: "localhost",
      port: 5000,
      path: "/api/admin/amc/payment",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey1,
        Authorization: `Bearer ${adminToken}`,
      },
    }, {
      amcInvoiceId: invoice3._id.toString(),
      amount: 5000,
      paymentDate: "2026-01-10",
      mode: "Cash",
      notes: "First try",
    });

    // Request 2 (Duplicate replay)
    const idempReq2 = await httpRequest({
      hostname: "localhost",
      port: 5000,
      path: "/api/admin/amc/payment",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey1,
        Authorization: `Bearer ${adminToken}`,
      },
    }, {
      amcInvoiceId: invoice3._id.toString(),
      amount: 5000,
      paymentDate: "2026-01-10",
      mode: "Cash",
      notes: "First try",
    });

    const paymentRecordsCount = await AmcPayment.countDocuments({
      amcInvoiceId: invoice3._id,
      isDeleted: false,
    });

    const inv3Check = await AmcInvoice.findById(invoice3._id);

    if (
      idempReq1.status === 201 &&
      idempReq2.status === 200 &&
      idempReq2.body.isReplay === true &&
      paymentRecordsCount === 1 &&
      inv3Check.paidAmount === 5000 &&
      inv3Check.pendingAmount === 6800
    ) {
      console.log("  [PASS] Duplicate request returned HTTP 200 isReplay: true; exactly 1 payment created, no double deduction.");
      passedTests++;
    } else {
      console.error("  [FAIL] Idempotency replay failed:", {
        status1: idempReq1.status,
        status2: idempReq2.status,
        isReplay: idempReq2.body?.isReplay,
        paymentRecordsCount,
        paidAmount: inv3Check.paidAmount,
      });
    }

    /* ------------------------------------------------------------------
       TEST 6: Concurrent AMC Payment Race Safety
    ------------------------------------------------------------------ */
    console.log("\nTEST 6: Concurrent AMC payment race safety (write locking)...");
    const clientProd4Id = new mongoose.Types.ObjectId();
    const client4 = await Client.create({
      clientCode: "__TEST_ISSUE7_C4__",
      companyName: "Issue 7 Test Company 4",
      state: "Maharashtra",
      amcStatus: "Pending",
      products: [{
        _id: clientProd4Id,
        productId: testProduct._id,
        productCode: testProduct.productCode,
        productName: testProduct.productName,
        amcStatus: "Pending",
      }],
    });

    const contract4 = await AmcContract.create({
      contractCode: "AMC-TEST_ISSUE7-004",
      clientId: client4._id,
      clientCode: client4.clientCode,
      clientName: client4.companyName,
      clientProductId: clientProd4Id,
      productId: testProduct._id,
      productCode: testProduct.productCode,
      productName: testProduct.productName,
      plan: "Basic",
      startDate: new Date("2026-01-01"),
      expiryDate: new Date("2026-12-31"),
      dueDate: new Date("2026-01-15"),
      taxableAmount: 10000,
      totalTaxAmount: 1800,
      totalAmount: 11800,
      paidAmount: 0,
      pendingAmount: 11800,
      status: "Pending",
      isDeleted: false,
    });

    const invoice4 = await AmcInvoice.create({
      invoiceCode: "AMC-INV-2026-TEST_ISSUE7-004",
      invoiceDate: new Date(),
      invoiceType: "Initial",
      amcContractId: contract4._id,
      contractCode: contract4.contractCode,
      contractStartDate: contract4.startDate,
      contractExpiryDate: contract4.expiryDate,
      dueDate: contract4.dueDate,
      clientId: client4._id,
      clientCode: client4.clientCode,
      clientName: client4.companyName,
      clientProductId: clientProd4Id,
      productId: testProduct._id,
      productCode: testProduct.productCode,
      productName: testProduct.productName,
      taxableAmount: 10000,
      totalTaxAmount: 1800,
      totalAmount: 11800,
      paidAmount: 0,
      pendingAmount: 11800,
      paymentStatus: "Pending",
      status: "Issued",
      isDeleted: false,
    });

    contract4.currentInvoiceId = invoice4._id;
    contract4.currentInvoiceCode = invoice4.invoiceCode;
    await contract4.save();

    // Two concurrent payments of ₹7,000 each against an ₹11,800 invoice (Sum = ₹14,000 > ₹11,800)
    // One MUST succeed and one MUST fail with 400 (exceeds pending amount)!
    const [raceRes1, raceRes2] = await Promise.all([
      httpRequest({
        hostname: "localhost",
        port: 5000,
        path: "/api/admin/amc/payment",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      }, {
        amcInvoiceId: invoice4._id.toString(),
        amount: 7000,
        paymentDate: "2026-01-10",
        mode: "Cash",
      }),
      httpRequest({
        hostname: "localhost",
        port: 5000,
        path: "/api/admin/amc/payment",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      }, {
        amcInvoiceId: invoice4._id.toString(),
        amount: 7000,
        paymentDate: "2026-01-10",
        mode: "Cash",
      }),
    ]);

    const statuses = [raceRes1.status, raceRes2.status].sort();
    const inv4Check = await AmcInvoice.findById(invoice4._id);

    if (
      statuses[0] === 201 &&
      statuses[1] === 400 &&
      inv4Check.paidAmount === 7000 &&
      inv4Check.pendingAmount === 4800
    ) {
      console.log("  [PASS] Concurrent race serialized correctly: one payment succeeded (201) and one rejected (400); no overpayment occurred.");
      passedTests++;
    } else {
      console.error("  [FAIL] Concurrent race condition failure:", { statuses, paidAmount: inv4Check.paidAmount });
    }

    /* ------------------------------------------------------------------
       TEST 7: Normal ProductSale Payment in ACID Transaction
    ------------------------------------------------------------------ */
    console.log("\nTEST 7: Normal ProductSale payment in ACID transaction...");
    const client5 = await Client.create({
      clientCode: "__TEST_ISSUE7_C5__",
      companyName: "Issue 7 Test Company 5",
      state: "Maharashtra",
      products: [],
    });

    const sale1 = await ProductSale.create({
      saleCode: "SAL-TEST_ISSUE7-001",
      saleNumber: 9901,
      invoiceNo: "INV-TEST_ISSUE7-001",
      clientId: client5._id,
      clientCode: client5.clientCode,
      clientName: client5.companyName,
      items: [{
        productId: testProduct._id,
        productCode: testProduct.productCode,
        productName: testProduct.productName,
        quantity: 1,
        rate: 5000,
        grossAmount: 5000,
        taxableAmount: 5000,
        cgstAmount: 450,
        sgstAmount: 450,
        totalAmount: 5900,
      }],
      grossAmount: 5000,
      taxableAmount: 5000,
      cgstAmount: 450,
      sgstAmount: 450,
      totalAmount: 5900,
      paidAmount: 0,
      pendingAmount: 5900,
      paymentStatus: "Unpaid",
      status: "Confirmed",
      isDeleted: false,
    });

    const salePayRes1 = await httpRequest({
      hostname: "localhost",
      port: 5000,
      path: `/api/admin/product-sales/${sale1._id}/payment`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
    }, {
      amount: 5900,
      paymentDate: "2026-02-01",
      mode: "Bank Transfer",
      referenceNo: "SALE-REF-001",
    });

    const sale1Check = await ProductSale.findById(sale1._id);

    if (
      salePayRes1.status === 201 &&
      sale1Check.paidAmount === 5900 &&
      sale1Check.pendingAmount === 0 &&
      sale1Check.paymentStatus === "Paid"
    ) {
      console.log("  [PASS] ProductSale payment recorded atomically, status transitioned to 'Paid' with 0 pending.");
      passedTests++;
    } else {
      console.error("  [FAIL] ProductSale payment failed:", { status: salePayRes1.status, body: salePayRes1.body, sale1Check });
    }

    /* ------------------------------------------------------------------
       TEST 8: ProductSale Payment Idempotency Replay
    ------------------------------------------------------------------ */
    console.log("\nTEST 8: ProductSale payment idempotency replay...");
    const sale2 = await ProductSale.create({
      saleCode: "SAL-TEST_ISSUE7-002",
      saleNumber: 9902,
      invoiceNo: "INV-TEST_ISSUE7-002",
      clientId: client5._id,
      clientCode: client5.clientCode,
      clientName: client5.companyName,
      items: [{
        productId: testProduct._id,
        productCode: testProduct.productCode,
        productName: testProduct.productName,
        quantity: 1,
        rate: 8000,
        grossAmount: 8000,
        taxableAmount: 8000,
        cgstAmount: 720,
        sgstAmount: 720,
        totalAmount: 9440,
      }],
      grossAmount: 8000,
      taxableAmount: 8000,
      cgstAmount: 720,
      sgstAmount: 720,
      totalAmount: 9440,
      paidAmount: 0,
      pendingAmount: 9440,
      paymentStatus: "Unpaid",
      status: "Confirmed",
      isDeleted: false,
    });

    const saleIdempKey = `SALE_IDEMP_TEST_ISSUE7_${Date.now()}`;

    const saleIdemp1 = await httpRequest({
      hostname: "localhost",
      port: 5000,
      path: `/api/admin/product-sales/${sale2._id}/payment`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": saleIdempKey,
        Authorization: `Bearer ${adminToken}`,
      },
    }, {
      amount: 4000,
      paymentDate: "2026-02-05",
      mode: "Cash",
    });

    const saleIdemp2 = await httpRequest({
      hostname: "localhost",
      port: 5000,
      path: `/api/admin/product-sales/${sale2._id}/payment`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": saleIdempKey,
        Authorization: `Bearer ${adminToken}`,
      },
    }, {
      amount: 4000,
      paymentDate: "2026-02-05",
      mode: "Cash",
    });

    const salePaymentCount = await ProductSalePayment.countDocuments({
      productSaleId: sale2._id,
      isDeleted: { $ne: true },
    });

    const sale2Check = await ProductSale.findById(sale2._id);

    if (
      saleIdemp1.status === 201 &&
      saleIdemp2.status === 200 &&
      saleIdemp2.body.isReplay === true &&
      salePaymentCount === 1 &&
      sale2Check.paidAmount === 4000 &&
      sale2Check.pendingAmount === 5440
    ) {
      console.log("  [PASS] ProductSale payment duplicate returned HTTP 200 isReplay: true; exactly 1 payment record created.");
      passedTests++;
    } else {
      console.error("  [FAIL] ProductSale payment idempotency failed:", {
        status1: saleIdemp1.status,
        status2: saleIdemp2.status,
        salePaymentCount,
      });
    }

    /* ------------------------------------------------------------------
       TEST 9: Concurrent ProductSale Payments Race Prevention
    ------------------------------------------------------------------ */
    console.log("\nTEST 9: Concurrent ProductSale payments race prevention...");
    const sale3 = await ProductSale.create({
      saleCode: "SAL-TEST_ISSUE7-003",
      saleNumber: 9903,
      invoiceNo: "INV-TEST_ISSUE7-003",
      clientId: client5._id,
      clientCode: client5.clientCode,
      clientName: client5.companyName,
      items: [{
        productId: testProduct._id,
        productCode: testProduct.productCode,
        productName: testProduct.productName,
        quantity: 1,
        rate: 10000,
        grossAmount: 10000,
        taxableAmount: 10000,
        cgstAmount: 900,
        sgstAmount: 900,
        totalAmount: 11800,
      }],
      grossAmount: 10000,
      taxableAmount: 10000,
      cgstAmount: 900,
      sgstAmount: 900,
      totalAmount: 11800,
      paidAmount: 0,
      pendingAmount: 11800,
      paymentStatus: "Unpaid",
      status: "Confirmed",
      isDeleted: false,
    });

    const [saleRace1, saleRace2] = await Promise.all([
      httpRequest({
        hostname: "localhost",
        port: 5000,
        path: `/api/admin/product-sales/${sale3._id}/payment`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      }, {
        amount: 8000,
        paymentDate: "2026-02-10",
        mode: "Cash",
      }),
      httpRequest({
        hostname: "localhost",
        port: 5000,
        path: `/api/admin/product-sales/${sale3._id}/payment`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      }, {
        amount: 8000,
        paymentDate: "2026-02-10",
        mode: "Cash",
      }),
    ]);

    const saleRaceStatuses = [saleRace1.status, saleRace2.status].sort();
    const sale3Check = await ProductSale.findById(sale3._id);

    if (
      saleRaceStatuses[0] === 201 &&
      saleRaceStatuses[1] === 400 &&
      sale3Check.paidAmount === 8000 &&
      sale3Check.pendingAmount === 3800
    ) {
      console.log("  [PASS] ProductSale concurrent race handled atomically: 1 succeeded (201), 1 rejected (400); no overpayment.");
      passedTests++;
    } else {
      console.error("  [FAIL] ProductSale concurrent race failed:", { saleRaceStatuses, paidAmount: sale3Check.paidAmount });
    }

    /* ------------------------------------------------------------------
       TEST 10: Contract Deletion Blocked When Active Payments Exist
    ------------------------------------------------------------------ */
    console.log("\nTEST 10: Contract deletion blocked when active payments exist...");
    // contract1 already has payments recorded in Test 1!
    const delRes = await httpRequest({
      hostname: "localhost",
      port: 5000,
      path: `/api/admin/amc/contract/${contract1._id}`,
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    if (delRes.status === 400 && delRes.body.message.includes("Cannot delete an AMC contract that already has recorded payments")) {
      console.log("  [PASS] Deletion of contract with recorded payments correctly blocked with HTTP 400.");
      passedTests++;
    } else {
      console.error("  [FAIL] Contract deletion was not blocked:", delRes);
    }

    /* ------------------------------------------------------------------
       TEST 11: Contract Status Cancellation Blocked When Active Payments Exist
    ------------------------------------------------------------------ */
    console.log("\nTEST 11: Contract status cancellation blocked when active payments exist...");
    const cancelRes = await httpRequest({
      hostname: "localhost",
      port: 5000,
      path: `/api/admin/amc/contract/${contract1._id}`,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
    }, {
      status: "Cancelled",
    });

    if (cancelRes.status === 400 && cancelRes.body.message.includes("Cannot cancel an AMC contract that already has recorded payments")) {
      console.log("  [PASS] Updating status to 'Cancelled' on paid contract correctly blocked with HTTP 400.");
      passedTests++;
    } else {
      console.error("  [FAIL] Contract cancellation was not blocked:", cancelRes);
    }

    /* ------------------------------------------------------------------
       TEST 12: Cancelled Invoice / ProductSale Cannot Accept Payments
    ------------------------------------------------------------------ */
    console.log("\nTEST 12: Cancelled entities cannot accept payments...");
    const saleCancelled = await ProductSale.create({
      saleCode: "SAL-TEST_ISSUE7-004",
      saleNumber: 9904,
      invoiceNo: "INV-TEST_ISSUE7-004",
      clientId: client5._id,
      clientCode: client5.clientCode,
      clientName: client5.companyName,
      items: [{
        productId: testProduct._id,
        productCode: testProduct.productCode,
        productName: testProduct.productName,
        quantity: 1,
        rate: 2000,
        grossAmount: 2000,
        taxableAmount: 2000,
        totalAmount: 2360,
      }],
      grossAmount: 2000,
      taxableAmount: 2000,
      totalAmount: 2360,
      paidAmount: 0,
      pendingAmount: 2360,
      paymentStatus: "Unpaid",
      status: "Cancelled",
      isDeleted: false,
    });

    const payCancelledRes = await httpRequest({
      hostname: "localhost",
      port: 5000,
      path: `/api/admin/product-sales/${saleCancelled._id}/payment`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
    }, {
      amount: 1000,
      paymentDate: "2026-02-12",
      mode: "Cash",
    });

    if (payCancelledRes.status === 400 && payCancelledRes.body.message.includes("cancelled")) {
      console.log("  [PASS] Payment on cancelled sale rejected with HTTP 400.");
      passedTests++;
    } else {
      console.error("  [FAIL] Payment on cancelled sale was not rejected:", payCancelledRes);
    }

  } finally {
    console.log("\nTearing down test data...");
    await cleanupTestData();
    console.log("All test data cleaned up.\n");
    await mongoose.disconnect();
  }

  console.log("==================================================================");
  console.log(`TOTAL PASSED: ${passedTests} / ${totalTests}`);
  console.log("==================================================================");

  if (passedTests === totalTests) {
    console.log("\nALL ISSUE 7 FINANCIAL INTEGRITY TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
  } else {
    console.error(`\n${totalTests - passedTests} TESTS FAILED.`);
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed with error:", err);
  process.exit(1);
});
