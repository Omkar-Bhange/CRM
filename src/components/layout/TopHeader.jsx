import { useState, useRef, useEffect } from "react";
import {
  Search,
  Plus,
  Bell,
  Calendar,
  Settings,
  User,
  LogOut,
  ChevronRight,
  ClipboardList,
  Users,
  BriefcaseBusiness,
  Headphones,
  ListTodo,
  CreditCard,
  WalletCards,
  ReceiptIndianRupee,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  Menu,
  Sparkles,
  Clock,
  HelpCircle,
  TrendingUp,
  Bot,
  ArrowRight,
  Check,
} from "lucide-react";

export default function TopHeader({
  pageTitle = "Dashboard",
  breadcrumbs = [],
  user,
  onLogout,
  onOpenSearch,
  onQuickAdd,
  onOpenSettings,
  notifications = [],
  sidebarCollapsed = false,
  onToggleMobileSidebar,
  onNavigate,
}) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [ziaOpen, setZiaOpen] = useState(false);
  const [remindersOpen, setRemindersOpen] = useState(false);

  const profileRef = useRef(null);
  const quickAddRef = useRef(null);
  const notifRef = useRef(null);
  const ziaRef = useRef(null);
  const remindersRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
      if (quickAddRef.current && !quickAddRef.current.contains(event.target)) {
        setQuickAddOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (ziaRef.current && !ziaRef.current.contains(event.target)) {
        setZiaOpen(false);
      }
      if (remindersRef.current && !remindersRef.current.contains(event.target)) {
        setRemindersOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userInitials = (user?.name || user?.fullName || "AD")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join("");

  const quickAddItems = [
    {
      id: "quick-client",
      label: "New Client Master",
      icon: Users,
      target: "clients",
      color: "text-blue-600 bg-blue-50",
    },
    {
      id: "quick-lead",
      label: "New Lead / Requirement",
      icon: ClipboardList,
      target: "requirements",
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      id: "quick-task",
      label: "New Task",
      icon: ListTodo,
      target: "tasks",
      color: "text-amber-600 bg-amber-50",
    },
    {
      id: "quick-project",
      label: "New Project",
      icon: BriefcaseBusiness,
      target: "projects",
      color: "text-indigo-600 bg-indigo-50",
    },
    {
      id: "quick-sale",
      label: "New Product Sale",
      icon: ReceiptIndianRupee,
      target: "product-sales",
      color: "text-cyan-600 bg-cyan-50",
    },
    {
      id: "quick-amc",
      label: "New AMC Contract",
      icon: CreditCard,
      target: "billing",
      color: "text-violet-600 bg-violet-50",
    },
    {
      id: "quick-payment",
      label: "Record Payment",
      icon: WalletCards,
      target: "payments-collections",
      color: "text-teal-600 bg-teal-50",
    },
    {
      id: "quick-ticket",
      label: "New Support Ticket",
      icon: Headphones,
      target: "tickets",
      color: "text-rose-600 bg-rose-50",
    },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-3 sm:px-5 backdrop-blur-sm">
      {/* Left: Title & Breadcrumbs in Zoho CRM Style */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label="Open navigation menu"
          className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition shrink-0"
        >
          <Menu size={19} />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
          {breadcrumbs.length > 0 ? (
            <>
              {breadcrumbs.map((crumb, idx) => (
                <span key={idx} className="flex items-center gap-1.5 text-slate-500">
                  {crumb.onClick ? (
                    <button
                      type="button"
                      onClick={crumb.onClick}
                      className="hover:text-slate-900 transition font-medium"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                  <ChevronRight size={12} className="text-slate-400" />
                </span>
              ))}
              <span className="font-bold text-slate-900 text-sm tracking-tight truncate">
                {pageTitle}
              </span>
            </>
          ) : (
            <h1 className="text-sm font-bold text-slate-900 tracking-tight truncate flex items-center gap-2">
              <span>{pageTitle}</span>
            </h1>
          )}
        </nav>
      </div>

      {/* Center: Zoho Omni-Search Records Bar */}
      <div className="hidden sm:flex flex-1 max-w-md mx-4 items-center justify-center">
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex h-8 w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50/90 px-3 text-xs text-slate-400 hover:border-slate-300 hover:bg-slate-100 transition shadow-xs"
        >
          <div className="flex items-center gap-2 truncate">
            <Search size={14} className="text-slate-400 shrink-0" />
            <span className="truncate">Search records, contacts, deals...</span>
          </div>
          <kbd className="hidden md:inline-flex items-center rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 shadow-2xs">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right: Zoho Action Cluster */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Mobile Search Button */}
        <button
          type="button"
          onClick={onOpenSearch}
          title="Search"
          className="sm:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <Search size={15} />
        </button>

        {/* 1. Zoho Royal Blue Quick Create [+] Button */}
        <div className="relative" ref={quickAddRef}>
          <button
            type="button"
            onClick={() => setQuickAddOpen((prev) => !prev)}
            title="Quick Create Record"
            aria-label="Quick Add"
            aria-expanded={quickAddOpen}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1B59F8] text-white shadow-xs hover:bg-[#1548D1] active:bg-[#0F3DB8] transition active:scale-95"
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>

          {quickAddOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2.5 py-1.5 border-b border-slate-100 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Quick Create
                </p>
                <span className="text-[10px] text-slate-400">Zoho CRM</span>
              </div>
              <div className="py-1 space-y-0.5">
                {quickAddItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setQuickAddOpen(false);
                        if (onQuickAdd) onQuickAdd(item.target);
                        else if (onNavigate) onNavigate(item.target);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition"
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-md ${item.color}`}
                      >
                        <Icon size={14} />
                      </span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2. Zia AI Assistant Button */}
        <div className="relative" ref={ziaRef}>
          <button
            type="button"
            onClick={() => setZiaOpen((prev) => !prev)}
            title="Zia AI Assistant"
            aria-label="Zia AI Assistant"
            className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50/50 text-indigo-600 hover:bg-indigo-100/70 transition shadow-2xs"
          >
            <Sparkles size={15} className="animate-pulse" />
          </button>

          {ziaOpen && (
            <div className="absolute right-0 mt-2 w-84 sm:w-96 rounded-2xl border border-indigo-100 bg-white shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 px-4 py-3 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 backdrop-blur-xs text-white">
                      <Sparkles size={15} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold flex items-center gap-1.5">
                        <span>Zia AI Intelligence</span>
                        <span className="text-[10px] font-semibold bg-emerald-500/30 text-emerald-300 px-1.5 py-0.2 rounded">Live</span>
                      </h4>
                      <p className="text-[10px] text-indigo-200">SaaS CRM Predictive Analytics & Health</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setZiaOpen(false)}
                    className="text-indigo-200 hover:text-white"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              <div className="p-3 space-y-2.5 max-h-80 overflow-y-auto">
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-2.5 text-xs">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-900">Renewal Alert</p>
                      <p className="text-amber-700 text-[11px] mt-0.5">
                        Multiple client AMC contracts are reaching expiry within 30 days. Consider generating renewal invoices now.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setZiaOpen(false);
                          if (onNavigate) onNavigate("billing");
                        }}
                        className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 hover:underline"
                      >
                        Review AMC Contracts <ArrowRight size={11} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-blue-200/80 bg-blue-50/60 p-2.5 text-xs">
                  <div className="flex items-start gap-2">
                    <TrendingUp size={14} className="text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-900">Sales Pipeline Velocity</p>
                      <p className="text-blue-700 text-[11px] mt-0.5">
                        Leads converted this month have an average close cycle of 4.2 days. Fast follow-ups are increasing win rates by 28%.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setZiaOpen(false);
                          if (onNavigate) onNavigate("requirements");
                        }}
                        className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-blue-900 hover:underline"
                      >
                        View Active Leads <ArrowRight size={11} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs">
                  <p className="text-[11px] font-semibold text-slate-700 mb-1.5">Ask Zia AI:</p>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="e.g. Total collections this quarter?"
                      className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      className="h-7 px-2.5 rounded-md bg-indigo-600 text-white text-[11px] font-semibold hover:bg-indigo-700 shrink-0"
                    >
                      Ask
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Calendar & Schedule Button */}
        <button
          type="button"
          onClick={() => {
            if (onNavigate) onNavigate("tasks");
          }}
          title="Calendar & Tasks"
          aria-label="Calendar & Tasks"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
        >
          <Calendar size={15} />
        </button>

        {/* 4. Reminders / Clock Button */}
        <div className="relative" ref={remindersRef}>
          <button
            type="button"
            onClick={() => setRemindersOpen((prev) => !prev)}
            title="Reminders"
            aria-label="Reminders"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
          >
            <Clock size={15} />
          </button>

          {remindersOpen && (
            <div className="absolute right-0 mt-2 w-76 rounded-xl border border-slate-200 bg-white shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 p-2">
              <div className="flex items-center justify-between border-b border-slate-100 px-2 py-1.5">
                <span className="text-xs font-bold text-slate-900">CRM Reminders</span>
                <span className="text-[10px] text-slate-400">Zoho Task Alert</span>
              </div>
              <div className="py-2 px-1 text-xs text-slate-600 space-y-1.5">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="font-semibold text-slate-800">Daily Standup & Attendance</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Ensure all staff punches and shift logs are verified.</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="font-semibold text-slate-800">Pending Invoices Follow-up</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Follow up on unpaid client invoices due this week.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. Notification Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen((prev) => !prev)}
            title="Notifications"
            aria-label="Notifications"
            className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
          >
            <Bell size={15} />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                {notifications.length}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Notifications
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {notifications.length} Unread
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto p-2 divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500" />
                    No unread notifications
                  </div>
                ) : (
                  notifications.map((notif, i) => (
                    <div key={i} className="p-2.5 text-xs hover:bg-slate-50 rounded-lg">
                      <p className="font-semibold text-slate-800">{notif.title}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">{notif.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {notif.time || "Just now"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 6. Settings Gear Button */}
        <button
          type="button"
          onClick={() => {
            if (onOpenSettings) onOpenSettings();
          }}
          title="System Settings"
          aria-label="Settings"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
        >
          <Settings size={15} />
        </button>

        {/* 7. User Profile Avatar with Online Status Badge */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            aria-label="User menu"
            aria-expanded={profileMenuOpen}
            className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-100 transition"
          >
            <div className="relative">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B59F8] font-bold text-xs text-white shadow-xs">
                {userInitials}
              </div>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 leading-tight">
                {user?.name || user?.fullName || "Admin"}
              </span>
              <span className="text-[10px] font-medium text-slate-400 capitalize leading-tight">
                {user?.role || "Administrator"}
              </span>
            </div>
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="border-b border-slate-100 px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B59F8] text-white font-bold text-xs">
                    {userInitials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {user?.name || user?.fullName || "Administrator"}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {user?.email || "admin@totalsolution.com"}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="inline-block rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 capitalize">
                    {user?.role || "Admin"} Role
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Online
                  </span>
                </div>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    if (onOpenSettings) onOpenSettings();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  <Settings size={14} className="text-slate-400" />
                  <span>System Settings</span>
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onLogout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
