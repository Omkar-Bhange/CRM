"use strict";

const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "node_modules");
require("module").Module._initPaths();

const mongoose = require("mongoose");
const assert = require("assert");

const ClientAmcRequest = require("./models/ClientAmcRequest");

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

console.log("Starting ClientAmcRequest Schema & Registration Verification...\n");

// 1. Model & Collection identity
test("ClientAmcRequest model exists and is a Mongoose model", () => {
  assert(ClientAmcRequest, "ClientAmcRequest should be truthy");
  assert.strictEqual(typeof ClientAmcRequest, "function", "ClientAmcRequest should be a function/model");
  assert.strictEqual(ClientAmcRequest.modelName, "ClientAmcRequest", "modelName must be 'ClientAmcRequest'");
});

test("Collection name is explicitly 'clientamcrequests'", () => {
  assert.strictEqual(ClientAmcRequest.collection.name, "clientamcrequests");
});

test("Schema options include timestamps: true", () => {
  assert.strictEqual(ClientAmcRequest.schema.options.timestamps, true);
});

// 2. Schema paths
const paths = ClientAmcRequest.schema.paths;

test("requestCode path configuration", () => {
  const p = paths.requestCode;
  assert(p, "requestCode path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.isRequired, true);
  assert.strictEqual(p.options.unique, true);
  assert.strictEqual(p.options.trim, true);
  assert.strictEqual(p.options.uppercase, true);
  assert.strictEqual(p.options.index, true);
});

test("activeRequestKey path configuration", () => {
  const p = paths.activeRequestKey;
  assert(p, "activeRequestKey path must exist");
  assert.strictEqual(p.instance, "String");
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

test("clientCode path configuration", () => {
  const p = paths.clientCode;
  assert(p, "clientCode path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.options.default, "");
  assert.strictEqual(p.options.trim, true);
});

test("clientName path configuration", () => {
  const p = paths.clientName;
  assert(p, "clientName path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.options.default, "");
  assert.strictEqual(p.options.trim, true);
});

test("contractId path configuration (ref: AmcContract)", () => {
  const p = paths.contractId;
  assert(p, "contractId path must exist");
  assert.strictEqual(p.instance, "ObjectId");
  assert.strictEqual(p.options.ref, "AmcContract");
  assert.strictEqual(p.isRequired, true);
  assert.strictEqual(p.options.index, true);
});

test("contractCode path configuration", () => {
  const p = paths.contractCode;
  assert(p, "contractCode path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.options.default, "");
  assert.strictEqual(p.options.trim, true);
});

test("productId path configuration (ref: Product)", () => {
  const p = paths.productId;
  assert(p, "productId path must exist");
  assert.strictEqual(p.instance, "ObjectId");
  assert.strictEqual(p.options.ref, "Product");
  assert.strictEqual(p.options.default, null);
});

test("productName path configuration", () => {
  const p = paths.productName;
  assert(p, "productName path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.isRequired, true);
  assert.strictEqual(p.options.trim, true);
});

test("currentExpiryDate path configuration", () => {
  const p = paths.currentExpiryDate;
  assert(p, "currentExpiryDate path must exist");
  assert.strictEqual(p.instance, "Date");
  assert.strictEqual(p.options.default, null);
});

test("requestType path configuration and enum", () => {
  const p = paths.requestType;
  assert(p, "requestType path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.isRequired, true);
  assert.strictEqual(p.options.index, true);
  assert.deepStrictEqual(p.enumValues, ["AMC Renewal", "Quotation Request"]);
});

test("renewalPeriod path configuration and enum", () => {
  const p = paths.renewalPeriod;
  assert(p, "renewalPeriod path must exist");
  assert.strictEqual(p.instance, "String");
  assert.deepStrictEqual(p.enumValues, ["1 Year"]);
  assert.strictEqual(p.options.default, "1 Year");
});

test("preferredStartDate path configuration", () => {
  const p = paths.preferredStartDate;
  assert(p, "preferredStartDate path must exist");
  assert.strictEqual(p.instance, "Date");
  assert.strictEqual(p.options.default, null);
});

test("remarks path configuration", () => {
  const p = paths.remarks;
  assert(p, "remarks path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.options.default, "");
  assert.strictEqual(p.options.trim, true);
  assert.strictEqual(p.options.maxlength, 1000);
});

test("status path configuration and enum values", () => {
  const p = paths.status;
  assert(p, "status path must exist");
  assert.strictEqual(p.instance, "String");
  assert.deepStrictEqual(p.enumValues, [
    "Submitted",
    "Under Review",
    "Quotation Ready",
    "Completed",
    "Rejected",
    "Cancelled",
  ]);
  assert.strictEqual(p.options.default, "Submitted");
  assert.strictEqual(p.options.index, true);
});

test("quotationAmount path configuration", () => {
  const p = paths.quotationAmount;
  assert(p, "quotationAmount path must exist");
  assert.strictEqual(p.instance, "Number");
  assert.strictEqual(p.options.default, 0);
});

test("quotationDetails path configuration", () => {
  const p = paths.quotationDetails;
  assert(p, "quotationDetails path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.options.default, "");
  assert.strictEqual(p.options.trim, true);
});

test("quotationDocument subdocument paths configuration", () => {
  const pName = paths["quotationDocument.fileName"];
  assert(pName, "quotationDocument.fileName path must exist");
  assert.strictEqual(pName.instance, "String");
  assert.strictEqual(pName.options.default, "");

  const pUrl = paths["quotationDocument.fileUrl"];
  assert(pUrl, "quotationDocument.fileUrl path must exist");
  assert.strictEqual(pUrl.instance, "String");
  assert.strictEqual(pUrl.options.default, "");

  const pPath = paths["quotationDocument.filePath"];
  assert(pPath, "quotationDocument.filePath path must exist");
  assert.strictEqual(pPath.instance, "String");
  assert.strictEqual(pPath.options.default, "");

  const pSize = paths["quotationDocument.fileSize"];
  assert(pSize, "quotationDocument.fileSize path must exist");
  assert.strictEqual(pSize.instance, "Number");
  assert.strictEqual(pSize.options.default, 0);

  const pMime = paths["quotationDocument.mimeType"];
  assert(pMime, "quotationDocument.mimeType path must exist");
  assert.strictEqual(pMime.instance, "String");
  assert.strictEqual(pMime.options.default, "");

  const pUp = paths["quotationDocument.uploadedAt"];
  assert(pUp, "quotationDocument.uploadedAt path must exist");
  assert.strictEqual(pUp.instance, "Date");
  assert.strictEqual(pUp.options.default, null);
});

test("adminNotes path configuration", () => {
  const p = paths.adminNotes;
  assert(p, "adminNotes path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.options.default, "");
  assert.strictEqual(p.options.trim, true);
});

test("reviewedBy path configuration (ref: User)", () => {
  const p = paths.reviewedBy;
  assert(p, "reviewedBy path must exist");
  assert.strictEqual(p.instance, "ObjectId");
  assert.strictEqual(p.options.ref, "User");
  assert.strictEqual(p.options.default, null);
});

test("reviewedByName path configuration", () => {
  const p = paths.reviewedByName;
  assert(p, "reviewedByName path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.options.default, "");
  assert.strictEqual(p.options.trim, true);
});

test("reviewedAt path configuration", () => {
  const p = paths.reviewedAt;
  assert(p, "reviewedAt path must exist");
  assert.strictEqual(p.instance, "Date");
  assert.strictEqual(p.options.default, null);
});

test("assignedEmployeeId path configuration (ref: Employee)", () => {
  const p = paths.assignedEmployeeId;
  assert(p, "assignedEmployeeId path must exist");
  assert.strictEqual(p.instance, "ObjectId");
  assert.strictEqual(p.options.ref, "Employee");
  assert.strictEqual(p.options.default, null);
});

test("assignedEmployeeCode path configuration", () => {
  const p = paths.assignedEmployeeCode;
  assert(p, "assignedEmployeeCode path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.options.default, "");
  assert.strictEqual(p.options.trim, true);
});

test("assignedEmployeeName path configuration", () => {
  const p = paths.assignedEmployeeName;
  assert(p, "assignedEmployeeName path must exist");
  assert.strictEqual(p.instance, "String");
  assert.strictEqual(p.options.default, "");
  assert.strictEqual(p.options.trim, true);
});

test("timeline array subdocument configuration", () => {
  assert(ClientAmcRequest.schema.path("timeline"), "timeline path must exist");
  const subSchema = ClientAmcRequest.schema.path("timeline").schema;
  assert(subSchema, "timeline subSchema must exist");
  assert.strictEqual(subSchema.path("action").isRequired, true);
  assert.strictEqual(subSchema.path("status").isRequired, true);
  assert.strictEqual(subSchema.path("remarks").options.default, "");
  assert.strictEqual(subSchema.path("performedBy").options.ref, "User");
  assert.strictEqual(subSchema.path("performedByName").options.default, "");
  assert.strictEqual(subSchema.path("performedByRole").options.default, "client");
  assert(subSchema.path("timestamp").options.default, "timestamp default should exist");
});

test("isDeleted path configuration", () => {
  const p = paths.isDeleted;
  assert(p, "isDeleted path must exist");
  assert.strictEqual(p.instance, "Boolean");
  assert.strictEqual(p.options.default, false);
  assert.strictEqual(p.options.index, true);
});

// 3. Schema Indexes
test("Partial unique index on activeRequestKey exists", () => {
  const indexes = ClientAmcRequest.schema.indexes();
  const found = indexes.some(([fields, options]) => {
    return (
      fields.activeRequestKey === 1 &&
      options.unique === true &&
      options.sparse === true &&
      options.partialFilterExpression &&
      options.partialFilterExpression.activeRequestKey &&
      options.partialFilterExpression.activeRequestKey.$type === "string"
    );
  });
  assert(found, "Partial unique index on { activeRequestKey: 1 } must be declared");
});

test("Compound index on { clientId: 1, createdAt: -1 } exists", () => {
  const indexes = ClientAmcRequest.schema.indexes();
  const found = indexes.some(([fields]) => fields.clientId === 1 && fields.createdAt === -1);
  assert(found, "Compound index on { clientId: 1, createdAt: -1 } must be declared");
});

test("Compound index on { contractId: 1, createdAt: -1 } exists", () => {
  const indexes = ClientAmcRequest.schema.indexes();
  const found = indexes.some(([fields]) => fields.contractId === 1 && fields.createdAt === -1);
  assert(found, "Compound index on { contractId: 1, createdAt: -1 } must be declared");
});

test("Compound index on { status: 1, createdAt: -1 } exists", () => {
  const indexes = ClientAmcRequest.schema.indexes();
  const found = indexes.some(([fields]) => fields.status === 1 && fields.createdAt === -1);
  assert(found, "Compound index on { status: 1, createdAt: -1 } must be declared");
});

// 4. Registration idempotency & export identity
test("Re-requiring ClientAmcRequest returns exact same instance", () => {
  const RequiredAgain = require("./models/ClientAmcRequest");
  assert.strictEqual(RequiredAgain, ClientAmcRequest);
  assert.strictEqual(mongoose.models.ClientAmcRequest, ClientAmcRequest);
});

console.log(`\nTOTAL CHECKS: ${passCount}`);
console.log(`PASSED: ${passCount}`);
console.log("ClientAmcRequest Schema Verification Completed Successfully.");

