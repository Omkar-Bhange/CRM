const mongoose = require("mongoose");

/* =========================================================
   LEAVE BALANCE SCHEMA
========================================================= */

const leaveBalanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    year: {
      type: Number,
      required: true,
      index: true,
    },

    leaveType: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    total: {
      type: Number,
      default: 0,
      min: 0,
    },

    carriedForward: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    collection: "leaveBalances",
  }
);

leaveBalanceSchema.index(
  {
    employeeId: 1,
    year: 1,
    leaveType: 1,
  },
  {
    unique: true,
  }
);

const LeaveBalance =
  mongoose.models.LeaveBalance ||
  mongoose.model("LeaveBalance", leaveBalanceSchema);

module.exports = LeaveBalance;
