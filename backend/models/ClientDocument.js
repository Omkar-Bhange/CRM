"use strict";

const mongoose = require("mongoose");

/* =====================================================
   CLIENT DOCUMENT SCHEMA
   Canonical model supporting both:
   1. Admin client document metadata workflow
   2. Secure document upload, preview, download, and request workflow
===================================================== */

const clientDocumentSchema = new mongoose.Schema(
  {
    documentCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
      index: true,
    },

    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "Client ID is required."],
      index: true,
    },

    clientCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
      index: true,
    },

    clientName: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
      index: true,
    },

    productName: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, "Document name is required."],
      trim: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["PDF", "Excel", "Word", "Image", "ZIP", "Other"],
      default: "Other",
    },

    category: {
      type: String,
      default: "Other",
      trim: true,
      index: true,
    },

    documentType: {
      type: String,
      default: "Document",
      trim: true,
      index: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    fileName: {
      type: String,
      default: "",
      trim: true,
    },

    fileUrl: {
      type: String,
      default: "",
      trim: true,
    },

    mimeType: {
      type: String,
      default: "",
      trim: true,
    },

    size: {
      type: mongoose.Schema.Types.Mixed,
      default: "",
      validate: {
        validator: function (v) {
          if (v === null || v === undefined) return true;
          if (typeof v === "number") {
            return !isNaN(v) && v >= 0;
          }
          if (typeof v === "string") {
            return true;
          }
          return false;
        },
        message: "Document size must be a non-negative number or formatted string.",
      },
    },

    status: {
      type: String,
      enum: ["Requested", "Pending", "Verified", "Active", "Archived"],
      default: "Pending",
      index: true,
    },

    isRequest: {
      type: Boolean,
      default: false,
    },

    requestedAt: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    // Upload audit fields (supporting both admin and documents workflows)
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    uploadedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    uploadedByName: {
      type: String,
      default: "",
      trim: true,
    },

    uploadedByRole: {
      type: String,
      enum: ["admin", "employee", "client", "system"],
      default: "admin",
      index: true,
    },

    // Verification audit
    verifiedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    verifiedByName: {
      type: String,
      default: "",
      trim: true,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    // Archive audit
    archivedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    archivedByName: {
      type: String,
      default: "",
      trim: true,
    },

    archivedAt: {
      type: Date,
      default: null,
    },

    // Standard audit
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

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "clientdocuments",
  }
);

clientDocumentSchema.index({
  name: "text",
  category: "text",
  productName: "text",
  description: "text",
  clientName: "text",
  uploadedByName: "text",
});

module.exports =
  mongoose.models.ClientDocument ||
  mongoose.model("ClientDocument", clientDocumentSchema);
