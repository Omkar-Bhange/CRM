"use strict";

const mongoose = require("mongoose");

/* =========================================================
   EMPLOYEE DAILY NOTE SCHEMA & MODEL
========================================================= */

const employeeDailyNoteSchema = new mongoose.Schema(
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
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: String, // "YYYY-MM-DD" in IST
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: [true, "Note text is required."],
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "employeedailynotes",
  }
);

employeeDailyNoteSchema.index({ employeeId: 1, date: 1, createdAt: 1 });

module.exports =
  mongoose.models.EmployeeDailyNote ||
  mongoose.model("EmployeeDailyNote", employeeDailyNoteSchema);
