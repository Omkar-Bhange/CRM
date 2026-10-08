import NexoraLogo from "../assets/NexoraLogo.png";
import { useEffect, useMemo, useState, useRef } from "react";
import ClientProfile from "./ClientProfile";
import ClientDocuments from "./ClientDocuments";
import ClientTickets from "./ClientTickets";
import ClientBilling from "./ClientBilling";
import MyProducts from "./MyProducts";
import ClientDashboard from "./ClientDashboard";
import ZiaAssistantDrawer from "./ZiaAssistantDrawer";
import NotificationHistoryDrawer, {
  formatRelativeTime,
  getNotificationMeta,
} from "./NotificationHistoryDrawer";
import API_URL from "../config/api";
import {
  Bell,
  Boxes,
  Building2,
  Calendar,
  ChevronDown,
  CircleHelp,
  Clock,
  CreditCard,
  FileText,
  Headphones,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Sparkles,
  UserRound,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronsLeft,
  ChevronsRight,
  ShieldCheck,
  ReceiptIndianRupee,
} from "lucide-react";

const clientMenuItems = [
  {
    id: "overview",
    label: "Overview",
    description: "Account summary & active support",
    icon: LayoutDashboard,
  },
  {
    id: "products",
    label: "My Products",
    description: "Purchased software & licences",
    icon: Boxes,
  },
  {
    id: "billing",
    label: "Bills & AMC",
    description: "Invoices, renewals & payments",
    icon: CreditCard,
  },
  {
    id: "tickets",
    label: "Support Tickets",
    description: "Raise issues & track resolution",
    icon: Headphones,
  },
  {
    id: "documents",
    label: "Documents",
    description: "Agreements, proposals & files",
    icon: FileText,
  },
  {
    id: "profile",
    label: "Company Profile",
    description: "Business & contact information",
    icon: UserRound,
  },
];

const portalWorkspaceOptions = [
  { id: "overview", label: "Account Overview" },
  { id: "products", label: "Products & Licences" },
  { id: "billing", label: "Bills & AMC Renewals" },
  { id: "tickets", label: "Support Desk" },
  { id: "documents", label: "Documents & Files" },
];

function getInitials(name) {
  if (!name) return "CP";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export default function ClientLayout({ onLogout }) {
  const [activeMenu, setActiveMenu] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [portalSelectOpen, setPortalSelectOpen] = useState(false);
  const [selectedPortalView, setSelectedPortalView] = useState("Account Overview");
  const [portalSearch, setPortalSearch] = useState("");
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [ziaOpen, setZiaOpen] = useState(false);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationHistoryOpen, setNotificationHistoryOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifFilter, setNotifFilter] = useState("all");
  const [notifPage, setNotifPage] = useState(1);
  const [notifHasMore, setNotifHasMore] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [client, setClient] = useState(null);

  const profileRef = useRef(null);
  const quickActionRef = useRef(null);
  const ziaRef = useRef(null);
  const remindersRef = useRef(null);
  const notifRef = useRef(null);
  const portalSelectRef = useRef(null);

  const getAuthToken = () => {
    return (
      localStorage.getItem("client-connect-token") ||
      sessionStorage.getItem("client-connect-token") ||
      ""
    );
  };

  const fetchNotifications = async (page = 1, filter = "all", append = false) => {
    try {
      setNotifLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (filter && filter !== "all") {
        params.append("filter", filter);
      }
      const response = await fetch(`${API_URL}/api/client/notifications?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        if (append) {
          setNotifications((prev) => [...prev, ...(data.notifications || [])]);
        } else {
          setNotifications(data.notifications || []);
        }
        setUnreadCount(typeof data.unreadCount === "number" ? data.unreadCount : 0);
        setNotifHasMore(data.page < data.totalPages);
        setNotifPage(data.page || 1);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setNotifLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/client/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => ((n.id === id || n._id === id) ? { ...n, isRead: true, readAt: new Date() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch(`${API_URL}/api/client/notifications/read-all`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date() })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleFilterChange = (newFilter) => {
    setNotifFilter(newFilter);
    fetchNotifications(1, newFilter, false);
  };

  const handleLoadMoreNotifications = () => {
    if (!notifLoading && notifHasMore) {
      fetchNotifications(notifPage + 1, notifFilter, true);
    }
  };

  useEffect(() => {
    const loadClient = async () => {
      try {
        const response = await fetch(`${API_URL}/api/client/me`, {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });

        const result = await response.json();

        if (result.success) {
          setClient(result.data);
        }
      } catch (error) {
        console.error("Client profile load error:", error);
      }
    };

    loadClient();
    fetchNotifications(1, "all", false);
  }, []);

  // Keyboard shortcut Ctrl+B to toggle sidebar
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setSidebarCollapsed((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
      if (quickActionRef.current && !quickActionRef.current.contains(event.target)) {
        setQuickActionOpen(false);
      }
      if (remindersRef.current && !remindersRef.current.contains(event.target)) {
        setRemindersOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
      if (portalSelectRef.current && !portalSelectRef.current.contains(event.target)) {
        setPortalSelectOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = client?.contactPerson || client?.companyName || "Client";
  const displayCompany = client?.companyName || "Client Account";
  const initials = getInitials(client?.contactPerson || client?.companyName);

  const activeItem = useMemo(
    () =>
      clientMenuItems.find((item) => item.id === activeMenu) ||
      clientMenuItems[0],
    [activeMenu]
  );

  const [navParams, setNavParams] = useState({});

  const handleNavigation = (menuId, params = {}) => {
    setActiveMenu(menuId);
    setNavParams(params || {});
    setSidebarOpen(false);
    setProfileMenuOpen(false);
    setNotificationOpen(false);
  };

  const filteredMenuItems = clientMenuItems.filter((item) =>
    item.label.toLowerCase().includes(portalSearch.toLowerCase()) ||
    item.description.toLowerCase().includes(portalSearch.toLowerCase())
  );

  const renderPage = () => {
    if (activeMenu === "overview") {
      return <ClientDashboard onNavigate={handleNavigation} />;
    }
    if (activeMenu === "products") {
      return <MyProducts onNavigate={handleNavigation} />;
    }
    if (activeMenu === "billing") {
      return <ClientBilling />;
    }
    if (activeMenu === "tickets") {
      return <ClientTickets client={client} navParams={navParams} onNavigate={handleNavigation} />;
    }
    if (activeMenu === "documents") {
      return <ClientDocuments onNavigate={handleNavigation} />;
    }
    if (activeMenu === "profile") {
      return <ClientProfile client={client} />;
    }
    return <ClientDashboard onNavigate={handleNavigation} />;
  };

  return (
    <div className="h-screen bg-[#f8fafc] text-slate-900 flex overflow-hidden">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Zoho Dark Navy Enterprise Sidebar (#0B1528) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#1E293B] bg-[#0B1528] text-slate-300 transition-all duration-200 ${
          sidebarCollapsed ? "w-[68px]" : "w-[240px]"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Brand Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#1E293B] px-3">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <img
                src={NexoraLogo}
                alt="Nexora CRM"
                className="h-7 w-auto object-contain brightness-110"
              />
              <span className="text-xs font-bold text-white tracking-wide">
                Nexora <span className="text-cyan-400 font-medium">Portal</span>
              </span>
            </div>
          ) : (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600 text-white font-bold text-xs">
              CP
            </div>
          )}

          <button
            type="button"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            title={sidebarCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-[#1E293B] hover:text-white transition"
          >
            {sidebarCollapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
          </button>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-[#1E293B] hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Teamspace / Portal Switcher */}
        {!sidebarCollapsed && (
          <div className="px-3 pt-3 pb-1" ref={portalSelectRef}>
            <button
              type="button"
              onClick={() => setPortalSelectOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-lg border border-[#1E293B] bg-[#131F37] px-2.5 py-1.5 text-xs text-slate-200 hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#1B59F8] text-[10px] font-bold text-white">
                  CP
                </span>
                <span className="truncate font-semibold">{displayCompany}</span>
              </div>
              <ChevronDown size={13} className="text-slate-400 shrink-0" />
            </button>

            {portalSelectOpen && (
              <div className="mt-1 rounded-xl border border-[#1E293B] bg-[#0E1A30] p-1 shadow-xl z-50">
                {portalWorkspaceOptions.map((ws) => (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => {
                      setSelectedPortalView(ws.label);
                      handleNavigation(ws.id);
                      setPortalSelectOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                      activeMenu === ws.id
                        ? "bg-[#1B59F8] text-white font-semibold"
                        : "text-slate-300 hover:bg-[#1E293B]"
                    }`}
                  >
                    <span>{ws.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Instant Portal Search */}
        {!sidebarCollapsed && (
          <div className="px-3 py-2">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={portalSearch}
                onChange={(e) => setPortalSearch(e.target.value)}
                placeholder="Search portal sections..."
                className="h-7 w-full rounded-md border border-[#1E293B] bg-[#131F37] pl-8 pr-6 text-xs text-white placeholder:text-slate-500 focus:border-[#1B59F8] focus:outline-hidden"
              />
              {portalSearch && (
                <button
                  type="button"
                  onClick={() => setPortalSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const active = activeMenu === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigation(item.id)}
                title={sidebarCollapsed ? item.label : undefined}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${
                  active
                    ? "bg-[#1B59F8] text-white font-semibold shadow-xs"
                    : "text-slate-300 hover:bg-[#131F37] hover:text-white"
                }`}
              >
                <Icon
                  size={16}
                  strokeWidth={active ? 2.2 : 1.8}
                  className={active ? "text-white" : "text-slate-400"}
                />

                {!sidebarCollapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="text-xs truncate">{item.label}</p>
                    <p
                      className={`text-[9px] truncate ${
                        active ? "text-blue-100" : "text-slate-500"
                      }`}
                    >
                      {item.description}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Profile Footer with Live Green Online Badge */}
        <div className="border-t border-[#1E293B] p-2" ref={profileRef}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              className="flex w-full items-center gap-2.5 rounded-lg p-1.5 hover:bg-[#131F37] transition text-left"
            >
              <div className="relative">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1B59F8] font-bold text-xs text-white shadow-xs">
                  {initials}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0B1528]" />
              </div>

              {!sidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-white">
                    {displayName}
                  </p>
                  <p className="truncate text-[10px] text-slate-400">
                    {displayCompany}
                  </p>
                </div>
              )}
            </button>

            {profileMenuOpen && (
              <div className="absolute bottom-12 left-0 w-60 rounded-xl border border-[#1E293B] bg-[#0E1A30] p-1.5 shadow-2xl z-50 text-xs">
                <div className="border-b border-[#1E293B] px-2.5 py-2">
                  <p className="font-bold text-white truncate">{displayName}</p>
                  <p className="text-[10px] text-slate-400 truncate">{displayCompany}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="rounded bg-[#1B59F8]/20 px-1.5 py-0.2 text-[9px] font-semibold text-blue-300">
                      Client Portal
                    </span>
                    <span className="text-[9px] text-emerald-400 font-medium">● Online</span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleNavigation("profile");
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-slate-300 hover:bg-[#131F37] hover:text-white"
                  >
                    <UserRound size={13} />
                    <span>Company Profile</span>
                  </button>
                </div>

                <div className="border-t border-[#1E293B] pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onLogout();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-rose-400 hover:bg-rose-500/10"
                  >
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ml-0 ${
          sidebarCollapsed ? "lg:ml-[68px]" : "lg:ml-[240px]"
        } h-screen overflow-hidden`}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-3 sm:px-5 backdrop-blur-sm">
          {/* Left: Module Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition shrink-0"
            >
              <Menu size={18} />
            </button>

            <div>
              <h1 className="text-sm font-bold text-slate-900 tracking-tight truncate">
                {activeItem.label}
              </h1>
              <p className="text-[10px] text-slate-400 hidden sm:block truncate">
                {activeItem.description}
              </p>
            </div>
          </div>

          {/* Center spacer / layout balance */}
          <div className="hidden sm:block flex-1 max-w-xs" />

          {/* Right Action Cluster */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* 1. Zoho Royal Blue Quick Action [+] */}
            <div className="relative" ref={quickActionRef}>
              <button
                type="button"
                onClick={() => setQuickActionOpen((prev) => !prev)}
                title="Quick Actions"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1B59F8] text-white shadow-xs hover:bg-[#1548D1] transition active:scale-95"
              >
                <Plus size={16} strokeWidth={2.5} />
              </button>

              {quickActionOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1.5 border-b border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                      Client Actions
                    </p>
                  </div>
                  <div className="py-1 space-y-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setQuickActionOpen(false);
                        handleNavigation("tickets");
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <Headphones size={13} className="text-blue-600" />
                      <span>Raise Support Ticket</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickActionOpen(false);
                        handleNavigation("billing");
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <CreditCard size={13} className="text-violet-600" />
                      <span>View Bills & AMC</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickActionOpen(false);
                        handleNavigation("documents");
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <FileText size={13} className="text-emerald-600" />
                      <span>View Agreements</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Real Zia AI CRM Assistant */}
            <button
              type="button"
              onClick={() => setZiaOpen(true)}
              title="Open Zia AI Assistant"
              className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50/80 text-[#1B59F8] hover:bg-blue-100 transition shadow-2xs group"
            >
              <Sparkles size={15} className="group-hover:rotate-12 transition-transform" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </button>

            {/* 3. Calendar & Renewals Navigation */}
            <button
              type="button"
              onClick={() => handleNavigation("billing")}
              title="Bills & Renewals"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            >
              <Calendar size={15} />
            </button>

            {/* 4. Reminders / Clock Popover */}
            <div className="relative" ref={remindersRef}>
              <button
                type="button"
                onClick={() => setRemindersOpen((prev) => !prev)}
                title="Reminders"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              >
                <Clock size={15} />
              </button>

              {remindersOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2.5 shadow-xl z-50 text-xs">
                  <div className="border-b border-slate-100 pb-1.5 mb-1.5 flex items-center justify-between">
                    <span className="font-bold text-slate-900">Account Reminders</span>
                    <span className="text-[10px] text-slate-400 font-medium">Account Notice</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <p className="font-semibold text-slate-800">AMC Maintenance Cycle</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {client?.nextRenewal
                          ? `Upcoming renewal scheduled on ${client.nextRenewal}.`
                          : "Scheduled maintenance is active on all products."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotificationOpen((prev) => !prev)}
                title="Notifications"
                className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              >
                <Bell size={15} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-50 duration-150">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-88 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="border-b border-slate-100 px-2.5 py-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 uppercase tracking-wide">
                        Account Updates
                      </span>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[9px] font-bold text-white">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllAsRead}
                        className="text-[11px] font-semibold text-[#1B59F8] hover:underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* List of latest 5 */}
                  <div className="py-1 divide-y divide-slate-100 max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-slate-400">
                        <p className="text-xs">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((n) => {
                        const meta = getNotificationMeta(n.type);
                        const Icon = meta.icon;
                        return (
                          <div
                            key={n.id || n._id}
                            onClick={() => {
                              if (!n.isRead) handleMarkAsRead(n.id || n._id);
                              if (n.navigationTarget) handleNavigation(n.navigationTarget);
                              setNotificationOpen(false);
                            }}
                            className={`p-2.5 rounded-lg transition cursor-pointer flex items-start gap-2.5 ${
                              n.isRead
                                ? "hover:bg-slate-50"
                                : "bg-blue-50/50 hover:bg-blue-50/80"
                            }`}
                          >
                            <div
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${meta.color}`}
                            >
                              <Icon size={13} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <p
                                  className={`text-xs truncate ${
                                    n.isRead
                                      ? "font-semibold text-slate-800"
                                      : "font-bold text-slate-900"
                                  }`}
                                >
                                  {n.title}
                                </p>
                                <span className="text-[10px] text-slate-400 shrink-0">
                                  {formatRelativeTime(n.createdAt)}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                                {n.message}
                              </p>
                            </div>
                            {!n.isRead && (
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#1B59F8] shrink-0" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer CTA */}
                  <div className="border-t border-slate-100 pt-1.5 mt-1 px-1">
                    <button
                      type="button"
                      onClick={() => {
                        setNotificationOpen(false);
                        setNotificationHistoryOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-[#1B59F8] transition cursor-pointer"
                    >
                      <span>View All Notifications</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Client Company Avatar */}
            <div className="relative">
              <button
                type="button"
                onClick={() => handleNavigation("profile")}
                title="Company Profile"
                className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-100 transition"
              >
                <div className="relative">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B59F8] font-bold text-xs text-white shadow-xs">
                    {initials}
                  </div>
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-900 leading-tight">
                    {displayName}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 leading-tight truncate max-w-[120px]">
                    {displayCompany}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content View */}
        <main className="flex-1 p-4 sm:p-5 md:p-6 pb-8 overflow-y-auto">
          <div className="mx-auto max-w-[1600px] w-full">
            {renderPage()}
          </div>
        </main>

        {/* Real Zia AI Assistant Drawer */}
        <ZiaAssistantDrawer
          isOpen={ziaOpen}
          onClose={() => setZiaOpen(false)}
          client={client}
          onNavigate={handleNavigation}
        />

        {/* Real Client Notification History Drawer */}
        <NotificationHistoryDrawer
          isOpen={notificationHistoryOpen}
          onClose={() => setNotificationHistoryOpen(false)}
          notifications={notifications}
          unreadCount={unreadCount}
          filter={notifFilter}
          onFilterChange={handleFilterChange}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onNavigate={handleNavigation}
          onLoadMore={handleLoadMoreNotifications}
          hasMore={notifHasMore}
          loading={notifLoading}
        />
      </div>
    </div>
  );
}
