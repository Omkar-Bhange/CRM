require("../backend/node_modules/dotenv").config({ path: require("path").join(__dirname, "../backend/.env") });
const mongoose = require("../backend/node_modules/mongoose");
const path = require("path");

console.log("=== COMPILING ALL SCHEMAS PROGRAMMATICALLY ===");

// Require auth first (registers User & AuthSession)
require("../backend/auth");

// Require admin (registers Client, ProductSale, ProductSalePayment, AmcContract, AmcInvoice, IdempotencyLog, AmcPayment, AmcReminder, AppCounter, ClientAmcRequest)
require("../backend/admin");

// Require employee (registers Employee)
require("../backend/employee");

// Require attendance (registers Attendance)
require("../backend/attendance");

// Require attendance-v2 (registers AttendanceV2, AttendanceEvent, LeaveBalance, AttendanceRegularization, AttendanceApprovalRequest)
require("../backend/attendance-v2");

// Require agentSession (registers AgentDailySummary)
require("../backend/agentSession");

// Require any models in models/
const modelsDir = path.join(__dirname, "../backend/models");
const fs = require("fs");
fs.readdirSync(modelsDir).forEach(f => {
  if (f.endsWith(".js")) require(`../backend/models/${f}`);
});

console.log("\nTotal Compiled Models in mongoose.models:", Object.keys(mongoose.models).length);

const inventory = [];

for (const [name, model] of Object.entries(mongoose.models)) {
  const schema = model.schema;
  const paths = Object.keys(schema.paths);
  const indexes = schema.indexes();
  const collectionName = model.collection ? model.collection.name : schema.options.collection || 'default';
  
  // Find ref dependencies
  const refs = [];
  for (const [pName, pObj] of Object.entries(schema.paths)) {
    if (pObj.options && pObj.options.ref) {
      refs.push(`${pName} -> ${pObj.options.ref}`);
    } else if (pObj.caster && pObj.caster.options && pObj.caster.options.ref) {
      refs.push(`${pName}[] -> ${pObj.caster.options.ref}`);
    }
  }

  inventory.push({
    modelName: name,
    collectionName,
    fieldCount: paths.length,
    indexCount: indexes.length,
    indexes: indexes.map(idx => Object.keys(idx[0]).join(', ')),
    refs: refs
  });
}

// Print sorted inventory
inventory.sort((a, b) => a.modelName.localeCompare(b.modelName));

console.log(JSON.stringify(inventory, null, 2));

