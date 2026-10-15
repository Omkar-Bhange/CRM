"use strict";

const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "../backend/node_modules");
require("module").Module._initPaths();
require("dotenv").config({ path: path.join(__dirname, "../backend/.env") });
const mongoose = require("mongoose");

async function checkAtlas4Indexes() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.log("No MONGO_URI");
    return;
  }
  console.log("Connecting strictly READ-ONLY to Atlas...");
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const targets = ["clientamcrequests", "amcinvoices", "attendance", "auth_sessions"];
  for (const t of targets) {
    console.log(`\n=== Collection: ${t} ===`);
    try {
      const coll = db.collection(t);
      const indexes = await coll.indexes();
      indexes.forEach(idx => {
        console.log(`  - ${idx.name}: key=${JSON.stringify(idx.key)} options=${JSON.stringify({
          unique: idx.unique,
          sparse: idx.sparse,
          partialFilterExpression: idx.partialFilterExpression,
          expireAfterSeconds: idx.expireAfterSeconds,
        })}`);
      });
    } catch (err) {
      console.log(`  Error: ${err.message}`);
    }
  }

  await mongoose.disconnect();
  console.log("\nDisconnected from Atlas.");
}

checkAtlas4Indexes();

