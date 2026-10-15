const fs = require('fs');
const path = require('path');

function extractRoutes(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const routes = [];
  lines.forEach((l, i) => {
    const match = l.match(/router\.(get|post|put|delete|patch)\(\s*["']([^"']+)["']/);
    if (match) {
      routes.push({
        method: match[1].toUpperCase(),
        path: match[2],
        line: i + 1
      });
    }
  });
  return routes;
}

const r1 = extractRoutes('backend/attendance.js');
const r2 = extractRoutes('backend/attendance-v2.js');

console.log(`=== backend/attendance.js (${r1.length} routes) ===`);
r1.forEach(r => console.log(`  ${r.method.padEnd(6)} ${r.path} (Line ${r.line})`));

console.log(`\n=== backend/attendance-v2.js (${r2.length} routes) ===`);
r2.forEach(r => console.log(`  ${r.method.padEnd(6)} ${r.path} (Line ${r.line})`));

