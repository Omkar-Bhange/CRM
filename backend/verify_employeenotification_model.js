"use strict";
/**
 * verify_employeenotification_model.js
 * Offline schema verification suite for EmployeeNotification model.
 * Run from: backend/
 */

const mongoose = require("mongoose");

const Product              = require("./models/Product");
const Project              = require("./models/Project");
const Requirement          = require("./models/Requirement");
const SystemSettings       = require("./models/SystemSettings");
const ClientDocument       = require("./models/ClientDocument");
const EmployeeNotification = require("./models/EmployeeNotification");

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
console.log("   EMPLOYEENOTIFICATION MODEL OFFLINE SCHEMA VERIFICATION                       ");
console.log("================================================================================");

// ── 1. Model names ────────────────────────────────────────────────────────────
console.log("\n[1] Model names");
check("Product.modelName",              Product.modelName,              "Product");
check("Project.modelName",              Project.modelName,              "Project");
check("Requirement.modelName",          Requirement.modelName,          "Requirement");
check("SystemSettings.modelName",       SystemSettings.modelName,       "SystemSettings");
check("ClientDocument.modelName",       ClientDocument.modelName,       "ClientDocument");
check("EmployeeNotification.modelName", EmployeeNotification.modelName, "EmployeeNotification");

// ── 2. Collection names ───────────────────────────────────────────────────────
console.log("\n[2] Collection names");
check("Product collection",              Product.collection.name,              "products");
check("Project collection",              Project.collection.name,              "projects");
check("Requirement collection",          Requirement.collection.name,          "requirements");
check("SystemSettings collection",       SystemSettings.collection.name,       "systemsettings");
check("ClientDocument collection",       ClientDocument.collection.name,       "clientdocuments");
check("EmployeeNotification collection", EmployeeNotification.collection.name, "employeenotifications");

// ── 3. Idempotent registration ────────────────────────────────────────────────
console.log("\n[3] Idempotent registration");
assert("mongoose.models.EmployeeNotification === EmployeeNotification", mongoose.models.EmployeeNotification === EmployeeNotification);

// ── 4. Timestamps ─────────────────────────────────────────────────────────────
console.log("\n[4] Timestamps");
assert("EmployeeNotification timestamps:true", EmployeeNotification.schema.get("timestamps") === true);

// ── 5. Field presence (All 16 schema paths including _id and __v) ─────────────
console.log("\n[5] Schema fields presence");
const expectedPaths = [
  "__v", "_id", "createdAt", "dedupKey", "employeeId", "entityCode", "entityId",
  "entityType", "isRead", "message", "metadata", "navigationTarget", "priority",
  "readAt", "title", "type", "updatedAt", "userId"
].sort();

const actualPaths = Object.keys(EmployeeNotification.schema.paths).sort();
check("All schema paths present", actualPaths, expectedPaths);

// ── 6. Enum validation ────────────────────────────────────────────────────────
console.log("\n[6] Enum validation");
const expectedTypes = [
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
];
check("type enum values (14)", EmployeeNotification.schema.paths.type.enumValues, expectedTypes);

const expectedPriorities = ["low", "normal", "high", "urgent"];
check("priority enum values (4)", EmployeeNotification.schema.paths.priority.enumValues, expectedPriorities);

const expectedEntityTypes = ["task", "ticket", "attendance", "timelog", "system", "other"];
check("entityType enum values (6)", EmployeeNotification.schema.paths.entityType.enumValues, expectedEntityTypes);

const expectedNavTargets = ["dashboard", "tasks", "tickets", "attendance", "time-log"];
check("navigationTarget enum values (5)", EmployeeNotification.schema.paths.navigationTarget.enumValues, expectedNavTargets);

// ── 7. Required fields ────────────────────────────────────────────────────────
console.log("\n[7] Required fields");
assert("employeeId is required", EmployeeNotification.schema.paths.employeeId.isRequired === true);
assert("type is required",       EmployeeNotification.schema.paths.type.isRequired === true);
assert("title is required",      EmployeeNotification.schema.paths.title.isRequired === true);
assert("message is required",    EmployeeNotification.schema.paths.message.isRequired === true);
assert("userId is optional",     !EmployeeNotification.schema.paths.userId.isRequired);
assert("entityId is optional",   !EmployeeNotification.schema.paths.entityId.isRequired);

// ── 8. References ─────────────────────────────────────────────────────────────
console.log("\n[8] References");
check("employeeId ref", EmployeeNotification.schema.paths.employeeId.options.ref, "Employee");
check("userId ref",     EmployeeNotification.schema.paths.userId.options.ref,     "User");

// ── 9. Defaults ───────────────────────────────────────────────────────────────
console.log("\n[9] Defaults");
check("userId default",           EmployeeNotification.schema.paths.userId.defaultValue,           null);
check("priority default",         EmployeeNotification.schema.paths.priority.defaultValue,         "normal");
check("entityType default",       EmployeeNotification.schema.paths.entityType.defaultValue,       "other");
check("entityId default",         EmployeeNotification.schema.paths.entityId.defaultValue,         null);
check("entityCode default",       EmployeeNotification.schema.paths.entityCode.defaultValue,       "");
check("navigationTarget default", EmployeeNotification.schema.paths.navigationTarget.defaultValue, "dashboard");
check("isRead default",           EmployeeNotification.schema.paths.isRead.defaultValue,           false);
check("readAt default",           EmployeeNotification.schema.paths.readAt.defaultValue,           null);
check("dedupKey default",         EmployeeNotification.schema.paths.dedupKey.defaultValue,         "");

// ── 10. Indexes ───────────────────────────────────────────────────────────────
console.log("\n[10] Indexes");
const indexes = EmployeeNotification.schema.indexes();
console.log("  Indexes registered:", JSON.stringify(indexes));

const hasEmpCreatedAtIdx = indexes.some(idx => {
  const keys = idx[0];
  return keys.employeeId === 1 && keys.createdAt === -1;
});
assert("Compound index { employeeId: 1, createdAt: -1 } exists", hasEmpCreatedAtIdx);

const hasEmpIsReadIdx = indexes.some(idx => {
  const keys = idx[0];
  return keys.employeeId === 1 && keys.isRead === 1;
});
assert("Compound index { employeeId: 1, isRead: 1 } exists", hasEmpIsReadIdx);

const hasDedupUniqueIdx = indexes.some(idx => {
  const keys = idx[0];
  const opts = idx[1] || {};
  return keys.employeeId === 1 && keys.dedupKey === 1 && opts.unique === true;
});
assert("Compound unique index { employeeId: 1, dedupKey: 1 } with unique:true exists", hasDedupUniqueIdx);

// ── SUMMARY ──────────────────────────────────────────────────────────────────
console.log("\n================================================================================");
console.log(`VERIFICATION SUMMARY: ${passed} passed, ${failed} failed`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("All EmployeeNotification schema assertions PASSED successfully.");
  process.exit(0);
}
