"use strict";
/**
 * verify_supportticket_model.js
 * Comprehensive offline schema verification suite for the centralized SupportTicket model.
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
console.log("   SUPPORTTICKET MODEL OFFLINE SCHEMA VERIFICATION                              ");
console.log("================================================================================");

// Require all 14 centralized models to verify zero collisions
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
const SupportTicket = require("./models/SupportTicket");

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
assert("SupportTicket.modelName", SupportTicket.modelName === "SupportTicket");

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
assert("SupportTicket collection", SupportTicket.collection.name === "supporttickets");

// ── 3. Options & Timestamps ──────────────────────────────────────────────────
console.log("\n[3] Options & Timestamps");
assert("SupportTicket timestamps enabled", SupportTicket.schema.options.timestamps === true);
assert("createdAt path exists", SupportTicket.schema.paths.createdAt !== undefined);
assert("updatedAt path exists", SupportTicket.schema.paths.updatedAt !== undefined);

// ── 4. Main Schema Paths and Types ───────────────────────────────────────────
console.log("\n[4] Main Schema Paths and Types");
const paths = SupportTicket.schema.paths;

assert("ticketCode is String", paths.ticketCode.instance === "String");
assert("ticketCode required", paths.ticketCode.isRequired === true);
assert("ticketCode trim", paths.ticketCode.options.trim === true);
assert("ticketCode uppercase", paths.ticketCode.options.uppercase === true);
assert("ticketCode unique", paths.ticketCode.options.unique === true);
assert("ticketCode index", paths.ticketCode.options.index === true);

assert("title is String", paths.title.instance === "String");
assert("title required", paths.title.isRequired === true);
assert("title trim", paths.title.options.trim === true);

assert("description is String", paths.description.instance === "String");
assert("description required", paths.description.isRequired === true);
assert("description trim", paths.description.options.trim === true);

assert("clientId is ObjectId", paths.clientId.instance === "ObjectId");
assert("clientId ref Client", paths.clientId.options.ref === "Client");
assert("clientId required", paths.clientId.isRequired === true);
assert("clientId index", paths.clientId.options.index === true);

assert("clientCode is String", paths.clientCode.instance === "String");
assert("clientCode default empty string", paths.clientCode.defaultValue === "");
assert("clientCode trim", paths.clientCode.options.trim === true);

assert("clientName is String", paths.clientName.instance === "String");
assert("clientName required", paths.clientName.isRequired === true);
assert("clientName trim", paths.clientName.options.trim === true);

assert("contactPerson is String", paths.contactPerson.instance === "String");
assert("contactPerson default empty string", paths.contactPerson.defaultValue === "");
assert("contactPerson trim", paths.contactPerson.options.trim === true);

assert("contactMobile is String", paths.contactMobile.instance === "String");
assert("contactMobile default empty string", paths.contactMobile.defaultValue === "");
assert("contactMobile trim", paths.contactMobile.options.trim === true);

assert("contactEmail is String", paths.contactEmail.instance === "String");
assert("contactEmail default empty string", paths.contactEmail.defaultValue === "");
assert("contactEmail trim", paths.contactEmail.options.trim === true);

assert("productId is ObjectId", paths.productId.instance === "ObjectId");
assert("productId default null", paths.productId.defaultValue === null);

assert("productName is String", paths.productName.instance === "String");
assert("productName required", paths.productName.isRequired === true);
assert("productName trim", paths.productName.options.trim === true);
assert("productName index", paths.productName.options.index === true);

assert("productVersion is String", paths.productVersion.instance === "String");
assert("productVersion default empty string", paths.productVersion.defaultValue === "");
assert("productVersion trim", paths.productVersion.options.trim === true);

assert("module is String", paths.module.instance === "String");
assert("module default is General", paths.module.defaultValue === "General");
assert("module trim", paths.module.options.trim === true);

assert("category is String", paths.category.instance === "String");
assert("category default Other", paths.category.defaultValue === "Other");
const expectedCategories = [
  "Billing",
  "Reports",
  "Inventory",
  "Accounts",
  "GST",
  "Backup",
  "Login",
  "Bug",
  "Configuration",
  "Data Issue",
  "Feature Request",
  "Installation",
  "Training",
  "Permission",
  "Performance",
  "Report",
  "Other",
];
assert("category enums match exactly", JSON.stringify(paths.category.enumValues) === JSON.stringify(expectedCategories));

assert("source is String", paths.source.instance === "String");
assert("source default Admin", paths.source.defaultValue === "Admin");
assert("source index is true", paths.source.options.index === true);
const expectedSources = ["Client Portal", "Phone Call", "WhatsApp", "Email", "Admin"];
assert("source enums match exactly", JSON.stringify(paths.source.enumValues) === JSON.stringify(expectedSources));

assert("priority is String", paths.priority.instance === "String");
assert("priority default Medium", paths.priority.defaultValue === "Medium");
assert("priority trim", paths.priority.options.trim === true);
assert("priority index", paths.priority.options.index === true);

assert("status is String", paths.status.instance === "String");
assert("status default New", paths.status.defaultValue === "New");
assert("status index", paths.status.options.index === true);
const expectedStatuses = [
  "New",
  "Assigned",
  "In Progress",
  "Waiting for Client",
  "Testing",
  "Resolved",
  "Verified",
  "Closed",
  "Cancelled",
];
assert("status enums match exactly", JSON.stringify(paths.status.enumValues) === JSON.stringify(expectedStatuses));

assert("assignedEmployeeId is ObjectId", paths.assignedEmployeeId.instance === "ObjectId");
assert("assignedEmployeeId ref Employee", paths.assignedEmployeeId.options.ref === "Employee");
assert("assignedEmployeeId default null", paths.assignedEmployeeId.defaultValue === null);
assert("assignedEmployeeId index", paths.assignedEmployeeId.options.index === true);

assert("assignedEmployeeName is String", paths.assignedEmployeeName.instance === "String");
assert("assignedEmployeeName default Unassigned", paths.assignedEmployeeName.defaultValue === "Unassigned");
assert("assignedEmployeeName trim", paths.assignedEmployeeName.options.trim === true);

assert("assignedEmployeeCode is String", paths.assignedEmployeeCode.instance === "String");
assert("assignedEmployeeCode default empty string", paths.assignedEmployeeCode.defaultValue === "");
assert("assignedEmployeeCode trim", paths.assignedEmployeeCode.options.trim === true);

assert("assignedAt is Date", paths.assignedAt.instance === "Date");
assert("assignedAt default null", paths.assignedAt.defaultValue === null);

assert("assignedBy is ObjectId", paths.assignedBy.instance === "ObjectId");
assert("assignedBy ref User", paths.assignedBy.options.ref === "User");
assert("assignedBy default null", paths.assignedBy.defaultValue === null);

assert("assignedByName is String", paths.assignedByName.instance === "String");
assert("assignedByName default empty string", paths.assignedByName.defaultValue === "");
assert("assignedByName trim", paths.assignedByName.options.trim === true);

assert("dueDate is Date", paths.dueDate.instance === "Date");
assert("dueDate default null", paths.dueDate.defaultValue === null);
assert("dueDate index", paths.dueDate.options.index === true);

assert("firstResponseAt is Date", paths.firstResponseAt.instance === "Date");
assert("firstResponseAt default null", paths.firstResponseAt.defaultValue === null);

assert("resolvedAt is Date", paths.resolvedAt.instance === "Date");
assert("resolvedAt default null", paths.resolvedAt.defaultValue === null);

assert("verifiedAt is Date", paths.verifiedAt.instance === "Date");
assert("verifiedAt default null", paths.verifiedAt.defaultValue === null);

assert("closedAt is Date", paths.closedAt.instance === "Date");
assert("closedAt default null", paths.closedAt.defaultValue === null);

assert("slaFirstResponseMinutes is Number", paths.slaFirstResponseMinutes.instance === "Number");
assert("slaFirstResponseMinutes default null", paths.slaFirstResponseMinutes.defaultValue === null);

assert("slaResolutionMinutes is Number", paths.slaResolutionMinutes.instance === "Number");
assert("slaResolutionMinutes default null", paths.slaResolutionMinutes.defaultValue === null);

assert("firstResponseDueAt is Date", paths.firstResponseDueAt.instance === "Date");
assert("firstResponseDueAt default null", paths.firstResponseDueAt.defaultValue === null);
assert("firstResponseDueAt index", paths.firstResponseDueAt.options.index === true);

assert("resolutionDueAt is Date", paths.resolutionDueAt.instance === "Date");
assert("resolutionDueAt default null", paths.resolutionDueAt.defaultValue === null);
assert("resolutionDueAt index", paths.resolutionDueAt.options.index === true);

assert("firstResolvedAt is Date", paths.firstResolvedAt.instance === "Date");
assert("firstResolvedAt default null", paths.firstResolvedAt.defaultValue === null);

assert("slaPolicyVersion is String", paths.slaPolicyVersion.instance === "String");
assert("slaPolicyVersion default empty string", paths.slaPolicyVersion.defaultValue === "");
assert("slaPolicyVersion trim", paths.slaPolicyVersion.options.trim === true);

assert("resolutionNote is String", paths.resolutionNote.instance === "String");
assert("resolutionNote default empty string", paths.resolutionNote.defaultValue === "");
assert("resolutionNote trim", paths.resolutionNote.options.trim === true);

assert("rootCause is String", paths.rootCause.instance === "String");
assert("rootCause default empty string", paths.rootCause.defaultValue === "");
assert("rootCause trim", paths.rootCause.options.trim === true);

assert("linkedTaskId is ObjectId", paths.linkedTaskId.instance === "ObjectId");
assert("linkedTaskId ref Task", paths.linkedTaskId.options.ref === "Task");
assert("linkedTaskId default null", paths.linkedTaskId.defaultValue === null);
assert("linkedTaskId index", paths.linkedTaskId.options.index === true);

assert("linkedTaskCode is String", paths.linkedTaskCode.instance === "String");
assert("linkedTaskCode default empty string", paths.linkedTaskCode.defaultValue === "");
assert("linkedTaskCode trim", paths.linkedTaskCode.options.trim === true);

assert("spentMinutes is Number", paths.spentMinutes.instance === "Number");
assert("spentMinutes default 0", paths.spentMinutes.defaultValue === 0);
assert("spentMinutes min 0", paths.spentMinutes.options.min === 0);

assert("createdBy is ObjectId", paths.createdBy.instance === "ObjectId");
assert("createdBy ref User", paths.createdBy.options.ref === "User");
assert("createdBy default null", paths.createdBy.defaultValue === null);

assert("createdByName is String", paths.createdByName.instance === "String");
assert("createdByName default empty string", paths.createdByName.defaultValue === "");
assert("createdByName trim", paths.createdByName.options.trim === true);

assert("createdByRole is String", paths.createdByRole.instance === "String");
assert("createdByRole default admin", paths.createdByRole.defaultValue === "admin");
assert(
  "createdByRole enums",
  JSON.stringify(paths.createdByRole.enumValues) === JSON.stringify(["admin", "employee", "client", "system"])
);

assert("isDeleted is Boolean", paths.isDeleted.instance === "Boolean");
assert("isDeleted default false", paths.isDeleted.defaultValue === false);
assert("isDeleted index", paths.isDeleted.options.index === true);

// ── 5. Subdocument Schemas ───────────────────────────────────────────────────
console.log("\n[5] Subdocument Schemas");

// Timeline
assert("timeline is Array", paths.timeline.instance === "Array");
const timelineSchema = paths.timeline.schema;
assert("timeline type is String", timelineSchema.paths.type.instance === "String");
const expectedTimelineTypes = [
  "created",
  "assigned",
  "status",
  "reply",
  "attachment",
  "call",
  "resolved",
  "closed",
  "reopened",
  "task",
  "updated",
  "deleted",
  "feedback",
];
assert(
  "timeline type enums",
  JSON.stringify(timelineSchema.paths.type.enumValues) === JSON.stringify(expectedTimelineTypes)
);
assert("timeline type default is updated", timelineSchema.paths.type.defaultValue === "updated");
assert("timeline title is String", timelineSchema.paths.title.instance === "String");
assert("timeline title required", timelineSchema.paths.title.isRequired === true);
assert("timeline title trim", timelineSchema.paths.title.options.trim === true);
assert("timeline description is String", timelineSchema.paths.description.instance === "String");
assert("timeline performedBy is ObjectId", timelineSchema.paths.performedBy.instance === "ObjectId");
assert("timeline performedBy ref User", timelineSchema.paths.performedBy.options.ref === "User");
assert("timeline performedByRole is String", timelineSchema.paths.performedByRole.instance === "String");
assert("timeline performedByRole default system", timelineSchema.paths.performedByRole.defaultValue === "system");
assert("timeline createdAt is Date", timelineSchema.paths.createdAt.instance === "Date");

// Internal Notes
assert("internalNotes is Array", paths.internalNotes.instance === "Array");
const noteSchema = paths.internalNotes.schema;
assert("internalNotes note is String", noteSchema.paths.note.instance === "String");
assert("internalNotes note required", noteSchema.paths.note.isRequired === true);
assert("internalNotes note trim", noteSchema.paths.note.options.trim === true);
assert("internalNotes authorId is ObjectId", noteSchema.paths.authorId.instance === "ObjectId");
assert("internalNotes authorId ref User", noteSchema.paths.authorId.options.ref === "User");
assert("internalNotes authorRole is String", noteSchema.paths.authorRole.instance === "String");
assert(
  "internalNotes authorRole enums",
  JSON.stringify(noteSchema.paths.authorRole.enumValues) === JSON.stringify(["admin", "employee"])
);
assert("internalNotes authorRole default employee", noteSchema.paths.authorRole.defaultValue === "employee");
assert("internalNotes createdAt is Date", noteSchema.paths.createdAt.instance === "Date");

// Replies
assert("replies is Array", paths.replies.instance === "Array");
const replySchema = paths.replies.schema;
assert("replies message is String", replySchema.paths.message.instance === "String");
assert("replies message required", replySchema.paths.message.isRequired === true);
assert("replies message trim", replySchema.paths.message.options.trim === true);
assert("replies replyType is String", replySchema.paths.replyType.instance === "String");
assert(
  "replies replyType enums",
  JSON.stringify(replySchema.paths.replyType.enumValues) === JSON.stringify(["Public", "Internal"])
);
assert("replies replyType default Public", replySchema.paths.replyType.defaultValue === "Public");
assert("replies authorId is ObjectId", replySchema.paths.authorId.instance === "ObjectId");
assert("replies authorId ref User", replySchema.paths.authorId.options.ref === "User");
assert("replies authorRole is String", replySchema.paths.authorRole.instance === "String");
assert(
  "replies authorRole enums",
  JSON.stringify(replySchema.paths.authorRole.enumValues) === JSON.stringify(["admin", "employee", "client"])
);
assert("replies authorRole default admin", replySchema.paths.authorRole.defaultValue === "admin");
assert("replies createdAt is Date", replySchema.paths.createdAt.instance === "Date");

// Attachments
assert("attachments is Array", paths.attachments.instance === "Array");
const attachmentSchema = paths.attachments.schema;
assert("attachments fileName is String", attachmentSchema.paths.fileName.instance === "String");
assert("attachments fileName required", attachmentSchema.paths.fileName.isRequired === true);
assert("attachments fileName trim", attachmentSchema.paths.fileName.options.trim === true);
assert("attachments fileUrl is String", attachmentSchema.paths.fileUrl.instance === "String");
assert("attachments fileUrl required", attachmentSchema.paths.fileUrl.isRequired === true);
assert("attachments fileUrl trim", attachmentSchema.paths.fileUrl.options.trim === true);
assert("attachments fileSize is Number", attachmentSchema.paths.fileSize.instance === "Number");
assert("attachments fileSize default 0", attachmentSchema.paths.fileSize.defaultValue === 0);
assert("attachments fileSize min 0", attachmentSchema.paths.fileSize.options.min === 0);
assert("attachments uploadedBy is ObjectId", attachmentSchema.paths.uploadedBy.instance === "ObjectId");
assert("attachments uploadedBy ref User", attachmentSchema.paths.uploadedBy.options.ref === "User");
assert("attachments uploadedByRole is String", attachmentSchema.paths.uploadedByRole.instance === "String");
assert(
  "attachments uploadedByRole enums",
  JSON.stringify(attachmentSchema.paths.uploadedByRole.enumValues) ===
    JSON.stringify(["admin", "employee", "client"])
);
assert("attachments uploadedByRole default admin", attachmentSchema.paths.uploadedByRole.defaultValue === "admin");
assert("attachments uploadedAt is Date", attachmentSchema.paths.uploadedAt.instance === "Date");

// Call Logs
assert("callLogs is Array", paths.callLogs.instance === "Array");
const callLogSchema = paths.callLogs.schema;
assert("callLogs callType is String", callLogSchema.paths.callType.instance === "String");
assert(
  "callLogs callType enums",
  JSON.stringify(callLogSchema.paths.callType.enumValues) === JSON.stringify(["Incoming", "Outgoing"])
);
assert("callLogs callType default Outgoing", callLogSchema.paths.callType.defaultValue === "Outgoing");
assert("callLogs summary is String", callLogSchema.paths.summary.instance === "String");
assert("callLogs summary required", callLogSchema.paths.summary.isRequired === true);
assert("callLogs summary trim", callLogSchema.paths.summary.options.trim === true);
assert("callLogs loggedBy is ObjectId", callLogSchema.paths.loggedBy.instance === "ObjectId");
assert("callLogs loggedBy ref User", callLogSchema.paths.loggedBy.options.ref === "User");
assert("callLogs loggedByRole is String", callLogSchema.paths.loggedByRole.instance === "String");
assert(
  "callLogs loggedByRole enums",
  JSON.stringify(callLogSchema.paths.loggedByRole.enumValues) === JSON.stringify(["admin", "employee"])
);
assert("callLogs loggedByRole default employee", callLogSchema.paths.loggedByRole.defaultValue === "employee");
assert("callLogs createdAt is Date", callLogSchema.paths.createdAt.instance === "Date");

// Client Feedback (Embedded subdocument with _id: false)
assert("clientFeedback path exists", paths.clientFeedback !== undefined);
const feedbackSchema = paths.clientFeedback.schema;
assert("clientFeedback.rating is Number", feedbackSchema.paths.rating.instance === "Number");
assert("clientFeedback.rating required", feedbackSchema.paths.rating.isRequired === true);
assert("clientFeedback.rating min 1", feedbackSchema.paths.rating.options.min === 1);
assert("clientFeedback.rating max 5", feedbackSchema.paths.rating.options.max === 5);
assert("clientFeedback.comment is String", feedbackSchema.paths.comment.instance === "String");
assert("clientFeedback.comment maxlength 1000", feedbackSchema.paths.comment.options.maxlength === 1000);
assert("clientFeedback.submittedAt is Date", feedbackSchema.paths.submittedAt.instance === "Date");
assert("clientFeedback.submittedByClientId is ObjectId", feedbackSchema.paths.submittedByClientId.instance === "ObjectId");
assert("clientFeedback.submittedByClientId ref Client", feedbackSchema.paths.submittedByClientId.options.ref === "Client");

// ── 6. Schema Compound & Text Indexes ─────────────────────────────────────────
console.log("\n[6] Schema Compound & Text Indexes");
const schemaIndexes = SupportTicket.schema.indexes();
assert(
  "Compound index { clientId: 1, status: 1, createdAt: -1 } registered",
  schemaIndexes.some(
    (idx) =>
      idx[0].clientId === 1 && idx[0].status === 1 && idx[0].createdAt === -1
  )
);
assert(
  "Compound index { assignedEmployeeId: 1, status: 1 } registered",
  schemaIndexes.some((idx) => idx[0].assignedEmployeeId === 1 && idx[0].status === 1)
);
assert(
  "Compound text index registered",
  schemaIndexes.some(
    (idx) =>
      idx[0].title === "text" &&
      idx[0].description === "text" &&
      idx[0].clientName === "text" &&
      idx[0].productName === "text" &&
      idx[0].module === "text"
  )
);

// ── 7. Idempotency & Mongoose Registration ───────────────────────────────────
console.log("\n[7] Idempotency & Mongoose Registration");
const requiredAgain = require("./models/SupportTicket");
assert("Idempotent require returns identical reference", requiredAgain === SupportTicket);
assert("mongoose.models.SupportTicket is set", mongoose.models.SupportTicket === SupportTicket);
assert("mongoose.model('SupportTicket') resolves to SupportTicket", mongoose.model("SupportTicket") === SupportTicket);

// ── Summary ──────────────────────────────────────────────────────────────────
console.log("\n================================================================================");
console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("All SupportTicket model offline verification checks passed successfully!");
  process.exit(0);
}
