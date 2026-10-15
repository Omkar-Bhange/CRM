"use strict";
/**
 * verify_requirement_model.js
 * READ-ONLY schema verification — no DB connection needed.
 * Run from: backend/
 */

const mongoose = require("mongoose");

const Product     = require("./models/Product");
const Project     = require("./models/Project");
const Requirement = require("./models/Requirement");

let passed = 0;
let failed = 0;

function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    console.log("  PASS:", label);
    passed++;
  } else {
    console.error("  FAIL:", label);
    console.error("    Expected:", JSON.stringify(expected));
    console.error("    Actual  :", JSON.stringify(actual));
    failed++;
  }
}

function assert(label, cond) {
  if (cond) {
    console.log("  PASS:", label);
    passed++;
  } else {
    console.error("  FAIL:", label);
    failed++;
  }
}

// -- 1. Model names
console.log("\n[1] Model names");
check("Product.modelName",     Product.modelName,     "Product");
check("Project.modelName",     Project.modelName,     "Project");
check("Requirement.modelName", Requirement.modelName, "Requirement");

// -- 2. Collection names
console.log("\n[2] Collection names");
check("Product   -> products",      Product.collection.name,     "products");
check("Project   -> projects",      Project.collection.name,     "projects");
check("Requirement -> requirements", Requirement.collection.name, "requirements");

// -- 3. No OverwriteModelError (idempotent registration)
console.log("\n[3] Idempotent model registration");
assert("mongoose.models.Product === Product",         mongoose.models.Product     === Product);
assert("mongoose.models.Project === Project",         mongoose.models.Project     === Project);
assert("mongoose.models.Requirement === Requirement", mongoose.models.Requirement === Requirement);

// -- 4. Timestamps
console.log("\n[4] Timestamps");
assert("Requirement has timestamps:true", Requirement.schema.get("timestamps") === true);
assert("Project has timestamps:true",     Project.schema.get("timestamps") === true);
assert("Product has timestamps:true",     Product.schema.get("timestamps") === true);

// -- 5. Requirement schema paths
console.log("\n[5] Requirement schema field presence");
const EXPECTED_PATHS = [
  "__v","_id","assignedEmployeeCode","assignedEmployeeId","assignedEmployeeName",
  "clientCode","clientId","clientName","competitor","contactMethod","contactPerson",
  "convertedAt","convertedProjectCode","convertedProjectId","createdAt","createdBy",
  "createdByName","deletedAt","deletedBy","deletedByName","demoDate","demoOwner",
  "description","estimatedBudget","estimatedCost","expectedDeliveryDate","followUpDate",
  "holdReason","isDeleted","lostReason","nextAction","notes","priority",
  "prospectCity","prospectCompany","prospectEmail","prospectMobile","prospectName",
  "quotationDate","quotationNo","quotationReference","quotedAmount","requirementCode",
  "requirementType","source","sourceType","stageData","status","timeline",
  "title","updatedAt","updatedBy","updatedByName","validUntil",
];

const actualPaths = Object.keys(Requirement.schema.paths).sort();
check("Schema paths", actualPaths, EXPECTED_PATHS);

// -- 6. Required fields
console.log("\n[6] Required fields");
assert("requirementCode is required", Requirement.schema.paths.requirementCode.isRequired);
assert("sourceType is required",      Requirement.schema.paths.sourceType.isRequired);
assert("title is required",           Requirement.schema.paths.title.isRequired);
assert("description is required",     Requirement.schema.paths.description.isRequired);

// -- 7. Enum values
console.log("\n[7] Enum values");
check("sourceType enum",
  Requirement.schema.paths.sourceType.enumValues.sort(),
  ["Existing Client","New Prospect"].sort()
);
check("status enum",
  Requirement.schema.paths.status.enumValues.sort(),
  ["Analysis","Approved","Converted to Project","Discussion","Estimate Pending",
   "Negotiation","New","On Hold","Quotation Pending","Quotation Sent","Rejected"].sort()
);
check("requirementType enum",
  Requirement.schema.paths.requirementType.enumValues.sort(),
  ["Automation","Customization","Integration","Mobile App","New Software",
   "Other","Support Requirement","Upgrade","Website"].sort()
);
check("source enum",
  Requirement.schema.paths.source.enumValues.sort(),
  ["Email","Existing Client","Other","Phone","Referral","Walk In","Website","WhatsApp"].sort()
);

// -- 8. Defaults
console.log("\n[8] Default values");
check("status default",         Requirement.schema.paths.status.defaultValue,         "New");
check("requirementType default", Requirement.schema.paths.requirementType.defaultValue, "New Software");
check("source default",         Requirement.schema.paths.source.defaultValue,         "Existing Client");
check("priority default",       Requirement.schema.paths.priority.defaultValue,       "Medium");
check("isDeleted default",      Requirement.schema.paths.isDeleted.defaultValue,      false);
check("estimatedBudget default", Requirement.schema.paths.estimatedBudget.defaultValue, 0);
check("quotedAmount default",   Requirement.schema.paths.quotedAmount.defaultValue,   0);

// -- 9. References
console.log("\n[9] Model references");
check("clientId ref",            Requirement.schema.paths.clientId.options.ref,             "Client");
check("assignedEmployeeId ref",  Requirement.schema.paths.assignedEmployeeId.options.ref,   "Employee");
check("convertedProjectId ref",  Requirement.schema.paths.convertedProjectId.options.ref,   "Project");
check("createdBy ref",           Requirement.schema.paths.createdBy.options.ref,            "User");
check("updatedBy ref",           Requirement.schema.paths.updatedBy.options.ref,            "User");
check("deletedBy ref",           Requirement.schema.paths.deletedBy.options.ref,            "User");

// -- 10. Project -> Requirement back-reference
console.log("\n[10] Project.requirementId reference");
check("Project.requirementId ref", Project.schema.paths.requirementId.options.ref, "Requirement");
check("Project.requirementId index", Project.schema.paths.requirementId.options.index, true);

// -- 11. Text index
console.log("\n[11] Text index");
const textIdx = Requirement.schema.indexes().find(function(pair) {
  return Object.values(pair[0]).includes("text");
});
assert("Text index exists",              !!textIdx);
assert("requirementCode in text idx",    textIdx && textIdx[0].requirementCode === "text");
assert("title in text idx",              textIdx && textIdx[0].title === "text");
assert("clientName in text idx",         textIdx && textIdx[0].clientName === "text");
assert("prospectName in text idx",       textIdx && textIdx[0].prospectName === "text");
assert("prospectCompany in text idx",    textIdx && textIdx[0].prospectCompany === "text");
assert("description in text idx",        textIdx && textIdx[0].description === "text");

// -- 12. Timeline subdocument
console.log("\n[12] Timeline subdocument");
const timelinePath = Requirement.schema.paths.timeline;
assert("timeline is DocumentArray", !!timelinePath);
var subDoc = timelinePath.schema;
assert("timeline.action field exists",         !!subDoc.paths.action);
assert("timeline.oldStatus field exists",      !!subDoc.paths.oldStatus);
assert("timeline.newStatus field exists",      !!subDoc.paths.newStatus);
assert("timeline.performedBy field exists",    !!subDoc.paths.performedBy);
assert("timeline.performedByRole default admin", subDoc.paths.performedByRole.defaultValue === "admin");
assert("timeline._id: true",                   subDoc.options._id === true);

// -- Summary
console.log("\n" + "=".repeat(50));
console.log("PASSED: " + passed + "  FAILED: " + failed);
if (failed === 0) {
  console.log("ALL CHECKS PASSED");
  process.exit(0);
} else {
  console.error("SOME CHECKS FAILED");
  process.exit(1);
}
