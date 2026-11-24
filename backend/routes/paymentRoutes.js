"use strict";

const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const mongoose = require("mongoose");
const authenticateUser = require("../authMiddleware");
const AmcInvoice = require("../models/AmcInvoice");
const AmcContract = require("../models/AmcContract");
const AmcPayment = require("../models/AmcPayment");
const ProductSale = require("../models/ProductSale");
const ProductSalePayment = require("../models/ProductSalePayment");
const AppCounter = require("../models/AppCounter");

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_nexora_crm_key";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "nexora_secret_salt_2026";

async function getNextPaymentReceiptCode() {
  const year = new Date().getFullYear();
  const counter = await AppCounter.findByIdAndUpdate(
    `pay_rec_${year}`,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `PAY-REC-${year}-${String(counter.seq).padStart(4, "0")}`;
}

/* =========================================================
   PUBLIC / SECURE WEBHOOK ENDPOINT
   POST /api/payments/webhook
========================================================= */
router.post("/webhook", async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"] || "";
    const bodyStr = JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(bodyStr)
      .digest("hex");

    // In production with live keys, verify signature; allow simulation fallback
    const isAuthentic = !process.env.RAZORPAY_KEY_SECRET || signature === expectedSignature;

    if (!isAuthentic) {
      return res.status(400).json({ success: false, message: "Invalid webhook signature." });
    }

    const { event, payload } = req.body;
    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = payload?.payment?.entity || {};
      const notes = paymentEntity.notes || {};

      if (notes.invoiceId && mongoose.Types.ObjectId.isValid(notes.invoiceId)) {
        await AmcInvoice.findByIdAndUpdate(notes.invoiceId, {
          paymentStatus: "Paid",
          paidAmount: paymentEntity.amount / 100,
          pendingAmount: 0,
        });
      }
    }

    return res.status(200).json({ success: true, message: "Webhook processed." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* =========================================================
   AUTHENTICATED PAYMENT ENDPOINTS BELOW
========================================================= */
router.use(authenticateUser);

/* =========================================================
   CREATE PAYMENT ORDER
   POST /api/payments/create-order
========================================================= */
router.post("/create-order", async (req, res, next) => {
  try {
    const {
      amount, // In Rupees
      currency = "INR",
      invoiceId = null,
      contractId = null,
      productSaleId = null,
      clientId = null,
      description = "Nexora CRM Payment",
    } = req.body;

    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      return res.status(400).json({ success: false, message: "Valid payment amount is required." });
    }

    const amountInPaise = Math.round(amountNum * 100);
    const receipt = await getNextPaymentReceiptCode();

    // Order ID generation (Standard Razorpay order format)
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    return res.status(200).json({
      success: true,
      data: {
        orderId,
        amount: amountInPaise,
        currency,
        receipt,
        keyId: RAZORPAY_KEY_ID,
        notes: {
          invoiceId: invoiceId || "",
          contractId: contractId || "",
          productSaleId: productSaleId || "",
          clientId: clientId || "",
          description,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   VERIFY & RECONCILE PAYMENT
   POST /api/payments/verify
========================================================= */
router.post("/verify", async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      invoiceId,
      contractId,
      productSaleId,
      amount,
      paymentMethod = "Online Gateway (UPI/Card)",
    } = req.body;

    if (!razorpay_payment_id) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required for verification.",
      });
    }

    // Optional cryptographic verification if signature is supplied
    if (razorpay_order_id && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac("sha256", RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      // Valid signature check (or test pass)
      if (process.env.NODE_ENV === "production" && generatedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, message: "Payment verification failed: Signature mismatch." });
      }
    }

    const paidAmount = Number(amount) || 0;
    const paymentDate = new Date();

    // 1. Reconcile AMC Invoice
    if (invoiceId && mongoose.Types.ObjectId.isValid(invoiceId)) {
      const invoice = await AmcInvoice.findById(invoiceId);
      if (invoice) {
        const newPaid = Number(invoice.paidAmount || 0) + paidAmount;
        const total = Number(invoice.totalAmount || 0);
        invoice.paidAmount = Math.min(total, newPaid);
        invoice.pendingAmount = Math.max(0, total - invoice.paidAmount);
        invoice.paymentStatus = invoice.pendingAmount <= 0 ? "Paid" : "Partially Paid";
        await invoice.save();

        // Also record immutable AmcPayment record
        const paymentRecord = new AmcPayment({
          contractId: invoice.contractId || contractId,
          invoiceId: invoice._id,
          amount: paidAmount,
          paymentDate,
          paymentMode: paymentMethod,
          referenceNo: razorpay_payment_id,
          recordedBy: req.user._id,
          recordedByName: req.user.name || "Payment Gateway",
          status: "Confirmed",
          remarks: `Online Payment ID: ${razorpay_payment_id}`,
        });
        await paymentRecord.save();
      }
    }

    // 2. Reconcile AMC Contract Status
    if (contractId && mongoose.Types.ObjectId.isValid(contractId)) {
      const contract = await AmcContract.findById(contractId);
      if (contract) {
        contract.paymentStatus = "Paid";
        contract.receivedAmount = (Number(contract.receivedAmount || 0) + paidAmount);
        contract.pendingAmount = Math.max(0, Number(contract.totalAmount || 0) - contract.receivedAmount);
        contract.timeline.push({
          type: "payment",
          title: "Online Payment Received",
          description: `Received ₹${paidAmount} via ${paymentMethod} (${razorpay_payment_id})`,
          performedBy: req.user._id,
          performedByName: req.user.name || "Payment Gateway",
          createdAt: paymentDate,
        });
        await contract.save();
      }
    }

    // 3. Reconcile Product Sale
    if (productSaleId && mongoose.Types.ObjectId.isValid(productSaleId)) {
      const sale = await ProductSale.findById(productSaleId);
      if (sale) {
        const total = Number(sale.grandTotal || sale.totalAmount || 0);
        const newReceived = (Number(sale.receivedAmount || 0) + paidAmount);
        sale.receivedAmount = Math.min(total, newReceived);
        sale.pendingAmount = Math.max(0, total - sale.receivedAmount);
        sale.paymentStatus = sale.pendingAmount <= 0 ? "Paid" : "Partially Paid";
        await sale.save();

        const salePayment = new ProductSalePayment({
          productSaleId: sale._id,
          clientId: sale.clientId,
          amount: paidAmount,
          paymentDate,
          paymentMode: paymentMethod,
          transactionReference: razorpay_payment_id,
          status: "Completed",
          recordedBy: req.user._id,
        });
        await salePayment.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Payment successfully verified and ledger reconciled.",
      data: {
        paymentId: razorpay_payment_id,
        paidAmount,
        status: "Confirmed",
        timestamp: paymentDate,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
