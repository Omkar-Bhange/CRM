require('../backend/node_modules/dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const mongoose = require('../backend/node_modules/mongoose');

async function auditTicketCode() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(uri);

  try {
    const col = mongoose.connection.db.collection("agent_daily_summary");
    const countWithTicketCode = await col.countDocuments({ ticketCode: { $exists: true } });
    const countWithTicketId = await col.countDocuments({ ticketId: { $ne: null } });
    const countWithTaskId = await col.countDocuments({ taskId: { $ne: null } });
    const totalDocs = await col.countDocuments();

    console.log("=== ATLAS TICKETCODE AUDIT ===");
    console.log("Total documents in agent_daily_summary:", totalDocs);
    console.log("Documents with 'ticketCode' field existing:", countWithTicketCode);
    console.log("Documents with non-null 'ticketId':", countWithTicketId);
    console.log("Documents with non-null 'taskId':", countWithTaskId);

  } finally {
    await mongoose.disconnect();
  }
}

auditTicketCode().catch(err => {
  console.error("Atlas ticketCode check failed:", err.message);
  process.exit(1);
});

