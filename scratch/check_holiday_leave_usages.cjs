const fs = require("fs");
const path = require("path");

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== "node_modules" && file !== ".git" && file !== "dist") {
        results = results.concat(walkDir(fullPath));
      }
    } else if (file.endsWith(".js") || file.endsWith(".cjs")) {
      results.push(fullPath);
    }
  });
  return results;
}

const allBackendFiles = walkDir("backend");

["Holiday", "LeaveRequest"].forEach(target => {
  console.log(`\n--- USAGES OF ${target} ---`);
  allBackendFiles.forEach(file => {
    const rel = path.relative(".", file).replace(/\\/g, "/");
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split("\n");
    lines.forEach((line, idx) => {
      if (line.includes(`models/${target}`) || line.includes(`models.${target}`) || line.includes(`model("${target}"`)) {
        console.log(`  ${rel}:${idx + 1} -> ${line.trim()}`);
      }
    });
  });
});

