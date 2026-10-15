const fs = require("fs");

const content = fs.readFileSync("backend/admin.js", "utf8");
const lines = content.split("\n");
lines.forEach((l, idx) => {
  const lineNum = idx + 1;
  if (lineNum >= 20000 && lineNum <= 28500) {
    if (/router\.(get|post|put|delete|patch)\s*\(/.test(l)) {
      console.log(`${lineNum}: ${l.trim()}`);
    }
  }
});

