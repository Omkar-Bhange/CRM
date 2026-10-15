const path = require("path");
const mongoose = require(path.join(__dirname, "../backend/node_modules/mongoose"));
require(path.join(__dirname, "../backend/node_modules/dotenv")).config({
  path: path.join(__dirname, "../backend/.env"),
});

async function checkSupportTickets() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to Atlas DB:", mongoose.connection.name);
  const count = await mongoose.connection.collection("supporttickets").countDocuments();
  console.log("Current supporttickets count in Atlas:", count);
  const tickets = await mongoose.connection.collection("supporttickets").find({}).sort({ _id: -1 }).limit(3).toArray();
  console.log("Sample supporttickets (latest 3):", JSON.stringify(tickets, null, 2));
  const indexes = await mongoose.connection.collection("supporttickets").indexes();
  console.log("Current indexes on 'supporttickets' collection:", JSON.stringify(indexes, null, 2));
  await mongoose.disconnect();
}

checkSupportTickets().catch(console.error);
