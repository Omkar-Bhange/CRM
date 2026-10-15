"use strict";

const mongoose = require("mongoose");

/* =========================================================
   EMPLOYEE SCHEMA
========================================================= */

const employeeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    employeeCode: {
      type: String,
      required: [true, "Employee code is required."],
      unique: true,
      trim: true,
      uppercase: true,
    },

    name: {
      type: String,
      required: [true, "Employee name is required."],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Employee email is required."],
      unique: true,
      lowercase: true,
      trim: true,
    },

    mobile: {
      type: String,
      default: "",
      trim: true,
    },

    role: {
      type: String,
      required: [true, "Employee role is required."],
      trim: true,
    },

    department: {
      type: String,
      enum: [
        "Support",
        "Development",
        "Operations",
        "Accounts",
        "Management",
        "Sales",
        "Other",
      ],
      default: "Support",
    },

    joiningDate: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "Free",
        "Working",
        "Break",
        "Leave",
        "Offline",
        "Inactive",
      ],
      default: "Free",
    },

    currentTask: {
      type: String,
      default: "Available for assignment",
      trim: true,
    },

    // NEW: Active task reference
    currentTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    currentTicketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportTicket",
      default: null,
    },

    currentTaskCode: {
      type: String,
      default: "",
      trim: true,
    },

    currentTaskTitle: {
      type: String,
      default: "",
      trim: true,
    },

    currentClient: {
      type: String,
      default: "—",
      trim: true,
    },

    currentProject: {
      type: String,
      default: "—",
      trim: true,
    },

    // NEW: When the employee started the active task
    currentTaskStartedAt: {
      type: Date,
      default: null,
    },

    loginTime: {
      type: Date,
      default: null,
    },

    logoutTime: {
      type: Date,
      default: null,
    },

    activeMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },

    openTasks: {
      type: Number,
      default: 0,
      min: 0,
    },

    completedToday: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastActivityAt: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "employees",
  }
);

const Employee =
  mongoose.models.Employee ||
  mongoose.model("Employee", employeeSchema);

module.exports = Employee;

