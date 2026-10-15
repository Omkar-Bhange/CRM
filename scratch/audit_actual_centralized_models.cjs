"use strict";
const fs = require("fs");
const path = require("path");

const modelsDir = path.join(__dirname, "..", "backend", "models");
const files = fs.readdirSync(modelsDir).filter(f => f.endsWith(".js"));

console.log(`Found ${files.length} model files in backend/models:\n`);

const results = [];
for (const file of files) {
  const filePath = path.join(modelsDir, file);
  const content = fs.readFileSync(filePath, "utf8");
  
  // Find model name
  const modelMatch = content.match(/mongoose\.model\(\s*["']([^"']+)["']/);
  // Find collection name
  const colMatch = content.match(/collection:\s*["']([^"']+)["']/);
  
  results.push({
    file: `backend/models/${file}`,
    modelName: modelMatch ? modelMatch[1] : "UNKNOWN",
    collection: colMatch ? colMatch[1] : "(default plural)",
  });
}

results.sort((a, b) => a.modelName.localeCompare(b.modelName));
results.forEach((r, idx) => {
  console.log(`${String(idx + 1).padStart(2)}. Model: ${r.modelName.padEnd(28)} | Collection: ${r.collection.padEnd(25)} | File: ${r.file}`);
});
console.log(`\nTotal Centralized Model Files: ${results.length}`);
