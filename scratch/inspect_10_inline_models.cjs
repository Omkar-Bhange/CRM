const fs = require("fs");

const inlineTargets = [
  { name: "Client", file: "backend/admin.js", line: 1828 },
  { name: "ProductSale", file: "backend/admin.js", line: 2740 },
  { name: "ProductSalePayment", file: "backend/admin.js", line: 3005 },
  { name: "AmcContract", file: "backend/admin.js", line: 4080 },
  { name: "AmcInvoice", file: "backend/admin.js", line: 4511 },
  { name: "IdempotencyLog", file: "backend/admin.js", line: 4576 },
  { name: "AmcPayment", file: "backend/admin.js", line: 4786 },
  { name: "ClientAmcRequest", file: "backend/admin.js", line: 4985 },
  { name: "Employee", file: "backend/employee.js", line: 331 },
  { name: "User", file: "backend/auth.js", line: 120 }
];

inlineTargets.forEach(target => {
  const content = fs.readFileSync(target.file, "utf8");
  const lines = content.split("\n");
  // Let's inspect 50 lines before the registration to find the schema and collection option
  const start = Math.max(0, target.line - 150);
  const chunk = lines.slice(start, target.line + 5).join("\n");
  const collMatch = chunk.match(/collection:\s*["']([^"']+)["']/);
  const coll = collMatch ? collMatch[1] : (target.name.toLowerCase() + "s");
  console.log(`Model: ${target.name.padEnd(20)} | File: ${target.file}:${target.line} | Collection: "${coll}"`);
});

