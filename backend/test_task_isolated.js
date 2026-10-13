"use strict";
/**
 * test_task_isolated.js
 * Isolated functional integration test suite for the centralized Task model.
 * Connects to a dedicated temporary local database and drops it on completion.
 */

const mongoose = require("mongoose");

const TEST_DB_NAME = `crm_isolated_task_test_${Date.now()}`;
const TEST_URI = `mongodb://127.0.0.1:27017/${TEST_DB_NAME}`;

let passed = 0;
let failed = 0;

function assert(label, cond) {
  if (cond) {
    console.log("  PASS:", label);
    passed++;
  } else {
    console.error("  FAIL:", label);
    failed++;
  }
}

async function runIsolatedTests() {
  console.log("================================================================================");
  console.log("   TASK MODEL ISOLATED FUNCTIONAL INTEGRATION TEST                              ");
  console.log("================================================================================");
  console.log(`Connecting to ISOLATED database: ${TEST_URI}`);
  console.log(`Target Database Name: ${TEST_DB_NAME}`);

  await mongoose.connect(TEST_URI);
  console.log(`Connected successfully. Active DB: ${mongoose.connection.name}`);

  try {
    const Task = require("./models/Task");

    // ── 1. Model registration & collection name ──────────────────────────────
    console.log("\n[1] Model registration & collection name");
    assert("Model name is Task", Task.modelName === "Task");
    assert("Collection name is tasks", Task.collection.name === "tasks");
    assert("mongoose.models.Task matches export", mongoose.models.Task === Task);

    // ── 2. Index building & verification on live MongoDB instance ────────────
    console.log("\n[2] Index building & verification");
    await Task.init();
    const mongoIndexes = await Task.collection.indexes();
    console.log("  Built MongoDB indexes:", JSON.stringify(mongoIndexes.map((i) => ({ key: i.key, name: i.name, unique: i.unique }))));

    assert("taskCode unique index exists in MongoDB", mongoIndexes.some((idx) => idx.key.taskCode === 1 && idx.unique === true));
    assert("assignedEmployeeId index exists in MongoDB", mongoIndexes.some((idx) => idx.key.assignedEmployeeId === 1));
    assert("priority index exists in MongoDB", mongoIndexes.some((idx) => idx.key.priority === 1));
    assert("status index exists in MongoDB", mongoIndexes.some((idx) => idx.key.status === 1));
    assert("dueDate index exists in MongoDB", mongoIndexes.some((idx) => idx.key.dueDate === 1));
    assert("isDeleted index exists in MongoDB", mongoIndexes.some((idx) => idx.key.isDeleted === 1));
    assert("projectId index exists in MongoDB", mongoIndexes.some((idx) => idx.key.projectId === 1));
    assert("taskFor index exists in MongoDB", mongoIndexes.some((idx) => idx.key.taskFor === 1));

    // ── 3. Successful creation with defaults ─────────────────────────────────
    console.log("\n[3] Successful creation with defaults");
    const empId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();
    const projId = new mongoose.Types.ObjectId();

    const task1 = await Task.create({
      taskCode: "TSK-TEST-001",
      title: "Implement Centralized Task Model",
      assignedEmployeeId: empId,
      assignedEmployeeName: "Omkar Test",
      assignedBy: userId,
      dueDate: new Date(Date.now() + 86400000),
      projectId: projId,
      projectName: "Client Connect Track CRM",
    });

    assert("task1 persisted with _id", Boolean(task1._id));
    assert("taskCode uppercase", task1.taskCode === "TSK-TEST-001");
    assert("workType default Client Support", task1.workType === "Client Support");
    assert("taskFor default Project", task1.taskFor === "Project");
    assert("clientName default Internal Development", task1.clientName === "Internal Development");
    assert("priority default Medium", task1.priority === "Medium");
    assert("status default Assigned", task1.status === "Assigned");
    assert("progress default 0", task1.progress === 0);
    assert("isDeleted default false", task1.isDeleted === false);
    assert("checklist default empty array", Array.isArray(task1.checklist) && task1.checklist.length === 0);
    assert("timeline default empty array", Array.isArray(task1.timeline) && task1.timeline.length === 0);
    assert("comments default empty array", Array.isArray(task1.comments) && task1.comments.length === 0);
    assert("attachments default empty array", Array.isArray(task1.attachments) && task1.attachments.length === 0);
    assert("createdAt timestamp populated", task1.createdAt instanceof Date);
    assert("updatedAt timestamp populated", task1.updatedAt instanceof Date);

    // ── 4. Validation error tests ────────────────────────────────────────────
    console.log("\n[4] Validation error tests");

    // Missing taskCode
    let valErr = null;
    try {
      await Task.create({
        title: "Missing taskCode",
        assignedEmployeeId: empId,
        assignedEmployeeName: "Test",
        assignedBy: userId,
        dueDate: new Date(),
      });
    } catch (e) {
      valErr = e;
    }
    assert("Missing taskCode rejects", Boolean(valErr && valErr.name === "ValidationError"));

    // Missing title
    valErr = null;
    try {
      await Task.create({
        taskCode: "TSK-ERR-001",
        assignedEmployeeId: empId,
        assignedEmployeeName: "Test",
        assignedBy: userId,
        dueDate: new Date(),
      });
    } catch (e) {
      valErr = e;
    }
    assert("Missing title rejects with custom message", Boolean(valErr && valErr.errors.title));

    // Missing assignedEmployeeId
    valErr = null;
    try {
      await Task.create({
        taskCode: "TSK-ERR-002",
        title: "Test Task",
        assignedEmployeeName: "Test",
        assignedBy: userId,
        dueDate: new Date(),
      });
    } catch (e) {
      valErr = e;
    }
    assert("Missing assignedEmployeeId rejects", Boolean(valErr && valErr.errors.assignedEmployeeId));

    // Missing dueDate
    valErr = null;
    try {
      await Task.create({
        taskCode: "TSK-ERR-003",
        title: "Test Task",
        assignedEmployeeId: empId,
        assignedEmployeeName: "Test",
        assignedBy: userId,
      });
    } catch (e) {
      valErr = e;
    }
    assert("Missing dueDate rejects", Boolean(valErr && valErr.errors.dueDate));

    // Invalid workType enum
    valErr = null;
    try {
      await Task.create({
        taskCode: "TSK-ERR-004",
        title: "Test Task",
        assignedEmployeeId: empId,
        assignedEmployeeName: "Test",
        assignedBy: userId,
        dueDate: new Date(),
        workType: "InvalidType",
      });
    } catch (e) {
      valErr = e;
    }
    assert("Invalid workType rejects", Boolean(valErr && valErr.errors.workType));

    // Invalid taskFor enum
    valErr = null;
    try {
      await Task.create({
        taskCode: "TSK-ERR-005",
        title: "Test Task",
        assignedEmployeeId: empId,
        assignedEmployeeName: "Test",
        assignedBy: userId,
        dueDate: new Date(),
        taskFor: "InvalidTaskFor",
      });
    } catch (e) {
      valErr = e;
    }
    assert("Invalid taskFor rejects", Boolean(valErr && valErr.errors.taskFor));

    // Progress out of bounds (> 100)
    valErr = null;
    try {
      await Task.create({
        taskCode: "TSK-ERR-006",
        title: "Test Task",
        assignedEmployeeId: empId,
        assignedEmployeeName: "Test",
        assignedBy: userId,
        dueDate: new Date(),
        progress: 150,
      });
    } catch (e) {
      valErr = e;
    }
    assert("Progress > 100 rejects", Boolean(valErr && valErr.errors.progress));

    // Duplicate taskCode unique constraint
    let dupErr = null;
    try {
      await Task.create({
        taskCode: "TSK-TEST-001",
        title: "Duplicate Task Code",
        assignedEmployeeId: empId,
        assignedEmployeeName: "Test",
        assignedBy: userId,
        dueDate: new Date(),
      });
    } catch (e) {
      dupErr = e;
    }
    assert("Duplicate taskCode triggers E11000 duplicate key error", Boolean(dupErr && dupErr.code === 11000));

    // ── 5. Checklist operations ──────────────────────────────────────────────
    console.log("\n[5] Checklist subdocument operations");
    task1.checklist.push({
      text: "Write schema verification test",
      completed: false,
    });
    task1.checklist.push({
      text: "Write isolated functional test",
      completed: true,
      completedBy: userId,
      completedByName: "Mangesh Kondhare",
      completedAt: new Date(),
    });
    await task1.save();

    const reloadedTask1 = await Task.findById(task1._id);
    assert("Checklist length is 2", reloadedTask1.checklist.length === 2);
    assert("First checklist item not completed", reloadedTask1.checklist[0].completed === false);
    assert("Second checklist item completed", reloadedTask1.checklist[1].completed === true);
    assert("Second checklist item completedByName correct", reloadedTask1.checklist[1].completedByName === "Mangesh Kondhare");
    assert("Checklist items have subdocument _ids", Boolean(reloadedTask1.checklist[0]._id && reloadedTask1.checklist[1]._id));

    // ── 6. Timeline and audit trail operations ───────────────────────────────
    console.log("\n[6] Timeline operations");
    task1.timeline.push({
      action: "Task Created",
      description: "Initial task creation by Admin",
      performedBy: userId,
      performedByName: "Admin User",
      performedByRole: "admin",
    });
    task1.timeline.push({
      action: "Status Changed to In Progress",
      description: "Employee started work",
      performedBy: empId,
      performedByName: "Omkar Test",
      performedByRole: "employee",
    });
    await task1.save();

    const taskWithTimeline = await Task.findById(task1._id);
    assert("Timeline entries count is 2", taskWithTimeline.timeline.length === 2);
    assert("First action is Task Created", taskWithTimeline.timeline[0].action === "Task Created");
    assert("Second action role is employee", taskWithTimeline.timeline[1].performedByRole === "employee");

    // ── 7. Comments and Attachments operations ───────────────────────────────
    console.log("\n[7] Comments and attachments operations");
    task1.comments.push({
      message: "Please ensure schema test coverage is 100%",
      authorId: userId,
      authorName: "Admin User",
      authorRole: "admin",
    });
    task1.attachments.push({
      fileName: "architecture_diagram.png",
      fileUrl: "/uploads/tasks/architecture_diagram.png",
      fileType: "image/png",
      fileSize: 1048576,
      uploadedBy: userId,
      uploadedByName: "Admin User",
    });
    await task1.save();

    const taskWithCommentsAndFiles = await Task.findById(task1._id);
    assert("Comments length is 1", taskWithCommentsAndFiles.comments.length === 1);
    assert("Comment message matches", taskWithCommentsAndFiles.comments[0].message === "Please ensure schema test coverage is 100%");
    assert("Attachments length is 1", taskWithCommentsAndFiles.attachments.length === 1);
    assert("Attachment fileUrl matches", taskWithCommentsAndFiles.attachments[0].fileUrl === "/uploads/tasks/architecture_diagram.png");
    assert("Attachment fileSize matches", taskWithCommentsAndFiles.attachments[0].fileSize === 1048576);

    // ── 8. Status transitions & progress updates ─────────────────────────────
    console.log("\n[8] Status transitions & progress updates");
    task1.status = "In Progress";
    task1.progress = 50;
    task1.startedAt = new Date();
    task1.spentMinutes = 120;
    task1.lastUpdated = new Date();
    await task1.save();

    let updated = await Task.findById(task1._id);
    assert("Status transitioned to In Progress", updated.status === "In Progress");
    assert("Progress updated to 50", updated.progress === 50);
    assert("spentMinutes updated to 120", updated.spentMinutes === 120);

    task1.status = "Completed";
    task1.progress = 100;
    task1.completedAt = new Date();
    task1.spentMinutes = 240;
    task1.resolutionNote = "Task completed cleanly with full test pass";
    await task1.save();

    updated = await Task.findById(task1._id);
    assert("Status transitioned to Completed", updated.status === "Completed");
    assert("Progress updated to 100", updated.progress === 100);
    assert("completedAt populated", Boolean(updated.completedAt));
    assert("resolutionNote populated", updated.resolutionNote === "Task completed cleanly with full test pass");

    // ── 9. Soft delete and querying ──────────────────────────────────────────
    console.log("\n[9] Soft delete and querying");
    const activeBeforeDelete = await Task.countDocuments({ isDeleted: false });
    assert("Active tasks count before soft delete is 1", activeBeforeDelete === 1);

    task1.isDeleted = true;
    await task1.save();

    const activeAfterDelete = await Task.countDocuments({ isDeleted: false });
    const allTasks = await Task.countDocuments({});
    assert("Active tasks count after soft delete is 0", activeAfterDelete === 0);
    assert("Total tasks count remains 1", allTasks === 1);

  } finally {
    // ── Teardown: Drop isolated test database ────────────────────────────────
    console.log("\n[10] Teardown & Database cleanup");
    try {
      console.log(`Dropping isolated test database: ${TEST_DB_NAME}...`);
      await mongoose.connection.dropDatabase();
      console.log("Database dropped successfully.");
    } catch (dropErr) {
      console.error("Warning: Failed to drop test database:", dropErr.message);
    }
    await mongoose.disconnect();
    console.log("Disconnected from isolated test MongoDB instance.");
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n================================================================================");
  console.log(`TOTAL ISOLATED CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("All isolated Task integration checks passed successfully!");
    process.exit(0);
  }
}

runIsolatedTests().catch((err) => {
  console.error("Unhandled error in isolated tests:", err);
  process.exit(1);
});
