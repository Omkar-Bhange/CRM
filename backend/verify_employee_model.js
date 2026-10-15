"use strict";

const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "node_modules");
require("module").Module._initPaths();

const mongoose = require("mongoose");
const assert = require("assert");

const Employee = require("./models/Employee");

let passCount = 0;
function test(name, fn) {
  try {
    fn();
    passCount++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    process.exit(1);
  }
}

console.log("Starting Employee Schema & Registration Verification...\n");

// 1. Model & Collection Identity
test("Employee model exists and is a Mongoose model function", () => {
  assert(Employee, "Employee must be truthy");
  assert.strictEqual(typeof Employee, "function", "Employee must be a function/model");
  assert.strictEqual(Employee.modelName, "Employee", "modelName must be 'Employee'");
});

test("Collection name is explicitly 'employees'", () => {
  assert.strictEqual(Employee.collection.name, "employees");
});

test("Schema options include timestamps: true", () => {
  assert.strictEqual(Employee.schema.options.timestamps, true);
});

// 2. Schema Paths and Configurations
const paths = Employee.schema.paths;

test("userId path configuration (ref: 'User')", () => {
  const p = paths.userId;
  assert(p, "userId path must exist");
  assert.strictEqual(p.instance, "ObjectId");
  assert.strictEqual(p.options.ref, "User");
  assert.strictEqual(p.options.default, null);
});

test("employeeCode path configuration (required, unique, uppercase, trim)", () => {
  const p = paths.employeeCode;
  assert(p, "employeeCode path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.isRequired, true);
  assert.strictEqual(p.options.unique, true);
  assert.strictEqual(p.options.uppercase, true);
  assert.strictEqual(p.options.trim, true);
});

test("name path configuration (required, trim)", () => {
  const p = paths.name;
  assert(p, "name path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.isRequired, true);
  assert.strictEqual(p.options.trim, true);
});

test("email path configuration (required, unique, lowercase, trim)", () => {
  const p = paths.email;
  assert(p, "email path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.isRequired, true);
  assert.strictEqual(p.options.unique, true);
  assert.strictEqual(p.options.lowercase, true);
  assert.strictEqual(p.options.trim, true);
});

test("mobile path configuration (default empty string, trim)", () => {
  const p = paths.mobile;
  assert(p, "mobile path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.options.default, "");
  assert.strictEqual(p.options.trim, true);
});

test("role path configuration (required, trim)", () => {
  const p = paths.role;
  assert(p, "role path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.isRequired, true);
  assert.strictEqual(p.options.trim, true);
});

test("department path configuration (enum, default 'Support')", () => {
  const p = paths.department;
  assert(p, "department path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.options.default, "Support");
  assert.deepStrictEqual(p.options.enum, [
    "Support",
    "Development",
    "Operations",
    "Accounts",
    "Management",
    "Sales",
    "Other",
  ]);
});

test("joiningDate path configuration (default empty string)", () => {
  const p = paths.joiningDate;
  assert(p, "joiningDate path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.options.default, "");
});

test("status path configuration (enum, default 'Free')", () => {
  const p = paths.status;
  assert(p, "status path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.options.default, "Free");
  assert.deepStrictEqual(p.options.enum, [
    "Free",
    "Working",
    "Break",
    "Leave",
    "Offline",
    "Inactive",
  ]);
});

test("currentTask path configuration (default 'Available for assignment', trim)", () => {
  const p = paths.currentTask;
  assert(p, "currentTask path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.options.default, "Available for assignment");
  assert.strictEqual(p.options.trim, true);
});

test("currentTaskId path configuration (ref: 'Task')", () => {
  const p = paths.currentTaskId;
  assert(p, "currentTaskId path must exist");
  assert.strictEqual(p.instance, "ObjectId");
  assert.strictEqual(p.options.ref, "Task");
  assert.strictEqual(p.options.default, null);
});

test("currentTicketId path configuration (ref: 'SupportTicket')", () => {
  const p = paths.currentTicketId;
  assert(p, "currentTicketId path must exist");
  assert.strictEqual(p.instance, "ObjectId");
  assert.strictEqual(p.options.ref, "SupportTicket");
  assert.strictEqual(p.options.default, null);
});

test("currentTaskCode, currentTaskTitle, currentClient, currentProject paths", () => {
  assert.strictEqual(paths.currentTaskCode.instance, "String");
  assert.strictEqual(paths.currentTaskTitle.instance, "String");
  assert.strictEqual(paths.currentClient.instance, "String");
  assert.strictEqual(paths.currentClient.options.default, "—");
  assert.strictEqual(paths.currentProject.instance, "String");
  assert.strictEqual(paths.currentProject.options.default, "—");
});

test("currentTaskStartedAt, loginTime, logoutTime, lastActivityAt Date paths", () => {
  assert.strictEqual(paths.currentTaskStartedAt.instance, "Date");
  assert.strictEqual(paths.currentTaskStartedAt.options.default, null);
  assert.strictEqual(paths.loginTime.instance, "Date");
  assert.strictEqual(paths.logoutTime.instance, "Date");
  assert.strictEqual(paths.lastActivityAt.instance, "Date");
});

test("numeric counter paths: activeMinutes, openTasks, completedToday (min: 0, default: 0)", () => {
  for (const field of ["activeMinutes", "openTasks", "completedToday"]) {
    const p = paths[field];
    assert(p, `${field} path must exist`);
    assert.strictEqual(p.instance, "Number");
    assert.strictEqual(p.options.default, 0);
    assert.strictEqual(p.options.min, 0);
  }
});

test("isActive path configuration (Boolean, default: true)", () => {
  const p = paths.isActive;
  assert(p, "isActive path must exist");
  assert.strictEqual(p.instance, "Boolean");
  assert.strictEqual(p.options.default, true);
});

test("timestamps paths createdAt and updatedAt exist", () => {
  assert(paths.createdAt, "createdAt exists");
  assert.strictEqual(paths.createdAt.instance, "Date");
  assert(paths.updatedAt, "updatedAt exists");
  assert.strictEqual(paths.updatedAt.instance, "Date");
});

// 3. Singleton and import integrity
test("Mongoose model singleton guard", () => {
  assert.strictEqual(mongoose.models.Employee, Employee);
  const reRequired = require("./models/Employee");
  assert.strictEqual(reRequired, Employee);
});

console.log(`\nAll ${passCount} schema verification tests passed successfully!`);
console.log(`TOTAL CHECKS: ${passCount}`);

