const fs = require("fs");
const path = require("path");

function getMatchingFiles(dir, prefix) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.startsWith("verify_") || f.startsWith("test_"))
    .map(f => path.join(dir, f).replace(/\\/g, "/"));
}

const backendTests = getMatchingFiles("backend");
const scratchTests = getMatchingFiles("scratch");

console.log("=== BACKEND TEST/VERIFY FILES ===");
backendTests.forEach(f => console.log(f));

console.log("\n=== SCRATCH TEST/VERIFY FILES ===");
scratchTests.forEach(f => console.log(f));

