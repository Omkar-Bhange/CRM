const { execSync } = require('child_process');
const path = require('path');

const suites = [
  { name: 'Attendance V1 Schema Verification', cmd: 'node backend/verify_attendance_model.js' },
  { name: 'Attendance V1 Isolated Integration Tests', cmd: 'node backend/test_attendance_isolated.js' },
  { name: 'Real Legacy Attendance Route Tests', cmd: 'node scratch/test_legacy_attendance_real_routes.cjs' },
  { name: 'AttendanceApprovalRequest Schema Verification', cmd: 'node backend/verify_attendanceapprovalrequest_model.js' },
  { name: 'AttendanceApprovalRequest Isolated Tests', cmd: 'node backend/test_attendanceapprovalrequest_isolated.js' },
  { name: 'AttendanceRegularization Schema Verification', cmd: 'node backend/verify_attendanceregularization_model.js' },
  { name: 'AttendanceRegularization Isolated Tests', cmd: 'node backend/test_attendanceregularization_isolated.js' },
  { name: 'Real Regularization Route Hotfix Verification', cmd: 'node scratch/verify_regularization_real_routes.cjs' },
  { name: 'AttendanceEvent Schema Verification', cmd: 'node backend/verify_attendanceevent_model.js' },
  { name: 'AttendanceEvent Isolated Tests', cmd: 'node backend/test_attendanceevent_isolated.js' },
  { name: 'LeaveBalance Schema Verification', cmd: 'node backend/verify_leavebalance_model.js' },
  { name: 'LeaveBalance Isolated Tests', cmd: 'node backend/test_leavebalance_isolated.js' },
  { name: 'LeaveRequest Schema Verification', cmd: 'node backend/verify_leaverequest_model.js' },
  { name: 'LeaveRequest Isolated Tests', cmd: 'node backend/test_leaverequest_isolated.js' },
  { name: 'Holiday Schema Verification', cmd: 'node backend/verify_holiday_model.js' },
  { name: 'Holiday Isolated Tests', cmd: 'node backend/test_holiday_isolated.js' },
  { name: 'AgentDailySummary Schema Verification', cmd: 'node backend/verify_agentdailysummary_model.js' },
  { name: 'AgentDailySummary Isolated Tests', cmd: 'node backend/test_agentdailysummary_isolated.js' },
  { name: 'ActivityLog Schema Verification', cmd: 'node backend/verify_activitylog_model.js' },
  { name: 'ActivityLog Isolated Tests', cmd: 'node backend/test_activitylog_isolated.js' },
  { name: 'AmcReminder Schema Verification', cmd: 'node backend/verify_amcreminder_model.js' },
  { name: 'AmcReminder Isolated Tests', cmd: 'node backend/test_amcreminder_isolated.js' },
  { name: 'AppCounter Schema Verification', cmd: 'node backend/verify_appcounter_model.js' },
  { name: 'AppCounter Isolated Tests', cmd: 'node backend/test_appcounter_isolated.js' },
  { name: 'ClientDocument Schema Verification', cmd: 'node backend/verify_clientdocument_model.js' },
  { name: 'ClientDocument Isolated Tests', cmd: 'node backend/test_clientdocument_isolated.js' },
  { name: 'ClientNotification Schema Verification', cmd: 'node backend/verify_clientnotification_model.js' },
  { name: 'ClientNotification Isolated Tests', cmd: 'node backend/test_clientnotification_isolated.js' },
  { name: 'EmployeeDailyNote Schema Verification', cmd: 'node backend/verify_employeedailynote_model.js' },
  { name: 'EmployeeDailyNote Isolated Tests', cmd: 'node backend/test_employeedailynote_isolated.js' },
  { name: 'EmployeeNotification Schema Verification', cmd: 'node backend/verify_employeenotification_model.js' },
  { name: 'EmployeeNotification Isolated Tests', cmd: 'node backend/test_employeenotification_isolated.js' },
  { name: 'ProcessedSessionBucket Schema Verification', cmd: 'node backend/verify_processedsessionbucket_model.js' },
  { name: 'ProcessedSessionBucket Isolated Tests', cmd: 'node backend/test_processedsessionbucket_isolated.js' },
  { name: 'Product Schema Verification', cmd: 'node scratch/verify_product_model.cjs' },
  { name: 'Project Schema Verification', cmd: 'node scratch/verify_project_model.cjs' },
  { name: 'Requirement Schema Verification', cmd: 'node backend/verify_requirement_model.js' },
  { name: 'SupportTicket Schema Verification', cmd: 'node backend/verify_supportticket_model.js' },
  { name: 'SupportTicket Isolated Tests', cmd: 'node backend/test_supportticket_isolated.js' },
  { name: 'SupportTicket API Tests', cmd: 'node backend/test_supportticket_api.js' },
  { name: 'SystemSettings Schema Verification', cmd: 'node backend/verify_systemsettings_model.js' },
  { name: 'SystemSettings Isolated Tests', cmd: 'node backend/test_systemsettings_isolated.js' },
  { name: 'Task Schema Verification', cmd: 'node backend/verify_task_model.js' },
  { name: 'Task Isolated Tests', cmd: 'node backend/test_task_isolated.js' },
  { name: 'Secure Uploads Patch Test', cmd: 'node backend/test_secure_uploads_patch.js' },
];

console.log(`Starting regression run across ${suites.length} test suites...\n`);

const results = [];
let totalPassed = 0;
let totalFailed = 0;

for (const suite of suites) {
  process.stdout.write(`Running: ${suite.name}... `);
  const start = Date.now();
  try {
    const out = execSync(suite.cmd, { stdio: 'pipe', encoding: 'utf8', timeout: 30000 });
    const elapsed = Date.now() - start;
    console.log(`✓ PASSED (${elapsed}ms)`);
    results.push({ name: suite.name, status: 'PASSED', exitCode: 0, elapsed });
    totalPassed++;
  } catch (err) {
    const elapsed = Date.now() - start;
    console.log(`✗ FAILED (${elapsed}ms) [Exit: ${err.status}]`);
    console.error(err.stdout || err.stderr || err.message);
    results.push({ name: suite.name, status: 'FAILED', exitCode: err.status || 1, elapsed, error: err.message });
    totalFailed++;
  }
}

console.log('\n======================================================');
console.log(`REGRESSION SUMMARY: ${results.length} Suites | PASSED: ${totalPassed} | FAILED: ${totalFailed}`);
console.log('======================================================');

if (totalFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

