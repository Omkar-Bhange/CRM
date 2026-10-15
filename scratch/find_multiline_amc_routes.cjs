const fs = require("fs");

const content = fs.readFileSync("backend/admin.js", "utf8");
const lines = content.split("\n");

console.log("=== MULTILINE POST/PUT/PATCH/DELETE ROUTE SEARCH IN admin.js ===");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (/router\.(post|put|patch|delete)\s*\(/.test(line)) {
    // gather next 10 lines
    const snippet = lines.slice(i, i + 8).map(s => s.trim()).join(" ");
    if (snippet.includes("amc") || snippet.includes("invoice") || snippet.includes("payment")) {
      console.log(`Line ${i + 1}: ${snippet.slice(0, 120)}...`);
    }
  }
}

