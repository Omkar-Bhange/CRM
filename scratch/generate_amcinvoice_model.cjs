"use strict";

const fs = require("fs");
const path = require("path");

const adminPath = path.resolve("backend/admin.js");
const adminContent = fs.readFileSync(adminPath, "utf8");
const lines = adminContent.split("\n");

// Find exact line indices
let startIndex = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("AMC INVOICE SCHEMA")) {
    // Look backwards for the start of the comment block
    for (let j = i - 1; j >= 0; j--) {
      if (lines[j].includes("/*")) {
        startIndex = j;
        break;
      }
    }
    break;
  }
}

let endIndex = -1;
for (let i = startIndex + 1; i < lines.length; i++) {
  if (lines[i].includes("IDEMPOTENCY LOG SCHEMA")) {
    for (let j = i - 1; j >= startIndex; j--) {
      if (lines[j].includes("/*")) {
        endIndex = j;
        break;
      }
    }
    break;
  }
}

console.log(`Extracting lines ${startIndex + 1} to ${endIndex} (0-indexed ${startIndex} to ${endIndex})`);
console.log(`Start line text: "${lines[startIndex]}"`);
console.log(`End line text (first line of next section): "${lines[endIndex]}"`);

const amcInvoiceChunk = lines.slice(startIndex, endIndex).join("\n").trim();

const modelFileContent = `"use strict";

const mongoose = require("mongoose");

${amcInvoiceChunk}

module.exports = AmcInvoice;
`;

const targetPath = path.resolve("backend/models/AmcInvoice.js");
fs.writeFileSync(targetPath, modelFileContent, "utf8");
console.log("Successfully created backend/models/AmcInvoice.js with length:", modelFileContent.length);

