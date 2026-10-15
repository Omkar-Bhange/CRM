"use strict";

const mongoose = require("mongoose");

/* =========================================================
   PROCESSED AGENT SESSION DAILY BUCKET SCHEMA & MODEL

   Instead of:
   1 Mongo document = 1 session

   We now use:
   1 Mongo document = 1 employee + 1 PC + 1 day

   Example:
   {
     employeeCode: "EMP100",
     pcName: "Total4",
     date: 2026-08-22,
     sessionIds: ["id1", "id2", "id3", ...]
   }
========================================================= */

const processedSessionBucketSchema = new mongoose.Schema(
  {
    employeeCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    pcName: {
      type: String,
      default: "",
      trim: true,
    },

    date: {
      type: Date,
      required: true,
      index: true,
    },

    sessionIds: {
      type: [String],
      default: [],
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    collection: "agent_processed_session_buckets",
    versionKey: false,
    timestamps: true,
  }
);

/*
 * Only one bucket is allowed for:
 *
 * EMP100 + Total4 + 2026-08-22
 */
processedSessionBucketSchema.index(
  {
    employeeCode: 1,
    pcName: 1,
    date: 1,
  },
  {
    unique: true,
  }
);

/*
 * Automatically remove old deduplication
 * buckets after expiry.
 */
processedSessionBucketSchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  }
);

module.exports =
  mongoose.models.ProcessedSessionBucket ||
  mongoose.model("ProcessedSessionBucket", processedSessionBucketSchema);
