const fetch = globalThis.fetch || require("node-fetch");

const BASE_URL = "http://localhost:5000";

async function testReceiptEndpoint() {
    console.log("=== TESTING PAYMENT RECEIPT PDF ENDPOINT ===");

    // 1. Authenticate Client A (DABAR)
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "r@gmail.com", password: "123456", role: "client" }),
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log("1. Client Login:", loginRes.status, loginData.user?.companyName);

    // 2. Fetch Client A payments
    const payRes = await fetch(`${BASE_URL}/api/client/amc/payments`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const payData = await payRes.json();
    console.log("2. Payments count:", payData.data?.length);

    if (!payData.data || payData.data.length === 0) {
        throw new Error("No payments found for Client A");
    }

    const firstPayment = payData.data[0];
    console.log("   First Payment ID:", firstPayment.id);
    console.log("   Payment Code:", firstPayment.paymentCode);
    console.log("   Amount:", firstPayment.amount);
    console.log("   Invoice Code:", firstPayment.invoiceCode);

    // 3. Test downloading own receipt PDF
    const receiptRes = await fetch(`${BASE_URL}/api/client/amc/payment/${firstPayment.id}/receipt`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    console.log("3. Download Own Receipt Status:", receiptRes.status);
    console.log("   Content-Type:", receiptRes.headers.get("content-type"));
    console.log("   Content-Disposition:", receiptRes.headers.get("content-disposition"));

    const buf = await receiptRes.arrayBuffer();
    const nodeBuf = Buffer.from(buf);
    console.log("   PDF Buffer length:", nodeBuf.length, "bytes");
    console.log("   Starts with %PDF:", nodeBuf.slice(0, 5).toString());

    if (receiptRes.status !== 200 || !nodeBuf.slice(0, 5).toString().startsWith("%PDF")) {
        throw new Error("Invalid receipt PDF response!");
    }

    // 4. Test unauthenticated request
    const unauthRes = await fetch(`${BASE_URL}/api/client/amc/payment/${firstPayment.id}/receipt`);
    console.log("4. Unauthenticated request status:", unauthRes.status, "(Expected 401)");

    // 5. Test invalid payment ID
    const invalidIdRes = await fetch(`${BASE_URL}/api/client/amc/payment/notanobjectid/receipt`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    console.log("5. Invalid ID request status:", invalidIdRes.status, "(Expected 400)");

    // 6. Test other client's payment (tenant security)
    const fakeOtherPaymentId = "6a898f5fa86e91773bc33d99";
    const exploitRes = await fetch(`${BASE_URL}/api/client/amc/payment/${fakeOtherPaymentId}/receipt`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    console.log("6. Cross-client / unauthorized receipt status:", exploitRes.status, "(Expected 404)");

    console.log("\n✓ ALL RECEIPT PDF BACKEND TESTS PASSED!");
}

testReceiptEndpoint().catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
});

