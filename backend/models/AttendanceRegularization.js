const mongoose = require("mongoose");

/* =========================================================
   ATTENDANCE REGULARIZATION SCHEMA
========================================================= */

const attendanceRegularizationSchema = new mongoose.Schema(
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
    },

    employeeName: {
      type: String,
      required: true,
    },

    date: {
      type: String,
      required: true,
      index: true,
    },

    requestType: {
      type: String,
      enum: [
        "Missing Login",
        "Missing Logout",
        "Incorrect Time",
        "Absent Correction",
        "Work From Home",
        "Client Site",
      ],
      required: true,
    },

    requestedLoginTime: {
      type: String,
      default: "",
    },

    requestedLogoutTime: {
      type: String,
      default: "",
    },

    reason: {
      type: String,
      required: true,
      trim: true,
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

    reviewedBy: {
      type: String,
      default: "",
    },

    reviewNote: {
      type: String,
      default: "",
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    attendanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendanceV2",
      default: null,
    },

    appliedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "attendanceRegularizations",
  }
);

const AttendanceRegularization =
  mongoose.models.AttendanceRegularization ||
  mongoose.model("AttendanceRegularization", attendanceRegularizationSchema);

module.exports = AttendanceRegularization;
