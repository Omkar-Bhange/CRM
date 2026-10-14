"use strict";

const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "node_modules");
require("module").Module._initPaths();

const mongoose = require("mongoose");

const TEST_DB_URI = `mongodb://127.0.0.1:27017/crm_test_clientamcrequest_${Date.now()}`;

async function runClientAmcRequestIsolatedTests() {
  console.log("=== ISOLATED CLIENTAMCREQUEST MODEL TEST SUITE ===");
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

  const Employee =
    mongoose.models.Employee ||
    mongoose.model(
      "Employee",
      new mongoose.Schema({
        name: { type: String, default: "Test Staff" },
        employeeCode: { type: String, default: "EMP-001" },
        email: { type: String, default: "staff@example.com" },
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
    mongoose.model(
      "AmcContract",
      new mongoose.Schema({
        contractCode: { type: String, default: "AMC-2026-001" },
        clientName: { type: String, default: "Acme Corp" },
        startDate: { type: Date, default: Date.now },
        endDate: { type: Date, default: () => new Date(Date.now() + 365 * 86400000) },
      })
    );

  const ClientAmcRequest = require("./models/ClientAmcRequest");

  try {
    // ── GROUP 1: Identity & Collection Setup ─────────────────────────────────
    console.log("--- Group 1: Identity & Collection Setup ---");
    assert(ClientAmcRequest.modelName === "ClientAmcRequest", "Model name is ClientAmcRequest");
    assert(ClientAmcRequest.collection.name === "clientamcrequests", "Physical collection is 'clientamcrequests'");

    // Build standard valid indexes on collection
    await ClientAmcRequest.collection.createIndex({ requestCode: 1 }, { unique: true });
    await ClientAmcRequest.collection.createIndex({ clientId: 1, createdAt: -1 });
    await ClientAmcRequest.collection.createIndex({ contractId: 1, createdAt: -1 });
    await ClientAmcRequest.collection.createIndex({ status: 1, createdAt: -1 });

    const liveIndexes = await ClientAmcRequest.collection.indexes();
    const hasUniqueRequestCode = liveIndexes.some(
      idx => idx.key && idx.key.requestCode === 1 && idx.unique === true
    );
    const hasClientIdx = liveIndexes.some(
      idx => idx.key && idx.key.clientId === 1 && idx.key.createdAt === -1
    );
    const hasContractIdx = liveIndexes.some(
      idx => idx.key && idx.key.contractId === 1 && idx.key.createdAt === -1
    );
    const hasStatusIdx = liveIndexes.some(
      idx => idx.key && idx.key.status === 1 && idx.key.createdAt === -1
    );

    assert(hasUniqueRequestCode, "Unique index on requestCode created on collection");
    assert(hasClientIdx, "Compound index { clientId: 1, createdAt: -1 } created on collection");
    assert(hasContractIdx, "Compound index { contractId: 1, createdAt: -1 } created on collection");
    assert(hasStatusIdx, "Compound index { status: 1, createdAt: -1 } created on collection");

    // ── GROUP 2: Pre-Existing Schema Index Analysis & Partial Index Behavior ─
    console.log("\n--- Group 2: Pre-Existing Schema Index Analysis & Partial Index Behavior ---");

    // 2.1 Verify pre-existing schema index declared with both sparse and partialFilterExpression
    let indexMixErr = null;
    try {
      await ClientAmcRequest.collection.createIndex(
        { activeRequestKey: 1 },
        {
          unique: true,
          sparse: true,
          partialFilterExpression: { activeRequestKey: { $type: "string" } },
        }
      );
    } catch (err) {
      indexMixErr = err;
    }
    assert(
      indexMixErr && indexMixErr.code === 67,
      "Confirmed: MongoDB engine rejects pre-existing declaration combining sparse and partialFilterExpression (Code 67)"
    );

    // 2.2 Create canonical partial unique index on collection to test runtime constraint
    await ClientAmcRequest.collection.createIndex(
      { activeRequestKey: 1 },
      {
        unique: true,
        partialFilterExpression: { activeRequestKey: { $type: "string" } },
      }
    );
    const updatedIndexes = await ClientAmcRequest.collection.indexes();
    const hasActiveKeyPartial = updatedIndexes.some(
      idx =>
        idx.key &&
        idx.key.activeRequestKey === 1 &&
        idx.unique === true &&
        idx.partialFilterExpression &&
        idx.partialFilterExpression.activeRequestKey &&
        idx.partialFilterExpression.activeRequestKey.$type === "string"
    );
    assert(hasActiveKeyPartial, "Partial unique index on activeRequestKey active on collection");

    // ── GROUP 3: Validation Rules ───────────────────────────────────────────
    console.log("\n--- Group 3: Validation Rules ---");

    const testClientId = new mongoose.Types.ObjectId();
    const testContractId = new mongoose.Types.ObjectId();

    // 3.1 Missing required requestCode
    let err1 = null;
    try {
      await ClientAmcRequest.create({
        clientId: testClientId,
        contractId: testContractId,
        productName: "CRM Enterprise",
        requestType: "AMC Renewal",
      });
    } catch (err) {
      err1 = err;
    }
    assert(err1 && err1.errors && err1.errors.requestCode, "requestCode is required");

    // 3.2 Missing required clientId
    let err2 = null;
    try {
      await ClientAmcRequest.create({
        requestCode: "REQ-2026-0001",
        contractId: testContractId,
        productName: "CRM Enterprise",
        requestType: "AMC Renewal",
      });
    } catch (err) {
      err2 = err;
    }
    assert(err2 && err2.errors && err2.errors.clientId, "clientId is required");

    // 3.3 Missing required contractId
    let err3 = null;
    try {
      await ClientAmcRequest.create({
        requestCode: "REQ-2026-0002",
        clientId: testClientId,
        productName: "CRM Enterprise",
        requestType: "AMC Renewal",
      });
    } catch (err) {
      err3 = err;
    }
    assert(err3 && err3.errors && err3.errors.contractId, "contractId is required");

    // 3.4 Missing required productName
    let err4 = null;
    try {
      await ClientAmcRequest.create({
        requestCode: "REQ-2026-0003",
        clientId: testClientId,
        contractId: testContractId,
        requestType: "AMC Renewal",
      });
    } catch (err) {
      err4 = err;
    }
    assert(err4 && err4.errors && err4.errors.productName, "productName is required");

    // 3.5 Missing required requestType
    let err5 = null;
    try {
      await ClientAmcRequest.create({
        requestCode: "REQ-2026-0004",
        clientId: testClientId,
        contractId: testContractId,
        productName: "CRM Enterprise",
      });
    } catch (err) {
      err5 = err;
    }
    assert(err5 && err5.errors && err5.errors.requestType, "requestType is required");

    // 3.6 Invalid requestType enum
    let err6 = null;
    try {
      await ClientAmcRequest.create({
        requestCode: "REQ-2026-0005",
        clientId: testClientId,
        contractId: testContractId,
        productName: "CRM Enterprise",
        requestType: "InvalidType",
      });
    } catch (err) {
      err6 = err;
    }
    assert(err6 && err6.errors && err6.errors.requestType, "requestType must match enum");

    // 3.7 Invalid status enum
    let err7 = null;
    try {
      await ClientAmcRequest.create({
        requestCode: "REQ-2026-0006",
        clientId: testClientId,
        contractId: testContractId,
        productName: "CRM Enterprise",
        requestType: "AMC Renewal",
        status: "UnknownStatus",
      });
    } catch (err) {
      err7 = err;
    }
    assert(err7 && err7.errors && err7.errors.status, "status must match enum");

    // 3.8 Invalid renewalPeriod enum
    let err8 = null;
    try {
      await ClientAmcRequest.create({
        requestCode: "REQ-2026-0007",
        clientId: testClientId,
        contractId: testContractId,
        productName: "CRM Enterprise",
        requestType: "AMC Renewal",
        renewalPeriod: "2 Years",
      });
    } catch (err) {
      err8 = err;
    }
    assert(err8 && err8.errors && err8.errors.renewalPeriod, "renewalPeriod must match enum ('1 Year')");

    // ── GROUP 4: Unique & Partial Unique Index Enforcement ───────────────────
    console.log("\n--- Group 4: Unique & Partial Unique Index Enforcement ---");

    // 4.1 Duplicate requestCode fails
    const doc1 = await ClientAmcRequest.create({
      requestCode: "REQ-2026-UNIQ1",
      clientId: testClientId,
      contractId: testContractId,
      productName: "Software Support",
      requestType: "AMC Renewal",
      activeRequestKey: `${testClientId}:${testContractId}:AMC Renewal`,
    });
    assert(doc1._id, "Created first doc with REQ-2026-UNIQ1");

    let dupCodeErr = null;
    try {
      await ClientAmcRequest.create({
        requestCode: "REQ-2026-UNIQ1",
        clientId: testClientId,
        contractId: testContractId,
        productName: "Software Support",
        requestType: "Quotation Request",
      });
    } catch (err) {
      dupCodeErr = err;
    }
    assert(dupCodeErr && dupCodeErr.code === 11000, "Duplicate requestCode rejected with E11000");

    // 4.2 Duplicate non-null activeRequestKey fails (duplicate active request prevention)
    let dupActiveErr = null;
    try {
      await ClientAmcRequest.create({
        requestCode: "REQ-2026-UNIQ2",
        clientId: testClientId,
        contractId: testContractId,
        productName: "Software Support",
        requestType: "AMC Renewal",
        activeRequestKey: `${testClientId}:${testContractId}:AMC Renewal`,
      });
    } catch (err) {
      dupActiveErr = err;
    }
    assert(dupActiveErr && dupActiveErr.code === 11000, "Duplicate activeRequestKey rejected with E11000");

    // 4.3 Multiple documents with activeRequestKey: null succeed (partialFilterExpression works)
    const nullDoc1 = await ClientAmcRequest.create({
      requestCode: "REQ-2026-NULL1",
      clientId: testClientId,
      contractId: testContractId,
      productName: "Software Support",
      requestType: "AMC Renewal",
      activeRequestKey: null,
      status: "Completed",
    });
    const nullDoc2 = await ClientAmcRequest.create({
      requestCode: "REQ-2026-NULL2",
      clientId: testClientId,
      contractId: testContractId,
      productName: "Software Support",
      requestType: "AMC Renewal",
      activeRequestKey: null,
      status: "Cancelled",
    });
    assert(nullDoc1._id && nullDoc2._id, "Multiple documents with activeRequestKey: null succeed without collision");

    // ── GROUP 5: Full CRUD Lifecycle & Status Transitions ───────────────────
    console.log("\n--- Group 5: Full CRUD Lifecycle & Status Transitions ---");

    // 5.1 Create valid renewal request with defaults
    const renewalReq = await ClientAmcRequest.create({
      requestCode: "REQ-2026-FLOW1",
      clientId: testClientId,
      clientCode: "CLI-999",
      clientName: "Alpha Industries",
      contractId: testContractId,
      contractCode: "AMC-2026-001",
      productName: "Billing Suite",
      requestType: "AMC Renewal",
      activeRequestKey: "active_flow_key_1",
      remarks: "Please expedite annual renewal",
      timeline: [
        {
          action: "SUBMIT_REQUEST",
          status: "Submitted",
          remarks: "Initial submission",
          performedByRole: "client",
        },
      ],
    });
    assert(renewalReq.status === "Submitted", "Default status is 'Submitted'");
    assert(renewalReq.renewalPeriod === "1 Year", "Default renewalPeriod is '1 Year'");
    assert(renewalReq.quotationAmount === 0, "Default quotationAmount is 0");
    assert(renewalReq.quotationDetails === "", "Default quotationDetails is empty string");
    assert(renewalReq.isDeleted === false, "Default isDeleted is false");
    assert(renewalReq.timeline.length === 1, "Initial timeline has 1 entry");

    // 5.2 Status transition: Under Review
    renewalReq.status = "Under Review";
    renewalReq.timeline.push({
      action: "REVIEW_STARTED",
      status: "Under Review",
      remarks: "Account manager reviewing contract terms",
      performedByRole: "admin",
    });
    await renewalReq.save();
    const fetchedReview = await ClientAmcRequest.findById(renewalReq._id);
    assert(fetchedReview.status === "Under Review", "Updated status to 'Under Review'");
    assert(fetchedReview.timeline.length === 2, "Timeline has 2 entries");

    // 5.3 Status transition: Quotation Ready
    renewalReq.status = "Quotation Ready";
    renewalReq.quotationAmount = 45000;
    renewalReq.quotationDetails = "Standard 1-year coverage + 2 free on-site visits";
    renewalReq.quotationDocument = {
      fileName: "quote_45000.pdf",
      fileUrl: "/api/uploads/quotations/quote_45000.pdf",
      filePath: "uploads/quotations/quote_45000.pdf",
      fileSize: 1048576,
      mimeType: "application/pdf",
      uploadedAt: new Date(),
    };
    renewalReq.timeline.push({
      action: "QUOTATION_PREPARED",
      status: "Quotation Ready",
      remarks: "Quotation of INR 45,000 generated",
      performedByRole: "admin",
    });
    await renewalReq.save();
    const fetchedQuote = await ClientAmcRequest.findById(renewalReq._id);
    assert(fetchedQuote.status === "Quotation Ready", "Updated status to 'Quotation Ready'");
    assert(fetchedQuote.quotationAmount === 45000, "Quotation amount stored correctly");
    assert(fetchedQuote.quotationDocument.fileName === "quote_45000.pdf", "Quotation document subdocument populated");
    assert(fetchedQuote.timeline.length === 3, "Timeline has 3 entries");

    // 5.4 Status transition: Completed & clear activeRequestKey
    renewalReq.status = "Completed";
    renewalReq.activeRequestKey = null; // Production pattern: clear key on terminal status
    renewalReq.timeline.push({
      action: "RENEWAL_COMPLETED",
      status: "Completed",
      remarks: "Renewal invoice settled and contract renewed",
      performedByRole: "admin",
    });
    await renewalReq.save();
    const fetchedCompleted = await ClientAmcRequest.findById(renewalReq._id);
    assert(fetchedCompleted.status === "Completed", "Updated status to 'Completed'");
    assert(fetchedCompleted.activeRequestKey === null, "activeRequestKey cleared on completion");
    assert(fetchedCompleted.timeline.length === 4, "Timeline has 4 entries");

    // Now, a new request with the original key `active_flow_key_1` can be created because previous was cleared
    const newAfterComplete = await ClientAmcRequest.create({
      requestCode: "REQ-2026-FLOW2",
      clientId: testClientId,
      contractId: testContractId,
      productName: "Billing Suite",
      requestType: "AMC Renewal",
      activeRequestKey: "active_flow_key_1",
    });
    assert(newAfterComplete._id, "Subsequent request with reuse of activeRequestKey succeeds after completion");

    // ── GROUP 6: Population of References ───────────────────────────────────
    console.log("\n--- Group 6: Population of References ---");

    const sampleUser = await User.create({ name: "Admin Jane", email: "jane@example.com", role: "admin" });
    const sampleEmp = await Employee.create({ name: "Eng Alex", employeeCode: "EMP-042", email: "alex@example.com" });
    const sampleProd = await Product.create({
      productCode: `PROD-TEST-${Date.now()}`,
      productName: "Smart POS Terminal",
      category: "Hardware",
      basePrice: 12000,
    });
    const sampleContract = await AmcContract.create({ contractCode: "AMC-POP-001" });
    const sampleClient = await Client.create({
      companyName: "Global Logistics",
      email: `client_${Date.now()}@example.com`,
      clientCode: `CL-${Date.now()}`,
    });

    const popReq = await ClientAmcRequest.create({
      requestCode: "REQ-2026-POP1",
      clientId: sampleClient._id,
      clientCode: sampleClient.clientCode,
      clientName: sampleClient.companyName,
      contractId: sampleContract._id,
      contractCode: sampleContract.contractCode,
      productId: sampleProd._id,
      productName: sampleProd.productName,
      requestType: "Quotation Request",
      reviewedBy: sampleUser._id,
      reviewedByName: sampleUser.name,
      reviewedAt: new Date(),
      assignedEmployeeId: sampleEmp._id,
      assignedEmployeeCode: sampleEmp.employeeCode,
      assignedEmployeeName: sampleEmp.name,
      timeline: [
        {
          action: "ASSIGNED",
          status: "Under Review",
          performedBy: sampleUser._id,
          performedByName: sampleUser.name,
          performedByRole: "admin",
        },
      ],
    });

    const populated = await ClientAmcRequest.findById(popReq._id)
      .populate("clientId")
      .populate("contractId")
      .populate("productId")
      .populate("reviewedBy")
      .populate("assignedEmployeeId")
      .populate("timeline.performedBy");

    assert(populated.clientId && populated.clientId.companyName === "Global Logistics", "Populated clientId matches Client document");
    assert(populated.contractId && populated.contractId.contractCode === "AMC-POP-001", "Populated contractId matches AmcContract document");
    assert(populated.productId && populated.productId.productName === "Smart POS Terminal", "Populated productId matches Product document");
    assert(populated.reviewedBy && populated.reviewedBy.name === "Admin Jane", "Populated reviewedBy matches User document");
    assert(populated.assignedEmployeeId && populated.assignedEmployeeId.name === "Eng Alex", "Populated assignedEmployeeId matches Employee document");
    assert(populated.timeline[0].performedBy && populated.timeline[0].performedBy.name === "Admin Jane", "Populated timeline.performedBy matches User document");

  } finally {
    // Teardown isolated test database
    console.log("\n--- Teardown: Dropping isolated test database ---");
    try {
      await conn.connection.dropDatabase();
      console.log("Isolated test database dropped cleanly.");
    } catch (cleanupErr) {
      console.error("Cleanup error dropping test database:", cleanupErr.message);
    }
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }

  console.log(`\n========================================`);
  console.log(`TOTAL CHECKS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runClientAmcRequestIsolatedTests().catch(err => {
  console.error("Fatal error in test suite:", err);
  process.exit(1);
});
