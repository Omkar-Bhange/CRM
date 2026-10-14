"use strict";

const mongoose = require("mongoose");

/* =====================================================
   AMC INVOICE SCHEMA

   This is the permanent financial invoice collection.

   Client Master can be archived or soft-deleted without
   affecting AMC invoices or payments.
===================================================== */

const amcInvoiceSchema =
  new mongoose.Schema(
    {
      invoiceCode: {
        type: String,
        required: [
          true,
          "AMC invoice code is required.",
        ],
        unique: true,
        trim: true,
        uppercase: true,
        index: true,
      },

      invoiceNumber: {
        type: Number,
        default: 0,
        min: 0,
      },

      invoiceDate: {
        type: Date,
        required: [
          true,
          "Invoice date is required.",
        ],
        default: Date.now,
        index: true,
      },

      invoiceType: {
        type: String,
        enum: [
          "Initial",
          "Renewal",
          "Adjustment",
        ],
        default: "Initial",
        index: true,
      },

      /*
       * Contract reference.
       */
      amcContractId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AmcContract",
        required: [
          true,
          "AMC contract is required.",
        ],
        index: true,
      },

      contractCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        index: true,
      },

      /*
       * Contract period represented by this invoice.
       */
      contractStartDate: {
        type: Date,
        required: true,
      },

      contractExpiryDate: {
        type: Date,
        required: true,
      },

      dueDate: {
        type: Date,
        required: [
          true,
          "Invoice due date is required.",
        ],
        index: true,
      },

      /*
       * Client reference plus permanent snapshot.
       *
       * Even when Client Master is later archived,
       * these values remain inside the invoice.
       */
      clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Client",
        default: null,
        index: true,
      },

      clientCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        index: true,
      },

      clientName: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },

      contactPerson: {
        type: String,
        default: "",
        trim: true,
      },

      contactMobile: {
        type: String,
        default: "",
        trim: true,
      },

      contactEmail: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
      },

      /*
       * Product reference plus permanent snapshot.
       */
      clientProductId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        index: true,
      },

      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        default: null,
        index: true,
      },

      productCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        index: true,
      },

      productName: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },

      productVersion: {
        type: String,
        default: "",
        trim: true,
      },

      plan: {
        type: String,
        enum: [
          "Basic",
          "Standard",
          "Premium",
          "Custom",
        ],
        default: "Standard",
      },

      licensedUsers: {
        type: Number,
        default: 1,
        min: 1,
      },

      description: {
        type: String,
        default: "",
        trim: true,
      },

      /*
       * GST and invoice totals.
       */
      taxableAmount: {
        type: Number,
        required: true,
        min: 0,
      },

      cgstRate: {
        type: Number,
        default: 0,
        min: 0,
      },

      cgstAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      sgstRate: {
        type: Number,
        default: 0,
        min: 0,
      },

      sgstAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      igstRate: {
        type: Number,
        default: 0,
        min: 0,
      },

      igstAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      totalTaxAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      totalAmount: {
        type: Number,
        required: true,
        min: 0,
      },

      /*
       * Payment summary is maintained from
       * permanent amcpayments records.
       */
      paidAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      pendingAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      paymentStatus: {
        type: String,
        enum: [
          "Pending",
          "Partially Paid",
          "Paid",
          "Overdue",
          "Cancelled",
        ],
        default: "Pending",
        index: true,
      },

      status: {
        type: String,
        enum: [
          "Draft",
          "Issued",
          "Cancelled",
        ],
        default: "Issued",
        index: true,
      },

      notes: {
        type: String,
        default: "",
        trim: true,
      },

      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      createdByName: {
        type: String,
        default: "",
        trim: true,
      },

      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      updatedByName: {
        type: String,
        default: "",
        trim: true,
      },

      taxClassification: {
        type: String,
        default: "Standard Rate (18%)",
        trim: true,
      },

      idempotencyKey: {
        type: String,
        default: null,
        trim: true,
        index: true,
        sparse: true,
      },

      paymentVersion: {
        type: Number,
        default: 0,
      },

      /*
       * Financial records should normally be cancelled,
       * not physically removed.
       */
      isDeleted: {
        type: Boolean,
        default: false,
        index: true,
      },

      deletedAt: {
        type: Date,
        default: null,
      },

      deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      deletedByName: {
        type: String,
        default: "",
        trim: true,
      },
    },
    {
      timestamps: true,
      collection: "amcinvoices",
    }
  );

amcInvoiceSchema.index({
  amcContractId: 1,
  invoiceDate: -1,
});

amcInvoiceSchema.index({
  clientId: 1,
  invoiceDate: -1,
});

amcInvoiceSchema.index({
  productId: 1,
  invoiceDate: -1,
});

amcInvoiceSchema.index(
  {
    amcContractId: 1,
    contractStartDate: 1,
    isDeleted: 1,
  },
  {
    unique: true,
    name: "uniq_amc_contract_active_start",
    partialFilterExpression: {
      isDeleted: false,
      status: {
        $in: ["Issued", "Partially Paid", "Paid", "Overdue"],
        $in: ["Issued", "Draft"],
      },
    },
  }
);

amcInvoiceSchema.index({
  invoiceCode: "text",
  contractCode: "text",
  clientCode: "text",
  clientName: "text",
  productCode: "text",
  productName: "text",
});

const AmcInvoice =
  mongoose.models.AmcInvoice ||
  mongoose.model(
    "AmcInvoice",
    amcInvoiceSchema
  );

module.exports = AmcInvoice;
