const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get git show of backend/admin.js from commit 6b37804 in utf-8
const prevAdmin = execSync('git show 6b37804:backend/admin.js', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
const newModel = fs.readFileSync(path.join(__dirname, '../backend/models/AmcReminder.js'), 'utf8');

const lines = prevAdmin.split(/\r?\n/);
const originalChunk = lines.slice(4792, 4930).join('\n');

console.log("=== ORIGINAL CHUNK (lines 4793-4930 in admin.js @ 6b37804) ===");
console.log(originalChunk);

console.log("\n=== NEW MODEL FILE (backend/models/AmcReminder.js) ===");
console.log(newModel);

const fields = [
  "amcContractId", "contractCode", "clientId", "clientCode", "clientName",
  "channel", "message", "assignedEmployeeId", "assignedEmployeeCode",
  "assignedEmployeeName", "followUpDate", "notes", "sentAt", "sentBy",
  "sentByName", "status", "isDeleted"
];

console.log("\n=== FIELD-BY-FIELD PARITY CHECK ===");
let allMatch = true;
for (const field of fields) {
  const origHas = originalChunk.includes(field);
  const newHas = newModel.includes(field);
  const match = origHas && newHas;
  if (!match) allMatch = false;
  console.log(`Field [${field}]: orig=${origHas}, new=${newHas} => ${match ? 'MATCH' : 'MISMATCH'}`);
}

console.log("\n=== OPTIONS & INDEXES PARITY ===");
const checks = [
  { name: "collection: 'amcreminders'", pass: originalChunk.includes('collection: "amcreminders"') && newModel.includes('collection: "amcreminders"') },
  { name: "timestamps: true", pass: originalChunk.includes('timestamps: true') && newModel.includes('timestamps: true') },
  { name: "compound index { amcContractId: 1, sentAt: -1 }", pass: originalChunk.includes('amcContractId: 1') && originalChunk.includes('sentAt: -1') && newModel.includes('amcContractId: 1') && newModel.includes('sentAt: -1') },
  { name: "enum channel values", pass: originalChunk.includes('"WhatsApp"') && originalChunk.includes('"Email"') && originalChunk.includes('"SMS"') && originalChunk.includes('"Phone Call"') && newModel.includes('"WhatsApp"') && newModel.includes('"Email"') && newModel.includes('"SMS"') && newModel.includes('"Phone Call"') },
  { name: "enum status values", pass: originalChunk.includes('"Sent"') && originalChunk.includes('"Call Logged"') && originalChunk.includes('"Failed"') && newModel.includes('"Sent"') && newModel.includes('"Call Logged"') && newModel.includes('"Failed"') },
  { name: "default status 'Sent'", pass: originalChunk.includes('default: "Sent"') && newModel.includes('default: "Sent"') },
  { name: "default isDeleted false", pass: originalChunk.includes('default: false') && newModel.includes('default: false') },
  { name: "default assignedEmployeeName 'Unassigned'", pass: originalChunk.includes('default: "Unassigned"') && newModel.includes('default: "Unassigned"') },
  { name: "model registration guard", pass: originalChunk.includes('mongoose.models.AmcReminder ||') && newModel.includes('mongoose.models.AmcReminder ||') },
  { name: "model name 'AmcReminder'", pass: originalChunk.includes('"AmcReminder"') && newModel.includes('"AmcReminder"') }
];

for (const c of checks) {
  if (!c.pass) allMatch = false;
  console.log(`Check [${c.name}]: ${c.pass ? 'PASS' : 'FAIL'}`);
}

console.log("\nALL AMCREMINDER PARITY CHECKS PASS:", allMatch);

