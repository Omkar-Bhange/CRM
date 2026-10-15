const path = require("path");
const mongoose = require(path.join(__dirname, "../backend/node_modules/mongoose"));
require(path.join(__dirname, "../backend/node_modules/dotenv")).config({
  path: path.join(__dirname, "../backend/.env"),
});

async function check() {
  console.log("=== CHECKING DISCREPANCY ===");
  console.log("process.env.MONGO_URI:", process.env.MONGO_URI ? "EXISTS (Atlas)" : "NOT SET");
  console.log("process.env.MONGODB_URI:", process.env.MONGODB_URI ? "EXISTS" : "NOT SET");

  // 1. Check with process.env.MONGO_URI (Atlas)
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MONGO_URI DB name:", mongoose.connection.name);
  console.log("Connected to host:", mongoose.connection.host);
  const Product = require("../backend/models/Product");
  const countAtlas = await Product.countDocuments();
  console.log("Products in Atlas DB:", countAtlas);
  const products = await Product.find({}, "productName productCode status").lean();
  console.log("Atlas Products List:", products);
  await mongoose.disconnect();

  // 2. Check with localhost:27017 fallback (used by verify_product_model.cjs when MONGODB_URI was undefined)
  try {
    await mongoose.connect("mongodb://localhost:27017/ClientConnectTrack", { serverSelectionTimeoutMS: 2000 });
    console.log("\nConnected to Localhost:27017 DB name:", mongoose.connection.name);
    console.log("Connected to host:", mongoose.connection.host);
    const countLocal = await Product.countDocuments();
    console.log("Products in Local DB:", countLocal);
    await mongoose.disconnect();
  } catch (err) {
    console.log("Localhost MongoDB not reachable or timed out:", err.message);
  }
}

check().catch(console.error);
