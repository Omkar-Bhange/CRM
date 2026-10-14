"use strict";

/**
 * verify_attendanceregularization_model.js
 * Offline structural, schema, and registration verification for AttendanceRegularization model.
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
console.log("   ATTENDANCEREGULARIZATION MODEL OFFLINE SCHEMA VERIFICATION                   ");
console.log("================================================================================");

// [1] Model Registration & Idempotency
console.log("\n[1] Model Registration & Idempotency");
const AttendanceRegularization = require("./models/AttendanceRegularization");
assert("AttendanceRegularization model is loaded", Boolean(AttendanceRegularization));
assert("Model name is 'AttendanceRegularization'", AttendanceRegularization.modelName === "AttendanceRegularization");
assert("mongoose.models.AttendanceRegularization is registered", mongoose.models.AttendanceRegularization === AttendanceRegularization);

// Re-requiring returns identical instance
const ReRequired = require("./models/AttendanceRegularization");
assert("Re-require returns identical instance", ReRequired === AttendanceRegularization);

// [2] Collection & Schema Options
console.log("\n[2] Collection & Schema Options");
assert("Collection name is 'attendanceRegularizations'", AttendanceRegularization.collection.name === "attendanceRegularizations");
assert("Schema options collection is 'attendanceRegularizations'", AttendanceRegularization.schema.options.collection === "attendanceRegularizations");
assert("timestamps option is true", AttendanceRegularization.schema.options.timestamps === true);

// [3] Schema Paths & Types
console.log("\n[3] Schema Paths & Types");
const paths = AttendanceRegularization.schema.paths;
const expectedPaths = [
  "_id",
  "employeeId",
  "employeeCode",
  "employeeName",
  "date",
  "requestType",
  "requestedLoginTime",
  "requestedLogoutTime",
  "reason",
  "status",
  "reviewedBy",
  "reviewNote",
  "reviewedAt",
  "attendanceId",
  "appliedAt",
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

assert("employeeCode is String", paths.employeeCode.instance === "String");
assert("employeeCode is required", paths.employeeCode.isRequired === true);

assert("employeeName is String", paths.employeeName.instance === "String");
assert("employeeName is required", paths.employeeName.isRequired === true);

assert("date is String", paths.date.instance === "String");
assert("date is required", paths.date.isRequired === true);

assert("requestType is String", paths.requestType.instance === "String");
assert("requestType is required", paths.requestType.isRequired === true);

assert("requestedLoginTime is String", paths.requestedLoginTime.instance === "String");
assert("requestedLoginTime default is empty string", paths.requestedLoginTime.defaultValue === "");

assert("requestedLogoutTime is String", paths.requestedLogoutTime.instance === "String");
assert("requestedLogoutTime default is empty string", paths.requestedLogoutTime.defaultValue === "");

assert("reason is String", paths.reason.instance === "String");
assert("reason is required", paths.reason.isRequired === true);
assert("reason has trim: true", paths.reason.options.trim === true);

assert("status is String", paths.status.instance === "String");
assert("status default is 'Pending'", paths.status.defaultValue === "Pending");

assert("reviewedBy is String", paths.reviewedBy.instance === "String");
assert("reviewedBy default is empty string", paths.reviewedBy.defaultValue === "");

assert("reviewNote is String", paths.reviewNote.instance === "String");
assert("reviewNote default is empty string", paths.reviewNote.defaultValue === "");

assert("reviewedAt is Date", paths.reviewedAt.instance === "Date");
assert("reviewedAt default is null", paths.reviewedAt.defaultValue === null);

assert("attendanceId is ObjectId", paths.attendanceId.instance === "ObjectId");
assert("attendanceId ref is 'AttendanceV2'", paths.attendanceId.options.ref === "AttendanceV2");
assert("attendanceId default is null", paths.attendanceId.defaultValue === null);

assert("appliedAt is Date", paths.appliedAt.instance === "Date");
assert("appliedAt default is null", paths.appliedAt.defaultValue === null);

// [4] Enum Validations
console.log("\n[4] Enum Validations");
const requestTypeEnums = paths.requestType.enumValues;
assert("requestType has 6 enum values", Array.isArray(requestTypeEnums) && requestTypeEnums.length === 6);
const expectedRequestTypes = [
  "Missing Login",
  "Missing Logout",
  "Incorrect Time",
  "Absent Correction",
  "Work From Home",
  "Client Site",
];
expectedRequestTypes.forEach((t) => {
  assert(`requestType enum includes '${t}'`, requestTypeEnums.includes(t));
});

const statusEnums = paths.status.enumValues;
assert("status has 3 enum values", Array.isArray(statusEnums) && statusEnums.length === 3);
const expectedStatuses = ["Pending", "Approved", "Rejected"];
expectedStatuses.forEach((s) => {
  assert(`status enum includes '${s}'`, statusEnums.includes(s));
});

// [5] Indexes
console.log("\n[5] Indexes");
const indexes = AttendanceRegularization.schema.indexes();
assert("Indexes are registered", Array.isArray(indexes) && indexes.length > 0);

const hasEmpIdx = indexes.some(idx => idx[0].employeeId === 1);
assert("Single-field index on employeeId: 1 exists", hasEmpIdx);

const hasDateIdx = indexes.some(idx => idx[0].date === 1);
assert("Single-field index on date: 1 exists", hasDateIdx);

const hasStatusIdx = indexes.some(idx => idx[0].status === 1);
assert("Single-field index on status: 1 exists", hasStatusIdx);

// [6] Document Instantiation & Default Values
console.log("\n[6] Document Instantiation & Default Values");
const dummyEmpId = new mongoose.Types.ObjectId();
const doc = new AttendanceRegularization({
  employeeId: dummyEmpId,
  employeeCode: "EMP001",
  employeeName: "Alice Engineer",
  date: "2026-10-14",
  requestType: "Missing Login",
  reason: "  Swipe card reader offline  ",
});

assert("Default status is 'Pending'", doc.status === "Pending");
assert("Default requestedLoginTime is empty string", doc.requestedLoginTime === "");
assert("Default requestedLogoutTime is empty string", doc.requestedLogoutTime === "");
assert("Default reviewedBy is empty string", doc.reviewedBy === "");
assert("Default reviewNote is empty string", doc.reviewNote === "");
assert("Default reviewedAt is null", doc.reviewedAt === null);
assert("Default attendanceId is null", doc.attendanceId === null);
assert("Default appliedAt is null", doc.appliedAt === null);
assert("reason is trimmed", doc.reason === "Swipe card reader offline");

// [7] Validation Errors on Missing Required Fields
console.log("\n[7] Validation Errors on Missing Required Fields");
const emptyDoc = new AttendanceRegularization({});
const valErr = emptyDoc.validateSync();
assert("Empty doc throws validation errors", Boolean(valErr));
assert("employeeId is required error", Boolean(valErr.errors.employeeId));
assert("employeeCode is required error", Boolean(valErr.errors.employeeCode));
assert("employeeName is required error", Boolean(valErr.errors.employeeName));
assert("date is required error", Boolean(valErr.errors.date));
assert("requestType is required error", Boolean(valErr.errors.requestType));
assert("reason is required error", Boolean(valErr.errors.reason));

// [8] Invalid Enum Validation
console.log("\n[8] Invalid Enum Validation");
const invalidDoc = new AttendanceRegularization({
  employeeId: dummyEmpId,
  employeeCode: "EMP001",
  employeeName: "Alice Engineer",
  date: "2026-10-14",
  requestType: "Invalid Request Type",
  reason: "Testing",
  status: "Invalid Status",
});
const enumErr = invalidDoc.validateSync();
assert("Invalid requestType throws enum ValidationError", Boolean(enumErr && enumErr.errors.requestType));
assert("Invalid status throws enum ValidationError", Boolean(enumErr && enumErr.errors.status));

// [9] Import Order Permutation & Isolation
console.log("\n[9] Import Order Permutation & Isolation");
delete require.cache[require.resolve("./models/AttendanceRegularization")];
const FreshModel = require("./models/AttendanceRegularization");
assert("Re-loaded model matches Mongoose registry", mongoose.models.AttendanceRegularization === FreshModel);
assert("Re-loaded collection name matches", FreshModel.collection.name === "attendanceRegularizations");

// Summary
console.log("\n================================================================================");
console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("All AttendanceRegularization schema unit checks passed successfully!");
  process.exit(0);
}
