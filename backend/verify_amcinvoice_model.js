"use strict";

const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "node_modules");
require("module").Module._initPaths();

const fs = require("fs");
const mongoose = require("mongoose");
const assert = require("assert");

const AmcInvoice = require("./models/AmcInvoice");

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

console.log("Starting AmcInvoice Schema & Registration Verification...\n");

// 1. Model & Collection identity
test("AmcInvoice model exists and is a Mongoose model", () => {
  assert(AmcInvoice, "AmcInvoice should be truthy");
  assert.strictEqual(typeof AmcInvoice, "function", "AmcInvoice should be a function/model");
  assert.strictEqual(AmcInvoice.modelName, "AmcInvoice", "modelName must be 'AmcInvoice'");
});

test("Collection name is explicitly 'amcinvoices'", () => {
  assert.strictEqual(AmcInvoice.collection.name, "amcinvoices");
});

test("Schema options include timestamps: true", () => {
  assert.strictEqual(AmcInvoice.schema.options.timestamps, true);
});

// 2. Schema paths
const paths = AmcInvoice.schema.paths;

test("invoiceCode path configuration", () => {
  const p = paths.invoiceCode;
  assert(p, "invoiceCode path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.isRequired, true);
  assert.strictEqual(p.options.unique, true);
  assert.strictEqual(p.options.trim, true);
  assert.strictEqual(p.options.uppercase, true);
  assert.strictEqual(p.options.index, true);
});

test("invoiceNumber path configuration", () => {
  const p = paths.invoiceNumber;
  assert(p, "invoiceNumber path must exist");
  assert.strictEqual(p.instance, "Number");
  assert.strictEqual(p.options.default, 0);
  assert.strictEqual(p.options.min, 0);
});

test("invoiceDate and invoiceType path configuration", () => {
  const d = paths.invoiceDate;
  assert(d, "invoiceDate path must exist");
  assert.strictEqual(d.instance, "Date");
  assert.strictEqual(d.isRequired, true);
  assert.strictEqual(d.options.index, true);

  const t = paths.invoiceType;
  assert(t, "invoiceType path must exist");
  assert.strictEqual(t.instance, "String");
  assert.deepStrictEqual(t.options.enum, ["Initial", "Renewal", "Adjustment"]);
  assert.strictEqual(t.options.default, "Initial");
  assert.strictEqual(t.options.index, true);
});

test("contract references and dates configuration", () => {
  const cId = paths.amcContractId;
  assert(cId, "amcContractId must exist");
  assert.strictEqual(cId.instance, "ObjectId");
  assert.strictEqual(cId.options.ref, "AmcContract");
  assert.strictEqual(cId.isRequired, true);
  assert.strictEqual(cId.options.index, true);

  const cCode = paths.contractCode;
  assert(cCode, "contractCode must exist");
  assert.strictEqual(cCode.instance, "String");
  assert.strictEqual(cCode.isRequired, true);
  assert.strictEqual(cCode.options.trim, true);
  assert.strictEqual(cCode.options.uppercase, true);
  assert.strictEqual(cCode.options.index, true);

  assert.strictEqual(paths.contractStartDate.instance, "Date");
  assert.strictEqual(paths.contractStartDate.isRequired, true);
  assert.strictEqual(paths.contractExpiryDate.instance, "Date");
  assert.strictEqual(paths.contractExpiryDate.isRequired, true);
  assert.strictEqual(paths.dueDate.instance, "Date");
  assert.strictEqual(paths.dueDate.isRequired, true);
  assert.strictEqual(paths.dueDate.options.index, true);
});

test("client details and snapshots configuration", () => {
  assert.strictEqual(paths.clientId.instance, "ObjectId");
  assert.strictEqual(paths.clientId.options.ref, "Client");
  assert.strictEqual(paths.clientId.options.default, null);
  assert.strictEqual(paths.clientId.options.index, true);

  assert.strictEqual(paths.clientCode.instance, "String");
  assert.strictEqual(paths.clientCode.isRequired, true);
  assert.strictEqual(paths.clientCode.options.uppercase, true);
  assert.strictEqual(paths.clientCode.options.index, true);

  assert.strictEqual(paths.clientName.instance, "String");
  assert.strictEqual(paths.clientName.isRequired, true);
  assert.strictEqual(paths.clientName.options.index, true);

  assert.strictEqual(paths.contactPerson.instance, "String");
  assert.strictEqual(paths.contactPerson.options.default, "");
  assert.strictEqual(paths.contactMobile.instance, "String");
  assert.strictEqual(paths.contactMobile.options.default, "");
  assert.strictEqual(paths.contactEmail.instance, "String");
  assert.strictEqual(paths.contactEmail.options.default, "");
  assert.strictEqual(paths.contactEmail.options.lowercase, true);
});

test("product details configuration", () => {
  assert.strictEqual(paths.clientProductId.instance, "ObjectId");
  assert.strictEqual(paths.clientProductId.options.default, null);
  assert.strictEqual(paths.clientProductId.options.index, true);

  assert.strictEqual(paths.productId.instance, "ObjectId");
  assert.strictEqual(paths.productId.options.ref, "Product");
  assert.strictEqual(paths.productId.options.default, null);
  assert.strictEqual(paths.productId.options.index, true);

  assert.strictEqual(paths.productCode.instance, "String");
  assert.strictEqual(paths.productCode.isRequired, true);
  assert.strictEqual(paths.productCode.options.uppercase, true);
  assert.strictEqual(paths.productCode.options.index, true);

  assert.strictEqual(paths.productName.instance, "String");
  assert.strictEqual(paths.productName.isRequired, true);
  assert.strictEqual(paths.productName.options.index, true);

  assert.strictEqual(paths.productVersion.instance, "String");
  assert.strictEqual(paths.productVersion.options.default, "");

  assert.strictEqual(paths.plan.instance, "String");
  assert.deepStrictEqual(paths.plan.options.enum, ["Basic", "Standard", "Premium", "Custom"]);
  assert.strictEqual(paths.plan.options.default, "Standard");

  assert.strictEqual(paths.licensedUsers.instance, "Number");
  assert.strictEqual(paths.licensedUsers.options.default, 1);
  assert.strictEqual(paths.licensedUsers.options.min, 1);
});

test("financial amounts and GST configuration", () => {
  assert.strictEqual(paths.taxableAmount.instance, "Number");
  assert.strictEqual(paths.taxableAmount.isRequired, true);
  assert.strictEqual(paths.taxableAmount.options.min, 0);

  assert.strictEqual(paths.cgstRate.instance, "Number");
  assert.strictEqual(paths.cgstRate.options.default, 0);
  assert.strictEqual(paths.cgstAmount.instance, "Number");
  assert.strictEqual(paths.cgstAmount.options.default, 0);

  assert.strictEqual(paths.sgstRate.instance, "Number");
  assert.strictEqual(paths.sgstRate.options.default, 0);
  assert.strictEqual(paths.sgstAmount.instance, "Number");
  assert.strictEqual(paths.sgstAmount.options.default, 0);

  assert.strictEqual(paths.igstRate.instance, "Number");
  assert.strictEqual(paths.igstRate.options.default, 0);
  assert.strictEqual(paths.igstAmount.instance, "Number");
  assert.strictEqual(paths.igstAmount.options.default, 0);

  assert.strictEqual(paths.totalTaxAmount.instance, "Number");
  assert.strictEqual(paths.totalTaxAmount.options.default, 0);

  assert.strictEqual(paths.totalAmount.instance, "Number");
  assert.strictEqual(paths.totalAmount.isRequired, true);
  assert.strictEqual(paths.totalAmount.options.min, 0);

  assert.strictEqual(paths.paidAmount.instance, "Number");
  assert.strictEqual(paths.paidAmount.options.default, 0);

  assert.strictEqual(paths.pendingAmount.instance, "Number");
  assert.strictEqual(paths.pendingAmount.options.default, 0);

  assert.strictEqual(paths.taxClassification.instance, "String");
  assert.strictEqual(paths.taxClassification.options.default, "Standard Rate (18%)");
});

test("paymentStatus and lifecycle status configuration", () => {
  const ps = paths.paymentStatus;
  assert.strictEqual(ps.instance, "String");
  assert.deepStrictEqual(ps.options.enum, ["Pending", "Partially Paid", "Paid", "Overdue", "Cancelled"]);
  assert.strictEqual(ps.options.default, "Pending");
  assert.strictEqual(ps.options.index, true);

  const s = paths.status;
  assert.strictEqual(s.instance, "String");
  assert.deepStrictEqual(s.options.enum, ["Draft", "Issued", "Cancelled"]);
  assert.strictEqual(s.options.default, "Issued");
  assert.strictEqual(s.options.index, true);
});

test("idempotencyKey and paymentVersion concurrency paths", () => {
  const ikey = paths.idempotencyKey;
  assert(ikey, "idempotencyKey must exist");
  assert.strictEqual(ikey.instance, "String");
  assert.strictEqual(ikey.options.default, null);
  assert.strictEqual(ikey.options.index, true);
  assert.strictEqual(ikey.options.sparse, true);

  const pv = paths.paymentVersion;
  assert(pv, "paymentVersion must exist");
  assert.strictEqual(pv.instance, "Number");
  assert.strictEqual(pv.options.default, 0);
});

test("audit metadata and soft deletion configuration", () => {
  assert.strictEqual(paths.createdBy.options.ref, "User");
  assert.strictEqual(paths.updatedBy.options.ref, "User");
  assert.strictEqual(paths.deletedBy.options.ref, "User");

  assert.strictEqual(paths.isDeleted.instance, "Boolean");
  assert.strictEqual(paths.isDeleted.options.default, false);
  assert.strictEqual(paths.isDeleted.options.index, true);
  assert.strictEqual(paths.deletedAt.instance, "Date");
});

// 3. Indexes & Index Parity Safeguard
test("verbatim duplicate $in property preserved in AmcInvoice.js source", () => {
  const modelFileContent = fs.readFileSync(path.resolve(__dirname, "models/AmcInvoice.js"), "utf8");
  assert(modelFileContent.includes('$in: ["Issued", "Partially Paid", "Paid", "Overdue"]'), "First $in array must be present in source");
  assert(modelFileContent.includes('$in: ["Issued", "Draft"]'), "Second $in array must be present in source");
});

test("evaluated runtime partial index uniq_amc_contract_active_start", () => {
  const indexes = AmcInvoice.schema.indexes();
  const partialIdx = indexes.find(idx => idx[1] && idx[1].name === "uniq_amc_contract_active_start");
  assert(partialIdx, "uniq_amc_contract_active_start index must exist");
  assert.strictEqual(partialIdx[1].unique, true);
  assert.deepStrictEqual(partialIdx[0], { amcContractId: 1, contractStartDate: 1, isDeleted: 1 });
  assert(partialIdx[1].partialFilterExpression, "Must have partialFilterExpression");
  assert.strictEqual(partialIdx[1].partialFilterExpression.isDeleted, false);
  // Evaluated JS object runtime uses the last key
  assert.deepStrictEqual(partialIdx[1].partialFilterExpression.status, { $in: ["Issued", "Draft"] });
});

test("compound indexes on amcContractId, clientId, productId with invoiceDate: -1 exist", () => {
  const indexes = AmcInvoice.schema.indexes();
  assert(indexes.some(idx => idx[0] && idx[0].amcContractId === 1 && idx[0].invoiceDate === -1), "amcContractId_1_invoiceDate_-1 must exist");
  assert(indexes.some(idx => idx[0] && idx[0].clientId === 1 && idx[0].invoiceDate === -1), "clientId_1_invoiceDate_-1 must exist");
  assert(indexes.some(idx => idx[0] && idx[0].productId === 1 && idx[0].invoiceDate === -1), "productId_1_invoiceDate_-1 must exist");
});

test("text index exists on AmcInvoice with 6 specified fields", () => {
  const indexes = AmcInvoice.schema.indexes();
  const textIdx = indexes.find(idx => idx[0] && idx[0].invoiceCode === "text");
  assert(textIdx, "Text index must exist");
  const keys = textIdx[0];
  assert.strictEqual(keys.invoiceCode, "text");
  assert.strictEqual(keys.contractCode, "text");
  assert.strictEqual(keys.clientCode, "text");
  assert.strictEqual(keys.clientName, "text");
  assert.strictEqual(keys.productCode, "text");
  assert.strictEqual(keys.productName, "text");
});

test("idempotent model registration guard and caching", () => {
  const requiredAgain = require("./models/AmcInvoice");
  assert.strictEqual(requiredAgain, AmcInvoice, "Subsequent require returns identical instance");
  assert.strictEqual(mongoose.models.AmcInvoice, AmcInvoice, "mongoose.models.AmcInvoice matches");
});

console.log(`\nAll ${passCount} schema verification tests passed successfully!`);

