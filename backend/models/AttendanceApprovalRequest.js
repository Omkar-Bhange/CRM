const mongoose = require("mongoose");

/* =========================================================
   REMOTE ATTENDANCE APPROVAL REQUEST SCHEMA
========================================================= */

const attendanceApprovalRequestSchema = new mongoose.Schema(
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
      uppercase: true,
      index: true,
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

    date: {
      type: String,
      required: true,
      index: true,
    },

    requestedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    requestType: {
      type: String,
      enum: [
        "Remote Login",
        "Work From Home",
        "Client Site",
        "Office Exception",
      ],
      default: "Remote Login",
      index: true,
    },

    reason: {
      type: String,
      default: "",
      trim: true,
    },

    pcName: {
      type: String,
      default: "",
      trim: true,
    },

    deviceId: {
      type: String,
      default: "",
      trim: true,
    },

    ipAddress: {
      type: String,
      default: "",
      trim: true,
    },

    networkType: {
      type: String,
      enum: [
        "Office",
        "Outside Office",
        "Unknown",
      ],
      default: "Unknown",
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Rejected",
      ],
      default: "Pending",
      index: true,
    },

    approvalType: {
      type: String,
      enum: [
        "",
        "Work From Home",
        "Client Site",
        "Office Exception",
        "Late Arrival",
      ],
      default: "",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedByName: {
      type: String,
      default: "",
      trim: true,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    reviewNote: {
      type: String,
      default: "",
      trim: true,
    },

    attendanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendanceV2",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "attendanceApprovalRequests",
  }
);

attendanceApprovalRequestSchema.index({
  employeeId: 1,
  date: 1,
  status: 1,
});

const AttendanceApprovalRequest =
  mongoose.models.AttendanceApprovalRequest ||
  mongoose.model("AttendanceApprovalRequest", attendanceApprovalRequestSchema);

module.exports = AttendanceApprovalRequest;
