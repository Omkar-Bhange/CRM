const { execSync } = require('child_process');
const path = require('path');

const isolatedTests = [
  'test_attendanceevent_isolated.js',
  'test_agentdailysummary_isolated.js',
  'test_processedsessionbucket_isolated.js',
  'test_employeedailynote_isolated.js',
  'test_holiday_isolated.js',
  'test_leaverequest_isolated.js',
  'test_activitylog_isolated.js',
  'test_appcounter_isolated.js',
  'test_amcreminder_isolated.js',
  'test_clientdocument_isolated.js',
  'test_clientnotification_isolated.js',
  'test_employeenotification_isolated.js',
  'test_task_isolated.js',
  'test_supportticket_isolated.js',
  'test_supportticket_api.js',
  'test_systemsettings_isolated.js',
  'test_secure_uploads_patch.js',
  'test_leavebalance_isolated.js',
  'test_attendanceregularization_isolated.js',
  'test_attendanceapprovalrequest_isolated.js'
];

console.log(`Running ${isolatedTests.length} safe isolated integration tests...\n`);

const results = [];

for (const t of isolatedTests) {
  try {
    const stdout = execSync(`node backend/${t}`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const lines = stdout.split(/\r?\n/).filter(l => l.trim().length > 0);
    const summaryLine = lines.find(l => 
      l.includes('TOTAL CHECKS:') || 
      l.includes('TOTAL HTTP API CHECKS:') ||
      l.includes('SUMMARY:') || 
      l.includes('passed, 0 failed') ||
      l.includes('PASSED [OK]') ||
      l.includes('passed successfully')
    ) || lines[lines.length - 1];

    results.push({
      test: t,
      status: 'PASS',
      exitCode: 0,
      summary: summaryLine
    });
  } catch (err) {
    results.push({
      test: t,
      status: 'FAIL',
      exitCode: err.status || 1,
      summary: err.message
    });
  }
}

console.log("=== ISOLATED TEST EXECUTION RESULTS ===");
for (const r of results) {
  console.log(`${r.test.padEnd(42)} | Exit: ${r.exitCode} | ${r.status} | ${r.summary}`);
}
