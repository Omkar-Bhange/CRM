"use strict";

const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "../backend/node_modules");
require("module").Module._initPaths();
require("dotenv").config({ path: path.join(__dirname, "../backend/.env") });
const mongoose = require("mongoose");

async function checkAtlasEmployees() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.log("No MONGO_URI found.");
    return;
  }

  console.log("=== ATLAS READ-ONLY INSPECTION: employees ===");
  await mongoose.connect(uri);
  console.log("Connected to Atlas DB:", mongoose.connection.name);

  try {
    const db = mongoose.connection.db;
    const colls = await db.listCollections({ name: "employees" }).toArray();
    console.log("Collection 'employees' exists:", colls.length > 0);

    if (colls.length > 0) {
      const coll = db.collection("employees");
      const count = await coll.countDocuments();
      console.log(`Total documents in 'employees': ${count}`);

      const indexes = await coll.indexes();
      console.log("Indexes on 'employees':");
      indexes.forEach(idx => {
        console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} (unique: ${idx.unique || false})`);
      });

      // Sample inspect without logging sensitive personal data (mask email and name)
      const docs = await coll.find().toArray();
      console.log(`Inspecting ${docs.length} documents for schema fields:`);
      docs.forEach((doc, i) => {
        console.log(`\nDoc ${i + 1}:`);
        console.log(`  _id: ${doc._id}`);
        console.log(`  employeeCode: ${doc.employeeCode}`);
        console.log(`  role: ${doc.role}`);
        console.log(`  department: ${doc.department}`);
        console.log(`  status: ${doc.status}`);
        console.log(`  userId linked: ${doc.userId ? "Present (ObjectId)" : "null"}`);
        console.log(`  currentTaskId: ${doc.currentTaskId ? "Present" : "null"}`);
        console.log(`  currentTicketId: ${doc.currentTicketId ? "Present" : "null"}`);
        console.log(`  activeMinutes: ${doc.activeMinutes}`);
        console.log(`  isActive: ${doc.isActive}`);
        console.log(`  createdAt: ${doc.createdAt}`);
        console.log(`  updatedAt: ${doc.updatedAt}`);
        console.log(`  email present: ${Boolean(doc.email)}`);
        console.log(`  mobile present: ${Boolean(doc.mobile)}`);
      });
    }
  } catch (err) {
    console.error("Atlas inspection error:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from Atlas.");
  }
}

checkAtlasEmployees();

