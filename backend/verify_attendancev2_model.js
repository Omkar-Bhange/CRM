const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "node_modules");
require("module").Module._initPaths();
const mongoose = require("mongoose");

console.log("=== VERIFY ATTENDANCE V2 MODEL SCHEMA PARITY ===");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

if (mongoose.models && mongoose.models.AttendanceV2) {
  delete mongoose.models.AttendanceV2;
}

const AttendanceV2 = require("./models/AttendanceV2");

assert(AttendanceV2 !== undefined && AttendanceV2 !== null, "AttendanceV2 model is exported");
assert(AttendanceV2.modelName === "AttendanceV2", "Model name is 'AttendanceV2'");
assert(AttendanceV2.collection.name === "attendance", "Collection name is 'attendance'");

const schema = AttendanceV2.schema;
assert(schema !== undefined && schema !== null, "Schema exists on model");
assert(schema.options.timestamps === true, "Timestamps option is true");
assert(schema.options.collection === "attendance", "Schema options collection is 'attendance'");

// Expected 33 paths
const expectedPaths = [
  "employeeId",
  "employeeCode",
  "employeeName",
  "department",
  "role",
  "date",
  "loginTime",
  "logoutTime",
  "breakStartedAt",
  "breakMinutes",
  "totalBreakMinutes",
  "workingMinutes",
  "totalWorkedMinutes",
  "shiftStart",
  "shiftEnd",
  "graceMinutes",
  "fullDayMinutes",
  "halfDayThresholdMinutes",
  "lateMinutes",
  "earlyLogoutMinutes",
  "overtimeMinutes",
  "status",
  "workStatus",
  "isAutoClosed",
  "autoClosedReason",
  "note",
  "createdBy",
  "updatedBy",
  "isDeleted",
  "_id",
  "createdAt",
  "updatedAt",
  "__v",
];

const actualPaths = Object.keys(schema.paths);
assert(
  actualPaths.length === expectedPaths.length,
  `Path count is exactly ${expectedPaths.length} (got ${actualPaths.length})`
);

expectedPaths.forEach((p) => {
  assert(schema.paths[p] !== undefined, `Path '${p}' exists in schema`);
});

// employeeId
const empIdPath = schema.paths.employeeId;
assert(empIdPath.instance === "ObjectId", "employeeId instance is ObjectId");
assert(empIdPath.isRequired === true, "employeeId is required");
assert(empIdPath.options.ref === "Employee", "employeeId refs 'Employee'");
assert(empIdPath._index === true, "employeeId is indexed");

// employeeCode
const empCodePath = schema.paths.employeeCode;
assert(empCodePath.instance === "String", "employeeCode instance is String");
assert(empCodePath.isRequired === true, "employeeCode is required");
assert(empCodePath.options.trim === true, "employeeCode is trimmed");
assert(empCodePath.options.uppercase === true, "employeeCode is uppercase");
assert(empCodePath._index === true, "employeeCode is indexed");

// employeeName
const empNamePath = schema.paths.employeeName;
assert(empNamePath.instance === "String", "employeeName instance is String");
assert(empNamePath.isRequired === true, "employeeName is required");
assert(empNamePath.options.trim === true, "employeeName is trimmed");
assert(empNamePath._index === true, "employeeName is indexed");

// department & role
assert(schema.paths.department.defaultValue === "", "department default is ''");
assert(schema.paths.role.defaultValue === "", "role default is ''");

// date
const datePath = schema.paths.date;
assert(datePath.instance === "String", "date instance is String");
assert(datePath.isRequired === true, "date is required");
assert(datePath._index === true, "date is indexed");

// loginTime & logoutTime
assert(schema.paths.loginTime.defaultValue === null, "loginTime default is null");
assert(schema.paths.logoutTime.defaultValue === null, "logoutTime default is null");

// breakStartedAt
assert(schema.paths.breakStartedAt.defaultValue === null, "breakStartedAt default is null");

// breakMinutes & totalBreakMinutes
assert(schema.paths.breakMinutes.defaultValue === 0, "breakMinutes default is 0");
assert(schema.paths.breakMinutes.options.min === 0, "breakMinutes min is 0");
assert(schema.paths.totalBreakMinutes.defaultValue === 0, "totalBreakMinutes default is 0");
assert(schema.paths.totalBreakMinutes.options.min === 0, "totalBreakMinutes min is 0");

// workingMinutes & totalWorkedMinutes
assert(schema.paths.workingMinutes.defaultValue === 0, "workingMinutes default is 0");
assert(schema.paths.workingMinutes.options.min === 0, "workingMinutes min is 0");
assert(schema.paths.totalWorkedMinutes.defaultValue === 0, "totalWorkedMinutes default is 0");
assert(schema.paths.totalWorkedMinutes.options.min === 0, "totalWorkedMinutes min is 0");

// shiftStart & shiftEnd
assert(schema.paths.shiftStart.defaultValue === "10:00", "shiftStart default is '10:00'");
assert(schema.paths.shiftStart.options.trim === true, "shiftStart is trimmed");
assert(schema.paths.shiftEnd.defaultValue === "18:00", "shiftEnd default is '18:00'");
assert(schema.paths.shiftEnd.options.trim === true, "shiftEnd is trimmed");

// graceMinutes, fullDayMinutes, halfDayThresholdMinutes
assert(schema.paths.graceMinutes.defaultValue === 15, "graceMinutes default is 15");
assert(schema.paths.graceMinutes.options.min === 0, "graceMinutes min is 0");
assert(schema.paths.fullDayMinutes.defaultValue === 480, "fullDayMinutes default is 480");
assert(schema.paths.fullDayMinutes.options.min === 0, "fullDayMinutes min is 0");
assert(schema.paths.halfDayThresholdMinutes.defaultValue === 240, "halfDayThresholdMinutes default is 240");
assert(schema.paths.halfDayThresholdMinutes.options.min === 0, "halfDayThresholdMinutes min is 0");

// lateMinutes, earlyLogoutMinutes, overtimeMinutes
assert(schema.paths.lateMinutes.defaultValue === 0, "lateMinutes default is 0");
assert(schema.paths.lateMinutes.options.min === 0, "lateMinutes min is 0");
assert(schema.paths.earlyLogoutMinutes.defaultValue === 0, "earlyLogoutMinutes default is 0");
assert(schema.paths.earlyLogoutMinutes.options.min === 0, "earlyLogoutMinutes min is 0");
assert(schema.paths.overtimeMinutes.defaultValue === 0, "overtimeMinutes default is 0");
assert(schema.paths.overtimeMinutes.options.min === 0, "overtimeMinutes min is 0");

// status
const statusPath = schema.paths.status;
assert(statusPath.defaultValue === "Present", "status default is 'Present'");
assert(statusPath._index === true, "status is indexed");
assert(
  JSON.stringify(statusPath.enumValues) ===
    JSON.stringify(["Present", "Late", "Absent", "Half Day", "On Leave"]),
  "status enumValues match original 5 states"
);

// workStatus
const workStatusPath = schema.paths.workStatus;
assert(workStatusPath.defaultValue === "Working", "workStatus default is 'Working'");
assert(workStatusPath._index === true, "workStatus is indexed");
assert(
  JSON.stringify(workStatusPath.enumValues) ===
    JSON.stringify(["Working", "Break", "Logged Out", "On Leave"]),
  "workStatus enumValues match strict 4 states"
);
assert(!workStatusPath.enumValues.includes("Free"), "Legacy 'Free' is strictly EXCLUDED from V2 enum");

// isAutoClosed & autoClosedReason
assert(schema.paths.isAutoClosed.defaultValue === false, "isAutoClosed default is false");
assert(schema.paths.autoClosedReason.defaultValue === "", "autoClosedReason default is ''");

// note
assert(schema.paths.note.defaultValue === "", "note default is ''");

// createdBy & updatedBy
assert(schema.paths.createdBy.instance === "ObjectId", "createdBy instance is ObjectId");
assert(schema.paths.createdBy.options.ref === "User", "createdBy refs 'User'");
assert(schema.paths.updatedBy.instance === "ObjectId", "updatedBy instance is ObjectId");
assert(schema.paths.updatedBy.options.ref === "User", "updatedBy refs 'User'");

// isDeleted
const isDeletedPath = schema.paths.isDeleted;
assert(isDeletedPath.instance === "Boolean", "isDeleted instance is Boolean");
assert(isDeletedPath.defaultValue === false, "isDeleted default is false");
assert(isDeletedPath._index === true, "isDeleted is indexed");

// Indexes
const indexes = schema.indexes();
console.log(`Schema indexes registered: ${indexes.length}`);
const compoundPartialIndex = indexes.find(idx => idx[0] && idx[0].employeeId === 1 && idx[0].date === 1);
assert(compoundPartialIndex !== undefined, "Compound index on { employeeId: 1, date: 1 } exists");
assert(compoundPartialIndex[1].unique === true, "Compound index has unique: true");
assert(
  compoundPartialIndex[1].partialFilterExpression &&
    JSON.stringify(compoundPartialIndex[1].partialFilterExpression) === JSON.stringify({ isDeleted: { $ne: true } }),
  "Exact pre-existing partialFilterExpression { isDeleted: { $ne: true } } is preserved unchanged"
);

// Idempotency
const AttendanceV2Again = require("./models/AttendanceV2");
assert(AttendanceV2Again === AttendanceV2, "Re-requiring model returns cached instance");
assert(mongoose.models.AttendanceV2 === AttendanceV2, "mongoose.models.AttendanceV2 matches export");

console.log(`\n========================================`);
console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log("All AttendanceV2 schema unit checks passed successfully!");
  process.exit(0);
}
