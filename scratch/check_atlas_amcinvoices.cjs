require("../backend/node_modules/dotenv").config({ path: require("path").join(__dirname, "../backend/.env") });
const mongoose = require("../backend/node_modules/mongoose");

async function checkAtlasAmcInvoices() {
  console.log("=== ATLAS READ-ONLY AMCINVOICES & AMCCONTRACTS INSPECTION ===");
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.log("No MONGO_URI in .env");
    return;
  }

  await mongoose.connect(uri);
  console.log("Connected to Atlas DB:", mongoose.connection.name);

  const db = mongoose.connection.db;
  
  // 1. Check collection existence
  const amcInvoicesColls = await db.listCollections({ name: "amcinvoices" }).toArray();
  const amcContractsColls = await db.listCollections({ name: "amccontracts" }).toArray();
  console.log("Collection 'amcinvoices' exists:", amcInvoicesColls.length > 0);
  console.log("Collection 'amccontracts' exists:", amcContractsColls.length > 0);

  if (amcInvoicesColls.length > 0) {
    const invCol = db.collection("amcinvoices");
    const invCount = await invCol.countDocuments();
    console.log("Document count in amcinvoices:", invCount);

    // Indexes
    const invIndexes = await invCol.indexes();
    console.log("Indexes on amcinvoices:");
    invIndexes.forEach(idx => {
      console.log(`  - name: "${idx.name}", key: ${JSON.stringify(idx.key)}, unique: ${!!idx.unique}, partial: ${JSON.stringify(idx.partialFilterExpression || null)}`);
    });

    // Aggregations on data shapes, sequences, financial amount distributions
    if (invCount > 0) {
      const typeDist = await invCol.aggregate([
        { $group: { _id: "$invoiceType", count: { $sum: 1 } } }
      ]).toArray();
      console.log("Invoice type distribution:", JSON.stringify(typeDist));

      const statusDist = await invCol.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]).toArray();
      console.log("Invoice status distribution:", JSON.stringify(statusDist));

      const payStatusDist = await invCol.aggregate([
        { $group: { _id: "$paymentStatus", count: { $sum: 1 } } }
      ]).toArray();
      console.log("Payment status distribution:", JSON.stringify(payStatusDist));

      const seqStats = await invCol.aggregate([
        {
          $group: {
            _id: null,
            minInvoiceNumber: { $min: "$invoiceNumber" },
            maxInvoiceNumber: { $max: "$invoiceNumber" },
            avgTaxableAmount: { $avg: "$taxableAmount" },
            minTaxableAmount: { $min: "$taxableAmount" },
            maxTaxableAmount: { $max: "$taxableAmount" },
            totalAmountSum: { $sum: "$totalAmount" },
            totalPaidSum: { $sum: "$paidAmount" },
            totalPendingSum: { $sum: "$pendingAmount" },
            taxClassificationCount: { $addToSet: "$taxClassification" },
            hasGstRates: {
              $sum: {
                $cond: [{ $or: [{ $gt: ["$cgstRate", 0] }, { $gt: ["$igstRate", 0] }] }, 1, 0]
              }
            }
          }
        }
      ]).toArray();
      console.log("Sequence & Financial Distribution Summary:", JSON.stringify(seqStats, null, 2));

      // Reference integrity check
      const missingContractRef = await invCol.countDocuments({
        amcContractId: { $exists: false }
      });
      const missingClientRef = await invCol.countDocuments({
        clientCode: { $exists: false }
      });
      console.log(`Reference check: Missing amcContractId: ${missingContractRef}, Missing clientCode: ${missingClientRef}`);
    }
  }

  if (amcContractsColls.length > 0) {
    const ctrCol = db.collection("amccontracts");
    const ctrCount = await ctrCol.countDocuments();
    console.log("Document count in amccontracts:", ctrCount);

    const queuedRenewals = await ctrCol.countDocuments({
      "upcomingRenewal.startDate": { $exists: true, $ne: null }
    });
    console.log("Contracts with upcomingRenewal queued:", queuedRenewals);

    const historyCount = await ctrCol.countDocuments({
      "renewalHistory.0": { $exists: true }
    });
    console.log("Contracts with renewalHistory entries:", historyCount);
  }

  await mongoose.disconnect();
  console.log("Disconnected from Atlas. Zero writes performed.");
}

checkAtlasAmcInvoices().catch(err => {
  console.error("Atlas inspection error:", err);
  process.exit(1);
});

