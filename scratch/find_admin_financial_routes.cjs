const fs = require('fs');

function extractAdminRoutes() {
  const content = fs.readFileSync('backend/admin.js', 'utf8');
  const lines = content.split('\n');
  const routes = [];
  
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const match = l.match(/router\.(get|post|put|delete|patch)\s*\(/);
    if (match) {
      const method = match[1].toUpperCase();
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
  
  const financial = routes.filter(r => 
    r.path.includes('amc') || 
    r.path.includes('invoice') || 
    r.path.includes('payment') || 
    r.path.includes('sale') || 
    r.path.includes('billing') ||
    r.path.includes('contract')
  );
  
  console.log(`Total admin routes: ${routes.length}`);
  console.log(`Financial/AMC/Sale routes: ${financial.length}`);
  financial.forEach(r => console.log(`  ${r.method.padEnd(6)} /api/admin${r.path} (Line ${r.line})`));
}

extractAdminRoutes();

