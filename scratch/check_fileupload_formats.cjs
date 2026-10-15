"use strict";
const path = require("path");
const mongoose = require(path.resolve(__dirname, "../backend/node_modules/mongoose"));
const dotenv = require(path.resolve(__dirname, "../backend/node_modules/dotenv"));
dotenv.config({ path: "./backend/.env" });

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!uri) {
  console.log("No Mongo URI found in backend/.env");
  process.exit(0);
}

mongoose.connect(uri).then(async () => {
  console.log("Connected to Atlas to inspect document formats (read-only)...");
  const cd = await mongoose.connection.collection("clientdocuments").find({}).toArray();
  console.log("clientdocuments count:", cd.length);
  for (const d of cd) {
    console.log("  clientdoc:", {
      _id: d._id,
      clientId: d.clientId,
      fileUrl: d.fileUrl,
      fileName: d.fileName,
      isDeleted: d.isDeleted,
    });
  }

  const amc = await mongoose.connection.collection("amccontracts").find({ "documents.0": { $exists: true } }).toArray();
  console.log("amccontracts with docs count:", amc.length);
  for (const a of amc.slice(0, 5)) {
    console.log("  amc docs:", a.documents.map(d => ({ relativePath: d.relativePath, storedFileName: d.storedFileName })));
  }

  const tickets = await mongoose.connection.collection("supporttickets").find({ "attachments.0": { $exists: true } }).toArray();
  console.log("tickets with attachments count:", tickets.length);
  for (const t of tickets.slice(0, 5)) {
    console.log("  ticket attachments:", t.attachments.map(a => ({ fileUrl: a.fileUrl })));
  }

  const tasks = await mongoose.connection.collection("tasks").find({ "attachments.0": { $exists: true } }).toArray();
  console.log("tasks with attachments count:", tasks.length);
  for (const t of tasks.slice(0, 5)) {
    console.log("  task attachments:", t.attachments.map(a => ({ fileUrl: a.fileUrl })));
  }

  await mongoose.disconnect();
  process.exit(0);
}).catch(err => {
  console.error("Atlas connection error:", err.message);
  process.exit(0);
});
