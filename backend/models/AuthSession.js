const mongoose = require("mongoose");

/* =========================================================
   AUTH SESSION

   One record represents one authenticated browser/device
   session.

   IMPORTANT:
   - Raw refresh tokens must NEVER be stored in MongoDB.
   - Only a SHA-256 hash of the refresh token will be stored.
   - expiresAt uses MongoDB TTL cleanup.
========================================================= */

const authSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    refreshTokenHash: {
      type: String,
      required: true,
      select: false,
    },

    userAgent: {
      type: String,
      default: "",
      trim: true,
    },

    ipAddress: {
      type: String,
      default: "",
      trim: true,
    },

    lastUsedAt: {
      type: Date,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    revokedAt: {
      type: Date,
      default: null,
      index: true,
    },

    revokedReason: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "auth_sessions",
  }
);

/* =========================================================
   INDEXES
========================================================= */

// Automatically remove expired sessions from MongoDB.
authSessionSchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  }
);

authSessionSchema.index({
  userId: 1,
  revokedAt: 1,
  expiresAt: 1,
});

/* =========================================================
   MODEL
========================================================= */

const AuthSession =
  mongoose.models.AuthSession ||
  mongoose.model(
    "AuthSession",
    authSessionSchema
  );

module.exports = AuthSession;