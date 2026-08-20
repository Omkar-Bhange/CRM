const mongoose = require("mongoose");

const agentDeviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    employeeCode: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },
    pcName: {
      type: String,
      default: "",
    },
    deviceName: {
      type: String,
      default: "",
    },
    platform: {
      type: String,
      default: "windows",
    },
    appVersion: {
      type: String,
      default: "1.0.0",
    },
    token: {
      type: String,
      required: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // ==========================================================
// ADMIN DEVICE TRUST / APPROVAL
// ==========================================================

isApproved: {
  type: Boolean,
  default: false,
  index: true,
},

approvedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
},

approvedAt: {
  type: Date,
  default: null,
},

approvalNote: {
  type: String,
  default: "",
  trim: true,
},
  },
  {
    timestamps: true,
    collection: "agent_devices",
  }
);

module.exports =
  mongoose.models.AgentDevice ||
  mongoose.model("AgentDevice", agentDeviceSchema);