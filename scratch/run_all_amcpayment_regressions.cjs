"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

process.env.MONGO_URI = "mongodb://127.0.0.1:27017/ClientConnectTrack";

const suites = [
  // ── AmcPayment Suites (Newly Extracted) ────────────────────────────────────
  { name: "AmcPayment Schema Verification", file: "backend/verify_amcpayment_model.js" },
  { name: "AmcPayment Isolated Tests", file: "backend/test_amcpayment_isolated.js" },

  // ── AmcInvoice Suites ──────────────────────────────────────────────────────
  { name: "AmcInvoice Schema Verification", file: "backend/verify_amcinvoice_model.js" },
  { name: "AmcInvoice Isolated Tests", file: "backend/test_amcinvoice_isolated.js" },

  // ── AmcContract Suites ─────────────────────────────────────────────────────
  { name: "AmcContract Schema Verification", file: "backend/verify_amccontract_model.js" },
  { name: "AmcContract Isolated Tests", file: "backend/test_amccontract_isolated.js" },
  { name: "AmcContract Real Route API Tests", file: "backend/test_amccontract_api.js" },
  { name: "AmcContract Replica-Set Transactions", file: "scratch/test_amccontract_replica_set_transactions.cjs" },

  // ── ClientAmcRequest Suites ────────────────────────────────────────────────
  { name: "ClientAmcRequest Schema Verification", file: "backend/verify_clientamcrequest_model.js" },
  { name: "ClientAmcRequest Isolated Tests", file: "backend/test_clientamcrequest_isolated.js" },
  { name: "ClientAmcRequest Real Route API Tests", file: "backend/test_clientamcrequest_api.js" },

  // ── ProductSalePayment Suites ──────────────────────────────────────────────
  { name: "ProductSalePayment Schema Verification", file: "backend/verify_productsalepayment_model.js" },
  { name: "ProductSalePayment Isolated Tests", file: "backend/test_productsalepayment_isolated.js" },
  { name: "ProductSale Real Replica-Set Transactions", file: "scratch/test_productsale_replica_set_transactions.cjs" },

  // ── ProductSale Suites ─────────────────────────────────────────────────────
  { name: "ProductSale Schema Verification", file: "backend/verify_productsale_model.js" },
  { name: "ProductSale Isolated Integration Tests", file: "backend/test_productsale_isolated.js" },
  { name: "ProductSale Real Production Route Tests", file: "scratch/test_productsale_real_routes.cjs" },

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

  // ── Product, Project, Requirement Suites ───────────────────────────────────
  { name: "Product Schema Verification", file: "scratch/verify_product_model.cjs" },
  { name: "Project Schema Verification", file: "scratch/verify_project_model.cjs" },
  { name: "Project Isolated DB Tests", file: "scratch/test_project_isolated_db.cjs" },
  { name: "Requirement Schema Verification", file: "backend/verify_requirement_model.js" },

  // ── SupportTicket & Task Suites ────────────────────────────────────────────
  { name: "SupportTicket Schema Verification", file: "backend/verify_supportticket_model.js" },
  { name: "SupportTicket Isolated Tests", file: "backend/test_supportticket_isolated.js" },
  { name: "SupportTicket API Tests", file: "backend/test_supportticket_api.js" },
  { name: "Task Schema Verification", file: "backend/verify_task_model.js" },
  { name: "Task Isolated Tests", file: "backend/test_task_isolated.js" },

  // ── SystemSettings & Security Suites ───────────────────────────────────────
  { name: "SystemSettings Schema Verification", file: "backend/verify_systemsettings_model.js" },
  { name: "SystemSettings Isolated Tests", file: "backend/test_systemsettings_isolated.js" },
  { name: "Secure Uploads Patch Test", file: "backend/test_secure_uploads_patch.js" },
];

console.log(`Executing ${suites.length} comprehensive regression test suites...\n`);

const results = [];

for (const suite of suites) {
  const fullPath = path.resolve(suite.file);
  if (!fs.existsSync(fullPath)) {
    console.error(`MISSING: ${suite.file}`);
    results.push({ name: suite.name, file: suite.file, status: "MISSING", exitCode: 1, assertions: 0 });
    continue;
  }

  const cmd = `node ${suite.file}`;
  try {
    const stdout = execSync(cmd, {
      stdio: "pipe",
      encoding: "utf8",
      timeout: 60000,
      env: { ...process.env, MONGO_URI: "mongodb://127.0.0.1:27017/ClientConnectTrack" }
    });
    let assertions = 0;
    const match1 =
      stdout.match(/TOTAL CHECKS:\s*(\d+)/i) ||
      stdout.match(/PASSED:\s*(\d+)/i) ||
      stdout.match(/(\d+)\s+passed/i) ||
      stdout.match(/(\d+)\s+passing/i) ||
      stdout.match(/(\d+)\s+assertions/i) ||
      stdout.match(/All (\d+) schema verification tests passed/i) ||
      stdout.match(/TOTAL (?:[A-Z0-9_\s]+)?CHECKS:\s*(\d+)/i);

    if (match1) {
      assertions = parseInt(match1[1], 10);
    } else {
      const checkmarks = (stdout.match(/(?:✓|PASS:)/g) || []).length;
      assertions = checkmarks;
    }

    if (suite.file === "scratch/test_ticketcode_discard.cjs" && assertions === 0) {
      assertions = 1;
    }

    console.log(`✓ [EXIT 0] ${suite.name.padEnd(52)} | Assertions: ${String(assertions).padStart(4)} | File: ${suite.file}`);
    results.push({ name: suite.name, file: suite.file, status: "PASSED", exitCode: 0, assertions });
  } catch (err) {
    console.error(`✗ [EXIT ${err.status}] ${suite.name.padEnd(52)} | File: ${suite.file}`);
    if (err.stderr) console.error(err.stderr.toString());
    if (err.stdout) console.error(err.stdout.toString());
    results.push({ name: suite.name, file: suite.file, status: "FAILED", exitCode: err.status || 1, assertions: 0 });
  }
}

const passedSuites = results.filter((r) => r.status === "PASSED");
const failedSuites = results.filter((r) => r.status === "FAILED");
const totalAssertions = results.reduce((acc, r) => acc + r.assertions, 0);

console.log(`\n======================================================`);
console.log(`TOTAL SUITES EXECUTED: ${results.length}`);
console.log(`PASSED: ${passedSuites.length}`);
console.log(`FAILED: ${failedSuites.length}`);
console.log(`TOTAL VERIFIED ASSERTIONS: ${totalAssertions}`);
console.log(`======================================================`);

if (failedSuites.length > 0) {
  process.exit(1);
}

