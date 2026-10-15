const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, '../backend');

function getAllJsFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === 'node_modules' || file === 'dist' || file === '.git' || file === 'scratch') continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getAllJsFiles(fullPath));
    } else if (file.endsWith('.js') || file.endsWith('.cjs')) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = getAllJsFiles(backendDir);
console.log(`Found ${files.length} JS files in backend/`);

const modelRegistrations = [];

const modelCallRegex = /mongoose\.model\s*\(\s*["']([^"']+)["']\s*(?:,\s*([a-zA-Z0-9_$]+))?/g;

for (const file of files) {
  const relPath = path.relative(path.join(__dirname, '..'), file).replace(/\\/g, '/');
  // Skip test/verify scripts to see actual application models
  const isTestOrVerify = relPath.includes('test_') || relPath.includes('verify_') || relPath.includes('scratch/');
  
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let match;
    const re = new RegExp(modelCallRegex);
    while ((match = re.exec(line)) !== null) {
      modelRegistrations.push({
        file: relPath,
        line: i + 1,
        modelName: match[1],
        schemaVar: match[2] || '',
        isTestOrVerify
      });
    }
  }
}

console.log("\n=== ALL APPLICATION MODEL REGISTRATIONS (EXCLUDING TESTS) ===");
const appModels = modelRegistrations.filter(m => !m.isTestOrVerify);
for (const m of appModels) {
  console.log(`${m.modelName.padEnd(30)} | ${m.file}:${m.line}`);
}

console.log("\n=== CHECKING SPECIFIC QUERIED MODELS ===");
const queried = [
  "AttendanceCorrectionRequest", "WorkFromHomeRequest", "EmployeeShift",
  "Department", "Designation", "CompanyPolicy", "ExpenseClaim",
  "PayrollRecord", "Asset", "AgentDailySummary", "LeaveBalance",
  "AttendanceEvent", "AttendanceApprovalRequest", "AttendanceRegularization",
  "Attendance", "AttendanceV2", "ProductSalePayment"
];

for (const q of queried) {
  const matches = appModels.filter(m => m.modelName.toLowerCase() === q.toLowerCase());
  console.log(`Model '${q}': ${matches.length > 0 ? 'FOUND (' + matches.map(m => m.file + ':' + m.line).join(', ') + ')' : 'NOT FOUND IN CODEBASE'}`);
}

