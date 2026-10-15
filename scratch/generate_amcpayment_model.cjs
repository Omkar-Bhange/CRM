"use strict";

const fs = require("fs");
const path = require("path");

const adminPath = path.resolve("backend/admin.js");
const adminContent = fs.readFileSync(adminPath, "utf8");
const lines = adminContent.split("\n");

let startLine = -1;
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

let endLine = -1;
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

console.log("Lines to extract:");
console.log("Start line:", lines[startLine]);
console.log("End line:", lines[endLine]);

const amcPaymentChunk = lines.slice(startLine, endLine + 1).join("\n").trim();

const modelFileContent = `"use strict";

const mongoose = require("mongoose");

${amcPaymentChunk}

module.exports = AmcPayment;
`;

const targetPath = path.resolve("backend/models/AmcPayment.js");
fs.writeFileSync(targetPath, modelFileContent, "utf8");
console.log("Successfully created backend/models/AmcPayment.js with length:", modelFileContent.length);

