const fs = require("fs");
const path = require("path");

const adminContent = fs.readFileSync("backend/admin.js", "utf8");
const hookMatches = adminContent.match(/clientSchema\.(pre|post|method|virtual|static|query)[^;]+/g);
console.log("Hooks/methods on clientSchema in admin.js:", hookMatches || "NONE");

// Check if any other file defines a Client model
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

const allBackendFiles = walkDir("backend");

console.log("\n--- SEARCHING ALL FILES FOR Client REGISTRATION OR SCHEMA ---");
allBackendFiles.forEach(file => {
  const rel = path.relative(".", file).replace(/\\/g, "/");
  const content = fs.readFileSync(file, "utf8");
  if (content.includes('mongoose.model("Client"') || content.includes("mongoose.model('Client'")) {
    console.log(`Found registration in: ${rel}`);
  }
});

console.log("\n--- SEARCHING ALL CONSUMERS OF Client MODEL ---");
const consumerStats = {};
allBackendFiles.forEach(file => {
  const rel = path.relative(".", file).replace(/\\/g, "/");
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");
  lines.forEach((line, idx) => {
    if (line.includes("Client.") || line.includes("models.Client") || line.includes('model("Client")')) {
      if (!consumerStats[rel]) consumerStats[rel] = [];
      consumerStats[rel].push({ line: idx + 1, text: line.trim().substring(0, 80) });
    }
  });
});

Object.keys(consumerStats).sort().forEach(file => {
  console.log(`\nConsumer: ${file} (${consumerStats[file].length} occurrences)`);
  consumerStats[file].slice(0, 5).forEach(c => console.log(`  L${c.line}: ${c.text}`));
  if (consumerStats[file].length > 5) console.log(`  ... and ${consumerStats[file].length - 5} more`);
});
