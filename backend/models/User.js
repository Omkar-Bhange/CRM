"use strict";

const mongoose = require("mongoose");

/* =========================================================
   USER SCHEMA
   Admin, Employee and Client use the same users collection
   ========================================================= */

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
    },
    employeeCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
      index: true,
    },

    password: {
      type: String,
      required: [true, "Password is required."],
      minlength: 6,
      select: false,
    },

    role: {
      type: String,
      enum: ["admin", "employee", "client"],
      required: true,
      lowercase: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
      index: true,
    },

    clientCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    companyName: {
      type: String,
      default: "",
      trim: true,
    },

    mobile: {
      type: String,
      default: "",
      trim: true,
    },

    mustChangePassword: {
      type: Boolean,
      default: false,
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive", "Blocked"],
      default: "Active",
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

const User =
  mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;

