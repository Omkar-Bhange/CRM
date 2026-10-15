"use strict";
const fs = require("fs");
const path = require("path");

const files = fs.readdirSync("backend").filter((f) => f.endsWith(".js"));
for (const file of files) {
  const content = fs.readFileSync(path.join("backend", file), "utf8");
  const lines = content.split("\n");
  const matching = [];
  lines.forEach((l, idx) => {
    if (/(?:mongoose\.models?\.User|mongoose\.model\(\s*["']User["']|require\(["'].*User["']\)|const\s+User\s*=)/.test(l)) {
      matching.push({ line: idx + 1, code: l.trim() });
    }
  });
  if (matching.length > 0) {
    console.log(`\n=== backend/${file} ===`);
    matching.forEach((m) => console.log(`  L${m.line}: ${m.code}`));
  }
}

