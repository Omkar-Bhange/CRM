const mongoose = require("mongoose");

/* =====================================================
   AMC REMINDER SCHEMA
===================================================== */

const amcReminderSchema = new mongoose.Schema(
  {
    amcContractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AmcContract",
      required: true,
      index: true,
    },

    contractCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },

    clientCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    clientName: {
      type: String,
      required: true,
      trim: true,
    },

    channel: {
      type: String,
      enum: [
        "WhatsApp",
        "Email",
        "SMS",
        "Phone Call",
      ],
      required: true,
    },

    message: {
      type: String,
      required: [
        true,
        "Reminder message is required.",
      ],
      trim: true,
    },

    assignedEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
      index: true,
    },

    assignedEmployeeCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    assignedEmployeeName: {
      type: String,
      default: "Unassigned",
      trim: true,
    },

    followUpDate: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    sentAt: {
      type: Date,
      default: Date.now,
    },

    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    sentByName: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "Sent",
        "Call Logged",
        "Failed",
      ],
      default: "Sent",
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "amcreminders",
  }
);

amcReminderSchema.index({
  amcContractId: 1,
  sentAt: -1,
});

const AmcReminder =
  mongoose.models.AmcReminder ||
  mongoose.model("AmcReminder", amcReminderSchema);

module.exports = AmcReminder;
