const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, '../backend');
const files = fs.readdirSync(backendDir).filter(f => f.endsWith('.js'));
const subDir = path.join(backendDir, 'models');
const modelFiles = fs.existsSync(subDir) ? fs.readdirSync(subDir).filter(f => f.endsWith('.js')).map(f => 'models/' + f) : [];
const allFiles = [...files, ...modelFiles];

console.log("=== COMPREHENSIVE MONGOOSE MODEL & SCHEMA DISCOVERY ===");

const modelDefinitions = {}; // modelName -> [{ file, schemaRef, colRef }]
const modelLookups = {}; // modelName -> Set of files

for (const file of allFiles) {
  const fullPath = path.join(backendDir, file);
  const content = fs.readFileSync(fullPath, 'utf8');

  // Match: mongoose.model("Name", schema, "collection") or variations with newlines
  const defRegex = /mongoose\.model\s*\(\s*["']([^"']+)["']\s*(?:,\s*([a-zA-Z0-9_]+|new\s+mongoose\.Schema\s*\([^)]*\)))?(?:\s*,\s*["']([^"']+)["'])?\s*\)/gs;
  let match;
  while ((match = defRegex.exec(content)) !== null) {
    const name = match[1];
    const schemaRef = match[2] || '';
    const colRef = match[3] || '';
    if (!modelDefinitions[name]) modelDefinitions[name] = [];
    modelDefinitions[name].push({
      file,
      schemaRef: schemaRef.startsWith('new') ? 'inline Schema' : schemaRef,
      colRef,
    });
  }

  // Match: mongoose.models.Name
  const lookupRegex = /mongoose\.models\.([a-zA-Z0-9_]+)/g;
  let lMatch;
  while ((lMatch = lookupRegex.exec(content)) !== null) {
    const name = lMatch[1];
    if (!modelLookups[name]) modelLookups[name] = new Set();
    modelLookups[name].add(file);
  }
}

console.log("\n=== MODEL DEFINITIONS (WHERE SCHEMAS ARE REGISTERED) ===");
for (const [name, defs] of Object.entries(modelDefinitions)) {
  console.log(`\nModel: ${name}`);
  defs.forEach(d => console.log(`  - Defined in: ${d.file} (Schema: ${d.schemaRef || 'Lookup / None'}, Explicit Collection: ${d.colRef || 'default/in-schema'})`));
  const lookups = modelLookups[name] ? [...modelLookups[name]] : [];
  console.log(`  - Referenced/Looked up in: ${lookups.join(', ') || 'None'}`);
}

console.log("\n=== MODELS ONLY REFERENCED (NO DIRECT mongoose.model CALL IN SAME FILE) ===");
for (const [name, files] of Object.entries(modelLookups)) {
  if (!modelDefinitions[name]) {
    console.log(`Model: ${name} -> Referenced in: ${[...files].join(', ')}`);
  }
}
