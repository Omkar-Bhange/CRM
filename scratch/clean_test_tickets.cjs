const path = require("path");
const mongoose = require(path.resolve("backend/node_modules/mongoose"));
require(path.resolve("backend/node_modules/dotenv")).config({ path: "backend/.env" });
const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

mongoose.connect(uri).then(async () => {
  require(path.resolve("backend/admin"));
  require(path.resolve("backend/client"));
  const SupportTicket = mongoose.models.SupportTicket;
  const ClientNotification = mongoose.models.ClientNotification;
  const Client = mongoose.models.Client;

  const res1 = await SupportTicket.deleteMany({ ticketCode: { $in: ["TKT-2026-83968377", "TKT-2026-83968378"] } });
  const res2 = await ClientNotification.deleteMany({ entityCode: { $in: ["TKT-2026-83968377", "TKT-2026-83968378"] } });
  await Client.updateOne({ clientCode: "C100" }, { $inc: { openTickets: -2 } });

  console.log(`Cleaned up ${res1.deletedCount} tickets and ${res2.deletedCount} notifications.`);
  process.exit(0);
});
