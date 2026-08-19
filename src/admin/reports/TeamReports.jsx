import { useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    CheckCircle2,
    Clock3,
    Download,
    Filter,
    RefreshCw,
    Search,
    UserCheck,
    Users,
    X,
    BriefcaseBusiness,
    TicketCheck,
    Building2,
    ListTodo,
} from "lucide-react";
import * as XLSX from "xlsx";

const API_URL = "http://localhost:5000";

const getAuthToken = () =>
    localStorage.getItem("client-connect-token") ||
    sessionStorage.getItem("client-connect-token") ||
    "";

const TABS = [
    { id: "summary", label: "Team Summary" },
    { id: "performance", label: "Performance" },
    { id: "client-work", label: "Client Work" },
    { id: "tasks", label: "Tasks" },
    { id: "tickets", label: "Tickets" },
];

function formatMinutes(minutes) {
    const value = Number(minutes || 0);

    if (!value) return "0m";

    const hours = Math.floor(value / 60);
    const remaining = value % 60;

    if (!hours) return `${remaining}m`;

    return remaining
        ? `${hours}h ${remaining}m`
        : `${hours}h`;
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

function getStatusClass(status) {
    const normalized = String(status || "").toLowerCase();

    if (
        ["working", "completed", "resolved", "verified", "closed"].includes(
            normalized
        )
    ) {
        return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";
    }

    if (["free", "assigned"].includes(normalized)) {
        return "bg-blue-50 text-blue-700 ring-blue-600/10";
    }

    if (["in progress", "testing"].includes(normalized)) {
        return "bg-violet-50 text-violet-700 ring-violet-600/10";
    }

    if (
        [
            "break",
            "pending",
            "new",
            "waiting for client",
            "on hold",
        ].includes(normalized)
    ) {
        return "bg-amber-50 text-amber-700 ring-amber-600/10";
    }

    if (["leave"].includes(normalized)) {
        return "bg-purple-50 text-purple-700 ring-purple-600/10";
    }

    if (["offline", "cancelled"].includes(normalized)) {
        return "bg-slate-100 text-slate-600 ring-slate-500/10";
    }

    return "bg-slate-100 text-slate-600 ring-slate-500/10";
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

function Badge({ value, type = "status" }) {
    return (
        <span
            className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${
                type === "priority"
                    ? getPriorityClass(value)
                    : getStatusClass(value)
            }`}
        >
            {value || "—"}
        </span>
    );
}

function SummaryCard({
    icon: Icon,
    label,
    value,
    iconClass = "bg-violet-100 text-violet-700",
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
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
                </div>
            </div>
        </div>
    );
}

export default function TeamReports({ onBack }) {
    const [activeTab, setActiveTab] = useState("summary");

    const [records, setRecords] = useState([]);
    const [reportSummary, setReportSummary] = useState({});

    const [employees, setEmployees] = useState([]);
    const [clients, setClients] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");

    const [employeeId, setEmployeeId] = useState("");
    const [clientId, setClientId] = useState("");

    const [employeeStatus, setEmployeeStatus] = useState("All");
    const [workStatus, setWorkStatus] = useState("All");
    const [priority, setPriority] = useState("All");

    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
    };

    const loadEmployees = async () => {
        try {
            const response = await fetch(
                `${API_URL}/api/employee/employees`,
                { headers }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                return;
            }

            const source = Array.isArray(result.data)
                ? result.data
                : Array.isArray(result.employees)
                    ? result.employees
                    : [];

            setEmployees(
                source
                    .filter(
                        (employee) =>
                            employee?._id &&
                            employee.isActive !== false
                    )
                    .sort((a, b) =>
                        String(a.name || "").localeCompare(
                            String(b.name || "")
                        )
                    )
            );
        } catch (error) {
            console.error("Load team employees error:", error);
        }
    };

    const loadClients = async () => {
        try {
            const response = await fetch(
                `${API_URL}/api/reports/clients`,
                { headers }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                return;
            }

            const source = Array.isArray(result.data)
                ? result.data
                : [];

            setClients(
                source
                    .filter((client) => client?.id)
                    .sort((a, b) =>
                        String(a.companyName || "").localeCompare(
                            String(b.companyName || "")
                        )
                    )
            );
        } catch (error) {
            console.error("Load team clients error:", error);
        }
    };

    const loadReport = async (tab = activeTab) => {
        try {
            setLoading(true);
            setError("");

            const params = new URLSearchParams();

            let endpoint = "/api/reports/team/summary";

            if (tab === "performance") {
                endpoint = "/api/reports/team";

                if (employeeStatus !== "All") {
                    params.set("status", employeeStatus);
                }
            }

            if (tab === "client-work") {
                endpoint = "/api/reports/team/client-work";
            }

            if (tab === "tasks") {
                endpoint = "/api/reports/team/tasks";

                if (workStatus !== "All") {
                    params.set("status", workStatus);
                }

                if (priority !== "All") {
                    params.set("priority", priority);
                }
            }

            if (tab === "tickets") {
                endpoint = "/api/reports/team/tickets";

                if (workStatus !== "All") {
                    params.set("status", workStatus);
                }

                if (priority !== "All") {
                    params.set("priority", priority);
                }
            }

            if (
                employeeId &&
                tab !== "summary"
            ) {
                params.set("employeeId", employeeId);
            }

            if (
                clientId &&
                ["client-work", "tasks", "tickets"].includes(tab)
            ) {
                params.set("clientId", clientId);
            }

            if (
                search.trim() &&
                ["tasks", "tickets"].includes(tab)
            ) {
                params.set("search", search.trim());
            }

            if (
                fromDate &&
                tab !== "summary"
            ) {
                params.set("fromDate", fromDate);
            }

            if (
                toDate &&
                tab !== "summary"
            ) {
                params.set("toDate", toDate);
            }

            const query = params.toString();

            const response = await fetch(
                `${API_URL}${endpoint}${query ? `?${query}` : ""}`,
                { headers }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    "Unable to load Team Report."
                );
            }

            setRecords(
                Array.isArray(result.data)
                    ? result.data
                    : []
            );

            setReportSummary(
                result.summary &&
                    typeof result.summary === "object"
                    ? result.summary
                    : {}
            );
        } catch (error) {
            console.error("Load team reporting center error:", error);

            setError(
                error.message ||
                "Unable to load Team Report."
            );

            setRecords([]);
            setReportSummary({});
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEmployees();
        loadClients();
    }, []);

    useEffect(() => {
        loadReport(activeTab);
    }, [activeTab]);

    const displayedRecords = useMemo(() => {
        const value = search.trim().toLowerCase();

        if (
            !value ||
            ["tasks", "tickets"].includes(activeTab)
        ) {
            return records;
        }

        return records.filter((item) =>
            [
                item.employeeCode,
                item.name,
                item.employeeName,
                item.department,
                item.role,
                item.status,
                item.currentTask,
                item.currentTaskCode,
                item.currentTaskTitle,
                item.currentClient,
                item.currentProject,
                item.clientCode,
                item.clientName,
            ].some((field) =>
                String(field || "")
                    .toLowerCase()
                    .includes(value)
            )
        );
    }, [records, search, activeTab]);

    const performanceSummary = useMemo(() => {
        if (activeTab !== "performance") {
            return {};
        }

        return displayedRecords.reduce(
            (result, employee) => {
                result.total += 1;

                if (employee.status === "Working") {
                    result.working += 1;
                }

                if (employee.status === "Free") {
                    result.free += 1;
                }

                result.completedTasks += Number(
                    employee.completedTasks || 0
                );

                result.pendingTasks += Number(
                    employee.pendingTasks || 0
                );

                result.resolvedTickets += Number(
                    employee.resolvedTickets || 0
                );

                result.openTickets += Number(
                    employee.openTickets || 0
                );

                result.workedMinutes += Number(
                    employee.totalWorkedMinutes || 0
                );

                return result;
            },
            {
                total: 0,
                working: 0,
                free: 0,
                completedTasks: 0,
                pendingTasks: 0,
                resolvedTickets: 0,
                openTickets: 0,
                workedMinutes: 0,
            }
        );
    }, [activeTab, displayedRecords]);

    const changeTab = (tab) => {
        setActiveTab(tab);

        setSearch("");
        setEmployeeId("");
        setClientId("");
        setEmployeeStatus("All");
        setWorkStatus("All");
        setPriority("All");
        setFromDate("");
        setToDate("");
    };

    const clearFilters = () => {
        setSearch("");
        setEmployeeId("");
        setClientId("");
        setEmployeeStatus("All");
        setWorkStatus("All");
        setPriority("All");
        setFromDate("");
        setToDate("");

        setTimeout(() => {
            loadReport(activeTab);
        }, 0);
    };

    const renderCards = () => {
        if (activeTab === "summary") {
            return (
                <>
                    <SummaryCard
                        icon={Users}
                        label="Team Members"
                        value={reportSummary.totalEmployees || 0}
                    />

                    <SummaryCard
                        icon={UserCheck}
                        label="Working"
                        value={reportSummary.working || 0}
                        iconClass="bg-emerald-100 text-emerald-700"
                    />

                    <SummaryCard
                        icon={CheckCircle2}
                        label="Free"
                        value={reportSummary.free || 0}
                        iconClass="bg-blue-100 text-blue-700"
                    />

                    <SummaryCard
                        icon={AlertTriangle}
                        label="Overdue Work"
                        value={reportSummary.overdueWork || 0}
                        iconClass="bg-rose-100 text-rose-700"
                    />
                </>
            );
        }

        if (activeTab === "performance") {
            return (
                <>
                    <SummaryCard
                        icon={Users}
                        label="Employees"
                        value={performanceSummary.total || 0}
                    />

                    <SummaryCard
                        icon={CheckCircle2}
                        label="Completed Tasks"
                        value={performanceSummary.completedTasks || 0}
                        iconClass="bg-emerald-100 text-emerald-700"
                    />

                    <SummaryCard
                        icon={TicketCheck}
                        label="Resolved Tickets"
                        value={performanceSummary.resolvedTickets || 0}
                        iconClass="bg-blue-100 text-blue-700"
                    />

                    <SummaryCard
                        icon={Clock3}
                        label="Worked Time"
                        value={formatMinutes(
                            performanceSummary.workedMinutes
                        )}
                        iconClass="bg-amber-100 text-amber-700"
                    />
                </>
            );
        }

        if (activeTab === "client-work") {
            return (
                <>
                    <SummaryCard
                        icon={Building2}
                        label="Employee / Client"
                        value={
                            reportSummary.employeeClientPairs || 0
                        }
                    />

                    <SummaryCard
                        icon={ListTodo}
                        label="Tasks"
                        value={reportSummary.totalTasks || 0}
                    />

                    <SummaryCard
                        icon={TicketCheck}
                        label="Tickets"
                        value={reportSummary.totalTickets || 0}
                        iconClass="bg-blue-100 text-blue-700"
                    />

                    <SummaryCard
                        icon={Clock3}
                        label="Work Time"
                        value={formatMinutes(
                            reportSummary.totalMinutes
                        )}
                        iconClass="bg-emerald-100 text-emerald-700"
                    />
                </>
            );
        }

        if (activeTab === "tasks") {
            return (
                <>
                    <SummaryCard
                        icon={ListTodo}
                        label="Total Tasks"
                        value={reportSummary.totalTasks || 0}
                    />

                    <SummaryCard
                        icon={CheckCircle2}
                        label="Completed"
                        value={reportSummary.completed || 0}
                        iconClass="bg-emerald-100 text-emerald-700"
                    />

                    <SummaryCard
                        icon={Clock3}
                        label="Pending"
                        value={reportSummary.pending || 0}
                        iconClass="bg-amber-100 text-amber-700"
                    />

                    <SummaryCard
                        icon={AlertTriangle}
                        label="Overdue"
                        value={reportSummary.overdue || 0}
                        iconClass="bg-rose-100 text-rose-700"
                    />
                </>
            );
        }

        return (
            <>
                <SummaryCard
                    icon={TicketCheck}
                    label="Total Tickets"
                    value={reportSummary.totalTickets || 0}
                />

                <SummaryCard
                    icon={Clock3}
                    label="Open"
                    value={reportSummary.open || 0}
                    iconClass="bg-amber-100 text-amber-700"
                />

                <SummaryCard
                    icon={CheckCircle2}
                    label="Resolved"
                    value={reportSummary.resolved || 0}
                    iconClass="bg-emerald-100 text-emerald-700"
                />

                <SummaryCard
                    icon={AlertTriangle}
                    label="Overdue"
                    value={reportSummary.overdue || 0}
                    iconClass="bg-rose-100 text-rose-700"
                />
            </>
        );
    };

    const getExportRows = () => {
        if (activeTab === "summary") {
            return displayedRecords.map((item, index) => ({
                "Sr No": index + 1,
                "Employee Code": item.employeeCode || "",
                Employee: item.name || "",
                Department: item.department || "",
                Role: item.role || "",
                Status: item.status || "",
                "Current Task":
                    item.currentTaskTitle ||
                    item.currentTask ||
                    "",
                "Current Client": item.currentClient || "",
                "Current Project": item.currentProject || "",
                "Active Tasks": Number(item.activeTasks || 0),
                "Completed Tasks": Number(
                    item.completedTasks || 0
                ),
                "Overdue Tasks": Number(
                    item.overdueTasks || 0
                ),
                "Open Tickets": Number(
                    item.openTickets || 0
                ),
                "Resolved Tickets": Number(
                    item.resolvedTickets || 0
                ),
                "Overdue Tickets": Number(
                    item.overdueTickets || 0
                ),
                "Total Work Minutes": Number(
                    item.totalWorkMinutes || 0
                ),
            }));
        }

        if (activeTab === "performance") {
            return displayedRecords.map((item, index) => ({
                "Sr No": index + 1,
                "Employee Code": item.employeeCode || "",
                Employee: item.name || "",
                Department: item.department || "",
                Role: item.role || "",
                Status: item.status || "",
                "Current Work":
                    item.currentTaskTitle ||
                    item.currentTask ||
                    "",
                "Current Client": item.currentClient || "",
                "Total Tasks": Number(item.totalTasks || 0),
                "Completed Tasks": Number(
                    item.completedTasks || 0
                ),
                "Pending Tasks": Number(
                    item.pendingTasks || 0
                ),
                "Total Tickets": Number(
                    item.totalTickets || 0
                ),
                "Resolved Tickets": Number(
                    item.resolvedTickets || 0
                ),
                "Open Tickets": Number(
                    item.openTickets || 0
                ),
                "Attendance Days": Number(
                    item.attendanceDays || 0
                ),
                "Late Days": Number(item.late || 0),
                "Worked Minutes": Number(
                    item.totalWorkedMinutes || 0
                ),
            }));
        }

        if (activeTab === "client-work") {
            return displayedRecords.map((item, index) => ({
                "Sr No": index + 1,
                "Employee Code": item.employeeCode || "",
                Employee: item.employeeName || "",
                "Client Code": item.clientCode || "",
                Client: item.clientName || "",
                Tasks: Number(item.totalTasks || 0),
                "Completed Tasks": Number(
                    item.completedTasks || 0
                ),
                "Pending Tasks": Number(
                    item.pendingTasks || 0
                ),
                Tickets: Number(item.totalTickets || 0),
                "Resolved Tickets": Number(
                    item.resolvedTickets || 0
                ),
                "Open Tickets": Number(
                    item.openTickets || 0
                ),
                "Task Minutes": Number(
                    item.taskMinutes || 0
                ),
                "Ticket Minutes": Number(
                    item.ticketMinutes || 0
                ),
                "Total Minutes": Number(
                    item.totalMinutes || 0
                ),
                "Last Worked": formatDate(item.lastWorkedAt),
            }));
        }

        if (activeTab === "tasks") {
            return displayedRecords.map((item, index) => ({
                "Sr No": index + 1,
                "Task Code": item.taskCode || "",
                Task: item.title || "",
                Employee: item.assignedEmployeeName || "",
                "Employee Code":
                    item.assignedEmployeeCode || "",
                Client: item.clientName || "",
                Product: item.productName || "",
                Project: item.projectName || "",
                Priority: item.priority || "",
                Status: item.status || "",
                Progress: Number(item.progress || 0),
                "Start Date": formatDate(item.startDate),
                "Due Date": formatDate(item.dueDate),
                "Estimated Minutes": Number(
                    item.estimatedMinutes || 0
                ),
                "Spent Minutes": Number(
                    item.spentMinutes || 0
                ),
                Overdue: item.overdue ? "Yes" : "No",
                "Overdue Days": Number(
                    item.overdueDays || 0
                ),
            }));
        }

        return displayedRecords.map((item, index) => ({
            "Sr No": index + 1,
            "Ticket Code": item.ticketCode || "",
            Title: item.title || "",
            Employee: item.assignedEmployeeName || "",
            "Employee Code": item.assignedEmployeeCode || "",
            Client: item.clientName || "",
            Product: item.productName || "",
            Module: item.module || "",
            Category: item.category || "",
            Source: item.source || "",
            Priority: item.priority || "",
            Status: item.status || "",
            "Created Date": formatDate(item.createdAt),
            "Due Date": formatDate(item.dueDate),
            "Resolved Date": formatDate(
                item.resolvedAt || item.closedAt
            ),
            "Spent Minutes": Number(item.spentMinutes || 0),
            "Resolution Minutes": Number(
                item.resolutionMinutes || 0
            ),
            Overdue: item.overdue ? "Yes" : "No",
            "Overdue Days": Number(item.overdueDays || 0),
        }));
    };

    const exportExcel = () => {
        const rows = getExportRows();

        if (!rows.length) {
            window.alert("No report data available to export.");
            return;
        }

        const sheetNames = {
            summary: "Team Summary",
            performance: "Performance",
            "client-work": "Client Work",
            tasks: "Team Tasks",
            tickets: "Team Tickets",
        };

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();

        worksheet["!cols"] = Object.keys(rows[0]).map((key) => ({
            wch: Math.min(
                35,
                Math.max(
                    12,
                    key.length + 2,
                    ...rows.map((row) =>
                        String(row[key] ?? "").length
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
            `Team-${sheetNames[activeTab]}-${new Date()
                .toISOString()
                .slice(0, 10)}.xlsx`
        );
    };

    const renderTable = () => {
        if (activeTab === "summary") {
            return (
                <table className="min-w-[1700px] w-full">
                    <thead className="bg-slate-50">
                        <tr>
                            {[
                                "Employee",
                                "Department",
                                "Status",
                                "Current Work",
                                "Current Client",
                                "Active Tasks",
                                "Completed",
                                "Overdue Tasks",
                                "Open Tickets",
                                "Resolved",
                                "Overdue Tickets",
                                "Work Time",
                                "Last Activity",
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
                        {displayedRecords.map((item) => (
                            <tr
                                key={item.id}
                                className="hover:bg-slate-50/70"
                            >
                                <td className="px-4 py-4">
                                    <p className="text-xs font-semibold text-slate-900">
                                        {item.name || "—"}
                                    </p>
                                    <p className="mt-1 text-[10px] text-slate-400">
                                        {item.employeeCode || "—"}
                                    </p>
                                </td>

                                <td className="px-4 py-4 text-xs">
                                    {item.department || "—"}
                                </td>

                                <td className="px-4 py-4">
                                    <Badge value={item.status} />
                                </td>

                                <td className="px-4 py-4">
                                    <p className="max-w-[230px] truncate text-xs">
                                        {item.currentTaskTitle ||
                                            item.currentTask ||
                                            "Available for assignment"}
                                    </p>
                                </td>

                                <td className="px-4 py-4 text-xs">
                                    {item.currentClient || "—"}
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold">
                                    {item.activeTasks || 0}
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold text-emerald-600">
                                    {item.completedTasks || 0}
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold text-rose-600">
                                    {item.overdueTasks || 0}
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold text-amber-600">
                                    {item.openTickets || 0}
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold text-emerald-600">
                                    {item.resolvedTickets || 0}
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold text-rose-600">
                                    {item.overdueTickets || 0}
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold">
                                    {formatMinutes(
                                        item.totalWorkMinutes
                                    )}
                                </td>

                                <td className="px-4 py-4 text-xs whitespace-nowrap">
                                    {formatDate(item.lastActivityAt)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }

        if (activeTab === "performance") {
            return (
                <table className="min-w-[1600px] w-full">
                    <thead className="bg-slate-50">
                        <tr>
                            {[
                                "Employee",
                                "Department",
                                "Status",
                                "Current Work",
                                "Tasks",
                                "Completed",
                                "Pending",
                                "Tickets",
                                "Resolved",
                                "Open",
                                "Attendance",
                                "Late",
                                "Worked Time",
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
                        {displayedRecords.map((employee) => (
                            <tr
                                key={employee.id}
                                className="hover:bg-slate-50/70"
                            >
                                <td className="px-4 py-4">
                                    <p className="text-xs font-semibold">
                                        {employee.name}
                                    </p>
                                    <p className="mt-1 text-[10px] text-slate-400">
                                        {employee.employeeCode}
                                    </p>
                                </td>

                                <td className="px-4 py-4 text-xs">
                                    {employee.department || "—"}
                                </td>

                                <td className="px-4 py-4">
                                    <Badge value={employee.status} />
                                </td>

                                <td className="px-4 py-4">
                                    <p className="max-w-[220px] truncate text-xs">
                                        {employee.currentTaskTitle ||
                                            employee.currentTask ||
                                            "Available"}
                                    </p>
                                    <p className="mt-1 text-[10px] text-slate-400">
                                        {employee.currentClient || "—"}
                                    </p>
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold">
                                    {employee.totalTasks || 0}
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold text-emerald-600">
                                    {employee.completedTasks || 0}
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold text-amber-600">
                                    {employee.pendingTasks || 0}
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold">
                                    {employee.totalTickets || 0}
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold text-emerald-600">
                                    {employee.resolvedTickets || 0}
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold text-rose-600">
                                    {employee.openTickets || 0}
                                </td>

                                <td className="px-4 py-4 text-xs">
                                    {employee.attendanceDays || 0}
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold text-amber-600">
                                    {employee.late || 0}
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold">
                                    {formatMinutes(
                                        employee.totalWorkedMinutes
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }

        if (activeTab === "client-work") {
            return (
                <table className="min-w-[1450px] w-full">
                    <thead className="bg-slate-50">
                        <tr>
                            {[
                                "Employee",
                                "Client",
                                "Tasks",
                                "Completed",
                                "Pending",
                                "Tickets",
                                "Resolved",
                                "Open",
                                "Task Time",
                                "Ticket Time",
                                "Total Time",
                                "Last Worked",
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
                        {displayedRecords.map((item, index) => (
                            <tr
                                key={`${item.employeeId}-${item.clientId}-${index}`}
                                className="hover:bg-slate-50/70"
                            >
                                <td className="px-4 py-4">
                                    <p className="text-xs font-semibold">
                                        {item.employeeName || "Unassigned"}
                                    </p>
                                    <p className="mt-1 text-[10px] text-slate-400">
                                        {item.employeeCode || "—"}
                                    </p>
                                </td>

                                <td className="px-4 py-4">
                                    <p className="text-xs font-semibold">
                                        {item.clientName || "—"}
                                    </p>
                                    <p className="mt-1 text-[10px] text-slate-400">
                                        {item.clientCode || "—"}
                                    </p>
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold">
                                    {item.totalTasks || 0}
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold text-emerald-600">
                                    {item.completedTasks || 0}
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold text-amber-600">
                                    {item.pendingTasks || 0}
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold">
                                    {item.totalTickets || 0}
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold text-emerald-600">
                                    {item.resolvedTickets || 0}
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold text-rose-600">
                                    {item.openTickets || 0}
                                </td>

                                <td className="px-4 py-4 text-xs">
                                    {formatMinutes(item.taskMinutes)}
                                </td>

                                <td className="px-4 py-4 text-xs">
                                    {formatMinutes(item.ticketMinutes)}
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold text-violet-700">
                                    {formatMinutes(item.totalMinutes)}
                                </td>

                                <td className="px-4 py-4 text-xs whitespace-nowrap">
                                    {formatDate(item.lastWorkedAt)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }

        if (activeTab === "tasks") {
            return (
                <table className="min-w-[1800px] w-full">
                    <thead className="bg-slate-50">
                        <tr>
                            {[
                                "Task",
                                "Employee",
                                "Client",
                                "Product / Project",
                                "Priority",
                                "Status",
                                "Progress",
                                "Start",
                                "Due",
                                "Estimated",
                                "Spent",
                                "Overdue",
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
                        {displayedRecords.map((item) => (
                            <tr
                                key={item.id}
                                className={
                                    item.overdue
                                        ? "bg-rose-50/30 hover:bg-rose-50/60"
                                        : "hover:bg-slate-50/70"
                                }
                            >
                                <td className="px-4 py-4">
                                    <p className="max-w-[250px] truncate text-xs font-semibold">
                                        {item.title || "—"}
                                    </p>
                                    <p className="mt-1 text-[10px] text-violet-600">
                                        {item.taskCode || "—"}
                                    </p>
                                </td>

                                <td className="px-4 py-4">
                                    <p className="text-xs font-medium">
                                        {item.assignedEmployeeName ||
                                            "Unassigned"}
                                    </p>
                                    <p className="mt-1 text-[10px] text-slate-400">
                                        {item.assignedEmployeeCode || "—"}
                                    </p>
                                </td>

                                <td className="px-4 py-4 text-xs">
                                    {item.clientName || "Internal"}
                                </td>

                                <td className="px-4 py-4 text-xs">
                                    {item.productName ||
                                        item.projectName ||
                                        "—"}
                                </td>

                                <td className="px-4 py-4">
                                    <Badge
                                        value={item.priority}
                                        type="priority"
                                    />
                                </td>

                                <td className="px-4 py-4">
                                    <Badge value={item.status} />
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold">
                                    {Number(item.progress || 0)}%
                                </td>

                                <td className="px-4 py-4 text-xs whitespace-nowrap">
                                    {formatDate(item.startDate)}
                                </td>

                                <td className="px-4 py-4 text-xs whitespace-nowrap">
                                    {formatDate(item.dueDate)}
                                </td>

                                <td className="px-4 py-4 text-xs">
                                    {formatMinutes(
                                        item.estimatedMinutes
                                    )}
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold">
                                    {formatMinutes(item.spentMinutes)}
                                </td>

                                <td className="px-4 py-4 text-xs">
                                    {item.overdue ? (
                                        <span className="font-semibold text-rose-600">
                                            {item.overdueDays || 0} days
                                        </span>
                                    ) : (
                                        <span className="text-emerald-600">
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
            <table className="min-w-[1900px] w-full">
                <thead className="bg-slate-50">
                    <tr>
                        {[
                            "Ticket",
                            "Employee",
                            "Client",
                            "Product",
                            "Module",
                            "Priority",
                            "Status",
                            "Created",
                            "Due",
                            "Resolved",
                            "Spent",
                            "Resolution Time",
                            "Overdue",
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
                    {displayedRecords.map((item) => (
                        <tr
                            key={item.id}
                            className={
                                item.overdue
                                    ? "bg-rose-50/30 hover:bg-rose-50/60"
                                    : "hover:bg-slate-50/70"
                            }
                        >
                            <td className="px-4 py-4">
                                <p className="max-w-[260px] truncate text-xs font-semibold">
                                    {item.title || "—"}
                                </p>
                                <p className="mt-1 text-[10px] text-violet-600">
                                    {item.ticketCode || "—"}
                                </p>
                            </td>

                            <td className="px-4 py-4">
                                <p className="text-xs font-medium">
                                    {item.assignedEmployeeName ||
                                        "Unassigned"}
                                </p>
                                <p className="mt-1 text-[10px] text-slate-400">
                                    {item.assignedEmployeeCode || "—"}
                                </p>
                            </td>

                            <td className="px-4 py-4 text-xs">
                                {item.clientName || "—"}
                            </td>

                            <td className="px-4 py-4 text-xs">
                                {item.productName || "—"}
                            </td>

                            <td className="px-4 py-4 text-xs">
                                {item.module ||
                                    item.category ||
                                    "—"}
                            </td>

                            <td className="px-4 py-4">
                                <Badge
                                    value={item.priority}
                                    type="priority"
                                />
                            </td>

                            <td className="px-4 py-4">
                                <Badge value={item.status} />
                            </td>

                            <td className="px-4 py-4 text-xs whitespace-nowrap">
                                {formatDate(item.createdAt)}
                            </td>

                            <td className="px-4 py-4 text-xs whitespace-nowrap">
                                {formatDate(item.dueDate)}
                            </td>

                            <td className="px-4 py-4 text-xs whitespace-nowrap">
                                {formatDate(
                                    item.resolvedAt ||
                                        item.closedAt
                                )}
                            </td>

                            <td className="px-4 py-4 text-xs">
                                {formatMinutes(item.spentMinutes)}
                            </td>

                            <td className="px-4 py-4 text-xs">
                                {formatMinutes(
                                    item.resolutionMinutes
                                )}
                            </td>

                            <td className="px-4 py-4 text-xs">
                                {item.overdue ? (
                                    <span className="font-semibold text-rose-600">
                                        {item.overdueDays || 0} days
                                    </span>
                                ) : (
                                    <span className="text-emerald-600">
                                        On Track
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    const activeTitle =
        TABS.find((tab) => tab.id === activeTab)?.label ||
        "Team Report";

    return (
        <div className="p-6">
            {/* HEADER */}
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
                        Reports
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                        Team Reporting Center
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                        Employee performance, workload, client
                        activity, tasks, tickets and work-time
                        analysis.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Back
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => loadReport(activeTab)}
                        className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        <RefreshCw size={14} />
                        Refresh
                    </button>

                    <button
                        type="button"
                        onClick={exportExcel}
                        className="flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                        <Download size={14} />
                        Export Excel
                    </button>
                </div>
            </div>

            {/* TABS */}
            <div className="mt-6 overflow-x-auto">
                <div className="inline-flex min-w-max gap-1 rounded-xl border border-slate-200 bg-white p-1">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => changeTab(tab.id)}
                            className={`rounded-lg px-4 py-2.5 text-xs font-semibold transition ${
                                activeTab === tab.id
                                    ? "bg-violet-600 text-white shadow-sm"
                                    : "text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* CARDS */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {renderCards()}
            </div>

            {/* FILTERS */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="min-w-[240px] flex-1">
                        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Search
                        </label>

                        <div className="relative">
                            <Search
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        loadReport(activeTab);
                                    }
                                }}
                                placeholder="Search employee, client, task, ticket..."
                                className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-xs outline-none focus:border-violet-400"
                            />
                        </div>
                    </div>

                    {activeTab !== "summary" && (
                        <div className="min-w-[190px]">
                            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                Employee
                            </label>

                            <select
                                value={employeeId}
                                onChange={(event) =>
                                    setEmployeeId(event.target.value)
                                }
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs"
                            >
                                <option value="">
                                    All Employees
                                </option>

                                {employees.map((employee) => (
                                    <option
                                        key={employee._id}
                                        value={employee._id}
                                    >
                                        {employee.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {["client-work", "tasks", "tickets"].includes(
                        activeTab
                    ) && (
                        <div className="min-w-[200px]">
                            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                Client
                            </label>

                            <select
                                value={clientId}
                                onChange={(event) =>
                                    setClientId(event.target.value)
                                }
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs"
                            >
                                <option value="">
                                    All Clients
                                </option>

                                {clients.map((client) => (
                                    <option
                                        key={client.id}
                                        value={client.id}
                                    >
                                        {client.companyName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {activeTab === "performance" && (
                        <div className="min-w-[150px]">
                            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                Status
                            </label>

                            <select
                                value={employeeStatus}
                                onChange={(event) =>
                                    setEmployeeStatus(
                                        event.target.value
                                    )
                                }
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs"
                            >
                                <option value="All">All Status</option>
                                <option value="Working">Working</option>
                                <option value="Free">Free</option>
                                <option value="Break">Break</option>
                                <option value="Leave">Leave</option>
                                <option value="Offline">Offline</option>
                            </select>
                        </div>
                    )}

                    {["tasks", "tickets"].includes(activeTab) && (
                        <>
                            <div className="min-w-[170px]">
                                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                    Work Status
                                </label>

                                <select
                                    value={workStatus}
                                    onChange={(event) =>
                                        setWorkStatus(
                                            event.target.value
                                        )
                                    }
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs"
                                >
                                    <option value="All">
                                        All Status
                                    </option>

                                    <option value="New">New</option>
                                    <option value="Assigned">
                                        Assigned
                                    </option>
                                    <option value="In Progress">
                                        In Progress
                                    </option>
                                    <option value="Waiting for Client">
                                        Waiting for Client
                                    </option>
                                    <option value="Testing">
                                        Testing
                                    </option>
                                    <option value="Completed">
                                        Completed
                                    </option>
                                    <option value="Resolved">
                                        Resolved
                                    </option>
                                    <option value="Verified">
                                        Verified
                                    </option>
                                    <option value="Closed">
                                        Closed
                                    </option>
                                </select>
                            </div>

                            <div className="min-w-[140px]">
                                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                    Priority
                                </label>

                                <select
                                    value={priority}
                                    onChange={(event) =>
                                        setPriority(
                                            event.target.value
                                        )
                                    }
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs"
                                >
                                    <option value="All">
                                        All Priority
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

                    {activeTab !== "summary" && (
                        <>
                            <div>
                                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                    From
                                </label>

                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(event) =>
                                        setFromDate(
                                            event.target.value
                                        )
                                    }
                                    className="h-10 rounded-xl border border-slate-200 px-3 text-xs"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                    To
                                </label>

                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(event) =>
                                        setToDate(event.target.value)
                                    }
                                    className="h-10 rounded-xl border border-slate-200 px-3 text-xs"
                                />
                            </div>
                        </>
                    )}

                    <button
                        type="button"
                        onClick={() => loadReport(activeTab)}
                        className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white hover:bg-violet-700"
                    >
                        <Filter size={14} />
                        Apply
                    </button>

                    <button
                        type="button"
                        onClick={clearFilters}
                        className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                        <X size={14} />
                        Clear
                    </button>
                </div>
            </div>

            {/* TABLE */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-950">
                            {activeTitle}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                            {displayedRecords.length} records found.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={exportExcel}
                        className="flex h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                        <Download size={14} />
                        Export Excel
                    </button>
                </div>

                {loading ? (
                    <div className="flex min-h-[320px] items-center justify-center">
                        <div className="text-center">
                            <RefreshCw
                                size={22}
                                className="mx-auto animate-spin text-violet-600"
                            />

                            <p className="mt-3 text-xs text-slate-500">
                                Loading {activeTitle}...
                            </p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="p-6">
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                            <div className="flex gap-3">
                                <AlertTriangle
                                    size={18}
                                    className="text-rose-600"
                                />

                                <div>
                                    <p className="text-sm font-semibold text-rose-700">
                                        Unable to load report
                                    </p>

                                    <p className="mt-1 text-xs text-rose-600">
                                        {error}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : displayedRecords.length === 0 ? (
                    <div className="px-5 py-14 text-center">
                        <BriefcaseBusiness
                            size={26}
                            className="mx-auto text-slate-300"
                        />

                        <p className="mt-3 text-sm font-medium text-slate-700">
                            No team report records found.
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Try changing the selected filters.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        {renderTable()}
                    </div>
                )}
            </div>
        </div>
    );
}