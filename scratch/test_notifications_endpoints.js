const BASE_URL = "http://localhost:5000";

async function run() {
  console.log("=== CLIENT NOTIFICATIONS API TEST ===");

  // 1. Unauthenticated GET /api/client/notifications
  const unauthRes = await fetch(`${BASE_URL}/api/client/notifications`);
  console.log(`1. Unauthenticated GET /api/client/notifications: Status ${unauthRes.status} (Expected 401)`);
  if (unauthRes.status !== 401) throw new Error("Expected 401 for unauthenticated request");

  // 2. Client Login
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "r@gmail.com", password: "123456", role: "client" }),
  });
  const loginBody = await loginRes.json();
  console.log(`2. Client Login: Status ${loginRes.status}, Company: ${loginBody.user?.companyName}`);
  const token = loginBody.token;
  if (!token) throw new Error("Login failed");

  // 3. Authenticated GET /api/client/notifications
  const notifRes = await fetch(`${BASE_URL}/api/client/notifications?limit=10`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const notifBody = await notifRes.json();
  console.log(`3. GET /api/client/notifications: Status ${notifRes.status}, Total: ${notifBody.total}, Unread: ${notifBody.unreadCount}, Loaded: ${notifBody.notifications?.length}`);
  if (!notifBody.success || !Array.isArray(notifBody.notifications)) {
    throw new Error("Failed to fetch notifications");
  }

  const sample = notifBody.notifications[0];
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
  const readRes = await fetch(`${BASE_URL}/api/client/notifications/${targetId}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  const readBody = await readRes.json();
  console.log(`4. PATCH /api/client/notifications/${targetId}/read: Status ${readRes.status}, isRead: ${readBody.notification?.isRead}, newUnread: ${readBody.unreadCount}`);
  if (readRes.status !== 200 || !readBody.notification?.isRead) {
    throw new Error("Failed to mark single notification as read");
  }

  // 5. Cross-client / Tenant isolation test
  const fakeId = "600000000000000000000000";
  const crossRes = await fetch(`${BASE_URL}/api/client/notifications/${fakeId}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`5. Cross-client isolation test with foreign ID: Status ${crossRes.status} (Expected 404)`);
  if (crossRes.status !== 404) {
    throw new Error("Tenant isolation failed: foreign ID did not return 404");
  }

  // 6. Filter test: unread vs billing
  const billingRes = await fetch(`${BASE_URL}/api/client/notifications?filter=billing&limit=5`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const billingBody = await billingRes.json();
  console.log(`6. Filter=billing: Status ${billingRes.status}, Count: ${billingBody.notifications?.length}`);

  // 7. Mark all as read
  const readAllRes = await fetch(`${BASE_URL}/api/client/notifications/read-all`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  const readAllBody = await readAllRes.json();
  console.log(`7. PATCH /api/client/notifications/read-all: Status ${readAllRes.status}, unreadCount: ${readAllBody.unreadCount}`);
  if (readAllRes.status !== 200 || readAllBody.unreadCount !== 0) {
    throw new Error("Failed to mark all as read");
  }

  // 8. Re-check unread count
  const verifyRes = await fetch(`${BASE_URL}/api/client/notifications?filter=unread`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const verifyBody = await verifyRes.json();
  console.log(`8. Verify unread after read-all: unreadCount: ${verifyBody.unreadCount}, list length: ${verifyBody.notifications?.length}`);
  if (verifyBody.unreadCount !== 0 || verifyBody.notifications?.length !== 0) {
    throw new Error("Unread count should be 0");
  }

  console.log("\nALL NOTIFICATION BACKEND TESTS PASSED SUCCESSFULLY! ✅");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

