const fs = require("fs");
const path = require("path");

const filesInModels = fs.readdirSync("backend/models");
console.log(`backend/models contains ${filesInModels.length} files:`);
filesInModels.forEach(f => {
  const content = fs.readFileSync(path.join("backend/models", f), "utf8");
  const modelRegs = [...content.matchAll(/mongoose\.model\(\s*["']([^"']+)["'](?:,\s*[^,]+,\s*["']([^"']+)["'])?/g)];
  const collOption = content.match(/collection:\s*["']([^"']+)["']/);
  const regNames = modelRegs.map(m => m[1]);
  const coll = collOption ? collOption[1] : (modelRegs[0] && modelRegs[0][2] ? modelRegs[0][2] : "default");
  console.log(`  - ${f.padEnd(28)} -> model: [${regNames.join(", ")}] collection: "${coll}"`);
});

const suspectedNonexistent = [
  "Lead",
  "DailyCallSummary",
  "Report",
  "Admin",
  "EmployeeActivity",
  "LiveMonitoring",
  "OfficeNetworkPolicy",
  "WorkPolicy",
  "DailyWorkRecord",
  "Amc",
  "Payment",
  "Invoice",
  "Quotation",
  "Department"
];

console.log("\n--- CHECKING SUSPECTED NON-EXISTENT MODELS ACROSS ALL .js FILES IN backend/ ---");
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

suspectedNonexistent.forEach(modelName => {
  let found = [];
  allBackendFiles.forEach(file => {
    const content = fs.readFileSync(file, "utf8");
    const rel = path.relative(".", file).replace(/\\/g, "/");
    // Look for mongoose.model("modelName"
    const regex1 = new RegExp(`mongoose\\.model\\(\\s*["\']${modelName}["\']`, "g");
    const regex2 = new RegExp(`mongoose\\.models\\.${modelName}\\b`, "g");
    if (regex1.test(content)) {
      found.push(`${rel} (mongoose.model("${modelName}"))`);
    } else if (regex2.test(content)) {
      found.push(`${rel} (mongoose.models.${modelName})`);
    }
  });
  if (found.length === 0) {
    console.log(`[ABSENT] ${modelName}: Not registered or looked up ANYWHERE in backend/`);
  } else {
    console.log(`[FOUND]  ${modelName}: Found in: ${found.join(", ")}`);
  }
});

