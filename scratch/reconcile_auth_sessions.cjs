const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "../backend/node_modules");
require("module").Module._initPaths();
require("dotenv").config({ path: path.join(__dirname, "../backend/.env") });
const mongoose = require("mongoose");

async function reconcileAuthSessions() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.log("No MONGO_URI");
    return;
  }
  await mongoose.connect(uri);
  const coll = mongoose.connection.db.collection("auth_sessions");
  
  const allDocs = await coll.find({}).toArray();
  const total = allDocs.length;
  const now = Date.now();

  let activeValid = 0;              // revokedAt == null && expiresAt > now
  let expiredOnly = 0;              // revokedAt == null && expiresAt <= now
  let revokedAndExpired = 0;        // revokedAt != null && expiresAt <= now
  let revokedActive = 0;            // revokedAt != null && expiresAt > now

  for (const d of allDocs) {
    const isRevoked = d.revokedAt != null;
    const isExpired = d.expiresAt ? new Date(d.expiresAt).getTime() <= now : false;

    if (!isRevoked && !isExpired) {
      activeValid++;
    } else if (!isRevoked && isExpired) {
      expiredOnly++;
    } else if (isRevoked && isExpired) {
      revokedAndExpired++;
    } else if (isRevoked && !isExpired) {
      revokedActive++;
    }
  }

  const totalRevoked = revokedAndExpired + revokedActive;
  const totalExpired = expiredOnly + revokedAndExpired;

  console.log("=== EXACT RECONCILED AUTHSESSION AUDIT ===");
  console.log(`Total documents: ${total}`);
  console.log(`1. Active & Valid (revokedAt is null AND expiresAt > now): ${activeValid}`);
  console.log(`2. Expired Only (revokedAt is null AND expiresAt <= now): ${expiredOnly}`);
  console.log(`3. Revoked AND Expired (revokedAt != null AND expiresAt <= now): ${revokedAndExpired}`);
  console.log(`4. Revoked but Not Yet Expired (revokedAt != null AND expiresAt > now): ${revokedActive}`);
  console.log("--------------------------------------------------");
  console.log(`Total Expired (Set union): ${totalExpired}`);
  console.log(`Total Revoked (Set union): ${totalRevoked}`);
  console.log(`Reconciled Sum (activeValid + expiredOnly + revokedAndExpired + revokedActive): ${activeValid + expiredOnly + revokedAndExpired + revokedActive}`);
  console.log(`Matches total count: ${activeValid + expiredOnly + revokedAndExpired + revokedActive === total}`);

  await mongoose.disconnect();
}

reconcileAuthSessions();

