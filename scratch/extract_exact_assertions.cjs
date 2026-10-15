const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const realSuites = [
  { name: 'AttendanceV2 Schema Verification', file: 'backend/verify_attendancev2_model.js' },
  { name: 'AttendanceV2 Isolated Integration Tests', file: 'backend/test_attendancev2_isolated.js' },
  { name: 'AttendanceV2 Real Production Route Tests', file: 'scratch/test_attendancev2_real_routes.cjs' },
  { name: 'Attendance Calculation Parity Tests', file: 'scratch/test_attendance_calculation_parity.cjs' },
  { name: 'Attendance (V1) Schema Verification', file: 'backend/verify_attendance_model.js' },
  { name: 'Attendance (V1) Isolated Integration Tests', file: 'backend/test_attendance_isolated.js' },
  { name: 'Legacy Attendance Real Route Tests', file: 'scratch/test_legacy_attendance_real_routes.cjs' },
  { name: 'Attendance Shared Collection Isolated Tests', file: 'scratch/test_attendance_shared_collection_isolated.cjs' },
  { name: 'Attendance Import Order Permutations', file: 'scratch/test_import_order_permutations.cjs' },
  { name: 'AttendanceApprovalRequest Schema Verification', file: 'backend/verify_attendanceapprovalrequest_model.js' },
  { name: 'AttendanceApprovalRequest Isolated Tests', file: 'backend/test_attendanceapprovalrequest_isolated.js' },
  { name: 'AttendanceRegularization Schema Verification', file: 'backend/verify_attendanceregularization_model.js' },
  { name: 'AttendanceRegularization Isolated Tests', file: 'backend/test_attendanceregularization_isolated.js' },
  { name: 'Regularization Real Route Hotfix Verification', file: 'scratch/verify_regularization_real_routes.cjs' },
  { name: 'AttendanceEvent Schema Verification', file: 'backend/verify_attendanceevent_model.js' },
  { name: 'AttendanceEvent Isolated Tests', file: 'backend/test_attendanceevent_isolated.js' },
  { name: 'AttendanceEvent Live Isolated Verification', file: 'scratch/verify_attendanceevent_live_isolated.cjs' },
  { name: 'Attendance TicketCode Discard Test', file: 'scratch/test_ticketcode_discard.cjs' },
  { name: 'LeaveBalance Schema Verification', file: 'backend/verify_leavebalance_model.js' },
  { name: 'LeaveBalance Isolated Tests', file: 'backend/test_leavebalance_isolated.js' },
  { name: 'LeaveRequest Schema Verification', file: 'backend/verify_leaverequest_model.js' },
  { name: 'LeaveRequest Isolated Tests', file: 'backend/test_leaverequest_isolated.js' },
  { name: 'Holiday Schema Verification', file: 'backend/verify_holiday_model.js' },
  { name: 'Holiday Isolated Tests', file: 'backend/test_holiday_isolated.js' },
  { name: 'AgentDailySummary Schema Verification', file: 'backend/verify_agentdailysummary_model.js' },
  { name: 'AgentDailySummary Isolated Tests', file: 'backend/test_agentdailysummary_isolated.js' },
  { name: 'ActivityLog Schema Verification', file: 'backend/verify_activitylog_model.js' },
  { name: 'ActivityLog Isolated Tests', file: 'backend/test_activitylog_isolated.js' },
  { name: 'AmcReminder Schema Verification', file: 'backend/verify_amcreminder_model.js' },
  { name: 'AmcReminder Isolated Tests', file: 'backend/test_amcreminder_isolated.js' },
  { name: 'AmcReminder Parity Verification', file: 'scratch/verify_amcreminder_parity.cjs' },
  { name: 'AppCounter Schema Verification', file: 'backend/verify_appcounter_model.js' },
  { name: 'AppCounter Isolated Tests', file: 'backend/test_appcounter_isolated.js' },
  { name: 'ClientDocument Schema Verification', file: 'backend/verify_clientdocument_model.js' },
  { name: 'ClientDocument Isolated Tests', file: 'backend/test_clientdocument_isolated.js' },
  { name: 'ClientNotification Schema Verification', file: 'backend/verify_clientnotification_model.js' },
  { name: 'ClientNotification Isolated Tests', file: 'backend/test_clientnotification_isolated.js' },
  { name: 'EmployeeNotification Schema Verification', file: 'backend/verify_employeenotification_model.js' },
  { name: 'EmployeeNotification Isolated Tests', file: 'backend/test_employeenotification_isolated.js' },
  { name: 'EmployeeDailyNote Schema Verification', file: 'backend/verify_employeedailynote_model.js' },
  { name: 'EmployeeDailyNote Isolated Tests', file: 'backend/test_employeedailynote_isolated.js' },
  { name: 'ProcessedSessionBucket Schema Verification', file: 'backend/verify_processedsessionbucket_model.js' },
  { name: 'ProcessedSessionBucket Isolated Tests', file: 'backend/test_processedsessionbucket_isolated.js' },
  { name: 'Product Schema Verification', file: 'scratch/verify_product_model.cjs' },
  { name: 'Project Schema Verification', file: 'scratch/verify_project_model.cjs' },
  { name: 'Project Isolated DB Tests', file: 'scratch/test_project_isolated_db.cjs' },
  { name: 'Requirement Schema Verification', file: 'backend/verify_requirement_model.js' },
  { name: 'SupportTicket Schema Verification', file: 'backend/verify_supportticket_model.js' },
  { name: 'SupportTicket Isolated Tests', file: 'backend/test_supportticket_isolated.js' },
  { name: 'SupportTicket API Tests', file: 'backend/test_supportticket_api.js' },
  { name: 'SystemSettings Schema Verification', file: 'backend/verify_systemsettings_model.js' },
  { name: 'SystemSettings Isolated Tests', file: 'backend/test_systemsettings_isolated.js' },
  { name: 'Task Schema Verification', file: 'backend/verify_task_model.js' },
  { name: 'Task Isolated Tests', file: 'backend/test_task_isolated.js' },
  { name: 'Secure Uploads Patch Test', file: 'backend/test_secure_uploads_patch.js' },
];

function extractAssertionCount(stdout) {
  let m = stdout.match(/TOTAL CHECKS:\s*(\d+)/i) ||
          stdout.match(/TOTAL (?:[A-Z0-9_\s]+)?CHECKS:\s*(\d+)/i) ||
          stdout.match(/SUMMARY:\s*(\d+)\s+passed/i) ||
          stdout.match(/(\d+)\s+passed,\s*0\s+failed/i) ||
          stdout.match(/(\d+)\s+checks\s+passed/i) ||
          stdout.match(/(\d+)\s+passed/i) ||
          stdout.match(/PASSED:\s*(\d+)/i);
  if (m) return parseInt(m[1], 10);
  const checkmarks = (stdout.match(/✓/g) || []).length;
  if (checkmarks > 0) return checkmarks;
  const passLines = (stdout.match(/PASS:/g) || []).length;
  if (passLines > 0) return passLines;
  return 1;
}

console.log("Analyzing test assertion outputs...");
let total = 0;
realSuites.forEach((s, idx) => {
  const cmd = `node ${s.file}`;
  try {
    const stdout = execSync(cmd, { stdio: 'pipe', encoding: 'utf8', timeout: 30000 });
    const count = extractAssertionCount(stdout);
    total += count;
    console.log(`${(idx + 1).toString().padStart(2)}. [EXIT 0] ${s.name.padEnd(45)} | Assertions: ${count.toString().padStart(3)} | ${s.file}`);
  } catch (err) {
    console.log(`${(idx + 1).toString().padStart(2)}. [FAILED] ${s.name.padEnd(45)} | File: ${s.file}`);
  }
});
console.log(`\nTOTAL VERIFIED PASSING CHECKS: ${total}`);

