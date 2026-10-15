const fs = require('fs');
const content = fs.readFileSync('backend/attendance-v2.js', 'utf8');
const lines = content.split(/\r?\n/);
lines.forEach((line, idx) => {
  if (line.includes('LeaveBalance')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});

