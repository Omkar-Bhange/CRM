import { useState } from "react";
import TimeLog from "./TimeLog";
import MyAttendance from "./MyAttendance";
import MyTasks from "./MyTasks";
import MyTickets from "./MyTickets";
import {
    Bell,
    BriefcaseBusiness,
    CalendarDays,
    ChevronDown,
    CircleHelp,
    Clock3,
    Headphones,
    LayoutDashboard,
    ListTodo,
    LogOut,
    Menu,
    Search,
    UserRound,
    X,
} from "lucide-react";

import EmployeeDashboard from "./EmployeeDashboard";

const employeeMenu = [
    {
        id: "dashboard",
        label: "My Day",
        description: "Daily work overview",
        icon: LayoutDashboard,
    },
    {
        id: "tasks",
        label: "My Tasks",
        description: "Assigned work",
        icon: ListTodo,
    },
    {
        id: "tickets",
        label: "My Tickets",
        description: "Support issues",
        icon: Headphones,
    },
    {
        id: "attendance",
        label: "Attendance",
        description: "Login, leave and hours",
        icon: CalendarDays,
    },
    {
        id: "time-log",
        label: "Time Log",
        description: "Work activity",
        icon: Clock3,
    },
];

function EmptyEmployeePage({
    title,
    description,
    icon: Icon,
}) {
    return (
        <div className="flex min-h-[560px] items-center justify-center">
            <div className="max-w-md text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
                    <Icon size={26} />
                </div>

                <h2 className="mt-5 text-xl font-semibold tracking-[-0.02em] text-slate-950">
                    {title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                    {description}
                </p>
            </div>
        </div>
    );
}

export default function EmployeeLayout({ onLogout }) {
    const [activeMenu, setActiveMenu] = useState("dashboard");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    const activeMenuData =
        employeeMenu.find((item) => item.id === activeMenu) ||
        employeeMenu[0];

    const openMenu = (menuId) => {
        setActiveMenu(menuId);
        setSidebarOpen(false);
        setProfileOpen(false);
    };

    const renderPage = () => {
        if (activeMenu === "dashboard") {
            return <EmployeeDashboard />;
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

return <EmployeeDashboard />;
    };

    return (
        <div className="min-h-screen bg-[#f5f7fb] text-slate-800">
            {sidebarOpen && (
                <button
                    type="button"
                    aria-label="Close navigation"
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-[244px] flex-col border-r border-slate-800 bg-[#111827] transition-transform duration-300 lg:translate-x-0 ${
                    sidebarOpen
                        ? "translate-x-0"
                        : "-translate-x-full"
                }`}
            >
                <div className="flex h-[72px] items-center justify-between border-b border-white/10 px-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 text-xs font-bold text-white shadow-lg shadow-violet-950/25">
                            CC
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-white">
                                Client Connect
                            </p>

                            <p className="mt-0.5 text-[9px] uppercase tracking-[0.14em] text-cyan-300">
                                Employee Workspace
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setSidebarOpen(false)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
                    >
                        <X size={17} />
                    </button>
                </div>

                <div className="px-3 py-4">
                    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] p-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
                            <BriefcaseBusiness size={17} />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-white">
                                Total Solution
                            </p>

                            <p className="mt-1 truncate text-[9px] text-slate-400">
                                Main workspace
                            </p>
                        </div>

                        <ChevronDown
                            size={14}
                            className="text-slate-500"
                        />
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto px-3 pb-5">
                    <p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Workspace
                    </p>

                    <div className="space-y-1">
                        {employeeMenu.map((item) => {
                            const Icon = item.icon;
                            const active = activeMenu === item.id;

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => openMenu(item.id)}
                                    className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                                        active
                                            ? "bg-white text-slate-950 shadow-sm"
                                            : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                                    }`}
                                >
                                    <Icon
                                        size={18}
                                        strokeWidth={active ? 2.2 : 1.8}
                                        className={
                                            active
                                                ? "text-violet-600"
                                                : "text-slate-500 group-hover:text-cyan-300"
                                        }
                                    />

                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium">
                                            {item.label}
                                        </p>

                                        <p
                                            className={`mt-0.5 truncate text-[9px] ${
                                                active
                                                    ? "text-slate-400"
                                                    : "text-slate-600"
                                            }`}
                                        >
                                            {item.description}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <p className="mb-2 mt-7 px-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Support
                    </p>

                    <button
                        type="button"
                        className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
                    >
                        <CircleHelp
                            size={18}
                            className="text-slate-500 group-hover:text-cyan-300"
                        />

                        Help Center
                    </button>
                </nav>

                <div className="border-t border-white/10 p-3">
                    <div className="flex items-center gap-3 rounded-xl px-2 py-2">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-[10px] font-bold text-white">
                            AP
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-white">
                                Akash Pawar
                            </p>

                            <p className="mt-1 truncate text-[9px] text-slate-400">
                                ERP Support Engineer
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onLogout}
                            title="Logout"
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            <div className="min-h-screen lg:pl-[244px]">
                <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xl sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(true)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 lg:hidden"
                        >
                            <Menu size={18} />
                        </button>

                        <div className="min-w-0">
                            <h1 className="truncate text-sm font-semibold text-slate-950">
                                {activeMenuData.label}
                            </h1>

                            <p className="mt-1 hidden truncate text-[10px] text-slate-500 sm:block">
                                {activeMenuData.description}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative hidden md:block">
                            <Search
                                size={15}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="text"
                                placeholder="Search tasks, tickets..."
                                className="h-10 w-64 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                            />
                        </div>

                        <button
                            type="button"
                            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600"
                        >
                            <Bell size={16} />

                            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-rose-500" />
                        </button>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() =>
                                    setProfileOpen((current) => !current)
                                }
                                className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-[9px] font-bold text-violet-700">
                                    AP
                                </div>

                                <span className="hidden sm:block">
                                    Akash
                                </span>

                                <ChevronDown
                                    size={14}
                                    className={`text-slate-400 transition ${
                                        profileOpen ? "rotate-180" : ""
                                    }`}
                                />
                            </button>

                            {profileOpen && (
                                <>
                                    <button
                                        type="button"
                                        aria-label="Close profile menu"
                                        onClick={() =>
                                            setProfileOpen(false)
                                        }
                                        className="fixed inset-0 z-40"
                                    />

                                    <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.16)]">
                                        <div className="border-b border-slate-100 px-4 py-4">
                                            <p className="text-xs font-semibold text-slate-900">
                                                Akash Pawar
                                            </p>

                                            <p className="mt-1 text-[10px] text-slate-500">
                                                ERP Support Engineer
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                                        >
                                            <UserRound size={15} />
                                            My Profile
                                        </button>

                                        <button
                                            type="button"
                                            onClick={onLogout}
                                            className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-3 text-left text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                                        >
                                            <LogOut size={15} />
                                            Sign Out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <main className="min-h-[calc(100vh-72px)] p-4 sm:p-6">
                    <div className="mx-auto max-w-[1600px]">
                        {renderPage()}
                    </div>
                </main>
            </div>
        </div>
    );
}