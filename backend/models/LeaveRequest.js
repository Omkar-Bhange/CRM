"use strict";

const mongoose = require("mongoose");

/* =========================================================
   LEAVE REQUEST SCHEMA & MODEL
   Canonical model supporting leave requests, half-day leaves,
   approval/rejection workflows, and attendance calculations.
   Collection: "leaveRequests"
========================================================= */

const leaveRequestSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    employeeCode: {
      type: String,
      required: true,
      trim: true,
    },

    employeeName: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      default: "",
      trim: true,
    },

    leaveType: {
      type: String,
      required: true,
      trim: true,
    },

    fromDate: {
      type: String,
      required: true,
      index: true,
    },

    toDate: {
      type: String,
      required: true,
      index: true,
    },

    days: {
      type: Number,
      required: true,
      min: 0.5,
    },

    duration: {
      type: String,
      enum: [
        "Full Day",
        "First Half",
        "Second Half",
      ],
      default: "Full Day",
    },

    reason: {
      type: String,
      default: "",
      trim: true,
    },

    contactDuringLeave: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Rejected",
        "Cancelled",
      ],
      default: "Pending",
      index: true,
    },

    reviewedBy: {
      type: String,
      default: "",
      trim: true,
    },

    reviewNote: {
      type: String,
      default: "",
      trim: true,
    },

    appliedAt: {
      type: Date,
      default: Date.now,
    },

    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "leaveRequests",
  }
);

// Canonical LeaveRequest model
const LeaveRequest =
  mongoose.models.LeaveRequest ||
  mongoose.model("LeaveRequest", leaveRequestSchema);

// Backward compatibility registration for LeaveRequestV2
// used by consumers such as reports.js
if (!mongoose.models.LeaveRequestV2) {
  mongoose.model("LeaveRequestV2", leaveRequestSchema);
}

module.exports = LeaveRequest;
