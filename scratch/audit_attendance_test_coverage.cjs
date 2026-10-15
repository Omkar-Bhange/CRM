const fs = require('fs');
const path = require('path');

const backendFiles = fs.readdirSync('backend').filter(f => f.startsWith('test_') || f.startsWith('verify_'));

console.log('Backend test and verify files:', backendFiles.length);

const inventory = [];

backendFiles.forEach(file => {
  const content = fs.readFileSync(path.join('backend', file), 'utf8');
  const lines = content.split('\n');
  const httpCalls = [];
  const modelCalls = [];
  lines.forEach((l, i) => {
    if (l.includes('request(') || l.includes('fetch(') || l.includes('.post(') || l.includes('.get(') || l.includes('.put(') || l.includes('.patch(')) {
      if (l.includes('/api/') || l.includes('/attendance')) {
        httpCalls.push({ line: i + 1, text: l.trim() });
      }
    }
    if (l.includes('.create(') || l.includes('.save(') || l.includes('.find(') || l.includes('.findOne(')) {
      if (l.includes('Attendance') || l.includes('AttendanceV2') || l.includes('AttendanceEvent') || l.includes('AttendanceApprovalRequest') || l.includes('AttendanceRegularization')) {
        modelCalls.push({ line: i + 1, text: l.trim() });
      }
    }
  });

  inventory.push({
    file,
    httpCallsCount: httpCalls.length,
    httpCalls: httpCalls.slice(0, 10),
    modelCallsCount: modelCalls.length,
  });
});

inventory.forEach(item => {
  console.log(`\n=== ${item.file} ===`);
  console.log(`  HTTP calls to /api or /attendance: ${item.httpCallsCount}`);
  item.httpCalls.forEach(c => console.log(`    Line ${c.line}: ${c.text}`));
  console.log(`  Model operations: ${item.modelCallsCount}`);
});

