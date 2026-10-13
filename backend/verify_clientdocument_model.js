"use strict";
/**
 * verify_clientdocument_model.js
 * Offline schema verification suite for ClientDocument model.
 * Run from: backend/
 */

const mongoose = require("mongoose");

const Product        = require("./models/Product");
const Project        = require("./models/Project");
const Requirement    = require("./models/Requirement");
const SystemSettings = require("./models/SystemSettings");
const ClientDocument = require("./models/ClientDocument");

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

// ── 1. Model names ────────────────────────────────────────────────────────────
console.log("\n[1] Model names");
check("Product.modelName",        Product.modelName,        "Product");
check("Project.modelName",        Project.modelName,        "Project");
check("Requirement.modelName",    Requirement.modelName,    "Requirement");
check("SystemSettings.modelName", SystemSettings.modelName, "SystemSettings");
check("ClientDocument.modelName", ClientDocument.modelName, "ClientDocument");

// ── 2. Collection names ───────────────────────────────────────────────────────
console.log("\n[2] Collection names");
check("Product collection",        Product.collection.name,        "products");
check("Project collection",        Project.collection.name,        "projects");
check("Requirement collection",    Requirement.collection.name,    "requirements");
check("SystemSettings collection", SystemSettings.collection.name, "systemsettings");
check("ClientDocument collection", ClientDocument.collection.name, "clientdocuments");

// ── 3. Idempotent registration ────────────────────────────────────────────────
console.log("\n[3] Idempotent registration");
assert("mongoose.models.ClientDocument === ClientDocument", mongoose.models.ClientDocument === ClientDocument);

// ── 4. Timestamps ─────────────────────────────────────────────────────────────
console.log("\n[4] Timestamps");
assert("ClientDocument timestamps:true", ClientDocument.schema.get("timestamps") === true);

// ── 5. Field presence (All 39 paths including __v and _id) ────────────────────
console.log("\n[5] Schema fields presence");
const expectedPaths = [
  "__v", "_id", "archivedAt", "archivedById", "archivedByName", "category",
  "clientCode", "clientId", "clientName", "createdAt", "createdBy", "createdByName",
  "deletedAt", "description", "documentCode", "documentType", "fileName", "fileUrl",
  "isDeleted", "isRequest", "mimeType", "name", "notes", "productId", "productName",
  "requestedAt", "size", "status", "type", "updatedAt", "updatedBy", "updatedByName",
  "uploadedBy", "uploadedById", "uploadedByName", "uploadedByRole",
  "verifiedAt", "verifiedById", "verifiedByName",
].sort();

const actualPaths = Object.keys(ClientDocument.schema.paths).sort();
check("All schema paths present", actualPaths, expectedPaths);

// ── 6. Size field validation ──────────────────────────────────────────────────
console.log("\n[6] Size field validation");
const sizeValidator = ClientDocument.schema.paths.size.validators.find(v => typeof v.validator === "function");
assert("Size custom validator exists", !!sizeValidator);
if (sizeValidator) {
  assert("Accepts null", sizeValidator.validator(null));
  assert("Accepts undefined", sizeValidator.validator(undefined));
  assert("Accepts 0", sizeValidator.validator(0));
  assert("Accepts positive byte integer (1048576)", sizeValidator.validator(1048576));
  assert("Accepts formatted string ('2.4 MB')", sizeValidator.validator("2.4 MB"));
  assert("Accepts empty string ('')", sizeValidator.validator(""));
  assert("Rejects negative number (-1)", !sizeValidator.validator(-1));
  assert("Rejects NaN", !sizeValidator.validator(NaN));
  assert("Rejects plain object ({})", !sizeValidator.validator({}));
  assert("Rejects array ([])", !sizeValidator.validator([]));
  assert("Rejects boolean (true)", !sizeValidator.validator(true));
}

// ── 7. Required fields ────────────────────────────────────────────────────────
console.log("\n[7] Required fields");
assert("clientId is required", ClientDocument.schema.paths.clientId.isRequired);
assert("name is required", ClientDocument.schema.paths.name.isRequired);

// ── 8. Enums ──────────────────────────────────────────────────────────────────
console.log("\n[8] Enums");
check("type enum",
  ClientDocument.schema.paths.type.enumValues.sort(),
  ["Excel", "Image", "Other", "PDF", "Word", "ZIP"].sort()
);
check("status enum",
  ClientDocument.schema.paths.status.enumValues.sort(),
  ["Active", "Archived", "Pending", "Requested", "Verified"].sort()
);
check("uploadedByRole enum",
  ClientDocument.schema.paths.uploadedByRole.enumValues.sort(),
  ["admin", "client", "employee", "system"].sort()
);

// ── 9. References ─────────────────────────────────────────────────────────────
console.log("\n[9] References");
check("clientId ref",     ClientDocument.schema.paths.clientId.options.ref,     "Client");
check("productId ref",    ClientDocument.schema.paths.productId.options.ref,    "Product");
check("uploadedBy ref",   ClientDocument.schema.paths.uploadedBy.options.ref,   "User");
check("uploadedById ref", ClientDocument.schema.paths.uploadedById.options.ref, "User");
check("verifiedById ref", ClientDocument.schema.paths.verifiedById.options.ref, "User");
check("archivedById ref", ClientDocument.schema.paths.archivedById.options.ref, "User");
check("createdBy ref",    ClientDocument.schema.paths.createdBy.options.ref,    "User");
check("updatedBy ref",    ClientDocument.schema.paths.updatedBy.options.ref,    "User");

// ── 10. Text index ────────────────────────────────────────────────────────────
console.log("\n[10] Text index");
const textIndex = ClientDocument.schema.indexes().find(([spec]) => Object.values(spec).includes("text"));
assert("Compound text index exists", !!textIndex);
if (textIndex) {
  check("Text index fields", Object.keys(textIndex[0]).sort(), ["category", "clientName", "description", "name", "productName", "uploadedByName"].sort());
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log("\n" + "=".repeat(55));
console.log(`PASSED: ${passed}  FAILED: ${failed}`);
if (failed === 0) {
  console.log("ALL CHECKS PASSED [OK]");
  process.exit(0);
} else {
  console.error("SOME CHECKS FAILED [FAIL]");
  process.exit(1);
}
