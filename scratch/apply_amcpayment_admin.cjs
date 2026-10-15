const fs = require("fs");

const adminPath = "backend/admin.js";
let content = fs.readFileSync(adminPath, "utf8");

const lines = content.split(/\r?\n/);

let startLine = -1;
let endLine = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("AMC PAYMENT SCHEMA")) {
    for (let j = i - 1; j >= 0; j--) {
      if (lines[j].includes("/*")) {
        startLine = j;
        break;
      }
    }
    break;
  }
}

for (let i = startLine; i < lines.length; i++) {
  if (lines[i].includes('mongoose.model(') && lines[i + 1] && lines[i + 1].includes('"AmcPayment"') && lines[i + 3] && lines[i + 3].trim() === ");") {
    endLine = i + 3;
    break;
  }
}

console.log(`startLine: ${startLine + 1}, endLine: ${endLine + 1}`);
if (startLine === -1 || endLine === -1) {
  console.error("Could not locate start or end line.");
  process.exit(1);
}

console.log("Lines to replace:");
console.log("Start:", lines[startLine]);
console.log("End:", lines[endLine]);

const replacement = 'const AmcPayment = require("./models/AmcPayment");';

const newLines = [
  ...lines.slice(0, startLine),
  replacement,
  ...lines.slice(endLine + 1),
];

fs.writeFileSync(adminPath, newLines.join("\n"), "utf8");
console.log(`Successfully updated ${adminPath}. Lines before: ${lines.length}, lines after: ${newLines.length}`);

