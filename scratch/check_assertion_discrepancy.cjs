const fs = require('fs');

const log = fs.readFileSync('C:/Users/Admin/.gemini/antigravity/brain/07366f5e-6663-482b-9364-09f61a5a05dd/.system_generated/tasks/task-4023.log', 'utf8');
const lines = log.split(/\r?\n/);

// Lines 6 to 63 in 1-based indexing correspond to the 58 non-ProductSale suites
let sum58 = 0;
let new3 = 0;

for (const line of lines) {
  const match = line.match(/\|\s*Assertions:\s*(\d+)\s*\|/);
  if (match) {
    const count = parseInt(match[1], 10);
    if (line.includes('ProductSale')) {
      new3 += count;
      console.log('New Suite:', line.trim());
    } else {
      sum58 += count;
    }
  }
}

console.log('Sum of 58 non-ProductSale suites:', sum58);
console.log('Sum of 3 ProductSale suites:', new3);
console.log('Total 61 suites:', sum58 + new3);
console.log('Difference between sum58 and reported 3,275:', sum58 - 3275);

