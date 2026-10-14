"use strict";

const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "node_modules");
require("module").Module._initPaths();

const mongoose = require("mongoose");
const assert = require("assert");

const ProductSalePayment = require("./models/ProductSalePayment");

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

console.log("Starting ProductSalePayment Schema & Registration Verification...\n");

// 1. Model & Collection identity
test("ProductSalePayment model exists and is a Mongoose model", () => {
  assert(ProductSalePayment, "ProductSalePayment should be truthy");
  assert.strictEqual(typeof ProductSalePayment, "function", "ProductSalePayment should be a function/model");
  assert.strictEqual(ProductSalePayment.modelName, "ProductSalePayment", "modelName must be 'ProductSalePayment'");
});

test("Collection name is explicitly 'productsalepayments'", () => {
  assert.strictEqual(ProductSalePayment.collection.name, "productsalepayments");
});

test("Schema options include timestamps: true", () => {
  assert.strictEqual(ProductSalePayment.schema.options.timestamps, true);
});

// 2. Schema paths
const paths = ProductSalePayment.schema.paths;

test("paymentCode path configuration", () => {
  const p = paths.paymentCode;
  assert(p, "paymentCode path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.isRequired, true);
  assert.strictEqual(p.options.unique, true);
  assert.strictEqual(p.options.uppercase, true);
  assert.strictEqual(p.options.trim, true);
  assert.strictEqual(p.options.index, true);
});

test("paymentNumber path configuration", () => {
  const p = paths.paymentNumber;
  assert(p, "paymentNumber path must exist");
  assert.strictEqual(p.instance, "Number");
  assert.strictEqual(p.isRequired, true);
  assert.strictEqual(p.options.min, 1);
});

test("idempotencyKey path configuration", () => {
  const p = paths.idempotencyKey;
  assert(p, "idempotencyKey path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.options.default, null);
  assert.strictEqual(p.options.trim, true);
  assert.strictEqual(p.options.index, true);
  assert.strictEqual(p.options.sparse, true);
});

test("productSaleId path configuration (ref: ProductSale)", () => {
  const p = paths.productSaleId;
  assert(p, "productSaleId path must exist");
  assert.strictEqual(p.instance, "ObjectId");
  assert.strictEqual(p.options.ref, "ProductSale");
  assert.strictEqual(p.isRequired, true);
  assert.strictEqual(p.options.index, true);
});

test("saleCode path configuration", () => {
  const p = paths.saleCode;
  assert(p, "saleCode path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.isRequired, true);
  assert.strictEqual(p.options.uppercase, true);
  assert.strictEqual(p.options.trim, true);
  assert.strictEqual(p.options.index, true);
});

test("clientId path configuration (ref: Client)", () => {
  const p = paths.clientId;
  assert(p, "clientId path must exist");
  assert.strictEqual(p.instance, "ObjectId");
  assert.strictEqual(p.options.ref, "Client");
  assert.strictEqual(p.isRequired, true);
  assert.strictEqual(p.options.index, true);
});

test("clientCode path configuration", () => {
  const p = paths.clientCode;
  assert(p, "clientCode path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.isRequired, true);
  assert.strictEqual(p.options.uppercase, true);
  assert.strictEqual(p.options.trim, true);
});

test("clientName path configuration", () => {
  const p = paths.clientName;
  assert(p, "clientName path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.isRequired, true);
  assert.strictEqual(p.options.trim, true);
});

test("amount path configuration", () => {
  const p = paths.amount;
  assert(p, "amount path must exist");
  assert.strictEqual(p.instance, "Number");
  assert.strictEqual(p.isRequired, true);
  assert.strictEqual(p.options.min, 0.01);
});

test("paymentDate path configuration", () => {
  const p = paths.paymentDate;
  assert(p, "paymentDate path must exist");
  assert.strictEqual(p.instance, "Date");
  assert.strictEqual(p.isRequired, true);
  assert(p.options.default, "default must exist (Date.now)");
  assert.strictEqual(p.options.index, true);
});

test("mode path configuration and enum values", () => {
  const p = paths.mode;
  assert(p, "mode path must exist");
  assert.strictEqual(p.instance, "String");
  assert.deepStrictEqual(p.enumValues, [
    "Cash",
    "Bank Transfer",
    "UPI",
    "Cheque",
    "Card",
    "Other",
  ]);
  assert.strictEqual(p.options.default, "Bank Transfer");
});

test("referenceNo path configuration", () => {
  const p = paths.referenceNo;
  assert(p, "referenceNo path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.options.default, "");
  assert.strictEqual(p.options.trim, true);
});

test("notes path configuration", () => {
  const p = paths.notes;
  assert(p, "notes path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.options.default, "");
  assert.strictEqual(p.options.trim, true);
});

test("createdBy path configuration (ref: User)", () => {
  const p = paths.createdBy;
  assert(p, "createdBy path must exist");
  assert.strictEqual(p.instance, "ObjectId");
  assert.strictEqual(p.options.ref, "User");
  assert.strictEqual(p.options.default, null);
});

test("createdByName path configuration", () => {
  const p = paths.createdByName;
  assert(p, "createdByName path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.options.default, "");
  assert.strictEqual(p.options.trim, true);
});

test("isDeleted path configuration", () => {
  const p = paths.isDeleted;
  assert(p, "isDeleted path must exist");
  assert.strictEqual(p.instance, "Boolean");
  assert.strictEqual(p.options.default, false);
  assert.strictEqual(p.options.index, true);
});

test("deletedAt path configuration", () => {
  const p = paths.deletedAt;
  assert(p, "deletedAt path must exist");
  assert.strictEqual(p.instance, "Date");
  assert.strictEqual(p.options.default, null);
});

// 3. Compound Indexes
test("Compound index on { productSaleId: 1, paymentDate: -1 } exists", () => {
  const indexes = ProductSalePayment.schema.indexes();
  const found = indexes.some(([fields]) => {
    return fields.productSaleId === 1 && fields.paymentDate === -1;
  });
  assert(found, "Index { productSaleId: 1, paymentDate: -1 } must be declared");
});

// 4. Registration idempotency & export identity
test("Re-requiring ProductSalePayment returns exact same instance", () => {
  const RequiredAgain = require("./models/ProductSalePayment");
  assert.strictEqual(RequiredAgain, ProductSalePayment);
  assert.strictEqual(mongoose.models.ProductSalePayment, ProductSalePayment);
});

console.log(`\nTOTAL CHECKS: ${passCount}`);
console.log(`PASSED: ${passCount}`);
console.log("ProductSalePayment Schema Verification Completed Successfully.");
