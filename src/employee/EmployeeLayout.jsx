import API_URL from "../config/api";
import NexoraLogo from "../assets/NexoraLogo.png";
import { useEffect, useState, useRef } from "react";
import TimeLog from "./TimeLog";
import MyAttendance from "./MyAttendance";
import MyTasks from "./MyTasks";
import MyTickets from "./MyTickets";
import EmployeeDashboard from "./EmployeeDashboard";
import BottomDock from "../components/layout/BottomDock";
import {
  Bell,
  BriefcaseBusiness,
  Calendar,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  Clock,
  Clock3,
  Headphones,
  LayoutDashboard,
  ListTodo,
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
  TrendingUp,
} from "lucide-react";

const employeeMenu = [
  {
    id: "dashboard",
    label: "My Day",
    description: "Daily work overview & active timer",
    icon: LayoutDashboard,
  },
  {
    id: "tasks",
    label: "My Tasks",
    description: "Assigned project tasks & backlog",
    icon: ListTodo,
  },
  {
    id: "tickets",
    label: "My Tickets",
    description: "Client support & helpdesk issues",
    icon: Headphones,
  },
  {
    id: "attendance",
    label: "Attendance",
    description: "Daily punch logs, leaves & shifts",
    icon: CalendarDays,
  },
  {
    id: "time-log",
    label: "Time Log",
    description: "Work activity logs & duration",
    icon: Clock3,
  },
];

const workspaceOptions = [
  { id: "daily", label: "Daily Operations" },
  { id: "tasks", label: "Tasks & Milestones" },
  { id: "support", label: "Support Desk" },
  { id: "attendance", label: "Shifts & Attendance" },
];

export default function EmployeeLayout({ onLogout }) {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [teamspaceOpen, setTeamspaceOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState("Daily Operations");
  const [moduleSearch, setModuleSearch] = useState("");
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [ziaOpen, setZiaOpen] = useState(false);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const [employee, setEmployee] = useState(null);

  const profileRef = useRef(null);
  const quickActionRef = useRef(null);
  const ziaRef = useRef(null);
  const remindersRef = useRef(null);
  const notifRef = useRef(null);
  const teamspaceRef = useRef(null);

  const getAuthToken = () => {
    return (
      localStorage.getItem("client-connect-token") ||
      sessionStorage.getItem("client-connect-token") ||
      ""
    );
  };

  useEffect(() => {
    const loadEmployee = async () => {
      try {
        const response = await fetch(`${API_URL}/api/employee/me`, {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });

        const result = await response.json();

        if (result.success) {
          setEmployee(result.data);
        }
      } catch (error) {
        console.error("Employee profile fetch error:", error);
      }
    };

    loadEmployee();
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
        setProfileOpen(false);
      }
      if (quickActionRef.current && !quickActionRef.current.contains(event.target)) {
        setQuickActionOpen(false);
      }
      if (ziaRef.current && !ziaRef.current.contains(event.target)) {
        setZiaOpen(false);
      }
      if (remindersRef.current && !remindersRef.current.contains(event.target)) {
        setRemindersOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
      if (teamspaceRef.current && !teamspaceRef.current.contains(event.target)) {
        setTeamspaceOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeMenuData =
    employeeMenu.find((item) => item.id === activeMenu) ||
    employeeMenu[0];

  const openMenu = (menuId) => {
    setActiveMenu(menuId);
    setSidebarOpen(false);
    setProfileOpen(false);
  };

  const filteredMenuItems = employeeMenu.filter((item) =>
    item.label.toLowerCase().includes(moduleSearch.toLowerCase()) ||
    item.description.toLowerCase().includes(moduleSearch.toLowerCase())
  );

  const employeeInitials = (employee?.name || "Employee")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  const employeePins = [
    { id: "dashboard", label: "My Day" },
    { id: "tasks", label: "My Tasks" },
    { id: "tickets", label: "My Tickets" },
    { id: "attendance", label: "Attendance" },
    { id: "time-log", label: "Time Log" },
  ];

  const renderPage = () => {
    if (activeMenu === "dashboard") {
      return <EmployeeDashboard onNavigate={openMenu} />;
    }
    if (activeMenu === "tasks") {
      return <MyTasks />;
    }
    if (activeMenu === "tickets") {
      return <MyTickets />;
    }
    if (activeMenu === "attendance") {
      return <MyAttendance />;
    }
    if (activeMenu === "time-log") {
      return <TimeLog />;
    }
    return <EmployeeDashboard onNavigate={openMenu} />;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
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
                Nexora <span className="text-blue-400 font-medium">Work</span>
              </span>
            </div>
          ) : (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
              NX
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

        {/* Teamspace Selector */}
        {!sidebarCollapsed && (
          <div className="px-3 pt-3 pb-1" ref={teamspaceRef}>
            <button
              type="button"
              onClick={() => setTeamspaceOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-lg border border-[#1E293B] bg-[#131F37] px-2.5 py-1.5 text-xs text-slate-200 hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-600 text-[10px] font-bold text-white">
                  EW
                </span>
                <span className="truncate font-semibold">{selectedWorkspace}</span>
              </div>
              <ChevronDown size={13} className="text-slate-400 shrink-0" />
            </button>

            {teamspaceOpen && (
              <div className="mt-1 rounded-xl border border-[#1E293B] bg-[#0E1A30] p-1 shadow-xl z-50">
                {workspaceOptions.map((ws) => (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => {
                      setSelectedWorkspace(ws.label);
                      setTeamspaceOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                      selectedWorkspace === ws.label
                        ? "bg-blue-600 text-white font-bold"
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

        {/* Instant Module Search */}
        {!sidebarCollapsed && (
          <div className="px-3 py-2">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={moduleSearch}
                onChange={(e) => setModuleSearch(e.target.value)}
                placeholder="Search modules..."
                className="h-7 w-full rounded-md border border-[#1E293B] bg-[#131F37] pl-8 pr-6 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-hidden"
              />
              {moduleSearch && (
                <button
                  type="button"
                  onClick={() => setModuleSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Top Zoho Shortcuts Strip */}
        <div className="flex items-center justify-around border-b border-[#1E293B] px-2 py-1.5 text-slate-400">
          <button
            type="button"
            onClick={() => openMenu("dashboard")}
            title="My Day"
            className={`flex h-7 w-7 items-center justify-center rounded hover:bg-[#1E293B] hover:text-white transition ${
              activeMenu === "dashboard" ? "bg-blue-600/30 text-blue-400" : ""
            }`}
          >
            <LayoutDashboard size={14} />
          </button>
          <button
            type="button"
            onClick={() => openMenu("tasks")}
            title="Tasks"
            className={`flex h-7 w-7 items-center justify-center rounded hover:bg-[#1E293B] hover:text-white transition ${
              activeMenu === "tasks" ? "bg-blue-600/30 text-blue-400" : ""
            }`}
          >
            <ListTodo size={14} />
          </button>
          <button
            type="button"
            onClick={() => openMenu("tickets")}
            title="Tickets"
            className={`flex h-7 w-7 items-center justify-center rounded hover:bg-[#1E293B] hover:text-white transition ${
              activeMenu === "tickets" ? "bg-blue-600/30 text-blue-400" : ""
            }`}
          >
            <Headphones size={14} />
          </button>
          <button
            type="button"
            onClick={() => openMenu("attendance")}
            title="Attendance"
            className={`flex h-7 w-7 items-center justify-center rounded hover:bg-[#1E293B] hover:text-white transition ${
              activeMenu === "attendance" ? "bg-blue-600/30 text-blue-400" : ""
            }`}
          >
            <CalendarDays size={14} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const active = activeMenu === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openMenu(item.id)}
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
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex w-full items-center gap-2.5 rounded-lg p-1.5 hover:bg-[#131F37] transition text-left"
            >
              <div className="relative">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1B59F8] font-bold text-xs text-white shadow-xs">
                  {employeeInitials}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0B1528]" />
              </div>

              {!sidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-white">
                    {employee?.name || "Staff Member"}
                  </p>
                  <p className="truncate text-[10px] text-slate-400">
                    {employee?.designation || "Employee"}
                  </p>
                </div>
              )}
            </button>

            {profileOpen && (
              <div className="absolute bottom-12 left-0 w-56 rounded-xl border border-[#1E293B] bg-[#0E1A30] p-1.5 shadow-2xl z-50 text-xs">
                <div className="border-b border-[#1E293B] px-2.5 py-2">
                  <p className="font-bold text-white truncate">{employee?.name || "Staff"}</p>
                  <p className="text-[10px] text-slate-400 truncate">{employee?.email || "employee@crm.com"}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="rounded bg-blue-500/20 px-1.5 py-0.2 text-[9px] font-semibold text-blue-300">
                      Active Shift
                    </span>
                    <span className="text-[9px] text-emerald-400 font-medium">● Online</span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      openMenu("dashboard");
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-slate-300 hover:bg-[#131F37] hover:text-white"
                  >
                    <UserRound size={13} />
                    <span>My Day & Profile</span>
                  </button>
                </div>

                <div className="border-t border-[#1E293B] pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
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
        }`}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-3 sm:px-5 backdrop-blur-sm">
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
                {activeMenuData.label}
              </h1>
              <p className="text-[10px] text-slate-400 hidden sm:block truncate">
                {activeMenuData.description}
              </p>
            </div>
          </div>

          {/* Center: Zoho Omni-Search Records Bar */}
          <div className="hidden sm:flex flex-1 max-w-md mx-4 items-center justify-center">
            <div className="relative w-full">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search tasks, tickets, time logs..."
                className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/90 pl-8 pr-12 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden transition shadow-2xs"
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1 py-0.5 text-[9px] font-semibold text-slate-400">
                Ctrl K
              </kbd>
            </div>
          </div>

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
                      Quick Operations
                    </p>
                  </div>
                  <div className="py-1 space-y-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setQuickActionOpen(false);
                        openMenu("time-log");
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <Clock3 size={13} className="text-blue-600" />
                      <span>Log Work Hours</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickActionOpen(false);
                        openMenu("tasks");
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <ListTodo size={13} className="text-violet-600" />
                      <span>View Assigned Tasks</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickActionOpen(false);
                        openMenu("attendance");
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <CalendarDays size={13} className="text-emerald-600" />
                      <span>Check Today's Punch</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Zia AI Assistant */}
            <div className="relative" ref={ziaRef}>
              <button
                type="button"
                onClick={() => setZiaOpen((prev) => !prev)}
                title="Zia AI Employee Assistant"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50/50 text-indigo-600 hover:bg-indigo-100/70 transition shadow-2xs"
              >
                <Sparkles size={15} className="animate-pulse" />
              </button>

              {ziaOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-92 rounded-2xl border border-indigo-100 bg-white shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden text-xs">
                  <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 px-4 py-3 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-white">
                          <Sparkles size={14} />
                        </div>
                        <div>
                          <h4 className="font-bold flex items-center gap-1.5">
                            <span>Zia Work Intelligence</span>
                            <span className="text-[9px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.2 rounded font-semibold">Active</span>
                          </h4>
                          <p className="text-[10px] text-indigo-200">Daily productivity summary</p>
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

                  <div className="p-3 space-y-2.5 max-h-72 overflow-y-auto">
                    <div className="rounded-xl border border-blue-200/80 bg-blue-50/60 p-2.5">
                      <div className="flex items-start gap-2">
                        <TrendingUp size={14} className="text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-blue-900">Today's Focus</p>
                          <p className="text-blue-700 text-[11px] mt-0.5">
                            You have tasks scheduled for delivery this week. Keep your active work timer running during billable development.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setZiaOpen(false);
                              openMenu("tasks");
                            }}
                            className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-blue-900 hover:underline"
                          >
                            Open My Tasks <ArrowRight size={10} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-2.5">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-emerald-900">Attendance Verification</p>
                          <p className="text-emerald-700 text-[11px] mt-0.5">
                            Don't forget to record shift activity and logout before concluding the workday.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Calendar Navigation */}
            <button
              type="button"
              onClick={() => openMenu("attendance")}
              title="Attendance Calendar"
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
                    <span className="font-bold text-slate-900">Shift Reminders</span>
                    <span className="text-[10px] text-slate-400">Zoho Alert</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <p className="font-semibold text-slate-800">Timesheet Submission</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Ensure task work hours are logged before 7:00 PM.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen((prev) => !prev)}
                title="Notifications"
                className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              >
                <Bell size={15} />
                <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose-500 px-0.5 text-[8px] font-bold text-white ring-2 ring-white">
                  1
                </span>
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50 text-xs">
                  <div className="border-b border-slate-100 px-2 py-1.5 flex items-center justify-between">
                    <span className="font-bold text-slate-900 uppercase tracking-wide">Notifications</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 font-semibold">1 New</span>
                  </div>
                  <div className="py-2 px-1">
                    <div className="p-2 rounded-lg bg-slate-50">
                      <p className="font-semibold text-slate-800">Daily Standup Verified</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Your morning shift punch has been verified by HR.</p>
                      <span className="text-[9px] text-slate-400 mt-1 block">Today, 9:30 AM</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 6. User Avatar Header Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => openMenu("dashboard")}
                title="Profile & My Day"
                className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-100 transition"
              >
                <div className="relative">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B59F8] font-bold text-xs text-white shadow-xs">
                    {employeeInitials}
                  </div>
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-900 leading-tight">
                    {employee?.name || "Staff"}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 leading-tight capitalize">
                    {employee?.designation || "Employee"}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content View with bottom dock clearance */}
        <main className="flex-1 pt-4 pb-10 p-4 sm:p-5 md:p-6 overflow-y-auto">
          <div className="mx-auto max-w-[1600px] w-full">
            {renderPage()}
          </div>
        </main>

        {/* Zoho Bottom Quick Dock */}
        <BottomDock
          sidebarCollapsed={sidebarCollapsed}
          onNavigate={openMenu}
          pins={employeePins}
          appName="Nexora Employee Workspace"
          reminderCount={1}
          reminders={[
            {
              title: "Timesheet Logging",
              message: "Remember to log your billable task duration before end of shift.",
              date: "Today, 6:30 PM",
            },
          ]}
        />
      </div>
    </div>
  );
}
