require('../backend/node_modules/dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const mongoose = require('../backend/node_modules/mongoose');

async function auditAtlasAgentDailySummary() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.log("No MONGODB_URI found, skipping Atlas check.");
    return;
  }

  console.log("Connecting READ-ONLY to MongoDB Atlas...");
  await mongoose.connect(uri);
  console.log("Connected to Atlas DB:", mongoose.connection.name);

  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const colNames = collections.map(c => c.name);
    console.log("Has 'agent_daily_summary' collection:", colNames.includes("agent_daily_summary"));

    if (colNames.includes("agent_daily_summary")) {
      const col = db.collection("agent_daily_summary");
      const count = await col.countDocuments();
      console.log("Total documents in agent_daily_summary:", count);

      const indexes = await col.indexes();
      console.log("Indexes on agent_daily_summary:");
      indexes.forEach(idx => {
        console.log(`  - Name: ${idx.name}, Key: ${JSON.stringify(idx.key)}, Unique: ${Boolean(idx.unique)}`);
      });

      if (count > 0) {
        const sample = await col.findOne();
        console.log("Sample document fields:", Object.keys(sample));
        console.log("Sample document:", JSON.stringify(sample, null, 2));
      }
    }
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from Atlas.");
  }
}

auditAtlasAgentDailySummary().catch(err => {
  console.error("Error inspecting Atlas:", err.message);
  process.exit(1);
});
