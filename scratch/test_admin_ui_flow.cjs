const path = require("path");
const fs = require("fs");
const jwt = require(path.join(__dirname, "../backend/node_modules/jsonwebtoken"));
const mongoose = require(path.join(__dirname, "../backend/node_modules/mongoose"));
require(path.join(__dirname, "../backend/node_modules/dotenv")).config({ path: path.join(__dirname, "../backend/.env") });

const API_BASE = "http://localhost:5000";
const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret";

async function main() {
    console.log("============================================================");
    console.log("ENHANCEMENT 3: ADMIN WORKFLOW & AUDIT TEST SUITE");
    console.log("============================================================\n");

    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ClientConnectTrack";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for contract & accounting audits.");

    const db = mongoose.connection.db;

    // 1. Client login
    console.log("1. Authenticating test client (r@gmail.com)...");
    const clientLoginRes = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "r@gmail.com", password: "123456", role: "client" }),
    });
    let clientToken;
    if (clientLoginRes.status === 200) {
        const clientLogin = await clientLoginRes.json();
        clientToken = clientLogin.token;
    } else {
        // Fallback to direct client user token
        const clientUser = await db.collection("users").findOne({ email: "r@gmail.com" });
        if (!clientUser) throw new Error("Client user r@gmail.com not found");
        clientToken = jwt.sign(
            { userId: clientUser._id, role: "client", email: clientUser.email, clientId: clientUser.clientId },
            JWT_SECRET,
            { expiresIn: "1h" }
        );
    }
    console.log("   Client token acquired.");

    // 2. Admin token
    console.log("2. Generating Admin session for totalsolution2023@gmail.com...");
    const adminUser = await db.collection("users").findOne({ email: "totalsolution2023@gmail.com", role: "admin" });
    if (!adminUser) throw new Error("Admin user not found");
    const adminToken = jwt.sign(
        { userId: adminUser._id, role: "admin", email: adminUser.email },
        JWT_SECRET,
        { expiresIn: "1h" }
    );
    console.log("   Admin token acquired.");

    // 3. Security check: Client token trying to access admin amc-requests
    console.log("3. Testing security: Client attempting to access Admin AMC endpoint...");
    const clientAccessAdminRes = await fetch(`${API_BASE}/api/admin/amc-requests`, {
        headers: { Authorization: `Bearer ${clientToken}` },
    });
    console.log(`   Client access status: ${clientAccessAdminRes.status} (Expected 403)`);
    if (clientAccessAdminRes.status !== 403) {
        throw new Error(`Security failed: expected 403, got ${clientAccessAdminRes.status}`);
    }

    // 4. Client finds contract and submits renewal request
    console.log("4. Client submitting fresh renewal request...");
    const clientAmcRes = await fetch(`${API_BASE}/api/client/amc/contracts`, {
        headers: { Authorization: `Bearer ${clientToken}` },
    });
    const clientAmcData = await clientAmcRes.json();
    if (!clientAmcData.data || clientAmcData.data.length === 0) {
        throw new Error("No AMC contracts found for client.");
    }
    const contract = clientAmcData.data[0];
    const contractId = contract.id || contract._id;

    // Baseline audit
    const contractBefore = await db.collection("amccontracts").findOne({ _id: new mongoose.Types.ObjectId(contractId) });
    const invoicesCountBefore = await db.collection("amcinvoices").countDocuments();
    const paymentsCountBefore = await db.collection("amcpayments").countDocuments();

    console.log(`   Baseline: Contract Expiry = ${contractBefore.expiryDate}, Status = ${contractBefore.status}`);
    console.log(`   Baseline: Invoices = ${invoicesCountBefore}, Payments = ${paymentsCountBefore}`);

    // Clean previous active requests for this contract if any
    await db.collection("clientamcrequests").deleteMany({ contractId: new mongoose.Types.ObjectId(contractId), status: { $in: ["Submitted", "Under Review", "Quotation Ready"] } });

    const submitRes = await fetch(`${API_BASE}/api/client/amc/renewal-request`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${clientToken}`,
        },
        body: JSON.stringify({
            contractId,
            requestType: "AMC Renewal",
            renewalPeriod: "1 Year",
            remarks: "Request submitted for Admin UI workflow verification",
        }),
    });
    const submitJson = await submitRes.json();
    console.log(`   Submit status: ${submitRes.status}, Code: ${submitJson.data?.requestCode}`);
    if (submitRes.status !== 201) throw new Error("Submit failed: " + JSON.stringify(submitJson));
    const requestId = submitJson.data.id || submitJson.data._id;
    const requestCode = submitJson.data.requestCode;

    // 5. Admin lists requests
    console.log("5. Admin fetching requests via GET /api/admin/amc-requests...");
    const adminListRes = await fetch(`${API_BASE}/api/admin/amc-requests`, {
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminListData = await adminListRes.json();
    console.log(`   Admin found ${adminListData.data.length} total request(s).`);
    const foundReq = adminListData.data.find(r => r.requestCode === requestCode);
    if (!foundReq) throw new Error("Submitted request not found in admin list");
    console.log(`   Found request ${foundReq.requestCode}: Status = ${foundReq.status}, Client = ${foundReq.clientName}`);

    // 6. Admin starts review
    console.log("6. Admin transitions to 'Under Review'...");
    const fdReview = new FormData();
    fdReview.append("status", "Under Review");
    fdReview.append("clientRemarks", "AMC support desk has started reviewing your contract terms.");
    fdReview.append("adminNotes", "Internal note: Assessed standard pricing.");

    const reviewRes = await fetch(`${API_BASE}/api/admin/amc-requests/${requestId}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: fdReview,
    });
    const reviewData = await reviewRes.json();
    console.log(`   Review transition status: ${reviewRes.status}, New status: ${reviewData.data?.status}`);
    if (reviewData.data?.status !== "Under Review") throw new Error("Review transition failed");

    // 7. Admin prepares quotation
    console.log("7. Admin prepares quotation and transitions to 'Quotation Ready'...");
    const dummyPdfContent = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF");
    const blob = new Blob([dummyPdfContent], { type: "application/pdf" });

    const fdQuote = new FormData();
    fdQuote.append("status", "Quotation Ready");
    fdQuote.append("quotationAmount", "21500");
    fdQuote.append("quotationDetails", "Comprehensive annual maintenance including remote troubleshooting and 2 on-site preventive visits.");
    fdQuote.append("clientRemarks", "Formal quotation attached. Amount: Rs. 21,500.");
    fdQuote.append("adminNotes", "Confidential: Standard 20% discount applied by GM.");
    fdQuote.append("quotationFile", blob, `Quotation_${requestCode}.pdf`);

    const quoteRes = await fetch(`${API_BASE}/api/admin/amc-requests/${requestId}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: fdQuote,
    });
    const quoteData = await quoteRes.json();
    console.log(`   Quotation transition status: ${quoteRes.status}, Status: ${quoteData.data?.status}`);
    console.log(`   Quotation Amount: Rs. ${quoteData.data?.quotationAmount}`);
    console.log(`   Quotation Doc: ${quoteData.data?.quotationDocument?.fileName}`);

    // 8. Client views request and verifies privacy of adminNotes
    console.log("8. Verifying privacy: Client fetching request details...");
    const clientReqsRes = await fetch(`${API_BASE}/api/client/amc/requests`, {
        headers: { Authorization: `Bearer ${clientToken}` },
    });
    const clientReqsData = await clientReqsRes.json();
    const clientReq = clientReqsData.data.find(r => r.requestCode === requestCode);
    if (!clientReq) throw new Error("Client cannot find own request");

    console.log(`   Client sees status: ${clientReq.status}`);
    console.log(`   Client sees quote amount: Rs. ${clientReq.quotationAmount}`);
    console.log(`   Client hasQuotationDocument: ${clientReq.hasQuotationDocument}`);
    console.log(`   Client sees adminNotes? ${clientReq.adminNotes !== undefined ? "LEAKED!" : "NO (Correctly Hidden)"}`);

    if (clientReq.adminNotes !== undefined) {
        throw new Error("SECURITY FAILURE: adminNotes leaked to client payload!");
    }
    const leakedInTimeline = clientReq.timeline.some(t => t.remarks && t.remarks.includes("Confidential: Standard 20%"));
    console.log(`   Internal note in client timeline? ${leakedInTimeline ? "LEAKED!" : "NO (Clean Separation)"}`);
    if (leakedInTimeline) throw new Error("SECURITY FAILURE: adminNotes leaked into client timeline remarks!");

    // 9. Admin marks request as Completed
    console.log("9. Admin marks request as 'Completed'...");
    const fdComplete = new FormData();
    fdComplete.append("status", "Completed");
    fdComplete.append("clientRemarks", "Commercial agreement finalized. Thank you.");
    fdComplete.append("adminNotes", "Agreement signed via email confirmation.");

    const completeRes = await fetch(`${API_BASE}/api/admin/amc-requests/${requestId}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: fdComplete,
    });
    const completeData = await completeRes.json();
    console.log(`   Complete status: ${completeRes.status}, Final status: ${completeData.data?.status}`);
    console.log(`   activeRequestKey cleared: ${completeData.data?.activeRequestKey === null ? "YES" : "NO"}`);

    // 10. Audit: Verify contract and accounting records are 100% untouched
    console.log("\n============================================================");
    console.log("10. VERIFYING STRICT BUSINESS RULE: REQUEST RENEWAL != RENEW AMC");
    console.log("============================================================");
    const contractAfter = await db.collection("amccontracts").findOne({ _id: new mongoose.Types.ObjectId(contractId) });
    const invoicesCountAfter = await db.collection("amcinvoices").countDocuments();
    const paymentsCountAfter = await db.collection("amcpayments").countDocuments();

    console.log(`   Contract Expiry: Before = ${contractBefore.expiryDate}, After = ${contractAfter.expiryDate}`);
    console.log(`   Contract Status: Before = ${contractBefore.status}, After = ${contractAfter.status}`);
    console.log(`   Contract Renewal History: Before = ${contractBefore.renewalHistory?.length || 0}, After = ${contractAfter.renewalHistory?.length || 0}`);
    console.log(`   Total Invoices: Before = ${invoicesCountBefore}, After = ${invoicesCountAfter}`);
    console.log(`   Total Payments: Before = ${paymentsCountBefore}, After = ${paymentsCountAfter}`);

    if (String(contractBefore.expiryDate) !== String(contractAfter.expiryDate)) {
        throw new Error("CONTRACT INTEGRITY VIOLATED: Expiry date was altered!");
    }
    if (contractBefore.status !== contractAfter.status) {
        throw new Error("CONTRACT INTEGRITY VIOLATED: Status was altered!");
    }
    if ((contractBefore.renewalHistory?.length || 0) !== (contractAfter.renewalHistory?.length || 0)) {
        throw new Error("CONTRACT INTEGRITY VIOLATED: Renewal history was modified!");
    }
    if (invoicesCountBefore !== invoicesCountAfter) {
        throw new Error("ACCOUNTING INTEGRITY VIOLATED: Invoice was auto-created!");
    }
    if (paymentsCountBefore !== paymentsCountAfter) {
        throw new Error("ACCOUNTING INTEGRITY VIOLATED: Payment was auto-created!");
    }

    console.log("\n>>> ALL ADMIN WORKFLOW AND AUDIT CHECKS PASSED WITH 100% SUCCESS <<<");
    await mongoose.disconnect();
    process.exit(0);
}

main().catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
});
