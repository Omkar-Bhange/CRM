"use strict";

const mongoose = require("mongoose");

/* =====================================================
   LEAD TIMELINE SUB-SCHEMA
===================================================== */
const leadTimelineSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    performedByName: {
      type: String,
      default: "System",
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

/* =====================================================
   LEAD MASTER SCHEMA (Inbound Prospects & Opportunities)
===================================================== */
const leadSchema = new mongoose.Schema(
  {
    leadCode: {
      type: String,
      required: [true, "Lead code is required."],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Lead title / inquiry summary is required."],
      trim: true,
      index: true,
    },
    companyName: {
      type: String,
      required: [true, "Company / Organization name is required."],
      trim: true,
      index: true,
    },
    contactName: {
      type: String,
      required: [true, "Primary contact name is required."],
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
    city: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    state: {
      type: String,
      default: "Maharashtra",
      trim: true,
    },
    country: {
      type: String,
      default: "India",
      trim: true,
    },
    source: {
      type: String,
      enum: [
        "Website",
        "WhatsApp",
        "Google Ads",
        "Meta Ads",
        "LinkedIn",
        "Referral",
        "Cold Outreach",
        "Event / Trade Show",
        "Inbound Call",
        "Other",
      ],
      default: "Website",
      index: true,
    },
    status: {
      type: String,
      enum: [
        "New",
        "Contacted",
        "Engaged",
        "Qualified",
        "Unqualified",
        "Disqualified",
        "Converted",
        "Lost",
      ],
      default: "New",
      index: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Hot"],
      default: "Medium",
      index: true,
    },
    score: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
    estimatedBudget: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
      index: true,
    },
    assignedToName: {
      type: String,
      default: "Unassigned",
      trim: true,
    },
    assignedToCode: {
      type: String,
      default: "",
      trim: true,
    },
    industry: {
      type: String,
      enum: [
        "Manufacturing",
        "Healthcare",
        "Logistics & Supply Chain",
        "Retail & E-Commerce",
        "Information Technology",
        "Finance & Banking",
        "Education",
        "Real Estate",
        "Hospitality",
        "Services",
        "Other",
      ],
      default: "Services",
      index: true,
    },
    interestedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    lostReason: {
      type: String,
      default: "",
      trim: true,
    },
    convertedAt: {
      type: Date,
      default: null,
    },
    convertedToClientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
    },
    convertedToContactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
      default: null,
    },
    convertedToDealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deal",
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    timeline: {
      type: [leadTimelineSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "leads",
  }
);

leadSchema.index({ companyName: "text", title: "text", contactName: "text" });

const Lead = mongoose.models.Lead || mongoose.model("Lead", leadSchema);

module.exports = Lead;
