"use strict";

const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "node_modules");
require("module").Module._initPaths();

const mongoose = require("mongoose");
const assert = require("assert");

const IdempotencyLog = require("./models/IdempotencyLog");

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

console.log("Starting IdempotencyLog Schema & Registration Verification...\n");

// 1. Model & Collection identity
test("IdempotencyLog model exists and is a Mongoose model", () => {
  assert(IdempotencyLog, "IdempotencyLog should be truthy");
  assert.strictEqual(typeof IdempotencyLog, "function", "IdempotencyLog should be a function/model");
  assert.strictEqual(IdempotencyLog.modelName, "IdempotencyLog", "modelName must be 'IdempotencyLog'");
});

test("Collection name is explicitly 'idempotencylogs'", () => {
  assert.strictEqual(IdempotencyLog.collection.name, "idempotencylogs");
});

test("Schema options include timestamps: true", () => {
  assert.strictEqual(IdempotencyLog.schema.options.timestamps, true);
});

// 2. Schema paths
const paths = IdempotencyLog.schema.paths;

test("idempotencyKey path configuration", () => {
  const p = paths.idempotencyKey;
  assert(p, "idempotencyKey path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.isRequired, true);
  assert.strictEqual(p.options.unique, true);
  assert.strictEqual(p.options.trim, true);
  assert.strictEqual(p.options.index, true);
});

test("endpoint path configuration", () => {
  const p = paths.endpoint;
  assert(p, "endpoint path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.isRequired, true);
  assert.strictEqual(p.options.trim, true);
});

test("contractId path configuration", () => {
  const p = paths.contractId;
  assert(p, "contractId path must exist");
  assert.strictEqual(p.instance, "ObjectId");
  assert.strictEqual(p.isRequired, false);
  assert.strictEqual(p.options.index, true);
});

test("entityId path configuration", () => {
  const p = paths.entityId;
  assert(p, "entityId path must exist");
  assert.strictEqual(p.instance, "ObjectId");
  assert.strictEqual(p.isRequired, false);
  assert.strictEqual(p.options.index, true);
});

test("payloadHash path configuration", () => {
  const p = paths.payloadHash;
  assert(p, "payloadHash path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.isRequired, true);
  assert.strictEqual(p.options.trim, true);
});

test("status path configuration and enums", () => {
  const p = paths.status;
  assert(p, "status path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.options.default, "IN_PROGRESS");
  assert.deepStrictEqual(p.options.enum, ["IN_PROGRESS", "COMPLETED", "FAILED"]);
  assert.strictEqual(p.options.index, true);
});

test("responseStatus path configuration", () => {
  const p = paths.responseStatus;
  assert(p, "responseStatus path must exist");
  assert.strictEqual(p.instance, "Number");
  assert.strictEqual(p.options.default, 200);
});

test("responseBody path configuration", () => {
  const p = paths.responseBody;
  assert(p, "responseBody path must exist");
  assert.strictEqual(p.instance, "Mixed");
  assert.strictEqual(p.options.default, null);
});

test("createdAt path configuration and TTL expiry", () => {
  const p = paths.createdAt;
  assert(p, "createdAt path must exist");
  assert.strictEqual(p.instance, "Date");
  assert(typeof p.options.default === "function" || p.options.default === Date.now, "default should be Date.now");
  assert.strictEqual(p.options.expires, "7d");
});

test("updatedAt path configuration (timestamps)", () => {
  const p = paths.updatedAt;
  assert(p, "updatedAt path must exist from timestamps");
  assert.strictEqual(p.instance, "Date");
});

// 3. Index declarations
test("Index definitions match schema specification", () => {
  const indexes = IdempotencyLog.schema.indexes();
  // Check that index declarations include idempotencyKey (unique), contractId, entityId, status, createdAt (TTL)
  const pathsIndexed = Object.keys(IdempotencyLog.schema.paths).filter(
    k => IdempotencyLog.schema.paths[k].options.index || IdempotencyLog.schema.paths[k].options.unique
  );
  assert(pathsIndexed.includes("idempotencyKey"), "idempotencyKey must be indexed");
  assert(pathsIndexed.includes("contractId"), "contractId must be indexed");
  assert(pathsIndexed.includes("entityId"), "entityId must be indexed");
  assert(pathsIndexed.includes("status"), "status must be indexed");
});

// 4. Registration and singleton guard
test("Mongoose model singleton guard", () => {
  assert.strictEqual(mongoose.models.IdempotencyLog, IdempotencyLog);
  const reRequired = require("./models/IdempotencyLog");
  assert.strictEqual(reRequired, IdempotencyLog);
});

console.log(`\nAll ${passCount} schema verification tests passed successfully!`);
console.log(`TOTAL CHECKS: ${passCount}`);
