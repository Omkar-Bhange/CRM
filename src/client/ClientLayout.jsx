import NexoraLogo from "../assets/NexoraLogo.png";
import { useEffect, useMemo, useState } from "react";
import ClientProfile from "./ClientProfile";
import ClientDocuments from "./ClientDocuments";
import ClientTickets from "./ClientTickets";
import ClientBilling from "./ClientBilling";
import MyProducts from "./MyProducts";
import {
    Bell,
    Boxes,
    Building2,
    ChevronDown,
    CircleHelp,
    CreditCard,
    FileText,
    Headphones,
    LayoutDashboard,
    LogOut,
    Menu,
    Search,
    UserRound,
    X,
} from "lucide-react";

import ClientDashboard from "./ClientDashboard";

const clientMenuItems = [
    {
        id: "overview",
        label: "Overview",
        description: "Account and support summary",
        icon: LayoutDashboard,
    },
    {
        id: "products",
        label: "My Products",
        description: "Purchased software",
        icon: Boxes,
    },
    {
        id: "billing",
        label: "Bills & AMC",
        description: "Invoices and annual charges",
        icon: CreditCard,
    },
    {
        id: "tickets",
        label: "Support Tickets",
        description: "Raise and track issues",
        icon: Headphones,
        badge: 1,
    },
    {
        id: "documents",
        label: "Documents",
        description: "Agreements and files",
        icon: FileText,
    },
    {
        id: "profile",
        label: "Company Profile",
        description: "Account information",
        icon: UserRound,
    },
];

const pageInformation = {
    overview: {
        title: "Overview",
        description: "Your software, AMC and support activity",
    },
    products: {
        title: "My Products",
        description: "View purchased software and licence details",
    },
    billing: {
        title: "Bills & AMC",
        description: "Manage invoices, payments and annual renewals",
    },
    tickets: {
        title: "Support Tickets",
        description: "Raise issues and track support progress",
    },
    documents: {
        title: "Documents",
        description: "Access agreements, invoices and installation files",
    },
    profile: {
        title: "Company Profile",
        description: "View company and contact information",
    },
};

import API_URL from "../config/api";

function getInitials(name) {
    if (!name) return "CC";

    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
        .toUpperCase();
}

function ComingSoonPage({ title, description, icon: Icon }) {
    return (
        <section className="flex min-h-[520px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <div className="max-w-md text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                    <Icon size={25} />
                </div>

                <h2 className="mt-5 text-xl font-semibold tracking-[-0.02em] text-slate-950">
                    {title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                    {description}
                </p>

                <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                    This page will be connected in the next development step.
                </div>
            </div>
        </section>
    );
}

export default function ClientLayout({ onLogout }) {
    const [activeMenu, setActiveMenu] = useState("overview");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [client, setClient] = useState(null);

    const getAuthToken = () => {
        return (
            localStorage.getItem("client-connect-token") ||
            sessionStorage.getItem("client-connect-token") ||
            ""
        );
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
                console.error("Client profile:", error);
            }
        };

        loadClient();
    }, []);

    const displayName = client?.contactPerson || client?.companyName || "Client";
    const displayCompany = client?.companyName || "Client Workspace";
    const initials = getInitials(client?.contactPerson || client?.companyName);
    const clientSince = client?.createdAt
        ? new Date(client.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
        : "";

    const activeItem = useMemo(
        () =>
            clientMenuItems.find((item) => item.id === activeMenu) ||
            clientMenuItems[0],
        [activeMenu]
    );

    const currentPage =
        pageInformation[activeMenu] || pageInformation.overview;

    const handleNavigation = (menuId) => {
        setActiveMenu(menuId);
        setSidebarOpen(false);
        setProfileMenuOpen(false);
        setNotificationOpen(false);
    };

    const renderPage = () => {
        if (activeMenu === "overview") {
            return (
                <ClientDashboard
                    onNavigate={handleNavigation}
                />
            );
        }

        if (activeMenu === "products") {
            return (
                <MyProducts
                    onNavigate={handleNavigation}
                />
            );
        }

        if (activeMenu === "billing") {
            return <ClientBilling />;
        }

        if (activeMenu === "tickets") {
            return <ClientTickets client={client} />;
        }

        if (activeMenu === "documents") {
            return <ClientDocuments />;
        }

        if (activeMenu === "profile") {
            return <ClientProfile client={client} />;
        }

        return (
            <ComingSoonPage
                title={currentPage.title}
                description={currentPage.description}
                icon={activeItem.icon}
            />
        );
    };

    return (
        <div className="enterprise-shell min-h-screen bg-[#f4f6fa] text-slate-900">
            {sidebarOpen && (
                <button
                    type="button"
                    aria-label="Close sidebar"
                    onClick={() => setSidebarOpen(false)}
                    className="enterprise-backdrop fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
                />
            )}

            <aside
                className={`enterprise-sidebar fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-white/10 bg-[#0f172a] text-white transition-transform duration-300 lg:translate-x-0 ${sidebarOpen
                        ? "translate-x-0"
                        : "-translate-x-full"
                    }`}
            >
                {/* Client Portal Brand */}
                <div className="relative flex h-[92px] shrink-0 items-center border-b border-white/10 px-5">
                    <div className="flex w-full items-center justify-center overflow-hidden">
                        <img
                            src={NexoraLogo}
                            alt="Total Solution Nexora"
                            className="h-[72px] w-[225px] scale-[3.45] object-contain"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => setSidebarOpen(false)}
                        className="absolute right-3 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
                    >
                        <X size={19} />
                    </button>
                </div>

                <div className="px-4 pt-5">
                    <div className="rounded-xl border border-white/10 bg-white/[0.05] p-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-400/15 text-cyan-300">
                                <Building2 size={17} />
                            </div>

                            <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-white">
                                    {displayCompany}
                                </p>

                                <p className="mt-0.5 truncate text-[10px] text-slate-400">
                                    {clientSince ? `Client since ${clientSince}` : "Client account"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <nav className="mt-6 flex-1 overflow-y-auto px-3">
                    <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Client Workspace
                    </p>

                    <div className="space-y-1">
                        {clientMenuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeMenu === item.id;

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() =>
                                        handleNavigation(item.id)
                                    }
                                    aria-current={isActive ? "page" : undefined}
                                    className={`enterprise-sidebar-nav-item group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${isActive
                                            ? "bg-cyan-400/10 text-cyan-300"
                                            : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                                        }`}
                                >
                                    <Icon
                                        size={18}
                                        strokeWidth={
                                            isActive ? 2.2 : 1.8
                                        }
                                        className={
                                            isActive
                                                ? "text-cyan-300"
                                                : "text-slate-500 group-hover:text-cyan-300"
                                        }
                                    />

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-semibold">
                                            {item.label}
                                        </p>

                                        <p
                                            className={`mt-0.5 truncate text-[9px] ${isActive
                                                    ? "text-cyan-300/70"
                                                    : "text-slate-600 group-hover:text-slate-400"
                                                }`}
                                        >
                                            {item.description}
                                        </p>
                                    </div>

                                    {item.badge ? (
                                        <span
                                            className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[9px] font-bold ${isActive
                                                    ? "bg-cyan-300 text-slate-950"
                                                    : "bg-rose-500/15 text-rose-300"
                                                }`}
                                        >
                                            {item.badge}
                                        </span>
                                    ) : null}
                                </button>
                            );
                        })}
                    </div>

                    <p className="mb-2 mt-7 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Assistance
                    </p>

                    <button
                        type="button"
                        className="enterprise-sidebar-nav-item group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
                    >
                        <CircleHelp
                            size={18}
                            className="text-slate-500 group-hover:text-cyan-300"
                        />

                        <div className="text-left">
                            <p className="text-xs font-semibold">
                                Help Center
                            </p>

                            <p className="mt-0.5 text-[9px] text-slate-600 group-hover:text-slate-400">
                                Guides and contact support
                            </p>
                        </div>
                    </button>
                </nav>

                <div className="shrink-0 border-t border-white/10 p-3">
                    <div className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-white/[0.05]">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 text-xs font-bold text-slate-950">
                            {initials}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-white">
                                {displayName}
                            </p>

                            <p className="truncate text-[10px] text-slate-500">
                                {displayCompany}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onLogout}
                            title="Logout"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300"
                        >
                            <LogOut size={17} />
                        </button>
                    </div>
                </div>
            </aside>

            <div className="min-h-screen lg:pl-[260px]">
                <header className="sticky top-0 z-30 flex h-[76px] items-center border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(true)}
                        className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 lg:hidden"
                    >
                        <Menu size={20} />
                    </button>

                    <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold tracking-[-0.02em] text-slate-950">
                            {currentPage.title}
                        </h2>

                        <p className="hidden text-xs text-slate-500 sm:block">
                            {currentPage.description}
                        </p>
                    </div>

                    <div className="ml-auto flex items-center gap-2 sm:gap-3">
                        <div className="relative hidden md:block">
                            <Search
                                size={17}
                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="search"
                                placeholder="Search tickets, bills, products..."
                                className="h-10 w-[240px] rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:w-[300px] focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100 xl:w-[300px]"
                            />
                        </div>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    setNotificationOpen(
                                        (current) => !current
                                    );
                                    setProfileMenuOpen(false);
                                }}
                                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                            >
                                <Bell size={18} />

                                <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-rose-500" />
                            </button>

                            {notificationOpen && (
                                <div className="absolute right-0 top-12 z-50 w-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.16)]">
                                    <div className="border-b border-slate-200 px-4 py-3">
                                        <p className="text-sm font-semibold text-slate-950">
                                            Notifications
                                        </p>

                                        <p className="mt-0.5 text-[10px] text-slate-500">
                                            Recent account updates
                                        </p>
                                    </div>

                                    <div className="p-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleNavigation(
                                                    "billing"
                                                )
                                            }
                                            className="w-full rounded-xl p-3 text-left transition hover:bg-slate-50"
                                        >
                                            <p className="text-xs font-semibold text-slate-800">
                                                AMC status: {client?.amcStatus || "—"}
                                            </p>

                                            <p className="mt-1 text-[10px] leading-4 text-slate-500">
                                                {client?.nextRenewal
                                                    ? `Next renewal on ${client.nextRenewal}.`
                                                    : "No renewal date on file yet."}
                                            </p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleNavigation(
                                                    "tickets"
                                                )
                                            }
                                            className="w-full rounded-xl p-3 text-left transition hover:bg-slate-50"
                                        >
                                            <p className="text-xs font-semibold text-slate-800">
                                                Support tickets
                                            </p>

                                            <p className="mt-1 text-[10px] leading-4 text-slate-500">
                                                View and track your support tickets here.
                                            </p>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    setProfileMenuOpen(
                                        (current) => !current
                                    );
                                    setNotificationOpen(false);
                                }}
                                className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-100 text-[10px] font-bold text-cyan-700">
                                    {initials}
                                </span>

                                <span className="hidden sm:inline">
                                    {displayName}
                                </span>

                                <ChevronDown
                                    size={14}
                                    className="text-slate-400"
                                />
                            </button>

                            {profileMenuOpen && (
                                <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-[0_16px_40px_rgba(15,23,42,0.14)]">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleNavigation("profile")
                                        }
                                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                    >
                                        <UserRound size={16} />
                                        Company Profile
                                    </button>

                                    <button
                                        type="button"
                                        onClick={onLogout}
                                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                                    >
                                        <LogOut size={16} />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="enterprise-workspace p-4 sm:p-6 lg:p-8">
                    <div className="enterprise-page mx-auto max-w-[1600px]">
                        {renderPage()}
                    </div>
                </main>
            </div>
        </div>
    );
}
