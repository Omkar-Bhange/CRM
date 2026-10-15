"use strict";

const mongoose = require("mongoose");

/* =====================================================
   CLIENT AMC REQUEST SCHEMA (Renewal & Quotation Requests)
===================================================== */

const clientAmcRequestSchema = new mongoose.Schema(
  {
    requestCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    activeRequestKey: {
      type: String,
      default: null,
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
    },
    clientName: {
      type: String,
      default: "",
      trim: true,
    },
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AmcContract",
      required: true,
      index: true,
    },
    contractCode: {
      type: String,
      default: "",
      trim: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    currentExpiryDate: {
      type: Date,
      default: null,
    },
    requestType: {
      type: String,
      enum: ["AMC Renewal", "Quotation Request"],
      required: true,
      index: true,
    },
    renewalPeriod: {
      type: String,
      enum: ["1 Year"],
      default: "1 Year",
    },
    preferredStartDate: {
      type: Date,
      default: null,
    },
    remarks: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: [
        "Submitted",
        "Under Review",
        "Quotation Ready",
        "Completed",
        "Rejected",
        "Cancelled",
      ],
      default: "Submitted",
      index: true,
    },
    quotationAmount: {
      type: Number,
      default: 0,
    },
    quotationDetails: {
      type: String,
      default: "",
      trim: true,
    },
    quotationDocument: {
      fileName: { type: String, default: "" },
      fileUrl: { type: String, default: "" },
      filePath: { type: String, default: "" },
      fileSize: { type: Number, default: 0 },
      mimeType: { type: String, default: "" },
      uploadedAt: { type: Date, default: null },
    },
    adminNotes: {
      type: String,
      default: "",
      trim: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedByName: {
      type: String,
      default: "",
      trim: true,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    assignedEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    assignedEmployeeCode: {
      type: String,
      default: "",
      trim: true,
    },
    assignedEmployeeName: {
      type: String,
      default: "",
      trim: true,
    },
    timeline: [
      {
        action: { type: String, required: true },
        status: { type: String, required: true },
        remarks: { type: String, default: "" },
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
        performedByName: { type: String, default: "" },
        performedByRole: { type: String, default: "client" },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "clientamcrequests",
  }
);

clientAmcRequestSchema.index(
  { activeRequestKey: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { activeRequestKey: { $type: "string" } },
  }
);
clientAmcRequestSchema.index({ clientId: 1, createdAt: -1 });
clientAmcRequestSchema.index({ contractId: 1, createdAt: -1 });
clientAmcRequestSchema.index({ status: 1, createdAt: -1 });

/* =====================================================
   CLIENTAMCREQUEST MODEL REGISTRATION & EXPORT
===================================================== */

const ClientAmcRequest =
  mongoose.models.ClientAmcRequest ||
  mongoose.model("ClientAmcRequest", clientAmcRequestSchema);

module.exports = ClientAmcRequest;

