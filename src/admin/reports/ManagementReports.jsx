import { useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    Building2,
    CheckCircle2,
    Clock3,
    Download,
    Filter,
    RefreshCw,
    Search,
    TicketCheck,
    Users,
    X,
    BriefcaseBusiness,
    CircleDollarSign,
    ShieldAlert,
    UserCheck,
    UserRoundCheck,
    CalendarClock,
    Activity,
    ListTodo,
} from "lucide-react";
import * as XLSX from "xlsx";

const API_URL = "http://localhost:5000";

const getAuthToken = () =>
    localStorage.getItem("client-connect-token") ||
    sessionStorage.getItem("client-connect-token") ||
    "";
const TABS = [
    {
        id: "overview",
        label: "Management Overview",
        endpoint: "/api/reports/management/overview",
    },
    {
        id: "pending-overdue",
        label: "Pending & Overdue",
        endpoint: "/api/reports/management/pending-overdue",
    },
    {
        id: "client-attention",
        label: "Client Attention",
        endpoint: "/api/reports/management/client-attention",
    },
    {
        id: "team-utilization",
        label: "Team Utilization",
        endpoint: "/api/reports/management/team-utilization",
    },
    {
        id: "amc-risk",
        label: "AMC Risk",
        endpoint: "/api/reports/management/amc-risk",
    },
    {
        id: "collections",
        label: "Collections",
        endpoint: "/api/reports/management/collections",
    },
];

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

function formatMinutes(minutes) {
    const value = Number(minutes || 0);

    if (!value) return "0m";

    const hours = Math.floor(value / 60);
    const remaining = value % 60;

    if (!hours) {
        return `${remaining}m`;
    }

    return remaining
        ? `${hours}h ${remaining}m`
        : `${hours}h`;
}

function formatCurrency(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
}

function getPriorityClass(priority) {
    const value = String(priority || "").toLowerCase();

    if (["critical", "urgent"].includes(value)) {
        return "bg-rose-50 text-rose-700 ring-rose-600/10";
    }

    if (value === "high") {
        return "bg-orange-50 text-orange-700 ring-orange-600/10";
    }

    if (value === "medium") {
        return "bg-amber-50 text-amber-700 ring-amber-600/10";
    }

    if (value === "low") {
        return "bg-blue-50 text-blue-700 ring-blue-600/10";
    }

    return "bg-slate-100 text-slate-600 ring-slate-500/10";
}

function getStatusClass(status) {
    const value = String(status || "").toLowerCase();

    if (
        [
            "completed",
            "resolved",
            "verified",
            "closed",
            "working",
        ].includes(value)
    ) {
        return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";
    }

    if (
        [
            "in progress",
            "testing",
            "assigned",
            "free",
        ].includes(value)
    ) {
        return "bg-blue-50 text-blue-700 ring-blue-600/10";
    }

    if (
        [
            "waiting for client",
            "paused",
            "pending",
            "new",
            "break",
        ].includes(value)
    ) {
        return "bg-amber-50 text-amber-700 ring-amber-600/10";
    }

    if (value === "leave") {
        return "bg-purple-50 text-purple-700 ring-purple-600/10";
    }

    return "bg-slate-100 text-slate-600 ring-slate-500/10";
}

function getWorkloadClass(level) {
    const value = String(level || "").toLowerCase();

    if (value === "high") {
        return "bg-rose-50 text-rose-700 ring-rose-600/10";
    }

    if (value === "medium") {
        return "bg-amber-50 text-amber-700 ring-amber-600/10";
    }

    if (value === "normal") {
        return "bg-blue-50 text-blue-700 ring-blue-600/10";
    }

    if (value === "available") {
        return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";
    }

    return "bg-slate-100 text-slate-600 ring-slate-500/10";
}

function Badge({
    value,
    type = "status",
}) {
    let className =
        getStatusClass(value);

    if (type === "priority") {
        className =
            getPriorityClass(value);
    }

    if (type === "workload") {
        className =
            getWorkloadClass(value);
    }

    return (
        <span
            className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${className}`}
        >
            {value || "—"}
        </span>
    );
}

function SummaryCard({
    icon: Icon,
    label,
    value,
    description = "",
    iconClass = "bg-violet-100 text-violet-700",
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start gap-3">
                <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
                >
                    <Icon size={18} />
                </div>

                <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        {label}
                    </p>

                    <p className="mt-1 truncate text-xl font-semibold text-slate-950">
                        {value}
                    </p>

                    {description && (
                        <p className="mt-1 text-[10px] text-slate-400">
                            {description}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function SectionTitle({
    icon: Icon,
    title,
    description,
}) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Icon size={16} />
            </div>

            <div>
                <h3 className="text-sm font-semibold text-slate-950">
                    {title}
                </h3>

                {description && (
                    <p className="mt-0.5 text-[11px] text-slate-500">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
}

export default function ManagementReports({
    onBack,
}) {
    const [activeTab, setActiveTab] =
        useState("overview");

    const [records, setRecords] =
        useState([]);

    const [summary, setSummary] =
        useState({});

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [workType, setWorkType] =
        useState("All");

    const [priority, setPriority] =
        useState("All");

    const [workloadLevel, setWorkloadLevel] =
        useState("All");
        const [amcRisk, setAmcRisk] =
    useState("All");

const [collectionStatus, setCollectionStatus] =
    useState("All");

const [clientCollectionSummary, setClientCollectionSummary] =
    useState([]);

    const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
    };

    const loadReport = async (
        tab = activeTab
    ) => {
        try {
            setLoading(true);
            setError("");

            const config =
                TABS.find(
                    (item) =>
                        item.id === tab
                );

            if (!config) {
                throw new Error(
                    "Invalid Management Report."
                );
            }

            const response =
                await fetch(
                    `${API_URL}${config.endpoint}`,
                    {
                        headers,
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
                        "Unable to load Management Report."
                );
            }

         if (tab === "overview") {
    setRecords([]);
    setSummary(
        result.summary || {}
    );

    setClientCollectionSummary([]);
} else {
    setRecords(
        Array.isArray(result.data)
            ? result.data
            : []
    );

    setSummary(
        result.summary || {}
    );

    setClientCollectionSummary(
        Array.isArray(result.clientSummary)
            ? result.clientSummary
            : []
    );
}
        } catch (error) {
            console.error(
                "Management report load error:",
                error
            );

            setError(
                error.message ||
                    "Unable to load Management Report."
            );

            setRecords([]);
            setSummary({});
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReport(activeTab);
    }, [activeTab]);

    const changeTab = (tab) => {
        setActiveTab(tab);

       setSearch("");
setWorkType("All");
setPriority("All");
setWorkloadLevel("All");
setAmcRisk("All");
setCollectionStatus("All");
    };

    const filteredRecords =
        useMemo(() => {
            const value =
                search
                    .trim()
                    .toLowerCase();

            return records.filter(
                (item) => {
                    if (
                        activeTab ===
                            "pending-overdue" &&
                        workType !==
                            "All" &&
                        item.type !==
                            workType
                    ) {
                        return false;
                    }

                    if (
                        activeTab ===
                            "pending-overdue" &&
                        priority !==
                            "All" &&
                        item.priority !==
                            priority
                    ) {
                        return false;
                    }

                    if (
                        activeTab ===
                            "team-utilization" &&
                        workloadLevel !==
                            "All" &&
                        item.workloadLevel !==
                            workloadLevel
                    ) {
                        return false;
                    }
                    if (
    activeTab === "amc-risk" &&
    amcRisk !== "All" &&
    item.renewalRisk !== amcRisk
) {
    return false;
}

if (
    activeTab === "collections" &&
    collectionStatus !== "All" &&
    item.collectionStatus !== collectionStatus
) {
    return false;
}

                    if (!value) {
                        return true;
                    }

                    return [
                        item.type,
                        item.code,
                        item.title,

                        item.clientCode,
                        item.clientName,

                        item.employeeCode,
                        item.employeeName,

                        item.name,
                        item.department,
                        item.role,

                        item.priority,
                        item.status,

                        item.currentTask,
                        item.currentTaskCode,
                        item.currentTaskTitle,
                        item.currentClient,
                        item.currentProject,
item.invoiceCode,
item.contractCode,
item.productCode,
item.productName,
item.renewalRisk,
item.collectionStatus,
item.assignedEmployeeName,
item.reminderStatus,
                        item.workloadLevel,
                    ].some((field) =>
                        String(
                            field || ""
                        )
                            .toLowerCase()
                            .includes(value)
                    );
                }
            );
}, [
    records,
    search,
    activeTab,
    workType,
    priority,
    workloadLevel,
    amcRisk,
    collectionStatus,
]);

const clearFilters = () => {
    setSearch("");
    setWorkType("All");
    setPriority("All");
    setWorkloadLevel("All");
    setAmcRisk("All");
    setCollectionStatus("All");
};

    const renderOverview = () => {
        const clients =
            summary.clients || {};

        const team =
            summary.team || {};

        const tasks =
            summary.tasks || {};

        const tickets =
            summary.tickets || {};

        const amc =
            summary.amc || {};

        const collections =
            summary.collections || {};

        return (
            <div className="space-y-6">
                {/* BUSINESS */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <SectionTitle
                        icon={Building2}
                        title="Business Overview"
                        description="High-level client and management attention indicators."
                    />

                    <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <SummaryCard
                            icon={Building2}
                            label="Total Clients"
                            value={
                                clients.total ||
                                0
                            }
                        />

                        <SummaryCard
                            icon={CheckCircle2}
                            label="Active Clients"
                            value={
                                clients.active ||
                                0
                            }
                            iconClass="bg-emerald-100 text-emerald-700"
                        />

                        <SummaryCard
                            icon={Users}
                            label="Team Members"
                            value={
                                team.total ||
                                0
                            }
                            iconClass="bg-blue-100 text-blue-700"
                        />

                        <SummaryCard
                            icon={ShieldAlert}
                            label="Attention Items"
                            value={
                                summary.totalAttentionItems ||
                                0
                            }
                            iconClass="bg-rose-100 text-rose-700"
                        />
                    </div>
                </div>

                {/* WORK */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <SectionTitle
                        icon={BriefcaseBusiness}
                        title="Work & Support"
                        description="Current task and ticket position across the business."
                    />

                    <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <SummaryCard
                            icon={ListTodo}
                            label="Pending Tasks"
                            value={
                                tasks.pending ||
                                0
                            }
                            iconClass="bg-amber-100 text-amber-700"
                        />

                        <SummaryCard
                            icon={AlertTriangle}
                            label="Overdue Tasks"
                            value={
                                tasks.overdue ||
                                0
                            }
                            iconClass="bg-rose-100 text-rose-700"
                        />

                        <SummaryCard
                            icon={TicketCheck}
                            label="Open Tickets"
                            value={
                                tickets.open ||
                                0
                            }
                            iconClass="bg-blue-100 text-blue-700"
                        />

                        <SummaryCard
                            icon={AlertTriangle}
                            label="Overdue Tickets"
                            value={
                                tickets.overdue ||
                                0
                            }
                            iconClass="bg-rose-100 text-rose-700"
                        />
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <SummaryCard
                            icon={CheckCircle2}
                            label="Completed Tasks"
                            value={
                                tasks.completed ||
                                0
                            }
                            iconClass="bg-emerald-100 text-emerald-700"
                        />

                        <SummaryCard
                            icon={CheckCircle2}
                            label="Resolved Tickets"
                            value={
                                tickets.resolved ||
                                0
                            }
                            iconClass="bg-emerald-100 text-emerald-700"
                        />

                        <SummaryCard
                            icon={ListTodo}
                            label="Total Tasks"
                            value={
                                tasks.total ||
                                0
                            }
                        />

                        <SummaryCard
                            icon={TicketCheck}
                            label="Total Tickets"
                            value={
                                tickets.total ||
                                0
                            }
                        />
                    </div>
                </div>

                {/* TEAM */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <SectionTitle
                        icon={Users}
                        title="Team Availability"
                        description="Current employee availability and work status."
                    />

                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                        <SummaryCard
                            icon={Activity}
                            label="Working"
                            value={
                                team.working ||
                                0
                            }
                            iconClass="bg-emerald-100 text-emerald-700"
                        />

                        <SummaryCard
                            icon={UserCheck}
                            label="Free"
                            value={
                                team.free ||
                                0
                            }
                            iconClass="bg-blue-100 text-blue-700"
                        />

                        <SummaryCard
                            icon={Clock3}
                            label="Break"
                            value={
                                team.break ||
                                0
                            }
                            iconClass="bg-amber-100 text-amber-700"
                        />

                        <SummaryCard
                            icon={UserRoundCheck}
                            label="Leave"
                            value={
                                team.leave ||
                                0
                            }
                            iconClass="bg-purple-100 text-purple-700"
                        />

                        <SummaryCard
                            icon={Users}
                            label="Offline"
                            value={
                                team.offline ||
                                0
                            }
                            iconClass="bg-slate-100 text-slate-600"
                        />
                    </div>
                </div>

                {/* AMC */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <SectionTitle
                        icon={CalendarClock}
                        title="AMC Position"
                        description="Contract health and renewal risk."
                    />

                    <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <SummaryCard
                            icon={CalendarClock}
                            label="Total AMC"
                            value={
                                amc.totalContracts ||
                                0
                            }
                        />

                        <SummaryCard
                            icon={CheckCircle2}
                            label="Active AMC"
                            value={
                                amc.activeContracts ||
                                0
                            }
                            iconClass="bg-emerald-100 text-emerald-700"
                        />

                        <SummaryCard
                            icon={Clock3}
                            label="Expiring Soon"
                            value={
                                amc.expiringSoon ||
                                0
                            }
                            iconClass="bg-amber-100 text-amber-700"
                        />

                        <SummaryCard
                            icon={AlertTriangle}
                            label="Expired AMC"
                            value={
                                amc.expiredContracts ||
                                0
                            }
                            iconClass="bg-rose-100 text-rose-700"
                        />
                    </div>
                </div>

                {/* FINANCE */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <SectionTitle
                        icon={CircleDollarSign}
                        title="Collections & Outstanding"
                        description="AMC billing receivable and collection position."
                    />

                    <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <SummaryCard
                            icon={CircleDollarSign}
                            label="Receivable"
                            value={formatCurrency(
                                collections.totalReceivable
                            )}
                        />

                        <SummaryCard
                            icon={CheckCircle2}
                            label="Received"
                            value={formatCurrency(
                                collections.totalReceived
                            )}
                            iconClass="bg-emerald-100 text-emerald-700"
                        />

                        <SummaryCard
                            icon={AlertTriangle}
                            label="Outstanding"
                            value={formatCurrency(
                                collections.totalOutstanding
                            )}
                            iconClass="bg-rose-100 text-rose-700"
                        />

                        <SummaryCard
                            icon={CalendarClock}
                            label="Overdue Invoices"
                            value={
                                collections.overdueInvoices ||
                                0
                            }
                            iconClass="bg-amber-100 text-amber-700"
                        />
                    </div>
                </div>
            </div>
        );
    };

    const renderCards = () => {
        if (
            activeTab ===
            "pending-overdue"
        ) {
            return (
                <>
                    <SummaryCard
                        icon={BriefcaseBusiness}
                        label="Pending Work"
                        value={
                            summary.totalPending ||
                            0
                        }
                    />

                    <SummaryCard
                        icon={ListTodo}
                        label="Pending Tasks"
                        value={
                            summary.pendingTasks ||
                            0
                        }
                        iconClass="bg-amber-100 text-amber-700"
                    />

                    <SummaryCard
                        icon={TicketCheck}
                        label="Pending Tickets"
                        value={
                            summary.pendingTickets ||
                            0
                        }
                        iconClass="bg-blue-100 text-blue-700"
                    />

                    <SummaryCard
                        icon={AlertTriangle}
                        label="Overdue"
                        value={
                            summary.totalOverdue ||
                            0
                        }
                        iconClass="bg-rose-100 text-rose-700"
                    />
                </>
            );
        }

        if (
            activeTab ===
            "client-attention"
        ) {
            return (
                <>
                    <SummaryCard
                        icon={Building2}
                        label="Clients Needing Attention"
                        value={
                            summary.clientsNeedingAttention ||
                            0
                        }
                    />

                    <SummaryCard
                        icon={ListTodo}
                        label="Pending Tasks"
                        value={
                            summary.pendingTasks ||
                            0
                        }
                        iconClass="bg-amber-100 text-amber-700"
                    />

                    <SummaryCard
                        icon={TicketCheck}
                        label="Open Tickets"
                        value={
                            summary.openTickets ||
                            0
                        }
                        iconClass="bg-blue-100 text-blue-700"
                    />

                    <SummaryCard
                        icon={AlertTriangle}
                        label="Overdue Items"
                        value={
                            summary.overdueItems ||
                            0
                        }
                        iconClass="bg-rose-100 text-rose-700"
                    />
                </>
            );
        }
        if (activeTab === "amc-risk") {
    return (
        <>
            <SummaryCard
                icon={CalendarClock}
                label="Total AMC"
                value={summary.totalContracts || 0}
            />

            <SummaryCard
                icon={Clock3}
                label="Expiring Soon"
                value={summary.expiringSoon || 0}
                iconClass="bg-amber-100 text-amber-700"
            />

            <SummaryCard
                icon={ShieldAlert}
                label="Critical"
                value={summary.critical || 0}
                iconClass="bg-orange-100 text-orange-700"
            />

            <SummaryCard
                icon={AlertTriangle}
                label="Expired"
                value={summary.expired || 0}
                iconClass="bg-rose-100 text-rose-700"
            />
        </>
    );
}
if (activeTab === "collections") {
    return (
        <>
            <SummaryCard
                icon={CircleDollarSign}
                label="Total Billed"
                value={formatCurrency(
                    summary.totalBilled
                )}
            />

            <SummaryCard
                icon={CheckCircle2}
                label="Collected"
                value={formatCurrency(
                    summary.totalCollected
                )}
                iconClass="bg-emerald-100 text-emerald-700"
            />

            <SummaryCard
                icon={AlertTriangle}
                label="Outstanding"
                value={formatCurrency(
                    summary.totalOutstanding
                )}
                iconClass="bg-amber-100 text-amber-700"
            />

            <SummaryCard
                icon={ShieldAlert}
                label="Overdue Amount"
                value={formatCurrency(
                    summary.overdueAmount
                )}
                iconClass="bg-rose-100 text-rose-700"
            />
        </>
    );
}

        return (
            <>
                <SummaryCard
                    icon={Users}
                    label="Employees"
                    value={
                        summary.totalEmployees ||
                        0
                    }
                />

                <SummaryCard
                    icon={Activity}
                    label="Working"
                    value={
                        summary.working ||
                        0
                    }
                    iconClass="bg-emerald-100 text-emerald-700"
                />

                <SummaryCard
                    icon={UserCheck}
                    label="Free"
                    value={
                        summary.free ||
                        0
                    }
                    iconClass="bg-blue-100 text-blue-700"
                />

                <SummaryCard
                    icon={AlertTriangle}
                    label="High Workload"
                    value={
                        summary.highWorkload ||
                        0
                    }
                    iconClass="bg-rose-100 text-rose-700"
                />
            </>
        );
    };

    const renderTable = () => {
        if (
            activeTab ===
            "pending-overdue"
        ) {
            return (
                <table className="min-w-[1650px] w-full">
                    <thead className="bg-slate-50">
                        <tr>
                            {[
                                "Type",
                                "Code",
                                "Work",
                                "Client",
                                "Assigned To",
                                "Priority",
                                "Status",
                                "Due Date",
                                "Overdue",
                                "Estimated",
                                "Spent",
                            ].map(
                                (column) => (
                                    <th
                                        key={
                                            column
                                        }
                                        className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400"
                                    >
                                        {
                                            column
                                        }
                                    </th>
                                )
                            )}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {filteredRecords.map(
                            (item) => (
                                <tr
                                    key={`${item.type}-${item.id}`}
                                    className={
                                        item.overdue
                                            ? "bg-rose-50/30 hover:bg-rose-50/60"
                                            : "hover:bg-slate-50/70"
                                    }
                                >
                                    <td className="px-4 py-4">
                                        <span
                                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${
                                                item.type ===
                                                "Task"
                                                    ? "bg-violet-50 text-violet-700 ring-violet-600/10"
                                                    : "bg-blue-50 text-blue-700 ring-blue-600/10"
                                            }`}
                                        >
                                            {
                                                item.type
                                            }
                                        </span>
                                    </td>

                                    <td className="px-4 py-4 text-xs font-semibold text-violet-700">
                                        {item.code ||
                                            "—"}
                                    </td>

                                    <td className="px-4 py-4">
                                        <p className="max-w-[280px] truncate text-xs font-semibold text-slate-900">
                                            {item.title ||
                                                "—"}
                                        </p>
                                    </td>

                                    <td className="px-4 py-4">
                                        <p className="text-xs font-medium">
                                            {item.clientName ||
                                                "Internal"}
                                        </p>

                                        <p className="mt-1 text-[10px] text-slate-400">
                                            {item.clientCode ||
                                                "—"}
                                        </p>
                                    </td>

                                    <td className="px-4 py-4">
                                        <p className="text-xs font-medium">
                                            {item.employeeName ||
                                                "Unassigned"}
                                        </p>

                                        <p className="mt-1 text-[10px] text-slate-400">
                                            {item.employeeCode ||
                                                "—"}
                                        </p>
                                    </td>

                                    <td className="px-4 py-4">
                                        <Badge
                                            value={
                                                item.priority
                                            }
                                            type="priority"
                                        />
                                    </td>

                                    <td className="px-4 py-4">
                                        <Badge
                                            value={
                                                item.status
                                            }
                                        />
                                    </td>

                                    <td className="px-4 py-4 text-xs whitespace-nowrap">
                                        {formatDate(
                                            item.dueDate
                                        )}
                                    </td>

                                    <td className="px-4 py-4">
                                        {item.overdue ? (
                                            <div>
                                                <p className="text-xs font-semibold text-rose-600">
                                                    {Number(
                                                        item.overdueDays ||
                                                            0
                                                    )}{" "}
                                                    days
                                                </p>

                                                <p className="mt-1 text-[10px] text-rose-400">
                                                    Overdue
                                                </p>
                                            </div>
                                        ) : (
                                            <span className="text-xs font-medium text-emerald-600">
                                                On Track
                                            </span>
                                        )}
                                    </td>

                                    <td className="px-4 py-4 text-xs">
                                        {formatMinutes(
                                            item.estimatedMinutes
                                        )}
                                    </td>

                                    <td className="px-4 py-4 text-xs font-semibold">
                                        {formatMinutes(
                                            item.spentMinutes
                                        )}
                                    </td>
                                </tr>
                            )
                        )}
                    </tbody>
                </table>
            );
        }

        if (
            activeTab ===
            "client-attention"
        ) {
            return (
                <table className="min-w-[1450px] w-full">
                    <thead className="bg-slate-50">
                        <tr>
                            {[
                                "Client",
                                "Pending Tasks",
                                "Overdue Tasks",
                                "Open Tickets",
                                "Overdue Tickets",
                                "High Priority",
                                "Support Time",
                                "Attention Score",
                            ].map(
                                (column) => (
                                    <th
                                        key={
                                            column
                                        }
                                        className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400"
                                    >
                                        {
                                            column
                                        }
                                    </th>
                                )
                            )}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {filteredRecords.map(
                            (item) => (
                                <tr
                                    key={
                                        item.id
                                    }
                                    className="hover:bg-slate-50/70"
                                >
                                    <td className="px-4 py-4">
                                        <p className="text-xs font-semibold text-slate-900">
                                            {item.clientName ||
                                                "—"}
                                        </p>

                                        <p className="mt-1 text-[10px] text-slate-400">
                                            {item.clientCode ||
                                                "—"}
                                        </p>

                                        {item.contactPerson && (
                                            <p className="mt-1 text-[10px] text-slate-400">
                                                {
                                                    item.contactPerson
                                                }
                                            </p>
                                        )}
                                    </td>

                                    <td className="px-4 py-4 text-xs font-semibold text-amber-600">
                                        {item.pendingTasks ||
                                            0}
                                    </td>

                                    <td className="px-4 py-4 text-xs font-semibold text-rose-600">
                                        {item.overdueTasks ||
                                            0}
                                    </td>

                                    <td className="px-4 py-4 text-xs font-semibold text-blue-600">
                                        {item.openTickets ||
                                            0}
                                    </td>

                                    <td className="px-4 py-4 text-xs font-semibold text-rose-600">
                                        {item.overdueTickets ||
                                            0}
                                    </td>

                                    <td className="px-4 py-4 text-xs font-semibold text-orange-600">
                                        {item.highPriorityTickets ||
                                            0}
                                    </td>

                                    <td className="px-4 py-4 text-xs font-semibold">
                                        {formatMinutes(
                                            item.totalWorkMinutes
                                        )}
                                    </td>

                                    <td className="px-4 py-4">
                                        <span
                                            className={`inline-flex min-w-[48px] justify-center rounded-lg px-2.5 py-1.5 text-xs font-bold ${
                                                Number(
                                                    item.attentionScore ||
                                                        0
                                                ) >=
                                                10
                                                    ? "bg-rose-100 text-rose-700"
                                                    : Number(
                                                            item.attentionScore ||
                                                                0
                                                        ) >=
                                                        5
                                                      ? "bg-amber-100 text-amber-700"
                                                      : "bg-blue-100 text-blue-700"
                                            }`}
                                        >
                                            {item.attentionScore ||
                                                0}
                                        </span>
                                    </td>
                                </tr>
                            )
                        )}
                    </tbody>
                </table>
            );
        }
        if (activeTab === "amc-risk") {
    return (
        <table className="min-w-[1750px] w-full">
            <thead className="bg-slate-50">
                <tr>
                    {[
                        "Client",
                        "Product",
                        "Invoice",
                        "Contract",
                        "AMC Start",
                        "AMC Expiry",
                        "Days Left",
                        "AMC Value",
                        "Paid",
                        "Outstanding",
                        "Renewal Risk",
                        "Payment Risk",
                        "Assigned To",
                        "Next Follow-up",
                    ].map((column) => (
                        <th
                            key={column}
                            className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400"
                        >
                            {column}
                        </th>
                    ))}
                </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((item) => (
                    <tr
                        key={item.id}
                        className={
                            ["Expired", "Critical"].includes(
                                item.renewalRisk
                            )
                                ? "bg-rose-50/30 hover:bg-rose-50/60"
                                : "hover:bg-slate-50/70"
                        }
                    >
                        <td className="px-4 py-4">
                            <p className="text-xs font-semibold text-slate-900">
                                {item.clientName || "—"}
                            </p>

                            <p className="mt-1 text-[10px] text-slate-400">
                                {item.clientCode || "—"}
                            </p>
                        </td>

                        <td className="px-4 py-4">
                            <p className="text-xs font-medium">
                                {item.productName || "—"}
                            </p>

                            <p className="mt-1 text-[10px] text-slate-400">
                                {item.productVersion || "—"}
                            </p>
                        </td>

                        <td className="px-4 py-4 text-xs font-semibold text-violet-700">
                            {item.invoiceCode || "—"}
                        </td>

                        <td className="px-4 py-4 text-xs">
                            {item.contractCode || "—"}
                        </td>

                        <td className="px-4 py-4 text-xs whitespace-nowrap">
                            {formatDate(item.contractStartDate)}
                        </td>

                        <td className="px-4 py-4 text-xs whitespace-nowrap">
                            {formatDate(item.contractExpiryDate)}
                        </td>

                        <td className="px-4 py-4">
                            {item.daysLeft === null ? (
                                <span className="text-xs text-slate-400">
                                    —
                                </span>
                            ) : item.daysLeft < 0 ? (
                                <span className="text-xs font-semibold text-rose-600">
                                    Expired {Math.abs(item.daysLeft)} days ago
                                </span>
                            ) : (
                                <span
                                    className={`text-xs font-semibold ${
                                        item.daysLeft <= 7
                                            ? "text-rose-600"
                                            : item.daysLeft <= 30
                                              ? "text-amber-600"
                                              : "text-emerald-600"
                                    }`}
                                >
                                    {item.daysLeft} days
                                </span>
                            )}
                        </td>

                        <td className="px-4 py-4 text-xs font-semibold">
                            {formatCurrency(item.totalAmount)}
                        </td>

                        <td className="px-4 py-4 text-xs font-semibold text-emerald-600">
                            {formatCurrency(item.paidAmount)}
                        </td>

                        <td className="px-4 py-4 text-xs font-semibold text-rose-600">
                            {formatCurrency(item.pendingAmount)}
                        </td>

                        <td className="px-4 py-4">
                            <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                    item.renewalRisk === "Expired"
                                        ? "bg-rose-100 text-rose-700"
                                        : item.renewalRisk === "Critical"
                                          ? "bg-orange-100 text-orange-700"
                                          : item.renewalRisk === "Expiring Soon"
                                            ? "bg-amber-100 text-amber-700"
                                            : "bg-emerald-100 text-emerald-700"
                                }`}
                            >
                                {item.renewalRisk}
                            </span>
                        </td>

                        <td className="px-4 py-4">
                            {item.paymentOverdue ? (
                                <span className="text-xs font-semibold text-rose-600">
                                    Payment Overdue
                                </span>
                            ) : (
                                <span className="text-xs text-emerald-600">
                                    Normal
                                </span>
                            )}
                        </td>

                        <td className="px-4 py-4 text-xs">
                            {item.assignedEmployeeName || "—"}
                        </td>

                        <td className="px-4 py-4 text-xs whitespace-nowrap">
                            {formatDate(item.nextFollowUpDate)}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
if (activeTab === "collections") {
    return (
        <table className="min-w-[1600px] w-full">
            <thead className="bg-slate-50">
                <tr>
                    {[
                        "Client",
                        "Invoice",
                        "Invoice Date",
                        "Product",
                        "Contract",
                        "Due Date",
                        "Billed",
                        "Collected",
                        "Outstanding",
                        "Status",
                        "Overdue Days",
                    ].map((column) => (
                        <th
                            key={column}
                            className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400"
                        >
                            {column}
                        </th>
                    ))}
                </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((item) => (
                    <tr
                        key={item.id}
                        className={
                            item.isOverdue
                                ? "bg-rose-50/30 hover:bg-rose-50/60"
                                : "hover:bg-slate-50/70"
                        }
                    >
                        <td className="px-4 py-4">
                            <p className="text-xs font-semibold text-slate-900">
                                {item.clientName || "—"}
                            </p>

                            <p className="mt-1 text-[10px] text-slate-400">
                                {item.clientCode || "—"}
                            </p>
                        </td>

                        <td className="px-4 py-4 text-xs font-semibold text-violet-700">
                            {item.invoiceCode || "—"}
                        </td>

                        <td className="px-4 py-4 text-xs whitespace-nowrap">
                            {formatDate(item.invoiceDate)}
                        </td>

                        <td className="px-4 py-4 text-xs">
                            {item.productName || "—"}
                        </td>

                        <td className="px-4 py-4 text-xs">
                            {item.contractCode || "—"}
                        </td>

                        <td className="px-4 py-4 text-xs whitespace-nowrap">
                            {formatDate(item.dueDate)}
                        </td>

                        <td className="px-4 py-4 text-xs font-semibold">
                            {formatCurrency(item.totalAmount)}
                        </td>

                        <td className="px-4 py-4 text-xs font-semibold text-emerald-600">
                            {formatCurrency(item.paidAmount)}
                        </td>

                        <td className="px-4 py-4 text-xs font-semibold text-rose-600">
                            {formatCurrency(item.pendingAmount)}
                        </td>

                        <td className="px-4 py-4">
                            <Badge
                                value={item.collectionStatus}
                            />
                        </td>

                        <td className="px-4 py-4">
                            {item.isOverdue ? (
                                <span className="text-xs font-semibold text-rose-600">
                                    {item.overdueDays || 0} days
                                </span>
                            ) : (
                                <span className="text-xs text-emerald-600">
                                    On Track
                                </span>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

        return (
            <table className="min-w-[1650px] w-full">
                <thead className="bg-slate-50">
                    <tr>
                        {[
                            "Employee",
                            "Department",
                            "Status",
                            "Current Work",
                            "Current Client",
                            "Open Tasks",
                            "Open Tickets",
                            "Workload",
                            "Workload Level",
                            "Tracked Time",
                            "Last Activity",
                        ].map(
                            (column) => (
                                <th
                                    key={
                                        column
                                    }
                                    className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400"
                                >
                                    {
                                        column
                                    }
                                </th>
                            )
                        )}
                    </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                    {filteredRecords.map(
                        (item) => (
                            <tr
                                key={
                                    item.id
                                }
                                className={
                                    item.workloadLevel ===
                                    "High"
                                        ? "bg-rose-50/30 hover:bg-rose-50/60"
                                        : "hover:bg-slate-50/70"
                                }
                            >
                                <td className="px-4 py-4">
                                    <p className="text-xs font-semibold text-slate-900">
                                        {item.name ||
                                            "—"}
                                    </p>

                                    <p className="mt-1 text-[10px] text-slate-400">
                                        {item.employeeCode ||
                                            "—"}
                                    </p>
                                </td>

                                <td className="px-4 py-4">
                                    <p className="text-xs">
                                        {item.department ||
                                            "—"}
                                    </p>

                                    <p className="mt-1 text-[10px] text-slate-400">
                                        {item.role ||
                                            "—"}
                                    </p>
                                </td>

                                <td className="px-4 py-4">
                                    <Badge
                                        value={
                                            item.status
                                        }
                                    />
                                </td>

                                <td className="px-4 py-4">
                                    <p className="max-w-[240px] truncate text-xs font-medium">
                                        {item.currentTaskTitle ||
                                            item.currentTask ||
                                            "Available"}
                                    </p>

                                    <p className="mt-1 text-[10px] text-slate-400">
                                        {item.currentTaskCode ||
                                            "—"}
                                    </p>
                                </td>

                                <td className="px-4 py-4 text-xs">
                                    {item.currentClient ||
                                        "—"}
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold">
                                    {item.openTasks ||
                                        0}
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold">
                                    {item.openTickets ||
                                        0}
                                </td>

                                <td className="px-4 py-4 text-xs font-bold text-slate-900">
                                    {item.workload ||
                                        0}
                                </td>

                                <td className="px-4 py-4">
                                    <Badge
                                        value={
                                            item.workloadLevel
                                        }
                                        type="workload"
                                    />
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold">
                                    {formatMinutes(
                                        item.totalTrackedMinutes
                                    )}
                                </td>

                                <td className="px-4 py-4 text-xs whitespace-nowrap">
                                    {formatDate(
                                        item.lastActivityAt
                                    )}
                                </td>
                            </tr>
                        )
                    )}
                </tbody>
            </table>
        );
    };

    const getExportRows = () => {
        if (
            activeTab ===
            "overview"
        ) {
            const clients =
                summary.clients || {};

            const team =
                summary.team || {};

            const tasks =
                summary.tasks || {};

            const tickets =
                summary.tickets || {};

            const amc =
                summary.amc || {};

            const collections =
                summary.collections || {};

            return [
                {
                    Metric:
                        "Total Clients",
                    Value:
                        clients.total ||
                        0,
                },
                {
                    Metric:
                        "Active Clients",
                    Value:
                        clients.active ||
                        0,
                },
                {
                    Metric:
                        "Team Members",
                    Value:
                        team.total ||
                        0,
                },
                {
                    Metric:
                        "Working Employees",
                    Value:
                        team.working ||
                        0,
                },
                {
                    Metric:
                        "Free Employees",
                    Value:
                        team.free ||
                        0,
                },
                {
                    Metric:
                        "Pending Tasks",
                    Value:
                        tasks.pending ||
                        0,
                },
                {
                    Metric:
                        "Overdue Tasks",
                    Value:
                        tasks.overdue ||
                        0,
                },
                {
                    Metric:
                        "Open Tickets",
                    Value:
                        tickets.open ||
                        0,
                },
                {
                    Metric:
                        "Overdue Tickets",
                    Value:
                        tickets.overdue ||
                        0,
                },
                {
                    Metric:
                        "Active AMC",
                    Value:
                        amc.activeContracts ||
                        0,
                },
                {
                    Metric:
                        "Expiring AMC",
                    Value:
                        amc.expiringSoon ||
                        0,
                },
                {
                    Metric:
                        "Expired AMC",
                    Value:
                        amc.expiredContracts ||
                        0,
                },
                {
                    Metric:
                        "Total Receivable",
                    Value:
                        Number(
                            collections.totalReceivable ||
                                0
                        ),
                },
                {
                    Metric:
                        "Total Received",
                    Value:
                        Number(
                            collections.totalReceived ||
                                0
                        ),
                },
                {
                    Metric:
                        "Outstanding",
                    Value:
                        Number(
                            collections.totalOutstanding ||
                                0
                        ),
                },
                {
                    Metric:
                        "Overdue Invoices",
                    Value:
                        collections.overdueInvoices ||
                        0,
                },
            ];
        }

        if (
            activeTab ===
            "pending-overdue"
        ) {
            return filteredRecords.map(
                (item, index) => ({
                    "Sr No":
                        index + 1,

                    Type:
                        item.type ||
                        "",

                    Code:
                        item.code ||
                        "",

                    Work:
                        item.title ||
                        "",

                    "Client Code":
                        item.clientCode ||
                        "",

                    Client:
                        item.clientName ||
                        "",

                    "Employee Code":
                        item.employeeCode ||
                        "",

                    Employee:
                        item.employeeName ||
                        "",

                    Priority:
                        item.priority ||
                        "",

                    Status:
                        item.status ||
                        "",

                    "Due Date":
                        formatDate(
                            item.dueDate
                        ),

                    Overdue:
                        item.overdue
                            ? "Yes"
                            : "No",

                    "Overdue Days":
                        Number(
                            item.overdueDays ||
                                0
                        ),

                    "Estimated Minutes":
                        Number(
                            item.estimatedMinutes ||
                                0
                        ),

                    "Spent Minutes":
                        Number(
                            item.spentMinutes ||
                                0
                        ),
                })
            );
        }
        if (activeTab === "amc-risk") {
    return filteredRecords.map(
        (item, index) => ({
            "Sr No": index + 1,

            "Client Code":
                item.clientCode || "",

            Client:
                item.clientName || "",

            Product:
                item.productName || "",

            "Product Version":
                item.productVersion || "",

            "Invoice Code":
                item.invoiceCode || "",

            "Contract Code":
                item.contractCode || "",

            "AMC Start":
                formatDate(
                    item.contractStartDate
                ),

            "AMC Expiry":
                formatDate(
                    item.contractExpiryDate
                ),

            "Days Left":
                item.daysLeft ?? "",

            "AMC Value":
                Number(
                    item.totalAmount || 0
                ),

            Paid:
                Number(
                    item.paidAmount || 0
                ),

            Outstanding:
                Number(
                    item.pendingAmount || 0
                ),

            "Renewal Risk":
                item.renewalRisk || "",

            "Payment Overdue":
                item.paymentOverdue
                    ? "Yes"
                    : "No",

            "Assigned Employee":
                item.assignedEmployeeName ||
                "",

            "Reminder Status":
                item.reminderStatus || "",

            "Next Follow-up":
                formatDate(
                    item.nextFollowUpDate
                ),
        })
    );
}
if (activeTab === "collections") {
    return filteredRecords.map(
        (item, index) => ({
            "Sr No": index + 1,

            "Client Code":
                item.clientCode || "",

            Client:
                item.clientName || "",

            "Invoice Code":
                item.invoiceCode || "",

            "Invoice Date":
                formatDate(
                    item.invoiceDate
                ),

            Product:
                item.productName || "",

            "Contract Code":
                item.contractCode || "",

            "Due Date":
                formatDate(
                    item.dueDate
                ),

            Billed:
                Number(
                    item.totalAmount || 0
                ),

            Collected:
                Number(
                    item.paidAmount || 0
                ),

            Outstanding:
                Number(
                    item.pendingAmount || 0
                ),

            Status:
                item.collectionStatus ||
                "",

            Overdue:
                item.isOverdue
                    ? "Yes"
                    : "No",

            "Overdue Days":
                Number(
                    item.overdueDays || 0
                ),
        })
    );
}

        if (
            activeTab ===
            "client-attention"
        ) {
            return filteredRecords.map(
                (item, index) => ({
                    "Sr No":
                        index + 1,

                    "Client Code":
                        item.clientCode ||
                        "",

                    Client:
                        item.clientName ||
                        "",

                    "Contact Person":
                        item.contactPerson ||
                        "",

                    Mobile:
                        item.mobile ||
                        "",

                    "Pending Tasks":
                        Number(
                            item.pendingTasks ||
                                0
                        ),

                    "Overdue Tasks":
                        Number(
                            item.overdueTasks ||
                                0
                        ),

                    "Open Tickets":
                        Number(
                            item.openTickets ||
                                0
                        ),

                    "Overdue Tickets":
                        Number(
                            item.overdueTickets ||
                                0
                        ),

                    "High Priority Tickets":
                        Number(
                            item.highPriorityTickets ||
                                0
                        ),

                    "Support Minutes":
                        Number(
                            item.totalWorkMinutes ||
                                0
                        ),

                    "Attention Score":
                        Number(
                            item.attentionScore ||
                                0
                        ),
                })
            );
        }


        return filteredRecords.map(
            (item, index) => ({
                "Sr No":
                    index + 1,

                "Employee Code":
                    item.employeeCode ||
                    "",

                Employee:
                    item.name ||
                    "",

                Department:
                    item.department ||
                    "",

                Role:
                    item.role ||
                    "",

                Status:
                    item.status ||
                    "",

                "Current Task":
                    item.currentTaskTitle ||
                    item.currentTask ||
                    "",

                "Current Client":
                    item.currentClient ||
                    "",

                "Current Project":
                    item.currentProject ||
                    "",

                "Open Tasks":
                    Number(
                        item.openTasks ||
                            0
                    ),

                "Open Tickets":
                    Number(
                        item.openTickets ||
                            0
                    ),

                Workload:
                    Number(
                        item.workload ||
                            0
                    ),

                "Workload Level":
                    item.workloadLevel ||
                    "",

                "Active Minutes":
                    Number(
                        item.activeMinutes ||
                            0
                    ),

                "Tracked Minutes":
                    Number(
                        item.totalTrackedMinutes ||
                            0
                    ),

                "Last Activity":
                    formatDate(
                        item.lastActivityAt
                    ),
            })
        );
    };

    const exportExcel = () => {
        const rows =
            getExportRows();

        if (!rows.length) {
            window.alert(
                "No report data available to export."
            );

            return;
        }

      const sheetNames = {
    overview:
        "Management Overview",

    "pending-overdue":
        "Pending Overdue",

    "client-attention":
        "Client Attention",

    "team-utilization":
        "Team Utilization",

    "amc-risk":
        "AMC Risk",

    collections:
        "Collections",
};

        const worksheet =
            XLSX.utils.json_to_sheet(
                rows
            );

        const workbook =
            XLSX.utils.book_new();

        worksheet["!cols"] =
            Object.keys(
                rows[0]
            ).map((key) => ({
                wch: Math.min(
                    35,
                    Math.max(
                        12,
                        key.length + 2,
                        ...rows.map(
                            (row) =>
                                String(
                                    row[
                                        key
                                    ] ??
                                        ""
                                ).length
                        )
                    )
                ),
            }));

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            sheetNames[activeTab]
        );

        XLSX.writeFile(
            workbook,
            `Management-${sheetNames[
                activeTab
            ].replaceAll(
                " ",
                "-"
            )}-${new Date()
                .toISOString()
                .slice(0, 10)}.xlsx`
        );
    };

    const activeTitle =
        TABS.find(
            (tab) =>
                tab.id === activeTab
        )?.label ||
        "Management Report";

    return (
        <div className="p-6">
            {/* HEADER */}
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
                        Reports
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                        Management Reporting
                        Center
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                        Business overview,
                        pending work, client
                        attention and team
                        utilization for management
                        decisions.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {onBack && (
                        <button
                            type="button"
                            onClick={
                                onBack
                            }
                            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Back
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() =>
                            loadReport(
                                activeTab
                            )
                        }
                        className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        <RefreshCw
                            size={14}
                        />
                        Refresh
                    </button>

                    <button
                        type="button"
                        onClick={
                            exportExcel
                        }
                        className="flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                        <Download
                            size={14}
                        />
                        Export Excel
                    </button>
                </div>
            </div>

            {/* TABS */}
            <div className="mt-6 overflow-x-auto">
                <div className="inline-flex min-w-max gap-1 rounded-xl border border-slate-200 bg-white p-1">
                    {TABS.map(
                        (tab) => (
                            <button
                                key={
                                    tab.id
                                }
                                type="button"
                                onClick={() =>
                                    changeTab(
                                        tab.id
                                    )
                                }
                                className={`rounded-lg px-4 py-2.5 text-xs font-semibold transition ${
                                    activeTab ===
                                    tab.id
                                        ? "bg-violet-600 text-white shadow-sm"
                                        : "text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                {
                                    tab.label
                                }
                            </button>
                        )
                    )}
                </div>
            </div>

            {/* LOADING */}
            {loading ? (
                <div className="mt-6 flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
                    <div className="text-center">
                        <RefreshCw
                            size={24}
                            className="mx-auto animate-spin text-violet-600"
                        />

                        <p className="mt-3 text-xs text-slate-500">
                            Loading{" "}
                            {activeTitle}
                            ...
                        </p>
                    </div>
                </div>
            ) : error ? (
                <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5">
                    <div className="flex gap-3">
                        <AlertTriangle
                            size={20}
                            className="text-rose-600"
                        />

                        <div>
                            <p className="text-sm font-semibold text-rose-700">
                                Unable to
                                load report
                            </p>

                            <p className="mt-1 text-xs text-rose-600">
                                {error}
                            </p>
                        </div>
                    </div>
                </div>
            ) : activeTab ===
              "overview" ? (
                <div className="mt-6">
                    {renderOverview()}
                </div>
            ) : (
                <>
                    {/* CARDS */}
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {renderCards()}
                    </div>

                    {/* FILTERS */}
                    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="min-w-[260px] flex-1">
                                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                    Search
                                </label>

                                <div className="relative">
                                    <Search
                                        size={
                                            16
                                        }
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                    <input
                                        value={
                                            search
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setSearch(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Search client, employee, work, code..."
                                        className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-xs outline-none focus:border-violet-400"
                                    />
                                </div>
                            </div>

                            {activeTab ===
                                "pending-overdue" && (
                                <>
                                    <div className="min-w-[140px]">
                                        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                            Type
                                        </label>

                                        <select
                                            value={
                                                workType
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setWorkType(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs"
                                        >
                                            <option value="All">
                                                All
                                                Work
                                            </option>

                                            <option value="Task">
                                                Tasks
                                            </option>

                                            <option value="Ticket">
                                                Tickets
                                            </option>
                                        </select>
                                    </div>

                                    <div className="min-w-[150px]">
                                        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                            Priority
                                        </label>

                                        <select
                                            value={
                                                priority
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setPriority(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs"
                                        >
                                            <option value="All">
                                                All
                                                Priority
                                            </option>

                                            <option value="Critical">
                                                Critical
                                            </option>

                                            <option value="Urgent">
                                                Urgent
                                            </option>

                                            <option value="High">
                                                High
                                            </option>

                                            <option value="Medium">
                                                Medium
                                            </option>

                                            <option value="Low">
                                                Low
                                            </option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {activeTab ===
                                "team-utilization" && (
                                <div className="min-w-[170px]">
                                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                        Workload
                                    </label>

                                    <select
                                        value={
                                            workloadLevel
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setWorkloadLevel(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs"
                                    >
                                        <option value="All">
                                            All
                                            Workload
                                        </option>

                                        <option value="Available">
                                            Available
                                        </option>

                                        <option value="Normal">
                                            Normal
                                        </option>

                                        <option value="Medium">
                                            Medium
                                        </option>

                                        <option value="High">
                                            High
                                        </option>
                                    </select>
                                </div>
                            )}
                            {activeTab === "amc-risk" && (
    <div className="min-w-[170px]">
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Renewal Risk
        </label>

        <select
            value={amcRisk}
            onChange={(event) =>
                setAmcRisk(event.target.value)
            }
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs"
        >
            <option value="All">
                All AMC
            </option>

            <option value="Normal">
                Normal
            </option>

            <option value="Expiring Soon">
                Expiring Soon
            </option>

            <option value="Critical">
                Critical
            </option>

            <option value="Expired">
                Expired
            </option>
        </select>
    </div>
)}
{activeTab === "collections" && (
    <div className="min-w-[170px]">
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Collection Status
        </label>

        <select
            value={collectionStatus}
            onChange={(event) =>
                setCollectionStatus(
                    event.target.value
                )
            }
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs"
        >
            <option value="All">
                All Status
            </option>

            <option value="Paid">
                Paid
            </option>

            <option value="Partially Paid">
                Partially Paid
            </option>

            <option value="Pending">
                Pending
            </option>

            <option value="Overdue">
                Overdue
            </option>
        </select>
    </div>
)}

                            <button
                                type="button"
                                onClick={
                                    clearFilters
                                }
                                className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                <X
                                    size={
                                        14
                                    }
                                />
                                Clear
                            </button>
                        </div>
                    </div>

                    {/* TABLE */}
                    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-950">
                                    {
                                        activeTitle
                                    }
                                </h3>

                                <p className="mt-1 text-xs text-slate-500">
                                    {
                                        filteredRecords.length
                                    }{" "}
                                    records
                                    found.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    exportExcel
                                }
                                className="flex h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                            >
                                <Download
                                    size={
                                        14
                                    }
                                />
                                Export
                                Excel
                            </button>
                        </div>

                        {filteredRecords.length ===
                        0 ? (
                            <div className="px-5 py-14 text-center">
                                <CheckCircle2
                                    size={
                                        28
                                    }
                                    className="mx-auto text-slate-300"
                                />

                                <p className="mt-3 text-sm font-medium text-slate-700">
                                    No
                                    management
                                    records
                                    found.
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                    Try
                                    changing
                                    the
                                    selected
                                    filters.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                {renderTable()}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}