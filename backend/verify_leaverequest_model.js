"use strict";
/**
 * verify_leaverequest_model.js
 * Offline schema verification suite for LeaveRequest model.
 * Run from: backend/
 */

const mongoose = require("mongoose");

const Product                = require("./models/Product");
const Project                = require("./models/Project");
const Requirement            = require("./models/Requirement");
const SystemSettings         = require("./models/SystemSettings");
const ClientDocument         = require("./models/ClientDocument");
const EmployeeNotification   = require("./models/EmployeeNotification");
const ClientNotification     = require("./models/ClientNotification");
const EmployeeDailyNote      = require("./models/EmployeeDailyNote");
const ProcessedSessionBucket = require("./models/ProcessedSessionBucket");
const Holiday                = require("./models/Holiday");
const LeaveRequest           = require("./models/LeaveRequest");

let passed = 0;
let failed = 0;

function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    console.log("  PASS:", label);
    passed++;
  } else {
    console.error("  FAIL:", label);
    console.error("    Expected:", JSON.stringify(expected));
    console.error("    Actual  :", JSON.stringify(actual));
    failed++;
  }
}

function assert(label, cond) {
  if (cond) {
    console.log("  PASS:", label);
    passed++;
  } else {
    console.error("  FAIL:", label);
    failed++;
  }
}

console.log("================================================================================");
console.log("   LEAVEREQUEST MODEL OFFLINE SCHEMA VERIFICATION                                ");
console.log("================================================================================");

// ── 1. Model names ────────────────────────────────────────────────────────────
console.log("\n[1] Model names");
check("Product.modelName",                Product.modelName,                "Product");
check("Project.modelName",                Project.modelName,                "Project");
check("Requirement.modelName",            Requirement.modelName,            "Requirement");
check("SystemSettings.modelName",         SystemSettings.modelName,         "SystemSettings");
check("ClientDocument.modelName",         ClientDocument.modelName,         "ClientDocument");
check("EmployeeNotification.modelName",   EmployeeNotification.modelName,   "EmployeeNotification");
check("ClientNotification.modelName",     ClientNotification.modelName,     "ClientNotification");
check("EmployeeDailyNote.modelName",      EmployeeDailyNote.modelName,      "EmployeeDailyNote");
check("ProcessedSessionBucket.modelName", ProcessedSessionBucket.modelName, "ProcessedSessionBucket");
check("Holiday.modelName",                Holiday.modelName,                "Holiday");
check("LeaveRequest.modelName",           LeaveRequest.modelName,           "LeaveRequest");

// ── 2. Collection names ───────────────────────────────────────────────────────
console.log("\n[2] Collection names");
check("Product collection",                Product.collection.name,                "products");
check("Project collection",                Project.collection.name,                "projects");
check("Requirement collection",            Requirement.collection.name,            "requirements");
check("SystemSettings collection",         SystemSettings.collection.name,         "systemsettings");
check("ClientDocument collection",         ClientDocument.collection.name,         "clientdocuments");
check("EmployeeNotification collection",   EmployeeNotification.collection.name,   "employeenotifications");
check("ClientNotification collection",     ClientNotification.collection.name,     "clientnotifications");
check("EmployeeDailyNote collection",      EmployeeDailyNote.collection.name,      "employeedailynotes");
check("ProcessedSessionBucket collection", ProcessedSessionBucket.collection.name, "agent_processed_session_buckets");
check("Holiday collection",                Holiday.collection.name,                "holidays");
check("LeaveRequest collection",           LeaveRequest.collection.name,           "leaveRequests");

// ── 3. Idempotent registration & V2 alias ─────────────────────────────────────
console.log("\n[3] Idempotent registration & V2 alias");
assert("mongoose.models.LeaveRequest === LeaveRequest", mongoose.models.LeaveRequest === LeaveRequest);
assert("mongoose.models.LeaveRequestV2 is registered", !!mongoose.models.LeaveRequestV2);
assert("LeaveRequestV2 points to leaveRequests collection", mongoose.models.LeaveRequestV2.collection.name === "leaveRequests");

// ── 4. Schema Options ─────────────────────────────────────────────────────────
console.log("\n[4] Schema options");
assert("LeaveRequest timestamps:true", LeaveRequest.schema.get("timestamps") === true);
check("LeaveRequest collection name", LeaveRequest.schema.get("collection"), "leaveRequests");

// ── 5. Field presence ─────────────────────────────────────────────────────────
console.log("\n[5] Schema fields presence");
const expectedPaths = [
  "_id", "__v", "appliedAt", "approvedAt", "contactDuringLeave", "createdAt",
  "days", "department", "duration", "employeeCode", "employeeId", "employeeName",
  "fromDate", "leaveType", "reason", "reviewNote", "reviewedBy", "status",
  "toDate", "updatedAt"
].sort();

const actualPaths = Object.keys(LeaveRequest.schema.paths).sort();
check("All 20 schema paths present", actualPaths, expectedPaths);

// ── 6. Required fields ────────────────────────────────────────────────────────
console.log("\n[6] Required fields");
assert("employeeId is required", LeaveRequest.schema.paths.employeeId.isRequired === true);
assert("employeeCode is required", LeaveRequest.schema.paths.employeeCode.isRequired === true);
assert("employeeName is required", LeaveRequest.schema.paths.employeeName.isRequired === true);
assert("leaveType is required", LeaveRequest.schema.paths.leaveType.isRequired === true);
assert("fromDate is required", LeaveRequest.schema.paths.fromDate.isRequired === true);
assert("toDate is required", LeaveRequest.schema.paths.toDate.isRequired === true);
assert("days is required", LeaveRequest.schema.paths.days.isRequired === true);
assert("department is optional", !LeaveRequest.schema.paths.department.isRequired);
assert("duration is optional", !LeaveRequest.schema.paths.duration.isRequired);
assert("reason is optional", !LeaveRequest.schema.paths.reason.isRequired);
assert("contactDuringLeave is optional", !LeaveRequest.schema.paths.contactDuringLeave.isRequired);
assert("status is optional", !LeaveRequest.schema.paths.status.isRequired);
assert("reviewedBy is optional", !LeaveRequest.schema.paths.reviewedBy.isRequired);
assert("reviewNote is optional", !LeaveRequest.schema.paths.reviewNote.isRequired);

// ── 7. Enums ──────────────────────────────────────────────────────────────────
console.log("\n[7] Enum values");
check("duration enum values", LeaveRequest.schema.paths.duration.enumValues, ["Full Day", "First Half", "Second Half"]);
check("status enum values", LeaveRequest.schema.paths.status.enumValues, ["Pending", "Approved", "Rejected", "Cancelled"]);

// ── 8. Defaults and Options ───────────────────────────────────────────────────
console.log("\n[8] Defaults and Options");
check("department default", LeaveRequest.schema.paths.department.defaultValue, "");
check("duration default", LeaveRequest.schema.paths.duration.defaultValue, "Full Day");
check("reason default", LeaveRequest.schema.paths.reason.defaultValue, "");
check("contactDuringLeave default", LeaveRequest.schema.paths.contactDuringLeave.defaultValue, "");
check("status default", LeaveRequest.schema.paths.status.defaultValue, "Pending");
check("reviewedBy default", LeaveRequest.schema.paths.reviewedBy.defaultValue, "");
check("reviewNote default", LeaveRequest.schema.paths.reviewNote.defaultValue, "");
check("approvedAt default", LeaveRequest.schema.paths.approvedAt.defaultValue, null);
assert("appliedAt default is function", typeof LeaveRequest.schema.paths.appliedAt.defaultValue === "function");

assert("days min validator is 0.5", LeaveRequest.schema.paths.days.options.min === 0.5);
assert("employeeCode trim:true", LeaveRequest.schema.paths.employeeCode.options.trim === true);
assert("employeeName trim:true", LeaveRequest.schema.paths.employeeName.options.trim === true);
assert("department trim:true", LeaveRequest.schema.paths.department.options.trim === true);
assert("leaveType trim:true", LeaveRequest.schema.paths.leaveType.options.trim === true);
assert("reason trim:true", LeaveRequest.schema.paths.reason.options.trim === true);
assert("contactDuringLeave trim:true", LeaveRequest.schema.paths.contactDuringLeave.options.trim === true);
assert("reviewedBy trim:true", LeaveRequest.schema.paths.reviewedBy.options.trim === true);
assert("reviewNote trim:true", LeaveRequest.schema.paths.reviewNote.options.trim === true);

// ── 9. References ─────────────────────────────────────────────────────────────
console.log("\n[9] References");
check("employeeId ref", LeaveRequest.schema.paths.employeeId.options.ref, "Employee");

// ── 10. Indexes ───────────────────────────────────────────────────────────────
console.log("\n[10] Indexes");
const indexes = LeaveRequest.schema.indexes();
console.log("  Indexes registered in schema:", JSON.stringify(indexes));

const hasEmployeeIdIndex = indexes.some(idx => idx[0].employeeId === 1) || LeaveRequest.schema.paths.employeeId.options.index === true;
assert("employeeId index exists", hasEmployeeIdIndex);

const hasFromDateIndex = indexes.some(idx => idx[0].fromDate === 1) || LeaveRequest.schema.paths.fromDate.options.index === true;
assert("fromDate index exists", hasFromDateIndex);

const hasToDateIndex = indexes.some(idx => idx[0].toDate === 1) || LeaveRequest.schema.paths.toDate.options.index === true;
assert("toDate index exists", hasToDateIndex);

const hasStatusIndex = indexes.some(idx => idx[0].status === 1) || LeaveRequest.schema.paths.status.options.index === true;
assert("status index exists", hasStatusIndex);

// ── SUMMARY ──────────────────────────────────────────────────────────────────
console.log("\n================================================================================");
console.log(`VERIFICATION SUMMARY: ${passed} passed, ${failed} failed`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("All LeaveRequest schema assertions PASSED successfully.");
  process.exit(0);
}
