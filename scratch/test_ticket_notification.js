const BASE_URL = "http://localhost:5000";

async function run() {
  console.log("=== TESTING TICKET NOTIFICATION EVENT GENERATION ===");

  // 1. Login
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "r@gmail.com", password: "123456", role: "client" }),
  });
  const { token, user } = await loginRes.json();
  console.log("1. Authenticated Client:", user?.companyName);

  // 2. Fetch current unread count
  const initialRes = await fetch(`${BASE_URL}/api/client/notifications?filter=unread`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const initialData = await initialRes.json();
  const initialUnread = initialData.unreadCount;
  console.log("2. Initial unread count:", initialUnread);

  // 3. Create a ticket
  const ticketRes = await fetch(`${BASE_URL}/api/client/tickets`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: "Automated Notification Test Ticket",
      description: "Testing real-time notification generation upon raising support ticket.",
      productName: "ERP S/W",
      category: "Other",
      priority: "Medium",
    }),
  });
  const ticketData = await ticketRes.json();
  console.log("3. Created Ticket Status:", ticketRes.status, "Ticket Code:", ticketData.data?.ticketCode);
  if (!ticketData.success) throw new Error("Ticket creation failed");

  // 4. Fetch notifications immediately
  const afterRes = await fetch(`${BASE_URL}/api/client/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const afterData = await afterRes.json();
  console.log("4. New unread count:", afterData.unreadCount, "Total:", afterData.total);

  const newest = afterData.notifications[0];
  console.log("   Newest notification:", {
    title: newest.title,
    message: newest.message,
    type: newest.type,
    isRead: newest.isRead,
    entityCode: newest.entityCode,
  });

  if (newest.type !== "TICKET_CREATED" || newest.isRead !== false) {
    throw new Error("Expected newest notification to be unread TICKET_CREATED");
  }

  // 5. Mark it as read
  const markRes = await fetch(`${BASE_URL}/api/client/notifications/${newest.id}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  const markData = await markRes.json();
  console.log("5. Marked as read status:", markRes.status, "New unread count:", markData.unreadCount);

  if (markData.unreadCount !== afterData.unreadCount - 1) {
    throw new Error("Unread count did not decrement properly");
  }

  console.log("\nTICKET NOTIFICATION FLOW VERIFIED 100% SUCCESSFULLY! ✅");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
