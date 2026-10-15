const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, '../backend');
const modelDir = path.join(backendDir, 'models');

const filesToScan = [
  'admin.js',
  'auth.js',
  'client.js',
  'employee.js',
  'attendance.js',
  'attendance-v2.js',
  'server.js',
  'documents.js',
  'reports.js',
  'settings.js',
  'agentSession.js',
  'secureUploads.js',
  'authMiddleware.js',
  'rateLimiter.js',
  'slaConfig.js',
  'validation.js'
];

const modelFiles = fs.existsSync(modelDir) ? fs.readdirSync(modelDir).filter(f => f.endsWith('.js')) : [];

console.log("=== COMPREHENSIVE MULTI-LINE MODEL & SCHEMA DISCOVERY ===");

const schemaDeclarations = [];
const modelRegistrations = [];
const modelLookups = [];

function scanFile(filePath, relName) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Find schemas: const xxxSchema = new mongoose.Schema( ... )
  const schemaRegex = /(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*new\s+(?:mongoose\.)?Schema\s*\(/g;
  let sMatch;
  while ((sMatch = schemaRegex.exec(content)) !== null) {
    const lineNum = content.slice(0, sMatch.index).split('\n').length;
    schemaDeclarations.push({
      file: relName,
      line: lineNum,
      schemaName: sMatch[1]
    });
  }

  // Find mongoose.model calls (spanning multiple lines if needed)
  const modelRegex = /mongoose\.model\s*\(\s*["']([^"']+)["']\s*(?:,\s*([a-zA-Z0-9_]+|new\s+mongoose\.Schema\s*\([^)]*\)))?(?:\s*,\s*["']([^"']+)["'])?\s*\)/g;
  let mMatch;
  while ((mMatch = modelRegex.exec(content)) !== null) {
    const lineNum = content.slice(0, mMatch.index).split('\n').length;
    modelRegistrations.push({
      file: relName,
      line: lineNum,
      modelName: mMatch[1],
      schemaArg: mMatch[2] || 'lookup-only',
      explicitCollection: mMatch[3] || null
    });
  }

  // Also check mongoose.models.X
  const lookupRegex = /mongoose\.models\.([a-zA-Z0-9_]+)/g;
  let lMatch;
  while ((lMatch = lookupRegex.exec(content)) !== null) {
    const lineNum = content.slice(0, lMatch.index).split('\n').length;
    modelLookups.push({
      file: relName,
      line: lineNum,
      modelName: lMatch[1]
    });
  }
}

for (const f of filesToScan) {
  scanFile(path.join(backendDir, f), f);
}

for (const f of modelFiles) {
  scanFile(path.join(modelDir, f), `models/${f}`);
}

console.log("\n--- SCHEMA DECLARATIONS FOUND ---");
console.log(`Total: ${schemaDeclarations.length}`);
schemaDeclarations.forEach(s => console.log(`  [${s.file}:${s.line}] ${s.schemaName}`));

console.log("\n--- MONGOOSE.MODEL REGISTRATIONS / CALLS ---");
console.log(`Total: ${modelRegistrations.length}`);
modelRegistrations.forEach(m => console.log(`  [${m.file}:${m.line}] Model: "${m.modelName}" | Schema: ${m.schemaArg} | ExplicitCol: ${m.explicitCollection || 'in-schema/default'}`));

console.log("\n--- MONGOOSE.MODELS LOOKUPS ---");
const lookupsByModel = {};
modelLookups.forEach(l => {
  if (!lookupsByModel[l.modelName]) lookupsByModel[l.modelName] = new Set();
  lookupsByModel[l.modelName].add(l.file);
});
for (const [mName, files] of Object.entries(lookupsByModel)) {
  console.log(`  ${mName}: [${[...files].join(', ')}]`);
}

