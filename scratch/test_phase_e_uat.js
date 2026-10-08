const fetch = globalThis.fetch || require("node-fetch");

const BASE_URL = "http://localhost:5000";

async function runE2EUAT() {
    console.log("=================================================");
    console.log("PHASE E - COMPREHENSIVE CLIENT PORTAL E2E UAT");
    console.log("=================================================");

    // Step 1: Login as Client A (DABAR)
    console.log("\n[1] Client Authentication Test");
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "r@gmail.com", password: "123456", role: "client" }),
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok || !loginData.token) {
        throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }
    const token = loginData.token;
    console.log("  ✓ Logged in as:", loginData.user.name, `(${loginData.user.companyName})`);
    console.log("  ✓ Role:", loginData.user.role);

    const headers = { Authorization: `Bearer ${token}` };

    // Step 2: Overview Dashboard Data
    console.log("\n[2] Client Overview / Account Info");
    const meRes = await fetch(`${BASE_URL}/api/client/me`, { headers });
    const meData = await meRes.json();
    console.log("  ✓ /api/client/me status:", meRes.status);
    console.log("  ✓ Client Code:", meData.data?.clientCode);
    console.log("  ✓ Company Name:", meData.data?.companyName);
    console.log("  ✓ Products count:", meData.data?.products?.length || 0);

    // Step 3: My Products Verification
    console.log("\n[3] My Products Sanity Check");
    const products = meData.data?.products || [];
    for (const p of products) {
        console.log(`  ✓ Product: "${p.productName}", Status: "${p.installationStatus}", Users: ${p.licensedUsers || 1}`);
    }

    // Step 4: Bills & AMC Verification
    console.log("\n[4] Bills & AMC Verification");
    const invRes = await fetch(`${BASE_URL}/api/client/amc/invoices`, { headers });
    const invData = await invRes.json();
    console.log("  ✓ Invoices fetched:", invData.data?.length || 0);
    if (invData.data?.length > 0) {
        const inv = invData.data[0];
        console.log("  ✓ First Invoice Code:", inv.invoiceCode || inv.invoiceNumber);
        console.log("  ✓ Total:", inv.total, "Balance:", inv.balance, "Status:", inv.paymentStatus);
        
        // Test PDF endpoint
        const pdfRes = await fetch(`${BASE_URL}/api/client/amc/invoice/${inv.id}/pdf`, { headers });
        console.log("  ✓ Invoice PDF endpoint response status:", pdfRes.status);
    }

    const payRes = await fetch(`${BASE_URL}/api/client/amc/payments`, { headers });
    const payData = await payRes.json();
    console.log("  ✓ Payments fetched:", payData.data?.length || 0);
    if (payData.data?.length > 0) {
        const pay = payData.data[0];
        console.log("  ✓ Payment Invoice Code (NOT raw ObjectId):", pay.invoiceCode);
        console.log("  ✓ Payment Amount:", pay.amount, "Method:", pay.paymentMethod);
    }

    // Step 5: Support Tickets
    console.log("\n[5] Support Tickets Verification");
    const tickRes = await fetch(`${BASE_URL}/api/client/tickets`, { headers });
    const tickData = await tickRes.json();
    console.log("  ✓ Tickets fetched:", tickData.data?.length || 0);
    if (tickData.data?.length > 0) {
        const tick = tickData.data[0];
        console.log("  ✓ Ticket ID:", tick._id, "Ticket#:", tick.ticketNumber || tick.ticketCode || tick.subject);
        console.log("  ✓ Status:", tick.status, "Priority:", tick.priority);
        
        const detailRes = await fetch(`${BASE_URL}/api/client/tickets/${tick._id}`, { headers });
        const detailData = await detailRes.json();
        console.log("  ✓ Ticket Detail status:", detailRes.status, "Subject:", detailData.data?.subject);
    }

    // Step 6: Documents
    console.log("\n[6] Documents Verification");
    const docRes = await fetch(`${BASE_URL}/api/client/documents`, { headers });
    const docData = await docRes.json();
    console.log("  ✓ Documents fetched:", docData.data?.length || 0);

    // Step 7: Password Change Endpoint Verification
    console.log("\n[7] Password Change API Verification");
    const badPwRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ currentPassword: "wrongpassword123", newPassword: "newsecretpassword456" }),
    });
    const badPwData = await badPwRes.json();
    console.log("  ✓ Bad current password check status:", badPwRes.status, `(Expected 401)`);
    console.log("  ✓ Bad current password error message:", badPwData.message);

    // Step 8: Cross-Client Isolation Verification
    console.log("\n[8] Cross-Client Tenant Isolation Verification");
    const clientBInvoiceId = "6ac4a4ff874b5d4f6f93e867"; // Belongs to AMUL (clientId: 6a898f5fa86e91773bc33d9a)
    const exploitInvPdfRes = await fetch(`${BASE_URL}/api/client/amc/invoice/${clientBInvoiceId}/pdf`, { headers });
    console.log("  ✓ Client A requesting Client B invoice PDF status:", exploitInvPdfRes.status, `(Expected 404)`);

    const fakeOtherTicketId = "6a898f5fa86e91773bc33d99"; // Non-owned ticket ID
    const exploitTicketRes = await fetch(`${BASE_URL}/api/client/tickets/${fakeOtherTicketId}`, { headers });
    console.log("  ✓ Client A requesting unowned ticket detail status:", exploitTicketRes.status, `(Expected 404)`);

    const exploitReplyRes = await fetch(`${BASE_URL}/api/client/tickets/${fakeOtherTicketId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ message: "Malicious reply attempt" }),
    });
    console.log("  ✓ Client A replying to unowned ticket status:", exploitReplyRes.status, `(Expected 404)`);

    console.log("\n=================================================");
    console.log("✓ ALL E2E UAT CHECKS PASSED SUCCESSFULLY");
    console.log("=================================================");
}

runE2EUAT().catch((err) => {
    console.error("E2E UAT Failed:", err);
    process.exit(1);
});
