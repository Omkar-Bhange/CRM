const path = require("path");
const mongoose = require(path.resolve("backend/node_modules/mongoose"));
require(path.resolve("backend/node_modules/dotenv")).config({ path: "backend/.env" });

async function inspectSample() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB:", mongoose.connection.name);

  for (const colName of ["clients", "amccontracts", "amcinvoices"]) {
    const c = mongoose.connection.db.collection(colName);
    const docs = await c.find({
      $or: [
        { clientCode: { $regex: "TEST", $options: "i" } },
        { contractCode: { $regex: "TEST", $options: "i" } },
        { invoiceCode: { $regex: "TEST", $options: "i" } },
      ],
    }).limit(5).toArray();

    console.log(`\nSample from ${colName}:`);
    for (const d of docs) {
      console.log(`  _id: ${d._id}, clientCode: ${d.clientCode}, contractCode: ${d.contractCode}, invoiceCode: ${d.invoiceCode}, createdAt: ${d.createdAt}`);
    }
  }

  // Specifically check for __TEST_ISSUE6__
  console.log("\nChecking specifically for __TEST_ISSUE6__ records:");
  for (const colName of ["clients", "amccontracts", "amcinvoices", "idempotencylogs", "activitylogs"]) {
    const c = mongoose.connection.db.collection(colName);
    const issue6Count = await c.countDocuments({
      $or: [
        { clientCode: { $regex: "TEST_ISSUE6", $options: "i" } },
        { contractCode: { $regex: "TEST_ISSUE6", $options: "i" } },
        { invoiceCode: { $regex: "TEST_ISSUE6", $options: "i" } },
        { idempotencyKey: { $regex: "TEST_ISSUE6", $options: "i" } },
        { entityCode: { $regex: "TEST_ISSUE6", $options: "i" } },
      ],
    });
    console.log(`  ${colName}: ${issue6Count} records matching TEST_ISSUE6`);
  }

  await mongoose.disconnect();
}

inspectSample().catch(console.error);
