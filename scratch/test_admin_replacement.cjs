"use strict";

const fs = require("fs");
const path = require("path");

const adminPath = path.resolve("backend/admin.js");
const content = fs.readFileSync(adminPath, "utf8");
const lines = content.split("\n");

// Target: line 1606 (index 1605) to line 2034 (index 2033)
const startIdx = 1605; // 0-indexed line 1606
const endIdx = 2034;   // 0-indexed line 2035 (slice is exclusive, so slice(startIdx, endIdx) covers 1605..2033)

console.log("Line at startIdx:", lines[startIdx]);
console.log("Line at endIdx - 1:", lines[endIdx - 1]);
console.log("Line at endIdx:", lines[endIdx]);

// Verify
if (!lines[startIdx].includes("/* =====================================================") ||
    !lines[startIdx + 1].includes("AMC INVOICE SCHEMA") ||
    !lines[endIdx - 1].trim().endsWith(");") ||
    !lines[endIdx].trim().length === 0) {
  console.error("Index mismatch!");
  process.exit(1);
}

const newLines = [
  ...lines.slice(0, startIdx),
  'const AmcInvoice = require("./models/AmcInvoice");',
  ...lines.slice(endIdx)
];

const newContent = newLines.join("\n");
fs.writeFileSync("scratch/admin_new_preview.js", newContent, "utf8");
console.log("admin_new_preview.js written. Total lines before:", lines.length, "after:", newLines.length);

