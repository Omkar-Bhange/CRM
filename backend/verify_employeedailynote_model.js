"use strict";
/**
 * verify_employeedailynote_model.js
 * Offline schema verification suite for EmployeeDailyNote model.
 * Run from: backend/
 */

const mongoose = require("mongoose");

const Product              = require("./models/Product");
const Project              = require("./models/Project");
const Requirement          = require("./models/Requirement");
const SystemSettings       = require("./models/SystemSettings");
const ClientDocument       = require("./models/ClientDocument");
const EmployeeNotification = require("./models/EmployeeNotification");
const ClientNotification   = require("./models/ClientNotification");
const EmployeeDailyNote    = require("./models/EmployeeDailyNote");

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
console.log("   EMPLOYEEDAILYNOTE MODEL OFFLINE SCHEMA VERIFICATION                           ");
console.log("================================================================================");

// ── 1. Model names ────────────────────────────────────────────────────────────
console.log("\n[1] Model names");
check("Product.modelName",              Product.modelName,              "Product");
check("Project.modelName",              Project.modelName,              "Project");
check("Requirement.modelName",          Requirement.modelName,          "Requirement");
check("SystemSettings.modelName",       SystemSettings.modelName,       "SystemSettings");
check("ClientDocument.modelName",       ClientDocument.modelName,       "ClientDocument");
check("EmployeeNotification.modelName", EmployeeNotification.modelName, "EmployeeNotification");
check("ClientNotification.modelName",   ClientNotification.modelName,   "ClientNotification");
check("EmployeeDailyNote.modelName",    EmployeeDailyNote.modelName,    "EmployeeDailyNote");

// ── 2. Collection names ───────────────────────────────────────────────────────
console.log("\n[2] Collection names");
check("Product collection",              Product.collection.name,              "products");
check("Project collection",              Project.collection.name,              "projects");
check("Requirement collection",          Requirement.collection.name,          "requirements");
check("SystemSettings collection",       SystemSettings.collection.name,       "systemsettings");
check("ClientDocument collection",       ClientDocument.collection.name,       "clientdocuments");
check("EmployeeNotification collection", EmployeeNotification.collection.name, "employeenotifications");
check("ClientNotification collection",   ClientNotification.collection.name,   "clientnotifications");
check("EmployeeDailyNote collection",    EmployeeDailyNote.collection.name,    "employeedailynotes");

// ── 3. Idempotent registration ────────────────────────────────────────────────
console.log("\n[3] Idempotent registration");
assert("mongoose.models.EmployeeDailyNote === EmployeeDailyNote", mongoose.models.EmployeeDailyNote === EmployeeDailyNote);

// ── 4. Timestamps ─────────────────────────────────────────────────────────────
console.log("\n[4] Timestamps");
assert("EmployeeDailyNote timestamps:true", EmployeeDailyNote.schema.get("timestamps") === true);

// ── 5. Field presence (All 10 schema paths including _id and __v) ─────────────
console.log("\n[5] Schema fields presence");
const expectedPaths = [
  "__v", "_id", "completed", "createdAt", "date", "employeeCode",
  "employeeId", "text", "updatedAt", "userId"
].sort();

const actualPaths = Object.keys(EmployeeDailyNote.schema.paths).sort();
check("All schema paths present", actualPaths, expectedPaths);

// ── 6. Required fields ────────────────────────────────────────────────────────
console.log("\n[6] Required fields");
assert("employeeId is required",   EmployeeDailyNote.schema.paths.employeeId.isRequired === true);
assert("employeeCode is required", EmployeeDailyNote.schema.paths.employeeCode.isRequired === true);
assert("userId is required",       EmployeeDailyNote.schema.paths.userId.isRequired === true);
assert("date is required",         EmployeeDailyNote.schema.paths.date.isRequired === true);
assert("text is required",         EmployeeDailyNote.schema.paths.text.isRequired === true);

// ── 7. References ─────────────────────────────────────────────────────────────
console.log("\n[7] References");
check("employeeId ref", EmployeeDailyNote.schema.paths.employeeId.options.ref, "Employee");
check("userId ref",     EmployeeDailyNote.schema.paths.userId.options.ref,     "User");

// ── 8. Defaults and Options ───────────────────────────────────────────────────
console.log("\n[8] Defaults and Options");
check("completed default", EmployeeDailyNote.schema.paths.completed.defaultValue, false);
assert("employeeCode uppercase:true", EmployeeDailyNote.schema.paths.employeeCode.options.uppercase === true);
assert("employeeCode trim:true", EmployeeDailyNote.schema.paths.employeeCode.options.trim === true);
assert("text trim:true", EmployeeDailyNote.schema.paths.text.options.trim === true);

// ── 9. Indexes ────────────────────────────────────────────────────────────────
console.log("\n[9] Indexes");
const indexes = EmployeeDailyNote.schema.indexes();
console.log("  Indexes registered:", JSON.stringify(indexes));

const hasEmpIdDateCreatedIdx = indexes.some(idx => {
  const keys = idx[0];
  return keys.employeeId === 1 && keys.date === 1 && keys.createdAt === 1;
});
assert("Compound index { employeeId: 1, date: 1, createdAt: 1 } exists", hasEmpIdDateCreatedIdx);

// ── SUMMARY ──────────────────────────────────────────────────────────────────
console.log("\n================================================================================");
console.log(`VERIFICATION SUMMARY: ${passed} passed, ${failed} failed`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("All EmployeeDailyNote schema assertions PASSED successfully.");
  process.exit(0);
}
