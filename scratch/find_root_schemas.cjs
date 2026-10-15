"use strict";

const fs = require("fs");
const path = require("path");

const backendDir = path.resolve(__dirname, "../backend");
const files = fs.readdirSync(backendDir).filter(f => {
  if (!f.endsWith(".js") && !f.endsWith(".cjs")) return false;
  if (f.startsWith("test_") || f.startsWith("verify_")) return false;
  return true;
});

console.log("Scanning non-test backend files for Schema and Model definitions:\n");

for (const f of files) {
  const content = fs.readFileSync(path.join(backendDir, f), "utf8");
  const lines = content.split("\n");

  const schemas = [];
  const models = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const sMatch = line.match(/(const|let|var)\s+(\w+Schema)\s*=\s*new\s+mongoose\.Schema/);
    if (sMatch) {
      schemas.push({ name: sMatch[2], line: i + 1 });
    }
    const mMatch = line.match(/mongoose\.model\(\s*["']([^"']+)["']\s*,\s*(\w+)/);
    if (mMatch) {
      models.push({ modelName: mMatch[1], schemaVar: mMatch[2], line: i + 1 });
    }
  }

  if (schemas.length > 0 || models.length > 0) {
    console.log(`File: backend/${f}`);
    if (schemas.length > 0) console.log("  Schemas:", schemas);
    if (models.length > 0) console.log("  Model Definitions (with schema):", models);
  }
}

