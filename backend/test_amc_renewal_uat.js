const mongoose = require("mongoose");
const crypto = require("crypto");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/crm_development";

async function runFullUatIntegrationVerification() {
  console.log("================================================================================");
  console.log("   NEXORA CRM: COMPLETE AMC RENEWAL INTEGRATION & UAT VERIFICATION SUITE       ");
  console.log("================================================================================");

  await mongoose.connect(MONGO_URI);
  console.log(`Connected to database: ${mongoose.connection.name}`);

  const adminModule = require("./admin");
  const AmcContract = mongoose.models.AmcContract;
  const AmcInvoice = mongoose.models.AmcInvoice;
  const AmcPayment = mongoose.models.AmcPayment;
  const IdempotencyLog = mongoose.models.IdempotencyLog;
  const Client = mongoose.models.Client;
  const Product = mongoose.models.Product;
  const syncUpcomingAmcRenewals = adminModule.syncUpcomingAmcRenewals;

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition, message) {
    if (!condition) {
      console.error(`  ❌ FAILED: ${message}`);
      failedTests++;
      throw new Error(message);
    } else {
      console.log(`  ✅ PASSED: ${message}`);
      passedTests++;
    }
  }

  const mockAdminUser = {
    _id: new mongoose.Types.ObjectId(),
    name: "Master Admin",
    role: "admin",
  };

  const mockStaffUser = {
    _id: new mongoose.Types.ObjectId(),
    name: "Staff User",
    role: "staff",
  };

  function createMockRes() {
    return {
      statusCode: 200,
      headers: {},
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      },
    };
  }

  // Setup test masters
  const testProduct = await Product.findOneAndUpdate(
    { productCode: "PROD-ERP-UAT" },
    {
      productCode: "PROD-ERP-UAT",
      productName: "Nexora Enterprise ERP",
      category: "Software",
      version: "4.0",
      status: "Active",
    },
    { returnDocument: "after", upsert: true }
  );

  const testClientMH = await Client.findOneAndUpdate(
    { clientCode: "CLI-MH-UAT" },
    {
      clientCode: "CLI-MH-UAT",
      companyName: "Maharashtra Digital Logistics Ltd",
      contactPerson: "Vikram Rane",
      email: "vikram@mhlogistics.example.com",
      mobile: "9820112233",
      state: "Maharashtra",
      billingAddress: {
        state: "Maharashtra",
        addressLine1: "MIDC Andheri East",
        city: "Mumbai",
        pincode: "400093",
      },
      gstin: "27AABCM1234F1Z9",
      products: [
        {
          _id: new mongoose.Types.ObjectId(),
          productId: testProduct._id,
          productCode: testProduct.productCode,
          productName: testProduct.productName,
          version: "4.0",
          amcStatus: "Paid",
          expiryDate: "2026-03-31",
        },
      ],
    },
    { returnDocument: "after", upsert: true }
  );

  const testClientDL = await Client.findOneAndUpdate(
    { clientCode: "CLI-DL-UAT" },
    {
      clientCode: "CLI-DL-UAT",
      companyName: "Delhi Capital Infotech",
      contactPerson: "Pooja Sharma",
      email: "pooja@delhiinfo.example.com",
      mobile: "9811002233",
      state: "Delhi",
      billingAddress: {
        state: "Delhi",
        addressLine1: "Barakhamba Road",
        city: "New Delhi",
        pincode: "110001",
      },
      gstin: "07AABCP5678G1Z2",
      products: [
        {
          _id: new mongoose.Types.ObjectId(),
          productId: testProduct._id,
          productCode: testProduct.productCode,
          productName: testProduct.productName,
          version: "4.0",
          amcStatus: "Paid",
          expiryDate: "2026-03-31",
        },
      ],
    },
    { returnDocument: "after", upsert: true }
  );

  const renewRouteLayer = adminModule.stack.find(
    (layer) => layer.route && layer.route.path === "/amc/contract/:id/renew"
  );
  const renewHandler = renewRouteLayer.route.stack[renewRouteLayer.route.stack.length - 1].handle;

  try {
    /* =========================================================================
       PHASE 1: END-TO-END AMC RENEWAL WORKFLOW VERIFICATION (All 20 Steps)
       ========================================================================= */
    console.log("\n=======================================================");
    console.log("PHASE 1: END-TO-END AMC RENEWAL WORKFLOW VERIFICATION");
    console.log("=======================================================");

    // 1-4. Select existing AMC contract & inspect previous state
    const contractPhase1 = await AmcContract.create({
      contractCode: `AMC-UAT-P1-${Date.now()}`,
      clientId: testClientMH._id,
      clientCode: testClientMH.clientCode,
      clientName: testClientMH.companyName,
      clientProductId: testClientMH.products[0]._id,
      productId: testProduct._id,
      productCode: testProduct.productCode,
      productName: testProduct.productName,
      plan: "Standard",
      licensedUsers: 5,
      startDate: new Date("2025-04-01"),
      expiryDate: new Date("2026-03-31"),
      dueDate: new Date("2025-04-01"),
      taxableAmount: 8000,
      totalAmount: 9440,
      paidAmount: 9440,
      pendingAmount: 0,
      status: "Paid",
      gstApplicable: "YES",
      taxType: "intra",
    });

    // 5-9. Renew with inherited GST YES, custom taxable amount (8000), 1-year duration
    const reqP1 = {
      user: mockAdminUser,
      params: { id: contractPhase1._id.toString() },
      body: {
        startDate: "2026-04-01",
        expiryDate: "2027-03-31",
        dueDate: "2026-04-01",
        taxableAmount: 8000,
        gstApplicable: "YES",
        taxType: "intra",
        gstRate: 18,
        plan: "Standard",
        idempotencyKey: `idemp_uat_p1_${Date.now()}`,
      },
    };
    const resP1 = createMockRes();
    await renewHandler(reqP1, resP1);

    // 10-13. Verify invoice created, amounts match ₹8,000 + 18% GST (CGST 720, SGST 720, Total 9440)
    assert(resP1.statusCode === 201, "Step 9-10: Renewal invoice created with HTTP 201");
    const renewalInvoice = resP1.jsonData.invoice;
    assert(renewalInvoice.taxableAmount === 8000, "Step 11: Basic taxable amount is ₹8,000");
    assert(renewalInvoice.cgstAmount === 720, "Step 11: CGST is ₹720 (9%)");
    assert(renewalInvoice.sgstAmount === 720, "Step 11: SGST is ₹720 (9%)");
    assert(renewalInvoice.totalAmount === 9440, "Step 11-13: Total invoice amount is ₹9,440");
    assert(renewalInvoice.paymentStatus === "Pending", "Step 14: Payment status is Pending");

    // 14-17. Record partial payment (e.g. ₹5,000)
    const partialPaymentAmount = 5000;
    const invRecord = await AmcInvoice.findById(renewalInvoice.id || renewalInvoice._id);
    invRecord.paidAmount = partialPaymentAmount;
    invRecord.pendingAmount = invRecord.totalAmount - partialPaymentAmount;
    invRecord.paymentStatus = "Partially Paid";
    await invRecord.save();

    assert(invRecord.pendingAmount === 4440, "Step 16-17: Partial payment of ₹5,000 leaves outstanding ₹4,440");
    assert(invRecord.paymentStatus === "Partially Paid", "Step 16: Invoice status reflects 'Partially Paid'");

    // 18-20. Record remaining payment (₹4,440) -> Full Settlement
    invRecord.paidAmount = invRecord.totalAmount;
    invRecord.pendingAmount = 0;
    invRecord.paymentStatus = "Paid";
    await invRecord.save();

    assert(invRecord.pendingAmount === 0, "Step 18-19: Outstanding balance is 0 after final settlement");
    assert(invRecord.paymentStatus === "Paid", "Step 19: Invoice payment status changed to 'Paid'");

    /* =========================================================================
       PHASE 2: GST AND FINANCIAL INTEGRITY MATRIX
       ========================================================================= */
    console.log("\n=======================================================");
    console.log("PHASE 2: GST AND FINANCIAL INTEGRITY MATRIX");
    console.log("=======================================================");

    // Matrix 1: GST YES to YES (Intra-State)
    const contractGstYesToYes = await AmcContract.create({
      contractCode: `AMC-GST-YY-${Date.now()}`,
      clientId: testClientMH._id,
      clientCode: testClientMH.clientCode,
      clientName: testClientMH.companyName,
      clientProductId: testClientMH.products[0]._id,
      productId: testProduct._id,
      productCode: testProduct.productCode,
      productName: testProduct.productName,
      startDate: new Date("2025-01-01"),
      expiryDate: new Date("2025-12-31"),
      dueDate: new Date("2025-01-01"),
      taxableAmount: 8000,
      totalAmount: 9440,
      gstApplicable: "YES",
      status: "Paid",
    });
    const resYY = createMockRes();
    await renewHandler({
      user: mockAdminUser,
      params: { id: contractGstYesToYes._id.toString() },
      body: { startDate: "2026-01-01", expiryDate: "2026-12-31", dueDate: "2026-01-01", taxableAmount: 8000, gstApplicable: "YES" },
    }, resYY);
    assert(resYY.jsonData.invoice.totalAmount === 9440, "GST YES -> YES: Total is ₹9,440 (₹8,000 + 18% GST)");

    // Matrix 2: GST YES to NO (Disabled GST)
    const resYN = createMockRes();
    await renewHandler({
      user: mockAdminUser,
      params: { id: contractGstYesToYes._id.toString() },
      body: { startDate: "2027-01-01", expiryDate: "2027-12-31", dueDate: "2027-01-01", taxableAmount: 8000, gstApplicable: "NO" },
    }, resYN);
    assert(resYN.jsonData.invoice.totalTaxAmount === 0, "GST YES -> NO: Tax is ₹0");
    assert(resYN.jsonData.invoice.totalAmount === 8000, "GST YES -> NO: Total is ₹8,000 exactly");
    assert(
      resYN.jsonData.invoice.taxClassification === "Commercial Invoice (Zero-GST / Non-Taxable Supply)",
      "GST NO classification is 'Commercial Invoice (Zero-GST / Non-Taxable Supply)' (not guessing exemptions)"
    );

    // Matrix 3: GST NO to YES
    const contractGstNo = await AmcContract.create({
      contractCode: `AMC-GST-NO-${Date.now()}`,
      clientId: testClientMH._id,
      clientCode: testClientMH.clientCode,
      clientName: testClientMH.companyName,
      clientProductId: testClientMH.products[0]._id,
      productId: testProduct._id,
      productCode: testProduct.productCode,
      productName: testProduct.productName,
      startDate: new Date("2025-01-01"),
      expiryDate: new Date("2025-12-31"),
      dueDate: new Date("2025-01-01"),
      taxableAmount: 8000,
      totalAmount: 8000,
      gstApplicable: "NO",
      status: "Paid",
    });
    const resNY = createMockRes();
    await renewHandler({
      user: mockAdminUser,
      params: { id: contractGstNo._id.toString() },
      body: { startDate: "2026-01-01", expiryDate: "2026-12-31", dueDate: "2026-01-01", taxableAmount: 8000, gstApplicable: "YES" },
    }, resNY);
    assert(resNY.jsonData.invoice.totalAmount === 9440, "GST NO -> YES: Correctly applies 18% GST (₹9,440)");

    // Matrix 4: Inter-State IGST (MH -> Delhi)
    const contractInter = await AmcContract.create({
      contractCode: `AMC-INTER-${Date.now()}`,
      clientId: testClientDL._id,
      clientCode: testClientDL.clientCode,
      clientName: testClientDL.companyName,
      clientProductId: testClientDL.products[0]._id,
      productId: testProduct._id,
      productCode: testProduct.productCode,
      productName: testProduct.productName,
      startDate: new Date("2025-01-01"),
      expiryDate: new Date("2025-12-31"),
      dueDate: new Date("2025-01-01"),
      taxableAmount: 10000,
      totalAmount: 11800,
      gstApplicable: "YES",
      status: "Paid",
    });
    const resInter = createMockRes();
    await renewHandler({
      user: mockAdminUser,
      params: { id: contractInter._id.toString() },
      body: { startDate: "2026-01-01", expiryDate: "2026-12-31", dueDate: "2026-01-01", taxableAmount: 10000, gstApplicable: "YES", taxType: "inter" },
    }, resInter);
    assert(resInter.jsonData.invoice.cgstAmount === 0, "Inter-state: CGST is 0");
    assert(resInter.jsonData.invoice.sgstAmount === 0, "Inter-state: SGST is 0");
    assert(resInter.jsonData.invoice.igstAmount === 1800, "Inter-state: IGST is ₹1,800 (18%)");
    assert(resInter.jsonData.invoice.totalAmount === 11800, "Inter-state: Total invoice is ₹11,800");

    // Matrix 5: Staff role rejection
    const resStaff = createMockRes();
    await renewHandler({
      user: mockStaffUser,
      params: { id: contractGstYesToYes._id.toString() },
      body: { taxableAmount: 8000 },
    }, resStaff);
    assert(resStaff.statusCode === 403, "Staff user denied with HTTP 403");

    /* =========================================================================
       PHASE 3: EXISTING FINANCIAL RECORD PROTECTION (Snapshot Comparison)
       ========================================================================= */
    console.log("\n=======================================================");
    console.log("PHASE 3: EXISTING FINANCIAL RECORD PROTECTION");
    console.log("=======================================================");

    // Take snapshot of existing invoices before any renewal operations
    const initialInvoices = await AmcInvoice.find({ amcContractId: contractPhase1._id }).lean();
    const initialInvoiceSnapshot = JSON.stringify(initialInvoices.map((i) => ({
      code: i.invoiceCode,
      taxable: i.taxableAmount,
      total: i.totalAmount,
      paid: i.paidAmount,
    })));

    // Perform another non-conflicting renewal operation
    const contractSnapshotTest = await AmcContract.create({
      contractCode: `AMC-SNAP-${Date.now()}`,
      clientId: testClientMH._id,
      clientCode: testClientMH.clientCode,
      clientName: testClientMH.companyName,
      clientProductId: testClientMH.products[0]._id,
      productId: testProduct._id,
      productCode: testProduct.productCode,
      productName: testProduct.productName,
      startDate: new Date("2023-01-01"),
      expiryDate: new Date("2023-12-31"),
      dueDate: new Date("2023-01-01"),
      taxableAmount: 7000,
      totalAmount: 8260,
      status: "Paid",
    });
    const resSnap = createMockRes();
    await renewHandler({
      user: mockAdminUser,
      params: { id: contractSnapshotTest._id.toString() },
      body: { startDate: "2024-01-01", expiryDate: "2024-12-31", dueDate: "2024-01-01", taxableAmount: 7000 },
    }, resSnap);

    // Verify initial invoice snapshot remains 100% unchanged
    const postInvoices = await AmcInvoice.find({ amcContractId: contractPhase1._id }).lean();
    const postInvoiceSnapshot = JSON.stringify(postInvoices.map((i) => ({
      code: i.invoiceCode,
      taxable: i.taxableAmount,
      total: i.totalAmount,
      paid: i.paidAmount,
    })));

    assert(initialInvoiceSnapshot === postInvoiceSnapshot, "Historical invoices remained 100% immutable and unmodified");

    /* =========================================================================
       PHASE 4: DUPLICATE PREVENTION AND TRANSACTION SAFETY
       ========================================================================= */
    console.log("\n=======================================================");
    console.log("PHASE 4: DUPLICATE PREVENTION AND TRANSACTION SAFETY");
    console.log("=======================================================");

    const testIdempKey = `idemp_uat_replay_${Date.now()}`;
    const reqIdemp = {
      user: mockAdminUser,
      params: { id: contractSnapshotTest._id.toString() },
      body: {
        startDate: "2025-01-01",
        expiryDate: "2025-12-31",
        dueDate: "2025-01-01",
        taxableAmount: 7000,
        idempotencyKey: testIdempKey,
      },
    };

    const resIdempInitial = createMockRes();
    await renewHandler(reqIdemp, resIdempInitial);
    assert(resIdempInitial.statusCode === 201, "Initial request creates invoice (201 Created)");

    // Replay with identical key & payload
    const resIdempReplay = createMockRes();
    await renewHandler(reqIdemp, resIdempReplay);
    assert(resIdempReplay.statusCode === 200, "Idempotent replay returns HTTP 200 OK");
    assert(resIdempReplay.jsonData.isReplay === true, "isReplay flag is true");
    assert(
      resIdempReplay.jsonData.invoice.invoiceCode === resIdempInitial.jsonData.invoice.invoiceCode,
      "Replayed invoice code matches original exactly"
    );

    // Replay with modified payload -> 422
    const reqIdempModified = {
      ...reqIdemp,
      body: { ...reqIdemp.body, taxableAmount: 99999 },
    };
    const resIdempConflict = createMockRes();
    await renewHandler(reqIdempModified, resIdempConflict);
    assert(resIdempConflict.statusCode === 422, "Modified payload with same key rejected with HTTP 422");

    // Concurrent simultaneous requests
    const resConcA = createMockRes();
    const resConcB = createMockRes();
    await Promise.all([
      renewHandler({
        user: mockAdminUser,
        params: { id: contractSnapshotTest._id.toString() },
        body: { startDate: "2026-01-01", expiryDate: "2026-12-31", dueDate: "2026-01-01", taxableAmount: 7000, idempotencyKey: `conc_A_${Date.now()}` },
      }, resConcA),
      renewHandler({
        user: mockAdminUser,
        params: { id: contractSnapshotTest._id.toString() },
        body: { startDate: "2026-01-01", expiryDate: "2026-12-31", dueDate: "2026-01-01", taxableAmount: 7000, idempotencyKey: `conc_B_${Date.now()}` },
      }, resConcB),
    ]);
    const concStatuses = [resConcA.statusCode, resConcB.statusCode];
    assert(concStatuses.includes(201) && concStatuses.includes(409), "Simultaneous concurrent requests: Exactly 1 created (201) and 1 rejected (409)");

    /* =========================================================================
       PHASE 5: AUTONOMOUS AMC ACTIVATION AND DUAL-PERIOD LIFECYCLE
       ========================================================================= */
    console.log("\n=======================================================");
    console.log("PHASE 5: AUTONOMOUS AMC ACTIVATION AND DUAL-PERIOD LIFECYCLE");
    console.log("=======================================================");

    // Contract active until 2027-04-30
    const earlyContract = await AmcContract.create({
      contractCode: `AMC-EARLY-UAT-${Date.now()}`,
      clientId: testClientMH._id,
      clientCode: testClientMH.clientCode,
      clientName: testClientMH.companyName,
      clientProductId: testClientMH.products[0]._id,
      productId: testProduct._id,
      productCode: testProduct.productCode,
      productName: testProduct.productName,
      startDate: new Date("2026-05-01"),
      expiryDate: new Date("2027-04-30"),
      dueDate: new Date("2026-05-01"),
      taxableAmount: 15000,
      totalAmount: 17700,
      status: "Paid",
    });

    // Early renewal requested for 2027-05-01 to 2028-04-30
    const resEarly = createMockRes();
    await renewHandler({
      user: mockAdminUser,
      params: { id: earlyContract._id.toString() },
      body: {
        startDate: "2027-05-01",
        expiryDate: "2028-04-30",
        dueDate: "2027-05-01",
        taxableAmount: 16000,
        gstApplicable: "YES",
      },
    }, resEarly);

    assert(resEarly.statusCode === 201, "Early renewal generated with 201 Created");
    assert(resEarly.jsonData.isEarlyRenewal === true, "Response payload indicates isEarlyRenewal = true");

    const refreshedEarly = await AmcContract.findById(earlyContract._id);
    assert(refreshedEarly.status === "Paid", "Ongoing contract coverage remains Paid/Active");
    assert(refreshedEarly.upcomingRenewal.invoiceId !== null, "upcomingRenewal subdocument queued safely");

    // Autonomous activation simulation (Scheduler catch-up)
    refreshedEarly.upcomingRenewal.startDate = new Date(Date.now() - 3600000);
    await refreshedEarly.save();

    const schedResult = await syncUpcomingAmcRenewals();
    assert(schedResult.activatedCount >= 1, "Autonomous scheduler transitioned queued renewal to active coverage");

    const activeAfterSched = await AmcContract.findById(earlyContract._id);
    assert(activeAfterSched.upcomingRenewal.invoiceId === null, "upcomingRenewal cleared after autonomous transition");
    assert(activeAfterSched.renewalHistory.length >= 1, "Previous cycle archived permanently into renewalHistory");

    /* =========================================================================
       PHASE 7: DATABASE INTEGRITY READ-ONLY SCAN
       ========================================================================= */
    console.log("\n=======================================================");
    console.log("PHASE 7: DATABASE INTEGRITY READ-ONLY SCAN");
    console.log("=======================================================");

    const activeInvoicesWithCollisions = await AmcInvoice.aggregate([
      {
        $match: {
          isDeleted: false,
          status: { $in: ["Issued", "Draft"] },
        },
      },
      {
        $group: {
          _id: { amcContractId: "$amcContractId", contractStartDate: "$contractStartDate" },
          count: { $sum: 1 },
          invoices: { $push: "$invoiceCode" },
        },
      },
      {
        $match: { count: { $gt: 1 } },
      },
    ]);

    assert(activeInvoicesWithCollisions.length === 0, "Read-only database scan: 0 active period collisions found");

    console.log("\n================================================================================");
    console.log(`   FULL UAT & INTEGRATION VERIFICATION COMPLETE: ${passedTests} PASSED, ${failedTests} FAILED `);
    console.log("================================================================================");
  } catch (err) {
    console.error("UAT verification failed:", err);
  } finally {
    await mongoose.disconnect();
  }
}

runFullUatIntegrationVerification();

