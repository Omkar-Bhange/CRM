"use strict";
/**
 * verify_processedsessionbucket_model.js
 * Offline schema verification suite for ProcessedSessionBucket model.
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
console.log("   PROCESSEDSESSIONBUCKET MODEL OFFLINE SCHEMA VERIFICATION                      ");
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

// ── 3. Idempotent registration ────────────────────────────────────────────────
console.log("\n[3] Idempotent registration");
assert("mongoose.models.ProcessedSessionBucket === ProcessedSessionBucket", mongoose.models.ProcessedSessionBucket === ProcessedSessionBucket);

// ── 4. Schema Options ─────────────────────────────────────────────────────────
console.log("\n[4] Schema options");
assert("ProcessedSessionBucket timestamps:true", ProcessedSessionBucket.schema.get("timestamps") === true);
assert("ProcessedSessionBucket versionKey:false", ProcessedSessionBucket.schema.get("versionKey") === false);
check("ProcessedSessionBucket collection name", ProcessedSessionBucket.schema.get("collection"), "agent_processed_session_buckets");

// ── 5. Field presence (All 8 schema paths, no __v) ───────────────────────────
console.log("\n[5] Schema fields presence");
const expectedPaths = [
  "_id", "createdAt", "date", "employeeCode", "expiresAt",
  "pcName", "sessionIds", "updatedAt"
].sort();

const actualPaths = Object.keys(ProcessedSessionBucket.schema.paths).sort();
check("All schema paths present (no __v)", actualPaths, expectedPaths);

// ── 6. Required fields ────────────────────────────────────────────────────────
console.log("\n[6] Required fields");
assert("employeeCode is required", ProcessedSessionBucket.schema.paths.employeeCode.isRequired === true);
assert("date is required",         ProcessedSessionBucket.schema.paths.date.isRequired === true);
assert("expiresAt is required",    ProcessedSessionBucket.schema.paths.expiresAt.isRequired === true);
assert("pcName is optional",       !ProcessedSessionBucket.schema.paths.pcName.isRequired);
assert("sessionIds is optional",   !ProcessedSessionBucket.schema.paths.sessionIds.isRequired);

// ── 7. Defaults and Options ───────────────────────────────────────────────────
console.log("\n[7] Defaults and Options");
check("pcName default", ProcessedSessionBucket.schema.paths.pcName.defaultValue, "");
assert("sessionIds default option is []", Array.isArray(ProcessedSessionBucket.schema.paths.sessionIds.options.default) && ProcessedSessionBucket.schema.paths.sessionIds.options.default.length === 0);
const sampleDoc = new ProcessedSessionBucket();
assert("instantiated doc sessionIds defaults to []", Array.isArray(sampleDoc.sessionIds) && sampleDoc.sessionIds.length === 0);
assert("employeeCode uppercase:true", ProcessedSessionBucket.schema.paths.employeeCode.options.uppercase === true);
assert("employeeCode trim:true", ProcessedSessionBucket.schema.paths.employeeCode.options.trim === true);
assert("pcName trim:true", ProcessedSessionBucket.schema.paths.pcName.options.trim === true);

// ── 8. Indexes ────────────────────────────────────────────────────────────────
console.log("\n[8] Indexes");
const indexes = ProcessedSessionBucket.schema.indexes();
console.log("  Indexes registered:", JSON.stringify(indexes));

const hasUniqueBucketIdx = indexes.some(idx => {
  const keys = idx[0];
  const opts = idx[1] || {};
  return keys.employeeCode === 1 && keys.pcName === 1 && keys.date === 1 && opts.unique === true;
});
assert("Compound unique index { employeeCode: 1, pcName: 1, date: 1 } exists", hasUniqueBucketIdx);

const hasTTLIdx = indexes.some(idx => {
  const keys = idx[0];
  const opts = idx[1] || {};
  return keys.expiresAt === 1 && opts.expireAfterSeconds === 0;
});
assert("TTL index { expiresAt: 1 } with expireAfterSeconds: 0 exists", hasTTLIdx);

// ── SUMMARY ──────────────────────────────────────────────────────────────────
console.log("\n================================================================================");
console.log(`VERIFICATION SUMMARY: ${passed} passed, ${failed} failed`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("All ProcessedSessionBucket schema assertions PASSED successfully.");
  process.exit(0);
}
