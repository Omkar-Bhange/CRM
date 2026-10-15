const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "../backend/node_modules");
require("module").Module._initPaths();
require("dotenv").config({ path: path.join(__dirname, "../backend/.env") });
const mongoose = require("mongoose");

const rawUri = process.env.MONGO_URI || "";
console.log("MONGO_URI defined:", Boolean(rawUri));

try {
  // Parse without printing credentials
  const urlObj = new URL(rawUri);
  console.log("Protocol:", urlObj.protocol);
  console.log("Host:", urlObj.host);
  console.log("Pathname (Database Name in URI):", urlObj.pathname);
  console.log("SearchParams:", urlObj.search);
} catch (e) {
  console.log("URI parse error:", e.message);
}

// Let's also check default database resolution in mongoose
async function inspectConnection() {
  try {
    const conn = await mongoose.createConnection(rawUri, { serverSelectionTimeoutMS: 5000 }).asPromise();
    console.log("Connected successfully.");
    console.log("Resolved connection.name:", conn.name);
    console.log("Resolved host:", conn.host);
    console.log("Resolved port:", conn.port);
    
    // List databases on the cluster (read-only)
    const adminDb = conn.db.admin();
    const dbs = await adminDb.listDatabases();
    console.log("Available databases on cluster:");
    dbs.databases.forEach(db => {
      console.log(` - ${db.name} (size: ${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB, empty: ${db.empty})`);
    });

    // Check collections in 'test' vs 'ClientConnectTrack'
    for (const targetDb of ["test", "ClientConnectTrack"]) {
      const dbHandle = conn.useDb(targetDb);
      const cols = await dbHandle.db.listCollections().toArray();
      const colNames = cols.map(c => c.name);
      console.log(`\nDatabase '${targetDb}' collections count: ${colNames.length}`);
      if (colNames.includes("idempotencylogs")) {
        const count = await dbHandle.collection("idempotencylogs").countDocuments();
        const indexes = await dbHandle.collection("idempotencylogs").indexes();
        console.log(`  idempotencylogs in '${targetDb}': ${count} docs`);
        console.log(`  idempotencylogs indexes in '${targetDb}':`, indexes.map(i => i.name));
      } else {
        console.log(`  idempotencylogs NOT found in '${targetDb}'`);
      }
      if (colNames.includes("clients")) {
        const count = await dbHandle.collection("clients").countDocuments();
        console.log(`  clients in '${targetDb}': ${count} docs`);
      }
      if (colNames.includes("amccontracts")) {
        const count = await dbHandle.collection("amccontracts").countDocuments();
        console.log(`  amccontracts in '${targetDb}': ${count} docs`);
      }
      if (colNames.includes("amcinvoices")) {
        const count = await dbHandle.collection("amcinvoices").countDocuments();
        console.log(`  amcinvoices in '${targetDb}': ${count} docs`);
      }
    }

    await conn.close();
  } catch (err) {
    console.error("Connection failed:", err.message);
  }
}

inspectConnection();
