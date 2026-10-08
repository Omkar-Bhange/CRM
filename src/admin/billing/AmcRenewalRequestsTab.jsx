import React, { useState, useMemo } from "react";
import {
    AlertCircle,
    ArrowUpRight,
    CalendarDays,
    Check,
    CheckCircle2,
    Clock3,
    Download,
    Eye,
    FileCheck,
    FileText,
    History,
    IndianRupee,
    Lock,
    Paperclip,
    Plus,
    RefreshCw,
    Search,
    Send,
    Shield,
    Upload,
    UserRound,
    X,
    XCircle,
    AlertTriangle,
} from "lucide-react";
import API_URL from "../../config/api";

const getAuthToken = () =>
    localStorage.getItem("client-connect-token") ||
    sessionStorage.getItem("client-connect-token") ||
    "";

function formatCurrency(amount) {
    if (amount === null || amount === undefined || isNaN(Number(amount))) {
        return "—";
    }
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number(amount));
}

function formatDate(val) {
    if (!val) return "—";
    const d = new Date(val);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function formatDateTime(val) {
    if (!val) return "—";
    const d = new Date(val);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function RequestStatusBadge({ status }) {
    const config = {
        Submitted: {
            bg: "bg-amber-50 text-amber-700 ring-amber-600/20 border-amber-200",
            dot: "bg-amber-500",
        },
        "Under Review": {
            bg: "bg-purple-50 text-purple-700 ring-purple-600/20 border-purple-200",
            dot: "bg-purple-500",
        },
        "Quotation Ready": {
            bg: "bg-blue-50 text-blue-700 ring-blue-600/20 border-blue-200",
            dot: "bg-blue-500",
        },
        Completed: {
            bg: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 border-emerald-200",
            dot: "bg-emerald-500",
        },
        Rejected: {
            bg: "bg-rose-50 text-rose-700 ring-rose-600/20 border-rose-200",
            dot: "bg-rose-500",
        },
        Cancelled: {
            bg: "bg-slate-100 text-slate-600 ring-slate-500/20 border-slate-200",
            dot: "bg-slate-400",
        },
    };

    const cfg = config[status] || {
        bg: "bg-slate-100 text-slate-600 ring-slate-500/20 border-slate-200",
        dot: "bg-slate-400",
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border ring-1 ring-inset ${cfg.bg}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {status}
        </span>
    );
}

function RequestTypeBadge({ type }) {
    if (type === "Quotation Request") {
        return (
            <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                Quotation Request
            </span>
        );
    }
    return (
        <span className="inline-flex items-center rounded-md bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700 ring-1 ring-inset ring-violet-600/20">
            AMC Renewal
        </span>
    );
}

export default function AmcRenewalRequestsTab({
    requests = [],
    loading = false,
    error = "",
    onRefresh,
    records = [],
    onOpenContract,
    onGoToRenewal,
}) {
    // Local filter and search state
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [typeFilter, setTypeFilter] = useState("All");

    // Drawer state
    const [selectedRequest, setSelectedRequest] = useState(null);

    // Controlled Action Modals
    const [quotationModalOpen, setQuotationModalOpen] = useState(false);
    const [quotationForm, setQuotationForm] = useState({
        quotationAmount: "",
        quotationDetails: "",
        clientRemarks: "",
        adminNotes: "",
    });
    const [quotationFile, setQuotationFile] = useState(null);

    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectForm, setRejectForm] = useState({
        clientRemarks: "",
        adminNotes: "",
    });

    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelForm, setCancelForm] = useState({
        clientRemarks: "",
        adminNotes: "",
    });

    const [completeModalOpen, setCompleteModalOpen] = useState(false);
    const [completeForm, setCompleteForm] = useState({
        adminNotes: "",
        openRenewalAfter: false,
    });

    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState("");

    // Statistics computation
    const stats = useMemo(() => {
        const counts = {
            Submitted: 0,
            "Under Review": 0,
            "Quotation Ready": 0,
            Completed: 0,
            Rejected: 0,
            Cancelled: 0,
            Total: requests.length,
        };
        requests.forEach((r) => {
            if (counts[r.status] !== undefined) {
                counts[r.status]++;
            }
        });
        return counts;
    }, [requests]);

    // Filtered requests list
    const filteredRequests = useMemo(() => {
        return requests.filter((r) => {
            if (statusFilter !== "All" && r.status !== statusFilter) return false;
            if (typeFilter !== "All" && r.requestType !== typeFilter) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchCode = r.requestCode?.toLowerCase().includes(q);
                const matchClient =
                    r.clientName?.toLowerCase().includes(q) ||
                    r.clientCode?.toLowerCase().includes(q);
                const matchProduct = r.productName?.toLowerCase().includes(q);
                const matchContract = r.contractCode?.toLowerCase().includes(q);
                if (!matchCode && !matchClient && !matchProduct && !matchContract) {
                    return false;
                }
            }
            return true;
        });
    }, [requests, statusFilter, typeFilter, searchQuery]);

    // Find linked contract for selected request
    const linkedContract = useMemo(() => {
        if (!selectedRequest) return null;
        return (
            records.find(
                (rec) =>
                    rec.id === selectedRequest.contractId ||
                    rec._id === selectedRequest.contractId ||
                    rec.contractCode === selectedRequest.contractCode
            ) || null
        );
    }, [selectedRequest, records]);

    // Download quotation document
    const handleDownloadQuotation = async (req) => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error("Authentication token missing.");
            const res = await fetch(
                `${API_URL}/api/admin/amc-requests/${req.id || req._id}/quotation`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || "Failed to download quotation.");
            }
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download =
                req.quotationDocument?.fileName ||
                `Quotation-${req.requestCode}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            alert(err.message || "Failed to download quotation");
        }
    };

    // Transition: Start Review (Submitted -> Under Review)
    const handleStartReview = async (req) => {
        try {
            setActionLoading(true);
            setActionError("");
            const token = getAuthToken();
            const formData = new FormData();
            formData.append("status", "Under Review");
            formData.append("clientRemarks", "Request is now being reviewed by AMC desk");
            formData.append("adminNotes", "Review started by Administrator");

            const res = await fetch(
                `${API_URL}/api/admin/amc-requests/${req.id || req._id}/status`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || "Failed to start review.");
            }

            if (selectedRequest && (selectedRequest.id === req.id || selectedRequest._id === req._id)) {
                setSelectedRequest(data.data);
            }
            if (onRefresh) onRefresh();
        } catch (err) {
            setActionError(err.message || "Error starting review.");
        } finally {
            setActionLoading(false);
        }
    };

    // Open Prepare Quotation Modal
    const openPrepareQuotationModal = (req) => {
        setQuotationForm({
            quotationAmount: req.quotationAmount ? String(req.quotationAmount) : "",
            quotationDetails: req.quotationDetails || "",
            clientRemarks: "Quotation prepared and uploaded for review.",
            adminNotes: req.adminNotes || "",
        });
        setQuotationFile(null);
        setActionError("");
        setQuotationModalOpen(true);
    };

    // Submit Prepare Quotation
    const handleSaveQuotation = async (e) => {
        e.preventDefault();
        if (!selectedRequest) return;
        try {
            setActionLoading(true);
            setActionError("");
            const token = getAuthToken();
            const formData = new FormData();
            formData.append("status", "Quotation Ready");
            if (quotationForm.quotationAmount) {
                formData.append("quotationAmount", quotationForm.quotationAmount);
            }
            if (quotationForm.quotationDetails) {
                formData.append("quotationDetails", quotationForm.quotationDetails);
            }
            if (quotationForm.clientRemarks) {
                formData.append("clientRemarks", quotationForm.clientRemarks);
            }
            if (quotationForm.adminNotes) {
                formData.append("adminNotes", quotationForm.adminNotes);
            }
            if (quotationFile) {
                formData.append("quotationFile", quotationFile);
            }

            const res = await fetch(
                `${API_URL}/api/admin/amc-requests/${selectedRequest.id || selectedRequest._id}/status`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || "Failed to prepare quotation.");
            }

            setSelectedRequest(data.data);
            setQuotationModalOpen(false);
            if (onRefresh) onRefresh();
        } catch (err) {
            setActionError(err.message || "Error saving quotation.");
        } finally {
            setActionLoading(false);
        }
    };

    // Open Reject Modal
    const openRejectModal = (req) => {
        setRejectForm({
            clientRemarks: "",
            adminNotes: "",
        });
        setActionError("");
        setRejectModalOpen(true);
    };

    // Submit Rejection
    const handleConfirmReject = async (e) => {
        e.preventDefault();
        if (!selectedRequest) return;
        try {
            setActionLoading(true);
            setActionError("");
            const token = getAuthToken();
            const formData = new FormData();
            formData.append("status", "Rejected");
            formData.append(
                "clientRemarks",
                rejectForm.clientRemarks.trim() || "Your request could not be approved at this time."
            );
            if (rejectForm.adminNotes.trim()) {
                formData.append("adminNotes", rejectForm.adminNotes.trim());
            }

            const res = await fetch(
                `${API_URL}/api/admin/amc-requests/${selectedRequest.id || selectedRequest._id}/status`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || "Failed to reject request.");
            }

            setSelectedRequest(data.data);
            setRejectModalOpen(false);
            if (onRefresh) onRefresh();
        } catch (err) {
            setActionError(err.message || "Error rejecting request.");
        } finally {
            setActionLoading(false);
        }
    };

    // Open Cancel Modal
    const openCancelModal = (req) => {
        setCancelForm({
            clientRemarks: "",
            adminNotes: "",
        });
        setActionError("");
        setCancelModalOpen(true);
    };

    // Submit Cancellation
    const handleConfirmCancel = async (e) => {
        e.preventDefault();
        if (!selectedRequest) return;
        try {
            setActionLoading(true);
            setActionError("");
            const token = getAuthToken();
            const formData = new FormData();
            formData.append("status", "Cancelled");
            formData.append(
                "clientRemarks",
                cancelForm.clientRemarks.trim() || "Request cancelled by administrator."
            );
            if (cancelForm.adminNotes.trim()) {
                formData.append("adminNotes", cancelForm.adminNotes.trim());
            }

            const res = await fetch(
                `${API_URL}/api/admin/amc-requests/${selectedRequest.id || selectedRequest._id}/status`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || "Failed to cancel request.");
            }

            setSelectedRequest(data.data);
            setCancelModalOpen(false);
            if (onRefresh) onRefresh();
        } catch (err) {
            setActionError(err.message || "Error cancelling request.");
        } finally {
            setActionLoading(false);
        }
    };

    // Open Complete Confirmation Modal
    const openCompleteModal = (req) => {
        setCompleteForm({
            adminNotes: "Client agreed to quotation and commercial terms.",
            openRenewalAfter: false,
        });
        setActionError("");
        setCompleteModalOpen(true);
    };

    // Submit Complete
    const handleConfirmComplete = async (e) => {
        e.preventDefault();
        if (!selectedRequest) return;
        try {
            setActionLoading(true);
            setActionError("");
            const token = getAuthToken();
            const formData = new FormData();
            formData.append("status", "Completed");
            formData.append("clientRemarks", "AMC request completed successfully.");
            if (completeForm.adminNotes.trim()) {
                formData.append("adminNotes", completeForm.adminNotes.trim());
            }

            const res = await fetch(
                `${API_URL}/api/admin/amc-requests/${selectedRequest.id || selectedRequest._id}/status`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || "Failed to mark request completed.");
            }

            const shouldOpenRenewal = completeForm.openRenewalAfter;
            const targetContractId = selectedRequest.contractId;
            const targetContractCode = selectedRequest.contractCode;

            setSelectedRequest(data.data);
            setCompleteModalOpen(false);
            if (onRefresh) onRefresh();

            if (shouldOpenRenewal && onGoToRenewal) {
                setSelectedRequest(null);
                onGoToRenewal(targetContractId, targetContractCode);
            }
        } catch (err) {
            setActionError(err.message || "Error completing request.");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Top Status Summary - Compact Linear Counters */}
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <button
                    type="button"
                    onClick={() =>
                        setStatusFilter((prev) =>
                            prev === "Submitted" ? "All" : "Submitted"
                        )
                    }
                    className={`rounded-xl border p-3.5 text-left transition shadow-2xs ${
                        statusFilter === "Submitted"
                            ? "border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20"
                            : "border-slate-200/90 bg-white hover:border-slate-300"
                    }`}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Submitted
                            </p>
                            <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                                {stats.Submitted}
                            </p>
                            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-amber-600">
                                <Clock3 size={13} />
                                New client submissions
                            </p>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                            <Clock3 size={16} />
                        </div>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() =>
                        setStatusFilter((prev) =>
                            prev === "Under Review" ? "All" : "Under Review"
                        )
                    }
                    className={`rounded-xl border p-3.5 text-left transition shadow-2xs ${
                        statusFilter === "Under Review"
                            ? "border-purple-500 bg-purple-50/40 ring-2 ring-purple-500/20"
                            : "border-slate-200/90 bg-white hover:border-slate-300"
                    }`}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Under Review
                            </p>
                            <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                                {stats["Under Review"]}
                            </p>
                            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-purple-600">
                                <Eye size={13} />
                                Assessment in progress
                            </p>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                            <Eye size={16} />
                        </div>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() =>
                        setStatusFilter((prev) =>
                            prev === "Quotation Ready" ? "All" : "Quotation Ready"
                        )
                    }
                    className={`rounded-xl border p-3.5 text-left transition shadow-2xs ${
                        statusFilter === "Quotation Ready"
                            ? "border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20"
                            : "border-slate-200/90 bg-white hover:border-slate-300"
                    }`}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Quotation Ready
                            </p>
                            <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                                {stats["Quotation Ready"]}
                            </p>
                            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-blue-600">
                                <FileText size={13} />
                                Quotation sent to client
                            </p>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <FileText size={16} />
                        </div>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() =>
                        setStatusFilter((prev) =>
                            prev === "Completed" ? "All" : "Completed"
                        )
                    }
                    className={`rounded-xl border p-3.5 text-left transition shadow-2xs ${
                        statusFilter === "Completed"
                            ? "border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20"
                            : "border-slate-200/90 bg-white hover:border-slate-300"
                    }`}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Completed
                            </p>
                            <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                                {stats.Completed}
                            </p>
                            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                                <CheckCircle2 size={13} />
                                Requests fulfilled
                            </p>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                            <CheckCircle2 size={16} />
                        </div>
                    </div>
                </button>
            </section>

            {/* Filter and Search Bar */}
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                    <Search
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by request code, client, product, or contract..."
                        className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-8 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5">
                        <label className="text-[11px] font-semibold text-slate-500">
                            Status:
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-hidden"
                        >
                            <option value="All">All Statuses ({stats.Total})</option>
                            <option value="Submitted">Submitted ({stats.Submitted})</option>
                            <option value="Under Review">Under Review ({stats["Under Review"]})</option>
                            <option value="Quotation Ready">Quotation Ready ({stats["Quotation Ready"]})</option>
                            <option value="Completed">Completed ({stats.Completed})</option>
                            <option value="Rejected">Rejected ({stats.Rejected})</option>
                            <option value="Cancelled">Cancelled ({stats.Cancelled})</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <label className="text-[11px] font-semibold text-slate-500">
                            Type:
                        </label>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-hidden"
                        >
                            <option value="All">All Types</option>
                            <option value="AMC Renewal">AMC Renewal</option>
                            <option value="Quotation Request">Quotation Request</option>
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={loading}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 transition"
                        title="Refresh requests"
                    >
                        <RefreshCw
                            size={14}
                            className={loading ? "animate-spin text-blue-600" : "text-slate-500"}
                        />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
                    <AlertCircle size={15} className="shrink-0 text-rose-600" />
                    <span>{error}</span>
                </div>
            )}

            {/* Requests Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-4 py-3">Request Code</th>
                                <th className="px-4 py-3">Client</th>
                                <th className="px-4 py-3">Product</th>
                                <th className="px-4 py-3">Contract</th>
                                <th className="px-4 py-3">Request Type</th>
                                <th className="px-4 py-3">Current Expiry</th>
                                <th className="px-4 py-3">Submitted Date</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Quotation Amount</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading && requests.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <RefreshCw size={20} className="animate-spin text-blue-600" />
                                            <span className="text-xs font-medium">Loading renewal and quotation requests...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <FileText size={28} className="text-slate-300" />
                                            <p className="text-xs font-semibold text-slate-600">No requests found</p>
                                            <p className="text-[11px] text-slate-400 max-w-sm">
                                                {searchQuery || statusFilter !== "All" || typeFilter !== "All"
                                                    ? "Try clearing filters or search terms."
                                                    : "Client AMC renewal or quotation requests will appear here when submitted."}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((req) => (
                                    <tr
                                        key={req.id || req._id}
                                        className="hover:bg-slate-50/70 transition"
                                    >
                                        <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="font-mono text-xs font-bold text-blue-600">
                                                    {req.requestCode}
                                                </span>
                                                <span className="text-[10px] text-slate-400">
                                                    Period: {req.renewalPeriod || "1 Year"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-[10px] font-bold text-violet-700">
                                                    {req.clientName
                                                        ?.split(" ")
                                                        .slice(0, 2)
                                                        .map((w) => w[0])
                                                        .join("")
                                                        .toUpperCase() || "C"}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate font-semibold text-slate-800">
                                                        {req.clientName}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">
                                                        {req.clientCode || "—"}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                                            {req.productName || "—"}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                                            <button
                                                type="button"
                                                onClick={() => onOpenContract(req.contractId, req.contractCode)}
                                                className="inline-flex items-center gap-1 hover:text-blue-600 hover:underline"
                                                title="View AMC contract in contracts tab"
                                            >
                                                <span>{req.contractCode || "—"}</span>
                                                <ArrowUpRight size={12} className="text-slate-400" />
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <RequestTypeBadge type={req.requestType} />
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                            {formatDate(req.currentExpiryDate)}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                            {formatDate(req.createdAt)}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <RequestStatusBadge status={req.status} />
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                                            {req.quotationAmount > 0
                                                ? formatCurrency(req.quotationAmount)
                                                : "—"}
                                        </td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedRequest(req)}
                                                    className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition shadow-2xs"
                                                >
                                                    <Eye size={12} />
                                                    <span>Review</span>
                                                </button>

                                                {/* Quick contextual action */}
                                                {req.status === "Submitted" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleStartReview(req)}
                                                        disabled={actionLoading}
                                                        className="inline-flex h-7 items-center gap-1 rounded-md bg-purple-600 px-2.5 text-[11px] font-semibold text-white hover:bg-purple-700 transition shadow-2xs disabled:opacity-50"
                                                    >
                                                        <span>Start Review</span>
                                                    </button>
                                                )}

                                                {req.status === "Under Review" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedRequest(req);
                                                            openPrepareQuotationModal(req);
                                                        }}
                                                        className="inline-flex h-7 items-center gap-1 rounded-md bg-blue-600 px-2.5 text-[11px] font-semibold text-white hover:bg-blue-700 transition shadow-2xs"
                                                    >
                                                        <span>Prepare Quote</span>
                                                    </button>
                                                )}

                                                {req.status === "Quotation Ready" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedRequest(req);
                                                            openCompleteModal(req);
                                                        }}
                                                        className="inline-flex h-7 items-center gap-1 rounded-md bg-emerald-600 px-2.5 text-[11px] font-semibold text-white hover:bg-emerald-700 transition shadow-2xs"
                                                    >
                                                        <span>Complete</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ========================================================= */}
            {/* REQUEST DETAILS DRAWER / MODAL */}
            {/* ========================================================= */}
            {selectedRequest && (
                <div className="fixed inset-0 z-[120] flex items-center justify-end p-2 sm:p-4 lg:p-6">
                    <button
                        type="button"
                        aria-label="Close drawer"
                        onClick={() => setSelectedRequest(null)}
                        className="enterprise-backdrop absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
                    />
                    <div className="enterprise-drawer relative z-10 flex h-[calc(100vh-16px)] w-full max-w-[840px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:h-[calc(100vh-32px)]">
                        {/* Drawer Header */}
                        <div className="relative flex shrink-0 items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 px-6 py-4 text-white">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm font-bold text-blue-300">
                                        {selectedRequest.requestCode}
                                    </span>
                                    <RequestTypeBadge type={selectedRequest.requestType} />
                                    <RequestStatusBadge status={selectedRequest.status} />
                                </div>
                                <h2 className="mt-1 text-base font-bold text-white">
                                    {selectedRequest.requestType} Request
                                </h2>
                                <p className="text-[11px] text-slate-300">
                                    Submitted by {selectedRequest.clientName} ({selectedRequest.clientCode}) on{" "}
                                    {formatDateTime(selectedRequest.createdAt)}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedRequest(null)}
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20 transition"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Drawer Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#fafbfd]">
                            {/* Advisory Banner based on status */}
                            {selectedRequest.status === "Submitted" && (
                                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900">
                                    <Clock3 size={16} className="mt-0.5 shrink-0 text-amber-600" />
                                    <div>
                                        <p className="font-semibold text-amber-900">Awaiting Admin Review</p>
                                        <p className="mt-0.5 text-amber-800 text-[11px]">
                                            This request was submitted by the client. Click{" "}
                                            <strong>Start Review</strong> below to move it into assessment.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {selectedRequest.status === "Under Review" && (
                                <div className="flex items-start gap-3 rounded-xl border border-purple-200 bg-purple-50/80 p-3.5 text-xs text-purple-900">
                                    <Eye size={16} className="mt-0.5 shrink-0 text-purple-600" />
                                    <div>
                                        <p className="font-semibold text-purple-900">In Active Assessment</p>
                                        <p className="mt-0.5 text-purple-800 text-[11px]">
                                            Review contract requirements and click <strong>Prepare Quotation</strong> to set proposed pricing, terms, and upload formal quotation PDF.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {selectedRequest.status === "Quotation Ready" && (
                                <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/80 p-3.5 text-xs text-blue-900">
                                    <FileCheck size={16} className="mt-0.5 shrink-0 text-blue-600" />
                                    <div>
                                        <p className="font-semibold text-blue-900">Quotation Shared with Client</p>
                                        <p className="mt-0.5 text-blue-800 text-[11px]">
                                            The client can view and download the quotation in their portal. Once the commercial terms are accepted, click <strong>Mark Request Completed</strong>.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {selectedRequest.status === "Completed" && (
                                <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-900">
                                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                                    <div>
                                        <p className="font-semibold text-emerald-900">Commercial Request Completed</p>
                                        <p className="mt-0.5 text-emerald-800 text-[11px]">
                                            <strong>Note:</strong> Marking a request as Completed only records the client commercial agreement. To formally renew the contract, update dates, and generate the invoice, use the <strong>AMC Renewal</strong> workflow.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Section 1: Client & Contract Context */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                                        <UserRound size={14} className="text-blue-600" />
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                            Client & Product
                                        </h3>
                                    </div>
                                    <div className="mt-3 space-y-2 text-xs">
                                        <div>
                                            <span className="text-[11px] text-slate-400">Client:</span>
                                            <p className="font-semibold text-slate-800">
                                                {selectedRequest.clientName}{" "}
                                                <span className="text-slate-400 font-normal">
                                                    ({selectedRequest.clientCode})
                                                </span>
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-[11px] text-slate-400">Product:</span>
                                            <p className="font-semibold text-slate-800">
                                                {selectedRequest.productName || "—"}
                                            </p>
                                        </div>
                                        {linkedContract && (
                                            <>
                                                <div>
                                                    <span className="text-[11px] text-slate-400">Contact Person:</span>
                                                    <p className="font-medium text-slate-700">
                                                        {linkedContract.contactPerson || "—"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-[11px] text-slate-400">Contact Info:</span>
                                                    <p className="font-medium text-slate-700">
                                                        {linkedContract.contactMobile || linkedContract.contactEmail || "—"}
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                        <div className="flex items-center gap-2">
                                            <CalendarDays size={14} className="text-indigo-600" />
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                                AMC Contract Link
                                            </h3>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onOpenContract(
                                                    selectedRequest.contractId,
                                                    selectedRequest.contractCode
                                                )
                                            }
                                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                                        >
                                            <span>Open Contract</span>
                                            <ArrowUpRight size={13} />
                                        </button>
                                    </div>
                                    <div className="mt-3 space-y-2 text-xs">
                                        <div>
                                            <span className="text-[11px] text-slate-400">Contract Code:</span>
                                            <p className="font-mono font-semibold text-slate-800">
                                                {selectedRequest.contractCode || "—"}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-[11px] text-slate-400">Current Expiry Date:</span>
                                            <p className="font-semibold text-slate-800">
                                                {formatDate(selectedRequest.currentExpiryDate)}
                                            </p>
                                        </div>
                                        {linkedContract && (
                                            <>
                                                <div>
                                                    <span className="text-[11px] text-slate-400">Contract Status:</span>
                                                    <p className="font-semibold text-slate-800">
                                                        {linkedContract.status || "Active"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-[11px] text-slate-400">Current Plan:</span>
                                                    <p className="font-medium text-slate-700">
                                                        {linkedContract.plan || "Standard"}
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Request Specifications */}
                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                                    <FileText size={14} className="text-blue-600" />
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                        Client Request Specifications
                                    </h3>
                                </div>
                                <div className="mt-3 grid gap-3 sm:grid-cols-3 text-xs">
                                    <div>
                                        <span className="text-[11px] text-slate-400">Request Type:</span>
                                        <p className="font-semibold text-slate-800">
                                            {selectedRequest.requestType}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-slate-400">Requested Period:</span>
                                        <p className="font-semibold text-slate-800">
                                            {selectedRequest.renewalPeriod || "1 Year"}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-slate-400">Preferred Start Date:</span>
                                        <p className="font-semibold text-slate-800">
                                            {formatDate(selectedRequest.preferredStartDate)}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-100">
                                    <span className="text-[11px] font-semibold text-slate-500">
                                        Client Remarks / Notes:
                                    </span>
                                    <div className="mt-1.5 rounded-lg bg-slate-50 p-3 text-xs text-slate-700 border border-slate-200/60 leading-relaxed italic">
                                        {selectedRequest.remarks || "No additional remarks provided by client."}
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Quotation Details (if present) */}
                            {(selectedRequest.quotationAmount > 0 ||
                                selectedRequest.quotationDetails ||
                                selectedRequest.quotationDocument) && (
                                <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-4 shadow-2xs">
                                    <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
                                        <div className="flex items-center gap-2">
                                            <IndianRupee size={14} className="text-blue-600" />
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                                                Quotation & Commercial Proposal
                                            </h3>
                                        </div>
                                        {selectedRequest.status === "Quotation Ready" && (
                                            <button
                                                type="button"
                                                onClick={() => openPrepareQuotationModal(selectedRequest)}
                                                className="text-[11px] font-semibold text-blue-700 hover:underline"
                                            >
                                                Edit Quotation
                                            </button>
                                        )}
                                    </div>
                                    <div className="mt-3 grid gap-3 sm:grid-cols-2 text-xs">
                                        <div>
                                            <span className="text-[11px] text-blue-600 font-semibold">
                                                Quotation Amount:
                                            </span>
                                            <p className="text-lg font-bold text-slate-900">
                                                {formatCurrency(selectedRequest.quotationAmount)}
                                            </p>
                                        </div>
                                        {selectedRequest.quotationDocument && (
                                            <div>
                                                <span className="text-[11px] text-blue-600 font-semibold">
                                                    Quotation Document:
                                                </span>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDownloadQuotation(selectedRequest)}
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition shadow-2xs"
                                                    >
                                                        <Download size={13} />
                                                        <span className="truncate max-w-[200px]">
                                                            {selectedRequest.quotationDocument.fileName || "Download Quotation"}
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {selectedRequest.quotationDetails && (
                                        <div className="mt-3 pt-3 border-t border-blue-100">
                                            <span className="text-[11px] font-semibold text-blue-800">
                                                Quotation Scope & Terms:
                                            </span>
                                            <p className="mt-1 text-xs text-slate-700 whitespace-pre-line bg-white/70 rounded-lg p-2.5 border border-blue-100">
                                                {selectedRequest.quotationDetails}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Section 4: Admin-Only Section (Internal Notes & Audit) */}
                            <div className="rounded-xl border border-amber-200/90 bg-amber-50/50 p-4 shadow-2xs">
                                <div className="flex items-center gap-2 border-b border-amber-200/70 pb-2.5">
                                    <Shield size={14} className="text-amber-700" />
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                                        Internal Admin Records (Strictly Private)
                                    </h3>
                                    <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-amber-100/90 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                        <Lock size={10} />
                                        Never Visible to Client
                                    </span>
                                </div>
                                <div className="mt-3 space-y-2 text-xs">
                                    <div>
                                        <span className="text-[11px] font-semibold text-amber-900">
                                            Internal Notes:
                                        </span>
                                        <div className="mt-1 rounded-lg bg-white p-2.5 text-xs text-slate-700 border border-amber-200/60 min-h-[48px] leading-relaxed">
                                            {selectedRequest.adminNotes || "No internal notes recorded."}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                                        <div>
                                            <span className="text-[11px] text-slate-400">Reviewed By:</span>
                                            <p className="font-semibold text-slate-800">
                                                {selectedRequest.reviewedByName || "—"}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-[11px] text-slate-400">Reviewed Date:</span>
                                            <p className="font-semibold text-slate-800">
                                                {formatDate(selectedRequest.reviewedAt)}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-[11px] text-slate-400">Assigned To:</span>
                                            <p className="font-semibold text-slate-800">
                                                {selectedRequest.assignedEmployeeName || "Unassigned"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 5: Timeline */}
                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                                    <History size={14} className="text-slate-600" />
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                        Activity & Audit Timeline
                                    </h3>
                                </div>
                                <div className="mt-4 space-y-3">
                                    {(!selectedRequest.timeline || selectedRequest.timeline.length === 0) ? (
                                        <p className="text-xs text-slate-400">No timeline entries yet.</p>
                                    ) : (
                                        selectedRequest.timeline.map((evt, idx) => (
                                            <div key={idx} className="flex items-start gap-3 text-xs">
                                                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1 rounded-lg border border-slate-100 bg-slate-50/50 p-2.5">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="font-semibold text-slate-800">
                                                            {evt.action}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">
                                                            {formatDateTime(evt.timestamp)}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                                                        <span>By {evt.performedByName}</span>
                                                        <span>·</span>
                                                        <span className="font-medium capitalize">
                                                            {evt.status}
                                                        </span>
                                                    </div>
                                                    {evt.remarks && (
                                                        <p className="mt-1.5 text-xs text-slate-600 italic bg-white p-2 rounded border border-slate-200/50">
                                                            "{evt.remarks}"
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Drawer Controlled Action Footer */}
                        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-slate-200 bg-white p-4">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedRequest(null)}
                                    className="h-9 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Close
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* State: Submitted */}
                                {selectedRequest.status === "Submitted" && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => openRejectModal(selectedRequest)}
                                            className="h-9 rounded-lg border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleStartReview(selectedRequest)}
                                            disabled={actionLoading}
                                            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-purple-600 px-4 text-xs font-semibold text-white hover:bg-purple-700 transition disabled:opacity-50"
                                        >
                                            <Eye size={14} />
                                            <span>Start Review</span>
                                        </button>
                                    </>
                                )}

                                {/* State: Under Review */}
                                {selectedRequest.status === "Under Review" && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => openCancelModal(selectedRequest)}
                                            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            Cancel Request
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openRejectModal(selectedRequest)}
                                            className="h-9 rounded-lg border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openPrepareQuotationModal(selectedRequest)}
                                            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 transition"
                                        >
                                            <FileText size={14} />
                                            <span>Prepare Quotation</span>
                                        </button>
                                    </>
                                )}

                                {/* State: Quotation Ready */}
                                {selectedRequest.status === "Quotation Ready" && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => openRejectModal(selectedRequest)}
                                            className="h-9 rounded-lg border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openPrepareQuotationModal(selectedRequest)}
                                            className="h-9 rounded-lg border border-blue-200 bg-white px-3 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                                        >
                                            Update Quotation
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openCompleteModal(selectedRequest)}
                                            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                                        >
                                            <Check size={14} />
                                            <span>Mark Request Completed</span>
                                        </button>
                                    </>
                                )}

                                {/* State: Completed */}
                                {selectedRequest.status === "Completed" && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onGoToRenewal(
                                                    selectedRequest.contractId,
                                                    selectedRequest.contractCode
                                                )
                                            }
                                            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-violet-600 px-4 text-xs font-semibold text-white hover:bg-violet-700 transition shadow-2xs"
                                        >
                                            <FileText size={14} />
                                            <span>Go to AMC Renewal</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* PREPARE QUOTATION MODAL */}
            {/* ========================================================= */}
            {quotationModalOpen && selectedRequest && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-5">
                    <button
                        type="button"
                        aria-label="Close modal"
                        onClick={() => setQuotationModalOpen(false)}
                        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
                    />
                    <div className="relative z-10 w-full max-w-[620px] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-4 text-white">
                            <div>
                                <h3 className="text-sm font-bold text-white">
                                    Prepare AMC Quotation
                                </h3>
                                <p className="text-[11px] text-blue-100">
                                    For {selectedRequest.requestCode} ({selectedRequest.clientName})
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setQuotationModalOpen(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveQuotation} className="p-6 space-y-4">
                            {actionError && (
                                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                                    {actionError}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Quotation Amount (₹) <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                                        ₹
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        required
                                        value={quotationForm.quotationAmount}
                                        onChange={(e) =>
                                            setQuotationForm((prev) => ({
                                                ...prev,
                                                quotationAmount: e.target.value,
                                            }))
                                        }
                                        placeholder="e.g. 18500"
                                        className="h-10 w-full rounded-lg border border-slate-200 pl-8 pr-3 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-hidden"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Quotation Scope & Terms (Client-Visible)
                                </label>
                                <textarea
                                    rows="3"
                                    value={quotationForm.quotationDetails}
                                    onChange={(e) =>
                                        setQuotationForm((prev) => ({
                                            ...prev,
                                            quotationDetails: e.target.value,
                                        }))
                                    }
                                    placeholder="Specify AMC coverage, SLA, terms, inclusions and validity..."
                                    className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Message to Client (Enters Client Timeline)
                                </label>
                                <input
                                    type="text"
                                    value={quotationForm.clientRemarks}
                                    onChange={(e) =>
                                        setQuotationForm((prev) => ({
                                            ...prev,
                                            clientRemarks: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g. Quotation has been prepared for your review."
                                    className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-amber-800 mb-1">
                                    Internal Admin Note (Strictly Private — Never Shared with Client)
                                </label>
                                <textarea
                                    rows="2"
                                    value={quotationForm.adminNotes}
                                    onChange={(e) =>
                                        setQuotationForm((prev) => ({
                                            ...prev,
                                            adminNotes: e.target.value,
                                        }))
                                    }
                                    placeholder="Internal margins, approval notes, commercial considerations..."
                                    className="w-full rounded-lg border border-amber-200 bg-amber-50/30 p-2.5 text-xs text-slate-800 focus:border-amber-500 focus:outline-hidden"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Attach Formal Quotation Document (PDF, Word, or Image)
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                    onChange={(e) => setQuotationFile(e.target.files[0] || null)}
                                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                {selectedRequest.quotationDocument && !quotationFile && (
                                    <p className="mt-1 text-[11px] text-slate-500">
                                        Current attachment:{" "}
                                        <span className="font-semibold text-slate-700">
                                            {selectedRequest.quotationDocument.fileName}
                                        </span>{" "}
                                        (leave empty to keep existing)
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setQuotationModalOpen(false)}
                                    className="h-9 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
                                >
                                    <Send size={14} />
                                    <span>
                                        {actionLoading
                                            ? "Saving..."
                                            : "Save & Set Quotation Ready"}
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* REJECT MODAL */}
            {/* ========================================================= */}
            {rejectModalOpen && selectedRequest && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-5">
                    <button
                        type="button"
                        aria-label="Close modal"
                        onClick={() => setRejectModalOpen(false)}
                        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
                    />
                    <div className="relative z-10 w-full max-w-[480px] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between border-b border-rose-100 bg-rose-50 px-6 py-4 text-rose-900">
                            <div>
                                <h3 className="text-sm font-bold">Reject AMC Request</h3>
                                <p className="text-[11px] text-rose-700">
                                    For {selectedRequest.requestCode} ({selectedRequest.clientName})
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setRejectModalOpen(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-700 hover:bg-rose-100"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <form onSubmit={handleConfirmReject} className="p-6 space-y-4">
                            {actionError && (
                                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                                    {actionError}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Reason for Rejection (Visible to Client) <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    rows="3"
                                    required
                                    value={rejectForm.clientRemarks}
                                    onChange={(e) =>
                                        setRejectForm((prev) => ({
                                            ...prev,
                                            clientRemarks: e.target.value,
                                        }))
                                    }
                                    placeholder="Please provide clear reason to the client why this request cannot be fulfilled..."
                                    className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-rose-500 focus:outline-hidden"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-amber-800 mb-1">
                                    Internal Note (Admin-Only)
                                </label>
                                <textarea
                                    rows="2"
                                    value={rejectForm.adminNotes}
                                    onChange={(e) =>
                                        setRejectForm((prev) => ({
                                            ...prev,
                                            adminNotes: e.target.value,
                                        }))
                                    }
                                    placeholder="Internal reason for record..."
                                    className="w-full rounded-lg border border-amber-200 bg-amber-50/30 p-2.5 text-xs text-slate-800 focus:border-amber-500 focus:outline-hidden"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setRejectModalOpen(false)}
                                    className="h-9 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-rose-600 px-4 text-xs font-semibold text-white hover:bg-rose-700 transition disabled:opacity-50"
                                >
                                    <XCircle size={14} />
                                    <span>{actionLoading ? "Rejecting..." : "Confirm Rejection"}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* CANCEL MODAL */}
            {/* ========================================================= */}
            {cancelModalOpen && selectedRequest && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-5">
                    <button
                        type="button"
                        aria-label="Close modal"
                        onClick={() => setCancelModalOpen(false)}
                        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
                    />
                    <div className="relative z-10 w-full max-w-[480px] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-6 py-4 text-slate-900">
                            <div>
                                <h3 className="text-sm font-bold">Cancel AMC Request</h3>
                                <p className="text-[11px] text-slate-600">
                                    For {selectedRequest.requestCode} ({selectedRequest.clientName})
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCancelModalOpen(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-200"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <form onSubmit={handleConfirmCancel} className="p-6 space-y-4">
                            {actionError && (
                                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                                    {actionError}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Cancellation Reason (Visible to Client)
                                </label>
                                <textarea
                                    rows="3"
                                    value={cancelForm.clientRemarks}
                                    onChange={(e) =>
                                        setCancelForm((prev) => ({
                                            ...prev,
                                            clientRemarks: e.target.value,
                                        }))
                                    }
                                    placeholder="Reason for cancelling this request..."
                                    className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-slate-500 focus:outline-hidden"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-amber-800 mb-1">
                                    Internal Note (Admin-Only)
                                </label>
                                <textarea
                                    rows="2"
                                    value={cancelForm.adminNotes}
                                    onChange={(e) =>
                                        setCancelForm((prev) => ({
                                            ...prev,
                                            adminNotes: e.target.value,
                                        }))
                                    }
                                    placeholder="Internal cancellation note..."
                                    className="w-full rounded-lg border border-amber-200 bg-amber-50/30 p-2.5 text-xs text-slate-800 focus:border-amber-500 focus:outline-hidden"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setCancelModalOpen(false)}
                                    className="h-9 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-700 px-4 text-xs font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50"
                                >
                                    <span>{actionLoading ? "Cancelling..." : "Confirm Cancellation"}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MARK COMPLETED MODAL (WITH STRICT BUSINESS RULE NOTICE) */}
            {/* ========================================================= */}
            {completeModalOpen && selectedRequest && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-5">
                    <button
                        type="button"
                        aria-label="Close modal"
                        onClick={() => setCompleteModalOpen(false)}
                        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
                    />
                    <div className="relative z-10 w-full max-w-[540px] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50 px-6 py-4 text-emerald-950">
                            <div>
                                <h3 className="text-sm font-bold">
                                    Mark AMC Request Completed
                                </h3>
                                <p className="text-[11px] text-emerald-800">
                                    For {selectedRequest.requestCode} ({selectedRequest.clientName})
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCompleteModalOpen(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-800 hover:bg-emerald-100"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <form onSubmit={handleConfirmComplete} className="p-6 space-y-4">
                            {actionError && (
                                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                                    {actionError}
                                </div>
                            )}

                            {/* Prominent Business Rule Disclaimer */}
                            <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-3.5 text-xs text-amber-950 space-y-2">
                                <div className="flex items-center gap-2 font-bold text-amber-900">
                                    <AlertTriangle size={16} className="text-amber-700 shrink-0" />
                                    <span>IMPORTANT: REQUEST RENEWAL ≠ RENEW AMC</span>
                                </div>
                                <p className="text-[11px] text-amber-900/90 leading-relaxed">
                                    Completing this request records that the commercial proposal/quotation was accepted.
                                    This action will <strong>NOT</strong>:
                                </p>
                                <ul className="list-disc pl-4 text-[11px] space-y-0.5 text-amber-900/90">
                                    <li>Change the AMC contract's start or expiry dates</li>
                                    <li>Update contract status to Paid or append renewal history</li>
                                    <li>Generate an AmcInvoice or AmcPayment</li>
                                </ul>
                                <p className="text-[11px] font-semibold text-amber-950 pt-1">
                                    To formally renew the contract and generate an invoice, use the standard AMC Renewal action.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Internal Completion Notes (Admin-Only)
                                </label>
                                <textarea
                                    rows="2"
                                    value={completeForm.adminNotes}
                                    onChange={(e) =>
                                        setCompleteForm((prev) => ({
                                            ...prev,
                                            adminNotes: e.target.value,
                                        }))
                                    }
                                    placeholder="Commercial terms accepted by client..."
                                    className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                                />
                            </div>

                            <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 border border-slate-200">
                                <input
                                    type="checkbox"
                                    id="openRenewalAfter"
                                    checked={completeForm.openRenewalAfter}
                                    onChange={(e) =>
                                        setCompleteForm((prev) => ({
                                            ...prev,
                                            openRenewalAfter: e.target.checked,
                                        }))
                                    }
                                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="openRenewalAfter" className="text-xs text-slate-700 cursor-pointer">
                                    <span className="font-semibold">Open AMC Contract Renewal workflow immediately</span>
                                    <p className="text-[11px] text-slate-500">
                                        Takes you directly to the formal renewal form for contract {selectedRequest.contractCode} after saving.
                                    </p>
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setCompleteModalOpen(false)}
                                    className="h-9 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                                >
                                    <Check size={14} />
                                    <span>
                                        {actionLoading
                                            ? "Completing..."
                                            : "Mark Request Completed"}
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

