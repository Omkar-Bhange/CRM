"use strict";

const fs = require("fs");
const path = require("path");

const backendDir = path.resolve(__dirname, "../backend");
const modelsDir = path.join(backendDir, "models");

// 1. Inspect backend/models
const modelFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith(".js"));
console.log(`Found ${modelFiles.length} files in backend/models/:\n`);

const centralizedModels = [];
for (const f of modelFiles) {
  const filePath = path.join(modelsDir, f);
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  
  let registeredName = null;
  let collectionName = null;
  let regLine = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/mongoose\.model\(\s*["']([^"']+)["']/);
    if (m && !registeredName) {
      registeredName = m[1];
      regLine = i + 1;
    }
    const c = line.match(/collection:\s*["']([^"']+)["']/);
    if (c && !collectionName) {
      collectionName = c[1];
    }
  }

  centralizedModels.push({
    file: `backend/models/${f}`,
    modelName: registeredName || "UNKNOWN",
    collection: collectionName || "(mongoose default)",
    line: regLine
  });
}

console.log("=== CENTRALIZED MODELS (backend/models/) ===");
for (let i = 0; i < centralizedModels.length; i++) {
  const m = centralizedModels[i];
  console.log(`${(i + 1).toString().padStart(2, "0")}. Model: "${m.modelName}" | File: ${m.file} | Coll: "${m.collection}" | Line: ${m.line}`);
}

// 2. Scan all backend files for mongoose.model registrations outside tests
const allBackendFiles = fs.readdirSync(backendDir).filter(f => {
  if (!f.endsWith(".js") && !f.endsWith(".cjs")) return false;
  if (f.startsWith("test_") || f.startsWith("verify_")) return false;
  return true;
});

console.log("\n=== NON-TEST ROOT BACKEND FILES ===");
console.log(allBackendFiles);

const inlineRegistrations = [];

for (const f of allBackendFiles) {
  const filePath = path.join(backendDir, f);
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/mongoose\.model\(\s*["']([^"']+)["']/);
    if (m) {
      // Find collection if specified nearby
      let coll = "(mongoose default)";
      for (let j = Math.max(0, i - 30); j < Math.min(lines.length, i + 10); j++) {
        const c = lines[j].match(/collection:\s*["']([^"']+)["']/);
        if (c) {
          coll = c[1];
          break;
        }
      }
      inlineRegistrations.push({
        file: `backend/${f}`,
        modelName: m[1],
        collection: coll,
        line: i + 1,
        raw: line.trim()
      });
    }
  }
}

console.log("\n=== MODEL REGISTRATIONS IN ROOT BACKEND FILES ===");
console.table(inlineRegistrations);

// 3. Search for the investigated names across the entire backend
const investigatedNames = [
  "Payroll",
  "Performance",
  "ShiftRoster",
  "SalaryStructure",
  "Notice",
  "TicketCode",
  "Payment",
  "Leave",
  "LeaveAllocation",
  "LeaveType",
  "ApprovalRequest",
  "AppCounters",
  "AgentDevice",
  "AuthSession",
  "AttendanceV2",
  "ClientDocument",
  "ClientNotification",
  "SystemSettings",
  "ProcessedSessionBucket"
];

console.log("\n=== INVESTIGATED NAMES SEARCH ===");
for (const name of investigatedNames) {
  const matches = [];
  // search backend/models
  for (const f of modelFiles) {
    const c = fs.readFileSync(path.join(modelsDir, f), "utf8");
    if (c.includes(`"${name}"`) || c.includes(`'${name}'`)) {
      matches.push(`backend/models/${f}`);
    }
  }
  // search root backend files
  for (const f of allBackendFiles) {
    const c = fs.readFileSync(path.join(backendDir, f), "utf8");
    if (c.includes(`"${name}"`) || c.includes(`'${name}'`)) {
      matches.push(`backend/${f}`);
    }
  }
  console.log(`- ${name}: ${matches.length > 0 ? matches.join(", ") : "NOT FOUND IN PRODUCTION CODE"}`);
}
