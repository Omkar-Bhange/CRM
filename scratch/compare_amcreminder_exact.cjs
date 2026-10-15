const fs = require('fs');
const path = require('path');

const prevAdmin = fs.readFileSync(path.join(__dirname, 'admin_prev.js'), 'utf8');
const newModel = fs.readFileSync(path.join(__dirname, 'amcreminder_new.js'), 'utf8');

const lines = prevAdmin.split(/\r?\n/);
const originalChunk = lines.slice(4792, 4931).join('\n');

console.log("=== ORIGINAL CHUNK (from admin.js lines 4793-4931) ===");
console.log(originalChunk);

console.log("\n=== NEW MODEL FILE (backend/models/AmcReminder.js) ===");
console.log(newModel);

// Normalizing whitespace and comparing tokens
function tokenize(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '') // remove multi-line comments
    .replace(/\/\/.*/g, '')            // remove single-line comments
    .replace(/\s+/g, ' ')              // collapse whitespace
    .trim();
}

const originalTokenized = tokenize(originalChunk);
const newTokenized = tokenize(newModel.replace('const mongoose = require("mongoose");', ''));

console.log("\n=== TOKENIZED COMPARISON ===");
console.log("Original token length:", originalTokenized.length);
console.log("New token length:", newTokenized.length);

// Compare field by field:
const fields = [
  "amcContractId", "contractCode", "clientId", "clientCode", "clientName",
  "channel", "message", "assignedEmployeeId", "assignedEmployeeCode",
  "assignedEmployeeName", "followUpDate", "notes", "sentAt", "sentBy",
  "sentByName", "status", "isDeleted"
];

for (const field of fields) {
  const origHas = originalChunk.includes(field);
  const newHas = newModel.includes(field);
  console.log(`Field ${field}: Original=${origHas}, New=${newHas}, Parity=${origHas === newHas}`);
}

// Compare indexes & options
console.log("Collection 'amcreminders':", originalChunk.includes('"amcreminders"') === newModel.includes('"amcreminders"'));
console.log("timestamps: true:", originalChunk.includes('timestamps: true') === newModel.includes('timestamps: true'));
console.log("Compound index { amcContractId: 1, sentAt: -1 }:",
  originalChunk.includes('amcContractId: 1') && originalChunk.includes('sentAt: -1') &&
  newModel.includes('amcContractId: 1') && newModel.includes('sentAt: -1')
);
console.log("Model name 'AmcReminder':",
  originalChunk.includes('"AmcReminder"') && newModel.includes('"AmcReminder"')
);
console.log("Registration guard:",
  originalChunk.includes('mongoose.models.AmcReminder ||') && newModel.includes('mongoose.models.AmcReminder ||')
);

