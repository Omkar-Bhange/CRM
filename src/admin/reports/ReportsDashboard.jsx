import ManagementReports from "./ManagementReports";
import AttendanceReports from "./AttendanceReports";
import TeamReports from "./TeamReports";
import ClientReports from "./ClientReports";

import { useEffect, useState } from "react";

import {
    Activity,
    AlertTriangle,
    ArrowRight,
    BadgeIndianRupee,
    BarChart3,
    Building2,
    CalendarClock,
    CalendarDays,
    CheckCircle2,
    Clock3,
    CreditCard,
    Headphones,
    IndianRupee,
    ListTodo,
    RefreshCw,
    ShieldAlert,
    TrendingUp,
    UserCheck,
    Users,
    WalletCards,
} from "lucide-react";

const API_URL = "http://localhost:5000";

const getAuthToken = () =>
    localStorage.getItem("client-connect-token") ||
    sessionStorage.getItem("client-connect-token") ||
    "";

/* =========================================================
   FORMATTERS
========================================================= */

function formatCurrency(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
}

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

/* =========================================================
   KPI CARD
========================================================= */

function StatCard({
    label,
    value,
    subtitle,
    icon: Icon,
    iconClass,
    valueClass = "text-slate-950",
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {label}
                    </p>

                    <p
                        className={`mt-2 truncate text-2xl font-semibold tracking-[-0.03em] ${valueClass}`}
                    >
                        {value}
                    </p>
                </div>

                <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
                >
                    <Icon size={18} />
                </div>
            </div>

            <p className="mt-4 text-xs text-slate-500">
                {subtitle}
            </p>
        </div>
    );
}

/* =========================================================
   SMALL KPI
========================================================= */

function MiniStat({
    icon: Icon,
    label,
    value,
    iconClass,
    valueClass = "text-slate-950",
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
                <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconClass}`}
                >
                    <Icon size={15} />
                </div>

                <span className="text-[11px] font-semibold text-slate-500">
                    {label}
                </span>
            </div>

            <p
                className={`mt-3 text-xl font-semibold ${valueClass}`}
            >
                {value}
            </p>
        </div>
    );
}

/* =========================================================
   REPORT CARD
========================================================= */

function ReportCard({
    title,
    description,
    icon: Icon,
    iconClass,
    items,
    onClick,
}) {
    return (
        <div className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-sm">
            <div className="flex items-start gap-3">
                <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
                >
                    <Icon size={18} />
                </div>

                <div>
                    <h3 className="text-sm font-semibold text-slate-950">
                        {title}
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                        {description}
                    </p>
                </div>
            </div>

            <div className="mt-5 grid gap-2">
                {items.map((item) => (
                    <div
                        key={item}
                        className="flex items-center gap-2 text-xs text-slate-600"
                    >
                        <CheckCircle2
                            size={13}
                            className="text-emerald-500"
                        />

                        {item}
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={onClick}
                className="mt-5 flex items-center gap-2 text-xs font-semibold text-violet-600 transition group-hover:gap-3 hover:text-violet-700"
            >
                View Reports
                <ArrowRight size={14} />
            </button>
        </div>
    );
}

/* =========================================================
   EMPLOYEE STATUS
========================================================= */

function getStatusClass(status) {
    if (status === "Working") {
        return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";
    }

    if (status === "Free") {
        return "bg-blue-50 text-blue-700 ring-blue-600/10";
    }

    if (status === "Leave") {
        return "bg-violet-50 text-violet-700 ring-violet-600/10";
    }

    if (status === "Break") {
        return "bg-amber-50 text-amber-700 ring-amber-600/10";
    }

    return "bg-slate-100 text-slate-600 ring-slate-500/10";
}

/* =========================================================
   AMC RISK BADGE
========================================================= */

function getRiskClass(risk) {
    if (risk === "Expired") {
        return "bg-rose-50 text-rose-700 ring-rose-600/10";
    }

    if (risk === "Critical") {
        return "bg-orange-50 text-orange-700 ring-orange-600/10";
    }

    if (risk === "Expiring Soon") {
        return "bg-amber-50 text-amber-700 ring-amber-600/10";
    }

    return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";
}

/* =========================================================
   MAIN
========================================================= */

export default function ReportsDashboard() {
    const [data, setData] = useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [activeReport, setActiveReport] =
        useState("dashboard");

    /* =====================================================
       LOAD DASHBOARD
    ===================================================== */

    const loadReportsDashboard = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/api/reports/dashboard`,
                {
                    method: "GET",

                    headers: {
                        Accept: "application/json",

                        Authorization: `Bearer ${getAuthToken()}`,
                    },
                }
            );

            const result =
                await response.json();

            if (
                !response.ok ||
                !result.success
            ) {
                throw new Error(
                    result.message ||
                        "Unable to load Reports dashboard."
                );
            }

            setData(
                result.data || null
            );
        } catch (error) {
            console.error(
                "Reports dashboard load error:",
                error
            );

            setError(
                error.message ||
                    "Unable to load Reports dashboard."
            );

            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReportsDashboard();
    }, []);

    /* =====================================================
       DATA
    ===================================================== */

    const clients =
        data?.clients || {};

    const team =
        data?.team || {};

    const tasks =
        data?.tasks || {};

    const tickets =
        data?.tickets || {};

    const attendance =
        data?.attendance || {};

    const amc =
        data?.amc || {};

    const collections =
        data?.collections || {};

    const employeeWorkload =
        Array.isArray(
            data?.employeeWorkload
        )
            ? data.employeeWorkload
            : [];

    const clientAttention =
        Array.isArray(
            data?.clientAttention
        )
            ? data.clientAttention
            : [];

    const amcAttention =
        Array.isArray(
            data?.amcAttention
        )
            ? data.amcAttention
            : [];

    const collectionAttention =
        Array.isArray(
            data?.collectionAttention
        )
            ? data.collectionAttention
            : [];

    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
                    <div className="text-center">
                        <RefreshCw
                            size={24}
                            className="mx-auto animate-spin text-violet-600"
                        />

                        <p className="mt-3 text-sm font-medium text-slate-700">
                            Loading Management Analytics...
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Preparing reports and operational insights.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    /* =====================================================
       ERROR
    ===================================================== */

    if (error) {
        return (
            <div className="p-6">
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
                    <div className="flex items-start gap-3">
                        <AlertTriangle
                            size={18}
                            className="mt-0.5 text-rose-600"
                        />

                        <div>
                            <p className="text-sm font-semibold text-rose-800">
                                Unable to load Reports
                            </p>

                            <p className="mt-1 text-xs text-rose-700">
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={loadReportsDashboard}
                                className="mt-4 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* =====================================================
       EXISTING REPORT NAVIGATION
       PRESERVED
    ===================================================== */

    if (activeReport === "clients") {
        return (
            <ClientReports
                onBack={() =>
                    setActiveReport(
                        "dashboard"
                    )
                }
            />
        );
    }

    if (activeReport === "team") {
        return (
            <TeamReports
                onBack={() =>
                    setActiveReport(
                        "dashboard"
                    )
                }
            />
        );
    }

    if (activeReport === "attendance") {
        return (
            <AttendanceReports
                onBack={() =>
                    setActiveReport(
                        "dashboard"
                    )
                }
            />
        );
    }

    if (activeReport === "management") {
        return (
            <ManagementReports
                onBack={() =>
                    setActiveReport(
                        "dashboard"
                    )
                }
            />
        );
    }

    /* =====================================================
       DASHBOARD
    ===================================================== */

    return (
        <div className="p-6">
            {/* =============================================
                HEADER
            ============================================= */}

            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Activity
                            size={15}
                            className="text-violet-600"
                        />

                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
                            Management Command Center
                        </p>
                    </div>

                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                        Reports & Analytics
                    </h2>

                    <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
                        Monitor clients, collections,
                        AMC renewals, support tickets,
                        team workload and attendance
                        from one management dashboard.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={
                        loadReportsDashboard
                    }
                    className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                    <RefreshCw size={14} />
                    Refresh Dashboard
                </button>
            </div>

            {/* =============================================
                EXECUTIVE KPI
            ============================================= */}

            <section className="mt-6">
                <div className="mb-4">
                    <h3 className="text-sm font-semibold text-slate-950">
                        Executive Overview
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                        Current operational health of
                        clients, team and support.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Total Clients"
                        value={Number(
                            clients.total || 0
                        )}
                        subtitle={`${Number(
                            clients.active || 0
                        )} active • ${Number(
                            clients.inactive || 0
                        )} inactive`}
                        icon={Building2}
                        iconClass="bg-violet-100 text-violet-700"
                    />

                    <StatCard
                        label="Team Members"
                        value={Number(
                            team.total || 0
                        )}
                        subtitle={`${Number(
                            team.working || 0
                        )} working • ${Number(
                            team.free || 0
                        )} free`}
                        icon={Users}
                        iconClass="bg-cyan-100 text-cyan-700"
                    />

                    <StatCard
                        label="Open Tickets"
                        value={Number(
                            tickets.open || 0
                        )}
                        subtitle={`${Number(
                            tickets.resolved || 0
                        )} resolved • ${Number(
                            tickets.overdue || 0
                        )} overdue`}
                        icon={Headphones}
                        iconClass="bg-amber-100 text-amber-700"
                    />

                    <StatCard
                        label="Overdue Work"
                        value={
                            Number(
                                tasks.overdue ||
                                    0
                            ) +
                            Number(
                                tickets.overdue ||
                                    0
                            )
                        }
                        subtitle={`${Number(
                            tasks.overdue || 0
                        )} tasks • ${Number(
                            tickets.overdue || 0
                        )} tickets`}
                        icon={AlertTriangle}
                        iconClass="bg-rose-100 text-rose-700"
                        valueClass="text-rose-600"
                    />
                </div>
            </section>

            {/* =============================================
                FINANCIAL HEALTH
            ============================================= */}

            <section className="mt-7">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-950">
                            Financial & Collection Health
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                            AMC billing, collection and
                            outstanding position.
                        </p>
                    </div>

                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        {
                            Number(
                                collections.invoiceCount ||
                                    0
                            )
                        }{" "}
                        invoices
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Total Billed"
                        value={formatCurrency(
                            collections.totalBilled
                        )}
                        subtitle={`${Number(
                            collections.invoiceCount ||
                                0
                        )} AMC invoices`}
                        icon={BadgeIndianRupee}
                        iconClass="bg-blue-100 text-blue-700"
                    />

                    <StatCard
                        label="Collected"
                        value={formatCurrency(
                            collections.collected
                        )}
                        subtitle={`${Number(
                            collections.paidInvoices ||
                                0
                        )} fully paid invoices`}
                        icon={WalletCards}
                        iconClass="bg-emerald-100 text-emerald-700"
                        valueClass="text-emerald-700"
                    />

                    <StatCard
                        label="Outstanding"
                        value={formatCurrency(
                            collections.outstanding
                        )}
                        subtitle="Pending client receivables"
                        icon={CreditCard}
                        iconClass="bg-amber-100 text-amber-700"
                        valueClass="text-amber-700"
                    />

                    <StatCard
                        label="Overdue Amount"
                        value={formatCurrency(
                            collections.overdueAmount
                        )}
                        subtitle={`${Number(
                            collections.overdueInvoices ||
                                0
                        )} overdue invoices`}
                        icon={ShieldAlert}
                        iconClass="bg-rose-100 text-rose-700"
                        valueClass="text-rose-600"
                    />
                </div>
            </section>

            {/* =============================================
                AMC HEALTH
            ============================================= */}

            <section className="mt-7 rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <CalendarClock
                                size={17}
                                className="text-violet-600"
                            />

                            <h3 className="text-sm font-semibold text-slate-950">
                                AMC Health
                            </h3>
                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                            Contract renewal position and
                            renewal risk.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            setActiveReport(
                                "management"
                            )
                        }
                        className="flex items-center gap-2 text-xs font-semibold text-violet-600 hover:text-violet-700"
                    >
                        Open Management Reports
                        <ArrowRight size={13} />
                    </button>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <MiniStat
                        icon={CalendarDays}
                        label="Total AMC"
                        value={Number(
                            amc.total || 0
                        )}
                        iconClass="bg-slate-100 text-slate-600"
                    />

                    <MiniStat
                        icon={CheckCircle2}
                        label="Normal / Active"
                        value={Number(
                            amc.active || 0
                        )}
                        iconClass="bg-emerald-100 text-emerald-700"
                        valueClass="text-emerald-700"
                    />

                    <MiniStat
                        icon={Clock3}
                        label="Expiring Soon"
                        value={Number(
                            amc.expiringSoon ||
                                0
                        )}
                        iconClass="bg-amber-100 text-amber-700"
                        valueClass="text-amber-700"
                    />

                    <MiniStat
                        icon={AlertTriangle}
                        label="Critical"
                        value={Number(
                            amc.critical || 0
                        )}
                        iconClass="bg-orange-100 text-orange-700"
                        valueClass="text-orange-700"
                    />

                    <MiniStat
                        icon={ShieldAlert}
                        label="Expired"
                        value={Number(
                            amc.expired || 0
                        )}
                        iconClass="bg-rose-100 text-rose-700"
                        valueClass="text-rose-600"
                    />
                </div>
            </section>

            {/* =============================================
                ATTENTION CENTER
            ============================================= */}

            <section className="mt-7">
                <div className="mb-4">
                    <h3 className="text-sm font-semibold text-slate-950">
                        Attention Center
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                        Items requiring management
                        follow-up.
                    </p>
                </div>

                <div className="grid gap-5 xl:grid-cols-3">
                    {/* CLIENT ATTENTION */}

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className="border-b border-slate-200 px-5 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-950">
                                        Client / Ticket Attention
                                    </h4>

                                    <p className="mt-1 text-[11px] text-slate-500">
                                        Open and overdue
                                        support cases.
                                    </p>
                                </div>

                                <Headphones
                                    size={18}
                                    className="text-amber-500"
                                />
                            </div>
                        </div>

                        {clientAttention.length ===
                        0 ? (
                            <div className="px-5 py-10 text-center">
                                <CheckCircle2
                                    size={23}
                                    className="mx-auto text-emerald-500"
                                />

                                <p className="mt-3 text-xs font-medium text-slate-700">
                                    No client ticket
                                    attention required.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {clientAttention
                                    .slice(0, 6)
                                    .map(
                                        (
                                            client,
                                            index
                                        ) => (
                                            <div
                                                key={
                                                    client._id ||
                                                    index
                                                }
                                                className="px-5 py-3.5"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className="truncate text-xs font-semibold text-slate-800">
                                                        {client.clientName ||
                                                            "Unknown Client"}
                                                    </p>

                                                    {Number(
                                                        client.overdueTickets ||
                                                            0
                                                    ) >
                                                        0 && (
                                                        <span className="rounded-full bg-rose-50 px-2 py-1 text-[9px] font-semibold text-rose-600">
                                                            {
                                                                client.overdueTickets
                                                            }{" "}
                                                            overdue
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="mt-2 flex gap-3 text-[10px] text-slate-400">
                                                    <span>
                                                        Open:{" "}
                                                        {Number(
                                                            client.openTickets ||
                                                                0
                                                        )}
                                                    </span>

                                                    <span>
                                                        Priority:{" "}
                                                        {Number(
                                                            client.highPriorityTickets ||
                                                                0
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    )}
                            </div>
                        )}
                    </div>

                    {/* AMC ATTENTION */}

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className="border-b border-slate-200 px-5 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-950">
                                        AMC Renewal Attention
                                    </h4>

                                    <p className="mt-1 text-[11px] text-slate-500">
                                        Contracts nearing or
                                        past expiry.
                                    </p>
                                </div>

                                <CalendarClock
                                    size={18}
                                    className="text-violet-500"
                                />
                            </div>
                        </div>

                        {amcAttention.length ===
                        0 ? (
                            <div className="px-5 py-10 text-center">
                                <CheckCircle2
                                    size={23}
                                    className="mx-auto text-emerald-500"
                                />

                                <p className="mt-3 text-xs font-medium text-slate-700">
                                    No AMC renewal risks
                                    currently.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {amcAttention
                                    .slice(0, 6)
                                    .map(
                                        (
                                            item,
                                            index
                                        ) => (
                                            <div
                                                key={
                                                    item.id ||
                                                    index
                                                }
                                                className="px-5 py-3.5"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-xs font-semibold text-slate-800">
                                                            {item.clientName ||
                                                                "Unknown Client"}
                                                        </p>

                                                        <p className="mt-1 truncate text-[10px] text-slate-400">
                                                            {item.productName ||
                                                                item.contractCode ||
                                                                "AMC Contract"}
                                                        </p>
                                                    </div>

                                                    <span
                                                        className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold ring-1 ring-inset ${getRiskClass(
                                                            item.renewalRisk
                                                        )}`}
                                                    >
                                                        {item.renewalRisk ||
                                                            "Normal"}
                                                    </span>
                                                </div>

                                                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                                                    <span>
                                                        {formatDate(
                                                            item.contractExpiryDate
                                                        )}
                                                    </span>

                                                    {item.daysLeft !==
                                                        null &&
                                                        item.daysLeft !==
                                                            undefined && (
                                                            <span>
                                                                {Number(
                                                                    item.daysLeft
                                                                ) <
                                                                0
                                                                    ? `${Math.abs(
                                                                          Number(
                                                                              item.daysLeft
                                                                          )
                                                                      )} days overdue`
                                                                    : `${Number(
                                                                          item.daysLeft
                                                                      )} days left`}
                                                            </span>
                                                        )}
                                                </div>
                                            </div>
                                        )
                                    )}
                            </div>
                        )}
                    </div>

                    {/* COLLECTION ATTENTION */}

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className="border-b border-slate-200 px-5 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-950">
                                        Collection Follow-up
                                    </h4>

                                    <p className="mt-1 text-[11px] text-slate-500">
                                        Pending client
                                        receivables.
                                    </p>
                                </div>

                                <IndianRupee
                                    size={18}
                                    className="text-emerald-600"
                                />
                            </div>
                        </div>

                        {collectionAttention.length ===
                        0 ? (
                            <div className="px-5 py-10 text-center">
                                <CheckCircle2
                                    size={23}
                                    className="mx-auto text-emerald-500"
                                />

                                <p className="mt-3 text-xs font-medium text-slate-700">
                                    No collection follow-up
                                    required.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {collectionAttention
                                    .slice(0, 6)
                                    .map(
                                        (
                                            item,
                                            index
                                        ) => (
                                            <div
                                                key={
                                                    item.id ||
                                                    index
                                                }
                                                className="px-5 py-3.5"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-xs font-semibold text-slate-800">
                                                            {item.clientName ||
                                                                "Unknown Client"}
                                                        </p>

                                                        <p className="mt-1 text-[10px] text-slate-400">
                                                            {item.invoiceCode ||
                                                                "Invoice"}
                                                        </p>
                                                    </div>

                                                    <p className="shrink-0 text-xs font-semibold text-rose-600">
                                                        {formatCurrency(
                                                            item.pendingAmount
                                                        )}
                                                    </p>
                                                </div>

                                                <div className="mt-2 flex items-center justify-between text-[10px]">
                                                    <span className="text-slate-400">
                                                        Due{" "}
                                                        {formatDate(
                                                            item.dueDate
                                                        )}
                                                    </span>

                                                    {item.isOverdue ? (
                                                        <span className="font-semibold text-rose-600">
                                                            {Number(
                                                                item.overdueDays ||
                                                                    0
                                                            )}{" "}
                                                            days overdue
                                                        </span>
                                                    ) : (
                                                        <span className="font-semibold text-amber-600">
                                                            Pending
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    )}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* =============================================
                TEAM + ATTENDANCE
            ============================================= */}

            <section className="mt-7 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
                {/* TEAM WORKLOAD */}

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-950">
                                Team Workload
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                                Current employee availability
                                and assigned work.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setActiveReport(
                                    "team"
                                )
                            }
                            className="text-xs font-semibold text-violet-600 hover:text-violet-700"
                        >
                            View Team Reports
                        </button>
                    </div>

                    {employeeWorkload.length ===
                    0 ? (
                        <div className="px-5 py-12 text-center text-sm text-slate-500">
                            No employee workload data
                            available.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                            Employee
                                        </th>

                                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                            Department
                                        </th>

                                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                            Status
                                        </th>

                                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                            Current Work
                                        </th>

                                        <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                            Open
                                        </th>

                                        <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                            Done Today
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {employeeWorkload
                                        .slice(0, 8)
                                        .map(
                                            (
                                                employee,
                                                index
                                            ) => (
                                                <tr
                                                    key={
                                                        employee._id ||
                                                        index
                                                    }
                                                    className="hover:bg-slate-50/60"
                                                >
                                                    <td className="px-5 py-3.5">
                                                        <p className="text-xs font-semibold text-slate-800">
                                                            {employee.name ||
                                                                "—"}
                                                        </p>

                                                        <p className="mt-0.5 text-[10px] text-slate-400">
                                                            {employee.employeeCode ||
                                                                "—"}
                                                        </p>
                                                    </td>

                                                    <td className="px-4 py-3.5">
                                                        <p className="text-xs text-slate-700">
                                                            {employee.department ||
                                                                "—"}
                                                        </p>

                                                        <p className="mt-0.5 text-[10px] text-slate-400">
                                                            {employee.role ||
                                                                ""}
                                                        </p>
                                                    </td>

                                                    <td className="px-4 py-3.5">
                                                        <span
                                                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${getStatusClass(
                                                                employee.status
                                                            )}`}
                                                        >
                                                            {employee.status ||
                                                                "Unknown"}
                                                        </span>
                                                    </td>

                                                    <td className="px-4 py-3.5">
                                                        <p className="max-w-[230px] truncate text-xs text-slate-700">
                                                            {employee.currentTaskTitle ||
                                                                employee.currentTask ||
                                                                "Available for assignment"}
                                                        </p>

                                                        {employee.currentClient && (
                                                            <p className="mt-0.5 text-[10px] text-slate-400">
                                                                {
                                                                    employee.currentClient
                                                                }
                                                            </p>
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-3.5 text-center text-xs font-semibold text-amber-600">
                                                        {Number(
                                                            employee.openTasks ||
                                                                0
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-3.5 text-center text-xs font-semibold text-emerald-600">
                                                        {Number(
                                                            employee.completedToday ||
                                                                0
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* TODAY ATTENDANCE */}

                <div className="rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-950">
                                Today's Attendance
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                                Current daily attendance
                                snapshot.
                            </p>
                        </div>

                        <CalendarDays
                            size={18}
                            className="text-emerald-600"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-5">
                        <MiniStat
                            icon={UserCheck}
                            label="Present"
                            value={Number(
                                attendance.present ||
                                    0
                            )}
                            iconClass="bg-emerald-100 text-emerald-700"
                            valueClass="text-emerald-700"
                        />

                        <MiniStat
                            icon={Clock3}
                            label="Late"
                            value={Number(
                                attendance.late || 0
                            )}
                            iconClass="bg-amber-100 text-amber-700"
                            valueClass="text-amber-700"
                        />

                        <MiniStat
                            icon={CalendarDays}
                            label="Half Day"
                            value={Number(
                                attendance.halfDay ||
                                    0
                            )}
                            iconClass="bg-blue-100 text-blue-700"
                        />

                        <MiniStat
                            icon={AlertTriangle}
                            label="Absent"
                            value={Number(
                                attendance.absent ||
                                    0
                            )}
                            iconClass="bg-rose-100 text-rose-700"
                            valueClass="text-rose-600"
                        />

                        <MiniStat
                            icon={CalendarClock}
                            label="Leave"
                            value={Number(
                                attendance.leave || 0
                            )}
                            iconClass="bg-violet-100 text-violet-700"
                        />

                        <MiniStat
                            icon={ListTodo}
                            label="Active Tasks"
                            value={Number(
                                tasks.active || 0
                            )}
                            iconClass="bg-cyan-100 text-cyan-700"
                        />
                    </div>

                    <div className="border-t border-slate-100 px-5 py-4">
                        <button
                            type="button"
                            onClick={() =>
                                setActiveReport(
                                    "attendance"
                                )
                            }
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                            View Attendance Reports
                            <ArrowRight
                                size={13}
                            />
                        </button>
                    </div>
                </div>
            </section>

            {/* =============================================
                REPORT CENTERS
            ============================================= */}

            <section className="mt-8">
                <div className="mb-4 flex items-end justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-950">
                            Report Centers
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                            Open detailed operational and
                            management reports.
                        </p>
                    </div>

                    <TrendingUp
                        size={18}
                        className="text-violet-500"
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <ReportCard
                        title="Client Reports"
                        description="Client activity, AMC, payments and support history."
                        icon={Building2}
                        iconClass="bg-violet-100 text-violet-700"
                        items={[
                            "Client Summary",
                            "Client-wise Tickets",
                            "AMC Status",
                            "Payment & Outstanding",
                        ]}
                        onClick={() =>
                            setActiveReport(
                                "clients"
                            )
                        }
                    />

                    <ReportCard
                        title="Team Reports"
                        description="Employee productivity, workload and assignment analysis."
                        icon={Users}
                        iconClass="bg-cyan-100 text-cyan-700"
                        items={[
                            "Employee Performance",
                            "Employee Workload",
                            "Task Analysis",
                            "Ticket Performance",
                        ]}
                        onClick={() =>
                            setActiveReport(
                                "team"
                            )
                        }
                    />

                    <ReportCard
                        title="Attendance Reports"
                        description="Daily attendance, late arrivals and working-hour analysis."
                        icon={CalendarDays}
                        iconClass="bg-emerald-100 text-emerald-700"
                        items={[
                            "Attendance Summary",
                            "Late Arrival",
                            "Working Hours",
                            "Overtime & Absence",
                        ]}
                        onClick={() =>
                            setActiveReport(
                                "attendance"
                            )
                        }
                    />

                    <ReportCard
                        title="Management Reports"
                        description="Business risk, collection and management-level analysis."
                        icon={BarChart3}
                        iconClass="bg-amber-100 text-amber-700"
                        items={[
                            "AMC Risk",
                            "Collection Status",
                            "Overdue Work",
                            "Management Attention",
                        ]}
                        onClick={() =>
                            setActiveReport(
                                "management"
                            )
                        }
                    />
                </div>
            </section>
        </div>
    );
}