"use strict";

const mongoose = require("mongoose");

/* =====================================================
   QUOTATION ITEM SUB-SCHEMA
===================================================== */
const quotationItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    itemCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxableAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    gstRate: {
      type: Number,
      default: 18,
      min: 0,
    },
    gstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  { _id: true }
);

/* =====================================================
   QUOTATION MASTER SCHEMA (CPQ & Formal Proposals)
===================================================== */
const quotationSchema = new mongoose.Schema(
  {
    quotationNo: {
      type: String,
      required: [true, "Quotation number is required."],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deal",
      default: null,
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "Client reference is required."],
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
      index: true,
    },
    contactPerson: {
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
    contactPhone: {
      type: String,
      default: "",
      trim: true,
    },
    billingAddress: {
      line1: { type: String, default: "" },
      line2: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "Maharashtra" },
      pinCode: { type: String, default: "" },
      country: { type: String, default: "India" },
    },
    items: {
      type: [quotationItemSchema],
      default: [],
    },
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxableAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isGstApplicable: {
      type: Boolean,
      default: true,
    },
    gstType: {
      type: String,
      enum: ["CGST_SGST", "IGST", "NON_GST"],
      default: "CGST_SGST",
    },
    cgstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    sgstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    igstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalGst: {
      type: Number,
      default: 0,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
    },
    validUntil: {
      type: Date,
      required: [true, "Validity date is required."],
    },
    quotationDate: {
      type: Date,
      default: Date.now,
    },
    paymentTerms: {
      type: String,
      default: "50% Advance with Purchase Order, 50% on Delivery / Installation.",
      trim: true,
    },
    deliveryTimeline: {
      type: String,
      default: "4-6 weeks from confirmation & advance receipt.",
      trim: true,
    },
    termsAndConditions: {
      type: String,
      default: "1. Quotation valid for 30 days.\n2. Taxes as applicable.\n3. Annual Maintenance Contract (AMC) is standard for year 1.",
      trim: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "Draft",
        "Sent",
        "Client Approved",
        "Client Rejected",
        "Revised",
        "Expired",
        "Converted to Order",
      ],
      default: "Draft",
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
      index: true,
    },
    assignedToName: {
      type: String,
      default: "",
      trim: true,
    },
    approvedByClientAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "quotations",
  }
);

const Quotation =
  mongoose.models.Quotation || mongoose.model("Quotation", quotationSchema);

module.exports = Quotation;
