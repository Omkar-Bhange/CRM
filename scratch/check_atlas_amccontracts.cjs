require("../backend/node_modules/dotenv").config({ path: require("path").join(__dirname, "../backend/.env") });
const mongoose = require("../backend/node_modules/mongoose");

async function checkAtlasAmcContracts() {
  console.log("=== ATLAS READ-ONLY AMCCONTRACTS INSPECTION ===");
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.log("No MONGO_URI in .env");
    return;
  }

  // Connect read-only
  await mongoose.connect(uri);
  console.log("Connected to Atlas DB:", mongoose.connection.name);

  const db = mongoose.connection.db;
  const collections = await db.listCollections({ name: "amccontracts" }).toArray();
  console.log("Collection 'amccontracts' exists on Atlas:", collections.length > 0);

  if (collections.length > 0) {
    const col = db.collection("amccontracts");
    const count = await col.countDocuments();
    console.log("Document count in amccontracts:", count);

    const docs = await col.find({}).limit(5).toArray();
    console.log(`Sample documents in amccontracts (showing ${docs.length}):`);
    docs.forEach((d, idx) => {
      console.log(`  [Doc ${idx + 1}] _id: ${d._id}, contractCode: ${d.contractCode}, clientName: ${d.clientName}, productName: ${d.productName}, status: ${d.status}, expiryDate: ${d.expiryDate}, isDeleted: ${d.isDeleted}`);
    });

    const indexes = await col.indexes();
    console.log("Indexes on amccontracts:");
    indexes.forEach(idx => {
      console.log(`  - name: "${idx.name}", key: ${JSON.stringify(idx.key)}`);
    });

    // Hydration test using canonical model
    const AmcContract = require("../backend/models/AmcContract");
    const sampleDoc = await AmcContract.findOne({}).lean();
    if (sampleDoc) {
      console.log("Hydration check with AmcContract model successful: found _id", sampleDoc._id, "contractCode", sampleDoc.contractCode);
    }
  } else {
    console.log("Collection amccontracts has not been created on Atlas yet.");
  }

  await mongoose.disconnect();
  console.log("Disconnected from Atlas (zero writes performed).");
}

checkAtlasAmcContracts().catch(err => {
  console.error("Atlas read error:", err);
  process.exit(1);
});

