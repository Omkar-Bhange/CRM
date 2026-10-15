"use strict";

const mongoose = require("mongoose");

/* =====================================================
   IDEMPOTENCY LOG SCHEMA (Persistent Multi-Tier Idempotency)
===================================================== */
const idempotencyLogSchema = new mongoose.Schema(
  {
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      trim: true,
    },
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      index: true,
    },
    payloadHash: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["IN_PROGRESS", "COMPLETED", "FAILED"],
      default: "IN_PROGRESS",
      index: true,
    },
    responseStatus: {
      type: Number,
      default: 200,
    },
    responseBody: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: "7d",
    },
  },
  {
    timestamps: true,
    collection: "idempotencylogs",
  }
);

const IdempotencyLog =
  mongoose.models.IdempotencyLog ||
  mongoose.model("IdempotencyLog", idempotencyLogSchema);

module.exports = IdempotencyLog;

