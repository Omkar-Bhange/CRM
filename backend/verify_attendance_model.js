const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "node_modules");
require("module").Module._initPaths();
const mongoose = require("mongoose");

console.log("=== VERIFY ATTENDANCE MODEL (V1) SCHEMA PARITY ===");

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

if (mongoose.models && mongoose.models.Attendance) {
  delete mongoose.models.Attendance;
}

const Attendance = require("./models/Attendance");

assert(Attendance !== undefined && Attendance !== null, "Attendance model is exported");
assert(Attendance.modelName === "Attendance", "Model name is 'Attendance'");
assert(Attendance.collection.name === "attendance", "Collection name is 'attendance'");

const schema = Attendance.schema;
assert(schema !== undefined && schema !== null, "Schema exists on model");
assert(schema.options.timestamps === true, "Timestamps option is true");
assert(schema.options.collection === "attendance", "Schema options collection is 'attendance'");

// Expected paths
const expectedPaths = [
  "employeeId",
  "employeeCode",
  "employeeName",
  "department",
  "role",
  "date",
  "loginTime",
  "logoutTime",
  "breakMinutes",
  "breakStartedAt",
  "workingMinutes",
  "overtimeMinutes",
  "status",
  "workStatus",
  "note",
  "createdBy",
  "updatedBy",
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

// V2 exclusive fields MUST NOT exist in V1
const v2ExclusiveFields = [
  "totalBreakMinutes",
  "totalWorkedMinutes",
  "shiftStart",
  "shiftEnd",
  "graceMinutes",
  "fullDayMinutes",
  "halfDayThresholdMinutes",
  "lateMinutes",
  "earlyLogoutMinutes",
  "isAutoClosed",
  "autoClosedReason",
  "isDeleted",
];

v2ExclusiveFields.forEach((f) => {
  assert(schema.paths[f] === undefined, `V2-exclusive field '${f}' is NOT in V1 schema`);
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

// employeeName
const empNamePath = schema.paths.employeeName;
assert(empNamePath.instance === "String", "employeeName instance is String");
assert(empNamePath.isRequired === true, "employeeName is required");
assert(empNamePath.options.trim === true, "employeeName is trimmed");

// department
const deptPath = schema.paths.department;
assert(deptPath.instance === "String", "department instance is String");
assert(deptPath.defaultValue === "", "department default is ''");
assert(deptPath.options.trim === true, "department is trimmed");

// role
const rolePath = schema.paths.role;
assert(rolePath.instance === "String", "role instance is String");
assert(rolePath.defaultValue === "", "role default is ''");
assert(rolePath.options.trim === true, "role is trimmed");

// date
const datePath = schema.paths.date;
assert(datePath.instance === "String", "date instance is String");
assert(datePath.isRequired === true, "date is required");
assert(datePath._index === true, "date is indexed");

// loginTime
const loginPath = schema.paths.loginTime;
assert(loginPath.instance === "Date", "loginTime instance is Date");
assert(loginPath.defaultValue === null, "loginTime default is null");

// logoutTime
const logoutPath = schema.paths.logoutTime;
assert(logoutPath.instance === "Date", "logoutTime instance is Date");
assert(logoutPath.defaultValue === null, "logoutTime default is null");

// breakMinutes
const breakMinPath = schema.paths.breakMinutes;
assert(breakMinPath.instance === "Number", "breakMinutes instance is Number");
assert(breakMinPath.defaultValue === 0, "breakMinutes default is 0");
assert(breakMinPath.options.min === 0, "breakMinutes min is 0");

// breakStartedAt
const breakStartPath = schema.paths.breakStartedAt;
assert(breakStartPath.instance === "Date", "breakStartedAt instance is Date");
assert(breakStartPath.defaultValue === null, "breakStartedAt default is null");

// workingMinutes
const workMinPath = schema.paths.workingMinutes;
assert(workMinPath.instance === "Number", "workingMinutes instance is Number");
assert(workMinPath.defaultValue === 0, "workingMinutes default is 0");
assert(workMinPath.options.min === 0, "workingMinutes min is 0");

// overtimeMinutes
const otMinPath = schema.paths.overtimeMinutes;
assert(otMinPath.instance === "Number", "overtimeMinutes instance is Number");
assert(otMinPath.defaultValue === 0, "overtimeMinutes default is 0");
assert(otMinPath.options.min === 0, "overtimeMinutes min is 0");

// status
const statusPath = schema.paths.status;
assert(statusPath.instance === "String", "status instance is String");
assert(statusPath.defaultValue === "Present", "status default is 'Present'");
assert(
  JSON.stringify(statusPath.enumValues) ===
    JSON.stringify(["Present", "Late", "Absent", "Half Day", "On Leave"]),
  "status enumValues match original 5 states"
);

// workStatus
const workStatusPath = schema.paths.workStatus;
assert(workStatusPath.instance === "String", "workStatus instance is String");
assert(workStatusPath.defaultValue === "Working", "workStatus default is 'Working'");
assert(
  JSON.stringify(workStatusPath.enumValues) ===
    JSON.stringify(["Working", "Free", "Break", "Logged Out", "On Leave"]),
  "workStatus enumValues include legacy 'Free'"
);
assert(workStatusPath.enumValues.includes("Free"), "Legacy 'Free' is explicitly present in V1 enum");

// note
const notePath = schema.paths.note;
assert(notePath.instance === "String", "note instance is String");
assert(notePath.defaultValue === "", "note default is ''");
assert(notePath.options.trim === true, "note is trimmed");

// createdBy
const createdPath = schema.paths.createdBy;
assert(createdPath.instance === "ObjectId", "createdBy instance is ObjectId");
assert(createdPath.defaultValue === null, "createdBy default is null");
assert(createdPath.options.ref === "User", "createdBy refs 'User'");

// updatedBy
const updatedPath = schema.paths.updatedBy;
assert(updatedPath.instance === "ObjectId", "updatedBy instance is ObjectId");
assert(updatedPath.defaultValue === null, "updatedBy default is null");
assert(updatedPath.options.ref === "User", "updatedBy refs 'User'");

// Idempotency: require again returns identical instance
const AttendanceAgain = require("./models/Attendance");
assert(AttendanceAgain === Attendance, "Re-requiring model returns cached instance");
assert(mongoose.models.Attendance === Attendance, "mongoose.models.Attendance matches export");

console.log(`\n========================================`);
console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log("All Attendance (V1) schema unit checks passed successfully!");
  process.exit(0);
}
