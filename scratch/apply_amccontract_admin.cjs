const fs = require("fs");

const adminPath = "backend/admin.js";
let content = fs.readFileSync(adminPath, "utf8");

const lines = content.split(/\r?\n/);

let startLine = -1;
let endLine = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("const amcTimelineSchema =")) {
    startLine = i;
    break;
  }
}

for (let i = startLine; i < lines.length; i++) {
  if (lines[i].includes("amcContractSchema") && lines[i + 1] && lines[i + 1].trim() === ");") {
    endLine = i + 1;
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

const replacement = 'const AmcContract = require("./models/AmcContract");';

const newLines = [
  ...lines.slice(0, startLine),
  replacement,
  ...lines.slice(endLine + 1),
];

const isCRLF = content.includes("\r\n");
const separator = isCRLF ? "\r\n" : "\n";

fs.writeFileSync(adminPath, newLines.join(separator), "utf8");
console.log("Successfully replaced AmcContract inline definition in backend/admin.js!");

