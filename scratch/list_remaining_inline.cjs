const fs = require('fs');
const path = require('path');

// Centralized models in backend/models
const centralized = fs.readdirSync('backend/models').map(f => f.replace('.js', ''));
console.log(`Centralized models count (${centralized.length}):`, centralized);

// Find inline models
const adminContent = fs.readFileSync('backend/admin.js', 'utf8');
const authContent = fs.readFileSync('backend/auth.js', 'utf8');
const empContent = fs.readFileSync('backend/employee.js', 'utf8');

const inlineModels = [];

function findModels(content, filename) {
  const matches = [...content.matchAll(/mongoose\.model\(\s*["']([^"']+)["']/g)];
  matches.forEach(m => {
    if (!centralized.includes(m[1]) && !inlineModels.some(im => im.name === m[1])) {
      inlineModels.push({ name: m[1], file: filename });
    }
  });
}

findModels(adminContent, 'backend/admin.js');
findModels(authContent, 'backend/auth.js');
findModels(empContent, 'backend/employee.js');

console.log(`\nRemaining inline models count (${inlineModels.length}):`);
inlineModels.forEach(m => console.log(` - ${m.name} in ${m.file}`));

