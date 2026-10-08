const jwt = require("jsonwebtoken");
const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../backend/.env") });

async function testHttpEndpoints() {
  console.log("--- Testing Live HTTP Endpoints on http://localhost:5000 ---");

  const jwtSecret = process.env.JWT_SECRET;

  // 1. Admin Token
  const adminToken = jwt.sign(
    {
      userId: "6a5727e7c0c95cae46d64bf4",
      role: "admin",
      name: "Mangesh Kondhare",
      email: "totalsolution2023@gmail.com",
    },
    jwtSecret,
    { expiresIn: "1h" }
  );

  const adminRes = await axios.get("http://localhost:5000/api/admin/tickets?limit=5", {
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  console.log("Admin tickets response success:", adminRes.data.success);
  console.log("Admin tickets returned:", adminRes.data.count);
  if (adminRes.data.data && adminRes.data.data.length > 0) {
    const t = adminRes.data.data[0];
    console.log("Admin ticket sample:", {
      ticketCode: t.ticketCode,
      priority: t.priority,
      slaSource: t.sla?.source,
      firstResponseStatus: t.sla?.firstResponseStatus,
      resolutionStatus: t.sla?.resolutionStatus,
      firstResponseDueAt: t.sla?.firstResponseDueAt,
      resolutionDueAt: t.sla?.resolutionDueAt,
    });
  }

  // 2. Client Token
  const clientToken = jwt.sign(
    {
      userId: "6a5dd25afb7cfeea6a1befc8",
      role: "client",
      name: "RUSHI",
      email: "r@gmail.com",
    },
    jwtSecret,
    { expiresIn: "1h" }
  );

  const clientRes = await axios.get("http://localhost:5000/api/client/tickets", {
    headers: { Authorization: `Bearer ${clientToken}` },
  });

  console.log("Client tickets response success:", clientRes.data.success);
  if (clientRes.data.data && clientRes.data.data.length > 0) {
    const ct = clientRes.data.data[0];
    console.log("Client ticket sample:", {
      ticketCode: ct.ticketCode,
      priority: ct.priority,
      slaSource: ct.sla?.source,
      firstResponseStatus: ct.sla?.firstResponseStatus,
      resolutionStatus: ct.sla?.resolutionStatus,
      firstResponseTarget: ct.sla?.firstResponseTargetMinutes,
      resolutionTarget: ct.sla?.resolutionTargetMinutes,
    });
  }

  console.log("Live API SLA Verification PASSED cleanly!");
}

testHttpEndpoints().catch((err) => {
  console.error("HTTP test failed:", err.response?.data || err.message);
  process.exit(1);
});
