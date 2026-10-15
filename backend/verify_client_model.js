"use strict";

const mongoose = require("mongoose");
const path = require("path");

console.log("=== VERIFY CLIENT MODEL SCHEMA PARITY ===");

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

const Client = require("./models/Client");

assert(Client !== undefined && Client !== null, "Client model is exported");
assert(Client.modelName === "Client", "Model name is 'Client'");
assert(Client.collection.name === "clients", "Collection name is 'clients'");
assert(Client.schema !== undefined, "Schema exists on model");

const schema = Client.schema;
assert(schema.get("timestamps") === true, "Timestamps option is true");
assert(schema.get("collection") === "clients", "Schema options collection is 'clients'");

// ── 1. Root Schema Paths ────────────────────────────────────────────────────────
const expectedPaths = [
  "clientCode",
  "companyName",
  "contactPerson",
  "email",
  "userId",
  "loginEnabled",
  "loginCreatedAt",
  "mobile",
  "city",
  "products",
  "amcStatus",
  "gstNo",
  "panNo",
  "addressLine1",
  "addressLine2",
  "state",
  "pinCode",
  "country",
  "billingContact",
  "billingEmail",
  "preferredContact",
  "supportLanguage",
  "nextRenewal",
  "openTickets",
  "assignedEmployeeId",
  "assignedEmployeeCode",
  "assignedEmployeeName",
  "status",
  "createdBy",
  "createdByName",
  "updatedBy",
  "updatedByName",
  "isDeleted",
  "deletedAt",
  "deletedBy",
  "deletedByName",
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

// clientCode
const codePath = schema.paths.clientCode;
assert(codePath.instance === "String", "clientCode instance is String");
assert(codePath.isRequired === true, "clientCode is required");
assert(codePath.options.unique === true, "clientCode is unique");
assert(codePath.options.trim === true, "clientCode is trimmed");
assert(codePath.options.uppercase === true, "clientCode is uppercase");
assert(codePath._index === true || typeof codePath._index === "object" || codePath.options.index === true, "clientCode is indexed");

// companyName
const namePath = schema.paths.companyName;
assert(namePath.instance === "String", "companyName instance is String");
assert(namePath.isRequired === true, "companyName is required");
assert(namePath.options.trim === true, "companyName is trimmed");
assert(namePath._index === true, "companyName is indexed");

// contactPerson, email, mobile, city
assert(schema.paths.contactPerson.defaultValue === "", "contactPerson default is ''");
assert(schema.paths.contactPerson.options.trim === true, "contactPerson is trimmed");
assert(schema.paths.email.defaultValue === "", "email default is ''");
assert(schema.paths.email.options.trim === true, "email is trimmed");
assert(schema.paths.email.options.lowercase === true, "email is lowercase");
assert(schema.paths.mobile.defaultValue === "", "mobile default is ''");
assert(schema.paths.city.defaultValue === "", "city default is ''");
assert(schema.paths.city._index === true, "city is indexed");

// userId
assert(schema.paths.userId.instance === "ObjectId", "userId instance is ObjectId");
assert(schema.paths.userId.options.ref === "User", "userId refs 'User'");
assert(schema.paths.userId.defaultValue === null, "userId default is null");
assert(schema.paths.userId._index === true, "userId is indexed");

// loginEnabled & loginCreatedAt
assert(schema.paths.loginEnabled.defaultValue === true, "loginEnabled default is true");
assert(schema.paths.loginCreatedAt.defaultValue === null, "loginCreatedAt default is null");

// amcStatus
const amcPath = schema.paths.amcStatus;
assert(amcPath.defaultValue === "Not Started", "amcStatus default is 'Not Started'");
assert(amcPath._index === true, "amcStatus is indexed");
assert(
  JSON.stringify(amcPath.enumValues) ===
    JSON.stringify(["Not Started", "Pending", "Paid", "Partially Paid", "Overdue"]),
  "amcStatus enum matches 5 standard states"
);

// gstNo, panNo, addresses
assert(schema.paths.gstNo.defaultValue === "", "gstNo default is ''");
assert(schema.paths.panNo.defaultValue === "", "panNo default is ''");
assert(schema.paths.addressLine1.defaultValue === "", "addressLine1 default is ''");
assert(schema.paths.addressLine2.defaultValue === "", "addressLine2 default is ''");
assert(schema.paths.state.defaultValue === "", "state default is ''");
assert(schema.paths.pinCode.defaultValue === "", "pinCode default is ''");
assert(schema.paths.country.defaultValue === "India", "country default is 'India'");

// billingContact, billingEmail
assert(schema.paths.billingContact.defaultValue === "", "billingContact default is ''");
assert(schema.paths.billingEmail.defaultValue === "", "billingEmail default is ''");

// preferredContact & supportLanguage
assert(
  JSON.stringify(schema.paths.preferredContact.enumValues) ===
    JSON.stringify(["Phone", "Email", "WhatsApp"]),
  "preferredContact enum matches 3 channels"
);
assert(schema.paths.preferredContact.defaultValue === "Phone", "preferredContact default is 'Phone'");
assert(
  JSON.stringify(schema.paths.supportLanguage.enumValues) ===
    JSON.stringify(["English", "Hindi", "Marathi"]),
  "supportLanguage enum matches 3 languages"
);
assert(schema.paths.supportLanguage.defaultValue === "English", "supportLanguage default is 'English'");

// nextRenewal & openTickets
assert(schema.paths.nextRenewal.defaultValue === "", "nextRenewal default is ''");
assert(schema.paths.openTickets.defaultValue === 0, "openTickets default is 0");
assert(schema.paths.openTickets.options.min === 0, "openTickets min is 0");

// assignedEmployeeId, code, name
assert(schema.paths.assignedEmployeeId.instance === "ObjectId", "assignedEmployeeId instance is ObjectId");
assert(schema.paths.assignedEmployeeId.options.ref === "Employee", "assignedEmployeeId refs 'Employee'");
assert(schema.paths.assignedEmployeeId._index === true, "assignedEmployeeId is indexed");
assert(schema.paths.assignedEmployeeCode.defaultValue === "", "assignedEmployeeCode default is ''");
assert(schema.paths.assignedEmployeeCode.options.uppercase === true, "assignedEmployeeCode is uppercase");
assert(schema.paths.assignedEmployeeName.defaultValue === "", "assignedEmployeeName default is ''");

// status
const statusPath = schema.paths.status;
assert(statusPath.defaultValue === "Active", "status default is 'Active'");
assert(statusPath._index === true, "status is indexed");
assert(
  JSON.stringify(statusPath.enumValues) ===
    JSON.stringify(["Active", "Inactive", "Suspended"]),
  "status enum matches 3 states"
);

// createdBy, createdByName, updatedBy, updatedByName
assert(schema.paths.createdBy.instance === "ObjectId", "createdBy instance is ObjectId");
assert(schema.paths.createdBy.options.ref === "User", "createdBy refs 'User'");
assert(schema.paths.createdByName.defaultValue === "", "createdByName default is ''");
assert(schema.paths.updatedBy.instance === "ObjectId", "updatedBy instance is ObjectId");
assert(schema.paths.updatedBy.options.ref === "User", "updatedBy refs 'User'");
assert(schema.paths.updatedByName.defaultValue === "", "updatedByName default is ''");

// isDeleted, deletedAt, deletedBy, deletedByName
assert(schema.paths.isDeleted.instance === "Boolean", "isDeleted instance is Boolean");
assert(schema.paths.isDeleted.defaultValue === false, "isDeleted default is false");
assert(schema.paths.isDeleted._index === true, "isDeleted is indexed");
assert(schema.paths.deletedAt.defaultValue === null, "deletedAt default is null");
assert(schema.paths.deletedBy.instance === "ObjectId", "deletedBy instance is ObjectId");
assert(schema.paths.deletedBy.options.ref === "User", "deletedBy refs 'User'");
assert(schema.paths.deletedByName.defaultValue === "", "deletedByName default is ''");

// ── 2. Nested clientProductSchema Paths ──────────────────────────────────────────
const productSubSchema = schema.paths.products.schema;
assert(productSubSchema !== undefined, "products sub-schema exists");
assert(productSubSchema.get("timestamps") === true, "products sub-schema has timestamps: true");
assert(productSubSchema.get("_id") === true, "products sub-schema has _id: true");

const expectedSubPaths = [
  "productId",
  "productCode",
  "productName",
  "version",
  "purchaseDate",
  "installationDate",
  "licensedUsers",
  "supportType",
  "acquisitionType",
  "productSaleId",
  "productSaleCode",
  "originalInvoiceNo",
  "originalPurchaseAmount",
  "historicalDataComplete",
  "amcStatus",
  "expiryDate",
  "installationStatus",
  "licenceType",
  "licenceKey",
  "activeUsers",
  "serverType",
  "database",
  "assignedEngineer",
  "modules",
  "documents",
  "notes",
  "_id",
  "createdAt",
  "updatedAt",
];

expectedSubPaths.forEach((sp) => {
  assert(productSubSchema.paths[sp] !== undefined, `Sub-path '${sp}' exists in productSubSchema`);
});

assert(productSubSchema.paths.productId.instance === "ObjectId", "sub-productId is ObjectId");
assert(productSubSchema.paths.productId.options.ref === "Product", "sub-productId refs 'Product'");
assert(productSubSchema.paths.productId.isRequired === true, "sub-productId is required");
assert(productSubSchema.paths.productCode.options.uppercase === true, "sub-productCode is uppercase");
assert(productSubSchema.paths.licensedUsers.defaultValue === 1, "sub-licensedUsers default is 1");
assert(productSubSchema.paths.licensedUsers.options.min === 1, "sub-licensedUsers min is 1");
assert(
  JSON.stringify(productSubSchema.paths.supportType.enumValues) ===
    JSON.stringify(["Basic", "Standard", "Premium"]),
  "sub-supportType enum matches 3 tiers"
);
assert(
  JSON.stringify(productSubSchema.paths.acquisitionType.enumValues) ===
    JSON.stringify(["Product Sale", "Legacy / Historical", "Migration"]),
  "sub-acquisitionType enum matches 3 channels"
);
assert(productSubSchema.paths.productSaleId.options.ref === "ProductSale", "sub-productSaleId refs 'ProductSale'");
assert(productSubSchema.paths.originalPurchaseAmount.defaultValue === 0, "sub-originalPurchaseAmount default is 0");
assert(productSubSchema.paths.historicalDataComplete.defaultValue === false, "sub-historicalDataComplete default is false");
assert(
  JSON.stringify(productSubSchema.paths.licenceType.enumValues) ===
    JSON.stringify(["Perpetual Licence", "Annual Licence", "Monthly Subscription"]),
  "sub-licenceType enum matches 3 types"
);

// ── 3. Text Search Index ────────────────────────────────────────────────────────
const indexes = schema.indexes();
console.log(`Schema indexes registered: ${indexes.length}`);
const textIndex = indexes.find((idx) => idx[0] && idx[0].clientCode === "text");
assert(textIndex !== undefined, "Compound text search index exists on clientSchema");
assert(textIndex[0].companyName === "text", "text index includes companyName");
assert(textIndex[0].contactPerson === "text", "text index includes contactPerson");
assert(textIndex[0].email === "text", "text index includes email");
assert(textIndex[0].mobile === "text", "text index includes mobile");
assert(textIndex[0].city === "text", "text index includes city");
assert(textIndex[0].assignedEmployeeCode === "text", "text index includes assignedEmployeeCode");
assert(textIndex[0].assignedEmployeeName === "text", "text index includes assignedEmployeeName");
assert(textIndex[0]["products.productName"] === "text", "text index includes products.productName");
assert(textIndex[0]["products.productCode"] === "text", "text index includes products.productCode");

// ── 4. Idempotency & Cache ──────────────────────────────────────────────────────
const ClientAgain = require("./models/Client");
assert(ClientAgain === Client, "Re-requiring model returns cached instance");
assert(mongoose.models.Client === Client, "mongoose.models.Client matches export");

console.log(`\n========================================`);
console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log("All Client schema unit checks passed successfully!");
  process.exit(0);
}
