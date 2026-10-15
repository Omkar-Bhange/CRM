"use strict";

const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "node_modules");
require("module").Module._initPaths();

const mongoose = require("mongoose");
const assert = require("assert");

const ProductSale = require("./models/ProductSale");

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

console.log("Starting ProductSale Schema & Registration Verification...\n");

// 1. Model & Collection identity
test("ProductSale model exists and is a Mongoose model", () => {
  assert(ProductSale, "ProductSale should be truthy");
  assert.strictEqual(typeof ProductSale, "function", "ProductSale should be a function/model");
  assert.strictEqual(ProductSale.modelName, "ProductSale", "modelName must be 'ProductSale'");
});

test("Collection name is explicitly 'productsales'", () => {
  assert.strictEqual(ProductSale.collection.name, "productsales");
});

test("Schema options include timestamps: true", () => {
  assert.strictEqual(ProductSale.schema.options.timestamps, true);
});

// 2. Main schema paths
const paths = ProductSale.schema.paths;

test("saleCode path configuration", () => {
  const p = paths.saleCode;
  assert(p, "saleCode path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.isRequired, true);
  assert.strictEqual(p.options.trim, true);
  assert.strictEqual(p.options.uppercase, true);
  assert.strictEqual(p.options.unique, true);
  assert.strictEqual(p.options.index, true);
});

test("saleNumber path configuration", () => {
  const p = paths.saleNumber;
  assert(p, "saleNumber path must exist");
  assert.strictEqual(p.instance, "Number");
  assert.strictEqual(p.isRequired, true);
  assert.strictEqual(p.options.min, 1);
  assert.strictEqual(p.options.index, true);
});

test("invoiceNo path configuration", () => {
  const p = paths.invoiceNo;
  assert(p, "invoiceNo path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.options.default, "");
  assert.strictEqual(p.options.trim, true);
  assert.strictEqual(p.options.uppercase, true);
  assert.strictEqual(p.options.index, true);
});

test("saleDate path configuration", () => {
  const p = paths.saleDate;
  assert(p, "saleDate path must exist");
  assert.strictEqual(p.instance, "Date");
  assert.strictEqual(p.isRequired, true);
  assert.strictEqual(p.options.index, true);
});

test("invoiceDate path configuration", () => {
  const p = paths.invoiceDate;
  assert(p, "invoiceDate path must exist");
  assert.strictEqual(p.instance, "Date");
  assert.strictEqual(p.options.index, true);
});

test("dueDate path configuration", () => {
  const p = paths.dueDate;
  assert(p, "dueDate path must exist");
  assert.strictEqual(p.instance, "Date");
  assert.strictEqual(p.options.default, null);
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

test("clientCode, clientName, contactPerson, mobile, email, gstNo, state, billingAddress paths", () => {
  assert.strictEqual(paths.clientCode.instance, "String");
  assert.strictEqual(paths.clientCode.isRequired, true);
  assert.strictEqual(paths.clientCode.options.trim, true);
  assert.strictEqual(paths.clientCode.options.uppercase, true);
  assert.strictEqual(paths.clientCode.options.index, true);

  assert.strictEqual(paths.clientName.instance, "String");
  assert.strictEqual(paths.clientName.isRequired, true);
  assert.strictEqual(paths.clientName.options.trim, true);
  assert.strictEqual(paths.clientName.options.index, true);

  assert.strictEqual(paths.contactPerson.instance, "String");
  assert.strictEqual(paths.contactPerson.options.default, "");
  assert.strictEqual(paths.contactPerson.options.trim, true);

  assert.strictEqual(paths.mobile.instance, "String");
  assert.strictEqual(paths.mobile.options.default, "");
  assert.strictEqual(paths.mobile.options.trim, true);

  assert.strictEqual(paths.email.instance, "String");
  assert.strictEqual(paths.email.options.default, "");
  assert.strictEqual(paths.email.options.trim, true);
  assert.strictEqual(paths.email.options.lowercase, true);

  assert.strictEqual(paths.gstNo.instance, "String");
  assert.strictEqual(paths.gstNo.options.default, "");
  assert.strictEqual(paths.gstNo.options.trim, true);
  assert.strictEqual(paths.gstNo.options.uppercase, true);

  assert.strictEqual(paths.state.instance, "String");
  assert.strictEqual(paths.state.options.default, "");
  assert.strictEqual(paths.state.options.trim, true);

  assert.strictEqual(paths.billingAddress.instance, "String");
  assert.strictEqual(paths.billingAddress.options.default, "");
  assert.strictEqual(paths.billingAddress.options.trim, true);
});

test("financial numeric paths: grossAmount, discountAmount, taxableAmount, cgstAmount, sgstAmount, igstAmount, roundOff, totalAmount, paidAmount, pendingAmount", () => {
  const fields = [
    "grossAmount", "discountAmount", "taxableAmount",
    "cgstAmount", "sgstAmount", "igstAmount",
    "totalAmount", "paidAmount", "pendingAmount"
  ];
  for (const f of fields) {
    const p = paths[f];
    assert(p, `${f} must exist`);
    assert.strictEqual(p.instance, "Number", `${f} must be Number`);
    assert.strictEqual(p.options.default, 0, `${f} default must be 0`);
    assert.strictEqual(p.options.min, 0, `${f} min must be 0`);
  }

  const ro = paths.roundOff;
  assert(ro, "roundOff must exist");
  assert.strictEqual(ro.instance, "Number");
  assert.strictEqual(ro.options.default, 0);
});

test("paymentStatus and status enums and defaults", () => {
  const ps = paths.paymentStatus;
  assert.strictEqual(ps.instance, "String");
  assert.deepStrictEqual(ps.options.enum, ["Unpaid", "Partially Paid", "Paid", "Overdue"]);
  assert.strictEqual(ps.options.default, "Unpaid");
  assert.strictEqual(ps.options.index, true);

  const st = paths.status;
  assert.strictEqual(st.instance, "String");
  assert.deepStrictEqual(st.options.enum, ["Draft", "Confirmed", "Cancelled"]);
  assert.strictEqual(st.options.default, "Confirmed");
  assert.strictEqual(st.options.index, true);
});

test("paymentVersion and notes paths", () => {
  assert.strictEqual(paths.paymentVersion.instance, "Number");
  assert.strictEqual(paths.paymentVersion.options.default, 0);
  assert.strictEqual(paths.notes.instance, "String");
  assert.strictEqual(paths.notes.options.default, "");
  assert.strictEqual(paths.notes.options.trim, true);
});

test("audit paths: createdBy, createdByName, updatedBy, updatedByName, isDeleted, deletedAt, deletedBy, deletedByName", () => {
  assert.strictEqual(paths.createdBy.instance, "ObjectId");
  assert.strictEqual(paths.createdBy.options.ref, "User");
  assert.strictEqual(paths.createdBy.options.default, null);

  assert.strictEqual(paths.createdByName.instance, "String");
  assert.strictEqual(paths.createdByName.options.default, "");
  assert.strictEqual(paths.createdByName.options.trim, true);

  assert.strictEqual(paths.updatedBy.instance, "ObjectId");
  assert.strictEqual(paths.updatedBy.options.ref, "User");
  assert.strictEqual(paths.updatedBy.options.default, null);

  assert.strictEqual(paths.updatedByName.instance, "String");
  assert.strictEqual(paths.updatedByName.options.default, "");
  assert.strictEqual(paths.updatedByName.options.trim, true);

  assert.strictEqual(paths.isDeleted.instance, "Boolean");
  assert.strictEqual(paths.isDeleted.options.default, false);
  assert.strictEqual(paths.isDeleted.options.index, true);

  assert.strictEqual(paths.deletedAt.instance, "Date");
  assert.strictEqual(paths.deletedAt.options.default, null);

  assert.strictEqual(paths.deletedBy.instance, "ObjectId");
  assert.strictEqual(paths.deletedBy.options.ref, "User");
  assert.strictEqual(paths.deletedBy.options.default, null);

  assert.strictEqual(paths.deletedByName.instance, "String");
  assert.strictEqual(paths.deletedByName.options.default, "");
  assert.strictEqual(paths.deletedByName.options.trim, true);
});

// 3. Items subdocument schema
test("items subdocument array configuration and custom validator", () => {
  const p = paths.items;
  assert(p, "items path must exist");
  assert.strictEqual(p.instance, "Array");
  const subSchema = p.schema;
  assert(subSchema, "items should have a subdocument schema");

  // Validate validator
  const validators = p.validators;
  assert(validators && validators.length > 0, "items should have a custom validator");
  const arrayVal = validators.find(v => v.message === "At least one product is required.");
  assert(arrayVal, "validator message must match");
  assert.strictEqual(arrayVal.validator([]), false, "empty array should fail validation");
  assert.strictEqual(arrayVal.validator(null), false, "null should fail validation");
  assert.strictEqual(arrayVal.validator([{}]), true, "non-empty array should pass validation");
});

test("items subdocument schema paths & types", () => {
  const subPaths = paths.items.schema.paths;

  assert.strictEqual(subPaths.productId.instance, "ObjectId");
  assert.strictEqual(subPaths.productId.options.ref, "Product");
  assert.strictEqual(subPaths.productId.isRequired, true);
  assert.strictEqual(subPaths.productId.options.index, true);

  assert.strictEqual(subPaths.productCode.instance, "String");
  assert.strictEqual(subPaths.productCode.isRequired, true);
  assert.strictEqual(subPaths.productCode.options.trim, true);
  assert.strictEqual(subPaths.productCode.options.uppercase, true);

  assert.strictEqual(subPaths.productName.instance, "String");
  assert.strictEqual(subPaths.productName.isRequired, true);
  assert.strictEqual(subPaths.productName.options.trim, true);

  assert.strictEqual(subPaths.version.instance, "String");
  assert.strictEqual(subPaths.version.options.default, "");
  assert.strictEqual(subPaths.version.options.trim, true);

  assert.strictEqual(subPaths.clientProductId.instance, "ObjectId");
  assert.strictEqual(subPaths.clientProductId.options.default, null);
  assert.strictEqual(subPaths.clientProductId.options.index, true);

  assert.strictEqual(subPaths.licenceType.instance, "String");
  assert.deepStrictEqual(subPaths.licenceType.options.enum, [
    "Perpetual Licence",
    "Annual Licence",
    "Monthly Subscription",
  ]);
  assert.strictEqual(subPaths.licenceType.options.default, "Perpetual Licence");

  assert.strictEqual(subPaths.licensedUsers.instance, "Number");
  assert.strictEqual(subPaths.licensedUsers.options.default, 1);
  assert.strictEqual(subPaths.licensedUsers.options.min, 1);

  assert.strictEqual(subPaths.quantity.instance, "Number");
  assert.strictEqual(subPaths.quantity.options.default, 1);
  assert.strictEqual(subPaths.quantity.options.min, 1);

  assert.strictEqual(subPaths.rate.instance, "Number");
  assert.strictEqual(subPaths.rate.options.default, 0);
  assert.strictEqual(subPaths.rate.options.min, 0);

  assert.strictEqual(subPaths.grossAmount.instance, "Number");
  assert.strictEqual(subPaths.grossAmount.options.default, 0);
  assert.strictEqual(subPaths.grossAmount.options.min, 0);

  assert.strictEqual(subPaths.discountAmount.instance, "Number");
  assert.strictEqual(subPaths.discountAmount.options.default, 0);
  assert.strictEqual(subPaths.discountAmount.options.min, 0);

  assert.strictEqual(subPaths.taxableAmount.instance, "Number");
  assert.strictEqual(subPaths.taxableAmount.options.default, 0);
  assert.strictEqual(subPaths.taxableAmount.options.min, 0);

  assert.strictEqual(subPaths.gstRate.instance, "Number");
  assert.strictEqual(subPaths.gstRate.options.default, 18);
  assert.strictEqual(subPaths.gstRate.options.min, 0);

  assert.strictEqual(subPaths.cgstAmount.instance, "Number");
  assert.strictEqual(subPaths.cgstAmount.options.default, 0);
  assert.strictEqual(subPaths.cgstAmount.options.min, 0);

  assert.strictEqual(subPaths.sgstAmount.instance, "Number");
  assert.strictEqual(subPaths.sgstAmount.options.default, 0);
  assert.strictEqual(subPaths.sgstAmount.options.min, 0);

  assert.strictEqual(subPaths.igstAmount.instance, "Number");
  assert.strictEqual(subPaths.igstAmount.options.default, 0);
  assert.strictEqual(subPaths.igstAmount.options.min, 0);

  assert.strictEqual(subPaths.totalAmount.instance, "Number");
  assert.strictEqual(subPaths.totalAmount.options.default, 0);
  assert.strictEqual(subPaths.totalAmount.options.min, 0);

  assert.strictEqual(subPaths.purchaseDate.instance, "Date");
  assert.strictEqual(subPaths.purchaseDate.options.default, null);

  assert.strictEqual(subPaths.installationDate.instance, "Date");
  assert.strictEqual(subPaths.installationDate.options.default, null);

  assert.strictEqual(subPaths.warrantyMonths.instance, "Number");
  assert.strictEqual(subPaths.warrantyMonths.options.default, 12);
  assert.strictEqual(subPaths.warrantyMonths.options.min, 0);

  assert.strictEqual(subPaths.warrantyStartDate.instance, "Date");
  assert.strictEqual(subPaths.warrantyStartDate.options.default, null);

  assert.strictEqual(subPaths.warrantyEndDate.instance, "Date");
  assert.strictEqual(subPaths.warrantyEndDate.options.default, null);

  assert.strictEqual(subPaths.supportType.instance, "String");
  assert.deepStrictEqual(subPaths.supportType.options.enum, ["Basic", "Standard", "Premium"]);
  assert.strictEqual(subPaths.supportType.options.default, "Standard");

  assert.strictEqual(subPaths.installationStatus.instance, "String");
  assert.deepStrictEqual(subPaths.installationStatus.options.enum, [
    "Not Installed",
    "Installation Pending",
    "Installed",
    "Inactive",
  ]);
  assert.strictEqual(subPaths.installationStatus.options.default, "Not Installed");

  assert.strictEqual(subPaths.amcApplicable.instance, "Boolean");
  assert.strictEqual(subPaths.amcApplicable.options.default, true);

  assert.strictEqual(subPaths.proposedAmcAmount.instance, "Number");
  assert.strictEqual(subPaths.proposedAmcAmount.options.default, 0);
  assert.strictEqual(subPaths.proposedAmcAmount.options.min, 0);

  assert.strictEqual(subPaths.notes.instance, "String");
  assert.strictEqual(subPaths.notes.options.default, "");
  assert.strictEqual(subPaths.notes.options.trim, true);

  assert.strictEqual(paths.items.schema.options._id, true);
  assert.strictEqual(paths.items.schema.options.timestamps, true);
});

// 4. Indexes
test("Explicit schema indexes match original specification", () => {
  const indexes = ProductSale.schema.indexes();
  
  // Find text index
  const textIdx = indexes.find(i => i[0].saleCode === "text");
  assert(textIdx, "text index must exist");
  assert.deepStrictEqual(textIdx[0], {
    saleCode: "text",
    invoiceNo: "text",
    clientCode: "text",
    clientName: "text",
    "items.productCode": "text",
    "items.productName": "text",
  });

  // Find compound index
  const compoundIdx = indexes.find(i => i[0].clientId === 1 && i[0].saleDate === -1);
  assert(compoundIdx, "compound index { clientId: 1, saleDate: -1 } must exist");
});

test("Export idempotency and singleton reuse", () => {
  const RequiredAgain = require("./models/ProductSale");
  assert.strictEqual(ProductSale, RequiredAgain, "Requiring again returns identical instance");
  assert.strictEqual(mongoose.models.ProductSale, ProductSale, "mongoose.models.ProductSale matches");
});

console.log(`\nAll ${passCount} ProductSale schema verification checks passed successfully!`);
