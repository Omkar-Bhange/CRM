const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const suites = [
  // Offline Schema Verifications (20 suites)
  { type: 'Offline Schema', file: 'scratch/verify_product_model.cjs' },
  { type: 'Offline Schema', file: 'scratch/verify_project_model.cjs' },
  { type: 'Offline Schema', file: 'backend/verify_requirement_model.js' },
  { type: 'Offline Schema', file: 'backend/verify_systemsettings_model.js' },
  { type: 'Offline Schema', file: 'backend/verify_clientdocument_model.js' },
  { type: 'Offline Schema', file: 'backend/verify_clientnotification_model.js' },
  { type: 'Offline Schema', file: 'backend/verify_employeenotification_model.js' },
  { type: 'Offline Schema', file: 'backend/verify_employeedailynote_model.js' },
  { type: 'Offline Schema', file: 'backend/verify_processedsessionbucket_model.js' },
  { type: 'Offline Schema', file: 'backend/verify_holiday_model.js' },
  { type: 'Offline Schema', file: 'backend/verify_leaverequest_model.js' },
  { type: 'Offline Schema', file: 'backend/verify_activitylog_model.js' },
  { type: 'Offline Schema', file: 'backend/verify_task_model.js' },
  { type: 'Offline Schema', file: 'backend/verify_supportticket_model.js' },
  { type: 'Offline Schema', file: 'backend/verify_appcounter_model.js' },
  { type: 'Offline Schema', file: 'backend/verify_amcreminder_model.js' },
  { type: 'Offline Schema', file: 'backend/verify_agentdailysummary_model.js' },
  { type: 'Offline Schema', file: 'backend/verify_attendanceevent_model.js' },
  { type: 'Offline Schema', file: 'backend/verify_leavebalance_model.js' },
  { type: 'Offline Schema', file: 'backend/verify_attendanceregularization_model.js' },

  // Isolated MongoDB functional integration suites (17 suites)
  { type: 'Isolated MongoDB', file: 'backend/test_attendanceevent_isolated.js' },
  { type: 'Isolated MongoDB', file: 'backend/test_agentdailysummary_isolated.js' },
  { type: 'Isolated MongoDB', file: 'backend/test_processedsessionbucket_isolated.js' },
  { type: 'Isolated MongoDB', file: 'backend/test_employeedailynote_isolated.js' },
  { type: 'Isolated MongoDB', file: 'backend/test_holiday_isolated.js' },
  { type: 'Isolated MongoDB', file: 'backend/test_leaverequest_isolated.js' },
  { type: 'Isolated MongoDB', file: 'backend/test_activitylog_isolated.js' },
  { type: 'Isolated MongoDB', file: 'backend/test_appcounter_isolated.js' },
  { type: 'Isolated MongoDB', file: 'backend/test_amcreminder_isolated.js' },
  { type: 'Isolated MongoDB', file: 'backend/test_clientdocument_isolated.js' },
  { type: 'Isolated MongoDB', file: 'backend/test_clientnotification_isolated.js' },
  { type: 'Isolated MongoDB', file: 'backend/test_employeenotification_isolated.js' },
  { type: 'Isolated MongoDB', file: 'backend/test_task_isolated.js' },
  { type: 'Isolated MongoDB', file: 'backend/test_supportticket_isolated.js' },
  { type: 'Isolated MongoDB', file: 'backend/test_systemsettings_isolated.js' },
  { type: 'Isolated MongoDB', file: 'backend/test_leavebalance_isolated.js' },
  { type: 'Isolated MongoDB', file: 'backend/test_attendanceregularization_isolated.js' },

  // Authenticated HTTP API tests (1 suite)
  { type: 'Authenticated HTTP API', file: 'backend/test_supportticket_api.js' },

  // Security Regression tests (1 suite)
  { type: 'Security Regression', file: 'backend/test_secure_uploads_patch.js' },

  // Skipped / Unsafe tests (3 suites)
  { type: 'Skipped / Unsafe (Atlas writes)', file: 'backend/test_amc_renewal.js', skip: true },
  { type: 'Skipped / Unsafe (Atlas writes)', file: 'backend/test_amc_renewal_uat.js', skip: true },
  { type: 'Skipped / Unsafe (Unisolated DB)', file: 'backend/test_employee_notes.js', skip: true }
];

console.log("==========================================================================================");
console.log("   EXACT AUDIT MANIFEST ACROSS ALL SUITES (POST-REGULARIZATION EXTRACTION)               ");
console.log("==========================================================================================\n");

const results = [];

for (const s of suites) {
  if (s.skip) {
    results.push({
      type: s.type,
      file: s.file,
      cmd: `[SKIPPED] node ${s.file}`,
      status: 'SKIPPED',
      exitCode: 'N/A',
      passed: 0,
      total: 0,
      summary: 'Skipped for database safety (connects to unisolated DB / writes to Atlas)'
    });
    continue;
  }

  const start = Date.now();
  try {
    const stdout = execSync(`node ${s.file}`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const dur = Date.now() - start;

    let passed = 0;
    let total = 0;
    let summaryText = '';

    const mTotalPassed = stdout.match(/TOTAL CHECKS:\s*(\d+)\s*\|\s*PASSED:\s*(\d+)/i);
    const mTotalHttp = stdout.match(/TOTAL HTTP API CHECKS:\s*(\d+)\s*\|\s*PASSED:\s*(\d+)/i);
    const mSummaryPassedFailed = stdout.match(/SUMMARY:\s*(\d+)\s+passed,\s*(\d+)\s+failed/i);
    const mSummaryPassedFailedUpper = stdout.match(/SUMMARY:\s*(\d+)\s+PASSED,\s*(\d+)\s+FAILED/i);
    const mAllChecksPassed = stdout.match(/All\s+(\d+)\s+checks passed/i);
    const mPassLines = stdout.split(/\r?\n/).filter(l => l.trim().startsWith('PASS:') || l.trim().startsWith('✓'));

    if (mTotalPassed) {
      total = parseInt(mTotalPassed[1], 10);
      passed = parseInt(mTotalPassed[2], 10);
      summaryText = mTotalPassed[0];
    } else if (mTotalHttp) {
      total = parseInt(mTotalHttp[1], 10);
      passed = parseInt(mTotalHttp[2], 10);
      summaryText = mTotalHttp[0];
    } else if (mSummaryPassedFailed) {
      passed = parseInt(mSummaryPassedFailed[1], 10);
      const failed = parseInt(mSummaryPassedFailed[2], 10);
      total = passed + failed;
      summaryText = mSummaryPassedFailed[0];
    } else if (mSummaryPassedFailedUpper) {
      passed = parseInt(mSummaryPassedFailedUpper[1], 10);
      const failed = parseInt(mSummaryPassedFailedUpper[2], 10);
      total = passed + failed;
      summaryText = mSummaryPassedFailedUpper[0];
    } else if (mAllChecksPassed) {
      passed = parseInt(mAllChecksPassed[1], 10);
      total = passed;
      summaryText = mAllChecksPassed[0];
    } else {
      passed = mPassLines.length;
      total = mPassLines.length;
      summaryText = `${passed} PASS lines`;
    }

    results.push({
      type: s.type,
      file: s.file,
      cmd: `node ${s.file}`,
      status: 'PASS',
      exitCode: 0,
      passed,
      total,
      durationMs: dur,
      summary: summaryText
    });
  } catch (err) {
    const dur = Date.now() - start;
    results.push({
      type: s.type,
      file: s.file,
      cmd: `node ${s.file}`,
      status: 'FAIL',
      exitCode: err.status || 1,
      passed: 0,
      total: 0,
      durationMs: dur,
      summary: err.message
    });
  }
}

console.log(JSON.stringify(results, null, 2));
