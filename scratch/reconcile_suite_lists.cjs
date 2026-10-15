const fs = require('fs');

const clientRunFile = 'scratch/run_all_client_regressions.cjs';
const psRunFile = 'scratch/run_all_productsale_regressions.cjs';

const clientRun = fs.readFileSync(clientRunFile, 'utf8');
const psRun = fs.readFileSync(psRunFile, 'utf8');

// Parse suite entries
function parseSuites(content) {
  const matches = [...content.matchAll(/\{\s*name:\s*["']([^"']+)["'],\s*file:\s*["']([^"']+)["']\s*\}/g)];
  return matches.map(m => ({ name: m[1], file: m[2] }));
}

const clientSuites = parseSuites(clientRun);
const psSuites = parseSuites(psRun);

console.log('Client runner suite count:', clientSuites.length);
console.log('ProductSale runner suite count:', psSuites.length);

const added = psSuites.filter(ps => !clientSuites.some(cs => cs.file === ps.file));
console.log('Added suites in ProductSale runner:', added);

const removed = clientSuites.filter(cs => !psSuites.some(ps => ps.file === cs.file));
console.log('Removed suites in ProductSale runner:', removed);

