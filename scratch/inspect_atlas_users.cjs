"use strict";

const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "../backend/node_modules");
require("module").Module._initPaths();
require("dotenv").config({ path: path.join(__dirname, "../backend/.env") });
const mongoose = require("mongoose");

async function inspectAtlasUsers() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.log("No MONGO_URI found.");
    return;
  }

  console.log("=== ATLAS READ-ONLY AUDIT: users & auth_sessions ===");
  await mongoose.connect(uri);
  console.log("Connected to Atlas DB:", mongoose.connection.name);

  try {
    const db = mongoose.connection.db;

    // 1. Users collection
    const userColls = await db.listCollections({ name: "users" }).toArray();
    console.log("Collection 'users' exists:", userColls.length > 0);

    if (userColls.length > 0) {
      const userColl = db.collection("users");
      const userCount = await userColl.countDocuments();
      console.log(`Total documents in 'users': ${userCount}`);

      const userIndexes = await userColl.indexes();
      console.log("Indexes on 'users':");
      userIndexes.forEach((idx) => {
        console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} (unique: ${idx.unique || false})`);
      });

      // Sample inspect without logging passwords, emails, or names
      const users = await userColl.find().toArray();
      console.log(`\nInspecting ${users.length} user documents:`);
      const rolesSeen = new Set();
      const statusSeen = new Set();
      let allHashesValidBcrypt = true;

      users.forEach((u, i) => {
        rolesSeen.add(u.role);
        statusSeen.add(u.status);

        const hasPassword = Boolean(u.password);
        const isBcrypt = hasPassword && typeof u.password === "string" && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(u.password);
        if (!isBcrypt && hasPassword) {
          allHashesValidBcrypt = false;
        }

        console.log(`  User ${i + 1}:`);
        console.log(`    _id: ${u._id}`);
        console.log(`    role: ${u.role}`);
        console.log(`    status: ${u.status}`);
        console.log(`    hasPassword: ${hasPassword}`);
        console.log(`    passwordFormat: ${isBcrypt ? "Standard bcrypt (60 chars)" : "NON-STANDARD or missing"}`);
        console.log(`    mustChangePassword: ${u.mustChangePassword}`);
        console.log(`    passwordChangedAt: ${u.passwordChangedAt}`);
        console.log(`    lastLoginAt: ${u.lastLoginAt}`);
        console.log(`    clientId: ${u.clientId ? "ObjectId(" + u.clientId + ")" : "null"}`);
        console.log(`    clientCode: ${u.clientCode ? "Present" : "empty"}`);
        console.log(`    employeeCode: ${u.employeeCode ? "Present" : "empty"}`);
        console.log(`    createdAt: ${u.createdAt}`);
        console.log(`    updatedAt: ${u.updatedAt}`);
      });

      console.log("\nSummary of User enums found in production:");
      console.log("  Roles seen:", Array.from(rolesSeen));
      console.log("  Statuses seen:", Array.from(statusSeen));
      console.log("  All password hashes strictly valid 60-char bcrypt:", allHashesValidBcrypt);
    }

    // 2. Check Employee -> User linkage
    const empColl = db.collection("employees");
    const employees = await empColl.find().toArray();
    console.log(`\nChecking Employee -> User linkage for ${employees.length} employees:`);
    for (const emp of employees) {
      if (emp.userId) {
        const linkedUser = await db.collection("users").findOne({ _id: emp.userId });
        console.log(`  Employee ${emp.employeeCode} links to User ${emp.userId}: found in users collection = ${Boolean(linkedUser)} (role: ${linkedUser?.role})`);
      } else {
        console.log(`  Employee ${emp.employeeCode}: userId is null`);
      }
    }

    // 3. Check Client -> User linkage
    const clientColl = db.collection("clients");
    const clientsWithUser = await clientColl.find({ userId: { $ne: null } }).toArray();
    console.log(`\nClients with userId populated in 'clients': ${clientsWithUser.length}`);
    for (const cl of clientsWithUser) {
      const linkedUser = await db.collection("users").findOne({ _id: cl.userId });
      console.log(`  Client ${cl.clientCode} links to User ${cl.userId}: found in users collection = ${Boolean(linkedUser)} (role: ${linkedUser?.role})`);
    }

    // 4. Check AuthSession collection
    const authSessionColls = await db.listCollections({ name: "auth_sessions" }).toArray();
    console.log("\nCollection 'auth_sessions' exists:", authSessionColls.length > 0);
    if (authSessionColls.length > 0) {
      const sessionColl = db.collection("auth_sessions");
      const sessionCount = await sessionColl.countDocuments();
      console.log(`Total documents in 'auth_sessions': ${sessionCount}`);
      const sessionIndexes = await sessionColl.indexes();
      console.log("Indexes on 'auth_sessions':");
      sessionIndexes.forEach((idx) => {
        console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
      });
      const activeSessions = await sessionColl.countDocuments({ revokedAt: null, expiresAt: { $gt: new Date() } });
      console.log(`Active unexpired sessions: ${activeSessions}`);
    }
  } catch (err) {
    console.error("Atlas inspection error:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from Atlas (read-only audit finished).");
  }
}

inspectAtlasUsers();

