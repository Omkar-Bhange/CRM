const fs = require('fs');

const clientLog = fs.readFileSync('C:/Users/Admin/.gemini/antigravity/brain/07366f5e-6663-482b-9364-09f61a5a05dd/.system_generated/tasks/task-4089.log', 'utf8');
const psLog = fs.readFileSync('C:/Users/Admin/.gemini/antigravity/brain/07366f5e-6663-482b-9364-09f61a5a05dd/.system_generated/tasks/task-4023.log', 'utf8');

function extractSuiteAssertions(logText) {
  const map = new Map();
  const lines = logText.split(/\r?\n/);
  for (const l of lines) {
    const match = l.match(/\|\s*Assertions:\s*(\d+)\s*\|\s*(?:File:\s*)?([^\s|]+)/);
    if (match) {
      const assertions = parseInt(match[1], 10);
      const file = match[2];
      map.set(file, assertions);
    }
  }
  return map;
}

const clientMap = extractSuiteAssertions(clientLog);
const psMap = extractSuiteAssertions(psLog);

console.log(`Client log suites extracted: ${clientMap.size}`);
console.log(`ProductSale log suites extracted: ${psMap.size}`);

console.log('\nDifferences across common suites:');
for (const [file, clientCount] of clientMap.entries()) {
  const psCount = psMap.get(file);
  if (psCount !== clientCount) {
    console.log(`Difference in ${file}: Client=${clientCount}, ProductSale=${psCount} (Diff: ${psCount - clientCount})`);
  }
}

