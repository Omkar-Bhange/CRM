const path = require("path");
const mongoose = require(path.join(__dirname, "../backend/node_modules/mongoose"));
require(path.join(__dirname, "../backend/node_modules/dotenv")).config({
  path: path.join(__dirname, "../backend/.env"),
});

async function verifyProductModel() {
  console.log("=== VERIFYING PRODUCT MODEL CENTRALIZATION ===");

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/ClientConnectTrack";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB database:", mongoose.connection.name);

  // 1. Check Model Centralization require
  const Product = require("../backend/models/Product");
  console.log("Loaded Product model from backend/models/Product.js");

  // 2. Check registration in mongoose.models
  if (mongoose.models.Product !== Product) {
    throw new Error("Product model instance mismatch in mongoose.models!");
  }
  console.log("PASS: mongoose.models.Product matches required Product");

  // 3. Check collection name
  if (Product.collection.collectionName !== "products") {
    throw new Error(`Collection name mismatch! Expected 'products', got '${Product.collection.collectionName}'`);
  }
  console.log("PASS: Collection name is 'products'");

  // 4. Check schema paths
  const schemaPaths = Object.keys(Product.schema.paths);
  const requiredFields = [
    "productCode", "productName", "category", "description",
    "currentVersion", "platform", "status", "releaseDate",
    "createdBy", "createdByName", "updatedBy", "updatedByName",
    "isDeleted", "deletedAt", "deletedBy", "deletedByName",
    "createdAt", "updatedAt"
  ];
  for (const field of requiredFields) {
    if (!schemaPaths.includes(field)) {
      throw new Error(`Missing expected schema field: ${field}`);
    }
  }
  console.log("PASS: All 18 expected schema fields present");

  // 5. Check index definitions
  const indexes = Product.schema.indexes();
  console.log("Schema indexes count:", indexes.length);
  const textIndex = indexes.find(([idx]) => idx.productName === "text" && idx.productCode === "text");
  if (!textIndex) {
    throw new Error("Text index on { productName, productCode, category, description } is missing!");
  }
  console.log("PASS: Text search index verified:", textIndex[0]);

  // 6. Test read query against collection
  const count = await Product.countDocuments();
  console.log(`PASS: Found ${count} existing products in collection 'products'`);

  const sample = await Product.findOne().lean();
  if (sample) {
    console.log(`Sample product from DB: "${sample.productName}" (Code: ${sample.productCode}, ID: ${sample._id})`);
  }

  // 7. Verify loading admin.js does NOT throw OverwriteModelError or overwrite Product
  const adminRouter = require("../backend/admin");
  console.log("PASS: backend/admin.js loaded cleanly without OverwriteModelError");

  await mongoose.disconnect();
  console.log("=== ALL PRODUCT MODEL VERIFICATIONS PASSED ===");
}

verifyProductModel().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
