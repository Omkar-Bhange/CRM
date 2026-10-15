"use strict";
/**
 * verify_amcreminder_model.js
 * Comprehensive offline schema verification suite for the centralized AmcReminder model.
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
console.log("   AMCREMINDER MODEL OFFLINE SCHEMA VERIFICATION                                ");
console.log("================================================================================");

// Require all 15 previous centralized models + AmcReminder to verify zero collisions
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

// ── 3. Options & Timestamps ──────────────────────────────────────────────────
console.log("\n[3] Options & Timestamps");
assert("AmcReminder timestamps enabled", AmcReminder.schema.options.timestamps === true);
assert("createdAt path exists", AmcReminder.schema.paths.createdAt !== undefined);
assert("updatedAt path exists", AmcReminder.schema.paths.updatedAt !== undefined);

// ── 4. Main Schema Paths and Types ───────────────────────────────────────────
console.log("\n[4] Main Schema Paths and Types");
const paths = AmcReminder.schema.paths;

// amcContractId
assert("amcContractId is ObjectId", paths.amcContractId.instance === "ObjectID" || paths.amcContractId.instance === "ObjectId");
assert("amcContractId ref is AmcContract", paths.amcContractId.options.ref === "AmcContract");
assert("amcContractId required", paths.amcContractId.isRequired === true);
assert("amcContractId indexed", Boolean(paths.amcContractId.options.index));

// contractCode
assert("contractCode is String", paths.contractCode.instance === "String");
assert("contractCode required", paths.contractCode.isRequired === true);
assert("contractCode trim", paths.contractCode.options.trim === true);
assert("contractCode uppercase", paths.contractCode.options.uppercase === true);

// clientId
assert("clientId is ObjectId", paths.clientId.instance === "ObjectID" || paths.clientId.instance === "ObjectId");
assert("clientId ref is Client", paths.clientId.options.ref === "Client");
assert("clientId required", paths.clientId.isRequired === true);
assert("clientId indexed", Boolean(paths.clientId.options.index));

// clientCode
assert("clientCode is String", paths.clientCode.instance === "String");
assert("clientCode default is empty string", paths.clientCode.options.default === "");
assert("clientCode trim", paths.clientCode.options.trim === true);
assert("clientCode uppercase", paths.clientCode.options.uppercase === true);

// clientName
assert("clientName is String", paths.clientName.instance === "String");
assert("clientName required", paths.clientName.isRequired === true);
assert("clientName trim", paths.clientName.options.trim === true);

// channel
assert("channel is String", paths.channel.instance === "String");
assert("channel required", paths.channel.isRequired === true);
assert("channel enum has 4 values", Array.isArray(paths.channel.enumValues) && paths.channel.enumValues.length === 4);
assert("channel enum contains WhatsApp", paths.channel.enumValues.includes("WhatsApp"));
assert("channel enum contains Email", paths.channel.enumValues.includes("Email"));
assert("channel enum contains SMS", paths.channel.enumValues.includes("SMS"));
assert("channel enum contains Phone Call", paths.channel.enumValues.includes("Phone Call"));

// message
assert("message is String", paths.message.instance === "String");
assert("message required", paths.message.isRequired === true);
assert("message trim", paths.message.options.trim === true);

// assignedEmployeeId
assert("assignedEmployeeId is ObjectId", paths.assignedEmployeeId.instance === "ObjectID" || paths.assignedEmployeeId.instance === "ObjectId");
assert("assignedEmployeeId ref is Employee", paths.assignedEmployeeId.options.ref === "Employee");
assert("assignedEmployeeId default is null", paths.assignedEmployeeId.options.default === null);
assert("assignedEmployeeId indexed", Boolean(paths.assignedEmployeeId.options.index));

// assignedEmployeeCode
assert("assignedEmployeeCode is String", paths.assignedEmployeeCode.instance === "String");
assert("assignedEmployeeCode default is empty string", paths.assignedEmployeeCode.options.default === "");
assert("assignedEmployeeCode trim", paths.assignedEmployeeCode.options.trim === true);
assert("assignedEmployeeCode uppercase", paths.assignedEmployeeCode.options.uppercase === true);

// assignedEmployeeName
assert("assignedEmployeeName is String", paths.assignedEmployeeName.instance === "String");
assert("assignedEmployeeName default is 'Unassigned'", paths.assignedEmployeeName.options.default === "Unassigned");
assert("assignedEmployeeName trim", paths.assignedEmployeeName.options.trim === true);

// followUpDate
assert("followUpDate is Date", paths.followUpDate.instance === "Date");
assert("followUpDate default is null", paths.followUpDate.options.default === null);

// notes
assert("notes is String", paths.notes.instance === "String");
assert("notes default is empty string", paths.notes.options.default === "");
assert("notes trim", paths.notes.options.trim === true);

// sentAt
assert("sentAt is Date", paths.sentAt.instance === "Date");
assert("sentAt default is function (Date.now)", typeof paths.sentAt.defaultValue === "function" || paths.sentAt.options.default === Date.now);

// sentBy
assert("sentBy is ObjectId", paths.sentBy.instance === "ObjectID" || paths.sentBy.instance === "ObjectId");
assert("sentBy ref is User", paths.sentBy.options.ref === "User");
assert("sentBy default is null", paths.sentBy.options.default === null);

// sentByName
assert("sentByName is String", paths.sentByName.instance === "String");
assert("sentByName default is empty string", paths.sentByName.options.default === "");
assert("sentByName trim", paths.sentByName.options.trim === true);

// status
assert("status is String", paths.status.instance === "String");
assert("status default is 'Sent'", paths.status.options.default === "Sent");
assert("status enum has 3 values", Array.isArray(paths.status.enumValues) && paths.status.enumValues.length === 3);
assert("status enum contains Sent", paths.status.enumValues.includes("Sent"));
assert("status enum contains Call Logged", paths.status.enumValues.includes("Call Logged"));
assert("status enum contains Failed", paths.status.enumValues.includes("Failed"));

// isDeleted
assert("isDeleted is Boolean", paths.isDeleted.instance === "Boolean");
assert("isDeleted default is false", paths.isDeleted.options.default === false);
assert("isDeleted indexed", Boolean(paths.isDeleted.options.index));

// ── 5. Compound Indexes ──────────────────────────────────────────────────────
console.log("\n[5] Compound Indexes");
const indexes = AmcReminder.schema.indexes();
const compoundAmcContractIdSentAt = indexes.find(idx => idx[0] && idx[0].amcContractId === 1 && idx[0].sentAt === -1);
assert("Compound index { amcContractId: 1, sentAt: -1 } exists", Boolean(compoundAmcContractIdSentAt));

// ── 6. Idempotent Export Verification ────────────────────────────────────────
console.log("\n[6] Idempotent Export Verification");
delete require.cache[require.resolve("./models/AmcReminder")];
const ReLoadedAmcReminder = require("./models/AmcReminder");
assert("Idempotent export returns same Mongoose model", ReLoadedAmcReminder === AmcReminder);

console.log("================================================================================");
console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("All AmcReminder schema unit checks passed successfully!");
  process.exit(0);
}
