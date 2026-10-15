"use strict";

const path = require("path");
require(path.join(__dirname, "../backend/node_modules/dotenv")).config({
  path: path.join(__dirname, "../backend/.env")
});
const mongoose = require(path.join(__dirname, "../backend/node_modules/mongoose"));

const ATLAS_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!ATLAS_URI) {
  console.error("No MONGO_URI found in backend/.env!");
  process.exit(1);
}

async function inspectAtlasApprovalRequests() {
  console.log("=== STEP 4: ATLAS READ-ONLY AUDIT FOR ATTENDANCEAPPROVALREQUESTS ===");
  console.log("Connecting to operational Atlas in READ-ONLY mode...");

  const conn = await mongoose.createConnection(ATLAS_URI, {
    readPreference: "secondaryPreferred"
  }).asPromise();

  console.log(`Connected to database: ${conn.name}`);

  try {
    const collections = await conn.db.listCollections().toArray();
    const hasCol = collections.some(c => c.name === "attendanceApprovalRequests");
    console.log(`Collection 'attendanceApprovalRequests' exists: ${hasCol}`);

    if (!hasCol) {
      console.log("Collection 'attendanceApprovalRequests' not found in database.");
      return;
    }

    const col = conn.db.collection("attendanceApprovalRequests");
    const count = await col.countDocuments();
    console.log(`Total documents in 'attendanceApprovalRequests': ${count}`);

    const indexes = await col.indexes();
    console.log("\nExisting Indexes on 'attendanceApprovalRequests':");
    indexes.forEach(idx => {
      console.log(` - Name: ${idx.name}, Key: ${JSON.stringify(idx.key)}, Unique: ${Boolean(idx.unique)}`);
    });

    if (count > 0) {
      const sample = await col.find().limit(5).toArray();
      console.log("\nSample Documents:");
      sample.forEach((doc, idx) => {
        console.log(`[${idx + 1}] ID: ${doc._id}`);
        console.log(`    employeeId: ${doc.employeeId}`);
        console.log(`    employeeCode: ${doc.employeeCode}`);
        console.log(`    employeeName: ${doc.employeeName}`);
        console.log(`    department: ${doc.department}`);
        console.log(`    date: ${doc.date} (${typeof doc.date})`);
        console.log(`    requestType: ${doc.requestType}`);
        console.log(`    approvalType: ${doc.approvalType}`);
        console.log(`    reason: ${doc.reason}`);
        console.log(`    pcName: ${doc.pcName}`);
        console.log(`    deviceId: ${doc.deviceId}`);
        console.log(`    ipAddress: ${doc.ipAddress}`);
        console.log(`    networkType: ${doc.networkType}`);
        console.log(`    status: ${doc.status}`);
        console.log(`    reviewedBy: ${doc.reviewedBy}`);
        console.log(`    reviewedByName: ${doc.reviewedByName}`);
        console.log(`    reviewedAt: ${doc.reviewedAt}`);
        console.log(`    attendanceId: ${doc.attendanceId}`);
        console.log(`    createdAt: ${doc.createdAt}, updatedAt: ${doc.updatedAt}`);
      });

      const distinctStatuses = await col.distinct("status");
      const distinctRequestTypes = await col.distinct("requestType");
      const distinctApprovalTypes = await col.distinct("approvalType");
      console.log(`\nDistinct statuses in Atlas: ${JSON.stringify(distinctStatuses)}`);
      console.log(`Distinct requestTypes in Atlas: ${JSON.stringify(distinctRequestTypes)}`);
      console.log(`Distinct approvalTypes in Atlas: ${JSON.stringify(distinctApprovalTypes)}`);
    }
  } finally {
    await conn.close();
    console.log("\nAtlas connection closed. Read-only inspection complete.");
  }
}

inspectAtlasApprovalRequests().catch(err => {
  console.error("Atlas inspection error:", err);
  process.exit(1);
});

