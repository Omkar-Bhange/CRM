const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const backendDir = path.join(__dirname, '../backend');
const verifyFiles = fs.readdirSync(backendDir)
  .filter(f => f.startsWith('verify_') && f.endsWith('_model.js'))
  .sort();

console.log(`Found ${verifyFiles.length} verification scripts.\n`);

const results = [];

for (const f of verifyFiles) {
  const filePath = path.join(backendDir, f);
  try {
    const stdout = execSync(`node backend/${f}`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Extract summary lines
    const lines = stdout.split(/\r?\n/).filter(l => l.trim().length > 0);
    const summaryLine = lines.find(l => l.includes('TOTAL CHECKS:') || l.includes('VERIFICATION SUMMARY:') || l.includes('checks passed')) || lines[lines.length - 1];

    results.push({
      file: f,
      status: 'PASS',
      exitCode: 0,
      summary: summaryLine
    });
  } catch (err) {
    results.push({
      file: f,
      status: 'FAIL',
      exitCode: err.status || 1,
      summary: err.message
    });
  }
}

console.log("=== EXACT VERIFICATION SCRIPT RESULTS ===");
for (const r of results) {
  console.log(`${r.file.padEnd(42)} | Exit: ${r.exitCode} | ${r.status} | ${r.summary}`);
}

