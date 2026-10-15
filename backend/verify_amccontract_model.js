"use strict";

const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "node_modules");
require("module").Module._initPaths();

const mongoose = require("mongoose");
const assert = require("assert");

const AmcContract = require("./models/AmcContract");

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

console.log("Starting AmcContract Schema & Registration Verification...\n");

// 1. Model & Collection identity
test("AmcContract model exists and is a Mongoose model", () => {
  assert(AmcContract, "AmcContract should be truthy");
  assert.strictEqual(typeof AmcContract, "function", "AmcContract should be a function/model");
  assert.strictEqual(AmcContract.modelName, "AmcContract", "modelName must be 'AmcContract'");
});

test("Collection name is explicitly 'amccontracts'", () => {
  assert.strictEqual(AmcContract.collection.name, "amccontracts");
});

test("Schema options include timestamps: true", () => {
  assert.strictEqual(AmcContract.schema.options.timestamps, true);
});

// 2. Schema paths
const paths = AmcContract.schema.paths;

test("contractCode path configuration", () => {
  const p = paths.contractCode;
  assert(p, "contractCode path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.isRequired, true);
  assert.strictEqual(p.options.unique, true);
  assert.strictEqual(p.options.trim, true);
  assert.strictEqual(p.options.uppercase, true);
});

test("invoiceCode path configuration", () => {
  const p = paths.invoiceCode;
  assert(p, "invoiceCode path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.options.default, "");
  assert.strictEqual(p.options.trim, true);
  assert.strictEqual(p.options.uppercase, true);
  assert.strictEqual(p.options.index, true);
});

test("currentInvoiceId and currentInvoiceCode paths", () => {
  const cid = paths.currentInvoiceId;
  assert(cid, "currentInvoiceId path must exist");
  assert.strictEqual(cid.instance, "ObjectId");
  assert.strictEqual(cid.options.ref, "AmcInvoice");
  assert.strictEqual(cid.options.index, true);

  const cic = paths.currentInvoiceCode;
  assert(cic, "currentInvoiceCode path must exist");
  assert.strictEqual(cic.instance, "String");
  assert.strictEqual(cic.options.default, "");
  assert.strictEqual(cic.options.index, true);
});

test("invoiceDate path configuration", () => {
  const p = paths.invoiceDate;
  assert(p, "invoiceDate path must exist");
  assert.strictEqual(p.instance, "Date");
  assert.strictEqual(p.options.default, null);
});

test("clientId path configuration (ref: Client)", () => {
  const p = paths.clientId;
  assert(p, "clientId path must exist");
  assert.strictEqual(p.instance, "ObjectId");
  assert.strictEqual(p.options.ref, "Client");
  assert.strictEqual(p.isRequired, true);
  assert.strictEqual(p.options.index, true);
});

test("clientCode and clientName path configuration", () => {
  const cc = paths.clientCode;
  assert(cc, "clientCode path must exist");
  assert.strictEqual(cc.instance, "String");
  assert.strictEqual(cc.isRequired, true);
  assert.strictEqual(cc.options.trim, true);
  assert.strictEqual(cc.options.uppercase, true);

  const cn = paths.clientName;
  assert(cn, "clientName path must exist");
  assert.strictEqual(cn.instance, "String");
  assert.strictEqual(cn.isRequired, true);
  assert.strictEqual(cn.options.trim, true);
  assert.strictEqual(cn.options.index, true);
});

test("client contact info paths (contactPerson, contactNumber, contactEmail)", () => {
  assert.strictEqual(paths.contactPerson.instance, "String");
  assert.strictEqual(paths.contactMobile.instance, "String");
  assert.strictEqual(paths.contactEmail.instance, "String");
});

test("clientProductId and productId path configurations", () => {
  const cpid = paths.clientProductId;
  assert(cpid, "clientProductId must exist");
  assert.strictEqual(cpid.instance, "ObjectId");
  assert.strictEqual(cpid.isRequired, true);
  assert.strictEqual(cpid.options.index, true);

  const pid = paths.productId;
  assert(pid, "productId must exist");
  assert.strictEqual(pid.instance, "ObjectId");
  assert.strictEqual(pid.options.ref, "Product");
  assert.strictEqual(pid.isRequired, true);
  assert.strictEqual(pid.options.index, true);
});

test("productCode and productName path configurations", () => {
  const pc = paths.productCode;
  assert(pc, "productCode must exist");
  assert.strictEqual(pc.instance, "String");
  assert.strictEqual(pc.isRequired, true);

  const pn = paths.productName;
  assert(pn, "productName must exist");
  assert.strictEqual(pn.instance, "String");
  assert.strictEqual(pn.isRequired, true);
  assert.strictEqual(pn.options.index, true);
});

test("plan enum and default configuration", () => {
  const p = paths.plan;
  assert(p, "plan must exist");
  assert.strictEqual(p.instance, "String");
  assert.deepStrictEqual(p.options.enum, ["Basic", "Standard", "Premium", "Custom"]);
  assert.strictEqual(p.options.default, "Standard");
  assert.strictEqual(p.options.index, true);
});

test("licensedUsers path configuration", () => {
  const p = paths.licensedUsers;
  assert(p, "licensedUsers must exist");
  assert.strictEqual(p.instance, "Number");
  assert.strictEqual(p.options.default, 1);
  assert.strictEqual(p.options.min, 1);
});

test("date range paths (startDate, expiryDate, dueDate)", () => {
  assert(paths.startDate.isRequired, "startDate is required");
  assert.strictEqual(paths.startDate.instance, "Date");
  assert.strictEqual(paths.startDate.options.index, true);

  assert(paths.expiryDate.isRequired, "expiryDate is required");
  assert.strictEqual(paths.expiryDate.instance, "Date");
  assert.strictEqual(paths.expiryDate.options.index, true);

  assert(paths.dueDate.isRequired, "dueDate is required");
  assert.strictEqual(paths.dueDate.instance, "Date");
  assert.strictEqual(paths.dueDate.options.index, true);
});

test("tax and financial amount paths configuration", () => {
  assert(paths.taxableAmount.isRequired, "taxableAmount is required");
  assert.strictEqual(paths.taxableAmount.instance, "Number");
  assert.strictEqual(paths.taxableAmount.options.min, 0);

  assert.strictEqual(paths.cgstRate.instance, "Number");
  assert.strictEqual(paths.cgstRate.options.default, 9);
  assert.strictEqual(paths.cgstAmount.instance, "Number");
  assert.strictEqual(paths.cgstAmount.options.default, 0);

  assert.strictEqual(paths.sgstRate.instance, "Number");
  assert.strictEqual(paths.sgstRate.options.default, 9);
  assert.strictEqual(paths.sgstAmount.instance, "Number");
  assert.strictEqual(paths.sgstAmount.options.default, 0);

  assert.strictEqual(paths.igstRate.instance, "Number");
  assert.strictEqual(paths.igstRate.options.default, 0);
  assert.strictEqual(paths.igstAmount.instance, "Number");
  assert.strictEqual(paths.igstAmount.options.default, 0);

  assert.strictEqual(paths.totalTaxAmount.instance, "Number");
  assert.strictEqual(paths.totalTaxAmount.options.default, 0);

  assert.strictEqual(paths.totalAmount.instance, "Number");
  assert.strictEqual(paths.totalAmount.options.default, 0);

  assert.strictEqual(paths.paidAmount.instance, "Number");
  assert.strictEqual(paths.paidAmount.options.default, 0);

  assert.strictEqual(paths.pendingAmount.instance, "Number");
  assert.strictEqual(paths.pendingAmount.options.default, 0);
});

test("status enum and default configuration", () => {
  const p = paths.status;
  assert(p, "status path must exist");
  assert.strictEqual(p.instance, "String");
  assert.deepStrictEqual(p.options.enum, [
    "Upcoming",
    "Pending",
    "Partially Paid",
    "Paid",
    "Overdue",
    "Cancelled",
  ]);
  assert.strictEqual(p.options.default, "Pending");
  assert.strictEqual(p.options.index, true);
});

test("assignedEmployee path configurations (ref: Employee)", () => {
  const id = paths.assignedEmployeeId;
  assert(id, "assignedEmployeeId must exist");
  assert.strictEqual(id.instance, "ObjectId");
  assert.strictEqual(id.options.ref, "Employee");
  assert.strictEqual(id.options.default, null);
  assert.strictEqual(id.options.index, true);

  assert.strictEqual(paths.assignedEmployeeCode.instance, "String");
  assert.strictEqual(paths.assignedEmployeeName.instance, "String");
});

test("reminderStatus enum and default configuration", () => {
  const p = paths.reminderStatus;
  assert(p, "reminderStatus path must exist");
  assert.strictEqual(p.instance, "String");
  assert.deepStrictEqual(p.options.enum, [
    "Not Sent",
    "Sent",
    "Call Logged",
    "Not Required",
  ]);
  assert.strictEqual(p.options.default, "Not Sent");
});

test("timeline subdocument schema configuration", () => {
  const p = paths.timeline;
  assert(p, "timeline path must exist");
  assert.strictEqual(p.instance, "Array");
  const sub = p.schema;
  assert(sub, "timeline must have subschema");
  assert.strictEqual(sub.paths.title.isRequired, true);
  assert.strictEqual(sub.paths.type.instance, "String");
  assert.strictEqual(sub.paths.performedBy.options.ref, "User");
  assert.strictEqual(sub.paths.performedByRole.options.default, "system");
});

test("documents subdocument schema configuration", () => {
  const p = paths.documents;
  assert(p, "documents path must exist");
  assert.strictEqual(p.instance, "Array");
  const sub = p.schema;
  assert(sub, "documents must have subschema");
  assert.strictEqual(sub.paths.fileName.isRequired, true);
  assert.strictEqual(sub.paths.storedFileName.isRequired, true);
  assert.strictEqual(sub.paths.relativePath.isRequired, true);
  assert.strictEqual(sub.paths.documentType.options.default, "Other Document");
});

test("renewalHistory subdocument schema configuration", () => {
  const p = paths.renewalHistory;
  assert(p, "renewalHistory path must exist");
  assert.strictEqual(p.instance, "Array");
  const sub = p.schema;
  assert(sub, "renewalHistory must have subschema");
  assert.strictEqual(sub.paths.cycleNumber.instance, "Number");
  assert.strictEqual(sub.paths.previousInvoiceId.options.ref, "AmcInvoice");
  assert.strictEqual(sub.paths.totalAmount.instance, "Number");
});

test("upcomingRenewal embedded object schema configuration", () => {
  assert(paths["upcomingRenewal.invoiceId"], "upcomingRenewal.invoiceId must exist");
  assert.strictEqual(paths["upcomingRenewal.invoiceId"].instance, "ObjectId");
  assert.strictEqual(paths["upcomingRenewal.invoiceId"].options.ref, "AmcInvoice");

  assert(paths["upcomingRenewal.invoiceCode"], "upcomingRenewal.invoiceCode must exist");
  assert.strictEqual(paths["upcomingRenewal.invoiceCode"].instance, "String");

  assert(paths["upcomingRenewal.totalAmount"], "upcomingRenewal.totalAmount must exist");
  assert.strictEqual(paths["upcomingRenewal.totalAmount"].instance, "Number");

  assert(paths["upcomingRenewal.gstApplicable"], "upcomingRenewal.gstApplicable must exist");
  assert.deepStrictEqual(paths["upcomingRenewal.gstApplicable"].options.enum, ["YES", "NO"]);

  assert(paths["upcomingRenewal.taxType"], "upcomingRenewal.taxType must exist");
  assert.deepStrictEqual(paths["upcomingRenewal.taxType"].options.enum, ["intra", "inter"]);
});

test("renewalLockAt and renewalVersion concurrency fields", () => {
  assert(paths.renewalLockAt, "renewalLockAt must exist");
  assert.strictEqual(paths.renewalLockAt.instance, "Date");
  assert.strictEqual(paths.renewalLockAt.options.default, null);

  assert(paths.renewalVersion, "renewalVersion must exist");
  assert.strictEqual(paths.renewalVersion.instance, "Number");
  assert.strictEqual(paths.renewalVersion.options.default, 0);
});

test("audit and soft-deletion paths configuration", () => {
  assert.strictEqual(paths.createdBy.options.ref, "User");
  assert.strictEqual(paths.updatedBy.options.ref, "User");
  assert.strictEqual(paths.deletedBy.options.ref, "User");

  assert.strictEqual(paths.isDeleted.instance, "Boolean");
  assert.strictEqual(paths.isDeleted.options.default, false);
  assert.strictEqual(paths.isDeleted.options.index, true);
});

// 3. Indexes
test("text index exists on AmcContract with 8 specified fields", () => {
  const indexes = AmcContract.schema.indexes();
  const textIndex = indexes.find(idx => idx[0] && idx[0].contractCode === "text");
  assert(textIndex, "Text index must exist");
  const keys = textIndex[0];
  assert.strictEqual(keys.contractCode, "text");
  assert.strictEqual(keys.invoiceCode, "text");
  assert.strictEqual(keys.clientCode, "text");
  assert.strictEqual(keys.clientName, "text");
  assert.strictEqual(keys.productCode, "text");
  assert.strictEqual(keys.productName, "text");
  assert.strictEqual(keys.assignedEmployeeCode, "text");
  assert.strictEqual(keys.assignedEmployeeName, "text");
});

test("compound index { clientId: 1, productId: 1, expiryDate: 1 } exists", () => {
  const indexes = AmcContract.schema.indexes();
  const compound = indexes.find(idx => idx[0] && idx[0].clientId === 1 && idx[0].productId === 1 && idx[0].expiryDate === 1);
  assert(compound, "Compound index on clientId, productId, expiryDate must exist");
});

test("idempotent model registration guard", () => {
  const requiredModel = require("./models/AmcContract");
  assert.strictEqual(requiredModel, AmcContract, "Subsequent require should return identical model");
  assert.strictEqual(mongoose.models.AmcContract, AmcContract, "mongoose.models.AmcContract matches");
});

console.log(`\nAll ${passCount} schema verification tests passed successfully!`);
