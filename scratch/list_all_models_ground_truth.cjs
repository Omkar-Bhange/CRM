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

const modelsInCode = new Set();
const modelRegistrations = {};
const modelLookups = {};

allBackendFiles.forEach(file => {
  const rel = path.relative(".", file).replace(/\\/g, "/");
  if (path.basename(file).startsWith("verify_") || path.basename(file).startsWith("test_")) return;
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    // Match mongoose.model("Name", ...) or mongoose.model('Name', ...)
    const matches = [...line.matchAll(/mongoose\.model\(\s*["']([^"']+)["']/g)];
    matches.forEach(m => {
      modelsInCode.add(m[1]);
      if (!modelRegistrations[m[1]]) modelRegistrations[m[1]] = [];
      modelRegistrations[m[1]].push({ file: rel, line: lineNum, text: line.trim() });
    });

    const lookups = [...line.matchAll(/mongoose\.models\.([a-zA-Z0-9_]+)/g)];
    lookups.forEach(m => {
      modelsInCode.add(m[1]);
      if (!modelLookups[m[1]]) modelLookups[m[1]] = [];
      modelLookups[m[1]].push({ file: rel, line: lineNum, text: line.trim() });
    });
  });
});

console.log("Total unique model names found:", modelsInCode.size);
const sortedNames = Array.from(modelsInCode).sort();
sortedNames.forEach((name, i) => {
  const regCount = (modelRegistrations[name] || []).length;
  const lookupCount = (modelLookups[name] || []).length;
  console.log(`${(i + 1).toString().padStart(2)}. ${name.padEnd(30)} (Regs: ${regCount}, Lookups: ${lookupCount})`);
});

console.log("\n--- REGISTRATIONS DETAIL ---");
sortedNames.forEach(name => {
  const regs = modelRegistrations[name] || [];
  if (regs.length > 0) {
    console.log(`\nModel: ${name}`);
    regs.forEach(r => console.log(`  REG: ${r.file}:${r.line} -> ${r.text}`));
  } else {
    console.log(`\nModel: ${name} (NO DIRECT mongoose.model REGISTRATION - LOOKUPS ONLY)`);
    const lk = modelLookups[name] || [];
    lk.forEach(l => console.log(`  LOOKUP: ${l.file}:${l.line} -> ${l.text}`));
  }
});

