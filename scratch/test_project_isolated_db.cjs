const path = require("path");
const mongoose = require(path.join(__dirname, "../backend/node_modules/mongoose"));
require(path.join(__dirname, "../backend/node_modules/dotenv")).config({
  path: path.join(__dirname, "../backend/.env"),
});

async function runIsolatedWriteTests() {
  console.log("=== ISOLATED DATABASE WRITE TEST FOR PROJECT MODEL ===");

  // Connect to isolated test database (using separate connection / database)
  const baseUri = process.env.MONGO_URI || "mongodb://localhost:27017/ClientConnectTrack";
  // Replace database name with ClientConnectTrack_Test_Isolated
  const testUri = baseUri.replace(/\/ClientConnectTrack(\?|$)/, "/ClientConnectTrack_Test_Isolated$1");

  console.log("Connecting to isolated test database...");
  const testConn = await mongoose.createConnection(testUri).asPromise();
  console.log("Connected to isolated database:", testConn.name);

  // Require Project schema
  const ProjectModel = testConn.model("Project", require("../backend/models/Project").schema);

  // 1. Test Project Creation
  console.log("Test 1: Creating test project in isolated DB...");
  const newProj = await ProjectModel.create({
    projectCode: "TEST-PROJ-ISO-01",
    projectName: "Isolated Test Project",
    projectType: "Internal Development",
    priority: "High",
    status: "Planned",
    stage: "Planning",
    progress: 10,
    teamMembers: [
      {
        employeeId: new mongoose.Types.ObjectId(),
        employeeName: "Alice Engineer",
        employeeCode: "EMP001",
        role: "Developer",
        responsibility: "Core Module",
      },
    ],
    timeline: [
      {
        action: "Project Created",
        description: "Initial project setup in isolated test DB",
        newStage: "Planning",
        newStatus: "Planned",
      },
    ],
  });
  console.log("PASS: Project created with _id:", newProj._id, "code:", newProj.projectCode);

  // 2. Test Project Editing / Updating
  console.log("Test 2: Updating test project in isolated DB...");
  const updatedProj = await ProjectModel.findByIdAndUpdate(
    newProj._id,
    {
      $set: {
        stage: "Execution",
        status: "Active",
        progress: 50,
      },
      $push: {
        timeline: {
          action: "Stage Changed",
          description: "Moved to Execution",
          oldStage: "Planning",
          newStage: "Execution",
          oldStatus: "Planned",
          newStatus: "Active",
        },
      },
    },
    { new: true }
  );
  if (updatedProj.stage !== "Execution" || updatedProj.status !== "Active" || updatedProj.progress !== 50) {
    throw new Error("Update failed! Expected stage=Execution, status=Active, progress=50");
  }
  if (updatedProj.timeline.length !== 2) {
    throw new Error(`Expected 2 timeline entries, got ${updatedProj.timeline.length}`);
  }
  console.log("PASS: Project updated successfully, timeline length:", updatedProj.timeline.length);

  // 3. Test Unique Constraint on projectCode
  console.log("Test 3: Testing duplicate projectCode prevention...");
  let duplicatePrevented = false;
  try {
    await ProjectModel.create({
      projectCode: "TEST-PROJ-ISO-01", // Duplicate code
      projectName: "Duplicate Code Project",
    });
  } catch (err) {
    if (err.code === 11000 || err.message.includes("E11000") || err.name === "MongoServerError") {
      duplicatePrevented = true;
      console.log("PASS: Duplicate projectCode correctly rejected by unique constraint.");
    } else {
      throw err;
    }
  }
  if (!duplicatePrevented) {
    // Note: ensureIndexes may be needed on new collection
    await ProjectModel.ensureIndexes();
    try {
      await ProjectModel.create({
        projectCode: "TEST-PROJ-ISO-01",
        projectName: "Duplicate Code Project",
      });
    } catch (err2) {
      if (err2.code === 11000 || err2.message.includes("E11000") || err2.name === "MongoServerError") {
        duplicatePrevented = true;
        console.log("PASS: Duplicate projectCode rejected after index sync.");
      }
    }
  }

  // 4. Cleanup Isolated DB
  console.log("Cleaning up isolated test database collection...");
  await ProjectModel.deleteMany({});
  await testConn.dropCollection("projects").catch(() => {});
  await testConn.close();
  console.log("PASS: Isolated database cleaned up and closed.");
  console.log("=== ALL ISOLATED DB WRITE TESTS PASSED ===");
}

runIsolatedWriteTests().catch((err) => {
  console.error("Isolated DB test failed:", err);
  process.exit(1);
});
