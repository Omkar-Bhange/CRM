import { useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    Banknote,
    Building2,
    CheckCircle2,
    Clock3,
    Download,
    FileText,
    Filter,
    IndianRupee,
    RefreshCw,
    Search,
    Users,
    Wallet,
    X,
} from "lucide-react";
import * as XLSX from "xlsx";

const API_URL = "http://localhost:5000";

const getAuthToken = () =>
    localStorage.getItem("client-connect-token") ||
    sessionStorage.getItem("client-connect-token") ||
    "";

const TABS = [
    { id: "summary", label: "Client Summary" },
    { id: "amc", label: "AMC Report" },
    { id: "payments", label: "Payments" },
    { id: "outstanding", label: "Outstanding" },
    { id: "tickets", label: "Tickets" },
    { id: "work", label: "Work / Tasks" },
];

function money(value) {
    return Number(value || 0).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    });
}

function formatWorkMinutes(minutes) {
    const total = Number(minutes || 0);

    if (!total) return "0m";

    const hours = Math.floor(total / 60);
    const remaining = total % 60;

    if (!hours) {
        return `${remaining}m`;
    }

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

function getClientStatusClass(status) {
    if (status === "Active") {
        return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";
    }

    if (status === "Suspended") {
        return "bg-rose-50 text-rose-700 ring-rose-600/10";
    }

    return "bg-slate-100 text-slate-600 ring-slate-500/10";
}

function getPaymentStatusClass(status) {
    if (status === "Paid") {
        return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";
    }

    if (status === "Overdue") {
        return "bg-rose-50 text-rose-700 ring-rose-600/10";
    }

    if (status === "Partially Paid") {
        return "bg-amber-50 text-amber-700 ring-amber-600/10";
    }

    if (status === "Pending") {
        return "bg-orange-50 text-orange-700 ring-orange-600/10";
    }

    return "bg-slate-100 text-slate-600 ring-slate-500/10";
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

function StatusBadge({ status, type = "payment" }) {
    const css =
        type === "client"
            ? getClientStatusClass(status)
            : getPaymentStatusClass(status);

    return (
        <span
            className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${css}`}
        >
            {status || "—"}
        </span>
    );
}

export default function ClientReports({ onBack }) {
    const [activeTab, setActiveTab] = useState("summary");
const [ticketStatus, setTicketStatus] = useState("All");
const [workStatus, setWorkStatus] = useState("All");
const [priority, setPriority] = useState("All");
    const [records, setRecords] = useState([]);
    const [reportSummary, setReportSummary] = useState({});
    const [clientOutstandingSummary, setClientOutstandingSummary] =
        useState([]);

    const [clients, setClients] = useState([]);
    const [employees, setEmployees] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [selectedClientId, setSelectedClientId] = useState("");
    const [employeeId, setEmployeeId] = useState("");

    const [clientStatus, setClientStatus] = useState("All");
    const [amcStatus, setAmcStatus] = useState("All");
    const [paymentMode, setPaymentMode] = useState("All");

    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const [overdueOnly, setOverdueOnly] = useState(false);

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
            console.error("Load report employees error:", error);
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
            console.error("Load report clients error:", error);
        }
    };

    const loadReport = async (tab = activeTab) => {
        try {
            setLoading(true);
            setError("");

            const params = new URLSearchParams();

            if (search.trim()) {
                params.set("search", search.trim());
            }

            if (selectedClientId) {
                params.set("clientId", selectedClientId);
            }

            if (fromDate) {
                params.set("fromDate", fromDate);
            }

            if (toDate) {
                params.set("toDate", toDate);
            }

            let endpoint = "/api/reports/clients";

            if (tab === "summary") {
                if (clientStatus !== "All") {
                    params.set("status", clientStatus);
                }

                if (employeeId) {
                    params.set("employeeId", employeeId);
                }
            }

            if (tab === "amc") {
                endpoint = "/api/reports/clients/amc";

                if (amcStatus !== "All") {
                    params.set("status", amcStatus);
                }
            }

            if (tab === "payments") {
                endpoint = "/api/reports/clients/payments";

                if (paymentMode !== "All") {
                    params.set("mode", paymentMode);
                }
            }

            if (tab === "outstanding") {
                endpoint = "/api/reports/clients/outstanding";

                if (overdueOnly) {
                    params.set("overdueOnly", "true");
                }
            }

            if (tab === "tickets") {
    endpoint = "/api/reports/clients/tickets";

    if (employeeId) {
        params.set("employeeId", employeeId);
    }

    if (ticketStatus !== "All") {
        params.set("status", ticketStatus);
    }

    if (priority !== "All") {
        params.set("priority", priority);
    }
}

if (tab === "work") {
    endpoint = "/api/reports/clients/work";

    if (employeeId) {
        params.set("employeeId", employeeId);
    }

    if (workStatus !== "All") {
        params.set("status", workStatus);
    }

    if (priority !== "All") {
        params.set("priority", priority);
    }
}
            const query = params.toString();

            const response = await fetch(
                `${API_URL}${endpoint}${query ? `?${query}` : ""}`,
                { headers }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Unable to load client report."
                );
            }

            setRecords(
                Array.isArray(result.data)
                    ? result.data
                    : []
            );

            setReportSummary(
                result.summary && typeof result.summary === "object"
                    ? result.summary
                    : {}
            );

            setClientOutstandingSummary(
                Array.isArray(result.clientSummary)
                    ? result.clientSummary
                    : []
            );
        } catch (error) {
            console.error("Load client reporting center error:", error);

            setError(
                error.message ||
                "Unable to load client report."
            );

            setRecords([]);
            setReportSummary({});
            setClientOutstandingSummary([]);
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

    const summaryTabStats = useMemo(() => {
        if (activeTab !== "summary") {
            return {};
        }

        return records.reduce(
            (result, client) => {
                result.total += 1;

                if (client.status === "Active") {
                    result.active += 1;
                }

                result.openTickets += Number(
                    client.openTickets || 0
                );

                result.pendingTasks += Number(
                    client.pendingTasks || 0
                );

                return result;
            },
            {
                total: 0,
                active: 0,
                openTickets: 0,
                pendingTasks: 0,
            }
        );
    }, [activeTab, records]);

    const changeTab = (tab) => {
        setActiveTab(tab);
        setSearch("");
        setSelectedClientId("");
        setEmployeeId("");
        setClientStatus("All");
        setAmcStatus("All");
        setPaymentMode("All");
        setFromDate("");
        setToDate("");
        setOverdueOnly(false);
        setTicketStatus("All");
setWorkStatus("All");
setPriority("All");
    };

    const clearFilters = () => {
        setSearch("");
        setSelectedClientId("");
        setEmployeeId("");
        setClientStatus("All");
        setAmcStatus("All");
        setPaymentMode("All");
        setFromDate("");
        setToDate("");
        setOverdueOnly(false);

        setTimeout(() => {
            loadReport(activeTab);
        }, 0);
    };

    const getExportRows = () => {
        if (activeTab === "summary") {
            return records.map((client, index) => ({
                "Sr No": index + 1,
                "Client Code": client.clientCode || "",
                "Client Name": client.companyName || "",
                "Contact Person": client.contactPerson || "",
                Mobile: client.mobile || "",
                Email: client.email || "",
                City: client.city || "",
                State: client.state || "",
                "Assigned Employee":
                    client.assignedEmployeeName || "",
                Products: Number(client.productCount || 0),
                "Total Tickets": Number(client.totalTickets || 0),
                "Open Tickets": Number(client.openTickets || 0),
                "Pending Tasks": Number(client.pendingTasks || 0),
                "AMC Status": client.amcStatus || "",
                Status: client.status || "",
            }));
        }

        if (activeTab === "amc") {
            return records.map((item, index) => ({
                "Sr No": index + 1,
                "Invoice Code": item.invoiceCode || "",
                "Invoice Date": formatDate(item.invoiceDate),
                "Client Code": item.clientCode || "",
                "Client Name": item.clientName || "",
                "Product Code": item.productCode || "",
                Product: item.productName || "",
                "Contract Code": item.contractCode || "",
                "AMC Start": formatDate(item.contractStartDate),
                "AMC Expiry": formatDate(item.contractExpiryDate),
                "Due Date": formatDate(item.dueDate),
                "Total Amount": Number(item.totalAmount || 0),
                "Paid Amount": Number(item.paidAmount || 0),
                "Pending Amount": Number(item.pendingAmount || 0),
                "Payment Status": item.reportStatus || "",
                "Overdue Days": Number(item.overdueDays || 0),
                "Assigned Employee":
                    item.assignedEmployeeName || "",
            }));
        }

        if (activeTab === "tickets") {
    return records.map((item, index) => ({
        "Sr No": index + 1,
        "Ticket Code": item.ticketCode || "",
        "Client Code": item.clientCode || "",
        "Client Name": item.clientName || "",
        Title: item.title || "",
        Product: item.productName || "",
        Module: item.module || "",
        Category: item.category || "",
        Priority: item.priority || "",
        Status: item.status || "",
        "Assigned Employee":
            item.assignedEmployeeName || "",
        "Created Date": formatDate(item.createdAt),
        "Due Date": formatDate(item.dueDate),
        "Resolved Date":
            formatDate(item.resolvedAt || item.closedAt),
        "Age Days": Number(item.ageDays || 0),
        Overdue: item.isOverdue ? "Yes" : "No",
        "Overdue Days":
            Number(item.overdueDays || 0),
        "Spent Minutes":
            Number(item.spentMinutes || 0),
    }));
}

if (activeTab === "work") {
    return records.map((item, index) => ({
        "Sr No": index + 1,
        "Task Code": item.taskCode || "",
        "Client Code": item.clientCode || "",
        "Client Name": item.clientName || "",
        Task: item.title || "",
        Product: item.productName || "",
        Project: item.projectName || "",
        Priority: item.priority || "",
        Status: item.status || "",
        Progress: Number(item.progress || 0),
        "Assigned Employee":
            item.assignedEmployeeName || "",
        "Start Date": formatDate(item.startDate),
        "Due Date": formatDate(item.dueDate),
        "Estimated Minutes":
            Number(item.estimatedMinutes || 0),
        "Spent Minutes":
            Number(item.spentMinutes || 0),
        Overdue: item.isOverdue ? "Yes" : "No",
        "Overdue Days":
            Number(item.overdueDays || 0),
    }));
}

        if (activeTab === "payments") {
            return records.map((item, index) => ({
                "Sr No": index + 1,
                "Payment Code": item.paymentCode || "",
                "Payment Date": formatDate(item.paymentDate),
                "Client Code": item.clientCode || "",
                "Client Name": item.clientName || "",
                "Invoice Code": item.invoiceCode || "",
                "Contract Code": item.contractCode || "",
                Product: item.productName || "",
                Amount: Number(item.amount || 0),
                Mode: item.mode || "",
                "Reference No": item.referenceNo || "",
                "Received By": item.receivedByName || "",
                Notes: item.notes || "",
            }));
        }

        return records.map((item, index) => ({
            "Sr No": index + 1,
            "Client Code": item.clientCode || "",
            "Client Name": item.clientName || "",
            "Invoice Code": item.invoiceCode || "",
            "Invoice Date": formatDate(item.invoiceDate),
            Product: item.productName || "",
            "Contract Code": item.contractCode || "",
            "Due Date": formatDate(item.dueDate),
            "Total Amount": Number(item.totalAmount || 0),
            "Paid Amount": Number(item.paidAmount || 0),
            Outstanding: Number(item.pendingAmount || 0),
            Status: item.outstandingStatus || "",
            "Overdue Days": Number(item.overdueDays || 0),
        }));
    };

    const exportExcel = () => {
        const rows = getExportRows();

        if (!rows.length) {
            window.alert("No report data available to export.");
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(rows);

        const workbook = XLSX.utils.book_new();

    const sheetNames = {
    summary: "Client Summary",
    amc: "AMC Report",
    payments: "Payments",
    outstanding: "Outstanding",
    tickets: "Client Tickets",
    work: "Client Work",
};

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            sheetNames[activeTab] || "Report"
        );

        const widths = Object.keys(rows[0]).map((key) => ({
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

        worksheet["!cols"] = widths;

        const dateStamp = new Date()
            .toISOString()
            .slice(0, 10);

        XLSX.writeFile(
            workbook,
            `Client-${sheetNames[activeTab] || "Report"}-${dateStamp}.xlsx`
        );
    };

    const renderCards = () => {
        if (activeTab === "summary") {
            return (
                <>
                    <SummaryCard
                        icon={Building2}
                        label="Total Clients"
                        value={summaryTabStats.total || 0}
                    />

                    <SummaryCard
                        icon={CheckCircle2}
                        label="Active Clients"
                        value={summaryTabStats.active || 0}
                        iconClass="bg-emerald-100 text-emerald-700"
                    />

                    <SummaryCard
                        icon={Users}
                        label="Open Tickets"
                        value={summaryTabStats.openTickets || 0}
                        iconClass="bg-amber-100 text-amber-700"
                    />

                    <SummaryCard
                        icon={Clock3}
                        label="Pending Tasks"
                        value={summaryTabStats.pendingTasks || 0}
                        iconClass="bg-rose-100 text-rose-700"
                    />
                </>
            );
        }

        if (activeTab === "amc") {
            return (
                <>
                    <SummaryCard
                        icon={FileText}
                        label="Total AMC"
                        value={money(reportSummary.totalAmount)}
                    />

                    <SummaryCard
                        icon={CheckCircle2}
                        label="Received"
                        value={money(reportSummary.paidAmount)}
                        iconClass="bg-emerald-100 text-emerald-700"
                    />

                    <SummaryCard
                        icon={Wallet}
                        label="Pending"
                        value={money(reportSummary.pendingAmount)}
                        iconClass="bg-amber-100 text-amber-700"
                    />

                    <SummaryCard
                        icon={AlertTriangle}
                        label="Overdue"
                        value={money(reportSummary.overdueAmount)}
                        iconClass="bg-rose-100 text-rose-700"
                    />
                </>
            );
        }


        if (activeTab === "payments") {
            return (
                <>
                    <SummaryCard
                        icon={IndianRupee}
                        label="Total Received"
                        value={money(reportSummary.totalReceived)}
                        iconClass="bg-emerald-100 text-emerald-700"
                    />

                    <SummaryCard
                        icon={Banknote}
                        label="Cash"
                        value={money(reportSummary.cash)}
                        iconClass="bg-amber-100 text-amber-700"
                    />

                    <SummaryCard
                        icon={Building2}
                        label="Bank Transfer"
                        value={money(reportSummary.bankTransfer)}
                        iconClass="bg-blue-100 text-blue-700"
                    />

                    <SummaryCard
                        icon={Wallet}
                        label="UPI"
                        value={money(reportSummary.upi)}
                        iconClass="bg-violet-100 text-violet-700"
                    />
                </>
            );
        }
        if (activeTab === "tickets") {
    return (
        <>
            <SummaryCard
                icon={FileText}
                label="Total Tickets"
                value={reportSummary.totalTickets || 0}
            />

            <SummaryCard
                icon={AlertTriangle}
                label="Open Tickets"
                value={reportSummary.openTickets || 0}
                iconClass="bg-amber-100 text-amber-700"
            />

            <SummaryCard
                icon={RefreshCw}
                label="In Progress"
                value={reportSummary.inProgressTickets || 0}
                iconClass="bg-blue-100 text-blue-700"
            />

            <SummaryCard
                icon={CheckCircle2}
                label="Resolved"
                value={reportSummary.resolvedTickets || 0}
                iconClass="bg-emerald-100 text-emerald-700"
            />
        </>
    );
}
if (activeTab === "work") {
    return (
        <>
            <SummaryCard
                icon={FileText}
                label="Total Tasks"
                value={reportSummary.totalTasks || 0}
            />

            <SummaryCard
                icon={Clock3}
                label="Pending"
                value={reportSummary.pendingTasks || 0}
                iconClass="bg-amber-100 text-amber-700"
            />

            <SummaryCard
                icon={RefreshCw}
                label="In Progress"
                value={reportSummary.inProgressTasks || 0}
                iconClass="bg-blue-100 text-blue-700"
            />

            <SummaryCard
                icon={CheckCircle2}
                label="Completed"
                value={reportSummary.completedTasks || 0}
                iconClass="bg-emerald-100 text-emerald-700"
            />
        </>
    );
}

        return (
            <>
                <SummaryCard
                    icon={Wallet}
                    label="Outstanding"
                    value={money(reportSummary.totalOutstanding)}
                    iconClass="bg-amber-100 text-amber-700"
                />

                <SummaryCard
                    icon={IndianRupee}
                    label="Total Billed"
                    value={money(reportSummary.totalBilled)}
                />

                <SummaryCard
                    icon={CheckCircle2}
                    label="Total Received"
                    value={money(reportSummary.totalPaid)}
                    iconClass="bg-emerald-100 text-emerald-700"
                />

                <SummaryCard
                    icon={AlertTriangle}
                    label="Overdue Amount"
                    value={money(reportSummary.overdueAmount)}
                    iconClass="bg-rose-100 text-rose-700"
                />
            </>
        );
    };

    const renderTable = () => {
        if (activeTab === "summary") {
            return (
                <table className="min-w-[1450px] w-full">
                    <thead className="bg-slate-50">
                        <tr>
                            {[
                                "Client",
                                "Contact",
                                "Location",
                                "Assigned To",
                                "Products",
                                "Tickets",
                                "Open",
                                "Pending Tasks",
                                "AMC",
                                "Status",
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
                        {records.map((client) => (
                            <tr
                                key={client.id}
                                className="hover:bg-slate-50/70"
                            >
                                <td className="px-4 py-4">
                                    <p className="text-xs font-semibold text-slate-900">
                                        {client.companyName || "—"}
                                    </p>

                                    <p className="mt-1 text-[10px] text-slate-400">
                                        {client.clientCode || "—"}
                                    </p>
                                </td>

                                <td className="px-4 py-4">
                                    <p className="text-xs text-slate-700">
                                        {client.contactPerson || "—"}
                                    </p>

                                    <p className="mt-1 text-[10px] text-slate-400">
                                        {client.mobile ||
                                            client.email ||
                                            "—"}
                                    </p>
                                </td>

                                <td className="px-4 py-4 text-xs text-slate-600">
                                    {[client.city, client.state]
                                        .filter(Boolean)
                                        .join(", ") || "—"}
                                </td>

                                <td className="px-4 py-4">
                                    <p className="text-xs font-medium text-slate-700">
                                        {client.assignedEmployeeName ||
                                            "Unassigned"}
                                    </p>

                                    <p className="mt-1 text-[10px] text-slate-400">
                                        {client.assignedEmployeeCode || "—"}
                                    </p>
                                </td>

                                <td className="px-4 py-4 text-center text-xs font-semibold">
                                    {Number(client.productCount || 0)}
                                </td>

                                <td className="px-4 py-4 text-center text-xs">
                                    {Number(client.totalTickets || 0)}
                                </td>

                                <td className="px-4 py-4 text-center text-xs font-semibold text-rose-600">
                                    {Number(client.openTickets || 0)}
                                </td>

                                <td className="px-4 py-4 text-center text-xs font-semibold text-amber-600">
                                    {Number(client.pendingTasks || 0)}
                                </td>

                                <td className="px-4 py-4">
                                    <StatusBadge
                                        status={
                                            client.amcStatus ||
                                            "Not Started"
                                        }
                                    />
                                </td>

                                <td className="px-4 py-4">
                                    <StatusBadge
                                        status={client.status}
                                        type="client"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }

        if (activeTab === "amc") {
            return (
                <table className="min-w-[1750px] w-full">
                    <thead className="bg-slate-50">
                        <tr>
                            {[
                                "Invoice",
                                "Client",
                                "Product",
                                "Contract",
                                "AMC Period",
                                "Invoice Date",
                                "Due Date",
                                "Total",
                                "Paid",
                                "Pending",
                                "Status",
                                "Overdue",
                                "Assigned To",
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
                        {records.map((item) => (
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
                                        {item.invoiceCode || "—"}
                                    </p>
                                </td>

                                <td className="px-4 py-4">
                                    <p className="text-xs font-semibold text-slate-800">
                                        {item.clientName || "—"}
                                    </p>

                                    <p className="mt-1 text-[10px] text-slate-400">
                                        {item.clientCode || "—"}
                                    </p>
                                </td>

                                <td className="px-4 py-4">
                                    <p className="text-xs text-slate-700">
                                        {item.productName || "—"}
                                    </p>

                                    <p className="mt-1 text-[10px] text-slate-400">
                                        {item.productVersion || ""}
                                    </p>
                                </td>

                                <td className="px-4 py-4 text-xs">
                                    {item.contractCode || "—"}
                                </td>

                                <td className="px-4 py-4 text-xs whitespace-nowrap">
                                    {formatDate(item.contractStartDate)}
                                    {" → "}
                                    {formatDate(item.contractExpiryDate)}
                                </td>

                                <td className="px-4 py-4 text-xs whitespace-nowrap">
                                    {formatDate(item.invoiceDate)}
                                </td>

                                <td className="px-4 py-4 text-xs whitespace-nowrap">
                                    {formatDate(item.dueDate)}
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold">
                                    {money(item.totalAmount)}
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold text-emerald-600">
                                    {money(item.paidAmount)}
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold text-rose-600">
                                    {money(item.pendingAmount)}
                                </td>

                                <td className="px-4 py-4">
                                    <StatusBadge
                                        status={item.reportStatus}
                                    />
                                </td>

                                <td className="px-4 py-4 text-xs">
                                    {item.isOverdue ? (
                                        <span className="font-semibold text-rose-600">
                                            {Number(
                                                item.overdueDays || 0
                                            )}{" "}
                                            days
                                        </span>
                                    ) : (
                                        <span className="text-emerald-600">
                                            On Track
                                        </span>
                                    )}
                                </td>

                                <td className="px-4 py-4 text-xs">
                                    {item.assignedEmployeeName || "—"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }
        if (activeTab === "tickets") {
    return (
        <table className="min-w-[1850px] w-full">
            <thead className="bg-slate-50">
                <tr>
                    {[
                        "Ticket",
                        "Client",
                        "Title",
                        "Product",
                        "Module",
                        "Priority",
                        "Status",
                        "Assigned To",
                        "Created",
                        "Due Date",
                        "Age",
                        "Overdue",
                        "Spent",
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
                {records.map((item) => (
                    <tr
                        key={item.id}
                        className={
                            item.isOverdue
                                ? "bg-rose-50/30 hover:bg-rose-50/60"
                                : "hover:bg-slate-50/70"
                        }
                    >
                        <td className="px-4 py-4 text-xs font-semibold text-violet-700">
                            {item.ticketCode || "—"}
                        </td>

                        <td className="px-4 py-4">
                            <p className="text-xs font-semibold text-slate-900">
                                {item.clientName || "—"}
                            </p>

                            <p className="mt-1 text-[10px] text-slate-400">
                                {item.clientCode || "—"}
                            </p>
                        </td>

                        <td className="px-4 py-4">
                            <p className="max-w-[260px] truncate text-xs font-medium text-slate-800">
                                {item.title || "—"}
                            </p>
                        </td>

                        <td className="px-4 py-4 text-xs">
                            {item.productName || "—"}
                        </td>

                        <td className="px-4 py-4 text-xs">
                            {item.module || item.category || "—"}
                        </td>

                        <td className="px-4 py-4 text-xs font-semibold">
                            {item.priority || "—"}
                        </td>

                        <td className="px-4 py-4">
                            <StatusBadge status={item.status} />
                        </td>

                        <td className="px-4 py-4">
                            <p className="text-xs font-medium">
                                {item.assignedEmployeeName || "Unassigned"}
                            </p>

                            <p className="mt-1 text-[10px] text-slate-400">
                                {item.assignedEmployeeCode || "—"}
                            </p>
                        </td>

                        <td className="px-4 py-4 text-xs whitespace-nowrap">
                            {formatDate(item.createdAt)}
                        </td>

                        <td className="px-4 py-4 text-xs whitespace-nowrap">
                            {formatDate(item.dueDate)}
                        </td>

                        <td className="px-4 py-4 text-xs">
                            {Number(item.ageDays || 0)} days
                        </td>

                        <td className="px-4 py-4 text-xs">
                            {item.isOverdue ? (
                                <span className="font-semibold text-rose-600">
                                    {Number(item.overdueDays || 0)} days
                                </span>
                            ) : (
                                <span className="text-emerald-600">
                                    On Track
                                </span>
                            )}
                        </td>

                        <td className="px-4 py-4 text-xs">
                            {formatWorkMinutes(item.spentMinutes)}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
if (activeTab === "work") {
    return (
        <table className="min-w-[1900px] w-full">
            <thead className="bg-slate-50">
                <tr>
                    {[
                        "Task",
                        "Client",
                        "Work",
                        "Product / Project",
                        "Assigned To",
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
                {records.map((item) => (
                    <tr
                        key={item.id}
                        className={
                            item.isOverdue
                                ? "bg-rose-50/30 hover:bg-rose-50/60"
                                : "hover:bg-slate-50/70"
                        }
                    >
                        <td className="px-4 py-4 text-xs font-semibold text-violet-700">
                            {item.taskCode || "—"}
                        </td>

                        <td className="px-4 py-4">
                            <p className="text-xs font-semibold">
                                {item.clientName || "Internal"}
                            </p>

                            <p className="mt-1 text-[10px] text-slate-400">
                                {item.clientCode || "—"}
                            </p>
                        </td>

                        <td className="px-4 py-4">
                            <p className="max-w-[280px] truncate text-xs font-medium">
                                {item.title || "—"}
                            </p>
                        </td>

                        <td className="px-4 py-4 text-xs">
                            {item.productName ||
                                item.projectName ||
                                "—"}
                        </td>

                        <td className="px-4 py-4">
                            <p className="text-xs font-medium">
                                {item.assignedEmployeeName || "Unassigned"}
                            </p>

                            <p className="mt-1 text-[10px] text-slate-400">
                                {item.assignedEmployeeCode || "—"}
                            </p>
                        </td>

                        <td className="px-4 py-4 text-xs font-semibold">
                            {item.priority || "—"}
                        </td>

                        <td className="px-4 py-4">
                            <StatusBadge status={item.status} />
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
                            {formatWorkMinutes(item.estimatedMinutes)}
                        </td>

                        <td className="px-4 py-4 text-xs font-semibold">
                            {formatWorkMinutes(item.spentMinutes)}
                        </td>

                        <td className="px-4 py-4 text-xs">
                            {item.isOverdue ? (
                                <span className="font-semibold text-rose-600">
                                    {Number(item.overdueDays || 0)} days
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

        if (activeTab === "payments") {
            return (
                <table className="min-w-[1500px] w-full">
                    <thead className="bg-slate-50">
                        <tr>
                            {[
                                "Payment",
                                "Date",
                                "Client",
                                "Invoice",
                                "Contract",
                                "Product",
                                "Amount",
                                "Mode",
                                "Reference",
                                "Received By",
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
                        {records.map((item) => (
                            <tr
                                key={item.id}
                                className="hover:bg-slate-50/70"
                            >
                                <td className="px-4 py-4 text-xs font-semibold text-violet-700">
                                    {item.paymentCode || "—"}
                                </td>

                                <td className="px-4 py-4 text-xs whitespace-nowrap">
                                    {formatDate(item.paymentDate)}
                                </td>

                                <td className="px-4 py-4">
                                    <p className="text-xs font-semibold text-slate-800">
                                        {item.clientName || "—"}
                                    </p>

                                    <p className="mt-1 text-[10px] text-slate-400">
                                        {item.clientCode || "—"}
                                    </p>
                                </td>

                                <td className="px-4 py-4 text-xs">
                                    {item.invoiceCode || "—"}
                                </td>

                                <td className="px-4 py-4 text-xs">
                                    {item.contractCode || "—"}
                                </td>

                                <td className="px-4 py-4 text-xs">
                                    {item.productName || "—"}
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold text-emerald-600">
                                    {money(item.amount)}
                                </td>

                                <td className="px-4 py-4">
                                    <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/10">
                                        {item.mode || "—"}
                                    </span>
                                </td>

                                <td className="px-4 py-4 text-xs">
                                    {item.referenceNo || "—"}
                                </td>

                                <td className="px-4 py-4 text-xs">
                                    {item.receivedByName || "—"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }

        return (
            <table className="min-w-[1550px] w-full">
                <thead className="bg-slate-50">
                    <tr>
                        {[
                            "Client",
                            "Invoice",
                            "Product",
                            "Contract",
                            "Invoice Date",
                            "Due Date",
                            "Billed",
                            "Paid",
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
                    {records.map((item) => (
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

                            <td className="px-4 py-4 text-xs font-semibold">
                                {item.invoiceCode || "—"}
                            </td>

                            <td className="px-4 py-4 text-xs">
                                {item.productName || "—"}
                            </td>

                            <td className="px-4 py-4 text-xs">
                                {item.contractCode || "—"}
                            </td>

                            <td className="px-4 py-4 text-xs whitespace-nowrap">
                                {formatDate(item.invoiceDate)}
                            </td>

                            <td className="px-4 py-4 text-xs whitespace-nowrap">
                                {formatDate(item.dueDate)}
                            </td>

                            <td className="px-4 py-4 text-xs font-semibold">
                                {money(item.totalAmount)}
                            </td>

                            <td className="px-4 py-4 text-xs font-semibold text-emerald-600">
                                {money(item.paidAmount)}
                            </td>

                            <td className="px-4 py-4 text-xs font-semibold text-rose-600">
                                {money(item.pendingAmount)}
                            </td>

                            <td className="px-4 py-4">
                                <StatusBadge
                                    status={item.outstandingStatus}
                                />
                            </td>

                            <td className="px-4 py-4 text-xs">
                                {item.isOverdue ? (
                                    <span className="font-semibold text-rose-600">
                                        {Number(item.overdueDays || 0)} days
                                    </span>
                                ) : (
                                    <span className="text-emerald-600">
                                        Not overdue
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
        "Client Report";

    return (
        <div className="p-6">
            {/* HEADER */}
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
                        Reports
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                        Client Reporting Center
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                        Client activity, AMC billing, collections,
                        outstanding balances and account follow-up.
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

            {/* REPORT TABS */}
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

            {/* SUMMARY CARDS */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {renderCards()}
            </div>

            {/* FILTERS */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="min-w-[250px] flex-1">
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
                                placeholder="Search client, invoice, product..."
                                className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-xs outline-none focus:border-violet-400"
                            />
                        </div>
                    </div>

                    {activeTab !== "summary" && (
                        <div className="min-w-[210px]">
                            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                Client
                            </label>

                            <select
                                value={selectedClientId}
                                onChange={(event) =>
                                    setSelectedClientId(
                                        event.target.value
                                    )
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

                    {activeTab === "summary" && (
                        <>
                            <div className="min-w-[150px]">
                                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                    Status
                                </label>

                                <select
                                    value={clientStatus}
                                    onChange={(event) =>
                                        setClientStatus(
                                            event.target.value
                                        )
                                    }
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs"
                                >
                                    <option value="All">
                                        All Status
                                    </option>
                                    <option value="Active">
                                        Active
                                    </option>
                                    <option value="Inactive">
                                        Inactive
                                    </option>
                                    <option value="Suspended">
                                        Suspended
                                    </option>
                                </select>
                            </div>

                            <div className="min-w-[190px]">
                                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                    Employee
                                </label>

                                <select
                                    value={employeeId}
                                    onChange={(event) =>
                                        setEmployeeId(
                                            event.target.value
                                        )
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
                        </>
                    )}

                    {activeTab === "amc" && (
                        <div className="min-w-[170px]">
                            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                AMC Status
                            </label>

                            <select
                                value={amcStatus}
                                onChange={(event) =>
                                    setAmcStatus(event.target.value)
                                }
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs"
                            >
                                <option value="All">
                                    All AMC
                                </option>
                                <option value="Paid">
                                    Paid
                                </option>
                                <option value="Pending">
                                    Pending
                                </option>
                                <option value="Partially Paid">
                                    Partially Paid
                                </option>
                                <option value="Overdue">
                                    Overdue
                                </option>
                            </select>
                        </div>
                    )}

                    {activeTab === "payments" && (
                        <div className="min-w-[170px]">
                            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                Payment Mode
                            </label>

                            <select
                                value={paymentMode}
                                onChange={(event) =>
                                    setPaymentMode(event.target.value)
                                }
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs"
                            >
                                <option value="All">
                                    All Modes
                                </option>
                                <option value="Cash">
                                    Cash
                                </option>
                                <option value="Bank Transfer">
                                    Bank Transfer
                                </option>
                                <option value="UPI">
                                    UPI
                                </option>
                                <option value="Cheque">
                                    Cheque
                                </option>
                                <option value="Card">
                                    Card
                                </option>
                                <option value="Other">
                                    Other
                                </option>
                            </select>
                        </div>
                    )}
                    {activeTab === "tickets" && (
    <>
        <div className="min-w-[170px]">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Ticket Status
            </label>

            <select
                value={ticketStatus}
                onChange={(event) =>
                    setTicketStatus(event.target.value)
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs"
            >
                <option value="All">All Status</option>
                <option value="New">New</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Waiting for Client">Waiting for Client</option>
                <option value="Testing">Testing</option>
                <option value="Resolved">Resolved</option>
                <option value="Verified">Verified</option>
                <option value="Closed">Closed</option>
            </select>
        </div>

        <div className="min-w-[150px]">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Priority
            </label>

            <select
                value={priority}
                onChange={(event) =>
                    setPriority(event.target.value)
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs"
            >
                <option value="All">All Priority</option>
                <option value="Critical">Critical</option>
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
            </select>
        </div>
    </>
)}
{activeTab === "work" && (
    <>
        <div className="min-w-[170px]">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Task Status
            </label>

            <select
                value={workStatus}
                onChange={(event) =>
                    setWorkStatus(event.target.value)
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs"
            >
                <option value="All">All Status</option>
                <option value="New">New</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Closed">Closed</option>
            </select>
        </div>

        <div className="min-w-[150px]">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Priority
            </label>

            <select
                value={priority}
                onChange={(event) =>
                    setPriority(event.target.value)
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs"
            >
                <option value="All">All Priority</option>
                <option value="Critical">Critical</option>
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
            </select>
        </div>
    </>
)}
{["tickets", "work"].includes(activeTab) && (
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

                    {activeTab === "outstanding" && (
                        <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700">
                            <input
                                type="checkbox"
                                checked={overdueOnly}
                                onChange={(event) =>
                                    setOverdueOnly(
                                        event.target.checked
                                    )
                                }
                            />
                            Overdue only
                        </label>
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
                                        setFromDate(event.target.value)
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

            {/* CLIENT-WISE OUTSTANDING SUMMARY */}
            {activeTab === "outstanding" &&
                clientOutstandingSummary.length > 0 && (
                    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className="border-b border-slate-200 px-5 py-4">
                            <h3 className="text-sm font-semibold text-slate-950">
                                Client-wise Outstanding Summary
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                                Clients ranked by outstanding balance.
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px]">
                                <thead className="bg-slate-50">
                                    <tr>
                                        {[
                                            "Client",
                                            "Invoices",
                                            "Billed",
                                            "Received",
                                            "Outstanding",
                                            "Overdue",
                                            "Overdue Invoices",
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
                                    {clientOutstandingSummary.map(
                                        (client) => (
                                            <tr
                                                key={
                                                    String(
                                                        client.clientId
                                                    ) ||
                                                    client.clientCode
                                                }
                                            >
                                                <td className="px-4 py-3">
                                                    <p className="text-xs font-semibold">
                                                        {client.clientName}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">
                                                        {client.clientCode}
                                                    </p>
                                                </td>

                                                <td className="px-4 py-3 text-xs">
                                                    {client.invoiceCount}
                                                </td>

                                                <td className="px-4 py-3 text-xs">
                                                    {money(
                                                        client.totalBilled
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 text-xs font-semibold text-emerald-600">
                                                    {money(
                                                        client.totalPaid
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 text-xs font-semibold text-rose-600">
                                                    {money(
                                                        client.outstanding
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 text-xs font-semibold text-rose-600">
                                                    {money(
                                                        client.overdueAmount
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 text-xs">
                                                    {
                                                        client.overdueInvoices
                                                    }
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            {/* DETAIL TABLE */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-950">
                            {activeTitle}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                            {records.length} records found.
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
                ) : records.length === 0 ? (
                    <div className="px-5 py-14 text-center">
                        <FileText
                            size={26}
                            className="mx-auto text-slate-300"
                        />

                        <p className="mt-3 text-sm font-medium text-slate-700">
                            No report records found.
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