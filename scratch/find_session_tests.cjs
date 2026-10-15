const fs = require('fs');
const path = require('path');

function searchFiles(dir) {
  const list = fs.readdirSync(dir);
  for (const f of list) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== '.git') searchFiles(full);
    } else if (f.endsWith('.js') || f.endsWith('.cjs')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('startSession') && (f.includes('test') || f.includes('verify'))) {
        console.log(`Found startSession in test file: ${full}`);
      }
    }
  }
}

searchFiles('backend');
searchFiles('scratch');

