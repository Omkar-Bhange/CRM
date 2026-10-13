const mongoose = require("mongoose");
const path = require("path");

let passed = 0;
let failed = 0;

function assert(description, condition) {
  if (condition) {
    console.log(`  PASS: ${description}`);
    passed++;
  } else {
    console.error(`  FAIL: ${description}`);
    failed++;
  }
}

console.log("================================================================================");
console.log("   APPCOUNTER MODEL SCHEMA UNIT VERIFICATION                                   ");
console.log("================================================================================");

const AppCounter = require("./models/AppCounter");

// [1] Model & Collection
assert("Model is loaded and named AppCounter", AppCounter.modelName === "AppCounter");
assert("Mongoose registration exists in mongoose.models", mongoose.models.AppCounter === AppCounter);
assert("Collection name is explicitly 'appcounters'", AppCounter.collection.name === "appcounters");

// [2] Schema Paths
const schema = AppCounter.schema;
const paths = schema.paths;

assert("Schema has _id path", Boolean(paths._id));
assert("_id instance is String", paths._id.instance === "String");
assert("_id is required", paths._id.options.required === true);

assert("Schema has seq path", Boolean(paths.seq));
assert("seq instance is Number", paths.seq.instance === "Number");
assert("seq default value is 0", paths.seq.defaultValue === 0 || paths.seq.options.default === 0);

assert("Total user-defined schema fields is 2 (_id, seq)", Object.keys(paths).filter(p => !p.startsWith("__")).length === 2);

// [3] Indexes
const indexes = schema.indexes();
assert("No superfluous secondary indexes defined", indexes.length === 0);

// [4] Idempotent Export
delete require.cache[require.resolve("./models/AppCounter")];
const ReLoadedAppCounter = require("./models/AppCounter");
assert("Idempotent export returns same Mongoose model", ReLoadedAppCounter === AppCounter);

console.log("================================================================================");
console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("All AppCounter schema unit checks passed successfully!");
  process.exit(0);
}
