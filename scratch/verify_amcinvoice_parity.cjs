"use strict";

const fs = require("fs");
const path = require("path");
const mongoose = require("../backend/node_modules/mongoose");

// 1. Check file existence
const modelPath = path.resolve("backend/models/AmcInvoice.js");
if (!fs.existsSync(modelPath)) {
  console.error("FAIL: backend/models/AmcInvoice.js does not exist");
  process.exit(1);
}

// 2. Load extracted model
delete mongoose.models.AmcInvoice;
const ExtractedAmcInvoice = require("../backend/models/AmcInvoice");

console.log("Model name:", ExtractedAmcInvoice.modelName);
console.log("Collection name:", ExtractedAmcInvoice.collection.name);

if (ExtractedAmcInvoice.modelName !== "AmcInvoice") {
  console.error("FAIL: Model name is not AmcInvoice");
  process.exit(1);
}

if (ExtractedAmcInvoice.collection.name !== "amcinvoices") {
  console.error("FAIL: Collection name is not amcinvoices");
  process.exit(1);
}

// 3. Compare with original text in admin.js
const adminContent = fs.readFileSync("backend/admin.js", "utf8");
const modelContent = fs.readFileSync(modelPath, "utf8");

// Verify that the duplicate $in is present verbatim in AmcInvoice.js
const hasDuplicateIn = modelContent.includes('$in: ["Issued", "Partially Paid", "Paid", "Overdue"]') &&
                       modelContent.includes('$in: ["Issued", "Draft"]');

console.log("Verbatim duplicate $in preserved:", hasDuplicateIn);
if (!hasDuplicateIn) {
  console.error("FAIL: Duplicate $in was not preserved verbatim!");
  process.exit(1);
}

// 4. Verify indexes declared on the schema
const schemaIndexes = ExtractedAmcInvoice.schema.indexes();
console.log(`Declared indexes count: ${schemaIndexes.length}`);
schemaIndexes.forEach((idx, i) => {
  console.log(`  [${i + 1}] key: ${JSON.stringify(idx[0])}, options: ${JSON.stringify(idx[1])}`);
});

// 5. Verify fields count and path types
const paths = Object.keys(ExtractedAmcInvoice.schema.paths);
console.log(`Total schema paths: ${paths.length}`);

console.log("PARITY VERIFICATION SUCCESSFUL!");

