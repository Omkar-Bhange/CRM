const fs = require("fs");

const content = fs.readFileSync("backend/admin.js", "utf8");
const lines = content.split("\n");

function findHandlerLines(pattern) {
  const matches = [];
  lines.forEach((l, idx) => {
    if (pattern.test(l)) {
      matches.push({ line: idx + 1, text: l.trim() });
    }
  });
  return matches;
}

console.log("=== AMC WRITE HANDLERS IN admin.js ===");
console.log("1. Contract creation:", findHandlerLines(/router\.post\s*\(\s*["'`]\/amc\/(?:contract|contracts)["'`]/i));
console.log("2. Renew contract:", findHandlerLines(/router\.post\s*\(\s*["'`]\/amc\/contract\/[^\/]+\/renew/i));
console.log("3. AMC Payment:", findHandlerLines(/router\.post\s*\(\s*["'`]\/amc\/payment/i));
console.log("4. AMC Invoice:", findHandlerLines(/router\.post\s*\(\s*["'`]\/amc\/invoice/i));
console.log("5. Sync renewals:", findHandlerLines(/router\.post\s*\(\s*["'`]\/amc\/cron\/sync-renewals/i));
console.log("6. Function syncUpcomingAmcRenewals:", findHandlerLines(/async function syncUpcomingAmcRenewals/i));

