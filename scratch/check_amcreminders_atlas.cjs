require("../backend/node_modules/dotenv").config({ path: require("path").join(__dirname, "../backend/.env") });
const mongoose = require("../backend/node_modules/mongoose");

async function checkAtlasAmcReminders() {
  console.log("=== ATLAS READ-ONLY AMCREMINDERS INSPECTION ===");
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.log("No MONGO_URI in .env");
    return;
  }

  // Connect read-only
  await mongoose.connect(uri);
  console.log("Connected to Atlas DB:", mongoose.connection.name);

  const db = mongoose.connection.db;
  const collections = await db.listCollections({ name: "amcreminders" }).toArray();
  console.log("Collection 'amcreminders' exists on Atlas:", collections.length > 0);

  if (collections.length > 0) {
    const col = db.collection("amcreminders");
    const count = await col.countDocuments();
    console.log("Document count in amcreminders:", count);

    const docs = await col.find({}).limit(5).toArray();
    console.log(`Sample documents in amcreminders (showing ${docs.length}):`);
    docs.forEach((d, idx) => {
      console.log(`  [Doc ${idx + 1}] _id: ${d._id}, contractCode: ${d.contractCode}, channel: ${d.channel}, status: ${d.status}, sentAt: ${d.sentAt}, isDeleted: ${d.isDeleted}`);
    });

    const indexes = await col.indexes();
    console.log("Indexes on amcreminders:");
    indexes.forEach(idx => {
      console.log(`  - name: "${idx.name}", key: ${JSON.stringify(idx.key)}`);
    });
  } else {
    console.log("Collection amcreminders has not been created on Atlas yet.");
  }

  await mongoose.disconnect();
  console.log("Disconnected from Atlas (zero writes performed).");
}

checkAtlasAmcReminders().catch(err => {
  console.error("Atlas read error:", err);
  process.exit(1);
});
