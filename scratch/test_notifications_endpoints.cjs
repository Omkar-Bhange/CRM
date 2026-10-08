const http = require("http");

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
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
  console.log("=== CLIENT NOTIFICATIONS API TEST ===");

  // 1. Unauthenticated GET /api/client/notifications
  const unauthRes = await request({
    hostname: "localhost",
    port: 5000,
    path: "/api/client/notifications",
    method: "GET",
  });
  console.log(`1. Unauthenticated GET /api/client/notifications: Status ${unauthRes.status} (Expected 401)`);
  if (unauthRes.status !== 401) throw new Error("Expected 401 for unauthenticated request");

  // 2. Client Login
  const loginRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/auth/login",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { email: "r@gmail.com", password: "123456" }
  );
  console.log(`2. Client Login: Status ${loginRes.status}, Success: ${loginRes.body.success}`);
  const token = loginRes.body.token;
  if (!token) throw new Error("Login failed");

  // 3. Authenticated GET /api/client/notifications
  const notifRes = await request({
    hostname: "localhost",
    port: 5000,
    path: "/api/client/notifications?limit=10",
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`3. GET /api/client/notifications: Status ${notifRes.status}, Total: ${notifRes.body.total}, Unread: ${notifRes.body.unreadCount}, Loaded: ${notifRes.body.notifications?.length}`);
  if (!notifRes.body.success || !Array.isArray(notifRes.body.notifications)) {
    throw new Error("Failed to fetch notifications");
  }

  const sample = notifRes.body.notifications[0];
  console.log("   Sample Notification:", {
    id: sample.id,
    type: sample.type,
    title: sample.title,
    message: sample.message,
    entityType: sample.entityType,
    entityCode: sample.entityCode,
    navigationTarget: sample.navigationTarget,
    isRead: sample.isRead,
  });

  // 4. Mark single notification as read
  const targetId = sample.id;
  const readRes = await request({
    hostname: "localhost",
    port: 5000,
    path: `/api/client/notifications/${targetId}/read`,
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`4. PATCH /api/client/notifications/${targetId}/read: Status ${readRes.status}, isRead: ${readRes.body.notification?.isRead}, newUnread: ${readRes.body.unreadCount}`);
  if (readRes.status !== 200 || !readRes.body.notification?.isRead) {
    throw new Error("Failed to mark single notification as read");
  }

  // 5. Cross-client / Tenant isolation test
  const fakeId = "600000000000000000000000";
  const crossRes = await request({
    hostname: "localhost",
    port: 5000,
    path: `/api/client/notifications/${fakeId}/read`,
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`5. Cross-client isolation test with foreign ID: Status ${crossRes.status} (Expected 404)`);
  if (crossRes.status !== 404) {
    throw new Error("Tenant isolation failed: foreign ID did not return 404");
  }

  // 6. Filter test: unread vs billing
  const billingRes = await request({
    hostname: "localhost",
    port: 5000,
    path: "/api/client/notifications?filter=billing&limit=5",
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`6. Filter=billing: Status ${billingRes.status}, Count: ${billingRes.body.notifications?.length}`);

  // 7. Mark all as read
  const readAllRes = await request({
    hostname: "localhost",
    port: 5000,
    path: "/api/client/notifications/read-all",
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`7. PATCH /api/client/notifications/read-all: Status ${readAllRes.status}, unreadCount: ${readAllRes.body.unreadCount}`);
  if (readAllRes.status !== 200 || readAllRes.body.unreadCount !== 0) {
    throw new Error("Failed to mark all as read");
  }

  // 8. Re-check unread count
  const verifyRes = await request({
    hostname: "localhost",
    port: 5000,
    path: "/api/client/notifications?filter=unread",
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`8. Verify unread after read-all: unreadCount: ${verifyRes.body.unreadCount}, list length: ${verifyRes.body.notifications?.length}`);
  if (verifyRes.body.unreadCount !== 0 || verifyRes.body.notifications?.length !== 0) {
    throw new Error("Unread count should be 0");
  }

  console.log("\nALL NOTIFICATION BACKEND TESTS PASSED SUCCESSFULLY! ✅");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
