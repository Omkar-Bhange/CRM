"use strict";

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
console.log("   ATTENDANCEAPPROVALREQUEST MODEL OFFLINE SCHEMA VERIFICATION                  ");
console.log("================================================================================\n");

// [1] Model Registration & Idempotency
console.log("[1] Model Registration & Idempotency");
const AttendanceApprovalRequest = require("./models/AttendanceApprovalRequest");

assert("AttendanceApprovalRequest model is loaded", Boolean(AttendanceApprovalRequest));
assert("Model name is 'AttendanceApprovalRequest'", AttendanceApprovalRequest.modelName === "AttendanceApprovalRequest");
assert("mongoose.models.AttendanceApprovalRequest is registered", mongoose.models.AttendanceApprovalRequest === AttendanceApprovalRequest);

const reRequired = require("./models/AttendanceApprovalRequest");
assert("Re-require returns identical instance", reRequired === AttendanceApprovalRequest);

// [2] Collection & Schema Options
console.log("\n[2] Collection & Schema Options");
assert("Collection name is 'attendanceApprovalRequests'", AttendanceApprovalRequest.collection.name === "attendanceApprovalRequests");
assert("Schema options collection is 'attendanceApprovalRequests'", AttendanceApprovalRequest.schema.options.collection === "attendanceApprovalRequests");
assert("timestamps option is true", AttendanceApprovalRequest.schema.options.timestamps === true);

// [3] Schema Paths & Types
console.log("\n[3] Schema Paths & Types");
const schema = AttendanceApprovalRequest.schema;
const paths = schema.paths;

const expectedPaths = [
  "_id",
  "employeeId",
  "employeeCode",
  "employeeName",
  "department",
  "date",
  "requestedAt",
  "requestType",
  "reason",
  "pcName",
  "deviceId",
  "ipAddress",
  "networkType",
  "status",
  "approvalType",
  "reviewedBy",
  "reviewedByName",
  "reviewedAt",
  "reviewNote",
  "attendanceId",
  "createdAt",
  "updatedAt",
  "__v",
];

for (const p of expectedPaths) {
  assert(`Path '${p}' exists in schema`, Boolean(paths[p]));
}

assert("employeeId is ObjectId", paths.employeeId.instance === "ObjectId");
assert("employeeId ref is 'Employee'", paths.employeeId.options.ref === "Employee");
assert("employeeId is required", paths.employeeId.options.required === true);

assert("employeeCode is String", paths.employeeCode.instance === "String");
assert("employeeCode is required", paths.employeeCode.options.required === true);
assert("employeeCode has trim: true", paths.employeeCode.options.trim === true);
assert("employeeCode has uppercase: true", paths.employeeCode.options.uppercase === true);

assert("employeeName is String", paths.employeeName.instance === "String");
assert("employeeName is required", paths.employeeName.options.required === true);
assert("employeeName has trim: true", paths.employeeName.options.trim === true);

assert("department is String", paths.department.instance === "String");
assert("department default is empty string", paths.department.options.default === "");
assert("department has trim: true", paths.department.options.trim === true);

assert("date is String", paths.date.instance === "String");
assert("date is required", paths.date.options.required === true);

assert("requestedAt is Date", paths.requestedAt.instance === "Date");
assert("requestedAt is required", paths.requestedAt.options.required === true);
assert("requestedAt has default (Date.now)", typeof paths.requestedAt.options.default === "function" || paths.requestedAt.options.default === Date.now);

assert("requestType is String", paths.requestType.instance === "String");
assert("requestType default is 'Remote Login'", paths.requestType.options.default === "Remote Login");

assert("reason is String", paths.reason.instance === "String");
assert("reason default is empty string", paths.reason.options.default === "");
assert("reason has trim: true", paths.reason.options.trim === true);

assert("pcName is String", paths.pcName.instance === "String");
assert("pcName default is empty string", paths.pcName.options.default === "");
assert("pcName has trim: true", paths.pcName.options.trim === true);

assert("deviceId is String", paths.deviceId.instance === "String");
assert("deviceId default is empty string", paths.deviceId.options.default === "");
assert("deviceId has trim: true", paths.deviceId.options.trim === true);

assert("ipAddress is String", paths.ipAddress.instance === "String");
assert("ipAddress default is empty string", paths.ipAddress.options.default === "");
assert("ipAddress has trim: true", paths.ipAddress.options.trim === true);

assert("networkType is String", paths.networkType.instance === "String");
assert("networkType default is 'Unknown'", paths.networkType.options.default === "Unknown");

assert("status is String", paths.status.instance === "String");
assert("status default is 'Pending'", paths.status.options.default === "Pending");

assert("approvalType is String", paths.approvalType.instance === "String");
assert("approvalType default is empty string", paths.approvalType.options.default === "");

assert("reviewedBy is ObjectId", paths.reviewedBy.instance === "ObjectId");
assert("reviewedBy ref is 'User'", paths.reviewedBy.options.ref === "User");
assert("reviewedBy default is null", paths.reviewedBy.options.default === null);

assert("reviewedByName is String", paths.reviewedByName.instance === "String");
assert("reviewedByName default is empty string", paths.reviewedByName.options.default === "");
assert("reviewedByName has trim: true", paths.reviewedByName.options.trim === true);

assert("reviewedAt is Date", paths.reviewedAt.instance === "Date");
assert("reviewedAt default is null", paths.reviewedAt.options.default === null);

assert("reviewNote is String", paths.reviewNote.instance === "String");
assert("reviewNote default is empty string", paths.reviewNote.options.default === "");
assert("reviewNote has trim: true", paths.reviewNote.options.trim === true);

assert("attendanceId is ObjectId", paths.attendanceId.instance === "ObjectId");
assert("attendanceId ref is 'AttendanceV2'", paths.attendanceId.options.ref === "AttendanceV2");
assert("attendanceId default is null", paths.attendanceId.options.default === null);

// [4] Enum Validations
console.log("\n[4] Enum Validations");
const requestTypeEnum = paths.requestType.enumValues;
assert("requestType has 4 enum values", requestTypeEnum.length === 4);
assert("requestType enum includes 'Remote Login'", requestTypeEnum.includes("Remote Login"));
assert("requestType enum includes 'Work From Home'", requestTypeEnum.includes("Work From Home"));
assert("requestType enum includes 'Client Site'", requestTypeEnum.includes("Client Site"));
assert("requestType enum includes 'Office Exception'", requestTypeEnum.includes("Office Exception"));

const networkTypeEnum = paths.networkType.enumValues;
assert("networkType has 3 enum values", networkTypeEnum.length === 3);
assert("networkType enum includes 'Office'", networkTypeEnum.includes("Office"));
assert("networkType enum includes 'Outside Office'", networkTypeEnum.includes("Outside Office"));
assert("networkType enum includes 'Unknown'", networkTypeEnum.includes("Unknown"));

const statusEnum = paths.status.enumValues;
assert("status has 3 enum values", statusEnum.length === 3);
assert("status enum includes 'Pending'", statusEnum.includes("Pending"));
assert("status enum includes 'Approved'", statusEnum.includes("Approved"));
assert("status enum includes 'Rejected'", statusEnum.includes("Rejected"));

const approvalTypeEnum = paths.approvalType.enumValues;
assert("approvalType has 5 enum values", approvalTypeEnum.length === 5);
assert("approvalType enum includes ''", approvalTypeEnum.includes(""));
assert("approvalType enum includes 'Work From Home'", approvalTypeEnum.includes("Work From Home"));
assert("approvalType enum includes 'Client Site'", approvalTypeEnum.includes("Client Site"));
assert("approvalType enum includes 'Office Exception'", approvalTypeEnum.includes("Office Exception"));
assert("approvalType enum includes 'Late Arrival'", approvalTypeEnum.includes("Late Arrival"));

// [5] Indexes
console.log("\n[5] Indexes");
const indexes = schema.indexes();
assert("Indexes are registered", Array.isArray(indexes) && indexes.length > 0);

const hasEmployeeIndex = indexes.some(([idx]) => idx.employeeId === 1 && Object.keys(idx).length === 1);
const hasEmployeeCodeIndex = indexes.some(([idx]) => idx.employeeCode === 1 && Object.keys(idx).length === 1);
const hasDateIndex = indexes.some(([idx]) => idx.date === 1 && Object.keys(idx).length === 1);
const hasRequestTypeIndex = indexes.some(([idx]) => idx.requestType === 1 && Object.keys(idx).length === 1);
const hasStatusIndex = indexes.some(([idx]) => idx.status === 1 && Object.keys(idx).length === 1);
const hasCompoundIndex = indexes.some(
  ([idx]) => idx.employeeId === 1 && idx.date === 1 && idx.status === 1 && Object.keys(idx).length === 3
);

assert("Single-field index on employeeId: 1 exists", hasEmployeeIndex);
assert("Single-field index on employeeCode: 1 exists", hasEmployeeCodeIndex);
assert("Single-field index on date: 1 exists", hasDateIndex);
assert("Single-field index on requestType: 1 exists", hasRequestTypeIndex);
assert("Single-field index on status: 1 exists", hasStatusIndex);
assert("Compound index on { employeeId: 1, date: 1, status: 1 } exists", hasCompoundIndex);

// [6] Document Instantiation & Default Values
console.log("\n[6] Document Instantiation & Default Values");
const doc = new AttendanceApprovalRequest({
  employeeId: new mongoose.Types.ObjectId(),
  employeeCode: "  emp001  ",
  employeeName: "  Alice Developer  ",
  date: "2026-11-01",
});

assert("employeeCode is trimmed and uppercased to 'EMP001'", doc.employeeCode === "EMP001");
assert("employeeName is trimmed to 'Alice Developer'", doc.employeeName === "Alice Developer");
assert("Default department is empty string", doc.department === "");
assert("Default requestType is 'Remote Login'", doc.requestType === "Remote Login");
assert("Default reason is empty string", doc.reason === "");
assert("Default pcName is empty string", doc.pcName === "");
assert("Default deviceId is empty string", doc.deviceId === "");
assert("Default ipAddress is empty string", doc.ipAddress === "");
assert("Default networkType is 'Unknown'", doc.networkType === "Unknown");
assert("Default status is 'Pending'", doc.status === "Pending");
assert("Default approvalType is empty string", doc.approvalType === "");
assert("Default reviewedBy is null", doc.reviewedBy === null);
assert("Default reviewedByName is empty string", doc.reviewedByName === "");
assert("Default reviewedAt is null", doc.reviewedAt === null);
assert("Default reviewNote is empty string", doc.reviewNote === "");
assert("Default attendanceId is null", doc.attendanceId === null);
assert("requestedAt is populated with Date", doc.requestedAt instanceof Date);

// [7] Validation Errors on Missing Required Fields
console.log("\n[7] Validation Errors on Missing Required Fields");
const emptyDoc = new AttendanceApprovalRequest({});
const valErr = emptyDoc.validateSync();
assert("Empty doc throws validation errors", Boolean(valErr && valErr.errors));
assert("employeeId is required error", Boolean(valErr.errors.employeeId));
assert("employeeCode is required error", Boolean(valErr.errors.employeeCode));
assert("employeeName is required error", Boolean(valErr.errors.employeeName));
assert("date is required error", Boolean(valErr.errors.date));

// [8] Invalid Enum Validation
console.log("\n[8] Invalid Enum Validation");
const badEnumDoc = new AttendanceApprovalRequest({
  employeeId: new mongoose.Types.ObjectId(),
  employeeCode: "EMP001",
  employeeName: "Alice",
  date: "2026-11-01",
  requestType: "InvalidRequestType",
  networkType: "InvalidNetwork",
  status: "InvalidStatus",
  approvalType: "InvalidApproval",
});
const badEnumErr = badEnumDoc.validateSync();
assert("Invalid requestType throws enum ValidationError", Boolean(badEnumErr.errors.requestType));
assert("Invalid networkType throws enum ValidationError", Boolean(badEnumErr.errors.networkType));
assert("Invalid status throws enum ValidationError", Boolean(badEnumErr.errors.status));
assert("Invalid approvalType throws enum ValidationError", Boolean(badEnumErr.errors.approvalType));

// [9] Import Order Permutation & Isolation
console.log("\n[9] Import Order Permutation & Isolation");
delete require.cache[require.resolve("./models/AttendanceApprovalRequest")];
const reloadedModel = require("./models/AttendanceApprovalRequest");
assert("Re-loaded model matches Mongoose registry", reloadedModel === mongoose.models.AttendanceApprovalRequest);
assert("Re-loaded collection name matches", reloadedModel.collection.name === "attendanceApprovalRequests");

console.log("\n================================================================================");
console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("All AttendanceApprovalRequest schema unit checks passed successfully!");
  process.exit(0);
}
