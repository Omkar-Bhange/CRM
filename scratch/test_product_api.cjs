const http = require("http");
const path = require("path");
const mongoose = require(path.join(__dirname, "../backend/node_modules/mongoose"));
const jwt = require(path.join(__dirname, "../backend/node_modules/jsonwebtoken"));
require(path.join(__dirname, "../backend/node_modules/dotenv")).config({
  path: path.join(__dirname, "../backend/.env"),
});

const JWT_SECRET = process.env.JWT_SECRET || "ClientConnectTrack@2026SuperSecret";
const dbUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/ClientConnectTrack";

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
  console.log("=== TESTING PRODUCT API VIA HTTP ===");
  await mongoose.connect(dbUri);
  const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({}, { strict: false }), "users");
  const adminUser = await User.findOne({ role: { $in: ["admin", "superadmin"] } }).lean();
  if (!adminUser) throw new Error("Admin user not found in database.");

  const token = jwt.sign(
    { userId: adminUser._id, role: "admin", email: adminUser.email },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  const res = await httpRequest({
    hostname: "localhost",
    port: 5000,
    path: "/api/admin/products",
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  console.log("HTTP Status:", res.status);
  console.log("Response Body stats:", res.body.stats);
  console.log("Response Body count:", res.body.count);

  if (res.status === 200 && res.body.success === true) {
    console.log("PASS: Product API endpoint functioning correctly with centralized model!");
  } else {
    throw new Error(`Unexpected response: status ${res.status}`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
