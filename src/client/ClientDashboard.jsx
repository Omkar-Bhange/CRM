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

const API_URL = "http://localhost:5000";

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
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ring-1 ring-inset ${
                statusClasses[status] ||
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
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-bold uppercase ring-1 ring-inset ${
                priorityClasses[priority] ||
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
}) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {label}
                    </p>

                    <p className="mt-2 truncate text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                        {value}
                    </p>
                </div>

                <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
                >
                    <Icon size={18} />
                </div>
            </div>

            <p className="mt-4 text-[10px] font-medium text-slate-500">
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
                const response = await fetch(`${API_URL}/api/client/dashboard`, {
                    headers: { Authorization: `Bearer ${getAuthToken()}` },
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(result.message || "Unable to load dashboard.");
                }

                const data = result.data;

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
        <div>
            <section className="flex flex-col gap-5 border-b border-slate-200 pb-7 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-600">
                        <span className="h-2 w-2 rounded-full bg-cyan-500" />
                        Client Workspace
                    </div>

                    <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
                        Welcome, {client?.contactPerson || client?.companyName || "Client"}
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                        Review your software licence, annual charges,
                        invoices and active support requests.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() => onNavigate("tickets")}
                        className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                    >
                        <LifeBuoy size={16} />
                        View Support
                    </button>

                    <button
                        type="button"
                        onClick={() => onNavigate("tickets")}
                        className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0f172a] px-4 text-xs font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-cyan-600"
                    >
                        <Plus size={16} />
                        Raise Ticket
                    </button>
                </div>
            </section>

            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    label="Active Products"
                    value={String(summary.activeProductCount)}
                    description={`${summary.activeProductCount} product${summary.activeProductCount === 1 ? "" : "s"} currently active`}
                    icon={Box}
                    iconClass="bg-cyan-100 text-cyan-700"
                />

                <SummaryCard
                    label="AMC Status"
                    value={summary.amcStatus || "—"}
                    description={summary.nextRenewal ? `Next renewal on ${summary.nextRenewal}` : "No renewal date on file"}
                    icon={IndianRupee}
                    iconClass="bg-amber-100 text-amber-700"
                />

                <SummaryCard
                    label="Open Tickets"
                    value={String(summary.openTicketCount)}
                    description={`${summary.openTicketCount} ticket${summary.openTicketCount === 1 ? "" : "s"} currently open`}
                    icon={Headphones}
                    iconClass="bg-blue-100 text-blue-700"
                />

                <SummaryCard
                    label="Licensed Users"
                    value={String(summary.totalLicensedUsers)}
                    description="Users permitted across all licences"
                    icon={Users}
                    iconClass="bg-violet-100 text-violet-700"
                />
            </section>

            <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
                <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                        <div>
                            <p className="text-sm font-semibold text-slate-950">
                                Purchased Software
                            </p>

                            <p className="mt-1 text-[10px] text-slate-500">
                                Software licensed to your company
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => onNavigate("products")}
                            className="flex items-center gap-1 text-xs font-semibold text-cyan-600 transition hover:text-cyan-700"
                        >
                            View all
                            <ArrowRight size={14} />
                        </button>
                    </div>

                    <div className="p-5">
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex min-w-0 items-start gap-4">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                                            <Box size={20} />
                                        </div>

                                        <div className="min-w-0">
                                            <h3 className="truncate text-base font-semibold text-slate-950">
                                                {product.name}
                                            </h3>

                                            <p className="mt-1 text-[10px] text-slate-500">
                                                {product.description} ·{" "}
                                                {product.version}
                                            </p>
                                        </div>
                                    </div>

                                    <StatusBadge
                                        status={product.status}
                                    />
                                </div>

                                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-xl bg-white px-3 py-2.5">
                                        <p className="text-[9px] uppercase tracking-wide text-slate-400">
                                            Purchased on
                                        </p>

                                        <p className="mt-1 text-xs font-semibold text-slate-800">
                                            {product.purchaseDate}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-white px-3 py-2.5">
                                        <p className="text-[9px] uppercase tracking-wide text-slate-400">
                                            Licensed users
                                        </p>

                                        <p className="mt-1 text-xs font-semibold text-slate-800">
                                            {product.licensedUsers}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-white px-3 py-2.5 sm:col-span-2">
                                        <p className="text-[9px] uppercase tracking-wide text-slate-400">
                                            Support plan
                                        </p>

                                        <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-800">
                                            <ShieldCheck
                                                size={14}
                                                className="text-emerald-600"
                                            />
                                            {product.supportPlan}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </article>

                <article className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                    <div className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-white px-5 py-4">
                        <div className="flex items-center gap-2 text-amber-700">
                            <BellRing size={16} />

                            <p className="text-[10px] font-semibold uppercase tracking-[0.15em]">
                                Annual charges due
                            </p>
                        </div>
                    </div>

                    <div className="p-5 sm:p-6">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                                    {summary.amcStatus || "Not Started"}
                                </p>

                                <p className="mt-2 text-xs text-slate-500">
                                    {summary.nextRenewal
                                        ? (
                                            <>
                                                Next renewal due on{" "}
                                                <span className="font-semibold text-slate-800">
                                                    {summary.nextRenewal}
                                                </span>
                                            </>
                                        )
                                        : "No renewal date on file yet."}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => onNavigate("billing")}
                                className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400"
                            >
                                <Download size={16} />
                                View Billing Page
                            </button>
                        </div>

                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl bg-slate-50 p-3">
                                <CalendarDays
                                    size={16}
                                    className="text-slate-500"
                                />

                                <p className="mt-2 text-[9px] uppercase tracking-wide text-slate-400">
                                    Next renewal
                                </p>

                                <p className="mt-1 text-xs font-semibold text-slate-800">
                                    {summary.nextRenewal || "—"}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-3">
                                <CreditCard
                                    size={16}
                                    className="text-cyan-600"
                                />

                                <p className="mt-2 text-[9px] uppercase tracking-wide text-slate-400">
                                    Status
                                </p>

                                <div className="mt-1">
                                    <StatusBadge status={summary.amcStatus} />
                                </div>
                            </div>
                        </div>

                        <p className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-[10px] leading-4 text-slate-500">
                            Detailed invoice amounts and due dates will appear here once the billing module is connected.
                        </p>
                    </div>
                </article>
            </section>

            <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
                <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                        <div>
                            <p className="text-sm font-semibold text-slate-950">
                                Billing History
                            </p>

                            <p className="mt-1 text-[10px] text-slate-500">
                                AMC invoices and previous payments
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => onNavigate("billing")}
                            className="text-xs font-semibold text-cyan-600 transition hover:text-cyan-700"
                        >
                            View all
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[620px]">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/70">
                                    <th className="px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                        Invoice
                                    </th>

                                    <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                        Period
                                    </th>

                                    <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                        Amount
                                    </th>

                                    <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                        Status
                                    </th>

                                    <th className="px-5 py-3 text-right text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                        PDF
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {billingHistory.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-8 text-center text-xs text-slate-400">
                                            No invoices yet — this will populate once billing is connected.
                                        </td>
                                    </tr>
                                )}

                                {billingHistory.map((bill) => (
                                    <tr
                                        key={bill.id}
                                        className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                                    >
                                        <td className="px-5 py-4 text-xs font-semibold text-slate-950">
                                            {bill.invoiceNo}
                                        </td>

                                        <td className="px-4 py-4 text-xs text-slate-500">
                                            {bill.period}
                                        </td>

                                        <td className="px-4 py-4 text-xs font-semibold text-slate-800">
                                            {bill.amount}
                                        </td>

                                        <td className="px-4 py-4">
                                            <StatusBadge
                                                status={bill.status}
                                            />
                                        </td>

                                        <td className="px-5 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={handleDownloadBill}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                                            >
                                                <FileText size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </article>

                <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                        <div>
                            <p className="text-sm font-semibold text-slate-950">
                                Support Tickets
                            </p>

                            <p className="mt-1 text-[10px] text-slate-500">
                                Your latest support requests
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => onNavigate("tickets")}
                            className="flex h-8 items-center gap-1.5 rounded-lg bg-cyan-500 px-3 text-[10px] font-semibold text-slate-950 transition hover:bg-cyan-400"
                        >
                            <Plus size={13} />
                            Raise Ticket
                        </button>
                    </div>

                    <div className="p-5">
                        {supportTickets.map((ticket) => (
                            <div key={ticket.id}>
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-semibold leading-5 text-slate-950">
                                            {ticket.title}
                                        </h3>

                                        <p className="mt-1 text-[10px] text-slate-500">
                                            {ticket.id} ·{" "}
                                            {ticket.createdAt}
                                        </p>

                                        <p className="mt-2 text-[10px] text-slate-500">
                                            Handled by{" "}
                                            <span className="font-semibold text-slate-700">
                                                {ticket.assignedTo}
                                            </span>
                                        </p>
                                    </div>

                                    <div className="flex shrink-0 flex-wrap gap-2">
                                        <PriorityBadge
                                            priority={
                                                ticket.priority
                                            }
                                        />

                                        <StatusBadge
                                            status={ticket.status}
                                        />
                                    </div>
                                </div>

                                <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-center">
                                    <p className="text-[10px] leading-5 text-slate-500">
                                        Facing another issue with
                                        NexERP? Raise a support ticket
                                        and our team will respond within
                                        four working hours.
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </article>
            </section>

            <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <div>
                        <p className="text-sm font-semibold text-slate-950">
                            Recent Activity
                        </p>

                        <p className="mt-1 text-[10px] text-slate-500">
                            Latest updates for your account
                        </p>
                    </div>

                    <CheckCircle2
                        size={18}
                        className="text-emerald-500"
                    />
                </div>

                <div className="grid divide-y divide-slate-100 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
                    {recentActivity.map((activity) => {
                        const Icon = activity.icon;

                        return (
                            <div
                                key={activity.id}
                                className="flex gap-3 p-5 transition hover:bg-slate-50/70"
                            >
                                <div
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${activity.iconClass}`}
                                >
                                    <Icon size={16} />
                                </div>

                                <div>
                                    <p className="text-xs font-semibold text-slate-900">
                                        {activity.title}
                                    </p>

                                    <p className="mt-1 text-[10px] leading-4 text-slate-500">
                                        {activity.description}
                                    </p>

                                    <p className="mt-2 text-[9px] font-medium text-slate-400">
                                        {activity.time}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}