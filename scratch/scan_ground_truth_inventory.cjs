const fs = require("fs");
const path = require("path");

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== "node_modules" && file !== ".git" && file !== "dist") {
        results = results.concat(walkDir(fullPath));
      }
    } else if (file.endsWith(".js") || file.endsWith(".cjs")) {
      results.push(fullPath);
    }
  });
  return results;
}

const backendDir = path.resolve("backend");
const files = walkDir(backendDir);
console.log("Found backend files:", files.length);

const modelRegistrations = [];
const modelLookups = [];
const schemaDefinitions = [];
const requireModels = [];

files.forEach(file => {
  const rel = path.relative(".", file).replace(/\\/g, "/");
  // Skip test/verify scripts in backend root
  if (path.basename(file).startsWith("verify_") || path.basename(file).startsWith("test_")) return;
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    // Look for mongoose.model("...", ...)
    const modelMatch = line.match(/mongoose\.model\(\s*["']([^"']+)["']/);
    if (modelMatch) {
      modelRegistrations.push({
        file: rel,
        line: lineNum,
        modelName: modelMatch[1],
        raw: line.trim()
      });
    }

    // Look for mongoose.models.X
    const modelsMatches = [...line.matchAll(/mongoose\.models\.([a-zA-Z0-9_]+)/g)];
    modelsMatches.forEach(m => {
      modelLookups.push({
        file: rel,
        line: lineNum,
        modelName: m[1],
        raw: line.trim()
      });
    });

    // Look for new mongoose.Schema
    if (line.includes("new mongoose.Schema") || line.includes("new Schema(")) {
      schemaDefinitions.push({
        file: rel,
        line: lineNum,
        raw: line.trim()
      });
    }

    // Look for require("./models/...") or require("../models/...")
    const reqMatch = line.match(/require\(\s*["'](\.\.?\/models\/[^"']+)["']\s*\)/);
    if (reqMatch) {
      requireModels.push({
        file: rel,
        line: lineNum,
        target: reqMatch[1],
        raw: line.trim()
      });
    }
  });
});

console.log("\n==========================================");
console.log("ALL MONGOOSE.MODEL REGISTRATIONS IN BACKEND:");
console.log("==========================================");
modelRegistrations.forEach(r => {
  console.log(`${r.modelName.padEnd(28)} | ${r.file}:${r.line} | ${r.raw.substring(0, 70)}`);
});

console.log("\n==========================================");
console.log("ALL FILES IN backend/models/:");
console.log("==========================================");
const modelsDir = path.resolve("backend/models");
if (fs.existsSync(modelsDir)) {
  fs.readdirSync(modelsDir).forEach(f => {
    console.log(`- backend/models/${f}`);
  });
}

console.log("\n==========================================");
console.log("ALL INLINE SCHEMA DEFINITIONS:");
console.log("==========================================");
schemaDefinitions.forEach(s => {
  console.log(`${s.file}:${s.line} | ${s.raw.substring(0, 80)}`);
});

console.log("\n==========================================");
console.log("UNIQUE MODEL NAMES REGISTERED VIA mongoose.model():");
console.log("==========================================");
const uniqueRegNames = [...new Set(modelRegistrations.map(r => r.modelName))];
console.log(uniqueRegNames);

console.log("\n==========================================");
console.log("ALL UNIQUE mongoose.models.* LOOKUPS:");
console.log("==========================================");
const uniqueLookups = [...new Set(modelLookups.map(l => l.modelName))];
console.log(uniqueLookups);

