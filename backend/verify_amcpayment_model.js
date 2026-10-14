"use strict";

const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "node_modules");
require("module").Module._initPaths();

const mongoose = require("mongoose");
const assert = require("assert");

const AmcPayment = require("./models/AmcPayment");

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

console.log("Starting AmcPayment Schema & Registration Verification...\n");

// 1. Model & Collection identity
test("AmcPayment model exists and is a Mongoose model", () => {
  assert(AmcPayment, "AmcPayment should be truthy");
  assert.strictEqual(typeof AmcPayment, "function", "AmcPayment should be a function/model");
  assert.strictEqual(AmcPayment.modelName, "AmcPayment", "modelName must be 'AmcPayment'");
});

test("Collection name is explicitly 'amcpayments'", () => {
  assert.strictEqual(AmcPayment.collection.name, "amcpayments");
});

test("Schema options include timestamps: true", () => {
  assert.strictEqual(AmcPayment.schema.options.timestamps, true);
});

// 2. Schema paths
const paths = AmcPayment.schema.paths;

test("paymentCode path configuration", () => {
  const p = paths.paymentCode;
  assert(p, "paymentCode path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.isRequired, true);
  assert.strictEqual(p.options.unique, true);
  assert.strictEqual(p.options.trim, true);
  assert.strictEqual(p.options.uppercase, true);
  assert.strictEqual(p.options.index, true);
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

test("amcContractId and amcInvoiceId references", () => {
  const cId = paths.amcContractId;
  assert(cId, "amcContractId must exist");
  assert.strictEqual(cId.instance, "ObjectId");
  assert.strictEqual(cId.options.ref, "AmcContract");
  assert.strictEqual(cId.isRequired, true);
  assert.strictEqual(cId.options.index, true);

  const invId = paths.amcInvoiceId;
  assert(invId, "amcInvoiceId must exist");
  assert.strictEqual(invId.instance, "ObjectId");
  assert.strictEqual(invId.options.ref, "AmcInvoice");
  assert.strictEqual(invId.isRequired, true);
  assert.strictEqual(invId.options.index, true);
});

test("contractCode and invoiceCode path configuration", () => {
  const cc = paths.contractCode;
  assert(cc, "contractCode must exist");
  assert.strictEqual(cc.instance, "String");
  assert.strictEqual(cc.isRequired, true);
  assert.strictEqual(cc.options.trim, true);
  assert.strictEqual(cc.options.uppercase, true);

  const ic = paths.invoiceCode;
  assert(ic, "invoiceCode must exist");
  assert.strictEqual(ic.instance, "String");
  assert.strictEqual(ic.options.default, "");
  assert.strictEqual(ic.options.trim, true);
  assert.strictEqual(ic.options.uppercase, true);
});

test("client references and snapshot path configuration", () => {
  const cId = paths.clientId;
  assert(cId, "clientId must exist");
  assert.strictEqual(cId.instance, "ObjectId");
  assert.strictEqual(cId.options.ref, "Client");
  assert.strictEqual(cId.isRequired, true);
  assert.strictEqual(cId.options.index, true);

  const cCode = paths.clientCode;
  assert(cCode, "clientCode must exist");
  assert.strictEqual(cCode.instance, "String");
  assert.strictEqual(cCode.options.default, "");
  assert.strictEqual(cCode.options.trim, true);
  assert.strictEqual(cCode.options.uppercase, true);

  const cName = paths.clientName;
  assert(cName, "clientName must exist");
  assert.strictEqual(cName.instance, "String");
  assert.strictEqual(cName.isRequired, true);
  assert.strictEqual(cName.options.trim, true);
});

test("product references and snapshot path configuration", () => {
  const pId = paths.productId;
  assert(pId, "productId must exist");
  assert.strictEqual(pId.instance, "ObjectId");
  assert.strictEqual(pId.options.ref, "Product");
  assert.strictEqual(pId.options.default, null);

  const pCode = paths.productCode;
  assert(pCode, "productCode must exist");
  assert.strictEqual(pCode.instance, "String");
  assert.strictEqual(pCode.options.default, "");
  assert.strictEqual(pCode.options.trim, true);
  assert.strictEqual(pCode.options.uppercase, true);

  const pName = paths.productName;
  assert(pName, "productName must exist");
  assert.strictEqual(pName.instance, "String");
  assert.strictEqual(pName.options.default, "");
  assert.strictEqual(pName.options.trim, true);
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
  assert.strictEqual(p.options.index, true);
});

test("mode path configuration and enums", () => {
  const p = paths.mode;
  assert(p, "mode path must exist");
  assert.strictEqual(p.instance, "String");
  assert.deepStrictEqual(p.options.enum, [
    "Cash",
    "Bank Transfer",
    "UPI",
    "Cheque",
    "Card",
    "Other",
  ]);
  assert.strictEqual(p.options.default, "Bank Transfer");
});

test("referenceNo and notes path configuration", () => {
  assert.strictEqual(paths.referenceNo.instance, "String");
  assert.strictEqual(paths.referenceNo.options.default, "");
  assert.strictEqual(paths.referenceNo.options.trim, true);

  assert.strictEqual(paths.notes.instance, "String");
  assert.strictEqual(paths.notes.options.default, "");
  assert.strictEqual(paths.notes.options.trim, true);
});

test("receivedBy metadata path configuration", () => {
  const rb = paths.receivedBy;
  assert(rb, "receivedBy must exist");
  assert.strictEqual(rb.instance, "ObjectId");
  assert.strictEqual(rb.options.ref, "User");
  assert.strictEqual(rb.options.default, null);

  assert.strictEqual(paths.receivedByName.instance, "String");
  assert.strictEqual(paths.receivedByName.options.default, "");
  assert.strictEqual(paths.receivedByName.options.trim, true);
});

test("isDeleted path configuration", () => {
  const p = paths.isDeleted;
  assert(p, "isDeleted must exist");
  assert.strictEqual(p.instance, "Boolean");
  assert.strictEqual(p.options.default, false);
  assert.strictEqual(p.options.index, true);
});

// 3. Indexes
test("compound index { amcContractId: 1, paymentDate: -1 } exists", () => {
  const indexes = AmcPayment.schema.indexes();
  const compound = indexes.find(
    (idx) => idx[0] && idx[0].amcContractId === 1 && idx[0].paymentDate === -1
  );
  assert(compound, "Compound index on amcContractId, paymentDate must exist");
});

test("idempotent model registration guard and caching", () => {
  const requiredAgain = require("./models/AmcPayment");
  assert.strictEqual(requiredAgain, AmcPayment, "Subsequent require returns identical instance");
  assert.strictEqual(mongoose.models.AmcPayment, AmcPayment, "mongoose.models.AmcPayment matches");
});

console.log(`\nAll ${passCount} schema verification tests passed successfully!`);

