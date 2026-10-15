const path = require("path");
const mongoose = require(path.join(__dirname, "../backend/node_modules/mongoose"));
require(path.join(__dirname, "../backend/node_modules/dotenv")).config({
  path: path.join(__dirname, "../backend/.env"),
});

async function checkProjects() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to Atlas DB:", mongoose.connection.name);
  const count = await mongoose.connection.collection("projects").countDocuments();
  console.log("Current projects count in Atlas:", count);
  const projects = await mongoose.connection.collection("projects").find({}, { projection: { projectCode: 1, projectName: 1, status: 1 } }).limit(5).toArray();
  console.log("Sample projects:", projects);
  const indexes = await mongoose.connection.collection("projects").indexes();
  console.log("Current indexes on 'projects' collection:", JSON.stringify(indexes, null, 2));
  await mongoose.disconnect();
}

checkProjects().catch(console.error);
