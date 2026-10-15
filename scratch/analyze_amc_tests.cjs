const fs = require("fs");

function analyzeTestFile(filePath) {
  if (!fs.existsSync(filePath)) return { exists: false };
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const usesHttp = /makeRequest|http\.request|supertest|fetch/i.test(content);
  const usesJwt = /jwt\.sign/i.test(content);
  const usesTransactions = /startSession|startTransaction|commitTransaction|abortTransaction/i.test(content);
  const mountsAdminRouter = /app\.use\([^,]*adminRouter\)|app\.use\([^,]*require\([`'"]\.\/admin[`'"]\)\)/i.test(content);
  const mountsClientRouter = /app\.use\([^,]*clientRouter\)|app\.use\([^,]*require\([`'"]\.\/client[`'"]\)\)/i.test(content);
  const callsAdminDirectly = /adminModule\.|syncUpcomingAmcRenewals/i.test(content);
  const usesDirectModel = /AmcContract\.(create|find|save|updateOne|findOneAndUpdate)/i.test(content);
  const usesReplicaSet = /27019|rsTest|replicaSet/i.test(content);
  
  return {
    exists: true,
    totalLines: lines.length,
    usesHttp,
    usesJwt,
    usesTransactions,
    mountsAdminRouter,
    mountsClientRouter,
    callsAdminDirectly,
    usesDirectModel,
    usesReplicaSet,
  };
}

const files = [
  "backend/verify_amccontract_model.js",
  "backend/test_amccontract_isolated.js",
  "backend/test_amccontract_api.js",
  "scratch/test_amccontract_replica_set_transactions.cjs",
  "scratch/run_all_amccontract_regressions.cjs",
  "backend/test_amc_renewal.js",
  "backend/test_amc_renewal_uat.js"
];

const report = {};
files.forEach(f => {
  report[f] = analyzeTestFile(f);
});

console.log(JSON.stringify(report, null, 2));

