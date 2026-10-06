import { useState, useMemo } from "react";
import NexoraLogo from "../../assets/NexoraLogo.png";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  BriefcaseBusiness,
  ReceiptIndianRupee,
  CreditCard,
  WalletCards,
  Headphones,
  ListTodo,
  CalendarDays,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  X,
  Check,
  Search,
  Building2,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export const MENU_GROUPS = [
  {
    id: "main",
    label: "",
    items: [
      {
        id: "overview",
        label: "Home / Overview",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: "sales",
    label: "SALES & CLIENTS",
    items: [
      {
        id: "requirements",
        label: "Requirements (Leads)",
        icon: ClipboardList,
      },
      {
        id: "clients",
        label: "Clients",
        icon: Users,
      },
      {
        id: "projects",
        label: "Projects",
        icon: BriefcaseBusiness,
      },
    ],
  },
  {
    id: "billing",
    label: "FINANCE & BILLING",
    items: [
      {
        id: "product-sales",
        label: "Product Sales",
        icon: ReceiptIndianRupee,
      },
      {
        id: "billing",
        label: "AMC & Contracts",
        icon: CreditCard,
      },
      {
        id: "payments-collections",
        label: "Payments & Receipts",
        icon: WalletCards,
      },
    ],
  },
  {
    id: "activities",
    label: "ACTIVITIES & SUPPORT",
    items: [
      {
        id: "tasks",
        label: "Tasks & Activities",
        icon: ListTodo,
      },
      {
        id: "tickets",
        label: "Support Tickets",
        icon: Headphones,
      },
    ],
  },
  {
    id: "team",
    label: "TEAM & HR",
    items: [
      {
        id: "team",
        label: "Team Management",
        icon: Users,
      },
      {
        id: "attendance",
        label: "Attendance & Leaves",
        icon: CalendarDays,
      },
    ],
  },
  {
    id: "analytics",
    label: "ANALYTICS & REPORTS",
    items: [
      {
        id: "reports",
        label: "Reports Dashboard",
        icon: BarChart3,
      },
    ],
  },
  {
    id: "system",
    label: "SETTINGS",
    items: [
      {
        id: "settings",
        label: "System Settings",
        icon: Settings,
      },
    ],
  },
];

const EXPANDED_GROUPS_STORAGE_KEY = "crm_sidebar_groups";

export default function Sidebar({
  activeMenu,
  onSelectMenu,
  user,
  onLogout,
  badgeCounts = {},
  isCollapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile = null,
}) {
  const [expandedGroups, setExpandedGroups] = useState(() => {
    try {
      const saved = localStorage.getItem(EXPANDED_GROUPS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      sales: true,
      billing: true,
      activities: true,
      team: false,
      analytics: false,
      system: false,
    };
  });

  const [moduleSearch, setModuleSearch] = useState("");
  const [teamspaceMenuOpen, setTeamspaceMenuOpen] = useState(false);

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => {
      const updated = { ...prev, [groupId]: !prev[groupId] };
      try {
        localStorage.setItem(
          EXPANDED_GROUPS_STORAGE_KEY,
          JSON.stringify(updated)
        );
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const userInitials = (user?.name || user?.fullName || "AD")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join("");

  // Search filter for modules
  const filteredGroups = useMemo(() => {
    if (!moduleSearch.trim()) return MENU_GROUPS;
    const q = moduleSearch.toLowerCase();
    return MENU_GROUPS.map((group) => {
      const items = group.items.filter((it) =>
        it.label.toLowerCase().includes(q)
      );
      return { ...group, items };
    }).filter((group) => group.items.length > 0);
  }, [moduleSearch]);

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          aria-label="Close menu backdrop"
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 md:z-40 flex flex-col bg-[#0b132b] text-slate-300 transition-all duration-200 ease-in-out border-r border-slate-800/60 select-none ${
          mobileOpen
            ? "translate-x-0 shadow-2xl w-[260px]"
            : "-translate-x-full md:translate-x-0"
        } ${isCollapsed ? "md:w-[68px]" : "md:w-[240px]"}`}
        aria-label="Sidebar navigation"
      >
        {/* Brand & Collapse Header */}
        <div className="flex h-14 items-center justify-between px-3.5 border-b border-slate-800/80 bg-[#080e21]">
          <div
            className={`flex items-center gap-2.5 overflow-hidden transition-all duration-200 ${
              isCollapsed ? "md:justify-center md:w-full" : ""
            }`}
          >
            <img
              src={NexoraLogo}
              alt="Nexora CRM"
              className="h-8 w-8 shrink-0 object-contain rounded-lg p-0.5 bg-slate-900 border border-slate-700/60 shadow-sm"
            />
            {(!isCollapsed || mobileOpen) && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold tracking-tight text-white truncate">
                    Nexora CRM
                  </span>
                  <ChevronDown size={12} className="text-slate-400" />
                </div>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-violet-400 truncate">
                  Enterprise Suite
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onCloseMobile}
              title="Close navigation"
              aria-label="Close navigation"
              className="flex md:hidden h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
            >
              <X size={17} />
            </button>

            {/* Desktop Collapse Button */}
            {!isCollapsed && (
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
                className="hidden md:flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
              >
                <PanelLeftClose size={16} />
              </button>
            )}
          </div>
        </div>

      {isCollapsed && (
        <div className="flex justify-center py-2 border-b border-slate-800/40">
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
          >
            <PanelLeft size={16} />
          </button>
        </div>
      )}

      {/* Zoho CRM Teamspace & Quick Search Section */}
      {(!isCollapsed || mobileOpen) && (
        <div className="px-3 pt-2.5 pb-1 border-b border-slate-800/60">
          {/* Teamspace Selector */}
          <div className="relative mb-2">
            <button
              type="button"
              onClick={() => setTeamspaceMenuOpen(!teamspaceMenuOpen)}
              className="flex w-full items-center justify-between rounded-lg bg-slate-900/90 px-2.5 py-1.5 text-xs text-slate-200 border border-slate-800 hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-violet-600 text-[9px] font-bold text-white shadow-xs">
                  CT
                </span>
                <span className="truncate font-semibold text-[11px] text-white">
                  CRM Teamspace
                </span>
              </div>
              <ChevronDown size={12} className="text-slate-400 shrink-0" />
            </button>

            {teamspaceMenuOpen && (
              <div className="absolute left-0 right-0 top-9 z-50 rounded-lg border border-slate-700 bg-[#0d162d] p-1 shadow-2xl">
                <div className="px-2 py-1 text-[9px] uppercase font-bold text-slate-400">
                  Select Workspace
                </div>
                <button
                  type="button"
                  onClick={() => setTeamspaceMenuOpen(false)}
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-xs text-white bg-violet-600/30 font-medium"
                >
                  <span className="truncate">Default CRM Teamspace</span>
                  <Check size={12} className="text-violet-400 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => setTeamspaceMenuOpen(false)}
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
                >
                  <span className="truncate">Enterprise Sales & AMC</span>
                </button>
              </div>
            )}
          </div>

          {/* Module Search Input */}
          <div className="relative">
            <Search
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              value={moduleSearch}
              onChange={(e) => setModuleSearch(e.target.value)}
              placeholder="Search modules..."
              className="h-7 w-full rounded-md border border-slate-800 bg-slate-900/80 pl-7 pr-2 text-[11px] text-slate-200 placeholder:text-slate-500 outline-none focus:border-violet-500 transition"
            />
            {moduleSearch && (
              <button
                type="button"
                onClick={() => setModuleSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X size={11} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigation Links (Scrollable) */}
      <nav className="flex-1 overflow-y-auto px-2 py-2.5 space-y-2.5 custom-scrollbar">
        {filteredGroups.map((group) => {
          const isGroupExpanded = expandedGroups[group.id] !== false;
          const hasGroupLabel = Boolean(group.label);

          return (
            <div key={group.id} className="space-y-0.5">
              {!isCollapsed && hasGroupLabel && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="flex w-full items-center justify-between px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase text-slate-400/80 hover:text-slate-200 transition"
                >
                  <span>{group.label}</span>
                  {isGroupExpanded ? (
                    <ChevronDown size={12} className="text-slate-500" />
                  ) : (
                    <ChevronRight size={12} className="text-slate-500" />
                  )}
                </button>
              )}

              {isCollapsed && hasGroupLabel && (
                <div className="my-1 border-t border-slate-800/80" />
              )}

              {(!hasGroupLabel || isGroupExpanded || isCollapsed) && (
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeMenu === item.id;
                    const badge = badgeCounts[item.id];

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelectMenu(item.id);
                          if (onCloseMobile) onCloseMobile();
                        }}
                        title={isCollapsed ? item.label : undefined}
                        className={`group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors duration-150 ${
                          isActive
                            ? "bg-violet-600 text-white shadow-sm font-semibold"
                            : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                        } ${isCollapsed ? "justify-center px-0" : ""}`}
                      >
                        <Icon
                          size={17}
                          className={`shrink-0 transition-transform duration-150 ${
                            isActive
                              ? "text-white"
                              : "text-slate-400 group-hover:text-slate-200 group-hover:scale-105"
                          }`}
                        />

                        {!isCollapsed && (
                          <span className="truncate flex-1 text-left">
                            {item.label}
                          </span>
                        )}

                        {!isCollapsed && typeof badge === "number" && badge > 0 && (
                          <span
                            className={`ml-auto flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                              isActive
                                ? "bg-white text-violet-700"
                                : "bg-slate-800 text-slate-300 group-hover:bg-slate-700"
                            }`}
                          >
                            {badge > 99 ? "99+" : badge}
                          </span>
                        )}

                        {isCollapsed && isActive && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-violet-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Footer Profile & Logout */}
      <div className="border-t border-slate-800/80 bg-[#080e21] p-2.5">
        <div
          className={`flex items-center gap-2.5 rounded-lg p-1.5 ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600/30 text-violet-300 ring-1 ring-violet-500/40 font-semibold text-xs">
            {userInitials}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#080e21]" />
          </div>

          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">
                {user?.name || user?.fullName || "Admin User"}
              </p>
              <p className="truncate text-[10px] font-medium text-slate-400 capitalize">
                {user?.role || "Administrator"}
              </p>
            </div>
          )}

          {!isCollapsed && (
            <button
              type="button"
              onClick={onLogout}
              title="Sign Out of CRM"
              aria-label="Sign Out"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>
    </aside>
    </>
  );
}

