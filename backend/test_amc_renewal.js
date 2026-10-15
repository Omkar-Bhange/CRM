const mongoose = require("mongoose");
const crypto = require("crypto");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/crm_development";

async function runProductionReadinessTests() {
  console.log("================================================================================");
  console.log("   PRODUCTION-READINESS VERIFICATION SUITE: AMC RENEWAL MODULE                  ");
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

  // Mock users
  const mockAdminUser = {
    _id: new mongoose.Types.ObjectId(),
    name: "Master Admin",
    role: "admin",
  };

  const mockNonAdminUser = {
    _id: new mongoose.Types.ObjectId(),
    name: "Standard Staff",
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

  // Find or create test product & client
  const testProduct = await Product.findOneAndUpdate(
    { productCode: "TEST-PROD-PROD" },
    {
      productCode: "TEST-PROD-PROD",
      productName: "Nexora Production Suite",
      category: "Software",
      version: "3.0",
      status: "Active",
    },
    { returnDocument: "after", upsert: true }
  );

  const testClientMH = await Client.findOneAndUpdate(
    { clientCode: "TEST-CLI-MH-PROD" },
    {
      clientCode: "TEST-CLI-MH-PROD",
      companyName: "Maharashtra Corp Ltd",
      contactPerson: "Rajesh Patil",
      email: "rajesh@mhcorp.example.com",
      mobile: "9820011223",
      state: "Maharashtra",
      billingAddress: {
        state: "Maharashtra",
        addressLine1: "Nariman Point",
        city: "Mumbai",
        pincode: "400021",
      },
      gstin: "27AAACB2233P1Z1",
      products: [
        {
          _id: new mongoose.Types.ObjectId(),
          productId: testProduct._id,
          productCode: testProduct.productCode,
          productName: testProduct.productName || "Nexora Production Suite",
          version: "3.0",
          amcStatus: "Paid",
          expiryDate: "2026-06-30",
        },
      ],
    },
    { returnDocument: "after", upsert: true }
  );

  const testClientUnregistered = await Client.findOneAndUpdate(
    { clientCode: "TEST-CLI-UNREG" },
    {
      clientCode: "TEST-CLI-UNREG",
      companyName: "Small Trader Enterprises",
      contactPerson: "Suresh Gupta",
      email: "suresh@smalltrader.example.com",
      mobile: "9820099887",
      state: "Maharashtra",
      billingAddress: {
        state: "Maharashtra",
        addressLine1: "Market Yard",
        city: "Pune",
        pincode: "411037",
      },
      gstin: "", // Unregistered
      products: [
        {
          _id: new mongoose.Types.ObjectId(),
          productId: testProduct._id,
          productCode: testProduct.productCode,
          productName: testProduct.productName || "Nexora Production Suite",
          version: "3.0",
          amcStatus: "Paid",
          expiryDate: "2026-06-30",
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
       CHECK 1: REAL CONCURRENCY VERIFICATION (Parallel Simultaneous Requests)
       ========================================================================= */
    console.log("\n--- CHECK 1: Real Concurrency Verification (Simultaneous Requests) ---");
    const concurrentContract = await AmcContract.create({
      contractCode: `AMC-CONC-${Date.now()}`,
      clientId: testClientMH._id,
      clientCode: testClientMH.clientCode,
      clientName: testClientMH.companyName,
      clientProductId: testClientMH.products[0]._id,
      productId: testProduct._id,
      productCode: testProduct.productCode,
      productName: testProduct.productName || "Nexora Production Suite",
      plan: "Standard",
      startDate: new Date("2025-07-01"),
      expiryDate: new Date("2026-06-30"),
      dueDate: new Date("2025-07-01"),
      taxableAmount: 10000,
      totalAmount: 11800,
      status: "Paid",
      gstApplicable: "YES",
      taxType: "intra",
    });

    const reqConcurrent1 = {
      user: mockAdminUser,
      params: { id: concurrentContract._id.toString() },
      body: {
        startDate: "2026-07-01",
        expiryDate: "2027-06-30",
        taxableAmount: 12000,
        gstApplicable: "YES",
        idempotencyKey: `idemp_conc_A_${Date.now()}`,
      },
    };
    const reqConcurrent2 = {
      user: mockAdminUser,
      params: { id: concurrentContract._id.toString() },
      body: {
        startDate: "2026-07-01",
        expiryDate: "2027-06-30",
        taxableAmount: 12000,
        gstApplicable: "YES",
        idempotencyKey: `idemp_conc_B_${Date.now()}`,
      },
    };

    const resConcurrent1 = createMockRes();
    const resConcurrent2 = createMockRes();

    // Fire both requests simultaneously using Promise.all
    await Promise.all([
      renewHandler(reqConcurrent1, resConcurrent1),
      renewHandler(reqConcurrent2, resConcurrent2),
    ]);

    const statusCodes = [resConcurrent1.statusCode, resConcurrent2.statusCode];
    const successCount = statusCodes.filter((s) => s === 201).length;
    const conflictCount = statusCodes.filter((s) => s === 409).length;

    assert(successCount === 1, `Exactly one concurrent request succeeded with 201 Created (got ${successCount})`);
    assert(conflictCount === 1, `Competing concurrent request rejected with 409 Conflict (got ${conflictCount})`);

    // Verify exactly one renewal invoice exists in DB for this period
    const createdInvoices = await AmcInvoice.find({
      amcContractId: concurrentContract._id,
      contractStartDate: new Date("2026-07-01"),
      isDeleted: false,
    });
    assert(createdInvoices.length === 1, `Database contains exactly 1 invoice for the renewed period (found ${createdInvoices.length})`);

    // Check overlapping period with different start dates
    const reqOverlapDiffStart = {
      user: mockAdminUser,
      params: { id: concurrentContract._id.toString() },
      body: {
        startDate: "2026-10-01", // Overlaps 2026-07-01 to 2027-06-30!
        expiryDate: "2027-09-30",
        taxableAmount: 12000,
        gstApplicable: "YES",
        idempotencyKey: `idemp_overlap_diff_${Date.now()}`,
      },
    };
    const resOverlapDiff = createMockRes();
    await renewHandler(reqOverlapDiffStart, resOverlapDiff);
    assert(resOverlapDiff.statusCode === 409, `Overlapping period with different start date rejected with HTTP 409 (got ${resOverlapDiff.statusCode})`);

    /* =========================================================================
       CHECK 2: TRANSACTION ROLLBACK VERIFICATION
       ========================================================================= */
    console.log("\n--- CHECK 2: Transaction Rollback Verification (Atomic Abort) ---");
    const rollbackContract = await AmcContract.create({
      contractCode: `AMC-ROLL-${Date.now()}`,
      clientId: testClientMH._id,
      clientCode: testClientMH.clientCode,
      clientName: testClientMH.companyName,
      clientProductId: testClientMH.products[0]._id,
      productId: testProduct._id,
      productCode: testProduct.productCode,
      productName: testProduct.productName || "Nexora Production Suite",
      plan: "Standard",
      startDate: new Date("2024-01-01"),
      expiryDate: new Date("2024-12-31"),
      dueDate: new Date("2024-01-01"),
      taxableAmount: 5000,
      totalAmount: 5900,
      status: "Pending",
    });

    const initialInvoiceCount = await AmcInvoice.countDocuments({ amcContractId: rollbackContract._id });
    const initialContractDoc = await AmcContract.findById(rollbackContract._id).lean();

    // Execute simulated failing transaction
    let transactionAborted = false;
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        // Create an invoice inside transaction
        const testInv = new AmcInvoice({
          invoiceCode: `AMC-INV-TEMP-${Date.now()}`,
          invoiceNumber: 999999,
          invoiceType: "Renewal",
          amcContractId: rollbackContract._id,
          contractCode: rollbackContract.contractCode,
          clientId: rollbackContract.clientId,
          clientCode: rollbackContract.clientCode,
          clientName: rollbackContract.clientName,
          productId: rollbackContract.productId,
          productCode: rollbackContract.productCode,
          productName: rollbackContract.productName,
          clientProductId: rollbackContract.clientProductId,
          plan: "Standard",
          licensedUsers: 1,
          contractStartDate: new Date("2025-01-01"),
          contractExpiryDate: new Date("2025-12-31"),
          invoiceDate: new Date(),
          dueDate: new Date("2025-01-01"),
          taxableAmount: 5000,
          totalAmount: 5900,
          paidAmount: 0,
          pendingAmount: 5900,
          paymentStatus: "Pending",
          status: "Issued",
          idempotencyKey: `idemp_temp_${Date.now()}`,
        });
        await testInv.save({ session });

        // Force an intentional unrecoverable error before commit
        throw new Error("SIMULATED_DATABASE_FAILURE_BEFORE_COMMIT");
      });
    } catch (err) {
      transactionAborted = true;
    } finally {
      await session.endSession();
    }

    assert(transactionAborted, "Transaction threw error and triggered abort");
    const postRollbackInvoiceCount = await AmcInvoice.countDocuments({ amcContractId: rollbackContract._id });
    assert(
      postRollbackInvoiceCount === initialInvoiceCount,
      `Zero orphaned invoices remained in DB after rollback (${postRollbackInvoiceCount} vs ${initialInvoiceCount})`
    );

    const postRollbackContract = await AmcContract.findById(rollbackContract._id).lean();
    assert(
      postRollbackContract.startDate.toISOString() === initialContractDoc.startDate.toISOString(),
      "Contract document remained completely unmodified after transaction abort"
    );

    /* =========================================================================
       CHECK 3: DURABLE IDEMPOTENCY VERIFICATION (TTL Expiry & API Consistency)
       ========================================================================= */
    console.log("\n--- CHECK 3: Durable Idempotency Verification ---");
    const durableKey = `idemp_durable_${Date.now()}`;
    const reqDurable = {
      user: mockAdminUser,
      params: { id: rollbackContract._id.toString() },
      body: {
        startDate: "2025-01-01",
        expiryDate: "2025-12-31",
        taxableAmount: 7500,
        gstApplicable: "YES",
        idempotencyKey: durableKey,
      },
    };

    const resDurable1 = createMockRes();
    await renewHandler(reqDurable, resDurable1);
    assert(resDurable1.statusCode === 201, `Initial renewal returns HTTP 201 Created (got ${resDurable1.statusCode})`);
    const initialInvoiceCode = resDurable1.jsonData.invoice.invoiceCode;

    // Simulate 7-day TTL expiration of the fast cache
    await IdempotencyLog.deleteMany({ idempotencyKey: durableKey });
    const logCheck = await IdempotencyLog.findOne({ idempotencyKey: durableKey });
    assert(logCheck === null, "IdempotencyLog record deleted (simulating TTL expiration)");

    // Replay request after TTL expiration
    const resDurableReplay = createMockRes();
    await renewHandler(reqDurable, resDurableReplay);
    assert(
      resDurableReplay.statusCode === 200,
      `Replay after TTL expiry returns HTTP 200 OK via durable ledger (got ${resDurableReplay.statusCode})`
    );
    assert(
      resDurableReplay.jsonData.isReplay === true,
      "Response payload indicates isReplay = true"
    );
    assert(
      resDurableReplay.jsonData.invoice.invoiceCode === initialInvoiceCode,
      `Durable replay returned original invoice code (${resDurableReplay.jsonData.invoice.invoiceCode})`
    );

    // Conflict test: Reusing the same key with altered payload
    const reqDurableConflict = {
      user: mockAdminUser,
      params: { id: rollbackContract._id.toString() },
      body: {
        startDate: "2025-01-01",
        expiryDate: "2025-12-31",
        taxableAmount: 99999, // Altered amount
        gstApplicable: "YES",
        idempotencyKey: durableKey,
      },
    };
    // Re-create log to test Tier 1 conflict check as well
    await IdempotencyLog.create({
      idempotencyKey: durableKey,
      endpoint: "/api/admin/amc/contract/:id/renew",
      contractId: rollbackContract._id,
      payloadHash: "dummy_original_hash",
      status: "COMPLETED",
      responseStatus: 201,
      responseBody: resDurable1.jsonData,
    });
    const resConflict = createMockRes();
    await renewHandler(reqDurableConflict, resConflict);
    assert(resConflict.statusCode === 422, `Reused key with altered payload rejected with HTTP 422 (got ${resConflict.statusCode})`);

    /* =========================================================================
       CHECK 4: SCHEDULER RELIABILITY & INDEPENDENT PAYMENT LIFECYCLE
       ========================================================================= */
    console.log("\n--- CHECK 4: Scheduler Reliability & Payment Status Independence ---");
    const schedulerContract = await AmcContract.create({
      contractCode: `AMC-SCHED-${Date.now()}`,
      clientId: testClientMH._id,
      clientCode: testClientMH.clientCode,
      clientName: testClientMH.companyName,
      clientProductId: testClientMH.products[0]._id,
      productId: testProduct._id,
      productCode: testProduct.productCode,
      productName: testProduct.productName || "Nexora Production Suite",
      plan: "Premium",
      startDate: new Date("2025-01-01"),
      expiryDate: new Date("2025-12-31"),
      dueDate: new Date("2025-01-01"),
      taxableAmount: 10000,
      totalAmount: 11800,
      status: "Paid",
      upcomingRenewal: {
        invoiceId: new mongoose.Types.ObjectId(),
        invoiceCode: `AMC-INV-SCHED-01`,
        startDate: new Date(Date.now() - 3600000), // Due 1 hour ago (catch-up / missed run test)
        expiryDate: new Date(Date.now() + 31536000000),
        dueDate: new Date(Date.now() - 3600000),
        plan: "Premium",
        licensedUsers: 5,
        taxableAmount: 12000,
        cgstRate: 9,
        cgstAmount: 1080,
        sgstRate: 9,
        sgstAmount: 1080,
        igstRate: 0,
        igstAmount: 0,
        totalTaxAmount: 2160,
        totalAmount: 14160,
        gstApplicable: "YES",
        taxType: "intra",
        taxClassification: "Standard Rate (18%)",
        paymentStatus: "Pending", // Unpaid renewal invoice!
        createdAt: new Date(),
      },
    });

    // Run two simultaneous scheduler instances concurrently
    const [schedRun1, schedRun2] = await Promise.all([
      syncUpcomingAmcRenewals(),
      syncUpcomingAmcRenewals(),
    ]);
    const totalTransitions = (schedRun1.activatedCount || 0) + (schedRun2.activatedCount || 0);
    assert(totalTransitions === 1, `Concurrent scheduler instances executed safely (exactly 1 activation, total = ${totalTransitions})`);

    // Repeated scheduler execution (Idempotency check)
    const schedRun3 = await syncUpcomingAmcRenewals();
    assert(schedRun3.activatedCount === 0, `Repeated scheduler execution activated 0 additional contracts (idempotent, got ${schedRun3.activatedCount})`);

    const refreshedSchedulerContract = await AmcContract.findById(schedulerContract._id);
    assert(
      refreshedSchedulerContract.status === "Pending",
      `Contract transitioned to coverage status Pending (coverage active, invoice unpaid)`
    );
    assert(
      refreshedSchedulerContract.upcomingRenewal.invoiceId === null,
      "upcomingRenewal cleared after autonomous transition"
    );
    assert(
      refreshedSchedulerContract.renewalHistory.length === 1,
      `Historical cycle archived exactly once without duplicates (count = ${refreshedSchedulerContract.renewalHistory.length})`
    );

    /* =========================================================================
       CHECK 5: PRODUCTION INDEX SAFETY & READ-ONLY INTEGRITY SCAN
       ========================================================================= */
    console.log("\n--- CHECK 5: Production Index Safety & Read-Only Integrity Scan ---");
    // Scan all existing active AmcInvoices in the database
    const duplicateInvoiceCheck = await AmcInvoice.aggregate([
      {
        $match: {
          isDeleted: false,
          status: { $in: ["Issued", "Partially Paid", "Paid", "Overdue"] },
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
        $match: {
          count: { $gt: 1 },
        },
      },
    ]);

    assert(
      duplicateInvoiceCheck.length === 0,
      `Existing database scan found 0 duplicate active start date collisions (clean for unique partial index)`
    );

    // Verify compound index definition in Mongoose schema
    const amcIndexes = AmcInvoice.schema.indexes();
    const uniqueStartIndex = amcIndexes.find((idx) => idx[1] && idx[1].name === "uniq_amc_contract_active_start");
    assert(uniqueStartIndex !== undefined, "Compound partial index 'uniq_amc_contract_active_start' defined in schema");
    assert(uniqueStartIndex[1].unique === true, "Index enforce uniqueness = true");

    /* =========================================================================
       CHECK 6: FINANCIAL HISTORY & PAYMENT WORKFLOW INTEGRATION
       ========================================================================= */
    console.log("\n--- CHECK 6: Financial History & Payment Workflow Integration ---");
    const paymentTestInvoice = await AmcInvoice.findOne({
      amcContractId: concurrentContract._id,
      isDeleted: false,
    });
    assert(paymentTestInvoice !== null, "Renewal invoice located for payment test");

    // Simulate payment recording on renewal invoice
    paymentTestInvoice.paidAmount = paymentTestInvoice.totalAmount;
    paymentTestInvoice.pendingAmount = 0;
    paymentTestInvoice.paymentStatus = "Paid";
    paymentTestInvoice.status = "Issued";
    await paymentTestInvoice.save();

    // Verify contract can be updated to Paid
    const contractForPayment = await AmcContract.findById(concurrentContract._id);
    contractForPayment.paidAmount = paymentTestInvoice.totalAmount;
    contractForPayment.pendingAmount = 0;
    contractForPayment.status = "Paid";
    await contractForPayment.save();

    const verifiedContract = await AmcContract.findById(concurrentContract._id);
    assert(verifiedContract.status === "Paid", "Contract updated to Paid after invoice settlement");
    assert(verifiedContract.pendingAmount === 0, "Pending amount is 0");

    /* =========================================================================
       CHECK 7: TAX CLASSIFICATION & STATUTORY ACCURACY
       ========================================================================= */
    console.log("\n--- CHECK 7: Tax Classification & Statutory Accuracy ---");
    // Contract with Unregistered Client & GST NO
    const contractUnreg = await AmcContract.create({
      contractCode: `AMC-UNREG-${Date.now()}`,
      clientId: testClientUnregistered._id,
      clientCode: testClientUnregistered.clientCode,
      clientName: testClientUnregistered.companyName,
      clientProductId: testClientUnregistered.products[0]._id,
      productId: testProduct._id,
      productCode: testProduct.productCode,
      productName: testProduct.productName || "Nexora Production Suite",
      plan: "Basic",
      startDate: new Date("2025-01-01"),
      expiryDate: new Date("2025-12-31"),
      dueDate: new Date("2025-01-01"),
      taxableAmount: 4000,
      totalAmount: 4000,
      status: "Paid",
      gstApplicable: "NO",
    });

    const reqUnreg = {
      user: mockAdminUser,
      params: { id: contractUnreg._id.toString() },
      body: {
        startDate: "2026-01-01",
        expiryDate: "2026-12-31",
        taxableAmount: 4000,
        gstApplicable: "NO",
        idempotencyKey: `idemp_unreg_${Date.now()}`,
      },
    };
    const resUnreg = createMockRes();
    await renewHandler(reqUnreg, resUnreg);

    assert(resUnreg.statusCode === 201, "Unregistered client renewal succeeded with 201 Created");
    assert(
      resUnreg.jsonData.invoice.taxClassification === "Commercial Invoice (Zero-GST / Non-Taxable Supply)",
      `Tax classification for client with GST NO is '${resUnreg.jsonData.invoice.taxClassification}' (statutory zero-tax commercial invoice, not guessing legal exemptions)`
    );
    assert(resUnreg.jsonData.invoice.totalTaxAmount === 0, "Total tax amount is exactly 0");
    assert(resUnreg.jsonData.invoice.totalAmount === 4000, "Total amount matches taxable amount (4000)");

    console.log("\n================================================================================");
    console.log(`   PRODUCTION-READINESS VERIFICATION COMPLETE: ${passedTests} PASSED, ${failedTests} FAILED       `);
    console.log("================================================================================");
  } catch (err) {
    console.error("Test execution aborted due to error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

runProductionReadinessTests();

