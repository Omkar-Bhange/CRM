const fs = require('fs');
const content = fs.readFileSync('backend/admin.js', 'utf8');
const re = /router\.(post|get|put|delete|patch)\(\s*["']([^"']+)["']/g;
let m;
while ((m = re.exec(content)) !== null) {
  if (m[2].includes('amc')) {
    console.log(`${m[1].toUpperCase()} ${m[2]}`);
  }
}
