"use strict";

const mongoose = require("mongoose");

/* =========================================================
   EMPLOYEE NOTIFICATION SCHEMA & MODEL
========================================================= */

const employeeNotificationSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "TASK_ASSIGNED",
        "TASK_OVERDUE",
        "TASK_DUE_SOON",
        "TASK_UPDATED",
        "TICKET_ASSIGNED",
        "TICKET_SLA_WARNING",
        "TICKET_REPLY",
        "TICKET_RESOLVED",
        "ATTENDANCE_PUNCH",
        "ATTENDANCE_REGULARIZATION",
        "LEAVE_APPROVED",
        "LEAVE_REJECTED",
        "SYSTEM_ANNOUNCEMENT",
        "SHIFT_REMINDER",
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    entityType: {
      type: String,
      enum: ["task", "ticket", "attendance", "timelog", "system", "other"],
      default: "other",
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    entityCode: {
      type: String,
      default: "",
      trim: true,
    },
    navigationTarget: {
      type: String,
      enum: ["dashboard", "tasks", "tickets", "attendance", "time-log"],
      default: "dashboard",
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    dedupKey: {
      type: String,
      default: "",
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: "employeenotifications",
  }
);

employeeNotificationSchema.index({ employeeId: 1, createdAt: -1 });
employeeNotificationSchema.index({ employeeId: 1, isRead: 1 });
employeeNotificationSchema.index({ employeeId: 1, dedupKey: 1 }, { unique: true });

module.exports =
  mongoose.models.EmployeeNotification ||
  mongoose.model("EmployeeNotification", employeeNotificationSchema);
