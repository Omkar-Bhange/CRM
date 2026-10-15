const mongoose = require("mongoose");

/* =========================================================
   ATTENDANCE V2 SCHEMA
========================================================= */

const attendanceV2Schema = new mongoose.Schema(
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
      index: true,
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
    breakStartedAt: {
      type: Date,
      default: null,
    },
    breakMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalBreakMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    workingMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalWorkedMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    shiftStart: {
      type: String,
      default: "10:00",
      trim: true,
    },
    shiftEnd: {
      type: String,
      default: "18:00",
      trim: true,
    },
    graceMinutes: {
      type: Number,
      default: 15,
      min: 0,
    },
    fullDayMinutes: {
      type: Number,
      default: 480,
      min: 0,
    },
    halfDayThresholdMinutes: {
      type: Number,
      default: 240,
      min: 0,
    },
    lateMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    earlyLogoutMinutes: {
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
      enum: ["Present", "Late", "Absent", "Half Day", "On Leave"],
      default: "Present",
      index: true,
    },
    workStatus: {
      type: String,
      enum: ["Working", "Break", "Logged Out", "On Leave"],
      default: "Working",
      index: true,
    },
    isAutoClosed: {
      type: Boolean,
      default: false,
    },
    autoClosedReason: {
      type: String,
      default: "",
      trim: true,
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
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "attendance",
  }
);

/* =========================================================
   ATTENDANCE DATABASE INDEXES
========================================================= */

/*
  One employee must have only one attendance document
  for a particular calendar date.

  Example:
  EMP001 + 2026-08-17 = only one attendance record.
*/
attendanceV2Schema.index(
  {
    employeeId: 1,
    date: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: { $ne: true },
    },
  }
);

const AttendanceV2 =
  mongoose.models.AttendanceV2 ||
  mongoose.model("AttendanceV2", attendanceV2Schema);

module.exports = AttendanceV2;
