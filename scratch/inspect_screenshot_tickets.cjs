const path = require("path");
const mongoose = require(path.join(__dirname, "../backend/node_modules/mongoose"));
require(path.join(__dirname, "../backend/node_modules/dotenv")).config({ path: path.join(__dirname, "../backend/.env") });
const { calculateTicketSla } = require("../backend/slaConfig");

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const tickets = await mongoose.connection.collection("supporttickets").find({
    ticketCode: { $in: ["TKT-2026-83968375", "TKT-2026-83968374", "TKT-2026-83968373"] }
  }).toArray();

  for (const t of tickets) {
    console.log("-----------------------------------------");
    console.log("Ticket:", t.ticketCode);
    console.log("Status:", t.status);
    console.log("createdAt:", t.createdAt);
    console.log("resolvedAt:", t.resolvedAt);
    console.log("firstResponseAt:", t.firstResponseAt);
    const sla = calculateTicketSla(t);
    console.log("Current calculateTicketSla output:", {
      firstResponseStatus: sla?.firstResponseStatus,
      firstResponseRemainingMinutes: sla?.firstResponseRemainingMinutes,
      firstResponseDisplay: sla?.firstResponseDisplay,
      resolutionStatus: sla?.resolutionStatus,
      resolutionDisplay: sla?.resolutionDisplay,
    });
  }

  await mongoose.disconnect();
}

check();

