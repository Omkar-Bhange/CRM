const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, '../backend');

function scanDir(dir) {
  let list = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git' || entry.name === 'scratch') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      list = list.concat(scanDir(full));
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.cjs')) {
      list.push(full);
    }
  }
  return list;
}

const files = scanDir(backendDir);
console.log(`Scanning ${files.length} files in backend for AttendanceEvent...`);

const results = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  const relPath = path.relative(path.join(__dirname, '..'), file).replace(/\\/g, '/');

  lines.forEach((line, idx) => {
    if (line.includes('AttendanceEvent') || line.includes('attendanceevents')) {
      results.push({
        file: relPath,
        line: idx + 1,
        text: line.trim()
      });
    }
  });
}

console.log(`Found ${results.length} references:`);
results.forEach(r => {
  console.log(`${r.file}:${r.line} -> ${r.text}`);
});

