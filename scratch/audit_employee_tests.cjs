"use strict";

const fs = require("fs");
const path = require("path");

const backendDir = path.resolve(__dirname, "../backend");
const scratchDir = path.resolve(__dirname, "../scratch");

const backendTests = fs.readdirSync(backendDir).filter(f => f.startsWith("test_") || f.startsWith("verify_"));
const scratchTests = fs.readdirSync(scratchDir).filter(f => f.startsWith("test_") || f.startsWith("run_all_") || f.startsWith("verify_"));

const topics = [
  "employee",
  "auth",
  "attendance",
  "attendancev2",
  "leave",
  "regularization",
  "approval",
  "notification",
  "documents"
];

console.log(`Found ${backendTests.length} tests in backend/ and ${scratchTests.length} tests in scratch/\n`);

const results = {};

for (const t of topics) {
  results[t] = [];
}

function scanFile(dir, f) {
  const content = fs.readFileSync(path.join(dir, f), "utf8").toLowerCase();
  for (const t of topics) {
    if (f.toLowerCase().includes(t) || content.includes(t)) {
      // Check if it exercises production routes or is schema/unit
      const isRoute = content.includes("app.post") || content.includes("supertest") || content.includes("fetch(") || content.includes("axios") || content.includes("http.request") || content.includes("express()");
      const isIsolated = content.includes("isolated") || content.includes("test_db");
      results[t].push({
        file: `${path.basename(dir)}/${f}`,
        hasRoutes: isRoute,
        isIsolated
      });
    }
  }
}

backendTests.forEach(f => scanFile(backendDir, f));
scratchTests.forEach(f => scanFile(scratchDir, f));

console.log("=== TEST SUITE COVERAGE BY TOPIC ===");
for (const [topic, list] of Object.entries(results)) {
  const uniqueFiles = [...new Set(list.map(l => l.file))];
  console.log(`\nTopic: ${topic.toUpperCase()} (${uniqueFiles.length} suites)`);
  uniqueFiles.slice(0, 8).forEach(u => console.log(`  - ${u}`));
  if (uniqueFiles.length > 8) console.log(`  ... and ${uniqueFiles.length - 8} more`);
}

