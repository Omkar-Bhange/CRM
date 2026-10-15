"use strict";

const fs = require("fs");

const log4364 = fs.readFileSync("C:/Users/Admin/.gemini/antigravity/brain/07366f5e-6663-482b-9364-09f61a5a05dd/.system_generated/tasks/task-4364.log", "utf8");
const log4629 = fs.readFileSync("C:/Users/Admin/.gemini/antigravity/brain/07366f5e-6663-482b-9364-09f61a5a05dd/.system_generated/tasks/task-4629.log", "utf8");

function parseLog(log) {
  const map = {};
  const regex = /✓ \[EXIT 0\] ([^|]+)\|\s*Assertions:\s*(\d+)\s*\|\s*File:\s*([^\r\n]+)/g;
  let m;
  while ((m = regex.exec(log)) !== null) {
    const file = m[3].trim();
    const count = parseInt(m[2].trim(), 10);
    map[file] = count;
  }
  return map;
}

const map4364 = parseLog(log4364);
const map4629 = parseLog(log4629);

console.log("Suites in 4364:", Object.keys(map4364).length);
console.log("Suites in 4629:", Object.keys(map4629).length);

console.log("\n--- Comparison of suites present in both ---");
let totalDiff = 0;
for (const [file, countOld] of Object.entries(map4364)) {
  const countNew = map4629[file];
  if (countNew === undefined) {
    console.log(`MISSING in 4629: ${file}`);
  } else if (countNew !== countOld) {
    console.log(`DIFF in ${file}: old=${countOld}, new=${countNew} (delta: ${countNew - countOld})`);
    totalDiff += (countNew - countOld);
  }
}

console.log("\n--- New suites in 4629 ---");
let newSum = 0;
for (const [file, countNew] of Object.entries(map4629)) {
  if (map4364[file] === undefined) {
    console.log(`NEW: ${file} = ${countNew}`);
    newSum += countNew;
  }
}

console.log(`\nTotal old in 4364: ${Object.values(map4364).reduce((a, b) => a + b, 0)}`);
console.log(`Total new in 4629: ${Object.values(map4629).reduce((a, b) => a + b, 0)}`);
console.log(`Sum of new suites: ${newSum}`);
console.log(`Total diff on existing: ${totalDiff}`);

