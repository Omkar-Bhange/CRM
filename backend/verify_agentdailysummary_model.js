"use strict";
/**
 * verify_agentdailysummary_model.js
 * Comprehensive offline schema verification suite for the centralized AgentDailySummary model.
 */

const mongoose = require("mongoose");

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`  PASS: ${label}`);
    passed++;
  } else {
    console.error(`  FAIL: ${label}`);
    failed++;
  }
}

console.log("================================================================================");
console.log("   AGENTDAILYSUMMARY MODEL OFFLINE SCHEMA VERIFICATION                           ");
console.log("================================================================================");

// Require all 16 previous Issue 8 centralized models + AgentDailySummary + pre-existing models
const Product = require("./models/Product");
const Project = require("./models/Project");
const Requirement = require("./models/Requirement");
const SystemSettings = require("./models/SystemSettings");
const ClientDocument = require("./models/ClientDocument");
const EmployeeNotification = require("./models/EmployeeNotification");
const ClientNotification = require("./models/ClientNotification");
const EmployeeDailyNote = require("./models/EmployeeDailyNote");
const ProcessedSessionBucket = require("./models/ProcessedSessionBucket");
const Holiday = require("./models/Holiday");
const LeaveRequest = require("./models/LeaveRequest");
const ActivityLog = require("./models/ActivityLog");
const Task = require("./models/Task");
const SupportTicket = require("./models/SupportTicket");
const AppCounter = require("./models/AppCounter");
const AmcReminder = require("./models/AmcReminder");
const AgentDevice = require("./models/AgentDevice");
const AuthSession = require("./models/AuthSession");
const AgentDailySummary = require("./models/AgentDailySummary");

// ── 1. Model names ───────────────────────────────────────────────────────────
console.log("\n[1] Model names");
assert("Product.modelName", Product.modelName === "Product");
assert("Project.modelName", Project.modelName === "Project");
assert("Requirement.modelName", Requirement.modelName === "Requirement");
assert("SystemSettings.modelName", SystemSettings.modelName === "SystemSettings");
assert("ClientDocument.modelName", ClientDocument.modelName === "ClientDocument");
assert("EmployeeNotification.modelName", EmployeeNotification.modelName === "EmployeeNotification");
assert("ClientNotification.modelName", ClientNotification.modelName === "ClientNotification");
assert("EmployeeDailyNote.modelName", EmployeeDailyNote.modelName === "EmployeeDailyNote");
assert("ProcessedSessionBucket.modelName", ProcessedSessionBucket.modelName === "ProcessedSessionBucket");
assert("Holiday.modelName", Holiday.modelName === "Holiday");
assert("LeaveRequest.modelName", LeaveRequest.modelName === "LeaveRequest");
assert("ActivityLog.modelName", ActivityLog.modelName === "ActivityLog");
assert("Task.modelName", Task.modelName === "Task");
assert("SupportTicket.modelName", SupportTicket.modelName === "SupportTicket");
assert("AppCounter.modelName", AppCounter.modelName === "AppCounter");
assert("AmcReminder.modelName", AmcReminder.modelName === "AmcReminder");
assert("AgentDevice.modelName", AgentDevice.modelName === "AgentDevice");
assert("AuthSession.modelName", AuthSession.modelName === "AuthSession");
assert("AgentDailySummary.modelName", AgentDailySummary.modelName === "AgentDailySummary");

// ── 2. Collection names ──────────────────────────────────────────────────────
console.log("\n[2] Collection names");
assert("Product collection", Product.collection.name === "products");
assert("Project collection", Project.collection.name === "projects");
assert("Requirement collection", Requirement.collection.name === "requirements");
assert("SystemSettings collection", SystemSettings.collection.name === "systemsettings");
assert("ClientDocument collection", ClientDocument.collection.name === "clientdocuments");
assert("EmployeeNotification collection", EmployeeNotification.collection.name === "employeenotifications");
assert("ClientNotification collection", ClientNotification.collection.name === "clientnotifications");
assert("EmployeeDailyNote collection", EmployeeDailyNote.collection.name === "employeedailynotes");
assert("ProcessedSessionBucket collection", ProcessedSessionBucket.collection.name === "agent_processed_session_buckets");
assert("Holiday collection", Holiday.collection.name === "holidays");
assert("LeaveRequest collection", LeaveRequest.collection.name === "leaveRequests");
assert("ActivityLog collection", ActivityLog.collection.name === "activitylogs");
assert("Task collection", Task.collection.name === "tasks");
assert("SupportTicket collection", SupportTicket.collection.name === "supporttickets");
assert("AppCounter collection", AppCounter.collection.name === "appcounters");
assert("AmcReminder collection", AmcReminder.collection.name === "amcreminders");
assert("AgentDevice collection", AgentDevice.collection.name === "agent_devices");
assert("AuthSession collection", AuthSession.collection.name === "auth_sessions");
assert("AgentDailySummary collection", AgentDailySummary.collection.name === "agent_daily_summary");

// ── 3. Options & Timestamps ──────────────────────────────────────────────────
console.log("\n[3] Options & Timestamps");
assert("AgentDailySummary timestamps enabled", AgentDailySummary.schema.options.timestamps === true);
assert("createdAt path exists", AgentDailySummary.schema.paths.createdAt !== undefined);
assert("updatedAt path exists", AgentDailySummary.schema.paths.updatedAt !== undefined);

// ── 4. Main Schema Paths and Types ───────────────────────────────────────────
console.log("\n[4] Main Schema Paths and Types");
const paths = AgentDailySummary.schema.paths;

// employeeId
assert("employeeId is ObjectId", paths.employeeId.instance === "ObjectID" || paths.employeeId.instance === "ObjectId");
assert("employeeId required", paths.employeeId.isRequired === true);
assert("employeeId indexed", Boolean(paths.employeeId.options.index));

// employeeCode
assert("employeeCode is String", paths.employeeCode.instance === "String");
assert("employeeCode required", paths.employeeCode.isRequired === true);
assert("employeeCode indexed", Boolean(paths.employeeCode.options.index));

// employeeName
assert("employeeName is String", paths.employeeName.instance === "String");
assert("employeeName required", paths.employeeName.isRequired === true);

// pcName
assert("pcName is String", paths.pcName.instance === "String");
assert("pcName required", paths.pcName.isRequired === true);

// date
assert("date is Date", paths.date.instance === "Date");
assert("date required", paths.date.isRequired === true);
assert("date indexed", Boolean(paths.date.options.index));

// application
assert("application is String", paths.application.instance === "String");
assert("application required", paths.application.isRequired === true);
assert("application indexed", Boolean(paths.application.options.index));

// lastWindowTitle
assert("lastWindowTitle is String", paths.lastWindowTitle.instance === "String");
assert("lastWindowTitle default is empty string", paths.lastWindowTitle.options.default === "");

// totalSeconds
assert("totalSeconds is Number", paths.totalSeconds.instance === "Number");
assert("totalSeconds default is 0", paths.totalSeconds.options.default === 0);

// sessionCount
assert("sessionCount is Number", paths.sessionCount.instance === "Number");
assert("sessionCount default is 0", paths.sessionCount.options.default === 0);

// firstSeen
assert("firstSeen is Date", paths.firstSeen.instance === "Date");
assert("firstSeen default is null", paths.firstSeen.options.default === null);

// lastSeen
assert("lastSeen is Date", paths.lastSeen.instance === "Date");
assert("lastSeen default is null", paths.lastSeen.options.default === null);

// project
assert("project is String", paths.project.instance === "String");
assert("project default is empty string", paths.project.options.default === "");

// client
assert("client is String", paths.client.instance === "String");
assert("client default is empty string", paths.client.options.default === "");

// category
assert("category is String", paths.category.instance === "String");
assert("category default is 'Other'", paths.category.options.default === "Other");

// activity
assert("activity is String", paths.activity.instance === "String");
assert("activity default is empty string", paths.activity.options.default === "");

// taskId
assert("taskId is ObjectId", paths.taskId.instance === "ObjectID" || paths.taskId.instance === "ObjectId");
assert("taskId default is null", paths.taskId.options.default === null);

// taskCode
assert("taskCode is String", paths.taskCode.instance === "String");
assert("taskCode default is empty string", paths.taskCode.options.default === "");

// taskTitle
assert("taskTitle is String", paths.taskTitle.instance === "String");
assert("taskTitle default is empty string", paths.taskTitle.options.default === "");

// taskStatus
assert("taskStatus is String", paths.taskStatus.instance === "String");
assert("taskStatus default is empty string", paths.taskStatus.options.default === "");

// ticketId
assert("ticketId is ObjectId", paths.ticketId.instance === "ObjectID" || paths.ticketId.instance === "ObjectId");
assert("ticketId default is null", paths.ticketId.options.default === null);

// ── 5. Compound Indexes ──────────────────────────────────────────────────────
console.log("\n[5] Compound Indexes");
const indexes = AgentDailySummary.schema.indexes();

const uniqueTaskIndex = indexes.find(idx => 
  idx[0] && 
  idx[0].employeeCode === 1 && 
  idx[0].application === 1 && 
  idx[0].date === 1 && 
  idx[0].taskId === 1
);
assert("Compound index { employeeCode: 1, application: 1, date: 1, taskId: 1 } exists", Boolean(uniqueTaskIndex));
assert("Compound task index is unique", uniqueTaskIndex && uniqueTaskIndex[1] && uniqueTaskIndex[1].unique === true);
assert("Compound task index has name 'employee_application_date_task_unique'", uniqueTaskIndex && uniqueTaskIndex[1] && uniqueTaskIndex[1].name === "employee_application_date_task_unique");

const lastSeenIndex = indexes.find(idx => 
  idx[0] && 
  idx[0].employeeCode === 1 && 
  idx[0].date === 1 && 
  idx[0].lastSeen === -1
);
assert("Compound index { employeeCode: 1, date: 1, lastSeen: -1 } exists", Boolean(lastSeenIndex));
assert("Compound lastSeen index has name 'employee_date_last_seen'", lastSeenIndex && lastSeenIndex[1] && lastSeenIndex[1].name === "employee_date_last_seen");

// ── 6. Idempotent Export & Backward Compatibility ────────────────────────────
console.log("\n[6] Idempotent Export & Backward Compatibility");
delete require.cache[require.resolve("./models/AgentDailySummary")];
const ReLoadedAgentDailySummary = require("./models/AgentDailySummary");
assert("Idempotent export returns same Mongoose model", ReLoadedAgentDailySummary === AgentDailySummary);

const LegacyAgentSession = require("./agentSession");
assert("Legacy require('./agentSession') exports AgentDailySummary model", LegacyAgentSession === AgentDailySummary);

console.log("================================================================================");
console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("All AgentDailySummary schema unit checks passed successfully!");
  process.exit(0);
}
