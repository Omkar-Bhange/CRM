"use strict";

const path = require("path");
require("../backend/node_modules/dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });
const mongoose = require("../backend/node_modules/mongoose");

async function checkAtlasIdempotencyLogs() {
  const uri = process.env.MONGO_URI;
  if (!uri || !uri.includes("mongodb.net")) {
    console.log("No Atlas MONGO_URI found in backend/.env, skipping Atlas read-only check.");
    return;
  }

  console.log("=== ATLAS READ-ONLY INSPECTION: idempotencylogs ===");
  await mongoose.connect(uri);
  console.log("Connected to Atlas DB:", mongoose.connection.name);

  try {
    const db = mongoose.connection.db;
    const colls = await db.listCollections({ name: "idempotencylogs" }).toArray();
    console.log("Collection 'idempotencylogs' exists in Atlas:", colls.length > 0);

    if (colls.length > 0) {
      const coll = db.collection("idempotencylogs");
      const count = await coll.countDocuments();
      console.log(`Total documents in idempotencylogs: ${count}`);

      const indexes = await coll.indexes();
      console.log("Indexes on idempotencylogs:");
      indexes.forEach(idx => {
        console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} (unique: ${idx.unique || false}, sparse: ${idx.sparse || false}, expireAfterSeconds: ${idx.expireAfterSeconds || "none"})`);
      });

      if (count > 0) {
        const sample = await coll.find().limit(5).toArray();
        console.log(`Sample document count: ${sample.length}`);
        sample.forEach((doc, i) => {
          console.log(`  Sample ${i + 1}: key=${doc.idempotencyKey}, endpoint=${doc.endpoint}, status=${doc.status}, resStatus=${doc.responseStatus}, createdAt=${doc.createdAt}`);
        });
      }
    } else {
      console.log("Collection 'idempotencylogs' does not yet exist on operational Atlas (will be created automatically on first idempotent write).");
    }
  } catch (err) {
    console.error("Atlas inspection error:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkAtlasIdempotencyLogs();

