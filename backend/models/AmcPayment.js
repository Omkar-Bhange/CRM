"use strict";

const mongoose = require("mongoose");

/* =====================================================
   AMC PAYMENT SCHEMA
===================================================== */

const amcPaymentSchema =
  new mongoose.Schema(
    {
      paymentCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
        index: true,
      },

      idempotencyKey: {
        type: String,
        default: null,
        trim: true,
        index: true,
        sparse: true,
      },

      amcContractId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AmcContract",
        required: true,
        index: true,
      },
            /*
       * Every payment belongs to one permanent invoice.
       */
      amcInvoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AmcInvoice",
        required: [
          true,
          "AMC invoice is required.",
        ],
        index: true,
      },

      contractCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
      },

      invoiceCode: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
      },

      clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Client",
        required: true,
        index: true,
      },

      clientCode: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
      },

      clientName: {
        type: String,
        required: true,
        trim: true,
      },

      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        default: null,
      },

      productCode: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
      },

      productName: {
        type: String,
        default: "",
        trim: true,
      },

      amount: {
        type: Number,
        required: [
          true,
          "Payment amount is required.",
        ],
        min: 0.01,
      },

      paymentDate: {
        type: Date,
        required: [
          true,
          "Payment date is required.",
        ],
        index: true,
      },

      mode: {
        type: String,
        enum: [
          "Cash",
          "Bank Transfer",
          "UPI",
          "Cheque",
          "Card",
          "Other",
        ],
        default: "Bank Transfer",
      },

      referenceNo: {
        type: String,
        default: "",
        trim: true,
      },

      notes: {
        type: String,
        default: "",
        trim: true,
      },

      receivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      receivedByName: {
        type: String,
        default: "",
        trim: true,
      },

      isDeleted: {
        type: Boolean,
        default: false,
        index: true,
      },
    },
    {
      timestamps: true,
      collection: "amcpayments",
    }
  );

amcPaymentSchema.index({
  amcContractId: 1,
  paymentDate: -1,
});

const AmcPayment =
  mongoose.models.AmcPayment ||
  mongoose.model(
    "AmcPayment",
    amcPaymentSchema
  );

module.exports = AmcPayment;
