const http = require("http");
const fs = require("fs");
const path = require("path");
const jwt = require(path.join(__dirname, "../backend/node_modules/jsonwebtoken"));
const mongoose = require(path.join(__dirname, "../backend/node_modules/mongoose"));
require(path.join(__dirname, "../backend/node_modules/dotenv")).config({ path: path.join(__dirname, "../backend/.env") });

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret";

function request(options, body = null, isMultipart = false, boundary = "") {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const buffer = Buffer.concat(chunks);
        const text = buffer.toString("utf8");
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(text), buffer });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: text, buffer });
        }
      });
    });
    req.on("error", reject);
    if (body) {
      if (Buffer.isBuffer(body)) {
        req.write(body);
      } else if (typeof body === "string") {
        req.write(body);
      } else {
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
}

async function run() {
  console.log("============================================================");
  console.log("CLIENT PORTAL ENHANCEMENT 3: AMC RENEWAL & QUOTATION TEST SUITE");
  console.log("============================================================\n");

  // Connect to DB directly for baseline audits
  const dbUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ClientConnectTrack";
  await mongoose.connect(dbUri);
  console.log("Connected to MongoDB for contract & accounting audits.");

  const AmcContract = mongoose.model(
    "AmcContractAudit",
    new mongoose.Schema({}, { strict: false }),
    "amccontracts"
  );
  const AmcInvoice = mongoose.model(
    "AmcInvoiceAudit",
    new mongoose.Schema({}, { strict: false }),
    "amcinvoices"
  );
  const AmcPayment = mongoose.model(
    "AmcPaymentAudit",
    new mongoose.Schema({}, { strict: false }),
    "amcpayments"
  );
  const ClientAmcRequest = mongoose.model(
    "ClientAmcRequestAudit",
    new mongoose.Schema({}, { strict: false }),
    "clientamcrequests"
  );
  const User = mongoose.model(
    "UserAudit",
    new mongoose.Schema({ email: String, role: String, name: String }, { strict: false }),
    "users"
  );

  // Clean previous test requests
  await ClientAmcRequest.deleteMany({ remarks: /test/i });

  // 1. Client Login
  console.log("1. Authenticating test client (r@gmail.com)...");
  const loginRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/auth/login",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { email: "r@gmail.com", password: "123456", role: "client" }
  );
  if (loginRes.status !== 200 || !loginRes.body.token) {
    throw new Error(`Client login failed with status ${loginRes.status}`);
  }
  const clientToken = loginRes.body.token;
  const clientId = loginRes.body.user?.clientId || loginRes.body.user?._id;
  console.log("   Client authenticated successfully. Token acquired.\n");

  // 2. Fetch Client's AMC Contracts
  console.log("2. Fetching client AMC contracts...");
  const contractsRes = await request({
    hostname: "localhost",
    port: 5000,
    path: "/api/client/amc/contracts",
    method: "GET",
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  if (contractsRes.status !== 200 || !contractsRes.body.data || contractsRes.body.data.length === 0) {
    throw new Error("No AMC contracts found for client.");
  }
  const testContract = contractsRes.body.data[0];
  console.log(`   Found contract: ${testContract.contractCode} (${testContract.productName}), Status: ${testContract.status}, Expiry: ${testContract.endDate}\n`);

  // Baseline Accounting & Contract Audit Snapshot
  const initialContractDoc = await AmcContract.findById(testContract.id).lean();
  const initialInvoiceCount = await AmcInvoice.countDocuments({ isDeleted: false });
  const initialPaymentCount = await AmcPayment.countDocuments({ isDeleted: false });
  console.log("   --- BASELINE AUDIT RECORDED ---");
  console.log(`   Contract Start Date: ${initialContractDoc.startDate}`);
  console.log(`   Contract Expiry Date: ${initialContractDoc.expiryDate}`);
  console.log(`   Contract Status: ${initialContractDoc.status}`);
  console.log(`   Contract Renewal History Entries: ${(initialContractDoc.renewalHistory || []).length}`);
  console.log(`   System Total Invoices: ${initialInvoiceCount}`);
  console.log(`   System Total Payments: ${initialPaymentCount}\n`);

  // 3. Submit AMC Renewal Request
  console.log("3. Submitting new AMC Renewal request...");
  const submitRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/client/amc/renewal-request",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${clientToken}`,
      },
    },
    {
      contractId: testContract.id,
      requestType: "AMC Renewal",
      renewalPeriod: "1 Year",
      preferredStartDate: testContract.endDate,
      remarks: "Test renewal request from automated test suite",
    }
  );
  console.log(`   Status: ${submitRes.status}`);
  if (submitRes.status !== 201 || !submitRes.body.success) {
    throw new Error(`Failed to submit request: ${JSON.stringify(submitRes.body)}`);
  }
  const createdReq = submitRes.body.data;
  console.log(`   Generated Request Code: ${createdReq.requestCode}`);
  console.log(`   Status: ${createdReq.status}, Type: ${createdReq.requestType}, Period: ${createdReq.renewalPeriod}`);
  if (!/^AMC-REQ-\d{4}-\d{4}$/.test(createdReq.requestCode)) {
    throw new Error(`Request code format invalid: ${createdReq.requestCode}`);
  }
  console.log("   Request code conforms to AMC-REQ-YYYY-XXXX format.\n");

  // 4. Duplicate Concurrency Protection Check
  console.log("4. Testing duplicate active request protection (expecting HTTP 409 Conflict)...");
  const dupRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/client/amc/renewal-request",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${clientToken}`,
      },
    },
    {
      contractId: testContract.id,
      requestType: "AMC Renewal",
      renewalPeriod: "1 Year",
      remarks: "Duplicate attempt",
    }
  );
  console.log(`   Status: ${dupRes.status}, Message: ${dupRes.body.message}`);
  if (dupRes.status !== 409) {
    throw new Error(`Expected 409 Conflict on duplicate request, got ${dupRes.status}`);
  }
  console.log("   Duplicate active request properly rejected with 409 Conflict.\n");

  // 5. Tenant Isolation Check
  console.log("5. Testing tenant isolation with non-existent / other client contract ID...");
  const fakeId = new mongoose.Types.ObjectId().toString();
  const isoRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/client/amc/renewal-request",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${clientToken}`,
      },
    },
    {
      contractId: fakeId,
      requestType: "AMC Renewal",
      renewalPeriod: "1 Year",
    }
  );
  console.log(`   Status: ${isoRes.status}, Message: ${isoRes.body.message}`);
  if (isoRes.status !== 404) {
    throw new Error(`Expected 404 for unowned contract ID, got ${isoRes.status}`);
  }
  console.log("   Tenant isolation verified: client cannot request for arbitrary contracts.\n");

  // 6. Client Cancellation Workflow
  console.log("6. Testing Client cancellation while in 'Submitted' state...");
  const cancelRes = await request({
    hostname: "localhost",
    port: 5000,
    path: `/api/client/amc/requests/${createdReq.id}/cancel`,
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${clientToken}`,
    },
  }, { remarks: "Client test cancellation" });
  console.log(`   Status: ${cancelRes.status}, Success: ${cancelRes.body.success}`);
  if (cancelRes.status !== 200 || cancelRes.body.data.status !== "Cancelled") {
    throw new Error(`Cancellation failed: ${JSON.stringify(cancelRes.body)}`);
  }
  console.log("   Request cancelled successfully.");

  // Check DB to ensure activeRequestKey was set to null
  const cancelledDbDoc = await ClientAmcRequest.findById(createdReq.id).lean();
  if (cancelledDbDoc.activeRequestKey !== null) {
    throw new Error("activeRequestKey was not cleared to null on cancellation!");
  }
  console.log("   activeRequestKey cleared to null on Cancelled terminal state.\n");

  // Re-submit fresh request for next steps
  console.log("6b. Submitting a new fresh request after previous cancellation...");
  const freshSubmitRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/client/amc/renewal-request",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${clientToken}`,
      },
    },
    {
      contractId: testContract.id,
      requestType: "AMC Renewal",
      renewalPeriod: "1 Year",
      preferredStartDate: testContract.endDate,
      remarks: "Fresh active request for Admin review testing",
    }
  );
  if (freshSubmitRes.status !== 201) {
    throw new Error(`Fresh submit failed: ${JSON.stringify(freshSubmitRes.body)}`);
  }
  const activeReq = freshSubmitRes.body.data;
  console.log(`   New Request Created: ${activeReq.requestCode}\n`);

  // 7. Admin Workflow & Status Transitions
  console.log("7. Generating Admin session for totalsolution2023@gmail.com...");
  const adminUser = await User.findOne({ email: "totalsolution2023@gmail.com", role: "admin" }).lean();
  if (!adminUser) throw new Error("Admin user not found in database");
  const adminToken = jwt.sign(
    { userId: adminUser._id, role: "admin", email: adminUser.email },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
  console.log("   Admin token generated.");

  // Admin GET requests
  console.log("   Admin fetching AMC requests list...");
  const adminListRes = await request({
    hostname: "localhost",
    port: 5000,
    path: "/api/admin/amc-requests",
    method: "GET",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`   Status: ${adminListRes.status}, Total requests: ${adminListRes.body.total}`);
  if (adminListRes.status !== 200 || !Array.isArray(adminListRes.body.data)) {
    throw new Error("Admin failed to list requests");
  }

  // Admin transitions status to 'Under Review'
  console.log("   Admin transitions status to 'Under Review'...");
  const underReviewRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: `/api/admin/amc-requests/${activeReq.id}/status`,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
    },
    {
      status: "Under Review",
      adminNotes: "Internal note: verifying contract license count",
    }
  );
  console.log(`   Status: ${underReviewRes.status}, New status: ${underReviewRes.body.data.status}`);
  if (underReviewRes.status !== 200 || underReviewRes.body.data.status !== "Under Review") {
    throw new Error("Admin update to Under Review failed");
  }

  // Client attempt to cancel while 'Under Review' -> MUST FAIL WITH 409
  console.log("   Client attempting to cancel while 'Under Review' (expecting HTTP 409 Conflict)...");
  const blockedCancelRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: `/api/client/amc/requests/${activeReq.id}/cancel`,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${clientToken}`,
      },
    },
    { remarks: "Trying to cancel while under review" }
  );
  console.log(`   Status: ${blockedCancelRes.status}, Message: ${blockedCancelRes.body.message}`);
  if (blockedCancelRes.status !== 409) {
    throw new Error(`Expected 409 Conflict when cancelling under review request, got ${blockedCancelRes.status}`);
  }
  console.log("   Client cancellation properly blocked while under review.\n");

  // Admin transitions to 'Quotation Ready' with multipart quotation file
  console.log("   Admin uploading quotation file and setting 'Quotation Ready'...");
  const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
  const samplePdfContent = "%PDF-1.4\n1 0 obj\n<< /Title (AMC Quotation) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF";
  
  let multipartBody = "";
  multipartBody += `--${boundary}\r\n`;
  multipartBody += `Content-Disposition: form-data; name="status"\r\n\r\nQuotation Ready\r\n`;
  multipartBody += `--${boundary}\r\n`;
  multipartBody += `Content-Disposition: form-data; name="quotationAmount"\r\n\r\n18500\r\n`;
  multipartBody += `--${boundary}\r\n`;
  multipartBody += `Content-Disposition: form-data; name="quotationDetails"\r\n\r\nStandard 1-year AMC including unlimited priority email and remote support\r\n`;
  multipartBody += `--${boundary}\r\n`;
  multipartBody += `Content-Disposition: form-data; name="adminNotes"\r\n\r\nInternal: 10% commercial discount applied\r\n`;
  multipartBody += `--${boundary}\r\n`;
  multipartBody += `Content-Disposition: form-data; name="quotationFile"; filename="Quotation_${activeReq.requestCode}.pdf"\r\n`;
  multipartBody += `Content-Type: application/pdf\r\n\r\n`;
  multipartBody += samplePdfContent;
  multipartBody += `\r\n--${boundary}--\r\n`;

  const quoteUploadRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: `/api/admin/amc-requests/${activeReq.id}/status`,
      method: "PATCH",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${adminToken}`,
      },
    },
    Buffer.from(multipartBody, "utf8")
  );
  console.log(`   Status: ${quoteUploadRes.status}, Status: ${quoteUploadRes.body.data?.status}`);
  if (quoteUploadRes.status !== 200 || quoteUploadRes.body.data.status !== "Quotation Ready") {
    throw new Error(`Failed to upload quotation: ${JSON.stringify(quoteUploadRes.body)}`);
  }
  console.log(`   Quotation Amount: ₹${quoteUploadRes.body.data.quotationAmount}`);
  console.log(`   File uploaded: ${quoteUploadRes.body.data.quotationDocument?.fileName}\n`);

  // Client view requests & verify sanitization (NO internal notes or employee IDs leaked)
  console.log("8. Verifying Client view and data sanitization...");
  const clientViewRes = await request({
    hostname: "localhost",
    port: 5000,
    path: "/api/client/amc/requests",
    method: "GET",
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  const clientReqItem = clientViewRes.body.data.find((r) => r.id === activeReq.id);
  if (!clientReqItem) throw new Error("Request not found in client view");
  console.log(`   Client sees status: ${clientReqItem.status}`);
  console.log(`   Client sees quote amount: ₹${clientReqItem.quotationAmount}`);
  console.log(`   Client sees download URL: ${clientReqItem.quotationDownloadUrl}`);
  if (clientReqItem.adminNotes !== undefined) {
    throw new Error("LEAK: adminNotes was exposed to client!");
  }
  if (clientReqItem.filePath !== undefined || clientReqItem.quotationDocument?.filePath !== undefined) {
    throw new Error("LEAK: Server file path was exposed to client!");
  }
  console.log("   Client sanitization verified: zero internal notes or file paths leaked.\n");

  // Client downloads quotation file
  console.log("9. Testing streaming quotation download via client endpoint...");
  const streamRes = await request({
    hostname: "localhost",
    port: 5000,
    path: `/api/client/amc/requests/${activeReq.id}/quotation`,
    method: "GET",
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  console.log(`   Status: ${streamRes.status}, Content-Type: ${streamRes.headers["content-type"]}`);
  if (streamRes.status !== 200) {
    throw new Error(`Quotation download failed with status ${streamRes.status}`);
  }
  if (streamRes.buffer.toString("utf8") !== samplePdfContent) {
    throw new Error("Downloaded quotation binary content does not match uploaded file!");
  }
  console.log("   Quotation PDF downloaded and byte-verified successfully.\n");

  // Admin marks request as 'Completed'
  console.log("10. Admin marks request as 'Completed'...");
  const completeRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: `/api/admin/amc-requests/${activeReq.id}/status`,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
    },
    { status: "Completed", adminNotes: "Renewal commercial terms accepted" }
  );
  console.log(`   Status: ${completeRes.status}, Body: ${JSON.stringify(completeRes.body)}`);
  if (completeRes.status !== 200 || completeRes.body.data?.status !== "Completed") {
    throw new Error(`Admin complete failed: ${JSON.stringify(completeRes.body)}`);
  }
  const completedDbDoc = await ClientAmcRequest.findById(activeReq.id).lean();
  if (completedDbDoc.activeRequestKey !== null) {
    throw new Error("activeRequestKey was not cleared on Completed terminal state!");
  }
  console.log("   Completed state verified and activeRequestKey cleared to null.\n");

  // 11. Client Notification History Verification
  console.log("11. Verifying Client Notification History for AMC request events...");
  const notifRes = await request({
    hostname: "localhost",
    port: 5000,
    path: "/api/client/notifications?limit=20",
    method: "GET",
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  const notifs = notifRes.body.notifications || [];
  const reqNotifs = notifs.filter((n) =>
    ["AMC_REQUEST_SUBMITTED", "AMC_QUOTATION_READY", "AMC_REQUEST_UPDATED"].includes(n.type)
  );
  console.log(`   Found ${reqNotifs.length} AMC request notification(s):`);
  reqNotifs.forEach((n) => console.log(`   - [${n.type}] ${n.title}: "${n.message}"`));
  if (reqNotifs.length === 0) {
    throw new Error("No AMC request notifications generated!");
  }
  console.log("   Notification history integration verified.\n");

  // 12. FINAL CRITICAL NON-NEGOTIABLE SAFETY VERIFICATION
  console.log("============================================================");
  console.log("12. AUDIT VERIFICATION: REQUEST RENEWAL != RENEW AMC");
  console.log("============================================================");
  const finalContractDoc = await AmcContract.findById(testContract.id).lean();
  const finalInvoiceCount = await AmcInvoice.countDocuments({ isDeleted: false });
  const finalPaymentCount = await AmcPayment.countDocuments({ isDeleted: false });

  console.log(`   Contract Start Date: Initial = ${initialContractDoc.startDate}, Final = ${finalContractDoc.startDate}`);
  console.log(`   Contract Expiry Date: Initial = ${initialContractDoc.expiryDate}, Final = ${finalContractDoc.expiryDate}`);
  console.log(`   Contract Status: Initial = ${initialContractDoc.status}, Final = ${finalContractDoc.status}`);
  console.log(`   Contract Renewal History: Initial = ${(initialContractDoc.renewalHistory || []).length}, Final = ${(finalContractDoc.renewalHistory || []).length}`);
  console.log(`   System Total Invoices: Initial = ${initialInvoiceCount}, Final = ${finalInvoiceCount}`);
  console.log(`   System Total Payments: Initial = ${initialPaymentCount}, Final = ${finalPaymentCount}`);

  if (String(initialContractDoc.startDate) !== String(finalContractDoc.startDate)) {
    throw new Error("VIOLATION: AmcContract.startDate was modified!");
  }
  if (String(initialContractDoc.expiryDate) !== String(finalContractDoc.expiryDate)) {
    throw new Error("VIOLATION: AmcContract.expiryDate was modified!");
  }
  if (initialContractDoc.status !== finalContractDoc.status) {
    throw new Error("VIOLATION: AmcContract.status was modified!");
  }
  if ((initialContractDoc.renewalHistory || []).length !== (finalContractDoc.renewalHistory || []).length) {
    throw new Error("VIOLATION: AmcContract.renewalHistory was modified!");
  }
  if (initialInvoiceCount !== finalInvoiceCount) {
    throw new Error("VIOLATION: An invoice was automatically created!");
  }
  if (initialPaymentCount !== finalPaymentCount) {
    throw new Error("VIOLATION: A payment was automatically created!");
  }

  console.log("\n>>> ALL VERIFICATION CHECKS PASSED WITH 100% SUCCESS <<<");
  console.log("============================================================\n");

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
