const fs = require('fs');
const path = require('path');

const productionFiles = [
  'server.js',
  'attendance.js',
  'attendance-v2.js',
  'admin.js',
  'employee.js',
  'reports.js',
  'settings.js',
  'auth.js',
  'agentSession.js',
  'client.js',
  'documents.js'
];

productionFiles.forEach(file => {
  const fullPath = path.join('backend', file);
  if (!fs.existsSync(fullPath)) return;
  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');
  const matched = [];
  lines.forEach((l, i) => {
    if (
      l.includes('Attendance') ||
      l.includes('attendance') ||
      l.includes('AttendanceV2')
    ) {
      if (
        l.includes('model(') ||
        l.includes('models.') ||
        l.includes('require(') ||
        l.includes('.find') ||
        l.includes('.create') ||
        l.includes('.save') ||
        l.includes('.updateOne') ||
        l.includes('.updateMany') ||
        l.includes('.findOneAndUpdate') ||
        l.includes('.countDocuments') ||
        l.includes('.aggregate') ||
        l.includes('use(') ||
        l.includes('ref:')
      ) {
        matched.push({ lineNum: i + 1, text: l.trim() });
      }
    }
  });
  console.log(`\n=== ${file} (${matched.length} key matches) ===`);
  matched.forEach(m => console.log(`  Line ${m.lineNum}: ${m.text}`));
});

