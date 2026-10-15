const fs = require('fs');
const path = require('path');

function searchAll(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.git', 'scratch', 'dist', '.gemini'].includes(entry.name)) {
        results.push(...searchAll(fullPath));
      }
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.cjs') || entry.name.endsWith('.ts') || entry.name.endsWith('.jsx'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('ProductSale') || content.includes('productsales')) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

console.log('Files referencing ProductSale or productsales:');
console.log(searchAll('.'));

