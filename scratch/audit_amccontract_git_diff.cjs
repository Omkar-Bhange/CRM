const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("=== COMPARING COMMIT a467bc4 WITH PARENT 103490f ===");

// 1. Check git diff on backend/client.js
const diffClient = execSync("git diff 103490f a467bc4 -- backend/client.js", { encoding: "utf8" });
console.log("Diff in backend/client.js:");
console.log(diffClient);

// 2. Check git diff on backend/admin.js
const diffAdmin = execSync("git diff 103490f a467bc4 -- backend/admin.js", { encoding: "utf8" });
const addedLines = diffAdmin.split("\n").filter(l => l.startsWith("+") && !l.startsWith("+++"));
console.log("Added lines in backend/admin.js:", addedLines);

// 3. Check for any modification to AmcInvoice, AmcPayment, IdempotencyLog in diff
const mentionsInvoiceInDiff = addedLines.some(l => l.includes("AmcInvoice"));
const mentionsPaymentInDiff = addedLines.some(l => l.includes("AmcPayment"));
const mentionsIdempotencyInDiff = addedLines.some(l => l.includes("IdempotencyLog"));
console.log("Added lines touch AmcInvoice:", mentionsInvoiceInDiff);
console.log("Added lines touch AmcPayment:", mentionsPaymentInDiff);
console.log("Added lines touch IdempotencyLog:", mentionsIdempotencyInDiff);

// 4. Circular dependency audit:
// Check what AmcContract requires
const amcContractContent = fs.readFileSync("backend/models/AmcContract.js", "utf8");
const requiresInAmcContract = (amcContractContent.match(/require\([^\)]+\)/g) || []);
console.log("Requires in backend/models/AmcContract.js:", requiresInAmcContract);

// 5. Check if AmcContract exports cleanly and doesn't load admin or client
const AmcContract = require("../backend/models/AmcContract");
console.log("AmcContract modelName:", AmcContract.modelName);
console.log("AmcContract collection.name:", AmcContract.collection.name);
console.log("AmcContract schema path count:", Object.keys(AmcContract.schema.paths).length);
console.log("AmcContract schema index count:", AmcContract.schema.indexes().length);

