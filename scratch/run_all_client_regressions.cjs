"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const suites = [
  // ── Client Suites ──────────────────────────────────────────────────────────
  { name: "Client Schema Verification", file: "backend/verify_client_model.js" },
  { name: "Client Isolated Integration Tests", file: "backend/test_client_isolated.js" },
  { name: "Client Real Production Route Security Tests", file: "scratch/test_client_real_routes.cjs" },

  // ── Attendance V2 Suites ───────────────────────────────────────────────────
  { name: "AttendanceV2 Schema Verification", file: "backend/verify_attendancev2_model.js" },
  { name: "AttendanceV2 Isolated Integration Tests", file: "backend/test_attendancev2_isolated.js" },
  { name: "AttendanceV2 Real Production Route Tests", file: "scratch/test_attendancev2_real_routes.cjs" },
  { name: "Attendance Calculation Parity Tests", file: "scratch/test_attendance_calculation_parity.cjs" },

  // ── Attendance V1 Suites ───────────────────────────────────────────────────
  { name: "Attendance (V1) Schema Verification", file: "backend/verify_attendance_model.js" },
  { name: "Attendance (V1) Isolated Integration Tests", file: "backend/test_attendance_isolated.js" },
  { name: "Legacy Attendance Real Route Tests", file: "scratch/test_legacy_attendance_real_routes.cjs" },
  { name: "Attendance Shared Collection Isolated Tests", file: "scratch/test_attendance_shared_collection_isolated.cjs" },
  { name: "Attendance Import Order Permutations", file: "scratch/test_import_order_permutations.cjs" },

  // ── AttendanceApprovalRequest Suites ───────────────────────────────────────
  { name: "AttendanceApprovalRequest Schema Verification", file: "backend/verify_attendanceapprovalrequest_model.js" },
  { name: "AttendanceApprovalRequest Isolated Tests", file: "backend/test_attendanceapprovalrequest_isolated.js" },

  // ── AttendanceRegularization Suites ────────────────────────────────────────
  { name: "AttendanceRegularization Schema Verification", file: "backend/verify_attendanceregularization_model.js" },
  { name: "AttendanceRegularization Isolated Tests", file: "backend/test_attendanceregularization_isolated.js" },
  { name: "Regularization Real Route Hotfix Verification", file: "scratch/verify_regularization_real_routes.cjs" },

  // ── AttendanceEvent Suites ─────────────────────────────────────────────────
  { name: "AttendanceEvent Schema Verification", file: "backend/verify_attendanceevent_model.js" },
  { name: "AttendanceEvent Isolated Tests", file: "backend/test_attendanceevent_isolated.js" },
  { name: "AttendanceEvent Live Isolated Verification", file: "scratch/verify_attendanceevent_live_isolated.cjs" },
  { name: "Attendance TicketCode Discard Test", file: "scratch/test_ticketcode_discard.cjs" },

  // ── Leave & Holiday Suites ─────────────────────────────────────────────────
  { name: "LeaveBalance Schema Verification", file: "backend/verify_leavebalance_model.js" },
  { name: "LeaveBalance Isolated Tests", file: "backend/test_leavebalance_isolated.js" },
  { name: "LeaveRequest Schema Verification", file: "backend/verify_leaverequest_model.js" },
  { name: "LeaveRequest Isolated Tests", file: "backend/test_leaverequest_isolated.js" },
  { name: "Holiday Schema Verification", file: "backend/verify_holiday_model.js" },
  { name: "Holiday Isolated Tests", file: "backend/test_holiday_isolated.js" },

  // ── AgentDailySummary Suites ───────────────────────────────────────────────
  { name: "AgentDailySummary Schema Verification", file: "backend/verify_agentdailysummary_model.js" },
  { name: "AgentDailySummary Isolated Tests", file: "backend/test_agentdailysummary_isolated.js" },

  // ── ActivityLog Suites ─────────────────────────────────────────────────────
  { name: "ActivityLog Schema Verification", file: "backend/verify_activitylog_model.js" },
  { name: "ActivityLog Isolated Tests", file: "backend/test_activitylog_isolated.js" },

  // ── AmcReminder Suites ─────────────────────────────────────────────────────
  { name: "AmcReminder Schema Verification", file: "backend/verify_amcreminder_model.js" },
  { name: "AmcReminder Isolated Tests", file: "backend/test_amcreminder_isolated.js" },
  { name: "AmcReminder Parity Verification", file: "scratch/verify_amcreminder_parity.cjs" },

  // ── AppCounter Suites ──────────────────────────────────────────────────────
  { name: "AppCounter Schema Verification", file: "backend/verify_appcounter_model.js" },
  { name: "AppCounter Isolated Tests", file: "backend/test_appcounter_isolated.js" },

  // ── ClientDocument & ClientNotification Suites ─────────────────────────────
  { name: "ClientDocument Schema Verification", file: "backend/verify_clientdocument_model.js" },
  { name: "ClientDocument Isolated Tests", file: "backend/test_clientdocument_isolated.js" },
  { name: "ClientNotification Schema Verification", file: "backend/verify_clientnotification_model.js" },
  { name: "ClientNotification Isolated Tests", file: "backend/test_clientnotification_isolated.js" },

  // ── EmployeeNotification & EmployeeDailyNote Suites ────────────────────────
  { name: "EmployeeNotification Schema Verification", file: "backend/verify_employeenotification_model.js" },
  { name: "EmployeeNotification Isolated Tests", file: "backend/test_employeenotification_isolated.js" },
  { name: "EmployeeDailyNote Schema Verification", file: "backend/verify_employeedailynote_model.js" },
  { name: "EmployeeDailyNote Isolated Tests", file: "backend/test_employeedailynote_isolated.js" },

  // ── ProcessedSessionBucket Suites ──────────────────────────────────────────
  { name: "ProcessedSessionBucket Schema Verification", file: "backend/verify_processedsessionbucket_model.js" },
  { name: "ProcessedSessionBucket Isolated Tests", file: "backend/test_processedsessionbucket_isolated.js" },

  // ── Product, Project & Requirement Suites ──────────────────────────────────
  { name: "Product Schema Verification", file: "scratch/verify_product_model.cjs" },
  { name: "Project Schema Verification", file: "scratch/verify_project_model.cjs" },
  { name: "Project Isolated DB Tests", file: "scratch/test_project_isolated_db.cjs" },
  { name: "Requirement Schema Verification", file: "backend/verify_requirement_model.js" },

  // ── SupportTicket & Task Suites ────────────────────────────────────────────
  { name: "SupportTicket Schema Verification", file: "backend/verify_supportticket_model.js" },
  { name: "SupportTicket Isolated Tests", file: "backend/test_supportticket_isolated.js" },
  { name: "SupportTicket API Tests", file: "backend/test_supportticket_api.js" },
  { name: "SystemSettings Schema Verification", file: "backend/verify_systemsettings_model.js" },
  { name: "SystemSettings Isolated Tests", file: "backend/test_systemsettings_isolated.js" },
  { name: "Task Schema Verification", file: "backend/verify_task_model.js" },
  { name: "Task Isolated Tests", file: "backend/test_task_isolated.js" },
  { name: "Secure Uploads Patch Test", file: "backend/test_secure_uploads_patch.js" },
];

function extractAssertionCount(stdout) {
  let m =
    stdout.match(/TOTAL CHECKS:\s*(\d+)/i) ||
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

console.log(`Starting regression run across ${suites.length} verified test suites...\n`);

let totalPassedSuites = 0;
let totalFailedSuites = 0;
let totalAssertions = 0;
const results = [];

for (const suite of suites) {
  const fullPath = path.resolve(suite.file);
  if (!fs.existsSync(fullPath)) {
    console.error(`✗ MISSING FILE: ${suite.file}`);
    totalFailedSuites++;
    results.push({ name: suite.name, file: suite.file, status: "MISSING", exitCode: 1, assertions: 0 });
    continue;
  }

  const cmd = `node ${suite.file}`;
  const start = Date.now();
  try {
    const stdout = execSync(cmd, { stdio: "pipe", encoding: "utf8", timeout: 30000 });
    const elapsed = Date.now() - start;
    const count = extractAssertionCount(stdout);
    totalAssertions += count;
    totalPassedSuites++;
    console.log(`✓ [EXIT 0] (${elapsed}ms) ${suite.name.padEnd(48)} | Assertions: ${count.toString().padStart(3)} | ${suite.file}`);
    results.push({ name: suite.name, file: suite.file, status: "PASSED", exitCode: 0, assertions: count });
  } catch (err) {
    const elapsed = Date.now() - start;
    totalFailedSuites++;
    console.log(`✗ [FAILED] (${elapsed}ms) [Exit: ${err.status}] ${suite.name} | ${suite.file}`);
    results.push({ name: suite.name, file: suite.file, status: "FAILED", exitCode: err.status || 1, assertions: 0 });
  }
}

console.log("\n======================================================");
console.log(`REGRESSION SUMMARY: ${suites.length} Suites | PASSED: ${totalPassedSuites} | FAILED: ${totalFailedSuites}`);
console.log(`TOTAL PASSING ASSERTIONS: ${totalAssertions}`);
console.log("======================================================");

if (totalFailedSuites > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
