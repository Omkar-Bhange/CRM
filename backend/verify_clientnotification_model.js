"use strict";
/**
 * verify_clientnotification_model.js
 * Offline schema verification suite for ClientNotification model.
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
console.log("   CLIENTNOTIFICATION MODEL OFFLINE SCHEMA VERIFICATION                         ");
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

// ── 2. Collection names ───────────────────────────────────────────────────────
console.log("\n[2] Collection names");
check("Product collection",              Product.collection.name,              "products");
check("Project collection",              Project.collection.name,              "projects");
check("Requirement collection",          Requirement.collection.name,          "requirements");
check("SystemSettings collection",       SystemSettings.collection.name,       "systemsettings");
check("ClientDocument collection",       ClientDocument.collection.name,       "clientdocuments");
check("EmployeeNotification collection", EmployeeNotification.collection.name, "employeenotifications");
check("ClientNotification collection",   ClientNotification.collection.name,   "clientnotifications");

// ── 3. Idempotent registration ────────────────────────────────────────────────
console.log("\n[3] Idempotent registration");
assert("mongoose.models.ClientNotification === ClientNotification", mongoose.models.ClientNotification === ClientNotification);

// ── 4. Timestamps ─────────────────────────────────────────────────────────────
console.log("\n[4] Timestamps");
assert("ClientNotification timestamps:true", ClientNotification.schema.get("timestamps") === true);

// ── 5. Field presence (All 15 schema paths including _id and __v) ─────────────
console.log("\n[5] Schema fields presence");
const expectedPaths = [
  "__v", "_id", "clientId", "createdAt", "dedupKey", "entityCode", "entityId",
  "entityType", "isRead", "message", "navigationTarget", "readAt", "title",
  "type", "updatedAt"
].sort();

const actualPaths = Object.keys(ClientNotification.schema.paths).sort();
check("All schema paths present", actualPaths, expectedPaths);

// ── 6. Enum validation ────────────────────────────────────────────────────────
console.log("\n[6] Enum validation");
const expectedTypes = [
  "INVOICE_GENERATED",
  "PAYMENT_RECEIVED",
  "AMC_EXPIRING",
  "AMC_RENEWED",
  "AMC_REQUEST_SUBMITTED",
  "AMC_REQUEST_UPDATED",
  "AMC_QUOTATION_READY",
  "TICKET_CREATED",
  "TICKET_UPDATED",
  "TICKET_RESOLVED",
  "DOCUMENT_SHARED",
];
check("type enum values (11)", ClientNotification.schema.paths.type.enumValues, expectedTypes);

const expectedEntityTypes = ["invoice", "payment", "amc", "ticket", "document", "other"];
check("entityType enum values (6)", ClientNotification.schema.paths.entityType.enumValues, expectedEntityTypes);

const expectedNavTargets = ["overview", "products", "billing", "tickets", "documents", "profile"];
check("navigationTarget enum values (6)", ClientNotification.schema.paths.navigationTarget.enumValues, expectedNavTargets);

// ── 7. Required fields ────────────────────────────────────────────────────────
console.log("\n[7] Required fields");
assert("clientId is required", ClientNotification.schema.paths.clientId.isRequired === true);
assert("type is required",     ClientNotification.schema.paths.type.isRequired === true);
assert("title is required",    ClientNotification.schema.paths.title.isRequired === true);
assert("message is required",  ClientNotification.schema.paths.message.isRequired === true);
assert("entityId is optional", !ClientNotification.schema.paths.entityId.isRequired);

// ── 8. References ─────────────────────────────────────────────────────────────
console.log("\n[8] References");
check("clientId ref", ClientNotification.schema.paths.clientId.options.ref, "Client");

// ── 9. Defaults ───────────────────────────────────────────────────────────────
console.log("\n[9] Defaults");
check("entityType default",       ClientNotification.schema.paths.entityType.defaultValue,       "other");
check("entityId default",         ClientNotification.schema.paths.entityId.defaultValue,         null);
check("entityCode default",       ClientNotification.schema.paths.entityCode.defaultValue,       "");
check("navigationTarget default", ClientNotification.schema.paths.navigationTarget.defaultValue, "overview");
check("isRead default",           ClientNotification.schema.paths.isRead.defaultValue,           false);
check("readAt default",           ClientNotification.schema.paths.readAt.defaultValue,           null);
check("dedupKey default",         ClientNotification.schema.paths.dedupKey.defaultValue,         "");

// ── 10. Indexes ───────────────────────────────────────────────────────────────
console.log("\n[10] Indexes");
const indexes = ClientNotification.schema.indexes();
console.log("  Indexes registered:", JSON.stringify(indexes));

const hasClientCreatedAtIdx = indexes.some(idx => {
  const keys = idx[0];
  return keys.clientId === 1 && keys.createdAt === -1;
});
assert("Compound index { clientId: 1, createdAt: -1 } exists", hasClientCreatedAtIdx);

const hasClientIsReadIdx = indexes.some(idx => {
  const keys = idx[0];
  return keys.clientId === 1 && keys.isRead === 1;
});
assert("Compound index { clientId: 1, isRead: 1 } exists", hasClientIsReadIdx);

const hasDedupUniqueIdx = indexes.some(idx => {
  const keys = idx[0];
  const opts = idx[1] || {};
  return keys.clientId === 1 && keys.dedupKey === 1 && opts.unique === true;
});
assert("Compound unique index { clientId: 1, dedupKey: 1 } with unique:true exists", hasDedupUniqueIdx);

// ── SUMMARY ──────────────────────────────────────────────────────────────────
console.log("\n================================================================================");
console.log(`VERIFICATION SUMMARY: ${passed} passed, ${failed} failed`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("All ClientNotification schema assertions PASSED successfully.");
  process.exit(0);
}
