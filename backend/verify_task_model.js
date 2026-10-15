"use strict";
/**
 * verify_task_model.js
 * Comprehensive offline schema verification suite for the centralized Task model.
 */

const mongoose = require("mongoose");

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`  PASS: ${label}`);
    passed++;
  } else {
    console.error(`  FAIL: ${label}`);
    failed++;
  }
}

console.log("================================================================================");
console.log("   TASK MODEL OFFLINE SCHEMA VERIFICATION                                       ");
console.log("================================================================================");

// Require all centralized models to verify zero collisions
const Product = require("./models/Product");
const Project = require("./models/Project");
const Requirement = require("./models/Requirement");
const SystemSettings = require("./models/SystemSettings");
const ClientDocument = require("./models/ClientDocument");
const EmployeeNotification = require("./models/EmployeeNotification");
const ClientNotification = require("./models/ClientNotification");
const EmployeeDailyNote = require("./models/EmployeeDailyNote");
const ProcessedSessionBucket = require("./models/ProcessedSessionBucket");
const Holiday = require("./models/Holiday");
const LeaveRequest = require("./models/LeaveRequest");
const ActivityLog = require("./models/ActivityLog");
const Task = require("./models/Task");

// ── 1. Model names ───────────────────────────────────────────────────────────
console.log("\n[1] Model names");
assert("Product.modelName", Product.modelName === "Product");
assert("Project.modelName", Project.modelName === "Project");
assert("Requirement.modelName", Requirement.modelName === "Requirement");
assert("SystemSettings.modelName", SystemSettings.modelName === "SystemSettings");
assert("ClientDocument.modelName", ClientDocument.modelName === "ClientDocument");
assert("EmployeeNotification.modelName", EmployeeNotification.modelName === "EmployeeNotification");
assert("ClientNotification.modelName", ClientNotification.modelName === "ClientNotification");
assert("EmployeeDailyNote.modelName", EmployeeDailyNote.modelName === "EmployeeDailyNote");
assert("ProcessedSessionBucket.modelName", ProcessedSessionBucket.modelName === "ProcessedSessionBucket");
assert("Holiday.modelName", Holiday.modelName === "Holiday");
assert("LeaveRequest.modelName", LeaveRequest.modelName === "LeaveRequest");
assert("ActivityLog.modelName", ActivityLog.modelName === "ActivityLog");
assert("Task.modelName", Task.modelName === "Task");

// ── 2. Collection names ──────────────────────────────────────────────────────
console.log("\n[2] Collection names");
assert("Product collection", Product.collection.name === "products");
assert("Project collection", Project.collection.name === "projects");
assert("Requirement collection", Requirement.collection.name === "requirements");
assert("SystemSettings collection", SystemSettings.collection.name === "systemsettings");
assert("ClientDocument collection", ClientDocument.collection.name === "clientdocuments");
assert("EmployeeNotification collection", EmployeeNotification.collection.name === "employeenotifications");
assert("ClientNotification collection", ClientNotification.collection.name === "clientnotifications");
assert("EmployeeDailyNote collection", EmployeeDailyNote.collection.name === "employeedailynotes");
assert("ProcessedSessionBucket collection", ProcessedSessionBucket.collection.name === "agent_processed_session_buckets");
assert("Holiday collection", Holiday.collection.name === "holidays");
assert("LeaveRequest collection", LeaveRequest.collection.name === "leaveRequests");
assert("ActivityLog collection", ActivityLog.collection.name === "activitylogs");
assert("Task collection", Task.collection.name === "tasks");

// ── 3. Options & Timestamps ──────────────────────────────────────────────────
console.log("\n[3] Options & Timestamps");
assert("Task timestamps enabled", Task.schema.options.timestamps === true);
assert("createdAt path exists", Task.schema.paths.createdAt !== undefined);
assert("updatedAt path exists", Task.schema.paths.updatedAt !== undefined);

// ── 4. Main Schema Paths and Types ───────────────────────────────────────────
console.log("\n[4] Main Schema Paths and Types");
const paths = Task.schema.paths;

assert("taskCode is String", paths.taskCode.instance === "String");
assert("taskCode required", paths.taskCode.isRequired === true);
assert("taskCode trim", paths.taskCode.options.trim === true);
assert("taskCode uppercase", paths.taskCode.options.uppercase === true);
assert("taskCode unique", paths.taskCode.options.unique === true);
assert("taskCode index", paths.taskCode.options.index === true);

assert("title is String", paths.title.instance === "String");
assert("title required", paths.title.isRequired === true);
assert("title trim", paths.title.options.trim === true);

assert("description is String", paths.description.instance === "String");
assert("description default empty string", paths.description.defaultValue === "");
assert("description trim", paths.description.options.trim === true);

assert("workType is String", paths.workType.instance === "String");
assert("workType default is Client Support", paths.workType.defaultValue === "Client Support");
const expectedWorkTypes = [
  "Client Support",
  "Internal Development",
  "Development",
  "Testing",
  "Installation",
  "Training",
  "Documentation",
  "Internal Work",
  "Follow-up",
  "Other",
];
assert(
  "workType enums match exactly",
  JSON.stringify(paths.workType.enumValues) === JSON.stringify(expectedWorkTypes)
);

assert("taskFor is String", paths.taskFor.instance === "String");
assert("taskFor default is Project", paths.taskFor.defaultValue === "Project");
assert("taskFor index is true", paths.taskFor.options.index === true);
assert(
  "taskFor enums match exactly",
  JSON.stringify(paths.taskFor.enumValues) === JSON.stringify(["Project", "Product", "General"])
);

assert("generalTaskFor is String", paths.generalTaskFor.instance === "String");
assert("generalTaskFor default empty string", paths.generalTaskFor.defaultValue === "");
assert("generalTaskFor trim", paths.generalTaskFor.options.trim === true);

assert("clientId is ObjectId", paths.clientId.instance === "ObjectId");
assert("clientId ref Client", paths.clientId.options.ref === "Client");
assert("clientId default null", paths.clientId.defaultValue === null);

assert("clientName is String", paths.clientName.instance === "String");
assert("clientName default is Internal Development", paths.clientName.defaultValue === "Internal Development");
assert("clientName trim", paths.clientName.options.trim === true);

assert("productId is ObjectId", paths.productId.instance === "ObjectId");
assert("productId default null", paths.productId.defaultValue === null);

assert("productCode is String", paths.productCode.instance === "String");
assert("productCode default empty string", paths.productCode.defaultValue === "");
assert("productCode trim", paths.productCode.options.trim === true);
assert("productCode uppercase", paths.productCode.options.uppercase === true);

assert("productName is String", paths.productName.instance === "String");
assert("productName default empty string", paths.productName.defaultValue === "");
assert("productName trim", paths.productName.options.trim === true);

assert("projectId is ObjectId", paths.projectId.instance === "ObjectId");
assert("projectId ref Project", paths.projectId.options.ref === "Project");
assert("projectId default null", paths.projectId.defaultValue === null);
assert("projectId index is true", paths.projectId.options.index === true);

assert("projectCode is String", paths.projectCode.instance === "String");
assert("projectCode default empty string", paths.projectCode.defaultValue === "");
assert("projectCode trim", paths.projectCode.options.trim === true);
assert("projectCode uppercase", paths.projectCode.options.uppercase === true);

assert("projectName is String", paths.projectName.instance === "String");
assert("projectName default empty string", paths.projectName.defaultValue === "");
assert("projectName trim", paths.projectName.options.trim === true);

assert("ticketId is ObjectId", paths.ticketId.instance === "ObjectId");
assert("ticketId default null", paths.ticketId.defaultValue === null);

assert("ticketCode is String", paths.ticketCode.instance === "String");
assert("ticketCode default empty string", paths.ticketCode.defaultValue === "");
assert("ticketCode trim", paths.ticketCode.options.trim === true);

assert("assignedEmployeeId is ObjectId", paths.assignedEmployeeId.instance === "ObjectId");
assert("assignedEmployeeId ref Employee", paths.assignedEmployeeId.options.ref === "Employee");
assert("assignedEmployeeId required", paths.assignedEmployeeId.isRequired === true);
assert("assignedEmployeeId index", paths.assignedEmployeeId.options.index === true);

assert("assignedEmployeeName is String", paths.assignedEmployeeName.instance === "String");
assert("assignedEmployeeName required", paths.assignedEmployeeName.isRequired === true);
assert("assignedEmployeeName trim", paths.assignedEmployeeName.options.trim === true);

assert("assignedEmployeeCode is String", paths.assignedEmployeeCode.instance === "String");
assert("assignedEmployeeCode default empty string", paths.assignedEmployeeCode.defaultValue === "");
assert("assignedEmployeeCode trim", paths.assignedEmployeeCode.options.trim === true);

assert("assignedBy is ObjectId", paths.assignedBy.instance === "ObjectId");
assert("assignedBy ref User", paths.assignedBy.options.ref === "User");
assert("assignedBy required", paths.assignedBy.isRequired === true);

assert("assignedByName is String", paths.assignedByName.instance === "String");
assert("assignedByName default empty string", paths.assignedByName.defaultValue === "");
assert("assignedByName trim", paths.assignedByName.options.trim === true);

assert("priority is String", paths.priority.instance === "String");
assert("priority default Medium", paths.priority.defaultValue === "Medium");
assert("priority trim", paths.priority.options.trim === true);
assert("priority index", paths.priority.options.index === true);

assert("status is String", paths.status.instance === "String");
assert("status default Assigned", paths.status.defaultValue === "Assigned");
assert("status trim", paths.status.options.trim === true);
assert("status index", paths.status.options.index === true);

assert("progress is Number", paths.progress.instance === "Number");
assert("progress default 0", paths.progress.defaultValue === 0);
assert("progress min 0", paths.progress.options.min === 0);
assert("progress max 100", paths.progress.options.max === 100);

assert("startDate is Date", paths.startDate.instance === "Date");
assert("startDate default null", paths.startDate.defaultValue === null);

assert("dueDate is Date", paths.dueDate.instance === "Date");
assert("dueDate required", paths.dueDate.isRequired === true);
assert("dueDate index", paths.dueDate.options.index === true);

assert("completedAt is Date", paths.completedAt.instance === "Date");
assert("completedAt default null", paths.completedAt.defaultValue === null);

assert("estimatedMinutes is Number", paths.estimatedMinutes.instance === "Number");
assert("estimatedMinutes default 0", paths.estimatedMinutes.defaultValue === 0);
assert("estimatedMinutes min 0", paths.estimatedMinutes.options.min === 0);

assert("spentMinutes is Number", paths.spentMinutes.instance === "Number");
assert("spentMinutes default 0", paths.spentMinutes.defaultValue === 0);
assert("spentMinutes min 0", paths.spentMinutes.options.min === 0);

assert("startedAt is Date", paths.startedAt.instance === "Date");
assert("startedAt default null", paths.startedAt.defaultValue === null);

assert("pausedAt is Date", paths.pausedAt.instance === "Date");
assert("pausedAt default null", paths.pausedAt.defaultValue === null);

assert("totalPausedMinutes is Number", paths.totalPausedMinutes.instance === "Number");
assert("totalPausedMinutes default 0", paths.totalPausedMinutes.defaultValue === 0);
assert("totalPausedMinutes min 0", paths.totalPausedMinutes.options.min === 0);

assert("elapsedMinutes is Number", paths.elapsedMinutes.instance === "Number");
assert("elapsedMinutes default 0", paths.elapsedMinutes.defaultValue === 0);
assert("elapsedMinutes min 0", paths.elapsedMinutes.options.min === 0);

assert("elapsedSeconds is Number", paths.elapsedSeconds.instance === "Number");
assert("elapsedSeconds default 0", paths.elapsedSeconds.defaultValue === 0);
assert("elapsedSeconds min 0", paths.elapsedSeconds.options.min === 0);

assert("lastUpdated is Date", paths.lastUpdated.instance === "Date");
assert("lastUpdated default null", paths.lastUpdated.defaultValue === null);

assert("resolutionNote is String", paths.resolutionNote.instance === "String");
assert("resolutionNote default empty string", paths.resolutionNote.defaultValue === "");
assert("resolutionNote trim", paths.resolutionNote.options.trim === true);

assert("blockerReason is String", paths.blockerReason.instance === "String");
assert("blockerReason default empty string", paths.blockerReason.defaultValue === "");
assert("blockerReason trim", paths.blockerReason.options.trim === true);

assert("waitingFor is String", paths.waitingFor.instance === "String");
assert("waitingFor default empty string", paths.waitingFor.defaultValue === "");
assert("waitingFor trim", paths.waitingFor.options.trim === true);

assert("expectedResolutionDate is Date", paths.expectedResolutionDate.instance === "Date");
assert("expectedResolutionDate default null", paths.expectedResolutionDate.defaultValue === null);

assert("isDeleted is Boolean", paths.isDeleted.instance === "Boolean");
assert("isDeleted default false", paths.isDeleted.defaultValue === false);
assert("isDeleted index", paths.isDeleted.options.index === true);

// ── 5. Subdocument Schemas ───────────────────────────────────────────────────
console.log("\n[5] Subdocument Schemas");

// Checklist
assert("checklist is Array", paths.checklist.instance === "Array");
const checklistSchema = paths.checklist.schema;
assert("checklist text is String", checklistSchema.paths.text.instance === "String");
assert("checklist text required", checklistSchema.paths.text.isRequired === true);
assert("checklist text trim", checklistSchema.paths.text.options.trim === true);
assert("checklist completed is Boolean", checklistSchema.paths.completed.instance === "Boolean");
assert("checklist completed default false", checklistSchema.paths.completed.defaultValue === false);
assert("checklist completedBy is ObjectId", checklistSchema.paths.completedBy.instance === "ObjectId");
assert("checklist completedBy ref User", checklistSchema.paths.completedBy.options.ref === "User");
assert("checklist completedBy default null", checklistSchema.paths.completedBy.defaultValue === null);
assert("checklist completedByName is String", checklistSchema.paths.completedByName.instance === "String");
assert("checklist completedByName default empty", checklistSchema.paths.completedByName.defaultValue === "");
assert("checklist completedByName trim", checklistSchema.paths.completedByName.options.trim === true);
assert("checklist completedAt is Date", checklistSchema.paths.completedAt.instance === "Date");
assert("checklist completedAt default null", checklistSchema.paths.completedAt.defaultValue === null);

// Timeline
assert("timeline is Array", paths.timeline.instance === "Array");
const timelineSchema = paths.timeline.schema;
assert("timeline action is String", timelineSchema.paths.action.instance === "String");
assert("timeline action required", timelineSchema.paths.action.isRequired === true);
assert("timeline action trim", timelineSchema.paths.action.options.trim === true);
assert("timeline description is String", timelineSchema.paths.description.instance === "String");
assert("timeline description default empty", timelineSchema.paths.description.defaultValue === "");
assert("timeline description trim", timelineSchema.paths.description.options.trim === true);
assert("timeline performedBy is ObjectId", timelineSchema.paths.performedBy.instance === "ObjectId");
assert("timeline performedBy ref User", timelineSchema.paths.performedBy.options.ref === "User");
assert("timeline performedBy default null", timelineSchema.paths.performedBy.defaultValue === null);
assert("timeline performedByName is String", timelineSchema.paths.performedByName.instance === "String");
assert("timeline performedByName default empty", timelineSchema.paths.performedByName.defaultValue === "");
assert("timeline performedByName trim", timelineSchema.paths.performedByName.options.trim === true);
assert("timeline performedByRole is String", timelineSchema.paths.performedByRole.instance === "String");
assert(
  "timeline performedByRole enums",
  JSON.stringify(timelineSchema.paths.performedByRole.enumValues) ===
    JSON.stringify(["admin", "employee", "client", "system"])
);
assert("timeline performedByRole default system", timelineSchema.paths.performedByRole.defaultValue === "system");
assert("timeline createdAt is Date", timelineSchema.paths.createdAt.instance === "Date");

// Comments
assert("comments is Array", paths.comments.instance === "Array");
const commentSchema = paths.comments.schema;
assert("comments message is String", commentSchema.paths.message.instance === "String");
assert("comments message required", commentSchema.paths.message.isRequired === true);
assert("comments message trim", commentSchema.paths.message.options.trim === true);
assert("comments authorId is ObjectId", commentSchema.paths.authorId.instance === "ObjectId");
assert("comments authorId ref User", commentSchema.paths.authorId.options.ref === "User");
assert("comments authorId default null", commentSchema.paths.authorId.defaultValue === null);
assert("comments authorName is String", commentSchema.paths.authorName.instance === "String");
assert("comments authorName default empty", commentSchema.paths.authorName.defaultValue === "");
assert("comments authorName trim", commentSchema.paths.authorName.options.trim === true);
assert("comments authorRole is String", commentSchema.paths.authorRole.instance === "String");
assert(
  "comments authorRole enums",
  JSON.stringify(commentSchema.paths.authorRole.enumValues) ===
    JSON.stringify(["admin", "employee", "client"])
);
assert("comments authorRole default admin", commentSchema.paths.authorRole.defaultValue === "admin");
assert("comments createdAt is Date", commentSchema.paths.createdAt.instance === "Date");

// Attachments
assert("attachments is Array", paths.attachments.instance === "Array");
const attachmentSchema = paths.attachments.schema;
assert("attachments fileName is String", attachmentSchema.paths.fileName.instance === "String");
assert("attachments fileName required", attachmentSchema.paths.fileName.isRequired === true);
assert("attachments fileName trim", attachmentSchema.paths.fileName.options.trim === true);
assert("attachments fileUrl is String", attachmentSchema.paths.fileUrl.instance === "String");
assert("attachments fileUrl required", attachmentSchema.paths.fileUrl.isRequired === true);
assert("attachments fileUrl trim", attachmentSchema.paths.fileUrl.options.trim === true);
assert("attachments fileType is String", attachmentSchema.paths.fileType.instance === "String");
assert("attachments fileType default empty", attachmentSchema.paths.fileType.defaultValue === "");
assert("attachments fileType trim", attachmentSchema.paths.fileType.options.trim === true);
assert("attachments fileSize is Number", attachmentSchema.paths.fileSize.instance === "Number");
assert("attachments fileSize default 0", attachmentSchema.paths.fileSize.defaultValue === 0);
assert("attachments fileSize min 0", attachmentSchema.paths.fileSize.options.min === 0);
assert("attachments uploadedBy is ObjectId", attachmentSchema.paths.uploadedBy.instance === "ObjectId");
assert("attachments uploadedBy ref User", attachmentSchema.paths.uploadedBy.options.ref === "User");
assert("attachments uploadedBy default null", attachmentSchema.paths.uploadedBy.defaultValue === null);
assert("attachments uploadedByName is String", attachmentSchema.paths.uploadedByName.instance === "String");
assert("attachments uploadedByName default empty", attachmentSchema.paths.uploadedByName.defaultValue === "");
assert("attachments uploadedByName trim", attachmentSchema.paths.uploadedByName.options.trim === true);
assert("attachments uploadedAt is Date", attachmentSchema.paths.uploadedAt.instance === "Date");

// ── 6. Idempotency & Mongoose Registration ───────────────────────────────────
console.log("\n[6] Idempotency & Mongoose Registration");
const requiredAgain = require("./models/Task");
assert("Idempotent require returns identical reference", requiredAgain === Task);
assert("mongoose.models.Task is set", mongoose.models.Task === Task);
assert("mongoose.model('Task') resolves to Task", mongoose.model("Task") === Task);

// ── Summary ──────────────────────────────────────────────────────────────────
console.log("\n================================================================================");
console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("All Task model offline verification checks passed successfully!");
  process.exit(0);
}
