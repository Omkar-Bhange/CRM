const path = require("path");
const mongoose = require(path.join(__dirname, "../backend/node_modules/mongoose"));
require(path.join(__dirname, "../backend/node_modules/dotenv")).config({
  path: path.join(__dirname, "../backend/.env"),
});

async function verifyProjectModel() {
  console.log("=== VERIFYING PROJECT MODEL CENTRALIZATION ===");

  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/ClientConnectTrack";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB database:", mongoose.connection.name);

  // 1. Check Model Centralization require
  const Project = require("../backend/models/Project");
  console.log("Loaded Project model from backend/models/Project.js");

  // 2. Check registration in mongoose.models
  if (mongoose.models.Project !== Project) {
    throw new Error("Project model instance mismatch in mongoose.models!");
  }
  console.log("PASS: mongoose.models.Project matches required Project");

  // 3. Check collection name
  if (Project.collection.collectionName !== "projects") {
    throw new Error(`Collection name mismatch! Expected 'projects', got '${Project.collection.collectionName}'`);
  }
  console.log("PASS: Collection name is 'projects'");

  // 4. Check schema paths
  const schemaPaths = Object.keys(Project.schema.paths);
  const expectedFields = [
    "projectCode", "projectName", "projectType", "productId", "productCode", "productName",
    "clientId", "clientCode", "clientName", "requirementId", "requirementCode", "finalAmount",
    "amcApplicable", "proposedAmcAmount", "warrantyEndDate", "deliveryDate", "amcContractId",
    "amcContractCode", "amcActivated", "completedBy", "completedByName", "convertedToProduct",
    "convertedProductAt", "convertedProductBy", "convertedProductByName", "description",
    "startDate", "dueDate", "completedDate", "priority", "status", "projectManager",
    "projectManagerName", "stage", "teamMembers", "timeline", "progress", "createdBy",
    "createdByName", "updatedBy", "updatedByName", "isDeleted", "deletedAt", "deletedBy",
    "deletedByName", "createdAt", "updatedAt"
  ];
  for (const field of expectedFields) {
    if (!schemaPaths.includes(field)) {
      throw new Error(`Missing expected schema field: ${field}`);
    }
  }
  console.log(`PASS: All ${expectedFields.length} expected schema fields present`);

  // 5. Check subdocument schemas
  const teamMemberPaths = Object.keys(Project.schema.paths["teamMembers"].schema.paths);
  console.log("teamMembers subdocument paths:", teamMemberPaths);
  const expectedTeamMemberFields = ["employeeId", "employeeName", "employeeCode", "employeeEmail", "role", "responsibility", "addedAt", "status", "_id"];
  for (const field of expectedTeamMemberFields) {
    if (!teamMemberPaths.includes(field)) {
      throw new Error(`Missing expected teamMembers field: ${field}`);
    }
  }
  console.log("PASS: teamMembers subdocument schema verified");

  const timelinePaths = Object.keys(Project.schema.paths["timeline"].schema.paths);
  console.log("timeline subdocument paths:", timelinePaths);
  const expectedTimelineFields = ["action", "description", "oldStage", "newStage", "oldStatus", "newStatus", "notes", "performedBy", "performedByName", "performedByRole", "createdAt", "_id"];
  for (const field of expectedTimelineFields) {
    if (!timelinePaths.includes(field)) {
      throw new Error(`Missing expected timeline field: ${field}`);
    }
  }
  console.log("PASS: timeline subdocument schema verified");

  // 6. Check index definitions
  const indexes = Project.schema.indexes();
  console.log("Schema indexes count:", indexes.length);
  const textIndex = indexes.find(([idx]) => idx.projectName === "text" && idx.projectCode === "text");
  if (!textIndex) {
    throw new Error("Text index on { projectName, projectCode, productName, clientName, description } is missing!");
  }
  console.log("PASS: Text search index verified:", textIndex[0]);

  // 7. Test read query against collection in Atlas
  const count = await Project.countDocuments();
  console.log(`PASS: Found ${count} existing projects in collection 'projects'`);

  const sample = await Project.findOne({ isDeleted: false }).lean();
  if (sample) {
    console.log(`Sample project from DB: "${sample.projectName}" (Code: ${sample.projectCode}, Status: ${sample.status}, ID: ${sample._id})`);
  }

  // 8. Verify loading admin.js does NOT throw OverwriteModelError or overwrite Project
  const adminRouter = require("../backend/admin");
  console.log("PASS: backend/admin.js loaded cleanly without OverwriteModelError");

  await mongoose.disconnect();
  console.log("=== ALL PROJECT MODEL SCHEMA & READ VERIFICATIONS PASSED ===");
}

verifyProjectModel().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
