require("../backend/node_modules/dotenv").config({ path: require("path").join(__dirname, "../backend/.env") });
const mongoose = require("../backend/node_modules/mongoose");

async function checkAtlasAppCounters() {
  console.log("=== ATLAS READ-ONLY APPACOUNTERS INSPECTION ===");
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.log("No MONGO_URI in .env");
    return;
  }

  // Connect read-only
  await mongoose.connect(uri);
  console.log("Connected to Atlas DB:", mongoose.connection.name);

  const db = mongoose.connection.db;
  const collections = await db.listCollections({ name: "appcounters" }).toArray();
  console.log("Collection 'appcounters' exists on Atlas:", collections.length > 0);

  if (collections.length > 0) {
    const col = db.collection("appcounters");
    const count = await col.countDocuments();
    console.log("Document count in appcounters:", count);

    const docs = await col.find({}).toArray();
    console.log("Documents in appcounters:");
    docs.forEach(d => {
      console.log(`  - _id: "${d._id}", seq: ${d.seq}, keys: [${Object.keys(d).join(', ')}]`);
    });

    const indexes = await col.indexes();
    console.log("Indexes on appcounters:");
    indexes.forEach(idx => {
      console.log(`  - name: "${idx.name}", key: ${JSON.stringify(idx.key)}`);
    });
  } else {
    console.log("Collection appcounters has not been created on Atlas yet.");
  }

  await mongoose.disconnect();
  console.log("Disconnected from Atlas (zero writes performed).");
}

checkAtlasAppCounters().catch(err => {
  console.error("Atlas read error:", err);
  process.exit(1);
});
