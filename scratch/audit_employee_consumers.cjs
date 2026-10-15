"use strict";

const fs = require("fs");
const path = require("path");

const backendDir = path.resolve(__dirname, "../backend");
const files = [
  "employee.js",
  "auth.js",
  "attendance.js",
  "attendance-v2.js",
  "documents.js",
  "admin.js",
  "client.js",
  "secureUploads.js",
  "agentSession.js",
  "reports.js",
  "server.js",
  "settings.js"
];

const results = {};

for (const f of files) {
  const filePath = path.join(backendDir, f);
  if (!fs.existsSync(filePath)) continue;
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  const usages = [];

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (
      l.includes('mongoose.model("Employee"') ||
      l.includes("mongoose.models.Employee") ||
      l.includes("require(") && l.includes("employee") ||
      /\bEmployee\b/.test(l) && !l.trim().startsWith("//")
    ) {
      // Find significant lines
      if (
        l.includes("model(") ||
        l.includes("models.") ||
        l.includes("require(") ||
        l.includes("Employee.") ||
        l.includes("EmployeeModel.") ||
        l.includes("ref: \"Employee\"") ||
        l.includes("ref: 'Employee'")
      ) {
        usages.push({ line: i + 1, text: l.trim() });
      }
    }
  }

  results[f] = usages;
}

console.log("=== EMPLOYEE CONSUMER AUDIT ===");
for (const [f, list] of Object.entries(results)) {
  console.log(`\n--- ${f} (${list.length} key usages) ---`);
  list.slice(0, 10).forEach(u => console.log(`  L${u.line}: ${u.text}`));
  if (list.length > 10) console.log(`  ... and ${list.length - 10} more`);
}

