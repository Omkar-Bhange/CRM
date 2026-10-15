"use strict";

const fs = require("fs");
const path = require("path");

const adminPath = path.resolve("backend/admin.js");
const adminContent = fs.readFileSync(adminPath, "utf8");
const lines = adminContent.split("\n");

// Lines 1600 to 2522 (0-indexed: 1599 to 2522)
// Line 1600: /* =====================================================
// Line 1604: const amcTimelineSchema =
// Line 2522: );

const headerComment = lines.slice(1599, 1603).join("\n");
const amcChunk = lines.slice(1603, 2522).join("\n");

const modelFileContent = `"use strict";

const mongoose = require("mongoose");

${headerComment}
${amcChunk}

module.exports = AmcContract;
`;

const targetPath = path.resolve("backend/models/AmcContract.js");
fs.writeFileSync(targetPath, modelFileContent, "utf8");
console.log("Successfully created backend/models/AmcContract.js with length:", modelFileContent.length);

