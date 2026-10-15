const fs = require('fs');

const content = fs.readFileSync('backend/attendance-v2.js', 'utf8');
const lines = content.split('\n');

const functionMatches = [];
lines.forEach((l, i) => {
  if (
    l.match(/^\s*(function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>)/) ||
    l.match(/calculate|Metrics|Status|Shift|Policy|Minutes|Overtime|Early|Late/)
  ) {
    if (l.includes('function ') || l.includes('const ') || l.includes('let ')) {
      functionMatches.push({ line: i + 1, text: l.trim() });
    }
  }
});

console.log(`Found ${functionMatches.length} calculation / logic declarations:`);
functionMatches.forEach(m => console.log(`  Line ${m.line}: ${m.text}`));

