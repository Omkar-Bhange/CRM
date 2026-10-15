"use strict";

const fs = require("fs");

function findRoutes(file, prefix) {
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");
  const routes = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const m = l.match(/router\.(get|post|put|patch|delete)\(\s*["']([^"']+)["']/);
    if (m) {
      if (!prefix || m[2].includes(prefix) || m[2] === "/" || m[2].startsWith("/me") || m[2].startsWith("/profile") || m[2].startsWith("/punch")) {
        routes.push({ line: i + 1, method: m[1].toUpperCase(), path: m[2] });
      }
    }
  }
  return routes;
}

console.log("admin.js employee routes:", findRoutes("backend/admin.js", "employee"));
console.log("employee.js top routes:", findRoutes("backend/employee.js").slice(0, 15));
console.log("attendance.js top routes:", findRoutes("backend/attendance.js").slice(0, 15));

