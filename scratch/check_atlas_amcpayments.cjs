require("../backend/node_modules/dotenv").config({ path: require("path").join(__dirname, "../backend/.env") });
const mongoose = require("../backend/node_modules/mongoose");

async function checkAtlasAmcPayments() {
  console.log("=== ATLAS READ-ONLY AMCPAYMENTS INSPECTION ===");
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.log("No MONGO_URI in .env");
    return;
  }

  await mongoose.connect(uri);
  console.log("Connected to Atlas DB:", mongoose.connection.name);

  const db = mongoose.connection.db;
  const colls = await db.listCollections({ name: "amcpayments" }).toArray();
  console.log("Collection 'amcpayments' exists:", colls.length > 0);

  if (colls.length > 0) {
    const col = db.collection("amcpayments");
    const count = await col.countDocuments();
    console.log("Document count in amcpayments:", count);

    const indexes = await col.indexes();
    console.log("Indexes on amcpayments:");
    indexes.forEach(idx => {
      console.log(`  - name: "${idx.name}", key: ${JSON.stringify(idx.key)}, unique: ${!!idx.unique}, sparse: ${!!idx.sparse}`);
    });

    if (count > 0) {
      const modeDist = await col.aggregate([
        { $group: { _id: "$mode", count: { $sum: 1 } } }
      ]).toArray();
      console.log("Payment mode distribution:", JSON.stringify(modeDist));

      const deletedCount = await col.countDocuments({ isDeleted: true });
      console.log("Soft-deleted payments count:", deletedCount);

      const stats = await col.aggregate([
        {
          $group: {
            _id: null,
            minAmount: { $min: "$amount" },
            maxAmount: { $max: "$amount" },
            avgAmount: { $avg: "$amount" },
            totalAmountSum: { $sum: "$amount" },
            hasIdempotencyKey: {
              $sum: { $cond: [{ $ifNull: ["$idempotencyKey", false] }, 1, 0] }
            },
            minDate: { $min: "$paymentDate" },
            maxDate: { $max: "$paymentDate" }
          }
        }
      ]).toArray();
      console.log("Amount & Date Distribution Summary:", JSON.stringify(stats, null, 2));

      // Reference integrity check
      const missingContract = await col.countDocuments({ amcContractId: { $exists: false } });
      const missingInvoice = await col.countDocuments({ amcInvoiceId: { $exists: false } });
      const missingClient = await col.countDocuments({ clientId: { $exists: false } });
      console.log(`Reference check: Missing contract: ${missingContract}, Missing invoice: ${missingInvoice}, Missing client: ${missingClient}`);

      // Sample code prefix check
      const sampleCodes = await col.aggregate([
        { $project: { prefix: { $substr: ["$paymentCode", 0, 8] } } },
        { $group: { _id: "$prefix", count: { $sum: 1 } } }
      ]).toArray();
      console.log("Payment code prefix distribution:", JSON.stringify(sampleCodes));
    }
  }

  await mongoose.disconnect();
  console.log("Disconnected from Atlas. Zero writes performed.");
}

checkAtlasAmcPayments().catch(err => {
  console.error("Atlas inspection error:", err);
  process.exit(1);
});

