const path = require("path");
const mongoose = require(path.join(__dirname, "../backend/node_modules/mongoose"));
require(path.join(__dirname, "../backend/node_modules/dotenv")).config({
  path: path.join(__dirname, "../backend/.env"),
});

async function checkTasks() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to Atlas DB:", mongoose.connection.name);
  const count = await mongoose.connection.collection("tasks").countDocuments();
  console.log("Current tasks count in Atlas:", count);
  const tasks = await mongoose.connection.collection("tasks").find({}).sort({ _id: -1 }).limit(3).toArray();
  console.log("Sample tasks (latest 3):", JSON.stringify(tasks, null, 2));
  const indexes = await mongoose.connection.collection("tasks").indexes();
  console.log("Current indexes on 'tasks' collection:", JSON.stringify(indexes, null, 2));
  await mongoose.disconnect();
}

checkTasks().catch(console.error);
