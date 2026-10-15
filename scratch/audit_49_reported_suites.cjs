const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const reported49 = [
  "backend/verify_attendancev2_model.js",
  "backend/test_attendancev2_isolated.js",
  "backend/verify_attendance_model.js",
  "backend/test_attendance_isolated.js",
  "backend/verify_approval_request_model.js",
  "backend/test_approval_request_isolated.js",
  "backend/verify_attendance_regularization_model.js",
  "backend/test_regularization_isolated.js",
  "backend/verify_leavebalance_model.js",
  "backend/test_leavebalance_isolated.js",
  "backend/verify_attendanceevent_model.js",
  "backend/test_attendanceevent_isolated.js",
  "backend/verify_agentdailysummary_model.js",
  "backend/test_agentdailysummary_isolated.js",
  "backend/verify_amcreminder_model.js",
  "backend/test_amcreminder_isolated.js",
  "backend/verify_project_model.js",
  "backend/test_project_isolated.js",
  "backend/verify_task_model.js",
  "backend/test_task_isolated.js",
  "backend/verify_supportticket_model.js",
  "backend/test_supportticket_isolated.js",
  "backend/verify_appcounter_model.js",
  "backend/test_appcounter_isolated.js",
  "backend/verify_agentdevice_model.js",
  "backend/test_agentdevice_isolated.js",
  "backend/verify_department_model.js",
  "backend/test_department_isolated.js",
  "backend/verify_notification_model.js",
  "backend/test_notification_isolated.js",
  "backend/verify_activitylog_model.js",
  "backend/test_activitylog_isolated.js",
  "backend/verify_quotation_model.js",
  "backend/test_quotation_isolated.js",
  "backend/verify_invoice_model.js",
  "backend/test_invoice_isolated.js",
  "backend/verify_payment_model.js",
  "backend/test_payment_isolated.js",
  "backend/verify_amc_model.js",
  "backend/test_amc_isolated.js",
  "scratch/test_attendancev2_real_routes.cjs",
  "scratch/test_attendance_calculation_parity.cjs",
  "scratch/test_legacy_attendance_real_routes.cjs",
  "scratch/test_attendance_shared_collection_isolated.cjs",
  "scratch/test_import_order_permutations.cjs",
  "scratch/verify_regularization_real_routes.cjs",
  "scratch/verify_attendanceevent_live_isolated.cjs",
  "scratch/test_ticketcode_discard.cjs",
  "scratch/verify_atlas_post_extraction.cjs"
];

console.log(`Auditing reported 49 suites against actual files...\n`);

const results = [];

reported49.forEach((reportedPath, idx) => {
  const num = idx + 1;
  const fullPath = path.resolve(reportedPath);
  const exists = fs.existsSync(fullPath);

  // Check possible alternatives if missing
  let actualPath = reportedPath;
  let mismatchReason = "";
  if (!exists) {
    if (reportedPath === "backend/verify_approval_request_model.js") {
      actualPath = "backend/verify_attendanceapprovalrequest_model.js";
      mismatchReason = "Misnamed in report: real file is backend/verify_attendanceapprovalrequest_model.js";
    } else if (reportedPath === "backend/test_approval_request_isolated.js") {
      actualPath = "backend/test_attendanceapprovalrequest_isolated.js";
      mismatchReason = "Misnamed in report: real file is backend/test_attendanceapprovalrequest_isolated.js";
    } else if (reportedPath === "backend/verify_attendance_regularization_model.js") {
      actualPath = "backend/verify_attendanceregularization_model.js";
      mismatchReason = "Misnamed in report: real file has no underscore before regularization (verify_attendanceregularization_model.js)";
    } else if (reportedPath === "backend/test_regularization_isolated.js") {
      actualPath = "backend/test_attendanceregularization_isolated.js";
      mismatchReason = "Misnamed in report: real file is backend/test_attendanceregularization_isolated.js";
    } else if (reportedPath === "backend/verify_project_model.js") {
      actualPath = "scratch/verify_project_model.cjs";
      mismatchReason = "Located in scratch/, not backend/; file is .cjs";
    } else if (reportedPath === "backend/test_project_isolated.js") {
      actualPath = "scratch/test_project_isolated_db.cjs";
      mismatchReason = "Located in scratch/, not backend/; file is scratch/test_project_isolated_db.cjs";
    } else if (reportedPath === "backend/verify_activitylog_model.js") {
      actualPath = "backend/verify_activitylog_model.js";
    } else {
      mismatchReason = "NONEXISTENT: Model was fabricated in previous report; no such model or test file exists";
    }
  }

  const actuallyExists = fs.existsSync(path.resolve(actualPath));

  results.push({
    num,
    reportedPath,
    existsAsReported: exists,
    actualPath: actuallyExists ? actualPath : "NONE",
    mismatchReason
  });
});

console.log("=== 49 SUITES EXISTENCE AUDIT ===");
results.forEach(r => {
  const status = r.existsAsReported ? "EXISTS" : (r.actualPath !== "NONE" ? "MISNAMED" : "NONEXISTENT");
  console.log(`${r.num.toString().padStart(2)}. [${status.padEnd(11)}] ${r.reportedPath} -> Actual: ${r.actualPath} ${r.mismatchReason ? `(${r.mismatchReason})` : ""}`);
});

const existingCount = results.filter(r => r.existsAsReported).length;
const misnamedCount = results.filter(r => !r.existsAsReported && r.actualPath !== "NONE").length;
const nonexistentCount = results.filter(r => r.actualPath === "NONE").length;

console.log(`\nSummary:`);
console.log(`  Exists exactly as reported: ${existingCount}`);
console.log(`  Exists under different name/path: ${misnamedCount}`);
console.log(`  Completely nonexistent: ${nonexistentCount}`);

