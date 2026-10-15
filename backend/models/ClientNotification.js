"use strict";

const mongoose = require("mongoose");

/* =========================================================
   CLIENT NOTIFICATION SCHEMA & MODEL
========================================================= */

const clientNotificationSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "INVOICE_GENERATED",
        "PAYMENT_RECEIVED",
        "AMC_EXPIRING",
        "AMC_RENEWED",
        "AMC_REQUEST_SUBMITTED",
        "AMC_REQUEST_UPDATED",
        "AMC_QUOTATION_READY",
        "TICKET_CREATED",
        "TICKET_UPDATED",
        "TICKET_RESOLVED",
        "DOCUMENT_SHARED",
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    entityType: {
      type: String,
      enum: ["invoice", "payment", "amc", "ticket", "document", "other"],
      default: "other",
    },
    entityCode: {
      type: String,
      default: "",
      trim: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    navigationTarget: {
      type: String,
      enum: ["overview", "products", "billing", "tickets", "documents", "profile"],
      default: "overview",
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    dedupKey: {
      type: String,
      default: "",
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "clientnotifications",
  }
);

clientNotificationSchema.index({ clientId: 1, createdAt: -1 });
clientNotificationSchema.index({ clientId: 1, isRead: 1 });
clientNotificationSchema.index({ clientId: 1, dedupKey: 1 }, { unique: true });

module.exports =
  mongoose.models.ClientNotification ||
  mongoose.model("ClientNotification", clientNotificationSchema);
