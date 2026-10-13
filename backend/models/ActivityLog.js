const mongoose = require("mongoose");

/* =====================================================
   ACTIVITY LOG SCHEMA
===================================================== */

const activityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    category: {
      type: String,
      enum: [
        "Client",
        "Product",
        "Project",
        "Task",
        "Ticket",
        "Employee",
        "Attendance",
        "AMC",
        "Payment",
        "System",
      ],
      default: "System",
      index: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    entityType: {
      type: String,
      enum: [
        "client",
        "product",
        "project",
        "task",
        "ticket",
        "employee",
        "attendance",
        "amc",
        "payment",
        "system",
      ],
      default: "system",
      index: true,
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    entityCode: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    entityName: {
      type: String,
      default: "",
      trim: true,
    },

    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
      index: true,
    },

    clientName: {
      type: String,
      default: "",
      trim: true,
    },

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
      index: true,
    },

    employeeName: {
      type: String,
      default: "",
      trim: true,
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    performedByName: {
      type: String,
      default: "",
      trim: true,
    },

    performedByRole: {
      type: String,
      enum: ["admin", "employee", "client", "system"],
      default: "system",
      index: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "activitylogs",
  }
);

const ActivityLog =
  mongoose.models.ActivityLog ||
  mongoose.model(
    "ActivityLog",
    activityLogSchema
  );

module.exports = ActivityLog;
