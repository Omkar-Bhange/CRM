"use strict";
/**
 * verify_systemsettings_model.js
 * READ-ONLY schema verification — no DB connection needed.
 * Run from: backend/
 */

const mongoose = require("mongoose");

// Load all four centralized models in isolation
const Product        = require("./models/Product");
const Project        = require("./models/Project");
const Requirement    = require("./models/Requirement");
const SystemSettings = require("./models/SystemSettings");

// Also simulate what settings.js does: require via the same path
const SystemSettings2 = require("./models/SystemSettings");

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
check("Product.modelName",         Product.modelName,         "Product");
check("Project.modelName",         Project.modelName,         "Project");
check("Requirement.modelName",     Requirement.modelName,     "Requirement");
check("SystemSettings.modelName",  SystemSettings.modelName,  "SystemSettings");

// -- 2. Collection names
console.log("\n[2] Collection names");
check("Product   -> products",           Product.collection.name,         "products");
check("Project   -> projects",           Project.collection.name,         "projects");
check("Requirement -> requirements",     Requirement.collection.name,     "requirements");
check("SystemSettings -> systemsettings", SystemSettings.collection.name,  "systemsettings");

// -- 3. Idempotent model registration (no OverwriteModelError)
console.log("\n[3] Idempotent registration");
assert("mongoose.models.Product === Product",                 mongoose.models.Product         === Product);
assert("mongoose.models.Project === Project",                 mongoose.models.Project         === Project);
assert("mongoose.models.Requirement === Requirement",         mongoose.models.Requirement     === Requirement);
assert("mongoose.models.SystemSettings === SystemSettings",   mongoose.models.SystemSettings  === SystemSettings);
assert("Require twice returns same instance",                  SystemSettings === SystemSettings2);

// -- 4. Timestamps and minimize
console.log("\n[4] Schema options");
assert("SystemSettings timestamps:true",    SystemSettings.schema.get("timestamps") === true);
assert("SystemSettings minimize:false",     SystemSettings.schema.get("minimize") === false);
assert("SystemSettings collection name",    SystemSettings.schema.get("collection") === "systemsettings");

// -- 5. settingsKey field
console.log("\n[5] settingsKey field");
var sk = SystemSettings.schema.paths.settingsKey;
assert("settingsKey exists",          !!sk);
assert("settingsKey required",        sk.isRequired);
assert("settingsKey unique",          sk.options.unique === true);
assert("settingsKey immutable",       sk.options.immutable === true);
assert("settingsKey index",           sk.options.index === true);
assert("settingsKey default 'system'", sk.defaultValue === "system");

// -- 6. Company subdocument fields
console.log("\n[6] Company subdocument");
var companyFields = [
  "company.companyName", "company.workspaceName", "company.ownerName",
  "company.email", "company.mobile", "company.gstNo", "company.address",
  "company.city", "company.state", "company.country",
  "company.financialYearStart", "company.dateFormat", "company.timezone"
];
companyFields.forEach(function(f) {
  assert("Path: " + f, !!SystemSettings.schema.paths[f]);
});
check("company.companyName default",    SystemSettings.schema.paths["company.companyName"].defaultValue, "Total Solution");
check("company.workspaceName default",  SystemSettings.schema.paths["company.workspaceName"].defaultValue, "Client Connect");
check("company.country default",        SystemSettings.schema.paths["company.country"].defaultValue, "India");
check("company.financialYearStart default", SystemSettings.schema.paths["company.financialYearStart"].defaultValue, "04");
check("company.dateFormat default",     SystemSettings.schema.paths["company.dateFormat"].defaultValue, "DD/MM/YYYY");
check("company.timezone default",       SystemSettings.schema.paths["company.timezone"].defaultValue, "Asia/Kolkata");

// -- 7. financialYearStart enum
console.log("\n[7] financialYearStart enum (months 01-12)");
check("financialYearStart enum",
  SystemSettings.schema.paths["company.financialYearStart"].enumValues.sort(),
  ["01","02","03","04","05","06","07","08","09","10","11","12"].sort()
);

// -- 8. workingHours subdocument
console.log("\n[8] workingHours subdocument");
var wh = SystemSettings.schema.paths;
check("workingHours.officeStartTime default",   wh["workingHours.officeStartTime"].defaultValue, "09:00");
check("workingHours.officeEndTime default",     wh["workingHours.officeEndTime"].defaultValue, "18:00");
check("workingHours.lateAfterMinutes default",  wh["workingHours.lateAfterMinutes"].defaultValue, 10);
check("workingHours.fullDayHours default",      wh["workingHours.fullDayHours"].defaultValue, 8);
check("workingHours.halfDayHours default",      wh["workingHours.halfDayHours"].defaultValue, 4);
check("workingHours.defaultBreakMinutes default", wh["workingHours.defaultBreakMinutes"].defaultValue, 45);
check("workingHours.autoMarkAbsent default",    wh["workingHours.autoMarkAbsent"].defaultValue, true);
check("workingHours.absentMarkTime default",    wh["workingHours.absentMarkTime"].defaultValue, "11:00");
check("workingHours.allowManualCorrection default", wh["workingHours.allowManualCorrection"].defaultValue, true);

// weeklyOff enum (array of strings - check caster or path options)
var weeklyOffPath = wh["workingHours.weeklyOff"];
var weeklyOffEnum = weeklyOffPath && weeklyOffPath.caster
  ? weeklyOffPath.caster.enumValues
  : (weeklyOffPath && weeklyOffPath.options && weeklyOffPath.options.enum
    ? weeklyOffPath.options.enum
    : []);
check("workingHours.weeklyOff enum",
  weeklyOffEnum.slice().sort(),
  ["Friday","Monday","Saturday","Sunday","Thursday","Tuesday","Wednesday"]
);

// -- 9. Notification settings
console.log("\n[9] Notification settings");
assert("notifications.amcReminderDays path exists",         !!wh["notifications.amcReminderDays"]);
assert("notifications.taskDueReminderHours path exists",    !!wh["notifications.taskDueReminderHours"]);
assert("notifications.dailySummaryEnabled path exists",     !!wh["notifications.dailySummaryEnabled"]);
assert("notifications.dailySummaryTime path exists",        !!wh["notifications.dailySummaryTime"]);
check("notifications.amcReminderDays default",          wh["notifications.amcReminderDays"].defaultValue, 30);
check("notifications.taskDueReminderHours default",     wh["notifications.taskDueReminderHours"].defaultValue, 4);
check("notifications.dailySummaryEnabled default",      wh["notifications.dailySummaryEnabled"].defaultValue, true);
check("notifications.dailySummaryTime default",         wh["notifications.dailySummaryTime"].defaultValue, "18:30");

// -- 10. Array subdocuments
console.log("\n[10] Array subdocuments (roles, taskStatuses, priorities, leaveTypes)");
assert("roles is DocumentArray",        !!SystemSettings.schema.paths.roles);
assert("taskStatuses is DocumentArray", !!SystemSettings.schema.paths.taskStatuses);
assert("priorities is DocumentArray",   !!SystemSettings.schema.paths.priorities);
assert("leaveTypes is DocumentArray",   !!SystemSettings.schema.paths.leaveTypes);

// Check sub-schemas are well-formed
var roleSubSchema       = SystemSettings.schema.paths.roles.schema;
var taskStatusSubSchema = SystemSettings.schema.paths.taskStatuses.schema;
var prioritySubSchema   = SystemSettings.schema.paths.priorities.schema;
var leaveTypeSubSchema  = SystemSettings.schema.paths.leaveTypes.schema;

assert("roleSchema has name field",             !!roleSubSchema.paths.name);
assert("roleSchema has permissions field",      !!roleSubSchema.paths.permissions);
assert("roleSchema._id true",                   roleSubSchema.options._id === true);
assert("roleSchema timestamps true",            roleSubSchema.options.timestamps === true);

assert("taskStatusSchema has name field",       !!taskStatusSubSchema.paths.name);
assert("taskStatusSchema has isFinal field",    !!taskStatusSubSchema.paths.isFinal);
assert("taskStatusSchema._id true",             taskStatusSubSchema.options._id === true);

assert("prioritySchema has responseHours",      !!prioritySubSchema.paths.responseHours);
check("prioritySchema.responseHours max",       prioritySubSchema.paths.responseHours.options.max, 8760);

assert("leaveTypeSchema has code field",        !!leaveTypeSubSchema.paths.code);
assert("leaveTypeSchema.code uppercase",        leaveTypeSubSchema.paths.code.options.uppercase === true);
assert("leaveTypeSchema has carryForward",      !!leaveTypeSubSchema.paths.carryForward);

// -- 11. Version and audit fields
console.log("\n[11] Version and audit fields");
assert("version field exists",          !!SystemSettings.schema.paths.version);
assert("updatedBy field exists",        !!SystemSettings.schema.paths.updatedBy);
assert("updatedByName field exists",    !!SystemSettings.schema.paths.updatedByName);
check("version default",                SystemSettings.schema.paths.version.defaultValue, 1);
check("updatedBy ref",                  SystemSettings.schema.paths.updatedBy.options.ref, "User");

// -- 12. settings.js export still works (simulated)
console.log("\n[12] settings.js SystemSettings export compatibility");
// The real settings.js does: module.exports.SystemSettings = SystemSettings
// We verify the model we get directly from the model file is identical to
// what mongoose.models.SystemSettings would return (since settings.js uses same guard)
assert("mongoose.models.SystemSettings resolves to same object", mongoose.models.SystemSettings === SystemSettings);

// -- Summary
console.log("\n" + "=".repeat(55));
console.log("PASSED: " + passed + "  FAILED: " + failed);
if (failed === 0) {
  console.log("ALL CHECKS PASSED");
  process.exit(0);
} else {
  console.error("SOME CHECKS FAILED");
  process.exit(1);
}
