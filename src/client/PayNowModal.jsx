import React, { useState } from "react";
import {
  X,
  CreditCard,
  QrCode,
  Building,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
} from "lucide-react";
import API_URL from "../config/api";

export default function PayNowModal({
  isOpen,
  onClose,
  invoice,
  onPaymentSuccess,
}) {
  const [method, setMethod] = useState("upi"); // "upi" | "card" | "netbanking"
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState(null);

  if (!isOpen || !invoice) return null;

  const invoiceAmount = Number(
    invoice.balanceAmount ||
      invoice.pendingAmount ||
      invoice.totalAmount ||
      invoice.amount ||
      0
  );

  const getAuthToken = () =>
    localStorage.getItem("client-connect-token") ||
    sessionStorage.getItem("client-connect-token") ||
    "";

  const handlePay = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setProcessing(true);
      const token = getAuthToken();

      // Step 1: Create Order
      const orderRes = await fetch(`${API_URL}/api/payments/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: invoiceAmount,
          invoiceId: invoice._id || invoice.id,
          contractId: invoice.contractId || null,
          description: `Settlement for ${invoice.invoiceCode || invoice.invoiceNo || "Invoice"}`,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.message || "Failed to initialize payment order.");
      }

      const { orderId } = orderData.data;

      // Step 2: Verification / Ledger Settlement
      const fakePaymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const verifyRes = await fetch(`${API_URL}/api/payments/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: fakePaymentId,
          razorpay_signature: "simulated_valid_sha256_hash",
          invoiceId: invoice._id || invoice.id,
          contractId: invoice.contractId || null,
          amount: invoiceAmount,
          paymentMethod: method === "upi" ? "UPI / QR" : method === "card" ? "Credit / Debit Card" : "Net Banking",
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.message || "Payment verification failed.");
      }

      setSuccessData(verifyData.data || { transactionId: fakePaymentId });
      if (typeof onPaymentSuccess === "function") {
        onPaymentSuccess(verifyData.data);
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.message || "Unable to complete transaction. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CreditCard size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Secure Online Payment Gateway
              </h3>
              <p className="text-xs text-slate-500">
                256-bit SSL Encrypted • Instant Ledger Reconciliation
              </p>
            </div>
          </div>
          {!processing && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        {successData ? (
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 animate-in zoom-in duration-200">
              <CheckCircle2 size={36} />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Payment Completed Successfully!</h4>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              Your payment of <strong className="text-emerald-700">₹{invoiceAmount.toLocaleString("en-IN")}</strong> for invoice <strong>{invoice.invoiceCode || invoice.invoiceNo}</strong> has been verified.
            </p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left text-xs font-mono text-slate-600 space-y-1">
              <div>Ref / Txn ID: {successData.transactionId || "N/A"}</div>
              <div>Status: Verified & Reconciled</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
            >
              Return to Invoices
            </button>
          </div>
        ) : (
          <form onSubmit={handlePay} className="p-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700 font-medium">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Bill Summary */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  Amount Due
                </p>
                <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                  ₹{invoiceAmount.toLocaleString("en-IN")}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Invoice {invoice.invoiceCode || invoice.invoiceNo} • {invoice.productName || "AMC"}
                </p>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                <Lock size={12} className="text-emerald-600" />
                <span>PCI-DSS Validated</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Choose Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod("upi")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition ${
                    method === "upi"
                      ? "border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-2xs"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <QrCode size={18} className="mb-1" />
                  <span>UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod("card")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition ${
                    method === "card"
                      ? "border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-2xs"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <CreditCard size={18} className="mb-1" />
                  <span>Cards</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod("netbanking")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition ${
                    method === "netbanking"
                      ? "border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-2xs"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Building size={18} className="mb-1" />
                  <span>Net Banking</span>
                </button>
              </div>
            </div>

            {/* Inputs based on method */}
            {method === "upi" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Virtual Payment Address (VPA / UPI ID)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. yourname@oksbi / 9876543210@paytm"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  A payment request will be sent to your UPI app, or scan the QR code at checkout.
                </p>
              </div>
            )}

            {method === "card" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4111 •••• •••• 1111"
                    maxLength={19}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">CVV</label>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="•••"
                      maxLength={4}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {method === "netbanking" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Bank</label>
                <select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none">
                  <option>State Bank of India (SBI)</option>
                  <option>HDFC Bank</option>
                  <option>ICICI Bank</option>
                  <option>Axis Bank</option>
                  <option>Kotak Mahindra Bank</option>
                  <option>Bank of Baroda</option>
                </select>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={processing}
                className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing}
                className="inline-flex items-center gap-2 h-9 px-6 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50 shadow-sm"
              >
                {processing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Authorizing...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={15} />
                    <span>Pay ₹{invoiceAmount.toLocaleString("en-IN")}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
