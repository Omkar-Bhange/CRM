const path = require("path");
process.env.NODE_PATH = path.resolve(__dirname, "../backend/node_modules");
require("module").Module._initPaths();
const mongoose = require("mongoose");

async function checkIndexStartupBehavior() {
  const uri = "mongodb://127.0.0.1:27017/test_idx_behavior";
  await mongoose.connect(uri);
  console.log("Connected to local mongodb");

  const badSchema = new mongoose.Schema({ x: Number });
  badSchema.index({ x: 1 }, { unique: true, partialFilterExpression: { x: { $ne: 1 } } });
  
  const BadModel = mongoose.model("BadModel", badSchema);
  console.log("BadModel defined. Server startup would have continued synchronously.");

  // Test what happens when init is awaited
  try {
    await BadModel.init();
    console.log("init succeeded");
  } catch (err) {
    console.log("Caught async index build error:", err.message);
  }

  await mongoose.disconnect();
}

checkIndexStartupBehavior();

