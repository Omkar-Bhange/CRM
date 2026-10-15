"use strict";
/**
 * verify_activitylog_model.js
 * Comprehensive offline schema verification suite for the centralized ActivityLog model.
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
console.log("   ACTIVITYLOG MODEL OFFLINE SCHEMA VERIFICATION                                ");
console.log("================================================================================");

// Require all centralized models to verify zero collisions
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

// ── 3. Idempotent registration ───────────────────────────────────────────────
console.log("\n[3] Idempotent registration");
assert("mongoose.models.ActivityLog === ActivityLog", mongoose.models.ActivityLog === ActivityLog);
const requiredAgain = require("./models/ActivityLog");
assert("Re-require returns same model", requiredAgain === ActivityLog);

// ── 4. Schema options ────────────────────────────────────────────────────────
console.log("\n[4] Schema options");
const schema = ActivityLog.schema;
assert("ActivityLog timestamps:true", schema.options.timestamps === true);
assert("ActivityLog collection name is activitylogs", schema.options.collection === "activitylogs");

// ── 5. Schema fields presence ────────────────────────────────────────────────
console.log("\n[5] Schema fields presence");
const expectedPaths = [
  "_id",
  "action",
  "category",
  "description",
  "entityType",
  "entityId",
  "entityCode",
  "entityName",
  "clientId",
  "clientName",
  "employeeId",
  "employeeName",
  "performedBy",
  "performedByName",
  "performedByRole",
  "metadata",
  "isDeleted",
  "createdAt",
  "updatedAt",
  "__v",
];

expectedPaths.forEach((pathName) => {
  assert(`Path '${pathName}' exists in schema`, !!schema.path(pathName));
});

// ── 6. Required fields ───────────────────────────────────────────────────────
console.log("\n[6] Required fields");
assert("action is required", schema.path("action").isRequired === true);
assert("category is optional (has default)", schema.path("category").isRequired !== true);
assert("description is optional", schema.path("description").isRequired !== true);
assert("entityType is optional (has default)", schema.path("entityType").isRequired !== true);
assert("entityId is optional", schema.path("entityId").isRequired !== true);
assert("entityCode is optional", schema.path("entityCode").isRequired !== true);
assert("entityName is optional", schema.path("entityName").isRequired !== true);
assert("clientId is optional", schema.path("clientId").isRequired !== true);
assert("clientName is optional", schema.path("clientName").isRequired !== true);
assert("employeeId is optional", schema.path("employeeId").isRequired !== true);
assert("employeeName is optional", schema.path("employeeName").isRequired !== true);
assert("performedBy is optional", schema.path("performedBy").isRequired !== true);
assert("performedByName is optional", schema.path("performedByName").isRequired !== true);
assert("performedByRole is optional (has default)", schema.path("performedByRole").isRequired !== true);
assert("metadata is optional", schema.path("metadata").isRequired !== true);
assert("isDeleted is optional (has default)", schema.path("isDeleted").isRequired !== true);

// ── 7. Enum values ───────────────────────────────────────────────────────────
console.log("\n[7] Enum values");
const expectedCategories = [
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
];
const actualCategories = schema.path("category").enumValues;
assert("category enum values count", actualCategories.length === expectedCategories.length);
expectedCategories.forEach((c) => {
  assert(`category enum includes '${c}'`, actualCategories.includes(c));
});

const expectedEntityTypes = [
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
];
const actualEntityTypes = schema.path("entityType").enumValues;
assert("entityType enum values count", actualEntityTypes.length === expectedEntityTypes.length);
expectedEntityTypes.forEach((e) => {
  assert(`entityType enum includes '${e}'`, actualEntityTypes.includes(e));
});

const expectedRoles = ["admin", "employee", "client", "system"];
const actualRoles = schema.path("performedByRole").enumValues;
assert("performedByRole enum values count", actualRoles.length === expectedRoles.length);
expectedRoles.forEach((r) => {
  assert(`performedByRole enum includes '${r}'`, actualRoles.includes(r));
});

// ── 8. Defaults and Options ──────────────────────────────────────────────────
console.log("\n[8] Defaults and Options");
assert("category default is 'System'", schema.path("category").defaultValue === "System");
assert("description default is ''", schema.path("description").defaultValue === "");
assert("entityType default is 'system'", schema.path("entityType").defaultValue === "system");
assert("entityId default is null", schema.path("entityId").defaultValue === null);
assert("entityCode default is ''", schema.path("entityCode").defaultValue === "");
assert("entityName default is ''", schema.path("entityName").defaultValue === "");
assert("clientId default is null", schema.path("clientId").defaultValue === null);
assert("clientName default is ''", schema.path("clientName").defaultValue === "");
assert("employeeId default is null", schema.path("employeeId").defaultValue === null);
assert("employeeName default is ''", schema.path("employeeName").defaultValue === "");
assert("performedBy default is null", schema.path("performedBy").defaultValue === null);
assert("performedByName default is ''", schema.path("performedByName").defaultValue === "");
assert("performedByRole default is 'system'", schema.path("performedByRole").defaultValue === "system");
assert("metadata default is empty object", typeof schema.path("metadata").defaultValue === "function" || typeof schema.path("metadata").defaultValue === "object");
assert("isDeleted default is false", schema.path("isDeleted").defaultValue === false);

assert("action trim:true", schema.path("action").options.trim === true);
assert("description trim:true", schema.path("description").options.trim === true);
assert("entityCode trim:true", schema.path("entityCode").options.trim === true);
assert("entityName trim:true", schema.path("entityName").options.trim === true);
assert("clientName trim:true", schema.path("clientName").options.trim === true);
assert("employeeName trim:true", schema.path("employeeName").options.trim === true);
assert("performedByName trim:true", schema.path("performedByName").options.trim === true);

// ── 9. References ────────────────────────────────────────────────────────────
console.log("\n[9] References");
assert("clientId ref is Client", schema.path("clientId").options.ref === "Client");
assert("employeeId ref is Employee", schema.path("employeeId").options.ref === "Employee");
assert("performedBy ref is User", schema.path("performedBy").options.ref === "User");

// ── 10. Indexed fields ───────────────────────────────────────────────────────
console.log("\n[10] Indexed fields");
const indexedFields = [
  "action",
  "category",
  "entityType",
  "entityId",
  "entityCode",
  "clientId",
  "employeeId",
  "performedBy",
  "performedByRole",
  "isDeleted",
];
indexedFields.forEach((field) => {
  assert(`${field} has index: true`, schema.path(field).options.index === true);
});

// ── Summary ──────────────────────────────────────────────────────────────────
console.log("\n================================================================================");
console.log(`VERIFICATION SUMMARY: ${passed} passed, ${failed} failed`);
console.log("================================================================================");

if (failed > 0) {
  console.error("FAIL: Some ActivityLog schema verification assertions failed!");
  process.exit(1);
} else {
  console.log("All ActivityLog schema assertions PASSED successfully.");
  process.exit(0);
}
