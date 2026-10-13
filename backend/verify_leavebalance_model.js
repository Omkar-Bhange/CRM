"use strict";

/**
 * verify_leavebalance_model.js
 * Offline structural, schema, and registration verification for LeaveBalance model.
 */

const mongoose = require("mongoose");
const path = require("path");

let passed = 0;
let failed = 0;

function assert(description, condition) {
  if (condition) {
    console.log(`  PASS: ${description}`);
    passed++;
  } else {
    console.error(`  FAIL: ${description}`);
    failed++;
  }
}

console.log("================================================================================");
console.log("   LEAVEBALANCE MODEL OFFLINE SCHEMA VERIFICATION                               ");
console.log("================================================================================");

// [1] Model Registration & Idempotency
console.log("\n[1] Model Registration & Idempotency");
const LeaveBalance = require("./models/LeaveBalance");
assert("LeaveBalance model is loaded", Boolean(LeaveBalance));
assert("LeaveBalance modelName is 'LeaveBalance'", LeaveBalance.modelName === "LeaveBalance");
assert("mongoose.models.LeaveBalance is registered", mongoose.models.LeaveBalance === LeaveBalance);

// Re-requiring returns the identical reference
const ReRequired = require("./models/LeaveBalance");
assert("Re-require returns identical instance", ReRequired === LeaveBalance);

// [2] Collection & Schema Options
console.log("\n[2] Collection & Schema Options");
assert("Collection name is 'leaveBalances'", LeaveBalance.collection.name === "leaveBalances");
assert("Schema options collection is 'leaveBalances'", LeaveBalance.schema.options.collection === "leaveBalances");
assert("timestamps option is true", LeaveBalance.schema.options.timestamps === true);

// [3] Schema Paths & Types
console.log("\n[3] Schema Paths & Types");
const paths = LeaveBalance.schema.paths;
const expectedPaths = [
  "_id",
  "employeeId",
  "year",
  "leaveType",
  "code",
  "total",
  "carriedForward",
  "createdAt",
  "updatedAt",
  "__v",
];

expectedPaths.forEach((p) => {
  assert(`Path '${p}' exists in schema`, Boolean(paths[p]));
});

assert("employeeId is ObjectId", paths.employeeId.instance === "ObjectId");
assert("employeeId ref is 'Employee'", paths.employeeId.options.ref === "Employee");
assert("employeeId is required", paths.employeeId.isRequired === true);

assert("year is Number", paths.year.instance === "Number");
assert("year is required", paths.year.isRequired === true);

assert("leaveType is String", paths.leaveType.instance === "String");
assert("leaveType is required", paths.leaveType.isRequired === true);
assert("leaveType has trim", paths.leaveType.options.trim === true);

assert("code is String", paths.code.instance === "String");
assert("code is required", paths.code.isRequired === true);
assert("code has trim", paths.code.options.trim === true);
assert("code has uppercase", paths.code.options.uppercase === true);

assert("total is Number", paths.total.instance === "Number");
assert("total default is 0", paths.total.defaultValue === 0);
assert("total has min: 0", paths.total.options.min === 0);

assert("carriedForward is Number", paths.carriedForward.instance === "Number");
assert("carriedForward default is 0", paths.carriedForward.defaultValue === 0);
assert("carriedForward has min: 0", paths.carriedForward.options.min === 0);

// [4] Indexes
console.log("\n[4] Indexes");
const indexes = LeaveBalance.schema.indexes();
assert("Indexes are registered", Array.isArray(indexes) && indexes.length > 0);

// Single field index on employeeId
const hasEmpIdx = indexes.some(idx => idx[0].employeeId === 1 && Object.keys(idx[0]).length === 1);
assert("Single-field index on employeeId: 1 exists", hasEmpIdx);

// Single field index on year
const hasYearIdx = indexes.some(idx => idx[0].year === 1 && Object.keys(idx[0]).length === 1);
assert("Single-field index on year: 1 exists", hasYearIdx);

// Compound unique index on { employeeId: 1, year: 1, leaveType: 1 }
const compoundIdx = indexes.find(
  idx => idx[0].employeeId === 1 && idx[0].year === 1 && idx[0].leaveType === 1
);
assert("Compound index on { employeeId: 1, year: 1, leaveType: 1 } exists", Boolean(compoundIdx));
assert("Compound index is unique", compoundIdx && compoundIdx[1] && compoundIdx[1].unique === true);

// [5] Document Instantiation & Default Values
console.log("\n[5] Document Instantiation & Default Values");
const dummyEmpId = new mongoose.Types.ObjectId();
const doc = new LeaveBalance({
  employeeId: dummyEmpId,
  year: 2026,
  leaveType: "  Casual Leave  ",
  code: " cl ",
});

assert("Default total is 0", doc.total === 0);
assert("Default carriedForward is 0", doc.carriedForward === 0);
assert("leaveType trimmed", doc.leaveType === "Casual Leave");
assert("code uppercase & trimmed", doc.code === "CL");

// [6] Validation Errors on Missing Required Fields
console.log("\n[6] Validation Errors on Missing Required Fields");
const emptyDoc = new LeaveBalance({});
const valErr = emptyDoc.validateSync();
assert("Empty doc throws validation errors", Boolean(valErr));
assert("employeeId is required error", Boolean(valErr.errors.employeeId));
assert("year is required error", Boolean(valErr.errors.year));
assert("leaveType is required error", Boolean(valErr.errors.leaveType));
assert("code is required error", Boolean(valErr.errors.code));

// [7] Negative values rejected
console.log("\n[7] Negative values rejected");
const negDoc = new LeaveBalance({
  employeeId: dummyEmpId,
  year: 2026,
  leaveType: "Sick Leave",
  code: "SL",
  total: -5,
  carriedForward: -1,
});
const negValErr = negDoc.validateSync();
assert("Negative total triggers min validator error", Boolean(negValErr && negValErr.errors.total));
assert("Negative carriedForward triggers min validator error", Boolean(negValErr && negValErr.errors.carriedForward));

// [8] Import Order Permutation & Isolation
console.log("\n[8] Import Order Permutation & Isolation");
delete require.cache[require.resolve("./models/LeaveBalance")];
const FreshModel = require("./models/LeaveBalance");
assert("Re-loaded model matches Mongoose registry", mongoose.models.LeaveBalance === FreshModel);
assert("Re-loaded collection name matches", FreshModel.collection.name === "leaveBalances");

// Summary
console.log("\n================================================================================");
console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("All LeaveBalance schema unit checks passed successfully!");
  process.exit(0);
}
