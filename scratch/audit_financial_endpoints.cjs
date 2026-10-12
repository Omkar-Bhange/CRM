const fs = require("fs");
const path = require("path");

function scanRoutes(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const regex = /router\.(get|post|put|patch|delete)\s*\(\s*(\[[^\]]+\]|['"`][^'"`]+['"`])/g;
  let match;
  const routes = [];
  while ((match = regex.exec(content)) !== null) {
    const line = content.substring(0, match.index).split("\n").length;
    routes.push({
      line,
      method: match[1].toUpperCase(),
      route: match[2].replace(/\s+/g, " "),
    });
  }
  return routes;
}

fs.readdirSync("backend").forEach((file) => {
  if (file.endsWith(".js")) {
    const routes = scanRoutes(path.join("backend", file));
    const finRoutes = routes.filter((r) => {
      const rLower = r.route.toLowerCase();
      return (
        rLower.includes("payment") ||
        rLower.includes("invoice") ||
        rLower.includes("receipt") ||
        rLower.includes("sale") ||
        rLower.includes("amc") ||
        rLower.includes("billing") ||
        rLower.includes("financial")
      );
    });
    if (finRoutes.length > 0) {
      console.log(`\n=== Financial Routes in ${file} (${finRoutes.length}) ===`);
      finRoutes.forEach((r) => {
        console.log(`  L${r.line}: ${r.method} ${r.route}`);
      });
    }
  }
});
