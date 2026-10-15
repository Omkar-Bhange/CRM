"use strict";
const fs = require("fs");
const path = require("path");

const targets = ["AgentDevice", "AuthSession", "UserActivity", "UserSession"];

function searchDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      searchDir(fullPath);
    } else if (entry.name.endsWith(".js") || entry.name.endsWith(".cjs") || entry.name.endsWith(".json")) {
      const content = fs.readFileSync(fullPath, "utf8");
      for (const t of targets) {
        if (content.includes(t)) {
          const lines = content.split("\n");
          lines.forEach((line, idx) => {
            if (line.includes(t) && (line.includes("model(") || line.includes("Schema(") || line.includes("require") || line.includes("export") || line.includes("collection:"))) {
              console.log(`[${t}] ${fullPath}:${idx + 1} -> ${line.trim()}`);
            }
          });
        }
      }
    }
  }
}

searchDir("backend");

