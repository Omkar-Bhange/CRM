const fs = require('fs');
const content = fs.readFileSync('backend/attendance-v2.js', 'utf8');
const lines = content.split(/\r?\n/);
lines.forEach((l, i) => {
  if (l.includes('AttendanceRegularization')) {
    console.log(`Line ${i + 1}: ${l.trim()}`);
  }
});

