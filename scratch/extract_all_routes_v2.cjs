const fs = require('fs');

function extractAllRoutes(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const routes = [];
  
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const match = l.match(/router\.(get|post|put|delete|patch)\s*\(/);
    if (match) {
      const method = match[1].toUpperCase();
      // Look for route path in this line or next few lines
      let pathFound = null;
      for (let j = i; j < Math.min(i + 5, lines.length); j++) {
        const pathMatch = lines[j].match(/["'](\/[^"']*)["']/);
        if (pathMatch) {
          pathFound = pathMatch[1];
          break;
        }
      }
      routes.push({
        line: i + 1,
        method,
        path: pathFound || 'UNKNOWN'
      });
    }
  }
  return routes;
}

const r2 = extractAllRoutes('backend/attendance-v2.js');
console.log(`=== backend/attendance-v2.js total routes: ${r2.length} ===`);
r2.forEach(r => console.log(`  ${r.method.padEnd(6)} ${r.path} (Line ${r.line})`));

