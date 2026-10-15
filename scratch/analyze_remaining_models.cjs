const fs = require('fs');
const path = require('path');
const mongoose = require('../backend/node_modules/mongoose');

require('../backend/node_modules/dotenv').config({ path: path.join(__dirname, '../backend/.env') });

require('../backend/auth');
require('../backend/admin');
require('../backend/employee');
require('../backend/attendance');
require('../backend/attendance-v2');
require('../backend/agentSession');

const modelsDir = path.join(__dirname, '../backend/models');
const centralizedModelFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js'));
const centralizedNames = new Set();
centralizedModelFiles.forEach(f => {
  const mod = require(`../backend/models/${f}`);
  if (mod.modelName) centralizedNames.add(mod.modelName);
});
// LeaveRequestV2 alias
centralizedNames.add("LeaveRequestV2");

console.log("Centralized model names:", [...centralizedNames]);

const allCompiled = Object.keys(mongoose.models).sort();
const remaining = allCompiled.filter(m => !centralizedNames.has(m));

console.log("\nTOTAL REMAINING INLINE MODELS:", remaining.length);
console.log(remaining);

// For each remaining model, find where it is defined in the source code
const backendFiles = [
  'backend/auth.js',
  'backend/admin.js',
  'backend/employee.js',
  'backend/attendance.js',
  'backend/attendance-v2.js',
  'backend/agentSession.js',
  'backend/client.js',
  'backend/documents.js'
];

const results = [];

for (const modelName of remaining) {
  const model = mongoose.models[modelName];
  const collectionName = model.collection ? model.collection.name : model.schema.options.collection;
  const paths = Object.keys(model.schema.paths);
  const indexes = model.schema.indexes();

  const defLocations = [];
  for (const bf of backendFiles) {
    const full = path.join(__dirname, '..', bf);
    if (!fs.existsSync(full)) continue;
    const content = fs.readFileSync(full, 'utf8');
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      // Check for mongoose.model("ModelName" or mongoose.model('ModelName'
      // Or mongoose.model(\n "ModelName"
      const chunk = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join(' ');
      if (chunk.includes(`mongoose.model`) && (chunk.includes(`"${modelName}"`) || chunk.includes(`'${modelName}'`))) {
        defLocations.push({ file: bf, line: i + 1 });
        break; // one match per file
      }
    }
  }

  results.push({
    modelName,
    collectionName,
    fieldCount: paths.length,
    indexCount: indexes.length,
    indexes: indexes.map(idx => Object.keys(idx[0]).join(', ')),
    defLocations
  });
}

console.log("\n=== DETAILS OF ALL 17 REMAINING INLINE MODELS ===");
results.forEach((r, idx) => {
  console.log(`\n[${idx + 1}] Model: ${r.modelName}`);
  console.log(`    Collection: ${r.collectionName}`);
  console.log(`    Fields (${r.fieldCount}): index count = ${r.indexCount}`);
  console.log(`    Indexes: ${r.indexes.join(' | ') || 'None'}`);
  console.log(`    Defined in: ${r.defLocations.map(d => `${d.file}:${d.line}`).join(', ') || 'UNKNOWN'}`);
});

