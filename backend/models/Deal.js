"use strict";

const mongoose = require("mongoose");

/* =====================================================
   DEAL TIMELINE SUB-SCHEMA
===================================================== */
const dealTimelineSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
    },
    stage: {
      type: String,
      default: "",
      trim: true,
    },
    notes: {
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
   DEAL MASTER SCHEMA (Sales Opportunities & Pipelines)
===================================================== */
const dealSchema = new mongoose.Schema(
  {
    dealCode: {
      type: String,
      required: [true, "Deal code is required."],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Deal title is required."],
      trim: true,
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
    primaryContactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
      default: null,
      index: true,
    },
    primaryContactName: {
      type: String,
      default: "",
      trim: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Deal amount is required."],
      min: [0, "Deal amount cannot be negative."],
      index: true,
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
    },
    stage: {
      type: String,
      enum: [
        "Discovery",
        "Demo / Presentation",
        "Proposal / Quotation",
        "Negotiation / Review",
        "Closed Won",
        "Closed Lost",
      ],
      default: "Discovery",
      index: true,
    },
    probability: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
    expectedCloseDate: {
      type: Date,
      required: [true, "Expected close date is required."],
      index: true,
    },
    actualCloseDate: {
      type: Date,
      default: null,
    },
    dealType: {
      type: String,
      enum: [
        "New Business",
        "Existing Business / Upgrade",
        "Renewal / AMC",
        "Customization",
        "Consulting",
      ],
      default: "New Business",
      index: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
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
      default: "Unassigned",
      trim: true,
    },
    assignedToCode: {
      type: String,
      default: "",
      trim: true,
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        productName: {
          type: String,
          default: "",
          trim: true,
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
        unitPrice: {
          type: Number,
          default: 0,
          min: 0,
        },
        lineTotal: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
    ],
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    lostReason: {
      type: String,
      enum: [
        "",
        "Price / Budget Constraint",
        "Competitor Selected",
        "Feature Gap",
        "Project Postponed / Cancelled",
        "Unresponsive",
        "Other",
      ],
      default: "",
      trim: true,
    },
    lostReasonNotes: {
      type: String,
      default: "",
      trim: true,
    },
    wonNotes: {
      type: String,
      default: "",
      trim: true,
    },
    convertedToProjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    convertedToSaleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductSale",
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    timeline: {
      type: [dealTimelineSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "deals",
  }
);

dealSchema.virtual("weightedValue").get(function () {
  return Math.round((Number(this.amount || 0) * Number(this.probability || 0)) / 100);
});

const Deal = mongoose.models.Deal || mongoose.model("Deal", dealSchema);

module.exports = Deal;
