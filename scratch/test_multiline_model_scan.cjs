"use strict";

const fs = require("fs");
const path = require("path");

const modelsDir = path.resolve(__dirname, "../backend/models");
const modelFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith(".js"));

const results = [];

for (const f of modelFiles) {
  const content = fs.readFileSync(path.join(modelsDir, f), "utf8");
  
  // match mongoose.model( "Name" or 'Name' across whitespace/newlines
  const modelMatch = content.match(/mongoose\.model\(\s*["']([^"']+)["']/s) ||
                     content.match(/mongoose\.models\.(\w+)/);
  const collMatch = content.match(/collection:\s*["']([^"']+)["']/);
  
  results.push({
    file: f,
    modelName: modelMatch ? modelMatch[1] : "UNKNOWN",
    collection: collMatch ? collMatch[1] : "(default)"
  });
}

console.log(`Found ${results.length} files in backend/models/:\n`);
for (let i = 0; i < results.length; i++) {
  const r = results[i];
  console.log(`${(i + 1).toString().padStart(2, "0")}. [${r.modelName}] -> File: backend/models/${r.file} | Collection: "${r.collection}"`);
}

