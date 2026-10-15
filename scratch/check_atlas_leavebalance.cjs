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

async function inspectAtlasLeaveBalances() {
  console.log("=== STEP 5: ATLAS READ-ONLY AUDIT FOR LEAVEBALANCES ===");
  console.log("Connecting to operational Atlas in READ-ONLY mode...");

  const conn = await mongoose.createConnection(ATLAS_URI, {
    readPreference: "secondaryPreferred"
  }).asPromise();

  console.log(`Connected to database: ${conn.name}`);

  try {
    const collections = await conn.db.listCollections().toArray();
    const hasCol = collections.some(c => c.name === "leaveBalances");
    console.log(`Collection 'leaveBalances' exists: ${hasCol}`);

    if (!hasCol) {
      console.log("Collection 'leaveBalances' not found in database.");
      return;
    }

    const col = conn.db.collection("leaveBalances");
    const count = await col.countDocuments();
    console.log(`Total documents in 'leaveBalances': ${count}`);

    const indexes = await col.indexes();
    console.log("\nExisting Indexes on 'leaveBalances':");
    indexes.forEach(idx => {
      console.log(` - Name: ${idx.name}, Key: ${JSON.stringify(idx.key)}, Unique: ${Boolean(idx.unique)}`);
    });

    if (count > 0) {
      const sample = await col.find().limit(5).toArray();
      console.log("\nSample Documents:");
      sample.forEach((doc, idx) => {
        console.log(`[${idx + 1}] ID: ${doc._id}`);
        console.log(`    employeeId: ${doc.employeeId}`);
        console.log(`    year: ${doc.year} (${typeof doc.year})`);
        console.log(`    leaveType: ${doc.leaveType}`);
        console.log(`    code: ${doc.code}`);
        console.log(`    total: ${doc.total} (${typeof doc.total})`);
        console.log(`    carriedForward: ${doc.carriedForward} (${typeof doc.carriedForward})`);
        console.log(`    createdAt: ${doc.createdAt}, updatedAt: ${doc.updatedAt}`);
      });

      // Check for distinct years and leaveTypes
      const years = await col.distinct("year");
      const leaveTypes = await col.distinct("leaveType");
      console.log(`\nDistinct years in Atlas: ${JSON.stringify(years)}`);
      console.log(`Distinct leaveTypes in Atlas: ${JSON.stringify(leaveTypes)}`);
    }
  } finally {
    await conn.close();
    console.log("\nAtlas connection closed. Read-only inspection complete.");
  }
}

inspectAtlasLeaveBalances().catch(err => {
  console.error("Atlas inspection error:", err);
  process.exit(1);
});
