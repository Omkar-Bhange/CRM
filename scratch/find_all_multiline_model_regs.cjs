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

const results = [];

allBackendFiles.forEach(file => {
  const rel = path.relative(".", file).replace(/\\/g, "/");
  if (path.basename(file).startsWith("verify_") || path.basename(file).startsWith("test_")) return;
  const content = fs.readFileSync(file, "utf8");

  // Multiline regex for mongoose.model
  const regex = /mongoose\.model\(\s*["']([^"']+)["']/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const index = match.index;
    const lineNumber = content.substring(0, index).split("\n").length;
    // Find snippet
    const lines = content.split("\n");
    const snippet = lines.slice(Math.max(0, lineNumber - 1), lineNumber + 3).join(" ").replace(/\s+/g, " ");
    results.push({
      modelName: match[1],
      file: rel,
      line: lineNumber,
      snippet: snippet.substring(0, 100)
    });
  }
});

console.log(`Found ${results.length} total mongoose.model registrations!`);
const grouped = {};
results.forEach(r => {
  if (!grouped[r.modelName]) grouped[r.modelName] = [];
  grouped[r.modelName].push(r);
});

Object.keys(grouped).sort().forEach(name => {
  console.log(`\nModel: ${name} (${grouped[name].length} registration(s))`);
  grouped[name].forEach(r => {
    console.log(`  ${r.file}:${r.line} -> ${r.snippet}`);
  });
});

