"use strict";
/**
 * verify_holiday_model.js
 * Offline schema verification suite for Holiday model.
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
console.log("   HOLIDAY MODEL OFFLINE SCHEMA VERIFICATION                                    ");
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

// ── 3. Idempotent registration ────────────────────────────────────────────────
console.log("\n[3] Idempotent registration");
assert("mongoose.models.Holiday === Holiday", mongoose.models.Holiday === Holiday);

// ── 4. Schema Options ─────────────────────────────────────────────────────────
console.log("\n[4] Schema options");
assert("Holiday timestamps:true", Holiday.schema.get("timestamps") === true);
check("Holiday collection name", Holiday.schema.get("collection"), "holidays");

// ── 5. Field presence ─────────────────────────────────────────────────────────
console.log("\n[5] Schema fields presence");
const expectedPaths = [
  "_id", "__v", "createdAt", "createdBy", "date", "isActive",
  "name", "note", "type", "updatedAt", "updatedBy"
].sort();

const actualPaths = Object.keys(Holiday.schema.paths).sort();
check("All 11 schema paths present", actualPaths, expectedPaths);

// ── 6. Required fields ────────────────────────────────────────────────────────
console.log("\n[6] Required fields");
assert("date is required",      Holiday.schema.paths.date.isRequired === true);
assert("name is required",      Holiday.schema.paths.name.isRequired === true);
assert("type is optional",      !Holiday.schema.paths.type.isRequired);
assert("note is optional",      !Holiday.schema.paths.note.isRequired);
assert("isActive is optional",  !Holiday.schema.paths.isActive.isRequired);
assert("createdBy is optional", !Holiday.schema.paths.createdBy.isRequired);
assert("updatedBy is optional", !Holiday.schema.paths.updatedBy.isRequired);

// ── 7. Enums ──────────────────────────────────────────────────────────────────
console.log("\n[7] Enum values");
check("type enum values", Holiday.schema.paths.type.enumValues, ["National", "Company", "Optional"]);

// ── 8. Defaults and Options ───────────────────────────────────────────────────
console.log("\n[8] Defaults and Options");
check("type default",      Holiday.schema.paths.type.defaultValue, "Company");
check("note default",      Holiday.schema.paths.note.defaultValue, "");
check("isActive default",  Holiday.schema.paths.isActive.defaultValue, true);
check("createdBy default", Holiday.schema.paths.createdBy.defaultValue, null);
check("updatedBy default", Holiday.schema.paths.updatedBy.defaultValue, null);
assert("name trim:true",   Holiday.schema.paths.name.options.trim === true);
assert("note trim:true",   Holiday.schema.paths.note.options.trim === true);

// ── 9. References ─────────────────────────────────────────────────────────────
console.log("\n[9] References");
check("createdBy ref", Holiday.schema.paths.createdBy.options.ref, "User");
check("updatedBy ref", Holiday.schema.paths.updatedBy.options.ref, "User");

// ── 10. Indexes ───────────────────────────────────────────────────────────────
console.log("\n[10] Indexes");
const indexes = Holiday.schema.indexes();
console.log("  Indexes registered in schema:", JSON.stringify(indexes));

const hasDateIndex = indexes.some(idx => {
  const keys = idx[0];
  const opts = idx[1] || {};
  return keys.date === 1 && opts.unique === true;
}) || Holiday.schema.paths.date.options.unique === true;
assert("date index with unique: true exists", hasDateIndex);

const hasIsActiveIndex = indexes.some(idx => {
  const keys = idx[0];
  return keys.isActive === 1;
}) || Holiday.schema.paths.isActive.options.index === true;
assert("isActive index exists", hasIsActiveIndex);

// ── SUMMARY ──────────────────────────────────────────────────────────────────
console.log("\n================================================================================");
console.log(`VERIFICATION SUMMARY: ${passed} passed, ${failed} failed`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("All Holiday schema assertions PASSED successfully.");
  process.exit(0);
}
