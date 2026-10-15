const mongoose = require('../backend/node_modules/mongoose');

async function testMultiPcAggregation() {
  const TEST_DB = `crm_isolated_multipc_test_${Date.now()}`;
  const uri = `mongodb://127.0.0.1:27017/${TEST_DB}`;
  await mongoose.connect(uri);

  try {
    const AgentDailySummary = require('../backend/models/AgentDailySummary');
    await AgentDailySummary.init();

    const empId = new mongoose.Types.ObjectId();
    const today = new Date("2026-10-13T00:00:00.000Z");

    // Event 1 from PC-OFFICE
    console.log("Ingesting Event 1 from PC-OFFICE (300s)...");
    const doc1 = await AgentDailySummary.findOneAndUpdate(
      {
        employeeCode: "EMP001",
        application: "Google Chrome",
        date: today,
        taskId: null,
      },
      {
        $set: {
          employeeId: empId,
          employeeName: "Alice",
          pcName: "PC-OFFICE",
          lastWindowTitle: "Office Work - Chrome",
          lastSeen: new Date("2026-10-13T10:05:00.000Z"),
        },
        $setOnInsert: {
          firstSeen: new Date("2026-10-13T10:00:00.000Z"),
        },
        $inc: {
          totalSeconds: 300,
          sessionCount: 1,
        },
      },
      { upsert: true, new: true }
    );

    console.log("Doc after Event 1:");
    console.log(`  _id: ${doc1._id}`);
    console.log(`  pcName: ${doc1.pcName}`);
    console.log(`  totalSeconds: ${doc1.totalSeconds}`);
    console.log(`  sessionCount: ${doc1.sessionCount}`);

    // Event 2 from LAPTOP-HOME
    console.log("\nIngesting Event 2 from LAPTOP-HOME (600s)...");
    const doc2 = await AgentDailySummary.findOneAndUpdate(
      {
        employeeCode: "EMP001",
        application: "Google Chrome",
        date: today,
        taskId: null,
      },
      {
        $set: {
          employeeId: empId,
          employeeName: "Alice",
          pcName: "LAPTOP-HOME",
          lastWindowTitle: "Home Work - Chrome",
          lastSeen: new Date("2026-10-13T12:10:00.000Z"),
        },
        $setOnInsert: {
          firstSeen: new Date("2026-10-13T12:00:00.000Z"),
        },
        $inc: {
          totalSeconds: 600,
          sessionCount: 1,
        },
      },
      { upsert: true, new: true }
    );

    console.log("Doc after Event 2:");
    console.log(`  _id: ${doc2._id}`);
    console.log(`  pcName: ${doc2.pcName}`);
    console.log(`  totalSeconds: ${doc2.totalSeconds}`);
    console.log(`  sessionCount: ${doc2.sessionCount}`);

    const count = await AgentDailySummary.countDocuments({ employeeCode: "EMP001" });
    console.log(`\nTotal summary documents in collection: ${count}`);

    console.log("\nAnswers to Step 2 questions:");
    console.log("1. Two PCs share summary document:", doc1._id.equals(doc2._id));
    console.log("2. pcName is overwritten by last processed event:", doc2.pcName === "LAPTOP-HOME");
    console.log("3. totalSeconds and sessionCount aggregate both PCs:", doc2.totalSeconds === 900 && doc2.sessionCount === 2);

  } finally {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
}

testMultiPcAggregation().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});

