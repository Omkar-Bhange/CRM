const fs = require('fs');
const path = require('path');

function searchDir(dir, pattern) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        results.push(...searchDir(fullPath, pattern));
      }
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.cjs'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (pattern.test(line)) {
          results.push({ file: fullPath, line: idx + 1, text: line.trim() });
        }
      });
    }
  }
  return results;
}

console.log('--- Occurrences of ProductSale in backend/ ---');
const psResults = searchDir('backend', /ProductSale\b/);
const fileCounts = {};
psResults.forEach(r => {
  fileCounts[r.file] = (fileCounts[r.file] || 0) + 1;
});
console.log('File counts for ProductSale:');
console.log(fileCounts);

console.log('\n--- Occurrences of productsales collection in backend/ ---');
const collResults = searchDir('backend', /productsales/i);
collResults.forEach(r => {
  console.log(`${r.file}:${r.line}: ${r.text}`);
});

