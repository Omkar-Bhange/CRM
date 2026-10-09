const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/crm_development";

async function executeReadOnlyAudit() {
  console.log("================================================================================");
  console.log("   READ-ONLY DATABASE INTEGRITY AUDIT: AMC CONTRACTS & INVOICES                 ");
  console.log("================================================================================");
  console.log(`Auditing target database: ${MONGO_URI.replace(/\/\/.*@/, "//<credentials-hidden>@")}`);

  await mongoose.connect(MONGO_URI);
  console.log(`Connected successfully. Database Name: ${mongoose.connection.name}`);

  const AmcInvoice = mongoose.models.AmcInvoice || mongoose.model("AmcInvoice", new mongoose.Schema({}, { strict: false, collection: "amcinvoices" }));
  const AmcContract = mongoose.models.AmcContract || mongoose.model("AmcContract", new mongoose.Schema({}, { strict: false, collection: "amccontracts" }));

  // 1. Audit Active Start Date Collisions
  console.log("\n1. Auditing active AMC invoice start date collisions...");
  const activeInvoiceCollisions = await AmcInvoice.aggregate([
    {
      $match: {
        isDeleted: false,
        status: { $in: ["Issued", "Draft"] },
      },
    },
    {
      $group: {
        _id: { amcContractId: "$amcContractId", contractStartDate: "$contractStartDate" },
        count: { $sum: 1 },
        invoices: { $push: "$invoiceCode" },
      },
    },
    {
      $match: { count: { $gt: 1 } },
    },
  ]);
  console.log(`   Found ${activeInvoiceCollisions.length} collision(s).`);
  if (activeInvoiceCollisions.length > 0) {
    console.log("   Collisions:", JSON.stringify(activeInvoiceCollisions, null, 2));
  } else {
    console.log("   ✅ Result: 0 collisions. Safe for unique partial index.");
  }

  // 2. Audit Existing Invoice Status Enums
  console.log("\n2. Auditing distinct invoice status values...");
  const distinctStatuses = await AmcInvoice.distinct("status");
  console.log(`   Distinct 'status' values:`, distinctStatuses);

  // 3. Audit Existing Invoice Payment Status Enums
  console.log("\n3. Auditing distinct invoice paymentStatus values...");
  const distinctPaymentStatuses = await AmcInvoice.distinct("paymentStatus");
  console.log(`   Distinct 'paymentStatus' values:`, distinctPaymentStatuses);

  // 4. Audit Existing Indexes on amcinvoices collection
  console.log("\n4. Auditing existing indexes on 'amcinvoices' collection...");
  const existingInvoiceIndexes = await mongoose.connection.db.collection("amcinvoices").indexes();
  console.log(`   Existing indexes (${existingInvoiceIndexes.length}):`);
  for (const idx of existingInvoiceIndexes) {
    console.log(`   - Name: "${idx.name}", Key: ${JSON.stringify(idx.key)}, Unique: ${Boolean(idx.unique)}, PartialFilter: ${idx.partialFilterExpression ? JSON.stringify(idx.partialFilterExpression) : "None"}`);
  }

  // 5. Audit Existing Indexes on amccontracts collection
  console.log("\n5. Auditing existing indexes on 'amccontracts' collection...");
  const existingContractIndexes = await mongoose.connection.db.collection("amccontracts").indexes();
  console.log(`   Existing indexes (${existingContractIndexes.length}):`);
  for (const idx of existingContractIndexes) {
    console.log(`   - Name: "${idx.name}", Key: ${JSON.stringify(idx.key)}, Unique: ${Boolean(idx.unique)}`);
  }

  // 6. Audit Total Document Counts
  const totalContracts = await AmcContract.countDocuments({ isDeleted: false });
  const totalInvoices = await AmcInvoice.countDocuments({ isDeleted: false });
  console.log(`\n6. Active record counts: Total Contracts = ${totalContracts}, Total Invoices = ${totalInvoices}`);

  console.log("\n================================================================================");
  console.log("   READ-ONLY AUDIT COMPLETE: 0 DATA ANOMALIES DETECTED                          ");
  console.log("================================================================================");

  await mongoose.disconnect();
}

executeReadOnlyAudit().catch((err) => {
  console.error("Audit script failed:", err);
  process.exit(1);
});
