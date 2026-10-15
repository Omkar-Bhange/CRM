const { execSync } = require('child_process');
const path = require('path');

const permutations = [
  "['./backend/models/AgentDailySummary', './backend/agentSession', './backend/admin', './backend/employee', './backend/attendance-v2']",
  "['./backend/agentSession', './backend/models/AgentDailySummary', './backend/employee', './backend/admin', './backend/attendance-v2']",
  "['./backend/attendance-v2', './backend/employee', './backend/admin', './backend/models/AgentDailySummary']",
  "['./backend/employee', './backend/models/AgentDailySummary', './backend/admin', './backend/attendance-v2']",
  "['./backend/admin', './backend/attendance-v2', './backend/employee', './backend/agentSession']"
];

console.log("=== TESTING IMPORT ORDER PERMUTATIONS ===");

permutations.forEach((perm, idx) => {
  const code = `
    require('./backend/node_modules/dotenv').config({ path: require('path').join(__dirname, 'backend/.env') });
    const mongoose = require('./backend/node_modules/mongoose');
    const modules = ${perm};
    modules.forEach(m => require(m));
    if (!mongoose.models.AgentDailySummary) throw new Error('AgentDailySummary not registered!');
    console.log('Permutation ' + (${idx + 1}) + ': SUCCESS');
  `;
  try {
    const res = execSync(`node -e "${code.replace(/\n/g, ' ')}"`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    console.log(`Permutation ${idx + 1} passed: ${res.trim()}`);
  } catch (err) {
    console.error(`Permutation ${idx + 1} FAILED:`, err.message);
  }
});

