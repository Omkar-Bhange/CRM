require('../backend/node_modules/dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const mongoose = require('../backend/node_modules/mongoose');

async function auditAtlasAttendanceEvents() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.log("No Mongo URI found");
    return;
  }

  console.log("Connecting READ-ONLY to Atlas...");
  await mongoose.connect(uri);
  console.log("Connected to Atlas DB:", mongoose.connection.name);

  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const colNames = collections.map(c => c.name);
    console.log("Has 'attendanceevents' collection:", colNames.includes("attendanceevents"));

    if (colNames.includes("attendanceevents")) {
      const col = db.collection("attendanceevents");
      const count = await col.countDocuments();
      console.log("Total documents in attendanceevents:", count);

      const indexes = await col.indexes();
      console.log("Indexes on attendanceevents:");
      indexes.forEach(idx => {
        console.log(`  - Name: ${idx.name}, Key: ${JSON.stringify(idx.key)}, Unique: ${Boolean(idx.unique)}`);
      });

      if (count > 0) {
        const sample = await col.findOne();
        console.log("Sample document:", JSON.stringify(sample, null, 2));

        // Group by type
        const typeCounts = await col.aggregate([
          { $group: { _id: "$type", count: { $sum: 1 } } }
        ]).toArray();
        console.log("Event types distribution:", typeCounts);
      }
    }
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from Atlas.");
  }
}

auditAtlasAttendanceEvents().catch(err => {
  console.error("Atlas check failed:", err.message);
  process.exit(1);
});

