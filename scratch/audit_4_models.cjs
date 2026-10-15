"use strict";

const fs = require("fs");
const path = require("path");

const targets = ["AgentDevice", "AuthSession", "TicketCode", "UpcomingRenewal"];

console.log("=== AUDITING 4 MODEL NAMES: " + targets.join(", ") + " ===\n");

function scanDir(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules") {
      results.push(...scanDir(full));
    } else if (entry.isFile() && (entry.name.endsWith(".js") || entry.name.endsWith(".cjs"))) {
      const content = fs.readFileSync(full, "utf8");
      targets.forEach(name => {
        const regex = new RegExp(`['"]` + name + `['"]`, "g");
        let m;
        while ((m = regex.exec(content)) !== null) {
          const lineNo = content.slice(0, m.index).split("\n").length;
          const line = content.split("\n")[lineNo - 1];
          results.push({ file: full, lineNo, name, line: line.trim() });
        }
      });
    }
  }
  return results;
}

const hits = scanDir("backend");
for (const h of hits) {
  console.log(`${h.file}:${h.lineNo} [${h.name}] -> ${h.line}`);
}

