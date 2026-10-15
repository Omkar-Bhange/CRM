"use strict";

const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "node_modules");
require("module").Module._initPaths();

const mongoose = require("mongoose");
const assert = require("assert");

const User = require("./models/User");

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

console.log("Starting User Schema & Registration Verification...\n");

// 1. Model & Collection Identity
test("User exports a valid Mongoose model", () => {
  assert(User, "User should be truthy");
  assert.strictEqual(typeof User, "function");
  assert.strictEqual(User.modelName, "User");
});

test("Model registration name is 'User'", () => {
  assert.strictEqual(User.modelName, "User");
});

test("Collection name is explicitly 'users'", () => {
  assert.strictEqual(User.collection.name, "users");
});

test("Timestamps option is enabled", () => {
  assert.strictEqual(User.schema.options.timestamps, true);
});

// 2. Schema Paths & Configurations
const paths = User.schema.paths;

test("Schema path 'name' is configured properly", () => {
  const p = paths.name;
  assert(p, "name path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.isRequired, true);
  assert.strictEqual(p.options.trim, true);
});

test("Schema path 'email' is configured properly with lowercase and unique", () => {
  const p = paths.email;
  assert(p, "email path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.isRequired, true);
  assert.strictEqual(p.options.unique, true);
  assert.strictEqual(p.options.lowercase, true);
  assert.strictEqual(p.options.trim, true);
});

test("Schema path 'employeeCode' is configured properly", () => {
  const p = paths.employeeCode;
  assert(p, "employeeCode path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.options.default, "");
  assert.strictEqual(p.options.trim, true);
  assert.strictEqual(p.options.uppercase, true);
  assert.strictEqual(p.options.index, true);
});

test("Schema path 'password' has select: false and minlength: 6", () => {
  const p = paths.password;
  assert(p, "password path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.isRequired, true);
  assert.strictEqual(p.options.select, false);
  assert.strictEqual(p.options.minlength, 6);
});

test("Schema path 'role' has correct enum values and lowercase", () => {
  const p = paths.role;
  assert(p, "role path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.isRequired, true);
  assert.strictEqual(p.options.lowercase, true);
  assert.deepStrictEqual(p.options.enum, ["admin", "employee", "client"]);
});

test("Schema path 'clientId' references 'Client' and is indexed", () => {
  const p = paths.clientId;
  assert(p, "clientId path must exist");
  assert.strictEqual(p.instance, "ObjectId");
  assert.strictEqual(p.options.ref, "Client");
  assert.strictEqual(p.options.default, null);
  assert.strictEqual(p.options.index, true);
});

test("Schema path 'clientCode' is configured properly", () => {
  const p = paths.clientCode;
  assert(p, "clientCode path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.options.default, "");
  assert.strictEqual(p.options.trim, true);
  assert.strictEqual(p.options.uppercase, true);
});

test("Schema path 'companyName' and 'mobile' are configured properly", () => {
  assert(paths.companyName, "companyName path must exist");
  assert.strictEqual(paths.companyName.instance, "String");
  assert.strictEqual(paths.companyName.options.trim, true);
  assert(paths.mobile, "mobile path must exist");
  assert.strictEqual(paths.mobile.instance, "String");
  assert.strictEqual(paths.mobile.options.trim, true);
});

test("Schema path 'mustChangePassword' defaults to false", () => {
  const p = paths.mustChangePassword;
  assert(p, "mustChangePassword path must exist");
  assert.strictEqual(p.instance, "Boolean");
  assert.strictEqual(p.options.default, false);
});

test("Schema path 'passwordChangedAt' defaults to null", () => {
  const p = paths.passwordChangedAt;
  assert(p, "passwordChangedAt path must exist");
  assert.strictEqual(p.instance, "Date");
  assert.strictEqual(p.options.default, null);
});

test("Schema path 'status' has correct enum values and defaults to 'Active'", () => {
  const p = paths.status;
  assert(p, "status path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.options.default, "Active");
  assert.deepStrictEqual(p.options.enum, ["Active", "Inactive", "Blocked"]);
});

test("Schema path 'lastLoginAt' defaults to null", () => {
  const p = paths.lastLoginAt;
  assert(p, "lastLoginAt path must exist");
  assert.strictEqual(p.instance, "Date");
  assert.strictEqual(p.options.default, null);
});

test("Schema paths 'createdAt' and 'updatedAt' exist from timestamps", () => {
  assert(paths.createdAt, "createdAt path must exist");
  assert(paths.updatedAt, "updatedAt path must exist");
});

test("Verify NO custom pre-save password hashing hook on userSchema", () => {
  // Original architecture intentionally has no pre-save hook; controllers call bcrypt.hash
  const saveHooks = User.schema.s.hooks._pres.get("save") || [];
  const hasPasswordHook = saveHooks.some(h => /password|bcrypt/i.test(h.fn.toString()));
  assert.strictEqual(hasPasswordHook, false, "There should be NO custom password hashing pre-save hook on userSchema");
});

test("Mongoose model singleton guard", () => {
  assert.strictEqual(mongoose.models.User, User);
  const reRequired = require("./models/User");
  assert.strictEqual(reRequired, User);
});

console.log(`\nAll ${passCount} schema verification tests passed successfully!`);
console.log(`TOTAL CHECKS: ${passCount}`);
