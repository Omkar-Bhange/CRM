"use strict";

const mongoose = require("mongoose");

/* =====================================================
   CONTACT MASTER SCHEMA (B2B Multi-Contact Hierarchy)
===================================================== */
const contactSchema = new mongoose.Schema(
  {
    contactCode: {
      type: String,
      required: [true, "Contact code is required."],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "Client / Account reference is required."],
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
      default: "",
      trim: true,
      index: true,
    },
    firstName: {
      type: String,
      required: [true, "First name is required."],
      trim: true,
    },
    lastName: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required."],
      trim: true,
      index: true,
    },
    alternatePhone: {
      type: String,
      default: "",
      trim: true,
    },
    designation: {
      type: String,
      default: "Business Contact",
      trim: true,
    },
    department: {
      type: String,
      default: "Management",
      trim: true,
    },
    role: {
      type: String,
      enum: [
        "Decision Maker",
        "Billing Contact",
        "Technical Contact",
        "Support Contact",
        "Signatory",
        "End User",
        "Other",
      ],
      default: "Decision Maker",
      index: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
      index: true,
    },
    canAccessPortal: {
      type: Boolean,
      default: false,
    },
    portalUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Left Organization"],
      default: "Active",
      index: true,
    },
    notes: {
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
    collection: "contacts",
  }
);

contactSchema.virtual("fullName").get(function () {
  return `${this.firstName || ""} ${this.lastName || ""}`.trim();
});

const Contact =
  mongoose.models.Contact || mongoose.model("Contact", contactSchema);

module.exports = Contact;
