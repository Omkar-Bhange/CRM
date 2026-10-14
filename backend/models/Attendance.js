const mongoose = require("mongoose");

/* =========================================================
   ATTENDANCE SCHEMA (V1)
========================================================= */

const attendanceSchema = new mongoose.Schema(
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

    role: {
      type: String,
      default: "",
      trim: true,
    },

    date: {
      type: String,
      required: true,
      index: true,
    },

    loginTime: {
      type: Date,
      default: null,
    },

    logoutTime: {
      type: Date,
      default: null,
    },

    breakMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },

    breakStartedAt: {
      type: Date,
      default: null,
    },

    workingMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },

    overtimeMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "Present",
        "Late",
        "Absent",
        "Half Day",
        "On Leave",
      ],
      default: "Present",
    },

    workStatus: {
      type: String,
      enum: [
        "Working",
        "Free",
        "Break",
        "Logged Out",
        "On Leave",
      ],
      default: "Working",
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "attendance",
  }
);

const Attendance =
  mongoose.models.Attendance ||
  mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;

