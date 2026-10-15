const mongoose = require('../backend/node_modules/mongoose');

async function testTicketCodeDiscard() {
  const TEST_DB = `crm_isolated_ticketcode_test_${Date.now()}`;
  const uri = `mongodb://127.0.0.1:27017/${TEST_DB}`;
  await mongoose.connect(uri);

  try {
    const AgentDailySummary = require('../backend/models/AgentDailySummary');
    const empId = new mongoose.Types.ObjectId();
    const taskId = new mongoose.Types.ObjectId();
    const ticketId = new mongoose.Types.ObjectId();
    const today = new Date("2026-10-13T00:00:00.000Z");

    const upsertRes = await AgentDailySummary.findOneAndUpdate(
      {
        employeeCode: "EMP_TC",
        application: "VS Code",
        date: today,
        taskId: taskId,
      },
      {
        $set: {
          employeeId: empId,
          employeeName: "Tester",
          pcName: "PC-TEST",
          taskId: taskId,
          taskCode: "TSK-100",
          ticketId: ticketId,
          ticketCode: "TCK-100", // Not in schema!
        },
      },
      { upsert: true, new: true }
    );

    console.log("Upsert result Mongoose document:");
    console.log("ticketId in doc:", upsertRes.ticketId ? upsertRes.ticketId.toString() : null);
    console.log("ticketCode in doc:", upsertRes.ticketCode);

    // Direct MongoDB raw query to check what was saved in MongoDB
    const rawDoc = await mongoose.connection.db.collection("agent_daily_summary").findOne({ employeeCode: "EMP_TC" });
    console.log("\nRaw document from MongoDB:");
    console.log("rawDoc.ticketId:", rawDoc.ticketId);
    console.log("rawDoc.ticketCode:", rawDoc.ticketCode);
    console.log("rawDoc hasOwnProperty('ticketCode'):", rawDoc.hasOwnProperty('ticketCode'));

  } finally {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
}

testTicketCodeDiscard().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});

