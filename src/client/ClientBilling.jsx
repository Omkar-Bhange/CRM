import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import {
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    Banknote,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock3,
    CreditCard,
    Download,
    Eye,
    FileText,
    Headphones,
    IndianRupee,
    Loader2,
    Mail,
    Phone,
    ReceiptText,
    RefreshCw,
    Search,
    Send,
    FileQuestion,
    Check,
    ShieldAlert,
    ShieldCheck,
    WalletCards,
    X,
} from "lucide-react";

import API_URL from "../config/api";

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
        const dateOnlyMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (dateOnlyMatch) {
            return new Date(
                Number(dateOnlyMatch[1]),
                Number(dateOnlyMatch[2]) - 1,
                Number(dateOnlyMatch[3])
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
    const start = invoice.contractStartDate || invoice.contractStart || invoice.startDate || null;
    const end = invoice.contractExpiryDate || invoice.contractEnd || invoice.endDate || null;
    if (!start && !end) return "Not available";
    return `${formatDate(start)} — ${formatDate(end)}`;
}

function calculateContractProgress(startDateValue, endDateValue) {
    const start = parseLocalDate(startDateValue);
    const end = parseLocalDate(endDateValue);
    if (!start || !end) return { percent: 0, statusText: "Not available", daysRemaining: null, isExpired: false };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const totalMs = end.getTime() - start.getTime();
    const elapsedMs = today.getTime() - start.getTime();

    const diffMs = end.getTime() - today.getTime();
    const daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (today < start) {
        return { percent: 0, statusText: "Not Started", daysRemaining, isExpired: false };
    }
    if (today > end) {
        return {
            percent: 100,
            statusText: `Expired ${Math.abs(daysRemaining)} days ago`,
            daysRemaining,
            isExpired: true,
        };
    }

    const percent = totalMs > 0 ? Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100))) : 0;
    const statusText = daysRemaining <= 30
        ? `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining`
        : `${percent}% of coverage period elapsed`;

    return { percent, statusText, daysRemaining, isExpired: false };
}

function StatusBadge({ status }) {
    const styles = {
        Paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
        Pending: "bg-amber-50 text-amber-700 ring-amber-600/10",
        Overdue: "bg-rose-50 text-rose-700 ring-rose-600/10",
        "Partially Paid": "bg-blue-50 text-blue-700 ring-blue-600/10",
        Completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
        Active: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
        Cancelled: "bg-slate-100 text-slate-600 ring-slate-500/10",
    };

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ring-1 ring-inset ${
                styles[status] || "bg-slate-100 text-slate-600 ring-slate-500/10"
            }`}
        >
            {status || "—"}
        </span>
    );
}

function SummaryCard({ label, value, description, icon: Icon, iconClass, descriptionClass = "text-slate-500" }) {
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
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
                    <Icon size={16} />
                </div>
            </div>
            <p className={`mt-2.5 truncate text-[10px] font-medium ${descriptionClass}`}>{description}</p>
        </article>
    );
}

function DetailItem({ label, value, icon: Icon, valueClass = "" }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="flex items-center gap-1.5 text-slate-400">
                <Icon size={13} />
                <p className="text-[9px] font-semibold uppercase tracking-wider">{label}</p>
            </div>
            <p className={`mt-1.5 break-words text-xs font-semibold text-slate-800 ${valueClass}`}>{value || "—"}</p>
        </div>
    );
}

export default function ClientBilling() {
    const [searchValue, setSearchValue] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
    const [selectedPaymentRecord, setSelectedPaymentRecord] = useState(null);

    const [paymentSearchValue, setPaymentSearchValue] = useState("");
    const [paymentModeFilter, setPaymentModeFilter] = useState("All Modes");

    const [billingRecords, setBillingRecords] = useState([]);
    const [paymentRecords, setPaymentRecords] = useState([]);
    const [invoiceDocuments, setInvoiceDocuments] = useState([]);
    const [downloadingId, setDownloadingId] = useState(null);
    const [downloadingReceiptId, setDownloadingReceiptId] = useState(null);

    // AMC Requests & Contracts state
    const [allContracts, setAllContracts] = useState([]);
    const [amcRequests, setAmcRequests] = useState([]);
    const [requestModalOpen, setRequestModalOpen] = useState(false);
    const [selectedContractForRequest, setSelectedContractForRequest] = useState(null);
    const [requestType, setRequestType] = useState("AMC Renewal");
    const [preferredStartDate, setPreferredStartDate] = useState("");
    const [requestRemarks, setRequestRemarks] = useState("");
    const [submittingRequest, setSubmittingRequest] = useState(false);
    const [requestError, setRequestError] = useState("");
    const [requestSuccess, setRequestSuccess] = useState("");
    const [detailsModalRequest, setDetailsModalRequest] = useState(null);
    const [cancellingRequestId, setCancellingRequestId] = useState(null);
    const [downloadingQuotationId, setDownloadingQuotationId] = useState(null);

    const [dashboardData, setDashboardData] = useState({
        totalBilled: 0,
        totalPaid: 0,
        pendingAmount: 0,
        nextDueDate: null,
        latestInvoice: null,
        currentContract: null,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const getAuthToken = () => {
        return (
            localStorage.getItem("client-connect-token") ||
            sessionStorage.getItem("client-connect-token") ||
            ""
        );
    };

    const loadBillingData = async () => {
        setLoading(true);
        setError("");

        try {
            const token = getAuthToken();
            const [
                dashboardResponse,
                invoiceResponse,
                paymentResponse,
                documentResponse,
                contractsResponse,
                requestsResponse,
            ] = await Promise.all([
                fetch(`${API_URL}/api/client/amc/dashboard`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${API_URL}/api/client/amc/invoices`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${API_URL}/api/client/amc/payments`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${API_URL}/api/client/amc/documents`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${API_URL}/api/client/amc/contracts`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${API_URL}/api/client/amc/requests`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            const [
                dashboardJson,
                invoiceJson,
                paymentJson,
                documentJson,
                contractsJson,
                requestsJson,
            ] = await Promise.all([
                dashboardResponse.json(),
                invoiceResponse.json(),
                paymentResponse.json(),
                documentResponse.json(),
                contractsResponse.json(),
                requestsResponse.json(),
            ]);

            if (!dashboardResponse.ok || !dashboardJson.success) {
                throw new Error(dashboardJson.message || "Unable to load AMC dashboard.");
            }
            if (!invoiceResponse.ok || !invoiceJson.success) {
                throw new Error(invoiceJson.message || "Unable to load AMC invoices.");
            }
            if (!paymentResponse.ok || !paymentJson.success) {
                throw new Error(paymentJson.message || "Unable to load AMC payments.");
            }

            setDashboardData({
                totalBilled: Number(dashboardJson.data.totalBilled || 0),
                totalPaid: Number(dashboardJson.data.totalPaid || 0),
                pendingAmount: Number(dashboardJson.data.pendingAmount || 0),
                nextDueDate: dashboardJson.data.nextDueDate || null,
                latestInvoice: dashboardJson.data.latestInvoice || null,
                currentContract: dashboardJson.data.currentContract || null,
            });

            setBillingRecords(invoiceJson.data || []);
            setPaymentRecords(paymentJson.data || []);
            setInvoiceDocuments(
                documentResponse.ok && documentJson.success ? documentJson.data || [] : []
            );
            setAllContracts(
                contractsResponse.ok && contractsJson.success ? contractsJson.data || [] : []
            );
            setAmcRequests(
                requestsResponse.ok && requestsJson.success ? requestsJson.data || [] : []
            );
        } catch (err) {
            console.error("Load billing data error:", err);
            setError("We couldn't load your billing information right now.");
        } finally {
            setLoading(false);
        }
    };

    const openRequestModal = (type = "AMC Renewal", contract = null) => {
        const targetContract = contract || dashboardData.currentContract || (allContracts.length > 0 ? allContracts[0] : null);
        setSelectedContractForRequest(targetContract);
        setRequestType(type);
        setRequestError("");
        setRequestSuccess("");
        setRequestRemarks("");
        if (targetContract && targetContract.endDate) {
            const exp = new Date(targetContract.endDate);
            if (!isNaN(exp.getTime())) {
                setPreferredStartDate(exp.toISOString().split("T")[0]);
            } else {
                setPreferredStartDate(new Date().toISOString().split("T")[0]);
            }
        } else {
            setPreferredStartDate(new Date().toISOString().split("T")[0]);
        }
        setRequestModalOpen(true);
    };

    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        if (!selectedContractForRequest) {
            setRequestError("Please select a contract for this request.");
            return;
        }

        setSubmittingRequest(true);
        setRequestError("");
        setRequestSuccess("");

        try {
            const token = getAuthToken();
            const contractId = selectedContractForRequest.id || selectedContractForRequest._id;
            const res = await fetch(`${API_URL}/api/client/amc/renewal-request`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    contractId,
                    requestType,
                    renewalPeriod: "1 Year",
                    preferredStartDate: preferredStartDate || undefined,
                    remarks: requestRemarks,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || "Failed to submit request.");
            }

            setRequestSuccess("Your request has been submitted successfully!");
            setTimeout(async () => {
                setRequestModalOpen(false);
                setRequestSuccess("");
                setRequestRemarks("");
                await loadBillingData();
            }, 1200);
        } catch (err) {
            setRequestError(err.message || "Failed to submit request.");
        } finally {
            setSubmittingRequest(false);
        }
    };

    const handleCancelRequest = async (requestId) => {
        if (!window.confirm("Are you sure you want to cancel this request?")) return;

        try {
            setCancellingRequestId(requestId);
            const token = getAuthToken();
            const res = await fetch(`${API_URL}/api/client/amc/requests/${requestId}/cancel`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ remarks: "Cancelled by client" }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || "Unable to cancel request.");
            }

            await loadBillingData();
        } catch (err) {
            alert(err.message || "Error cancelling request.");
        } finally {
            setCancellingRequestId(null);
        }
    };

    const handleDownloadQuotation = async (requestId, requestCode) => {
        try {
            setDownloadingQuotationId(requestId);
            const token = getAuthToken();
            const res = await fetch(`${API_URL}/api/client/amc/requests/${requestId}/quotation`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || "Failed to download quotation.");
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Quotation_${requestCode || "Document"}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert(err.message || "Error downloading quotation document.");
        } finally {
            setDownloadingQuotationId(null);
        }
    };

    useEffect(() => {
        loadBillingData();
    }, []);

    // Relevant invoice selection using safe priority cascade:
    // 1. Oldest overdue unpaid invoice
    // 2. Upcoming unpaid invoice
    // 3. Latest current paid invoice
    // 4. Otherwise null
    const relevantInvoice = useMemo(() => {
        const unpaidInvoices = billingRecords.filter((inv) => {
            const isUnpaid = inv.paymentStatus !== "Paid" && inv.status !== "Cancelled";
            const balance = Number(inv.balanceAmount ?? (inv.totalAmount - (inv.paidAmount || 0)));
            return isUnpaid && balance > 0;
        });

        // 1. Check for overdue
        const overdue = unpaidInvoices.find((inv) => {
            const diff = getDaysDiff(inv.dueDate);
            return diff !== null && diff < 0;
        });
        if (overdue) return overdue;

        // 2. Upcoming unpaid
        if (unpaidInvoices.length > 0) return unpaidInvoices[0];

        // 3. Latest paid invoice
        const paidInvoices = billingRecords.filter((inv) => (inv.paymentStatus || inv.status) === "Paid");
        if (paidInvoices.length > 0) return paidInvoices[0];

        return dashboardData.latestInvoice || billingRecords[0] || null;
    }, [billingRecords, dashboardData.latestInvoice]);

    const selectedInvoice = useMemo(() => {
        return billingRecords.find((record) => String(record.id) === String(selectedInvoiceId)) || null;
    }, [billingRecords, selectedInvoiceId]);

    // Payments related to selected invoice
    const relatedPaymentsForSelectedInvoice = useMemo(() => {
        if (!selectedInvoice) return [];
        return paymentRecords.filter((p) => {
            const sameCode = p.invoiceCode && selectedInvoice.invoiceCode && p.invoiceCode === selectedInvoice.invoiceCode;
            const sameId = p.invoiceId && selectedInvoice.id && String(p.invoiceId) === String(selectedInvoice.id);
            return sameCode || sameId;
        });
    }, [selectedInvoice, paymentRecords]);

    // Reconciled accounting values directly from backend
    const reconciledTotalBilled = dashboardData.totalBilled;
    const reconciledTotalPaid = dashboardData.totalPaid;
    const reconciledPending = dashboardData.pendingAmount;

    // Filtered Invoices
    const filteredBillingRecords = useMemo(() => {
        const search = searchValue.trim().toLowerCase();

        return billingRecords.filter((record) => {
            const invoiceNumber = record.invoiceCode || record.invoiceNo || "";
            const productName = record.productName || record.product || "";
            const text = `${invoiceNumber} ${productName}`.toLowerCase();

            const isOverdue =
                (record.paymentStatus === "Pending" || record.status === "Pending") &&
                record.dueDate &&
                getDaysDiff(record.dueDate) !== null &&
                getDaysDiff(record.dueDate) < 0;

            const effectiveStatus = isOverdue ? "Overdue" : (record.paymentStatus || record.status || "");

            const matchesSearch = !search || text.includes(search);
            const matchesStatus =
                statusFilter === "All" ||
                effectiveStatus === statusFilter ||
                (statusFilter === "Overdue" && isOverdue);

            return matchesSearch && matchesStatus;
        });
    }, [billingRecords, searchValue, statusFilter]);

    // Filtered Payments
    const filteredPaymentRecords = useMemo(() => {
        const search = paymentSearchValue.trim().toLowerCase();

        return paymentRecords.filter((payment) => {
            const receiptCode = payment.paymentCode || "";
            const invoiceCode = payment.invoiceCode || "";
            const mode = payment.paymentMode || payment.mode || "";
            const refNo = payment.transactionReference || payment.referenceNo || "";
            const text = `${receiptCode} ${invoiceCode} ${mode} ${refNo}`.toLowerCase();

            const matchesSearch = !search || text.includes(search);
            const matchesMode =
                paymentModeFilter === "All Modes" ||
                mode.toLowerCase() === paymentModeFilter.toLowerCase();

            return matchesSearch && matchesMode;
        });
    }, [paymentRecords, paymentSearchValue, paymentModeFilter]);

    // Invoices Pagination
    const [invoicePage, setInvoicePage] = useState(1);
    const [invoicePageSize, setInvoicePageSize] = useState(5);

    useEffect(() => {
        setInvoicePage(1);
    }, [searchValue, statusFilter]);

    const totalInvoices = filteredBillingRecords.length;
    const totalInvoicePages = Math.max(1, Math.ceil(totalInvoices / invoicePageSize));
    const safeInvoicePage = Math.min(Math.max(1, invoicePage), totalInvoicePages);
    const paginatedInvoices = useMemo(() => {
        const start = (safeInvoicePage - 1) * invoicePageSize;
        return filteredBillingRecords.slice(start, start + invoicePageSize);
    }, [filteredBillingRecords, safeInvoicePage, invoicePageSize]);

    // Payments Pagination
    const [paymentPage, setPaymentPage] = useState(1);
    const [paymentPageSize, setPaymentPageSize] = useState(5);

    useEffect(() => {
        setPaymentPage(1);
    }, [paymentSearchValue, paymentModeFilter]);

    const totalPayments = filteredPaymentRecords.length;
    const totalPaymentPages = Math.max(1, Math.ceil(totalPayments / paymentPageSize));
    const safePaymentPage = Math.min(Math.max(1, paymentPage), totalPaymentPages);
    const paginatedPayments = useMemo(() => {
        const start = (safePaymentPage - 1) * paymentPageSize;
        return filteredPaymentRecords.slice(start, start + paymentPageSize);
    }, [filteredPaymentRecords, safePaymentPage, paymentPageSize]);

    const getCustomInvoiceDocument = (invoice) => {
        if (!invoice) return null;
        const invoiceContractId = String(invoice.contractId || invoice.amcContractId || "");
        if (!invoiceContractId) return null;

        return (
            invoiceDocuments.find((document) => {
                const documentType = String(document.documentType || document.type || "").trim().toLowerCase();
                const documentContractId = String(document.contractId || document.amcContractId || "");
                return documentType === "own invoice / bill" && documentContractId === invoiceContractId;
            }) || null
        );
    };

    const downloadCustomInvoice = async (document, invoice) => {
        try {
            if (!document) return false;
            const documentId = document.id || document._id;
            if (!documentId) return false;

            const token = getAuthToken();
            const response = await fetch(`${API_URL}/api/client/amc/document/${documentId}/download`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) return false;

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            const fileName = document.fileName || document.name || `${invoice?.invoiceCode || "AMC-Invoice"}.pdf`;

            const link = window.document.createElement("a");
            link.href = objectUrl;
            link.download = fileName;
            window.document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
            return true;
        } catch {
            return false;
        }
    };

    // Client-side fallback invoice PDF using exact invoice record values
    const generateFallbackInvoicePdf = (invoice) => {
        if (!invoice) return;
        const doc = new jsPDF();

        // Header Banner
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

        // Metadata Box
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(15, 44, 180, 42, 2, 2, "FD");

        doc.setTextColor(100, 116, 139);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("INVOICE SUMMARY:", 22, 52);
        doc.text("TIMELINE & PERIOD:", 110, 52);

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`Invoice: ${invoice.invoiceCode || invoice.invoiceNo || "—"}`, 22, 60);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text(`Product: ${invoice.productName || "AMC Coverage"}`, 22, 67);
        doc.text(`Status: ${invoice.paymentStatus || invoice.status || "Pending"}`, 22, 74);

        doc.text(`Invoice Date: ${formatDate(invoice.invoiceDate || invoice.createdAt)}`, 110, 60);
        doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 110, 67);
        doc.text(`Coverage: ${invoicePeriod(invoice)}`, 110, 74);

        // Table Header
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
        doc.text(invoice.productName || "Annual Maintenance Contract", 22, 112);
        doc.text(invoicePeriod(invoice), 100, 112);
        doc.text(formatCurrency(invoice.totalAmount ?? invoice.amount ?? 0), 155, 112);

        doc.setDrawColor(226, 232, 240);
        doc.line(15, 120, 195, 120);

        // Summary Breakdown from Invoice Payload
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

    const handleDownloadInvoice = async (invoiceId) => {
        if (!invoiceId) {
            alert("No invoice selected for download.");
            return;
        }

        try {
            setDownloadingId(invoiceId);
            const token = getAuthToken();

            const invoice =
                billingRecords.find((r) => String(r.id) === String(invoiceId)) ||
                (String(dashboardData.latestInvoice?.id) === String(invoiceId)
                    ? dashboardData.latestInvoice
                    : null);

            // 1. Check for custom document
            const customDoc = getCustomInvoiceDocument(invoice);
            if (customDoc) {
                const downloaded = await downloadCustomInvoice(customDoc, invoice);
                if (downloaded) return;
            }

            // 2. Call backend endpoint
            const response = await fetch(`${API_URL}/api/client/amc/invoice/${invoiceId}/pdf`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const blob = await response.blob();
                const objectUrl = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = objectUrl;
                link.download = `${invoice?.invoiceCode || "AMC-Invoice"}.pdf`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
                return;
            }

            // 3. Fallback to client jsPDF
            generateFallbackInvoicePdf(invoice);
        } catch (err) {
            console.warn("Backend PDF download fallback:", err);
            const invoice = billingRecords.find((r) => String(r.id) === String(invoiceId));
            generateFallbackInvoicePdf(invoice);
        } finally {
            setDownloadingId(null);
        }
    };

    const handleOpenReceiptModal = (payment) => {
        setSelectedPaymentRecord(payment);
    };

    const handleDownloadReceipt = async (payment) => {
        if (!payment || !payment.id) return;
        try {
            setDownloadingReceiptId(payment.id);
            const token = getAuthToken();
            const response = await fetch(`${API_URL}/api/client/amc/payment/${payment.id}/receipt`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Receipt download failed");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            const cleanCode = (payment.paymentCode || "Receipt").replace(/[^a-zA-Z0-9_-]/g, "_");
            link.setAttribute("download", `Payment-Receipt-${cleanCode}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Receipt download error:", err);
            alert("We couldn't download this receipt right now.");
        } finally {
            setDownloadingReceiptId(null);
        }
    };

    const closeInvoiceDrawer = () => setSelectedInvoiceId(null);
    const closeReceiptModal = () => setSelectedPaymentRecord(null);

    // Calculate contract progress for AMC Coverage Card
    const contractProgress = useMemo(() => {
        const contract = dashboardData.currentContract || relevantInvoice;
        const start = contract?.startDate || contract?.contractStartDate || contract?.contractStart;
        const end = contract?.endDate || contract?.contractExpiryDate || contract?.contractEnd || dashboardData.nextDueDate;
        return calculateContractProgress(start, end);
    }, [dashboardData.currentContract, relevantInvoice, dashboardData.nextDueDate]);

    // Check if relevant invoice is overdue
    const isRelevantOverdue = useMemo(() => {
        if (!relevantInvoice) return false;
        const balance = Number(relevantInvoice.balanceAmount ?? (relevantInvoice.totalAmount - (relevantInvoice.paidAmount || 0)));
        if (balance <= 0) return false;
        const diff = getDaysDiff(relevantInvoice.dueDate);
        return diff !== null && diff < 0;
    }, [relevantInvoice]);

    // Check if current contract has an active renewal or quotation request
    const activeRequestForCurrentContract = useMemo(() => {
        const contract = dashboardData.currentContract;
        if (!contract) return null;
        const contractId = String(contract.id || contract._id || "");
        return amcRequests.find(
            (r) => String(r.contractId) === contractId && ["Submitted", "Under Review", "Quotation Ready"].includes(r.status)
        );
    }, [dashboardData.currentContract, amcRequests]);

    const getRequestStatusBadge = (status) => {
        switch (status) {
            case "Submitted":
                return "bg-blue-50 text-blue-700 ring-blue-600/20";
            case "Under Review":
                return "bg-amber-50 text-amber-700 ring-amber-600/20";
            case "Quotation Ready":
                return "bg-purple-50 text-purple-700 ring-purple-600/20";
            case "Completed":
                return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
            case "Rejected":
                return "bg-rose-50 text-rose-700 ring-rose-600/20";
            case "Cancelled":
                return "bg-slate-50 text-slate-700 ring-slate-600/20";
            default:
                return "bg-slate-50 text-slate-700 ring-slate-600/20";
        }
    };

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-28 rounded-xl border border-slate-200 bg-white p-5" />
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                    <div className="h-24 rounded-xl border border-slate-200 bg-white" />
                    <div className="h-24 rounded-xl border border-slate-200 bg-white" />
                    <div className="h-24 rounded-xl border border-slate-200 bg-white" />
                    <div className="h-24 rounded-xl border border-slate-200 bg-white" />
                </div>
                <div className="h-44 rounded-xl border border-slate-200 bg-white" />
                <div className="h-80 rounded-xl border border-slate-200 bg-white" />
                <div className="h-64 rounded-xl border border-slate-200 bg-white" />
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
                    We couldn't load your billing information right now
                </h2>
                <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Please check your internet connection or try again in a few moments. Your financial records are safe.
                </p>
                <div className="mt-5 flex items-center justify-center gap-3">
                    <button
                        type="button"
                        onClick={loadBillingData}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#1B59F8] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#1548D1] transition"
                    >
                        <RefreshCw size={14} />
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header Banner */}
            <section className="flex flex-col gap-4 rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="mb-1 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#1B59F8]" />
                        <span className="text-xs font-bold uppercase tracking-wider text-[#1B59F8]">
                            Billing & Renewals
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] font-medium text-slate-400">
                            Client Account Self-Service
                        </span>
                    </div>

                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                        Bills & AMC
                    </h1>

                    <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-2xl">
                        Review annual maintenance charges, invoices, payment history and renewal schedules with complete clarity.
                    </p>
                </div>

                {relevantInvoice && (
                    <button
                        type="button"
                        onClick={() => handleDownloadInvoice(relevantInvoice.id)}
                        disabled={downloadingId === relevantInvoice.id}
                        className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] px-3.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#1548D1] active:scale-98 disabled:opacity-50"
                    >
                        <Download size={14} />
                        {downloadingId === relevantInvoice.id ? "Preparing PDF..." : "Download Current Bill"}
                    </button>
                )}
            </section>

            {/* TOP 4 SUMMARY CARDS */}
            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {/* 1. Total Billed */}
                <SummaryCard
                    label="Total Billed"
                    value={formatCurrency(reconciledTotalBilled)}
                    description={`${billingRecords.length} AMC invoice${billingRecords.length === 1 ? "" : "s"} generated`}
                    icon={ReceiptText}
                    iconClass="bg-violet-50 text-violet-700"
                />

                {/* 2. Total Paid */}
                <SummaryCard
                    label="Total Paid"
                    value={formatCurrency(reconciledTotalPaid)}
                    description={`${billingRecords.filter((r) => (r.paymentStatus || r.status) === "Paid").length} invoice${billingRecords.filter((r) => (r.paymentStatus || r.status) === "Paid").length === 1 ? "" : "s"} settled`}
                    icon={CheckCircle2}
                    iconClass="bg-emerald-50 text-emerald-700"
                    descriptionClass="text-emerald-700 font-semibold"
                />

                {/* 3. Amount Due (Calm ₹0 with NO warning language when all paid) */}
                <SummaryCard
                    label="Amount Due"
                    value={formatCurrency(reconciledPending)}
                    description={
                        reconciledPending > 0
                            ? isRelevantOverdue
                                ? "Payment overdue"
                                : "Outstanding balance"
                            : "You're all paid up"
                    }
                    icon={reconciledPending > 0 ? CreditCard : CheckCircle2}
                    iconClass={
                        reconciledPending > 0
                            ? isRelevantOverdue
                                ? "bg-rose-50 text-rose-700"
                                : "bg-amber-50 text-amber-700"
                            : "bg-emerald-50 text-emerald-700"
                    }
                    descriptionClass={
                        reconciledPending > 0
                            ? isRelevantOverdue
                                ? "text-rose-600 font-semibold"
                                : "text-amber-600 font-semibold"
                            : "text-emerald-700 font-medium"
                    }
                />

                {/* 4. Next Renewal */}
                <SummaryCard
                    label="Next Renewal"
                    value={
                        dashboardData.nextDueDate
                            ? formatDate(dashboardData.nextDueDate)
                            : dashboardData.currentContract?.endDate
                            ? formatDate(dashboardData.currentContract.endDate)
                            : "Not available"
                    }
                    description={
                        contractProgress.daysRemaining !== null
                            ? contractProgress.isExpired
                                ? `Expired ${Math.abs(contractProgress.daysRemaining)} days ago`
                                : `${contractProgress.daysRemaining} days remaining`
                            : "Renewal scheduled"
                    }
                    icon={CalendarDays}
                    iconClass="bg-blue-50 text-[#1B59F8]"
                />
            </section>

            {/* CONDITIONAL ACCOUNT / CONTRACT ACTION CARD */}
            {reconciledPending > 0 && relevantInvoice ? (
                /* STATE A — PAYMENT DUE / OVERDUE */
                <section
                    className={`overflow-hidden rounded-xl border ${
                        isRelevantOverdue ? "border-rose-200/90 bg-rose-50/40" : "border-amber-200/90 bg-amber-50/40"
                    } p-4 sm:p-5 shadow-2xs`}
                >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1 ring-inset ${
                                        isRelevantOverdue
                                            ? "bg-rose-100 text-rose-800 ring-rose-300"
                                            : "bg-amber-100 text-amber-800 ring-amber-300"
                                    }`}
                                >
                                    {isRelevantOverdue ? "Payment Overdue" : "Payment Due"}
                                </span>
                                <span className={`text-xs font-semibold ${isRelevantOverdue ? "text-rose-700" : "text-amber-800"}`}>
                                    {isRelevantOverdue ? "Urgent Action Required" : "Pending Settlement"}
                                </span>
                            </div>

                            <div className="flex items-baseline gap-3">
                                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                                    {formatCurrency(
                                        relevantInvoice.balanceAmount ||
                                        relevantInvoice.pendingAmount ||
                                        reconciledPending
                                    )}
                                </h2>
                                <span className="text-xs text-slate-500">
                                    {relevantInvoice.productName || "AMC Coverage"}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                                <span>
                                    Invoice: <strong className="text-slate-800">{relevantInvoice.invoiceCode || relevantInvoice.invoiceNo || "—"}</strong>
                                </span>
                                <span className="text-slate-300">•</span>
                                <span>
                                    Due: <strong className={isRelevantOverdue ? "text-rose-700" : "text-slate-800"}>{formatDate(relevantInvoice.dueDate)}</strong>
                                </span>
                                <span className="text-slate-300">•</span>
                                <span>Period: {invoicePeriod(relevantInvoice)}</span>
                            </div>

                            <p className="text-[11px] text-slate-500 leading-snug">
                                {isRelevantOverdue
                                    ? "Payment is overdue. Please settle this invoice to avoid any disruption to your priority technical support."
                                    : "An annual maintenance charge is scheduled. Review invoice details or download your copy below."}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={() => setSelectedInvoiceId(relevantInvoice.id)}
                                className="flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-98"
                            >
                                <Eye size={14} className="text-slate-500" />
                                View Invoice
                            </button>

                            <button
                                type="button"
                                onClick={() => handleDownloadInvoice(relevantInvoice.id)}
                                disabled={downloadingId === relevantInvoice.id}
                                className={`flex h-8 items-center justify-center gap-1.5 rounded-lg px-3.5 text-xs font-semibold text-white shadow-xs transition active:scale-98 ${
                                    isRelevantOverdue ? "bg-rose-600 hover:bg-rose-700" : "bg-[#1B59F8] hover:bg-[#1548D1]"
                                } disabled:opacity-50`}
                            >
                                <Download size={14} />
                                {downloadingId === relevantInvoice.id ? "Preparing..." : "Download PDF"}
                            </button>
                        </div>
                    </div>
                </section>
            ) : relevantInvoice && (relevantInvoice.paymentStatus === "Paid" || relevantInvoice.status === "Paid") ? (
                /* STATE B — PAYMENT COMPLETED */
                <section className="overflow-hidden rounded-xl border border-emerald-200/90 bg-emerald-50/40 p-4 sm:p-5 shadow-2xs">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-800 ring-1 ring-inset ring-emerald-300">
                                    Payment Completed
                                </span>
                                <span className="text-xs font-semibold text-emerald-700">
                                    Account Settled
                                </span>
                            </div>

                            <div className="flex items-baseline gap-3">
                                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                                    {formatCurrency(relevantInvoice.totalAmount ?? relevantInvoice.amount ?? 0)} Paid
                                </h2>
                                <span className="text-xs text-slate-500">
                                    {relevantInvoice.productName || "AMC Coverage"}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                                <span>
                                    Invoice: <strong className="text-slate-800">{relevantInvoice.invoiceCode || relevantInvoice.invoiceNo || "—"}</strong>
                                </span>
                                <span className="text-slate-300">•</span>
                                <span>
                                    Payment received: <strong className="text-emerald-700">{formatDate(relevantInvoice.paymentDate || relevantInvoice.updatedAt)}</strong>
                                </span>
                                <span className="text-slate-300">•</span>
                                <span>Period: {invoicePeriod(relevantInvoice)}</span>
                            </div>

                            <p className="text-[11px] text-slate-600 leading-snug">
                                Your payment for this billing period has been received. Your support coverage remains active and valid.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={() => setSelectedInvoiceId(relevantInvoice.id)}
                                className="flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-98"
                            >
                                <Eye size={14} className="text-slate-500" />
                                View Invoice
                            </button>

                            <button
                                type="button"
                                onClick={() => handleDownloadInvoice(relevantInvoice.id)}
                                disabled={downloadingId === relevantInvoice.id}
                                className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] px-3.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#1548D1] active:scale-98 disabled:opacity-50"
                            >
                                <Download size={14} />
                                {downloadingId === relevantInvoice.id ? "Preparing..." : "Download Invoice"}
                            </button>
                        </div>
                    </div>
                </section>
            ) : (
                /* STATE C — NO PAYMENT DUE */
                <section className="overflow-hidden rounded-xl border border-emerald-200/90 bg-emerald-50/40 p-4 sm:p-5 shadow-2xs">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                                <CheckCircle2 size={18} />
                            </div>
                            <div>
                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-800 ring-1 ring-inset ring-emerald-300">
                                    No Payment Due
                                </span>
                                <h2 className="mt-0.5 text-base font-bold text-slate-900">
                                    Your account is up to date
                                </h2>
                                <p className="text-xs text-slate-600">
                                    No outstanding invoices require your attention. Your software licences and AMC support remain active.
                                </p>
                            </div>
                        </div>

                        {dashboardData.nextDueDate && (
                            <div className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-right">
                                <p className="text-[10px] uppercase font-bold text-slate-400">Next Scheduled Renewal</p>
                                <p className="text-xs font-bold text-slate-800">{formatDate(dashboardData.nextDueDate)}</p>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* AMC / SUPPORT COVERAGE CARD (REAL DYNAMIC PROGRESS — NO FAKE 92%) */}
            <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-[#1B59F8]">
                            <ShieldCheck size={16} />
                        </div>
                        <div>
                            <h2 className="text-xs font-bold text-slate-900">AMC / Support Coverage</h2>
                            <p className="text-[10px] text-slate-500">Contract timeline and coverage tracking</p>
                        </div>
                    </div>

                    <StatusBadge
                        status={
                            contractProgress.isExpired
                                ? "Expired"
                                : contractProgress.daysRemaining !== null && contractProgress.daysRemaining <= 30
                                ? "Pending"
                                : "Active"
                        }
                    />
                </div>

                {/* Dynamic Contract Progress Bar */}
                <div>
                    <div className="mb-1.5 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="font-medium text-slate-600">Coverage period progress</span>
                        <span className="font-semibold text-slate-800">{contractProgress.statusText}</span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                            style={{ width: `${contractProgress.percent}%` }}
                            className={`h-full rounded-full transition-all duration-300 ${
                                contractProgress.isExpired
                                    ? "bg-rose-500"
                                    : contractProgress.daysRemaining !== null && contractProgress.daysRemaining <= 30
                                    ? "bg-amber-500"
                                    : "bg-[#1B59F8]"
                            }`}
                        />
                    </div>

                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{invoicePeriod(dashboardData.currentContract || relevantInvoice)}</span>
                        <span>{contractProgress.percent}% elapsed</span>
                    </div>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                    <DetailItem
                        label="Product"
                        value={dashboardData.currentContract?.productName || relevantInvoice?.productName || "Software Maintenance"}
                        icon={FileText}
                    />
                    <DetailItem
                        label="Coverage Period"
                        value={invoicePeriod(dashboardData.currentContract || relevantInvoice)}
                        icon={CalendarDays}
                    />
                    <DetailItem
                        label="Next Renewal Date"
                        value={
                            dashboardData.nextDueDate
                                ? formatDate(dashboardData.nextDueDate)
                                : dashboardData.currentContract?.endDate
                                ? formatDate(dashboardData.currentContract.endDate)
                                : "Not available"
                        }
                        icon={Clock3}
                        valueClass="text-slate-800"
                    />
                    <DetailItem
                        label="Support Tier"
                        value={dashboardData.currentContract?.supportLevel || dashboardData.currentContract?.contractType || "Standard AMC"}
                        icon={ShieldCheck}
                    />
                </div>

                {/* Active Request Alert on Contract */}
                {activeRequestForCurrentContract && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50/70 p-3 text-xs">
                        <div className="flex items-center gap-2">
                            <Clock3 size={15} className="text-[#1B59F8] shrink-0" />
                            <span className="text-slate-700">
                                Active Request: <strong className="font-semibold text-slate-900">{activeRequestForCurrentContract.requestCode}</strong> ({activeRequestForCurrentContract.requestType})
                            </span>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${getRequestStatusBadge(activeRequestForCurrentContract.status)}`}>
                                {activeRequestForCurrentContract.status}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setDetailsModalRequest(activeRequestForCurrentContract)}
                            className="font-semibold text-[#1B59F8] hover:underline text-left sm:text-right"
                        >
                            View Details & Timeline &rarr;
                        </button>
                    </div>
                )}

                {/* Contract Renewal & Quotation Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <p className="text-[11px] text-slate-500">
                        Need to renew this contract or get a formal quotation for next year?
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => openRequestModal("Quotation Request", dashboardData.currentContract)}
                            className="flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-98"
                        >
                            <FileQuestion size={13} className="text-slate-500" />
                            Request Quotation
                        </button>
                        <button
                            type="button"
                            onClick={() => openRequestModal("AMC Renewal", dashboardData.currentContract)}
                            className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] px-3.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#1548D1] active:scale-98"
                        >
                            <RefreshCw size={13} />
                            Request Renewal
                        </button>
                    </div>
                </div>
            </section>

            {/* RENEWAL & QUOTATION REQUESTS TABLE CARD */}
            <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs">
                <div className="flex flex-col gap-3 border-b border-slate-200/80 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xs font-bold text-slate-900">Renewal & Quotation Requests</h2>
                            {amcRequests.length > 0 && (
                                <span className="inline-flex items-center rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                                    {amcRequests.length}
                                </span>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-500">Track and manage your commercial renewal requests and official quotations</p>
                    </div>

                    <button
                        type="button"
                        onClick={() => openRequestModal("AMC Renewal")}
                        className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] px-3 text-xs font-semibold text-white shadow-xs transition hover:bg-[#1548D1] active:scale-98 self-start sm:self-auto"
                    >
                        <Send size={13} />
                        New Request
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                        <thead>
                            <tr className="border-b border-slate-200/80 bg-slate-50/80">
                                <th className="px-3.5 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Request</th>
                                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Type</th>
                                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Product / Contract</th>
                                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Period</th>
                                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                                <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">Quote</th>
                                <th className="px-3.5 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {amcRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-400">
                                        No renewal or quotation requests yet. Click "New Request" or use the action buttons above.
                                    </td>
                                </tr>
                            ) : (
                                amcRequests.map((req) => (
                                    <tr key={req.id} className="border-b border-slate-100 transition hover:bg-slate-50/60 text-xs">
                                        <td className="px-3.5 py-3 font-semibold text-slate-900">
                                            {req.requestCode}
                                            <div className="text-[10px] text-slate-400 font-normal">
                                                {formatDate(req.createdAt)}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-slate-700 font-medium">
                                            {req.requestType}
                                        </td>
                                        <td className="px-3 py-3 text-slate-800">
                                            <div className="font-medium text-slate-900">{req.productName}</div>
                                            {req.contractCode && (
                                                <div className="text-[10px] text-slate-500">{req.contractCode}</div>
                                            )}
                                        </td>
                                        <td className="px-3 py-3 text-slate-600">
                                            {req.renewalPeriod || "1 Year"}
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${getRequestStatusBadge(req.status)}`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            {req.quotationAmount > 0 ? (
                                                <span className="font-semibold text-slate-900">
                                                    {formatCurrency(req.quotationAmount)}
                                                </span>
                                            ) : req.status === "Quotation Ready" ? (
                                                <span className="text-[11px] font-medium text-purple-700">Ready</span>
                                            ) : (
                                                <span className="text-slate-400 text-[11px]">—</span>
                                            )}
                                        </td>
                                        <td className="px-3.5 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {req.hasQuotationDocument && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDownloadQuotation(req.id, req.requestCode)}
                                                        disabled={downloadingQuotationId === req.id}
                                                        title="Download Quotation"
                                                        className="flex h-7 items-center gap-1 rounded-md bg-purple-50 px-2 text-[11px] font-medium text-purple-700 hover:bg-purple-100 transition disabled:opacity-50"
                                                    >
                                                        {downloadingQuotationId === req.id ? (
                                                            <Loader2 size={12} className="animate-spin" />
                                                        ) : (
                                                            <Download size={12} />
                                                        )}
                                                        Quote PDF
                                                    </button>
                                                )}

                                                {req.status === "Submitted" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCancelRequest(req.id)}
                                                        disabled={cancellingRequestId === req.id}
                                                        title="Cancel Request"
                                                        className="flex h-7 items-center gap-1 rounded-md border border-slate-200 px-2 text-[11px] font-medium text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition disabled:opacity-50"
                                                    >
                                                        {cancellingRequestId === req.id ? (
                                                            <Loader2 size={12} className="animate-spin" />
                                                        ) : (
                                                            <X size={12} />
                                                        )}
                                                        Cancel
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => setDetailsModalRequest(req)}
                                                    className="flex h-7 items-center gap-1 rounded-md border border-slate-200 px-2 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition"
                                                >
                                                    <Eye size={12} className="text-slate-400" />
                                                    Timeline
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* INVOICE HISTORY TABLE CARD */}
            <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs">
                <div className="flex flex-col gap-3 border-b border-slate-200/80 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xs font-bold text-slate-900">Invoice History</h2>
                        <p className="text-[10px] text-slate-500">All AMC invoices generated for your company</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative w-full sm:w-[220px]">
                            <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="search"
                                value={searchValue}
                                onChange={(event) => setSearchValue(event.target.value)}
                                placeholder="Search invoice number or product..."
                                className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#1B59F8] focus:ring-1 focus:ring-[#1B59F8]/20 focus:outline-hidden transition"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-[#1B59F8] focus:ring-1 focus:ring-[#1B59F8]/20 focus:outline-hidden transition"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Paid">Paid</option>
                            <option value="Pending">Pending</option>
                            <option value="Overdue">Overdue</option>
                            <option value="Partially Paid">Partially Paid</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px]">
                        <thead>
                            <tr className="border-b border-slate-200/80 bg-slate-50/80">
                                <th className="px-3.5 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Invoice</th>
                                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Product</th>
                                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Period</th>
                                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Due Date</th>
                                <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">Amount</th>
                                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                                <th className="px-3.5 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {billingRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-400">
                                        No invoices have been generated yet.
                                    </td>
                                </tr>
                            ) : paginatedInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-400">
                                        No matching invoices found. Try adjusting your search or filter.
                                    </td>
                                </tr>
                            ) : (
                                paginatedInvoices.map((record) => {
                                    const isOverdue =
                                        (record.paymentStatus === "Pending" || record.status === "Pending") &&
                                        record.dueDate &&
                                        getDaysDiff(record.dueDate) !== null &&
                                        getDaysDiff(record.dueDate) < 0;

                                    return (
                                        <tr key={record.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition">
                                            <td className="px-3.5 py-2.5">
                                                <p className="text-xs font-semibold text-slate-900">
                                                    {record.invoiceCode || record.invoiceNo || "—"}
                                                </p>
                                                <p className="text-[10px] text-slate-400">
                                                    {record.invoiceDate ? formatDate(record.invoiceDate) : "—"}
                                                </p>
                                            </td>

                                            <td className="px-3 py-2.5 text-xs font-medium text-slate-700">
                                                {record.productName || record.product || "—"}
                                            </td>

                                            <td className="px-3 py-2.5 text-xs text-slate-500">
                                                {invoicePeriod(record)}
                                            </td>

                                            <td className="px-3 py-2.5 text-xs text-slate-600">
                                                {record.dueDate ? formatDate(record.dueDate) : "—"}
                                            </td>

                                            <td className="px-3 py-2.5 text-right text-xs font-bold text-slate-900">
                                                {formatCurrency(record.totalAmount ?? record.amount ?? 0)}
                                            </td>

                                            <td className="px-3 py-2.5">
                                                <StatusBadge status={isOverdue ? "Overdue" : (record.paymentStatus || record.status || "Pending")} />
                                            </td>

                                            <td className="px-3.5 py-2.5 text-right">
                                                <div className="flex justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedInvoiceId(record.id)}
                                                        title="View invoice details"
                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50/50 hover:text-[#1B59F8]"
                                                    >
                                                        <Eye size={13} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDownloadInvoice(record.id)}
                                                        disabled={downloadingId === record.id}
                                                        title="Download invoice PDF"
                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50/50 hover:text-[#1B59F8] disabled:opacity-40"
                                                    >
                                                        <Download size={13} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {filteredBillingRecords.length > 0 && (
                    <div className="flex flex-col gap-2.5 border-t border-slate-200/80 bg-slate-50/40 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
                        <div>
                            Showing <span className="font-semibold text-slate-800">{(safeInvoicePage - 1) * invoicePageSize + 1}</span> to{" "}
                            <span className="font-semibold text-slate-800">{Math.min(safeInvoicePage * invoicePageSize, totalInvoices)}</span> of{" "}
                            <span className="font-semibold text-slate-800">{totalInvoices}</span> invoices
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-slate-500">Per page:</span>
                                <select
                                    value={invoicePageSize}
                                    onChange={(e) => {
                                        setInvoicePageSize(Number(e.target.value));
                                        setInvoicePage(1);
                                    }}
                                    className="h-7 rounded-md border border-slate-200/90 bg-white px-1.5 text-xs text-slate-700 shadow-2xs focus:border-[#1B59F8] focus:outline-hidden"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setInvoicePage((p) => Math.max(1, p - 1))}
                                    disabled={safeInvoicePage <= 1}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200/90 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    title="Previous page"
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                <span className="px-2 text-xs font-medium text-slate-700">
                                    {safeInvoicePage} / {totalInvoicePages}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setInvoicePage((p) => Math.min(totalInvoicePages, p + 1))}
                                    disabled={safeInvoicePage >= totalInvoicePages}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200/90 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    title="Next page"
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* PAYMENT HISTORY TABLE CARD (ZERO MONGODB OBJECTIDS DISPLAYED) */}
            <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs">
                <div className="flex flex-col gap-3 border-b border-slate-200/80 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xs font-bold text-slate-900">Payment History</h2>
                        <p className="text-[10px] text-slate-500">Settled AMC payments and receipts</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative w-full sm:w-[220px]">
                            <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="search"
                                value={paymentSearchValue}
                                onChange={(e) => setPaymentSearchValue(e.target.value)}
                                placeholder="Search receipt, invoice, ref..."
                                className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#1B59F8] focus:ring-1 focus:ring-[#1B59F8]/20 focus:outline-hidden transition"
                            />
                        </div>

                        <select
                            value={paymentModeFilter}
                            onChange={(e) => setPaymentModeFilter(e.target.value)}
                            className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-[#1B59F8] focus:ring-1 focus:ring-[#1B59F8]/20 focus:outline-hidden transition"
                        >
                            <option value="All Modes">All Modes</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="UPI">UPI</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Cash">Cash</option>
                            <option value="Card">Card</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px]">
                        <thead>
                            <tr className="border-b border-slate-200/80 bg-slate-50/80">
                                <th className="px-3.5 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Receipt</th>
                                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Invoice</th>
                                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Payment Date</th>
                                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Payment Mode</th>
                                <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">Amount</th>
                                <th className="px-3.5 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">Details</th>
                            </tr>
                        </thead>

                        <tbody>
                            {paymentRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">
                                        No payments have been recorded yet.
                                    </td>
                                </tr>
                            ) : paginatedPayments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">
                                        No matching payment records found. Try adjusting your search.
                                    </td>
                                </tr>
                            ) : (
                                paginatedPayments.map((payment) => (
                                    <tr key={payment.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition">
                                        <td className="px-3.5 py-2.5">
                                            <p className="text-xs font-semibold text-slate-900">
                                                {payment.paymentCode || "—"}
                                            </p>
                                            <div className="mt-0.5">
                                                <StatusBadge status="Completed" />
                                            </div>
                                        </td>

                                        {/* RESOLVED INVOICE CODE — NO MONGODB OBJECTID! */}
                                        <td className="px-3 py-2.5 text-xs font-medium text-slate-800">
                                            {payment.invoiceCode || payment.invoiceNo || "—"}
                                        </td>

                                        <td className="px-3 py-2.5 text-xs text-slate-600">
                                            {payment.paymentDate ? formatDate(payment.paymentDate) : "—"}
                                        </td>

                                        <td className="px-3 py-2.5">
                                            <p className="text-xs font-medium text-slate-700">
                                                {payment.paymentMode || payment.mode || "—"}
                                            </p>
                                            {(payment.transactionReference || payment.referenceNo) && (
                                                <p className="text-[10px] text-slate-400">
                                                    Ref: {payment.transactionReference || payment.referenceNo}
                                                </p>
                                            )}
                                        </td>

                                        <td className="px-3 py-2.5 text-right text-xs font-bold text-slate-900">
                                            {formatCurrency(payment.amount)}
                                        </td>

                                        <td className="px-3.5 py-2.5 text-right">
                                            <div className="inline-flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenReceiptModal(payment)}
                                                    title="View Receipt Details"
                                                    className="inline-flex h-7 items-center justify-center gap-1 rounded-md border border-slate-200 px-2 text-[11px] font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50/50 hover:text-[#1B59F8]"
                                                >
                                                    <Eye size={12} />
                                                    <span>View</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDownloadReceipt(payment)}
                                                    disabled={downloadingReceiptId === payment.id}
                                                    title="Download Receipt PDF"
                                                    className="inline-flex h-7 items-center justify-center gap-1 rounded-md border border-slate-200 px-2 text-[11px] font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-700 disabled:opacity-50"
                                                >
                                                    {downloadingReceiptId === payment.id ? (
                                                        <Loader2 size={12} className="animate-spin text-emerald-600" />
                                                    ) : (
                                                        <Download size={12} />
                                                    )}
                                                    <span>PDF</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {filteredPaymentRecords.length > 0 && (
                    <div className="flex flex-col gap-2.5 border-t border-slate-200/80 bg-slate-50/40 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
                        <div>
                            Showing <span className="font-semibold text-slate-800">{(safePaymentPage - 1) * paymentPageSize + 1}</span> to{" "}
                            <span className="font-semibold text-slate-800">{Math.min(safePaymentPage * paymentPageSize, totalPayments)}</span> of{" "}
                            <span className="font-semibold text-slate-800">{totalPayments}</span> payments
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-slate-500">Per page:</span>
                                <select
                                    value={paymentPageSize}
                                    onChange={(e) => {
                                        setPaymentPageSize(Number(e.target.value));
                                        setPaymentPage(1);
                                    }}
                                    className="h-7 rounded-md border border-slate-200/90 bg-white px-1.5 text-xs text-slate-700 shadow-2xs focus:border-[#1B59F8] focus:outline-hidden"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setPaymentPage((p) => Math.max(1, p - 1))}
                                    disabled={safePaymentPage <= 1}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200/90 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    title="Previous page"
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                <span className="px-2 text-xs font-medium text-slate-700">
                                    {safePaymentPage} / {totalPaymentPages}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setPaymentPage((p) => Math.min(totalPaymentPages, p + 1))}
                                    disabled={safePaymentPage >= totalPaymentPages}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200/90 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    title="Next page"
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* NEED HELP WITH BILLING SECTION */}
            <section className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1B59F8]">
                            <Banknote size={20} />
                        </div>
                        <div>
                            <h2 className="text-xs font-bold text-slate-900">Need help with billing?</h2>
                            <p className="text-[11px] text-slate-500">
                                Questions about invoices, payments, or upcoming AMC renewals? Our finance team is ready to assist.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <a
                            href="tel:+919876543210"
                            className="flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
                        >
                            <Phone size={13} />
                            Call Billing Team
                        </a>
                        <a
                            href="mailto:billing@totalsolution.in"
                            className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] px-3.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#1548D1]"
                        >
                            <Mail size={13} />
                            Email Billing
                        </a>
                    </div>
                </div>
            </section>

            {/* INVOICE DETAILS DRAWER */}
            {selectedInvoice && (
                <>
                    <button
                        type="button"
                        aria-label="Close invoice details"
                        onClick={closeInvoiceDrawer}
                        className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-xs"
                    />

                    <aside className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-[560px] flex-col bg-white shadow-[-20px_0_60px_rgba(15,23,42,0.18)]">
                        <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/70 px-4 py-3 sm:px-5">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[#1B59F8]">
                                    Invoice Details
                                </p>
                                <h2 className="mt-0.5 text-base font-bold text-slate-900">
                                    {selectedInvoice.invoiceCode || selectedInvoice.invoiceNo || "Invoice"}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={closeInvoiceDrawer}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 sm:p-5">
                            {/* Amount Payable Hero */}
                            <div className="rounded-xl border border-blue-200/90 bg-blue-50/50 p-4">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#1B59F8]">
                                            Total Invoice Amount
                                        </p>
                                        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                                            {formatCurrency(selectedInvoice.totalAmount ?? selectedInvoice.amount ?? 0)}
                                        </p>
                                    </div>
                                    <StatusBadge status={selectedInvoice.paymentStatus || selectedInvoice.status || "Pending"} />
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid gap-2.5 sm:grid-cols-2">
                                <DetailItem
                                    label="Invoice Date"
                                    value={selectedInvoice.invoiceDate ? formatDate(selectedInvoice.invoiceDate) : "—"}
                                    icon={CalendarDays}
                                />
                                <DetailItem
                                    label="Due Date"
                                    value={selectedInvoice.dueDate ? formatDate(selectedInvoice.dueDate) : "—"}
                                    icon={Clock3}
                                    valueClass={selectedInvoice.paymentStatus === "Pending" ? "text-amber-700" : ""}
                                />
                                <DetailItem
                                    label="Billing Period"
                                    value={invoicePeriod(selectedInvoice)}
                                    icon={CalendarDays}
                                />
                                <DetailItem
                                    label="Product"
                                    value={selectedInvoice.productName || "AMC Coverage"}
                                    icon={ReceiptText}
                                />
                            </div>

                            {/* Financial Breakdown Directly from Backend Values (No Frontend Recalculation!) */}
                            <div className="rounded-xl border border-slate-200/90 bg-white p-4">
                                <h3 className="text-xs font-bold text-slate-900">Financial Breakdown</h3>
                                <div className="mt-3 space-y-2 text-xs">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500">Taxable Subtotal</span>
                                        <span className="font-semibold text-slate-900">
                                            {formatCurrency(selectedInvoice.taxableAmount ?? (selectedInvoice.totalAmount ?? selectedInvoice.amount ?? 0))}
                                        </span>
                                    </div>

                                    {selectedInvoice.cgstAmount > 0 && (
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                            <span className="text-slate-500">CGST ({selectedInvoice.cgstRate || 9}%)</span>
                                            <span className="font-semibold text-slate-900">{formatCurrency(selectedInvoice.cgstAmount)}</span>
                                        </div>
                                    )}

                                    {selectedInvoice.sgstAmount > 0 && (
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                            <span className="text-slate-500">SGST ({selectedInvoice.sgstRate || 9}%)</span>
                                            <span className="font-semibold text-slate-900">{formatCurrency(selectedInvoice.sgstAmount)}</span>
                                        </div>
                                    )}

                                    {selectedInvoice.igstAmount > 0 && (
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                            <span className="text-slate-500">IGST ({selectedInvoice.igstRate || 18}%)</span>
                                            <span className="font-semibold text-slate-900">{formatCurrency(selectedInvoice.igstAmount)}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <span className="font-semibold text-slate-700">Total Billed</span>
                                        <span className="font-bold text-slate-900">
                                            {formatCurrency(selectedInvoice.totalAmount ?? selectedInvoice.amount ?? 0)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500">Paid to date</span>
                                        <span className="font-semibold text-emerald-700">
                                            {formatCurrency(selectedInvoice.paidAmount ?? 0)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                        <span className="font-semibold text-slate-700">Outstanding Balance</span>
                                        <span className={`text-sm font-bold ${Number(selectedInvoice.balanceAmount ?? selectedInvoice.pendingAmount ?? 0) > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                                            {formatCurrency(selectedInvoice.balanceAmount ?? selectedInvoice.pendingAmount ?? 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Related Payment Receipts (Multiple Payments Presentation) */}
                            {relatedPaymentsForSelectedInvoice.length > 0 && (
                                <div className="rounded-xl border border-slate-200/90 bg-white p-4">
                                    <h3 className="text-xs font-bold text-slate-900">Payments Recorded Against This Invoice</h3>
                                    <div className="mt-3 space-y-2">
                                        {relatedPaymentsForSelectedInvoice.map((pay) => (
                                            <div
                                                key={pay.id}
                                                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 text-xs"
                                            >
                                                <div>
                                                    <p className="font-semibold text-slate-800">{pay.paymentCode}</p>
                                                    <p className="text-[10px] text-slate-400">
                                                        {formatDate(pay.paymentDate)} · {pay.paymentMode} {pay.transactionReference ? `(${pay.transactionReference})` : ""}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                    <p className="font-bold text-emerald-700">{formatCurrency(pay.amount)}</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDownloadReceipt(pay)}
                                                        disabled={downloadingReceiptId === pay.id}
                                                        title="Download Receipt PDF"
                                                        className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-700 transition disabled:opacity-50"
                                                    >
                                                        {downloadingReceiptId === pay.id ? (
                                                            <Loader2 size={12} className="animate-spin text-emerald-600" />
                                                        ) : (
                                                            <Download size={12} />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            {selectedInvoice.notes && (
                                <div className="rounded-xl border border-slate-200/90 bg-white p-4">
                                    <h3 className="text-xs font-bold text-slate-900">Notes & Description</h3>
                                    <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{selectedInvoice.notes}</p>
                                </div>
                            )}
                        </div>

                        <div className="grid gap-2.5 border-t border-slate-200/80 bg-slate-50/50 p-4 sm:grid-cols-2 sm:px-5">
                            <button
                                type="button"
                                onClick={() => handleDownloadInvoice(selectedInvoice.id)}
                                disabled={downloadingId === selectedInvoice.id}
                                className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-[#1548D1] disabled:opacity-50"
                            >
                                <Download size={14} />
                                {downloadingId === selectedInvoice.id ? "Preparing PDF..." : "Download Invoice PDF"}
                            </button>

                            <button
                                type="button"
                                onClick={closeInvoiceDrawer}
                                className="flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
                            >
                                Close
                            </button>
                        </div>
                    </aside>
                </>
            )}

            {/* PAYMENT RECEIPT MODAL (CLEAN CLIENT-SAFE VIEW) */}
            {selectedPaymentRecord && (
                <>
                    <button
                        type="button"
                        aria-label="Close receipt details"
                        onClick={closeReceiptModal}
                        className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-xs"
                    />

                    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div>
                                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-800">
                                        Payment Receipt
                                    </span>
                                    <h3 className="mt-1 text-base font-bold text-slate-900">
                                        {selectedPaymentRecord.paymentCode || "Receipt"}
                                    </h3>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeReceiptModal}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="py-4 space-y-3">
                                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3.5 text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Amount Received</p>
                                    <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                                        {formatCurrency(selectedPaymentRecord.amount)}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-emerald-700 font-medium">Payment Verified & Settled</p>
                                </div>

                                <div className="grid gap-2 text-xs">
                                    <div className="flex justify-between border-b border-slate-100 py-1.5">
                                        <span className="text-slate-500">Related Invoice</span>
                                        <span className="font-semibold text-slate-900">{selectedPaymentRecord.invoiceCode || "—"}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 py-1.5">
                                        <span className="text-slate-500">Payment Date</span>
                                        <span className="font-semibold text-slate-900">{formatDate(selectedPaymentRecord.paymentDate)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 py-1.5">
                                        <span className="text-slate-500">Payment Mode</span>
                                        <span className="font-semibold text-slate-900">{selectedPaymentRecord.paymentMode || selectedPaymentRecord.mode || "—"}</span>
                                    </div>
                                    {selectedPaymentRecord.transactionReference && (
                                        <div className="flex justify-between border-b border-slate-100 py-1.5">
                                            <span className="text-slate-500">Reference / UTR</span>
                                            <span className="font-semibold text-slate-900">{selectedPaymentRecord.transactionReference}</span>
                                        </div>
                                    )}
                                    {selectedPaymentRecord.receivedBy && (
                                        <div className="flex justify-between py-1.5">
                                            <span className="text-slate-500">Processed By</span>
                                            <span className="font-semibold text-slate-900">{selectedPaymentRecord.receivedBy}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-lg border border-slate-200/70 bg-slate-50 p-3 text-center">
                                    <p className="text-[10px] text-slate-500 leading-relaxed">
                                        Official GST stamped receipts are available on request. Please contact{" "}
                                        <a href="mailto:billing@totalsolution.in" className="text-[#1B59F8] font-semibold underline">
                                            billing@totalsolution.in
                                        </a>{" "}
                                        quoting receipt {selectedPaymentRecord.paymentCode}.
                                    </p>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-3 flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleDownloadReceipt(selectedPaymentRecord)}
                                    disabled={downloadingReceiptId === selectedPaymentRecord.id}
                                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] py-2 px-3 text-xs font-semibold text-white shadow-xs hover:bg-[#1548D1] transition disabled:opacity-50"
                                >
                                    {downloadingReceiptId === selectedPaymentRecord.id ? (
                                        <>
                                            <Loader2 size={13} className="animate-spin" />
                                            <span>Downloading...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Download size={13} />
                                            <span>Download Receipt PDF</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeReceiptModal}
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* NEW RENEWAL / QUOTATION REQUEST MODAL */}
            {requestModalOpen && (
                <>
                    <div
                        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs transition-opacity"
                        onClick={() => !submittingRequest && setRequestModalOpen(false)}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                        <div
                            className="relative w-full max-w-lg rounded-2xl bg-white p-5 sm:p-6 shadow-xl transition-all"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B59F8]">
                                        Commercial Request
                                    </span>
                                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                                        Request AMC Renewal or Quotation
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    disabled={submittingRequest}
                                    onClick={() => setRequestModalOpen(false)}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmitRequest} className="mt-4 space-y-4">
                                {requestError && (
                                    <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-700 flex items-start gap-2">
                                        <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-600" />
                                        <span>{requestError}</span>
                                    </div>
                                )}

                                {requestSuccess && (
                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-700 flex items-start gap-2">
                                        <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-600" />
                                        <span>{requestSuccess}</span>
                                    </div>
                                )}

                                {/* Contract Selection */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        AMC Contract <span className="text-rose-500">*</span>
                                    </label>
                                    {allContracts.length > 0 ? (
                                        <select
                                            value={selectedContractForRequest?.id || selectedContractForRequest?._id || ""}
                                            onChange={(e) => {
                                                const found = allContracts.find(
                                                    (c) => (c.id || c._id) === e.target.value
                                                );
                                                setSelectedContractForRequest(found || null);
                                                if (found && found.endDate) {
                                                    const exp = new Date(found.endDate);
                                                    if (!isNaN(exp.getTime())) {
                                                        setPreferredStartDate(exp.toISOString().split("T")[0]);
                                                    }
                                                }
                                            }}
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#1B59F8] focus:ring-1 focus:ring-[#1B59F8]/20 focus:outline-hidden"
                                        >
                                            {allContracts.map((c) => (
                                                <option key={c.id || c._id} value={c.id || c._id}>
                                                    {c.productName} ({c.contractCode || "Contract"}) — Exp: {formatDate(c.endDate)}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                            {selectedContractForRequest?.productName || "Standard AMC Software Maintenance"}
                                        </div>
                                    )}
                                </div>

                                {/* Request Type */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Request Type <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <label
                                            className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 text-xs transition ${
                                                requestType === "AMC Renewal"
                                                    ? "border-[#1B59F8] bg-blue-50/40 text-blue-900"
                                                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                            }`}
                                        >
                                            <div>
                                                <span className="font-semibold">AMC Renewal</span>
                                                <p className="text-[10px] text-slate-500">Extend coverage</p>
                                            </div>
                                            <input
                                                type="radio"
                                                name="requestType"
                                                value="AMC Renewal"
                                                checked={requestType === "AMC Renewal"}
                                                onChange={() => setRequestType("AMC Renewal")}
                                                className="text-[#1B59F8] focus:ring-[#1B59F8]"
                                            />
                                        </label>

                                        <label
                                            className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 text-xs transition ${
                                                requestType === "Quotation Request"
                                                    ? "border-[#1B59F8] bg-blue-50/40 text-blue-900"
                                                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                            }`}
                                        >
                                            <div>
                                                <span className="font-semibold">Quotation Request</span>
                                                <p className="text-[10px] text-slate-500">Request pricing first</p>
                                            </div>
                                            <input
                                                type="radio"
                                                name="requestType"
                                                value="Quotation Request"
                                                checked={requestType === "Quotation Request"}
                                                onChange={() => setRequestType("Quotation Request")}
                                                className="text-[#1B59F8] focus:ring-[#1B59F8]"
                                            />
                                        </label>
                                    </div>
                                </div>

                                {/* Renewal Period (Fixed 1 Year) */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-xs font-semibold text-slate-700">
                                            Renewal Period
                                        </label>
                                        <span className="text-[10px] text-slate-400 font-medium">Fixed 1 Year Standard Term</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800">
                                        <span>1 Year Extension</span>
                                        <Check size={14} className="text-emerald-600" />
                                    </div>
                                </div>

                                {/* Preferred Start Date */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Preferred Coverage Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={preferredStartDate}
                                        onChange={(e) => setPreferredStartDate(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#1B59F8] focus:ring-1 focus:ring-[#1B59F8]/20 focus:outline-hidden"
                                    />
                                    <p className="mt-1 text-[10px] text-slate-400">
                                        Usually continuous with your previous contract's expiry date.
                                    </p>
                                </div>

                                {/* Remarks / Requirements */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Remarks or Special Requests (Optional)
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={requestRemarks}
                                        onChange={(e) => setRequestRemarks(e.target.value)}
                                        placeholder="Add any specific requirements (e.g. additional user licenses, billing contact changes, etc.)..."
                                        maxLength={1000}
                                        className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#1B59F8] focus:ring-1 focus:ring-[#1B59F8]/20 focus:outline-hidden"
                                    />
                                </div>

                                <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-2.5 text-[11px] text-slate-600">
                                    <p>
                                        <strong>Notice:</strong> Submitting this request creates an inquiry for admin review. It does not automatically create invoices or charge your account.
                                    </p>
                                </div>

                                <div className="border-t border-slate-100 pt-3 flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        disabled={submittingRequest}
                                        onClick={() => setRequestModalOpen(false)}
                                        className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingRequest}
                                        className="flex items-center gap-1.5 rounded-lg bg-[#1B59F8] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#1548D1] transition disabled:opacity-50"
                                    >
                                        {submittingRequest ? (
                                            <>
                                                <Loader2 size={13} className="animate-spin" />
                                                <span>Submitting...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Send size={13} />
                                                <span>Submit Request</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </>
            )}

            {/* REQUEST DETAILS & TIMELINE MODAL */}
            {detailsModalRequest && (
                <>
                    <div
                        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs transition-opacity"
                        onClick={() => setDetailsModalRequest(null)}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                        <div
                            className="relative w-full max-w-lg rounded-2xl bg-white p-5 sm:p-6 shadow-xl transition-all"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B59F8]">
                                            {detailsModalRequest.requestType}
                                        </span>
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${getRequestStatusBadge(detailsModalRequest.status)}`}>
                                            {detailsModalRequest.status}
                                        </span>
                                    </div>
                                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                                        {detailsModalRequest.requestCode}
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setDetailsModalRequest(null)}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="mt-4 space-y-4">
                                {/* Overview Grid */}
                                <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs">
                                    <div>
                                        <span className="text-slate-400 text-[10px] uppercase font-bold">Product</span>
                                        <p className="font-semibold text-slate-900">{detailsModalRequest.productName}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 text-[10px] uppercase font-bold">Renewal Period</span>
                                        <p className="font-semibold text-slate-900">{detailsModalRequest.renewalPeriod || "1 Year"}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 text-[10px] uppercase font-bold">Requested On</span>
                                        <p className="text-slate-700">{formatDate(detailsModalRequest.createdAt)}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 text-[10px] uppercase font-bold">Preferred Start</span>
                                        <p className="text-slate-700">{detailsModalRequest.preferredStartDate ? formatDate(detailsModalRequest.preferredStartDate) : "Continuous"}</p>
                                    </div>
                                </div>

                                {/* Quotation Card if ready */}
                                {(detailsModalRequest.quotationAmount > 0 || detailsModalRequest.quotationDetails || detailsModalRequest.hasQuotationDocument) && (
                                    <div className="rounded-xl border border-purple-200/80 bg-purple-50/50 p-4 space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-purple-900">Official Quotation</span>
                                            {detailsModalRequest.quotationAmount > 0 && (
                                                <span className="text-base font-bold text-slate-900">
                                                    {formatCurrency(detailsModalRequest.quotationAmount)}
                                                </span>
                                            )}
                                        </div>
                                        {detailsModalRequest.quotationDetails && (
                                            <p className="text-xs text-slate-700 leading-relaxed bg-white/70 rounded-lg p-2.5 border border-purple-100">
                                                {detailsModalRequest.quotationDetails}
                                            </p>
                                        )}
                                        {detailsModalRequest.hasQuotationDocument && (
                                            <button
                                                type="button"
                                                onClick={() => handleDownloadQuotation(detailsModalRequest.id, detailsModalRequest.requestCode)}
                                                disabled={downloadingQuotationId === detailsModalRequest.id}
                                                className="flex items-center gap-1.5 rounded-lg bg-purple-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-purple-800 transition disabled:opacity-50"
                                            >
                                                {downloadingQuotationId === detailsModalRequest.id ? (
                                                    <Loader2 size={13} className="animate-spin" />
                                                ) : (
                                                    <Download size={13} />
                                                )}
                                                Download Quotation Document ({detailsModalRequest.quotationDocumentName || "PDF"})
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Remarks if any */}
                                {detailsModalRequest.remarks && (
                                    <div className="rounded-lg border border-slate-200/80 bg-white p-3 text-xs">
                                        <span className="font-semibold text-slate-700">Your Remarks:</span>
                                        <p className="mt-1 text-slate-600 leading-relaxed">{detailsModalRequest.remarks}</p>
                                    </div>
                                )}

                                {/* Timeline */}
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900 mb-2.5">Request Timeline</h4>
                                    <div className="space-y-3 pl-2 border-l-2 border-slate-100">
                                        {(detailsModalRequest.timeline || []).map((t, idx) => (
                                            <div key={idx} className="relative pl-3 text-xs">
                                                <div className="absolute -left-[19px] top-1 h-2.5 w-2.5 rounded-full bg-[#1B59F8] ring-4 ring-white" />
                                                <div className="flex items-baseline justify-between">
                                                    <span className="font-semibold text-slate-800">{t.action}</span>
                                                    <span className="text-[10px] text-slate-400">{formatDate(t.timestamp)}</span>
                                                </div>
                                                {t.remarks && (
                                                    <p className="mt-0.5 text-slate-500 text-[11px]">{t.remarks}</p>
                                                )}
                                                <span className="text-[10px] text-slate-400">By: {t.performedByName}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-end">
                                <button
                                    type="button"
                                    onClick={() => setDetailsModalRequest(null)}
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
