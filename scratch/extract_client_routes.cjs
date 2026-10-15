const fs = require('fs');

const clientCode = fs.readFileSync('backend/client.js', 'utf8');
const routes = [];
const lines = clientCode.split('\n');

lines.forEach((line, idx) => {
  const m = line.match(/router\.(get|post|put|patch|delete)\(\s*["']([^"']+)["']/);
  if (m) {
    routes.push({ line: idx + 1, method: m[1].toUpperCase(), path: m[2] });
  }
});

console.log(`Found ${routes.length} routes in backend/client.js:`);
routes.forEach(r => console.log(`  L${r.line.toString().padStart(4)}: ${r.method.padEnd(6)} /api/client${r.path}`));
