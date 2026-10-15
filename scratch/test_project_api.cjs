const http = require("http");
const path = require("path");
const mongoose = require(path.join(__dirname, "../backend/node_modules/mongoose"));
const jwt = require(path.join(__dirname, "../backend/node_modules/jsonwebtoken"));
require(path.join(__dirname, "../backend/node_modules/dotenv")).config({
  path: path.join(__dirname, "../backend/.env"),
});

const JWT_SECRET = process.env.JWT_SECRET || "ClientConnectTrack@2026SuperSecret";
const dbUri = process.env.MONGO_URI || "mongodb://localhost:27017/ClientConnectTrack";

function httpRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let parsed = null;
        try {
          parsed = JSON.parse(text);
        } catch (e) {
          parsed = text;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });
    req.on("error", reject);
    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  console.log("=== TESTING PROJECT API VIA HTTP ===");
  await mongoose.connect(dbUri);
  const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({}, { strict: false }), "users");
  const adminUser = await User.findOne({ role: { $in: ["admin", "superadmin"] } }).lean();
  if (!adminUser) throw new Error("Admin user not found in database.");

  const token = jwt.sign(
    { userId: adminUser._id, role: "admin", email: adminUser.email },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  // 1. GET /api/admin/projects
  console.log("Test 1: GET /api/admin/projects");
  const resList = await httpRequest({
    hostname: "localhost",
    port: 5000,
    path: "/api/admin/projects",
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  console.log("Projects List HTTP Status:", resList.status);
  console.log("Projects List count:", resList.body.count);
  console.log("Projects List stats:", resList.body.stats);

  if (resList.status !== 200 || !resList.body.success) {
    throw new Error(`GET /api/admin/projects failed with status ${resList.status}`);
  }
  console.log("PASS: GET /api/admin/projects succeeded!");

  // 2. GET /api/admin/project/:id
  if (resList.body.data && resList.body.data.length > 0) {
    const targetProject = resList.body.data[0];
    console.log(`\nTest 2: GET /api/admin/project/${targetProject._id} (${targetProject.projectName})`);
    const resDetail = await httpRequest({
      hostname: "localhost",
      port: 5000,
      path: `/api/admin/project/${targetProject._id}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Project Details HTTP Status:", resDetail.status);
    console.log("Project Details Code:", resDetail.body.data?.projectCode);
    console.log("Project Details Name:", resDetail.body.data?.projectName);

    if (resDetail.status !== 200 || !resDetail.body.success) {
      throw new Error(`GET /api/admin/project/:id failed with status ${resDetail.status}`);
    }
    console.log("PASS: GET /api/admin/project/:id succeeded!");
  }

  await mongoose.disconnect();
  console.log("\n=== ALL PROJECT HTTP API TESTS PASSED ===");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
