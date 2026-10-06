import { useEffect, useState } from "react";
import {
    ArrowRight,
    BellRing,
    Box,
    CalendarDays,
    CheckCircle2,
    Clock3,
    CreditCard,
    Download,
    FileText,
    Headphones,
    IndianRupee,
    LifeBuoy,
    PackageCheck,
    Plus,
    ReceiptText,
    ShieldCheck,
    TicketCheck,
    Users,
} from "lucide-react";

import API_URL from "../config/api";

function activityIcon(type) {
    if (type === "Ticket") {
        return { icon: TicketCheck, iconClass: "bg-blue-50 text-blue-600" };
    }
    if (type === "Billing") {
        return { icon: ReceiptText, iconClass: "bg-amber-50 text-amber-600" };
    }
    if (type === "Product") {
        return { icon: PackageCheck, iconClass: "bg-emerald-50 text-emerald-600" };
    }
    return { icon: CheckCircle2, iconClass: "bg-slate-50 text-slate-600" };
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number(amount || 0));
}
function formatDate(value) {
    if (!value) return "Not available";

    try {
        const rawValue = String(value).trim();

        const match = rawValue.match(
            /^(\d{4})-(\d{2})-(\d{2})/
        );

        let date;

        if (match) {
            date = new Date(
                Number(match[1]),
                Number(match[2]) - 1,
                Number(match[3])
            );
        } else {
            date = new Date(value);
        }

        if (Number.isNaN(date.getTime())) {
            return "Not available";
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    } catch {
        return "Not available";
    }
}

function invoicePeriod(invoice) {
    if (!invoice) return "Not available";

    const start =
        invoice.contractStartDate ||
        invoice.contractStart;

    const end =
        invoice.contractExpiryDate ||
        invoice.contractEnd;

    if (!start && !end) {
        return "Not available";
    }

    return `${formatDate(start)} — ${formatDate(end)}`;
}
function StatusBadge({ status }) {
    const statusClasses = {
        Active:
            "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
        Paid:
            "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
        Pending:
            "bg-amber-50 text-amber-700 ring-amber-600/10",
        Overdue:
            "bg-rose-50 text-rose-700 ring-rose-600/10",
        "In Progress":
            "bg-blue-50 text-blue-700 ring-blue-600/10",
        Resolved:
            "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
    };

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ring-1 ring-inset ${statusClasses[status] ||
                "bg-slate-100 text-slate-600 ring-slate-500/10"
                }`}
        >
            {status}
        </span>
    );
}

function PriorityBadge({ priority }) {
    const priorityClasses = {
        Low: "bg-slate-100 text-slate-600 ring-slate-500/10",
        Medium:
            "bg-amber-50 text-amber-700 ring-amber-600/10",
        High:
            "bg-orange-50 text-orange-700 ring-orange-600/10",
        Critical:
            "bg-rose-50 text-rose-700 ring-rose-600/10",
    };

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-bold uppercase ring-1 ring-inset ${priorityClasses[priority] ||
                priorityClasses.Low
                }`}
        >
            {priority}
        </span>
    );
}

function SummaryCard({
    label,
    value,
    description,
    icon: Icon,
    iconClass,
    descriptionClass = "text-slate-500",
}) {
    return (
        <article className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs transition hover:border-slate-300">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        {label}
                    </p>

                    <p className="mt-1 truncate text-xl font-bold tracking-tight text-slate-900">
                        {value}
                    </p>
                </div>

                <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
                >
                    <Icon size={16} />
                </div>
            </div>

            <p className={`mt-2.5 truncate text-[10px] font-medium ${descriptionClass}`}>
                {description}
            </p>
        </article>
    );
}

export default function ClientDashboard({ onNavigate }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [client, setClient] = useState(null);
    const [summary, setSummary] = useState({
        activeProductCount: 0,
        openTicketCount: 0,
        totalLicensedUsers: 0,
        amcStatus: "Not Started",
        nextRenewal: "",
    });
    const [products, setProducts] = useState([]);
    const [supportTickets, setSupportTickets] = useState([]);
    const [billingHistory, setBillingHistory] = useState([]);
    const [amcBilling, setAmcBilling] = useState({
        totalBilled: 0,
        totalPaid: 0,
        pendingAmount: 0,
        nextDueDate: null,
        latestInvoice: null,
    });
    const [recentActivity, setRecentActivity] = useState([]);

    const getAuthToken = () => {
        return (
            localStorage.getItem("client-connect-token") ||
            sessionStorage.getItem("client-connect-token") ||
            ""
        );
    };

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const token = getAuthToken();

                const [
                    response,
                    amcResponse,
                    invoiceResponse,
                ] = await Promise.all([
                    fetch(
                        `${API_URL}/api/client/dashboard`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    ),

                    fetch(
                        `${API_URL}/api/client/amc/dashboard`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    ),

                    fetch(
                        `${API_URL}/api/client/amc/invoices`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    ),
                ]);

                const [
                    result,
                    amcResult,
                    invoiceResult,
                ] = await Promise.all([
                    response.json(),
                    amcResponse.json(),
                    invoiceResponse.json(),
                ]);

                if (!response.ok || !result.success) {
                    throw new Error(
                        result.message ||
                        "Unable to load dashboard."
                    );
                }

                if (!amcResponse.ok || !amcResult.success) {
                    throw new Error(
                        amcResult.message ||
                        "Unable to load AMC billing."
                    );
                }

                if (
                    !invoiceResponse.ok ||
                    !invoiceResult.success
                ) {
                    throw new Error(
                        invoiceResult.message ||
                        "Unable to load AMC invoices."
                    );
                }

                const data = result.data;

                setAmcBilling({
                    totalBilled:
                        Number(
                            amcResult.data?.totalBilled ||
                            0
                        ),

                    totalPaid:
                        Number(
                            amcResult.data?.totalPaid ||
                            0
                        ),

                    pendingAmount:
                        Number(
                            amcResult.data?.pendingAmount ||
                            0
                        ),

                    nextDueDate:
                        amcResult.data?.nextDueDate ||
                        null,

                    latestInvoice:
                        amcResult.data?.latestInvoice ||
                        null,
                });

                setBillingHistory(
                    invoiceResult.data || []
                );

                setClient(data.client);
                setSummary(data.summary);

                setProducts(
                    (data.products || []).map((product) => ({
                        id: product._id,
                        name: product.productName,
                        description: product.notes || "",
                        version: product.version,
                        purchaseDate: product.purchaseDate,
                        licensedUsers: product.licensedUsers,
                        supportPlan: product.supportType,
                        status: product.installationStatus === "Inactive" ? "Inactive" : "Active",
                    }))
                );

                setSupportTickets(
                    (data.tickets || []).map((ticket) => ({
                        id: ticket.ticketCode,
                        title: ticket.title,
                        createdAt: new Date(ticket.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                        }),
                        assignedTo: ticket.assignedEmployeeName || "Unassigned",
                        priority: ticket.priority,
                        status: ticket.status,
                    }))
                );

                // No invoice/billing schema exists on the backend yet, so this
                // stays empty until that's built — see the "Bills & AMC" empty
                // state below instead of showing fake invoices.
                setBillingHistory(data.billingHistory || []);

                setRecentActivity(
                    (data.activity || []).map((item) => ({
                        id: item._id,
                        title: item.action,
                        description: item.description,
                        time: new Date(item.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                        }),
                        ...activityIcon(item.category),
                    }))
                );
            } catch (err) {
                console.error("Client dashboard:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);
const currentInvoice =
    amcBilling.latestInvoice ||
    billingHistory[0] ||
    null;

const pendingAmount =
    Number(
        currentInvoice?.balanceAmount ??
        currentInvoice?.pendingAmount ??
        amcBilling.pendingAmount ??
        0
    );

const paidAmount =
    Number(
        currentInvoice?.paidAmount ??
        0
    );

const invoiceAmount =
    Number(
        currentInvoice?.totalAmount ??
        currentInvoice?.amount ??
        0
    );

const paymentStatus =
    currentInvoice?.paymentStatus ||
    currentInvoice?.status ||
    summary.amcStatus ||
    "Pending";
    const handleDownloadBill = () => {
        alert(
            "The AMC invoice PDF will be connected when the billing backend is added."
        );
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center text-sm text-slate-500">
                Loading your dashboard...
            </div>
        );
    }

    if (error) {
        return <div className="p-6 text-sm text-rose-600">{error}</div>;
    }

    return (
        <div className="space-y-4">
            {/* Header Banner */}
            <section className="flex flex-col gap-4 rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#1B59F8]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#1B59F8]" />
                        Client Workspace
                    </div>

                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                        Welcome, {client?.contactPerson || client?.companyName || "Client"}
                    </h1>

                    <p className="mt-1 max-w-2xl text-xs text-slate-500 leading-relaxed">
                        Review your software licence, annual charges, invoices and active support requests.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onNavigate("tickets")}
                        className="flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-98"
                    >
                        <LifeBuoy size={14} className="text-slate-500" />
                        View Support
                    </button>

                    <button
                        type="button"
                        onClick={() => onNavigate("tickets")}
                        className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] px-3.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#1548D1] active:scale-98"
                    >
                        <Plus size={14} strokeWidth={2.5} />
                        Raise Ticket
                    </button>
                </div>
            </section>

            {/* KPI Cards */}
            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <SummaryCard
                    label="Active Products"
                    value={String(summary.activeProductCount)}
                    description={`${summary.activeProductCount} product${summary.activeProductCount === 1 ? "" : "s"} active`}
                    icon={Box}
                    iconClass="bg-blue-50 text-[#1B59F8]"
                />

                <SummaryCard
                    label="AMC Status"
                    value={summary.amcStatus || "—"}
                    description={summary.nextRenewal ? `Renewal: ${summary.nextRenewal}` : "No renewal date on file"}
                    icon={IndianRupee}
                    iconClass="bg-amber-50 text-amber-700"
                    descriptionClass="text-amber-600 font-semibold"
                />

                <SummaryCard
                    label="Open Tickets"
                    value={String(summary.openTicketCount)}
                    description={`${summary.openTicketCount} ticket${summary.openTicketCount === 1 ? "" : "s"} open`}
                    icon={Headphones}
                    iconClass="bg-indigo-50 text-indigo-700"
                />

                <SummaryCard
                    label="Licensed Users"
                    value={String(summary.totalLicensedUsers)}
                    description="Permitted user seats"
                    icon={Users}
                    iconClass="bg-violet-50 text-violet-700"
                />
            </section>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                {/* Purchased Software Card */}
                <article className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/70 px-4 py-3">
                        <div>
                            <p className="text-xs font-bold text-slate-900">
                                Purchased Software
                            </p>
                            <p className="text-[10px] text-slate-500">
                                Software licensed to your company
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => onNavigate("products")}
                            className="flex items-center gap-1 text-xs font-semibold text-[#1B59F8] transition hover:text-blue-700"
                        >
                            View all
                            <ArrowRight size={13} />
                        </button>
                    </div>

                    <div className="p-3.5 space-y-3">
                        {products.length === 0 ? (
                            <div className="py-8 text-center text-xs text-slate-400">
                                No software products registered yet.
                            </div>
                        ) : (
                            products.map((product) => (
                                <div
                                    key={product.id}
                                    className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3.5"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-start gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1B59F8]">
                                                <Box size={18} />
                                            </div>

                                            <div className="min-w-0">
                                                <h3 className="truncate text-xs font-bold text-slate-900">
                                                    {product.name}
                                                </h3>

                                                <p className="mt-0.5 text-[10px] text-slate-500 truncate">
                                                    {product.description || "Active software licence"} · {product.version}
                                                </p>
                                            </div>
                                        </div>

                                        <StatusBadge status={product.status} />
                                    </div>

                                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                        <div className="rounded-md border border-slate-200/70 bg-white px-2.5 py-1.5">
                                            <p className="text-[9px] uppercase font-semibold tracking-wider text-slate-400">
                                                Purchased on
                                            </p>
                                            <p className="mt-0.5 text-xs font-semibold text-slate-800">
                                                {product.purchaseDate || "—"}
                                            </p>
                                        </div>

                                        <div className="rounded-md border border-slate-200/70 bg-white px-2.5 py-1.5">
                                            <p className="text-[9px] uppercase font-semibold tracking-wider text-slate-400">
                                                Licensed users
                                            </p>
                                            <p className="mt-0.5 text-xs font-semibold text-slate-800">
                                                {product.licensedUsers}
                                            </p>
                                        </div>

                                        <div className="rounded-md border border-slate-200/70 bg-white px-2.5 py-1.5 sm:col-span-2">
                                            <p className="text-[9px] uppercase font-semibold tracking-wider text-slate-400">
                                                Support plan
                                            </p>
                                            <div className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                                                <ShieldCheck size={13} className="text-emerald-600" />
                                                {product.supportPlan || "Standard Support"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </article>

                {/* AMC Billing Card */}
                <article className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/70 px-4 py-3">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 text-amber-600">
                                <BellRing size={15} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-900">
                                    Annual Maintenance Charges
                                </p>
                                <p className="text-[10px] text-slate-500">
                                    Contract renewal & billing status
                                </p>
                            </div>
                        </div>

                        <StatusBadge status={paymentStatus} />
                    </div>

                    <div className="p-4 space-y-4">
                        {/* Main Amount */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Amount Pending
                                </p>
                                <p className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                                    {formatCurrency(pendingAmount)}
                                </p>
                                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                    <span className="text-[10px] font-semibold text-slate-700">
                                        {currentInvoice?.productName || "AMC Coverage"}
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-[10px] text-slate-500">
                                        {invoicePeriod(currentInvoice)}
                                    </span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => onNavigate("billing")}
                                className="flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] px-3 text-xs font-semibold text-white shadow-xs transition hover:bg-[#1548D1] active:scale-98"
                            >
                                <ReceiptText size={14} />
                                Open Billing
                                <ArrowRight size={13} />
                            </button>
                        </div>

                        {/* Amount Breakdown */}
                        <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-slate-200/80 bg-slate-50/80 divide-x divide-slate-200/80">
                            <div className="p-2.5 text-center">
                                <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                    Invoice
                                </p>
                                <p className="mt-1 text-xs sm:text-sm font-bold text-slate-900">
                                    {formatCurrency(invoiceAmount)}
                                </p>
                            </div>

                            <div className="p-2.5 text-center">
                                <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                    Paid
                                </p>
                                <p className="mt-1 text-xs sm:text-sm font-bold text-emerald-600">
                                    {formatCurrency(paidAmount)}
                                </p>
                            </div>

                            <div className="p-2.5 text-center">
                                <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                    Balance
                                </p>
                                <p className="mt-1 text-xs sm:text-sm font-bold text-amber-600">
                                    {formatCurrency(pendingAmount)}
                                </p>
                            </div>
                        </div>

                        {/* Invoice Details */}
                        <div className="grid gap-2.5 sm:grid-cols-2">
                            <div className="rounded-lg border border-slate-200/80 bg-white p-2.5">
                                <div className="flex items-center gap-1.5 text-slate-400">
                                    <FileText size={13} />
                                    <span className="text-[9px] font-semibold uppercase tracking-wider">
                                        Invoice Number
                                    </span>
                                </div>
                                <p className="mt-1 truncate text-xs font-semibold text-slate-800">
                                    {currentInvoice?.invoiceCode || currentInvoice?.invoiceNo || "Not available"}
                                </p>
                            </div>

                            <div className="rounded-lg border border-slate-200/80 bg-white p-2.5">
                                <div className="flex items-center gap-1.5 text-slate-400">
                                    <CalendarDays size={13} />
                                    <span className="text-[9px] font-semibold uppercase tracking-wider">
                                        Due Date
                                    </span>
                                </div>
                                <p className="mt-1 text-xs font-semibold text-amber-700">
                                    {currentInvoice?.dueDate
                                        ? formatDate(currentInvoice.dueDate)
                                        : amcBilling.nextDueDate
                                            ? formatDate(amcBilling.nextDueDate)
                                            : "Not available"}
                                </p>
                            </div>
                        </div>

                        {/* AMC Period */}
                        <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-[#1B59F8] shadow-2xs">
                                    <ShieldCheck size={14} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-semibold uppercase tracking-wider text-blue-700">
                                        AMC Coverage Period
                                    </p>
                                    <p className="mt-0.5 text-xs font-semibold text-slate-700">
                                        {invoicePeriod(currentInvoice)}
                                    </p>
                                </div>
                            </div>
                            <CheckCircle2 size={16} className="text-[#1B59F8]" />
                        </div>
                    </div>
                </article>
            </section>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
                {/* Billing History Card */}
                <article className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/70 px-4 py-3">
                        <div>
                            <p className="text-xs font-bold text-slate-900">
                                Billing History
                            </p>
                            <p className="text-[10px] text-slate-500">
                                AMC invoices and payment records
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => onNavigate("billing")}
                            className="text-xs font-semibold text-[#1B59F8] transition hover:text-blue-700"
                        >
                            View all
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[580px]">
                            <thead>
                                <tr className="border-b border-slate-200/80 bg-slate-50/80">
                                    <th className="px-3.5 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                        Invoice
                                    </th>
                                    <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                        Period
                                    </th>
                                    <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                        Amount
                                    </th>
                                    <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                        Status
                                    </th>
                                    <th className="px-3.5 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {billingHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center">
                                            <ReceiptText size={20} className="mx-auto text-slate-300" />
                                            <p className="mt-2 text-xs font-semibold text-slate-600">
                                                No AMC invoices available
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    billingHistory.slice(0, 5).map((bill) => (
                                        <tr
                                            key={bill.id}
                                            className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition"
                                        >
                                            <td className="px-3.5 py-2.5">
                                                <p className="text-xs font-semibold text-slate-900">
                                                    {bill.invoiceCode || bill.invoiceNo || "—"}
                                                </p>
                                                <p className="text-[10px] text-slate-400">
                                                    {bill.invoiceDate ? formatDate(bill.invoiceDate) : "—"}
                                                </p>
                                            </td>

                                            <td className="px-3 py-2.5">
                                                <p className="text-[11px] font-medium text-slate-700">
                                                    {invoicePeriod(bill)}
                                                </p>
                                                <p className="text-[10px] text-slate-400">
                                                    {bill.productName || ""}
                                                </p>
                                            </td>

                                            <td className="px-3 py-2.5 text-xs font-bold text-slate-900">
                                                {formatCurrency(bill.totalAmount ?? bill.amount ?? 0)}
                                            </td>

                                            <td className="px-3 py-2.5">
                                                <StatusBadge status={bill.paymentStatus || bill.status || "Pending"} />
                                            </td>

                                            <td className="px-3.5 py-2.5 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => onNavigate("billing")}
                                                    title="Open invoice"
                                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50/50 hover:text-[#1B59F8]"
                                                >
                                                    <ArrowRight size={13} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </article>

                {/* Support Tickets Card */}
                <article className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/70 px-4 py-3">
                        <div>
                            <p className="text-xs font-bold text-slate-900">
                                Support Tickets
                            </p>
                            <p className="text-[10px] text-slate-500">
                                Your latest support requests
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => onNavigate("tickets")}
                            className="flex h-7 items-center gap-1 rounded-md bg-[#1B59F8] px-2.5 text-[11px] font-semibold text-white shadow-xs transition hover:bg-[#1548D1] active:scale-98"
                        >
                            <Plus size={12} strokeWidth={2.5} />
                            Raise Ticket
                        </button>
                    </div>

                    <div className="p-3.5 space-y-2.5">
                        {supportTickets.length === 0 ? (
                            <div className="py-8 text-center text-xs text-slate-400">
                                No support tickets currently open.
                            </div>
                        ) : (
                            supportTickets.slice(0, 5).map((ticket) => (
                                <div
                                    key={ticket.id}
                                    className="rounded-lg border border-slate-200/80 bg-slate-50/40 p-3 transition hover:bg-slate-50"
                                >
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                                <span className="font-semibold text-[#1B59F8]">{ticket.id}</span>
                                                <span>•</span>
                                                <span>{ticket.createdAt}</span>
                                            </div>

                                            <h3 className="mt-0.5 text-xs font-bold text-slate-900 line-clamp-1">
                                                {ticket.title}
                                            </h3>

                                            <p className="mt-1 text-[10px] text-slate-500">
                                                Handled by <span className="font-semibold text-slate-700">{ticket.assignedTo}</span>
                                            </p>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-1.5">
                                            <PriorityBadge priority={ticket.priority} />
                                            <StatusBadge status={ticket.status} />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}

                        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-2.5 text-center">
                            <p className="text-[10px] leading-relaxed text-slate-500">
                                Facing an issue? Our engineering team typically responds within 4 business hours.
                            </p>
                        </div>
                    </div>
                </article>
            </section>

            {/* Recent Activity Section */}
            <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/70 px-4 py-3">
                    <div>
                        <p className="text-xs font-bold text-slate-900">
                            Recent Activity
                        </p>
                        <p className="text-[10px] text-slate-500">
                            Latest updates for your account
                        </p>
                    </div>

                    <CheckCircle2 size={16} className="text-emerald-500" />
                </div>

                <div className="grid divide-y divide-slate-100 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
                    {recentActivity.length === 0 ? (
                        <div className="col-span-3 py-6 text-center text-xs text-slate-400">
                            No recent activity recorded.
                        </div>
                    ) : (
                        recentActivity.map((activity) => {
                            const Icon = activity.icon;

                            return (
                                <div
                                    key={activity.id}
                                    className="flex items-start gap-2.5 p-3.5 transition hover:bg-slate-50/60"
                                >
                                    <div
                                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${activity.iconClass}`}
                                    >
                                        <Icon size={14} />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-900 truncate">
                                            {activity.title}
                                        </p>

                                        <p className="mt-0.5 text-[10px] leading-snug text-slate-500 line-clamp-2">
                                            {activity.description}
                                        </p>

                                        <p className="mt-1 text-[9px] font-medium text-slate-400">
                                            {activity.time}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </section>
        </div>
    );
}