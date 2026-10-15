"use strict";

const fs = require("fs");
const path = require("path");

console.log("=== GROUND-TRUTH MONGOOSE MODEL AUDIT ===");

// 1. Scan backend/models directory
const modelsDir = path.resolve("backend/models");
const centralizedFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith(".js"));

console.log(`\nFound ${centralizedFiles.length} files in backend/models/:`);
const centralizedModels = [];

for (const file of centralizedFiles) {
  const filePath = path.join(modelsDir, file);
  const content = fs.readFileSync(filePath, "utf8");
  
  // Find model name and collection
  const modelMatch = content.match(/mongoose\.model\(\s*["']([^"']+)["']/);
  const collMatch = content.match(/collection:\s*["']([^"']+)["']/);
  
  const modelName = modelMatch ? modelMatch[1] : path.basename(file, ".js");
  const collectionName = collMatch ? collMatch[1] : (modelName.toLowerCase() + "s");
  
  centralizedModels.push({
    modelName,
    file: `backend/models/${file}`,
    collection: collectionName,
  });
}

console.log(JSON.stringify(centralizedModels, null, 2));

// 2. Scan remaining backend JS files for inline mongoose.model calls
console.log("\nScanning remaining backend files for inline model definitions...");
const inlineModels = [];

const backendFiles = fs.readdirSync("backend").filter(f => f.endsWith(".js"));

for (const file of backendFiles) {
  if (file.startsWith("verify_") || file.startsWith("test_")) continue;
  const filePath = path.join("backend", file);
  const content = fs.readFileSync(filePath, "utf8");
  
  // Regex to find mongoose.model("Name", schema)
  const regex = /mongoose\.model\(\s*["']([^"']+)["']\s*,\s*([a-zA-Z0-9_]+)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const modelName = match[1];
    const schemaVar = match[2];
    
    // Find collection if specified in schema
    let coll = null;
    const collMatch = content.match(new RegExp(`${schemaVar}[\\s\\S]*?collection:\\s*["']([^"']+)["']`));
    if (collMatch) coll = collMatch[1];
    
    // Check if this model is already centralized in backend/models
    const alreadyCentralized = centralizedModels.some(m => m.modelName === modelName);
    
    inlineModels.push({
      modelName,
      file: `backend/${file}`,
      schemaVar,
      collection: coll || "(default/unspecified)",
      isAlreadyCentralized: alreadyCentralized,
    });
  }
}

console.log("\nInline mongoose.model calls found in backend root files:");
console.log(JSON.stringify(inlineModels, null, 2));

const trulyInline = inlineModels.filter(m => !m.isAlreadyCentralized);
console.log(`\nTruly inline unique models remaining: ${trulyInline.length}`);
console.log(JSON.stringify(trulyInline, null, 2));

console.log(`\n========================================`);
console.log(`Centralized Models in backend/models: ${centralizedModels.length}`);
console.log(`Truly Inline Models Remaining: ${trulyInline.length}`);
console.log(`Total Model Concepts: ${centralizedModels.length + trulyInline.length}`);
console.log(`========================================`);

