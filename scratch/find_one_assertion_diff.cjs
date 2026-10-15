"use strict";

const fs = require("fs");

// Load log from task-4629
const log4629 = fs.readFileSync("C:/Users/Admin/.gemini/antigravity/brain/07366f5e-6663-482b-9364-09f61a5a05dd/.system_generated/tasks/task-4629.log", "utf8");

// Parse lines: ✓ [EXIT 0] <name> | Assertions: <count> | File: <file>
const regex = /✓ \[EXIT 0\] ([^|]+)\|\s*Assertions:\s*(\d+)\s*\|\s*File:\s*([^\r\n]+)/g;

const currentCounts = {};
let m;
while ((m = regex.exec(log4629)) !== null) {
  const name = m[1].trim();
  const count = parseInt(m[2].trim(), 10);
  const file = m[3].trim();
  currentCounts[file] = { name, count };
}

console.log("Current 67 suites parsed:", Object.keys(currentCounts).length);

// Also check runner from parent commit or scratch/run_all_productsalepayments_regressions.cjs
// Let's run run_all_productsalepayments_regressions.cjs output or inspect logs
console.log("\nCurrent counts for the 3 new suites:");
console.log("verify_clientamcrequest_model.js:", currentCounts["backend/verify_clientamcrequest_model.js"]);
console.log("test_clientamcrequest_isolated.js:", currentCounts["backend/test_clientamcrequest_isolated.js"]);
console.log("backend/test_clientamcrequest_api.js:", currentCounts["backend/test_clientamcrequest_api.js"]);

// Now let's inspect the 64 original suites
// Let's check which file had a difference
const { execSync } = require("child_process");
const prevLog = fs.existsSync("scratch/last_64_suite_output.txt") 
  ? fs.readFileSync("scratch/last_64_suite_output.txt", "utf8")
  : null;

console.log("prevLog exists?", Boolean(prevLog));

