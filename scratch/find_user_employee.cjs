const fs = require("fs");
const path = require("path");

function walk(dir) {
  let files = [];
  for (const f of fs.readdirSync(dir)) {
    if (f === "node_modules") continue;
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) files = files.concat(walk(p));
    else if (f.endsWith(".js") || f.endsWith(".cjs")) files.push(p);
  }
  return files;
}

const files = walk("backend");
for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  if (content.match(/mongoose\.model\(\s*["']User["']/)) {
    console.log("User model defined in:", file);
  }
  if (content.match(/mongoose\.model\(\s*["']Employee["']/)) {
    console.log("Employee model defined in:", file);
  }
}

