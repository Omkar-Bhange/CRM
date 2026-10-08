const mongoose = require("../backend/node_modules/mongoose");
const { calculateTicketSla } = require("../backend/slaConfig");

async function main() {
  const uri = "mongodb://VirajM123:yivBEn6CdY0coYIz@ac-yydsdkk-shard-00-00.tjkdcqu.mongodb.net:27017,ac-yydsdkk-shard-00-01.tjkdcqu.mongodb.net:27017,ac-yydsdkk-shard-00-02.tjkdcqu.mongodb.net:27017/ClientConnectTrack?tls=true&replicaSet=atlas-gbj92c-shard-0&authSource=admin&retryWrites=true&w=majority";
  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);

  const SupportTicket = mongoose.model(
    "SupportTicket",
    new mongoose.Schema({}, { strict: false }),
    "supporttickets"
  );

  // Find tickets resolved or closed without firstResponseAt
  const ticketsToMigrate = await SupportTicket.find({
    status: { $in: ["Resolved", "Verified", "Closed"] },
    resolvedAt: { $ne: null },
    firstResponseAt: null,
  }).lean();

  console.log(`Found ${ticketsToMigrate.length} resolved/closed tickets missing firstResponseAt.`);

  let updatedCount = 0;
  for (const t of ticketsToMigrate) {
    const resAt = t.resolvedAt || t.closedAt || t.updatedAt;
    await SupportTicket.updateOne(
      { _id: t._id },
      {
        $set: {
          firstResponseAt: resAt,
          ...(!t.firstResolvedAt ? { firstResolvedAt: resAt } : {}),
        },
      }
    );
    updatedCount++;
  }

  console.log(`Successfully migrated ${updatedCount} tickets.`);

  // Verify the specific screenshot tickets
  const sampleCodes = ["TKT-2026-83968375", "TKT-2026-83968374", "TKT-2026-83968373"];
  const samples = await SupportTicket.find({ ticketCode: { $in: sampleCodes } }).lean();
  console.log("\n--- Verification on Screenshot Tickets ---");
  for (const t of samples) {
    const sla = calculateTicketSla(t, new Date());
    console.log(`Ticket: ${t.ticketCode}`);
    console.log(`  status: ${t.status}`);
    console.log(`  firstResponseAt: ${t.firstResponseAt}`);
    console.log(`  resolvedAt: ${t.resolvedAt}`);
    console.log(`  firstResponseStatus: ${sla?.firstResponseStatus}`);
    console.log(`  firstResponseRemainingMinutes: ${sla?.firstResponseRemainingMinutes}`);
    console.log(`  resolutionStatus: ${sla?.resolutionStatus}`);
    console.log(`  resolutionDisplay: ${sla?.resolutionDisplay}`);
  }

  await mongoose.disconnect();
  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});

