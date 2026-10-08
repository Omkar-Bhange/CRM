import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import {
    AlertTriangle,
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
    RefreshCw,
    ShieldAlert,
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

function parseLocalDate(value) {
    if (!value) return null;
    try {
        const rawValue = String(value).trim();
        const match = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
            return new Date(
                Number(match[1]),
                Number(match[2]) - 1,
                Number(match[3])
            );
        }
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    } catch {
        return null;
    }
}

function formatDate(value) {
    const date = parseLocalDate(value);
    if (!date) return "Not available";
    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function getDaysDiff(value) {
    const target = parseLocalDate(value);
    if (!target) return null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const diffMs = targetDay.getTime() - today.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
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
        Active: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
        Paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
        Pending: "bg-amber-50 text-amber-700 ring-amber-600/10",
        Overdue: "bg-rose-50 text-rose-700 ring-rose-600/10",
        "Partially Paid": "bg-blue-50 text-blue-700 ring-blue-600/10",
        "In Progress": "bg-blue-50 text-blue-700 ring-blue-600/10",
        Assigned: "bg-indigo-50 text-indigo-700 ring-indigo-600/10",
        New: "bg-amber-50 text-amber-700 ring-amber-600/10",
        Resolved: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
        Closed: "bg-slate-100 text-slate-600 ring-slate-500/10",
        Inactive: "bg-slate-100 text-slate-600 ring-slate-500/10",
    };

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ring-1 ring-inset ${
                statusClasses[status] || "bg-slate-100 text-slate-600 ring-slate-500/10"
            }`}
        >
            {status || "—"}
        </span>
    );
}

function PriorityBadge({ priority }) {
    const priorityClasses = {
        Low: "bg-slate-100 text-slate-600 ring-slate-500/10",
        Medium: "bg-amber-50 text-amber-700 ring-amber-600/10",
        High: "bg-orange-50 text-orange-700 ring-orange-600/10",
        Critical: "bg-rose-50 text-rose-700 ring-rose-600/10",
    };

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-bold uppercase ring-1 ring-inset ${
                priorityClasses[priority] || priorityClasses.Low
            }`}
        >
            {priority || "Normal"}
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
        currentContract: null,
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [downloadingId, setDownloadingId] = useState(null);

    const getAuthToken = () => {
        return (
            localStorage.getItem("client-connect-token") ||
            sessionStorage.getItem("client-connect-token") ||
            ""
        );
    };

    const loadDashboard = async () => {
        try {
            setLoading(true);
            setError("");
            const token = getAuthToken();

            const [response, amcResponse, invoiceResponse] = await Promise.all([
                fetch(`${API_URL}/api/client/dashboard`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }),

                fetch(`${API_URL}/api/client/amc/dashboard`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }),

                fetch(`${API_URL}/api/client/amc/invoices`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }),
            ]);

            const [result, amcResult, invoiceResult] = await Promise.all([
                response.json(),
                amcResponse.json(),
                invoiceResponse.json(),
            ]);

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Unable to load dashboard."
                );
            }

            if (!amcResponse.ok || !amcResult.success) {
                throw new Error(
                    amcResult.message || "Unable to load AMC billing."
                );
            }

            if (!invoiceResponse.ok || !invoiceResult.success) {
                throw new Error(
                    invoiceResult.message || "Unable to load AMC invoices."
                );
            }

            const data = result.data;

            setAmcBilling({
                totalBilled: Number(amcResult.data?.totalBilled || 0),
                totalPaid: Number(amcResult.data?.totalPaid || 0),
                pendingAmount: Number(amcResult.data?.pendingAmount || 0),
                nextDueDate: amcResult.data?.nextDueDate || null,
                latestInvoice: amcResult.data?.latestInvoice || null,
                currentContract: amcResult.data?.currentContract || null,
            });

            // FIX: Retain invoices fetched from /api/client/amc/invoices
            // Do NOT overwrite with data.billingHistory!
            setBillingHistory(invoiceResult.data || []);

            setClient(data.client);
            setSummary(data.summary || {
                activeProductCount: (data.products || []).length,
                openTicketCount: (data.tickets || []).filter((t) => t.status !== "Closed" && t.status !== "Resolved").length,
                totalLicensedUsers: (data.products || []).reduce((acc, p) => acc + (p.licensedUsers || 0), 0),
                amcStatus: data.client?.amcStatus || "Not Started",
                nextRenewal: data.client?.nextRenewal || "",
            });

            setProducts(
                (data.products || []).map((product) => ({
                    id: product._id,
                    name: product.productName,
                    description: product.notes || "",
                    version: product.version || "v1.0",
                    purchaseDate: product.purchaseDate ? formatDate(product.purchaseDate) : "—",
                    expiryDate: product.expiryDate || null,
                    licensedUsers: product.licensedUsers || 1,
                    supportPlan: product.supportType || "Standard Support",
                    status: product.installationStatus === "Inactive" ? "Inactive" : "Active",
                }))
            );

            setSupportTickets(
                (data.tickets || []).map((ticket) => ({
                    id: ticket.ticketCode || "TKT",
                    title: ticket.title,
                    createdAt: new Date(ticket.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                    assignedTo: ticket.assignedEmployeeName || "Support Team",
                    priority: ticket.priority,
                    status: ticket.status,
                }))
            );

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
            console.error("Client dashboard load error:", err);
            setError(
                "We couldn't load your account overview right now. Please check your connection and try again."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    // Active primary invoice determination
    const currentInvoice =
        amcBilling.latestInvoice ||
        billingHistory[0] ||
        null;

    const pendingAmount = Number(
        currentInvoice?.balanceAmount ??
        currentInvoice?.pendingAmount ??
        amcBilling.pendingAmount ??
        0
    );

    const paidAmount = Number(
        currentInvoice?.paidAmount ?? 0
    );

    const invoiceAmount = Number(
        currentInvoice?.totalAmount ??
        currentInvoice?.amount ??
        0
    );

    const paymentStatus =
        currentInvoice?.paymentStatus ||
        currentInvoice?.status ||
        summary.amcStatus ||
        "Pending";

    // Client-side fallback PDF generator ensuring users always get a genuine invoice copy
    const generateFallbackInvoicePdf = (invoice) => {
        if (!invoice) return;
        const doc = new jsPDF();

        // Navy Header
        doc.setFillColor(11, 21, 40);
        doc.rect(0, 0, 210, 36, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("TOTAL SOLUTION NEXORA", 15, 16);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(203, 213, 225);
        doc.text("Business Operations Platform & Client Services", 15, 23);
        doc.text("Official AMC Invoice Copy", 15, 29);

        // Right Invoice Details
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text("AMC INVOICE", 145, 16);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(203, 213, 225);
        doc.text(invoice.invoiceCode || invoice.invoiceNo || "AMC-INV", 145, 23);

        // Client & Info Box
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(15, 44, 180, 42, 2, 2, "FD");

        doc.setTextColor(100, 116, 139);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("BILLED TO:", 22, 52);
        doc.text("INVOICE SUMMARY:", 110, 52);

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(client?.companyName || "Client Account", 22, 60);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text(`Contact: ${client?.contactPerson || "Authorized Person"}`, 22, 67);
        if (client?.email) doc.text(`Email: ${client.email}`, 22, 73);
        if (client?.mobile) doc.text(`Phone: ${client.mobile}`, 22, 79);

        doc.text(`Invoice Date: ${formatDate(invoice.invoiceDate || invoice.createdAt)}`, 110, 60);
        doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 110, 67);
        doc.text(`Status: ${invoice.paymentStatus || invoice.status || "Pending"}`, 110, 73);
        doc.text(`Coverage: ${invoicePeriod(invoice)}`, 110, 79);

        // Services Table
        doc.setFillColor(241, 245, 249);
        doc.rect(15, 94, 180, 10, "F");
        doc.setTextColor(51, 65, 85);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("SERVICE / DESCRIPTION", 22, 100);
        doc.text("PERIOD", 100, 100);
        doc.text("AMOUNT (INR)", 155, 100);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(9);
        const prod = invoice.productName || amcBilling.currentContract?.productName || "Annual Maintenance Contract (AMC)";
        doc.text(prod, 22, 112);
        doc.text(invoicePeriod(invoice), 100, 112);
        doc.text(formatCurrency(invoice.totalAmount ?? invoice.amount ?? 0), 155, 112);

        doc.setDrawColor(226, 232, 240);
        doc.line(15, 120, 195, 120);

        // Amounts
        const tot = Number(invoice.totalAmount ?? invoice.amount ?? 0);
        const pd = Number(invoice.paidAmount ?? 0);
        const bal = Number(invoice.balanceAmount ?? (tot - pd));

        let y = 130;
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text("Total Amount:", 120, y);
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text(formatCurrency(tot), 160, y);

        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text("Amount Paid:", 120, y);
        doc.setTextColor(22, 101, 52);
        doc.text(formatCurrency(pd), 160, y);

        y += 8;
        doc.setTextColor(100, 116, 139);
        doc.text("Balance Due:", 120, y);
        doc.setTextColor(bal > 0 ? 185 : 22, bal > 0 ? 28 : 101, bal > 0 ? 28 : 52);
        doc.setFont("helvetica", "bold");
        doc.text(formatCurrency(bal), 160, y);

        // Footer
        doc.setDrawColor(226, 232, 240);
        doc.line(15, 260, 195, 260);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(148, 163, 184);
        doc.text("This document was generated from your Nexora Client Self-Service Portal.", 15, 268);
        doc.text(`Generated on ${new Date().toLocaleDateString("en-IN")}`, 15, 273);

        doc.save(`${invoice.invoiceCode || "AMC-Invoice"}.pdf`);
    };

    // Download invoice handler connecting to the real backend route with client-side fallback
    const handleDownloadInvoice = async (invoice) => {
        const inv = invoice || currentInvoice;
        const invId = inv?.id || inv?._id;
        if (!invId) {
            alert("No invoice selected for download.");
            return;
        }

        try {
            setDownloadingId(invId);
            const token = getAuthToken();
            const response = await fetch(`${API_URL}/api/client/amc/invoice/${invId}/pdf`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const blob = await response.blob();
                const objectUrl = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = objectUrl;
                link.download = `${inv.invoiceCode || "AMC-Invoice"}.pdf`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
                return;
            }

            // If backend returned 404 (no file upload attached), generate clean PDF
            generateFallbackInvoicePdf(inv);
        } catch (err) {
            console.warn("Backend PDF download fallback triggered:", err);
            generateFallbackInvoicePdf(inv);
        } finally {
            setDownloadingId(null);
        }
    };

    // Determine Action Required hero state with priority cascading
    // Priority 1: Overdue Payment
    const overdueInvoice = billingHistory.find((inv) => {
        const isUnpaid = inv.paymentStatus !== "Paid" && inv.status !== "Cancelled";
        const balance = Number(inv.balanceAmount ?? (inv.totalAmount - (inv.paidAmount || 0)));
        if (!isUnpaid || balance <= 0 || !inv.dueDate) return false;
        const diff = getDaysDiff(inv.dueDate);
        return diff !== null && diff < 0;
    });

    // Priority 2: Pending Payment
    const unpaidInvoice = billingHistory.find((inv) => {
        const isUnpaid = inv.paymentStatus !== "Paid" && inv.status !== "Cancelled";
        const balance = Number(inv.balanceAmount ?? (inv.totalAmount - (inv.paidAmount || 0)));
        return isUnpaid && balance > 0;
    }) || (amcBilling.pendingAmount > 0 ? amcBilling.latestInvoice : null);

    const totalOutstanding = Number(
        overdueInvoice
            ? overdueInvoice.balanceAmount ?? overdueInvoice.pendingAmount ?? overdueInvoice.totalAmount
            : unpaidInvoice
            ? unpaidInvoice.balanceAmount ?? unpaidInvoice.pendingAmount ?? amcBilling.pendingAmount
            : amcBilling.pendingAmount ?? 0
    );

    // Priority 3: AMC Contract Expiry
    const rawContractExpiry =
        amcBilling.currentContract?.endDate ||
        amcBilling.latestInvoice?.contractExpiryDate ||
        summary.nextRenewal;
    const contractDaysRemaining = getDaysDiff(rawContractExpiry);
    const isContractExpiringSoon =
        totalOutstanding <= 0 &&
        contractDaysRemaining !== null &&
        contractDaysRemaining <= 30;

    // Greeting logic
    const currentHour = new Date().getHours();
    const greetingTime =
        currentHour < 12
            ? "Good morning"
            : currentHour < 17
            ? "Good afternoon"
            : "Good evening";

    // AMC Status calculation for KPI Card
    let amcStatusText = "Active";
    let amcDescription = "Valid AMC coverage";
    let amcStatusColor = "bg-emerald-50 text-emerald-700";
    let amcDescriptionColor = "text-emerald-700 font-semibold";

    if (!rawContractExpiry && summary.amcStatus === "Not Started") {
        amcStatusText = "No Active AMC";
        amcDescription = "Contact support to activate";
        amcStatusColor = "bg-slate-100 text-slate-600";
        amcDescriptionColor = "text-slate-500";
    } else if (contractDaysRemaining !== null) {
        if (contractDaysRemaining < 0) {
            amcStatusText = "Expired";
            amcDescription = `Expired ${Math.abs(contractDaysRemaining)} days ago`;
            amcStatusColor = "bg-rose-50 text-rose-700";
            amcDescriptionColor = "text-rose-600 font-semibold";
        } else if (contractDaysRemaining <= 30) {
            amcStatusText = "Expiring Soon";
            amcDescription = `${contractDaysRemaining} day${contractDaysRemaining === 1 ? "" : "s"} remaining`;
            amcStatusColor = "bg-amber-50 text-amber-700";
            amcDescriptionColor = "text-amber-600 font-semibold";
        } else {
            amcStatusText = "Active";
            amcDescription = `Expires ${formatDate(rawContractExpiry)}`;
            amcStatusColor = "bg-emerald-50 text-emerald-700";
            amcDescriptionColor = "text-slate-500";
        }
    }

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                {/* Header Skeleton */}
                <div className="h-28 rounded-xl border border-slate-200 bg-white p-5" />

                {/* Action Hero Skeleton */}
                <div className="h-24 rounded-xl border border-slate-200 bg-white p-5" />

                {/* KPI Skeletons */}
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                    <div className="h-24 rounded-xl border border-slate-200 bg-white" />
                    <div className="h-24 rounded-xl border border-slate-200 bg-white" />
                    <div className="h-24 rounded-xl border border-slate-200 bg-white" />
                    <div className="h-24 rounded-xl border border-slate-200 bg-white" />
                </div>

                {/* Content Grid Skeleton */}
                <div className="grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                    <div className="h-72 rounded-xl border border-slate-200 bg-white" />
                    <div className="h-72 rounded-xl border border-slate-200 bg-white" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl border border-rose-200 bg-white p-8 text-center shadow-2xs">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                    <AlertTriangle size={22} />
                </div>
                <h2 className="mt-3 text-base font-bold text-slate-900">
                    We couldn't load your account overview right now
                </h2>
                <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Please check your internet connection or try again in a few moments. Your data is safe.
                </p>
                <div className="mt-5 flex items-center justify-center gap-3">
                    <button
                        type="button"
                        onClick={loadDashboard}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#1B59F8] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#1548D1] transition"
                    >
                        <RefreshCw size={14} />
                        Try Again
                    </button>
                    <button
                        type="button"
                        onClick={() => onNavigate("tickets")}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                        Contact Support
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header Greeting Banner */}
            <section className="flex flex-col gap-4 rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="mb-1 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#1B59F8]" />
                        <span className="text-xs font-bold uppercase tracking-wider text-[#1B59F8]">
                            {client?.companyName || "Client Account"}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] font-medium text-slate-400">
                            Client Self-Service Portal
                        </span>
                    </div>

                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                        {greetingTime}, {client?.contactPerson || client?.companyName || "Client"}
                    </h1>

                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                        Review your software licences, maintenance schedules, invoices and active support requests.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onNavigate("tickets")}
                        className="flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-98"
                    >
                        <LifeBuoy size={14} className="text-slate-500" />
                        Support Desk
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

            {/* Quick Actions Row */}
            <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button
                    type="button"
                    onClick={() => onNavigate("tickets")}
                    className="flex items-center gap-2.5 rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-left shadow-2xs transition hover:border-blue-200 hover:bg-blue-50/30"
                >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-50 text-[#1B59F8]">
                        <Headphones size={14} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">Raise Ticket</p>
                        <p className="text-[10px] text-slate-400 truncate">Request support</p>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => onNavigate("billing")}
                    className="flex items-center gap-2.5 rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-left shadow-2xs transition hover:border-amber-200 hover:bg-amber-50/30"
                >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-700">
                        <CreditCard size={14} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">Bills & AMC</p>
                        <p className="text-[10px] text-slate-400 truncate">Invoices & dues</p>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => onNavigate("products")}
                    className="flex items-center gap-2.5 rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-left shadow-2xs transition hover:border-emerald-200 hover:bg-emerald-50/30"
                >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                        <Box size={14} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">My Products</p>
                        <p className="text-[10px] text-slate-400 truncate">Active licences</p>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => onNavigate("documents")}
                    className="flex items-center gap-2.5 rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-left shadow-2xs transition hover:border-violet-200 hover:bg-violet-50/30"
                >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-700">
                        <FileText size={14} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">Documents</p>
                        <p className="text-[10px] text-slate-400 truncate">Contracts & files</p>
                    </div>
                </button>
            </section>

            {/* ACTION REQUIRED HERO SECTION — CONDITIONAL PRIORITY CASCADE */}
            {overdueInvoice ? (
                /* Priority 1: Overdue Payment */
                <article className="rounded-xl border border-rose-200/90 bg-rose-50/50 p-4 sm:p-5 shadow-2xs">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-rose-800 ring-1 ring-inset ring-rose-300">
                                    Payment Overdue
                                </span>
                                <span className="text-xs font-semibold text-rose-700">
                                    Action Required
                                </span>
                            </div>

                            <div className="flex items-baseline gap-3">
                                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                                    {formatCurrency(overdueInvoice.balanceAmount || overdueInvoice.pendingAmount || overdueInvoice.totalAmount)}
                                </h2>
                                <span className="text-xs font-semibold text-rose-700">
                                    Payment is overdue
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                                <span>
                                    Invoice: <strong className="text-slate-800">{overdueInvoice.invoiceCode || overdueInvoice.invoiceNo || "AMC Invoice"}</strong>
                                </span>
                                <span className="text-slate-300">•</span>
                                <span>
                                    Due: <strong className="text-rose-700">{formatDate(overdueInvoice.dueDate)}</strong>
                                </span>
                                {getDaysDiff(overdueInvoice.dueDate) !== null && (
                                    <>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-rose-600 font-medium">
                                            {Math.abs(getDaysDiff(overdueInvoice.dueDate))} days overdue
                                        </span>
                                    </>
                                )}
                            </div>

                            <p className="text-[11px] text-slate-500 leading-snug">
                                Please settle this invoice to avoid any disruption to your AMC support coverage.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                            <button
                                type="button"
                                onClick={() => onNavigate("billing")}
                                className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-rose-700 active:scale-98"
                            >
                                <ReceiptText size={14} />
                                View Invoice
                            </button>

                            <button
                                type="button"
                                disabled={downloadingId === (overdueInvoice.id || overdueInvoice._id)}
                                onClick={() => handleDownloadInvoice(overdueInvoice)}
                                className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                <Download size={14} />
                                {downloadingId === (overdueInvoice.id || overdueInvoice._id) ? "Preparing..." : "Download PDF"}
                            </button>
                        </div>
                    </div>
                </article>
            ) : totalOutstanding > 0 ? (
                /* Priority 2: Pending Payment */
                <article className="rounded-xl border border-amber-200/90 bg-amber-50/50 p-4 sm:p-5 shadow-2xs">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-800 ring-1 ring-inset ring-amber-300">
                                    Payment Due
                                </span>
                                <span className="text-xs font-semibold text-amber-800">
                                    Upcoming Settlement
                                </span>
                            </div>

                            <div className="flex items-baseline gap-3">
                                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                                    {formatCurrency(totalOutstanding)}
                                </h2>
                                <span className="text-xs font-semibold text-slate-600">
                                    Scheduled for renewal
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                                <span>
                                    Due: <strong className="text-slate-800">{formatDate(unpaidInvoice?.dueDate || amcBilling.nextDueDate)}</strong>
                                </span>
                                <span className="text-slate-300">•</span>
                                <span>
                                    Product: <strong className="text-slate-800">{unpaidInvoice?.productName || amcBilling.currentContract?.productName || "Transport Management"}</strong>
                                </span>
                                {unpaidInvoice?.invoiceCode && (
                                    <>
                                        <span className="text-slate-300">•</span>
                                        <span>Invoice: <strong className="text-slate-800">{unpaidInvoice.invoiceCode}</strong></span>
                                    </>
                                )}
                            </div>

                            <p className="text-[11px] text-slate-500 leading-snug">
                                An annual maintenance charge is scheduled. Review the breakdown or download your invoice copy.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                            <button
                                type="button"
                                onClick={() => onNavigate("billing")}
                                className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-[#1548D1] active:scale-98"
                            >
                                <ReceiptText size={14} />
                                View Invoice
                            </button>

                            <button
                                type="button"
                                disabled={downloadingId === (unpaidInvoice?.id || unpaidInvoice?._id)}
                                onClick={() => handleDownloadInvoice(unpaidInvoice || currentInvoice)}
                                className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                <Download size={14} />
                                {downloadingId === (unpaidInvoice?.id || unpaidInvoice?._id) ? "Preparing..." : "Download PDF"}
                            </button>
                        </div>
                    </div>
                </article>
            ) : isContractExpiringSoon ? (
                /* Priority 3: AMC Contract Expiring Soon / Expired */
                <article className="rounded-xl border border-blue-200/90 bg-blue-50/50 p-4 sm:p-5 shadow-2xs">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-800 ring-1 ring-inset ring-blue-300">
                                    {contractDaysRemaining < 0 ? "Renewal Due" : "Renewal Coming Up"}
                                </span>
                                <span className="text-xs font-semibold text-blue-800">
                                    Contract Renewal
                                </span>
                            </div>

                            <h2 className="text-xl font-bold tracking-tight text-slate-900">
                                {amcBilling.currentContract?.productName || "Software Maintenance Contract"}
                            </h2>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                                <span>
                                    AMC expires: <strong className="text-slate-800">{formatDate(rawContractExpiry)}</strong>
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className={contractDaysRemaining < 0 ? "text-rose-600 font-semibold" : "text-amber-700 font-semibold"}>
                                    {contractDaysRemaining < 0
                                        ? `Expired ${Math.abs(contractDaysRemaining)} days ago`
                                        : `${contractDaysRemaining} day${contractDaysRemaining === 1 ? "" : "s"} remaining`}
                                </span>
                            </div>

                            <p className="text-[11px] text-slate-500 leading-snug">
                                Renew early to continue uninterrupted software updates and priority technical assistance.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                            <button
                                type="button"
                                onClick={() => onNavigate("billing")}
                                className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-[#1548D1] active:scale-98"
                            >
                                <ShieldCheck size={14} />
                                View AMC
                            </button>
                        </div>
                    </div>
                </article>
            ) : (
                /* Priority 5: All Caught Up */
                <article className="rounded-xl border border-emerald-200/90 bg-emerald-50/50 p-4 sm:p-5 shadow-2xs">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3.5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 ring-4 ring-emerald-50">
                                <CheckCircle2 size={20} />
                            </div>

                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-800 ring-1 ring-inset ring-emerald-300">
                                        All Caught Up
                                    </span>
                                    <span className="text-[11px] font-medium text-emerald-700">
                                        Status Normal
                                    </span>
                                </div>

                                <h2 className="mt-1 text-base font-bold text-slate-900">
                                    You're all caught up
                                </h2>

                                <p className="mt-0.5 text-xs text-slate-600">
                                    No payments or actions require your attention right now. Your products and support remain active.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 sm:self-center">
                            <button
                                type="button"
                                onClick={() => onNavigate("billing")}
                                className="flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
                            >
                                <ReceiptText size={14} className="text-slate-500" />
                                View Invoices
                            </button>
                        </div>
                    </div>
                </article>
            )}

            {/* TOP 4 KPI CARDS */}
            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {/* 1. Active Products */}
                <SummaryCard
                    label="Active Products"
                    value={String(summary.activeProductCount)}
                    description={`${summary.activeProductCount} software licence${summary.activeProductCount === 1 ? "" : "s"} active`}
                    icon={Box}
                    iconClass="bg-blue-50 text-[#1B59F8]"
                />

                {/* 2. AMC / Support Status */}
                <SummaryCard
                    label="AMC / Support"
                    value={amcStatusText}
                    description={amcDescription}
                    icon={ShieldCheck}
                    iconClass={amcStatusColor}
                    descriptionClass={amcDescriptionColor}
                />

                {/* 3. Amount Due (Calm ₹0 when nothing owed!) */}
                <SummaryCard
                    label="Amount Due"
                    value={formatCurrency(totalOutstanding)}
                    description={
                        totalOutstanding > 0
                            ? overdueInvoice
                                ? "Payment is overdue"
                                : `Due: ${formatDate(unpaidInvoice?.dueDate || amcBilling.nextDueDate)}`
                            : "No payment due"
                    }
                    icon={totalOutstanding > 0 ? CreditCard : CheckCircle2}
                    iconClass={
                        totalOutstanding > 0
                            ? overdueInvoice
                                ? "bg-rose-50 text-rose-700"
                                : "bg-amber-50 text-amber-700"
                            : "bg-emerald-50 text-emerald-700"
                    }
                    descriptionClass={
                        totalOutstanding > 0
                            ? overdueInvoice
                                ? "text-rose-600 font-semibold"
                                : "text-amber-600 font-semibold"
                            : "text-emerald-700 font-medium"
                    }
                />

                {/* 4. Open Tickets */}
                <SummaryCard
                    label="Open Tickets"
                    value={String(summary.openTicketCount)}
                    description={
                        summary.openTicketCount > 0
                            ? `${summary.openTicketCount} active request${summary.openTicketCount === 1 ? "" : "s"}`
                            : "No open support issues"
                    }
                    icon={Headphones}
                    iconClass="bg-indigo-50 text-indigo-700"
                />
            </section>

            {/* MAIN TWO-COLUMN SPLIT */}
            <section className="grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                {/* Purchased Software Card — Clean without fake percentage bars */}
                <article className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/70 px-4 py-3">
                        <div>
                            <p className="text-xs font-bold text-slate-900">
                                Purchased Software
                            </p>
                            <p className="text-[10px] text-slate-500">
                                Software registered to your organization
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
                                No software products registered yet. Contact our team if you need assistance.
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
                                                    {product.description || "Registered software licence"} · {product.version}
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
                                                {product.purchaseDate}
                                            </p>
                                        </div>

                                        <div className="rounded-md border border-slate-200/70 bg-white px-2.5 py-1.5">
                                            <p className="text-[9px] uppercase font-semibold tracking-wider text-slate-400">
                                                Licensed seats
                                            </p>
                                            <p className="mt-0.5 text-xs font-semibold text-slate-800">
                                                {product.licensedUsers} {product.licensedUsers === 1 ? "User" : "Users"}
                                            </p>
                                        </div>

                                        <div className="rounded-md border border-slate-200/70 bg-white px-2.5 py-1.5 sm:col-span-2">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-[9px] uppercase font-semibold tracking-wider text-slate-400">
                                                        Support Plan & Validity
                                                    </p>
                                                    <div className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                                                        <ShieldCheck size={13} className="text-emerald-600" />
                                                        {product.supportPlan || "Standard Support"}
                                                        {product.expiryDate && (
                                                            <span className="text-[10px] font-normal text-slate-500">
                                                                · Valid until {formatDate(product.expiryDate)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => onNavigate("products")}
                                                    className="text-[10px] font-semibold text-[#1B59F8] hover:underline"
                                                >
                                                    Details →
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </article>

                {/* AMC Billing Summary Card */}
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
                                        {currentInvoice?.productName || amcBilling.currentContract?.productName || "AMC Coverage"}
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
                                <p className={`mt-1 text-xs sm:text-sm font-bold ${pendingAmount > 0 ? "text-amber-600" : "text-slate-700"}`}>
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
                                <p className="mt-1 text-xs font-semibold text-slate-800">
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

            {/* BILLING HISTORY & SUPPORT TICKETS ROW */}
            <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
                {/* Billing History Card */}
                <article className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/70 px-4 py-3">
                        <div>
                            <p className="text-xs font-bold text-slate-900">
                                Billing History
                            </p>
                            <p className="text-[10px] text-slate-500">
                                Invoices and payment records
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
                                            key={bill.id || bill._id}
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
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDownloadInvoice(bill)}
                                                        title="Download invoice PDF"
                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50/50 hover:text-[#1B59F8]"
                                                    >
                                                        <Download size={13} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => onNavigate("billing")}
                                                        title="Open in billing"
                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50/50 hover:text-[#1B59F8]"
                                                    >
                                                        <ArrowRight size={13} />
                                                    </button>
                                                </div>
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
                                Your recent support requests
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
                                No support tickets currently open. All systems operating normally.
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
                                Need technical help? Our engineering support desk typically replies within 4 business hours.
                            </p>
                        </div>
                    </div>
                </article>
            </section>

            {/* RECENT ACTIVITY SECTION */}
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
                        recentActivity.slice(0, 3).map((activity) => {
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