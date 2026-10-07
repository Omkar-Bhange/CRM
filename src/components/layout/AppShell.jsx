import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";
import BottomDock from "./BottomDock";
import GlobalSearchModal from "../crm/GlobalSearchModal";

const SIDEBAR_COLLAPSED_KEY = "crm_sidebar_collapsed";

export default function AppShell({
  activeMenu,
  onSelectMenu,
  pageTitle,
  breadcrumbs = [],
  user,
  onLogout,
  onQuickAdd,
  onOpenSettings,
  badgeCounts = {},
  notifications = [],
  onApproveAttendance,
  onRejectAttendance,
  attendanceApprovalActionId,
  clients = [],
  children,
}) {
  // Sidebar collapsed state from localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Toggle sidebar collapse
  const handleToggleCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Keyboard shortcut Ctrl+K to open search, Ctrl+B to toggle sidebar
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        handleToggleCollapse();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex">
      {/* Sidebar */}
      <Sidebar
        activeMenu={activeMenu}
        onSelectMenu={(menuId) => {
          onSelectMenu(menuId);
          setMobileSidebarOpen(false);
        }}
        user={user}
        onLogout={onLogout}
        badgeCounts={badgeCounts}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ml-0 ${
          sidebarCollapsed ? "md:ml-[68px]" : "md:ml-[240px]"
        }`}
      >
        {/* Top Header */}
        <TopHeader
          pageTitle={pageTitle}
          breadcrumbs={breadcrumbs}
          user={user}
          onLogout={onLogout}
          onOpenSearch={() => setSearchModalOpen(true)}
          onQuickAdd={onQuickAdd}
          onOpenSettings={onOpenSettings}
          notifications={notifications}
          onApproveAttendance={onApproveAttendance}
          onRejectAttendance={onRejectAttendance}
          attendanceApprovalActionId={attendanceApprovalActionId}
          sidebarCollapsed={sidebarCollapsed}
          onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
          onNavigate={onSelectMenu}
        />

        {/* Page Content View with bottom dock clearance */}
        <main className="flex-1 p-4 sm:p-5 md:p-6 pb-12 overflow-y-auto">
          <div className="mx-auto max-w-[1600px] w-full">{children}</div>
        </main>

        {/* Zoho Bottom Quick Dock */}
        <BottomDock
          sidebarCollapsed={sidebarCollapsed}
          onNavigate={onSelectMenu}
          reminderCount={notifications.length > 0 ? notifications.length : 0}
          reminders={[
            {
              title: "Daily Attendance Punch Verification",
              message: "Verify employee biometric logs and field visit requests.",
              date: "Today, 6:00 PM",
            },
            {
              title: "AMC Renewal Notifications",
              message: "Contracts pending renewal reminder dispatch.",
              date: "This Week",
            },
          ]}
        />
      </div>

      {/* Omni-Search Modal */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onNavigate={(module, id) => {
          onSelectMenu(module);
        }}
        clients={clients}
      />
    </div>
  );
}
