"use strict";

const fs = require("fs");
const path = require("path");

const backendDir = path.resolve(__dirname, "../backend");
const modelsDir = path.join(backendDir, "models");

const modelFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith(".js"));

let out = `Total files in backend/models/: ${modelFiles.length}\n\n`;
out += "=== 33 CENTRALIZED MODELS IN backend/models/ ===\n";

for (let i = 0; i < modelFiles.length; i++) {
  const f = modelFiles[i];
  const filePath = path.join(modelsDir, f);
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  
  let registeredName = null;
  let collectionName = null;
  let regLine = null;

  for (let j = 0; j < lines.length; j++) {
    const line = lines[j];
    const m = line.match(/mongoose\.model\(\s*["']([^"']+)["']/);
    if (m && !registeredName) {
      registeredName = m[1];
      regLine = j + 1;
    }
    const c = line.match(/collection:\s*["']([^"']+)["']/);
    if (c && !collectionName) {
      collectionName = c[1];
    }
  }

  out += `${(i + 1).toString().padStart(2, "0")}. Model: "${registeredName}" | File: backend/models/${f} | Collection: "${collectionName || "(default)"}" | Line: ${regLine}\n`;
}

fs.writeFileSync(path.join(__dirname, "inventory_output.txt"), out, "utf8");
console.log("Wrote inventory_output.txt");

