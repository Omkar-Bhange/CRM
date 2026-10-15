"use strict";

const fs = require("fs");
const path = require("path");

const backendDir = path.resolve(__dirname, "../backend");
const modelsDir = path.resolve(backendDir, "models");

// 1. List all centralized models in backend/models
const centralizedFiles = fs.readdirSync(modelsDir)
  .filter(f => f.endsWith(".js"))
  .sort();

console.log("=== CENTRALIZED MODELS IN backend/models/ (" + centralizedFiles.length + ") ===");
const centralizedModels = [];
centralizedFiles.forEach(f => {
  const content = fs.readFileSync(path.join(modelsDir, f), "utf8");
  const modelMatches = [...content.matchAll(/mongoose\.model\(\s*["']([^"']+)["']/g)];
  const modelNames = modelMatches.map(m => m[1]);
  const collectionMatches = [...content.matchAll(/collection:\s*["']([^"']+)["']/g)];
  const collections = collectionMatches.map(m => m[1]);
  centralizedModels.push({
    file: f,
    modelNames,
    collections
  });
  console.log(`- ${f.padEnd(32)} -> Model: [${modelNames.join(", ")}], Collection: [${collections.join(", ")}]`);
});

// 2. Scan all backend/*.js files (excluding models/ and node_modules/) for mongoose.model registrations
console.log("\n=== INLINE mongoose.model CALLS IN backend/*.js ===");
const backendFiles = fs.readdirSync(backendDir)
  .filter(f => f.endsWith(".js"))
  .sort();

const inlineRegistrations = [];
backendFiles.forEach(f => {
  const content = fs.readFileSync(path.join(backendDir, f), "utf8");
  const modelMatches = [...content.matchAll(/mongoose\.model\(\s*["']([^"']+)["']/g)];
  if (modelMatches.length > 0) {
    const names = modelMatches.map(m => m[1]);
    inlineRegistrations.push({ file: f, names });
    console.log(`File: ${f}`);
    names.forEach(name => console.log(`   - Model registered: "${name}"`));
  }
});

// 3. Search for Quotation across backend
console.log("\n=== SEARCH FOR 'Quotation' ACROSS backend/ ===");
backendFiles.forEach(f => {
  const content = fs.readFileSync(path.join(backendDir, f), "utf8");
  if (/quotation/i.test(content)) {
    const lines = content.split("\n");
    const matchingLines = [];
    lines.forEach((l, idx) => {
      if (/mongoose\.model\(.*quotation/i.test(l) || /quotationSchema/i.test(l) || /new Schema\(.*quotation/i.test(l) || /mongoose\.models\.Quotation/i.test(l)) {
        matchingLines.push(`${idx + 1}: ${l.trim()}`);
      }
    });
    if (matchingLines.length > 0) {
      console.log(`File: ${f}`);
      matchingLines.forEach(l => console.log(`   ${l}`));
    }
  }
});

// 4. Detailed investigation of User and Employee
console.log("\n=== USER REGISTRATIONS ===");
backendFiles.forEach(f => {
  const content = fs.readFileSync(path.join(backendDir, f), "utf8");
  const matches = [...content.matchAll(/mongoose\.model\(\s*["']User["']/g)];
  if (matches.length > 0) {
    console.log(`File: ${f} registers "User" (${matches.length} times)`);
  }
});

console.log("\n=== EMPLOYEE REGISTRATIONS ===");
backendFiles.forEach(f => {
  const content = fs.readFileSync(path.join(backendDir, f), "utf8");
  const matches = [...content.matchAll(/mongoose\.model\(\s*["']Employee["']/g)];
  if (matches.length > 0) {
    console.log(`File: ${f} registers "Employee" (${matches.length} times)`);
  }
});

