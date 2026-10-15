const fs = require('fs');
const path = require('path');

const backendDir = path.resolve('backend');

function scanDir(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      results.push(...scanDir(path.join(dir, entry.name)));
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.cjs'))) {
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
}

const files = scanDir(backendDir);
console.log('Total JS files scanned:', files.length);

const occurrences = [];

files.forEach(file => {
  const relPath = path.relative(backendDir, file);
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (
      line.includes('Attendance') ||
      line.includes('attendance') ||
      line.includes('AttendanceV2')
    ) {
      // filter out common comments or irrelevant strings if too noisy, but keep track
      occurrences.push({
        file: relPath,
        lineNum: idx + 1,
        line: line.trim()
      });
    }
  });
});

fs.writeFileSync('scratch/attendance_consumer_occurrences.json', JSON.stringify(occurrences, null, 2));

// Group by file
const fileGroups = {};
occurrences.forEach(o => {
  if (!fileGroups[o.file]) fileGroups[o.file] = [];
  fileGroups[o.file].push(o);
});

console.log('Files referencing Attendance/attendance:');
Object.keys(fileGroups).forEach(f => {
  console.log(`- ${f}: ${fileGroups[f].length} occurrences`);
});

