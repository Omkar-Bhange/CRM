"use strict";
/**
 * verify_attendanceevent_model.js
 * Comprehensive offline schema verification suite for the centralized AttendanceEvent model.
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
console.log("   ATTENDANCEEVENT MODEL OFFLINE SCHEMA VERIFICATION                            ");
console.log("================================================================================");

// Require all 17 previous Issue 8 centralized models + pre-existing models + AttendanceEvent
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
const AttendanceEvent = require("./models/AttendanceEvent");

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
assert("AttendanceEvent.modelName", AttendanceEvent.modelName === "AttendanceEvent");

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
assert("AttendanceEvent collection", AttendanceEvent.collection.name === "attendanceevents");

// ── 3. Options & Timestamps ──────────────────────────────────────────────────
console.log("\n[3] Options & Timestamps");
assert("AttendanceEvent timestamps enabled", AttendanceEvent.schema.options.timestamps === true);
assert("createdAt path exists", AttendanceEvent.schema.paths.createdAt !== undefined);
assert("updatedAt path exists", AttendanceEvent.schema.paths.updatedAt !== undefined);

// ── 4. Main Schema Paths and Types ───────────────────────────────────────────
console.log("\n[4] Main Schema Paths and Types");
const paths = AttendanceEvent.schema.paths;

// attendanceId
assert("attendanceId is ObjectId", paths.attendanceId.instance === "ObjectID" || paths.attendanceId.instance === "ObjectId");
assert("attendanceId ref is Attendance", paths.attendanceId.options.ref === "Attendance");
assert("attendanceId required", paths.attendanceId.isRequired === true);
assert("attendanceId indexed", Boolean(paths.attendanceId.options.index));

// employeeId
assert("employeeId is ObjectId", paths.employeeId.instance === "ObjectID" || paths.employeeId.instance === "ObjectId");
assert("employeeId ref is Employee", paths.employeeId.options.ref === "Employee");
assert("employeeId required", paths.employeeId.isRequired === true);
assert("employeeId indexed", Boolean(paths.employeeId.options.index));

// type
assert("type is String", paths.type.instance === "String");
assert("type required", paths.type.isRequired === true);
assert("type uppercase", paths.type.options.uppercase === true);
assert("type trim", paths.type.options.trim === true);
assert("type enum has 5 values", Array.isArray(paths.type.enumValues) && paths.type.enumValues.length === 5);
assert("type enum contains LOGIN", paths.type.enumValues.includes("LOGIN"));
assert("type enum contains LOGOUT", paths.type.enumValues.includes("LOGOUT"));
assert("type enum contains BREAK_START", paths.type.enumValues.includes("BREAK_START"));
assert("type enum contains BREAK_END", paths.type.enumValues.includes("BREAK_END"));
assert("type enum contains AUTO_CLOSE", paths.type.enumValues.includes("AUTO_CLOSE"));

// timestamp
assert("timestamp is Date", paths.timestamp.instance === "Date");
assert("timestamp required", paths.timestamp.isRequired === true);
assert("timestamp default exists", paths.timestamp.options.default === Date.now || typeof paths.timestamp.defaultValue === "function");

// source
assert("source is String", paths.source.instance === "String");
assert("source default is 'web'", paths.source.options.default === "web");
assert("source trim", paths.source.options.trim === true);

// notes
assert("notes is String", paths.notes.instance === "String");
assert("notes default is empty string", paths.notes.options.default === "");
assert("notes trim", paths.notes.options.trim === true);

// ── 5. Field Count ───────────────────────────────────────────────────────────
console.log("\n[5] Field Count");
const userFields = Object.keys(paths).filter(p => !p.startsWith("__"));
assert("Expected field count is 9 (_id, attendanceId, employeeId, type, timestamp, source, notes, createdAt, updatedAt)", userFields.length === 9);

// ── 6. Idempotent Export Verification ────────────────────────────────────────
console.log("\n[6] Idempotent Export Verification");
delete require.cache[require.resolve("./models/AttendanceEvent")];
const ReLoadedAttendanceEvent = require("./models/AttendanceEvent");
assert("Idempotent export returns same Mongoose model", ReLoadedAttendanceEvent === AttendanceEvent);
assert("mongoose.models.AttendanceEvent === AttendanceEvent", mongoose.models.AttendanceEvent === AttendanceEvent);

console.log("================================================================================");
console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("All AttendanceEvent schema unit checks passed successfully!");
  process.exit(0);
}
