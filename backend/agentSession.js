const mongoose = require("mongoose");

const agentDailySummarySchema = new mongoose.Schema(
{
employeeId: {
type: mongoose.Schema.Types.ObjectId,
required: true,
index: true,
},


employeeCode: {
  type: String,
  required: true,
  index: true,
},

employeeName: {
  type: String,
  required: true,
},

pcName: {
  type: String,
  required: true,
},

// Start of the day (00:00:00) used as a daily bucket
date: {
  type: Date,
  required: true,
  index: true,
},

application: {
  type: String,
  required: true,
  index: true,
},

lastWindowTitle: {
  type: String,
  default: "",
},

totalSeconds: {
  type: Number,
  default: 0,
},

sessionCount: {
  type: Number,
  default: 0,
},

firstSeen: {
  type: Date,
  default: null,
},

lastSeen: {
  type: Date,
  default: null,
},

project: {
  type: String,
  default: "",
},

client: {
  type: String,
  default: "",
},
category: {
  type: String,
  default: "Other",
},

activity: {
  type: String,
  default: "",
},

taskId: {
  type: mongoose.Schema.Types.ObjectId,
  default: null,
},
taskCode: {
  type: String,
  default: "",
},

taskTitle: {
  type: String,
  default: "",
},

taskStatus: {
  type: String,
  default: "",
},

ticketId: {
  type: mongoose.Schema.Types.ObjectId,
  default: null,
},


},
{
timestamps: true,
collection: "agent_daily_summary",
}
);

agentDailySummarySchema.index(
  {
    employeeCode: 1,
    application: 1,
    date: 1,
    taskId: 1,
  },
  {
    unique: true,
    name: "employee_application_date_task_unique",
  }
);

// Serves the employee activity feed's same-day newest-first query.
agentDailySummarySchema.index(
  {
    employeeCode: 1,
    date: 1,
    lastSeen: -1,
  },
  {
    name: "employee_date_last_seen",
  }
);

module.exports =
mongoose.models.AgentDailySummary ||
mongoose.model("AgentDailySummary", agentDailySummarySchema);
