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

const modelsInCode = [];

allBackendFiles.forEach(file => {
  const rel = path.relative(".", file).replace(/\\/g, "/");
  if (path.basename(file).startsWith("verify_") || path.basename(file).startsWith("test_")) return;
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    // Match mongoose.model("Name", ...) or mongoose.model('Name', ...)
    const m = line.match(/mongoose\.model\(\s*["']([^"']+)["'](?:\s*,\s*([^,\)]+))?/);
    if (m) {
      modelsInCode.push({
        modelName: m[1],
        file: rel,
        line: lineNum,
        snippet: line.trim()
      });
    }

    // Match mongoose.models.Name
    const m2 = line.match(/mongoose\.models\.([a-zA-Z0-9_]+)/);
    if (m2) {
      modelsInCode.push({
        modelName: m2[1],
        file: rel,
        line: lineNum,
        lookupOnly: true,
        snippet: line.trim()
      });
    }
  });
});

console.log("ALL MODEL REFERENCES FOUND:");
const byName = {};
modelsInCode.forEach(item => {
  if (!byName[item.modelName]) byName[item.modelName] = [];
  byName[item.modelName].push(item);
});

Object.keys(byName).sort().forEach(name => {
  console.log(`\n=== MODEL: ${name} ===`);
  byName[name].forEach(ref => {
    const type = ref.lookupOnly ? "[LOOKUP]" : "[REGISTRATION]";
    console.log(`  ${type} ${ref.file}:${ref.line} -> ${ref.snippet.substring(0, 80)}`);
  });
});

