import {
    useEffect,
    useMemo,
    useState,
} from "react";
import AmcReminderModal from "./AmcReminderModal";
import AmcInvoice from "./AmcInvoice";
import AmcRenewalRequestsTab from "./AmcRenewalRequestsTab";
import DataTable from "../../components/data/DataTable";
import {
    AlertCircle,
    ArrowLeft,
    ArrowUpRight,
    BadgeIndianRupee,
    BellRing,
    CalendarDays,
    CheckCircle2,
    Clock3,
    CreditCard,
    Download,
    Eye,
    FileImage,
    FileText,
    FolderOpen,
    Paperclip,
    Pencil,
    Trash2,
    Upload,
    Filter,
    History,
    IndianRupee,
    MoreHorizontal,
    Plus,
    ReceiptIndianRupee,
    RefreshCw,
    Search,
    SlidersHorizontal,
    TrendingUp,
    UserRound,
    WalletCards,
    X,
} from "lucide-react";

import API_URL from "../../config/api";

const getAuthToken = () =>
    localStorage.getItem(
        "client-connect-token"
    ) ||
    sessionStorage.getItem(
        "client-connect-token"
    ) ||
    "";

const emptyNewAmcForm = {
    clientId: "",
    clientCode: "",
    clientName: "",
    contactPerson: "",
    contactMobile: "",
    contactEmail: "",
    clientProductId: "",
    productId: "",
    productCode: "",
    productName: "",
    productVersion: "",
    plan: "Standard",
    licensedUsers: "1",
    startDate: "",
    expiryDate: "",
    dueDate: "",
    taxableAmount: "",
    invoiceSource: "SYSTEM",
    gstApplicable: "YES",
    gstRate: "18",
    customGstRate: "",
    taxType: "CGST_SGST",
    cgstRate: "9",
    sgstRate: "9",
    igstRate: "0",
    assignedEmployeeId: "",
    assignedEmployeeCode: "",
    assignedEmployeeName: "",
    notes: "",
};

const statusOptions = [
    "All",
    "Paid",
    "Pending",
    "Partially Paid",
    "Overdue",
    "Upcoming",
];


const planOptions = ["All", "Premium", "Standard", "Basic"];

const emptyPaymentForm = {
    amount: "",
    paymentDate: "",
    mode: "Bank Transfer",
    referenceNo: "",
    notes: "",
};

const emptyRenewalForm = {
    amount: "",
    startDate: "",
    expiryDate: "",
    dueDate: "",
    plan: "Standard",
    notes: "",
};

const normalizeClientFromApi = (
    client = {}
) => ({
    id: String(
        client._id ||
        client.id ||
        ""
    ),
    clientCode:
        client.clientCode ||
        "",
    companyName:
        client.companyName ||
        "",
    contactPerson:
        client.contactPerson ||
        "",
    mobile:
        client.mobile ||
        "",
    email:
        client.email ||
        "",
    products:
        Array.isArray(client.products)
            ? client.products.map(
                (product) => ({
                    clientProductId:
                        String(
                            product._id ||
                            product.id ||
                            ""
                        ),
                    productId:
                        String(
                            product.productId?._id ||
                            product.productId ||
                            ""
                        ),
                    productCode:
                        product.productCode ||
                        "",
                    productName:
                        product.productName ||
                        "",
                    version:
                        product.version ||
                        "v1.0.0",
                    licensedUsers:
                        Number(
                            product.licensedUsers ||
                            1
                        ),
                    supportType:
                        product.supportType ||
                        "Standard",
                    amcStatus:
                        product.amcStatus ||
                        "Not Started",
                    expiryDate:
                        product.expiryDate ||
                        "",
                    installationStatus:
                        product.installationStatus ||
                        "Installed",
                })
            )
            : [],
});

const normalizeEmployeeFromApi = (
    employee = {}
) => ({
    id: String(
        employee._id ||
        employee.id ||
        ""
    ),
    employeeCode:
        employee.employeeCode ||
        "",
    name:
        employee.name ||
        employee.employeeName ||
        "",
    status:
        employee.status ||
        "Free",
    isActive:
        employee.isActive !== false,
});

const normalizeAmcContractFromApi = (
    contract = {}
) => {
    const invoice =
        contract.currentInvoice ||
        contract.invoice ||
        {};

    return {
        id: String(
            contract._id ||
            contract.id ||
            ""
        ),
        mongoId: String(
            contract._id ||
            contract.id ||
            ""
        ),
        contractNo:
            contract.contractCode ||
            "",
        contractCode:
            contract.contractCode ||
            "",
        currentInvoiceId:
            String(
                contract.currentInvoiceId?._id ||
                contract.currentInvoiceId ||
                contract.currentInvoice?._id ||
                contract.currentInvoice?.id ||
                contract.invoice?._id ||
                contract.invoice?.id ||
                ""
            ),
        amcInvoiceId:
            String(
                contract.currentInvoiceId?._id ||
                contract.currentInvoiceId ||
                contract.currentInvoice?._id ||
                contract.currentInvoice?.id ||
                contract.invoice?._id ||
                contract.invoice?.id ||
                ""
            ),
        currentInvoiceCode:
            contract.currentInvoiceCode ||
            contract.currentInvoice?.invoiceCode ||
            contract.invoice?.invoiceCode ||
            contract.invoiceCode ||
            "",
        invoiceNo:
            contract.currentInvoice?.invoiceCode ||
            contract.invoice?.invoiceCode ||
            contract.invoiceCode ||
            "",
        invoiceCode:
            contract.currentInvoice?.invoiceCode ||
            contract.invoice?.invoiceCode ||
            contract.invoiceCode ||
            "",
        invoiceDate:
            contract.invoiceDate
                ? new Date(
                    contract.invoiceDate
                ).toLocaleDateString(
                    "en-GB",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                    }
                )
                : "—",
        clientId:
            contract.clientId
                ? String(
                    contract.clientId
                )
                : "",
        clientCode:
            contract.clientCode ||
            "",
        client:
            contract.clientName ||
            "",
        clientName:
            contract.clientName ||
            "",
        contactPerson:
            contract.contactPerson ||
            "",
        mobile:
            contract.contactMobile ||
            "",
        contactMobile:
            contract.contactMobile ||
            "",
        contactEmail:
            contract.contactEmail ||
            "",
        clientProductId:
            contract.clientProductId
                ? String(
                    contract.clientProductId
                )
                : "",
        productId:
            contract.productId
                ? String(
                    contract.productId
                )
                : "",
        productCode:
            contract.productCode ||
            "",
        product:
            contract.productName ||
            "",
        productName:
            contract.productName ||
            "",
        version:
            contract.productVersion ||
            "",
        productVersion:
            contract.productVersion ||
            "",
        plan:
            contract.plan ||
            "Standard",
        users:
            Number(
                contract.licensedUsers ||
                1
            ),
        licensedUsers:
            Number(
                contract.licensedUsers ||
                1
            ),
        startDate:
            contract.startDate
                ? new Date(
                    contract.startDate
                ).toLocaleDateString(
                    "en-GB",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                    }
                )
                : "—",
        startDateValue:
            contract.startDate
                ? String(
                    contract.startDate
                ).slice(0, 10)
                : "",
        expiryDate:
            contract.expiryDate
                ? new Date(
                    contract.expiryDate
                ).toLocaleDateString(
                    "en-GB",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                    }
                )
                : "—",
        expiryDateValue:
            contract.expiryDate
                ? String(
                    contract.expiryDate
                ).slice(0, 10)
                : "",
        dueDate:
            contract.dueDate
                ? new Date(
                    contract.dueDate
                ).toLocaleDateString(
                    "en-GB",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                    }
                )
                : "—",
        dueDateValue:
            contract.dueDate
                ? String(
                    contract.dueDate
                ).slice(0, 10)
                : "",
        taxableAmount:
            Number(
                invoice.taxableAmount ??
                contract.taxableAmount ??
                0
            ),
        cgstRate:
            Number(
                contract.cgstRate ||
                0
            ),
        cgstAmount:
            Number(
                contract.cgstAmount ||
                0
            ),
        sgstRate:
            Number(
                contract.sgstRate ||
                0
            ),
        sgstAmount:
            Number(
                contract.sgstAmount ||
                0
            ),
        igstRate:
            Number(
                contract.igstRate ||
                0
            ),
        igstAmount:
            Number(
                contract.igstAmount ||
                0
            ),
        totalTaxAmount:
            Number(
                contract.totalTaxAmount ||
                0
            ),
        amount:
            Number(
                invoice.totalAmount ??
                contract.totalAmount ??
                0
            ),
        totalAmount:
            Number(
                invoice.totalAmount ??
                contract.totalAmount ??
                0
            ),
        paidAmount:
            Number(
                invoice.paidAmount ??
                contract.paidAmount ??
                0
            ),
        pendingAmount:
            Number(
                invoice.pendingAmount ??
                contract.pendingAmount ??
                0
            ),
        status:
            contract.status ||
            "Pending",
        isCurrent:
            contract.isCurrent !== undefined
                ? Boolean(contract.isCurrent)
                : contract.status !== "Cancelled" && !contract.isDeleted,
        assignedEmployeeId:
            contract.assignedEmployeeId
                ? String(
                    contract.assignedEmployeeId
                )
                : "",
        assignedEmployeeCode:
            contract.assignedEmployeeCode ||
            "",
        assignedEmployeeName:
            contract.assignedEmployeeName ||
            "Unassigned",
        assignedTo:
            contract.assignedEmployeeName ||
            "Unassigned",
        reminderStatus:
            contract.reminderStatus ||
            "Not Sent",
        lastReminder:
            contract.lastReminderAt
                ? new Date(
                    contract.lastReminderAt
                ).toLocaleString(
                    "en-IN"
                )
                : "—",
        nextFollowUpDate:
            contract.nextFollowUpDate ||
            null,
        notes:
            contract.notes ||
            "",
        paymentHistory:
            Array.isArray(
                contract.payments
            )
                ? contract.payments.map(
                    (payment) => ({
                        id:
                            payment._id ||
                            payment.id,
                        paymentCode:
                            payment.paymentCode ||
                            "",
                        amcInvoiceId:
                            payment.amcInvoiceId ||
                            "",
                        date:
                            payment.paymentDate
                                ? new Date(
                                    payment.paymentDate
                                ).toLocaleDateString(
                                    "en-GB",
                                    {
                                        day:
                                            "2-digit",
                                        month:
                                            "short",
                                        year:
                                            "numeric",
                                    }
                                )
                                : "—",
                        paymentDate:
                            payment.paymentDate ||
                            null,
                        amount:
                            Number(
                                payment.amount ||
                                0
                            ),
                        mode:
                            payment.mode ||
                            "Other",
                        referenceNo:
                            payment.referenceNo ||
                            "—",
                        notes:
                            payment.notes ||
                            "",
                        receivedBy:
                            payment.receivedByName ||
                            "Admin",
                    })
                )
                : [],
        reminderHistory:
            Array.isArray(
                contract.reminders
            )
                ? contract.reminders
                : [],
        renewalHistory:
            Array.isArray(
                contract.renewalHistory
            )
                ? contract.renewalHistory
                : [],
        documents:
            Array.isArray(contract.documents)
                ? contract.documents.map(
                    (document) => ({
                        id: String(
                            document._id ||
                            document.id ||
                            ""
                        ),

                        type:
                            document.documentType ||
                            document.type ||
                            "Other Document",

                        documentType:
                            document.documentType ||
                            document.type ||
                            "Other Document",

                        name:
                            document.fileName ||
                            document.name ||
                            "Document",

                        fileName:
                            document.fileName ||
                            document.name ||
                            "Document",

                        mimeType:
                            document.mimeType ||
                            document.contentType ||
                            "",

                        size:
                            Number(
                                document.fileSize ||
                                document.size ||
                                0
                            ),

                        fileSize:
                            Number(
                                document.fileSize ||
                                document.size ||
                                0
                            ),

                        previewUrl:
                            document.previewUrl ||
                            document.url ||
                            "",

                        downloadUrl:
                            document.downloadUrl ||
                            "",

                        source:
                            document.source ||
                            "Uploaded",

                        status:
                            document.status ||
                            "Available",

                        uploadedAt:
                            document.uploadedAt ||
                            document.createdAt ||
                            null,

                        uploadedBy:
                            document.uploadedByName ||
                            document.uploadedBy ||
                            "Admin",

                        uploadedByName:
                            document.uploadedByName ||
                            "Admin",

                        localOnly:
                            false,
                    })
                )
                : [],
        timeline:
            Array.isArray(
                contract.timeline
            )
                ? contract.timeline.map(
                    (item) => ({
                        id:
                            item._id ||
                            item.id ||
                            `${item.title}-${item.createdAt}`,
                        type:
                            item.type ||
                            "updated",
                        title:
                            item.title ||
                            "AMC updated",
                        description:
                            item.description ||
                            "",
                        user:
                            item.performedByName ||
                            "System",
                        time:
                            item.createdAt
                                ? new Date(
                                    item.createdAt
                                ).toLocaleString(
                                    "en-IN"
                                )
                                : "—",
                    })
                )
                : [],
    };
};

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number(amount || 0));
}
const formatBusinessDate = (value) => {
    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "—";
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    );
};


function StatusBadge({ status }) {
    const classes = {
        Paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
        Pending: "bg-amber-50 text-amber-700 ring-amber-600/10",
        "Partially Paid": "bg-blue-50 text-blue-700 ring-blue-600/10",
        Overdue: "bg-rose-50 text-rose-700 ring-rose-600/10",
        Upcoming: "bg-violet-50 text-violet-700 ring-violet-600/10",
    };

    return (
        <span
            className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${classes[status] || "bg-slate-100 text-slate-600 ring-slate-500/10"
                }`}
        >
            {status}
        </span>
    );
}

function ReminderBadge({ status }) {
    const classes =
        status === "Sent"
            ? "bg-blue-50 text-blue-700"
            : status === "Not Required"
                ? "bg-slate-100 text-slate-500"
                : "bg-amber-50 text-amber-700";

    return (
        <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${classes}`}>
            {status}
        </span>
    );
}

function AmcTimelineIcon({ type }) {
    const config = {
        created: {
            icon: Plus,
            className: "bg-violet-100 text-violet-700",
        },
        invoice: {
            icon: FileText,
            className: "bg-blue-100 text-blue-700",
        },
        reminder: {
            icon: BellRing,
            className: "bg-amber-100 text-amber-700",
        },
        payment: {
            icon: ReceiptIndianRupee,
            className: "bg-emerald-100 text-emerald-700",
        },
        renewal: {
            icon: RefreshCw,
            className: "bg-cyan-100 text-cyan-700",
        },
        assignment: {
            icon: UserRound,
            className: "bg-indigo-100 text-indigo-700",
        },
        updated: {
            icon: Pencil,
            className: "bg-blue-100 text-blue-700",
        },
        update: {
            icon: Pencil,
            className: "bg-blue-100 text-blue-700",
        },
    };

    const selectedConfig = config[type] || {
        icon: History,
        className: "bg-slate-100 text-slate-600",
    };

    const Icon = selectedConfig.icon;

    return (
        <div
            className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-4 ring-white ${selectedConfig.className}`}
        >
            <Icon size={17} />
        </div>
    );
}

const normalizeAmcInvoiceDetail = (
    invoice = {},
    contract = {}
) => {
    const payments =
        Array.isArray(invoice.payments)
            ? invoice.payments
            : [];

    return {
        id: String(
            invoice._id ||
            invoice.id ||
            ""
        ),

        amcInvoiceId: String(
            invoice._id ||
            invoice.id ||
            ""
        ),

        invoiceCode:
            invoice.invoiceCode ||
            invoice.invoiceNo ||
            "",

        invoiceNo:
            invoice.invoiceCode ||
            invoice.invoiceNo ||
            "",

        invoiceDate:
            invoice.invoiceDate ||
            null,

        dueDate:
            invoice.dueDate ||
            null,

        amcContractId:
            String(
                invoice.amcContractId ||
                contract._id ||
                contract.id ||
                ""
            ),

        contractCode:
            invoice.contractCode ||
            contract.contractCode ||
            "",

        clientId:
            String(
                invoice.clientId ||
                contract.clientId ||
                ""
            ),

        clientCode:
            invoice.clientCode ||
            contract.clientCode ||
            "",

        clientName:
            invoice.clientName ||
            contract.clientName ||
            "",

        contactPerson:
            contract.contactPerson ||
            "",

        contactMobile:
            contract.contactMobile ||
            "",

        contactEmail:
            contract.contactEmail ||
            "",

        productId:
            String(
                invoice.productId ||
                contract.productId ||
                ""
            ),

        productCode:
            invoice.productCode ||
            contract.productCode ||
            "",

        productName:
            invoice.productName ||
            contract.productName ||
            "",

        productVersion:
            invoice.productVersion ||
            contract.productVersion ||
            "",

        plan:
            invoice.plan ||
            contract.plan ||
            "Standard",

        licensedUsers:
            Number(
                invoice.licensedUsers ||
                contract.licensedUsers ||
                1
            ),

        startDate:
            invoice.contractStartDate ||
            invoice.startDate ||
            null,

        expiryDate:
            invoice.contractExpiryDate ||
            invoice.endDate ||
            null,

        taxableAmount:
            Number(
                invoice.taxableAmount ||
                0
            ),

        cgstRate:
            Number(
                invoice.cgstRate ||
                0
            ),

        cgstAmount:
            Number(
                invoice.cgstAmount ||
                0
            ),

        sgstRate:
            Number(
                invoice.sgstRate ||
                0
            ),

        sgstAmount:
            Number(
                invoice.sgstAmount ||
                0
            ),

        igstRate:
            Number(
                invoice.igstRate ||
                0
            ),

        igstAmount:
            Number(
                invoice.igstAmount ||
                0
            ),

        totalAmount:
            Number(
                invoice.totalAmount ||
                0
            ),

        paidAmount:
            Number(
                invoice.paidAmount ||
                0
            ),

        pendingAmount:
            Number(
                invoice.pendingAmount ||
                0
            ),

        paymentStatus:
            invoice.paymentStatus ||
            "Pending",

        status:
            invoice.paymentStatus ||
            invoice.status ||
            "Pending",

        isCurrent:
            invoice.isCurrent === true,

        notes:
            invoice.notes ||
            "",

        payments:
            payments.map(
                (payment) => ({
                    id:
                        payment._id ||
                        payment.id,

                    paymentCode:
                        payment.paymentCode ||
                        "",

                    paymentDate:
                        payment.paymentDate ||
                        null,

                    amount:
                        Number(
                            payment.amount ||
                            0
                        ),

                    mode:
                        payment.mode ||
                        "Other",

                    referenceNo:
                        payment.referenceNo ||
                        "—",

                    notes:
                        payment.notes ||
                        "",

                    receivedBy:
                        payment.receivedByName ||
                        payment.createdByName ||
                        "Admin",
                })
            ),
    };
};

function EditAmcDrawer({
    isOpen,
    onClose,
    record,
    form,
    onFormChange,
    onFormUpdate,
    gstPreview,
    employees = [],
    saving = false,
    error = "",
    onSubmit,
}) {
    if (!isOpen || !record) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-end p-3 sm:p-5 lg:p-7">
            <button
                type="button"
                aria-label="Close edit AMC drawer"
                onClick={onClose}
                className="enterprise-backdrop absolute inset-0 bg-slate-950/55 backdrop-blur-[3px]"
            />
            <div className="enterprise-drawer relative z-10 flex h-[calc(100vh-24px)] w-full max-w-[980px] flex-col overflow-hidden rounded-[26px] border border-white/70 bg-[#f8fafc] shadow-[0_32px_100px_rgba(15,23,42,0.30)] sm:h-[calc(100vh-40px)] lg:h-[calc(100vh-56px)]">
                <div className="relative flex min-h-[92px] shrink-0 items-center justify-between overflow-hidden border-b border-blue-100 bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-700 px-7 text-white">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2">
                            <span className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                                {record.contractNo || record.contractCode || "AMC"}
                            </span>
                            <span className="text-xs text-blue-100">· {record.client || record.clientName}</span>
                        </div>
                        <h2 className="mt-1 text-xl font-bold tracking-[-0.02em] text-white">Edit AMC Contract</h2>
                        <p className="mt-1 text-xs font-medium text-blue-100">Update AMC terms, dates, pricing, tax details and assignment.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
                    <div className="flex-1 overflow-y-auto bg-slate-50/70 px-5 py-5 sm:px-7 sm:py-6">
                        <div className="space-y-5">
                            {/* Client & Product Info */}
                            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.045)] sm:p-6">
                                <div className="mb-4 flex items-start justify-between border-b border-slate-100 pb-3">
                                    <div>
                                        <h3 className="text-sm font-bold tracking-[-0.01em] text-slate-950">Contract Information</h3>
                                        <p className="mt-0.5 text-[11px] text-slate-500">Client and product association for this AMC agreement.</p>
                                    </div>
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                                        {record.contractNo || record.contractCode}
                                    </span>
                                </div>
                                <div className="grid gap-x-5 gap-y-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-[11px] font-bold text-slate-700">Client Name</label>
                                        <input
                                            type="text"
                                            value={form.clientName}
                                            readOnly
                                            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 text-sm font-semibold text-slate-700 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-[11px] font-bold text-slate-700">Client Product</label>
                                        <input
                                            type="text"
                                            value={`${form.productCode ? form.productCode + " - " : ""}${form.productName}`}
                                            readOnly
                                            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 text-sm font-semibold text-slate-700 outline-none"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Plan & Users & Status */}
                            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.045)] sm:p-6">
                                <div className="mb-4 flex items-start gap-3 border-b border-slate-100 pb-3">
                                    <div>
                                        <h3 className="text-sm font-bold tracking-[-0.01em] text-slate-950">Plan & Status</h3>
                                        <p className="mt-0.5 text-[11px] text-slate-500">Configure AMC tier, user capacity and current lifecycle status.</p>
                                    </div>
                                </div>
                                <div className="grid gap-x-5 gap-y-4 md:grid-cols-3">
                                    <div>
                                        <label className="mb-1.5 block text-[11px] font-bold text-slate-700">AMC Plan</label>
                                        <select
                                            name="plan"
                                            value={form.plan}
                                            onChange={onFormChange}
                                            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                        >
                                            <option value="Basic">Basic</option>
                                            <option value="Standard">Standard</option>
                                            <option value="Premium">Premium</option>
                                            <option value="Custom">Custom</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-[11px] font-bold text-slate-700">Licensed Users <span className="text-rose-500">*</span></label>
                                        <input
                                            type="number"
                                            name="licensedUsers"
                                            min="1"
                                            value={form.licensedUsers}
                                            onChange={onFormChange}
                                            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-[11px] font-bold text-slate-700">Contract Status</label>
                                        <select
                                            name="status"
                                            value={form.status}
                                            onChange={onFormChange}
                                            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Upcoming">Upcoming</option>
                                            <option value="Overdue">Overdue</option>
                                            <option value="Paid">Paid</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                </div>
                            </section>

                            {/* Dates & Billing */}
                            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.045)] sm:p-6">
                                <div className="mb-4 flex items-start gap-3 border-b border-slate-100 pb-3">
                                    <div>
                                        <h3 className="text-sm font-bold tracking-[-0.01em] text-slate-950">Period & Billing Dates</h3>
                                        <p className="mt-0.5 text-[11px] text-slate-500">Service coverage timeline and payment deadline.</p>
                                    </div>
                                </div>
                                <div className="grid gap-x-5 gap-y-4 md:grid-cols-3">
                                    <div>
                                        <label className="mb-1.5 block text-[11px] font-bold text-slate-700">Start Date <span className="text-rose-500">*</span></label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            value={form.startDate}
                                            onChange={onFormChange}
                                            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-[11px] font-bold text-slate-700">Expiry Date <span className="text-rose-500">*</span></label>
                                        <input
                                            type="date"
                                            name="expiryDate"
                                            value={form.expiryDate}
                                            onChange={onFormChange}
                                            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-[11px] font-bold text-slate-700">Due Date <span className="text-rose-500">*</span></label>
                                        <input
                                            type="date"
                                            name="dueDate"
                                            value={form.dueDate}
                                            onChange={onFormChange}
                                            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                        />
                                    </div>
                                </div>

                                {/* Pricing & Tax */}
                                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900">Tax & Amount Calculation</h4>
                                            <p className="mt-0.5 text-[11px] text-slate-500">Taxable amount and applicable GST configuration.</p>
                                        </div>
                                        <div className="rounded-lg bg-blue-50 px-3.5 py-2 text-right">
                                            <p className="text-[9px] font-bold uppercase tracking-wider text-blue-600">Calculated Grand Total</p>
                                            <p className="mt-0.5 text-base font-extrabold text-blue-700">{formatCurrency(gstPreview.grandTotal)}</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-x-5 gap-y-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-1.5 block text-[11px] font-bold text-slate-700">Taxable AMC Amount <span className="text-rose-500">*</span></label>
                                            <div className="relative">
                                                <IndianRupee size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="number"
                                                    name="taxableAmount"
                                                    min="0"
                                                    step="0.01"
                                                    value={form.taxableAmount}
                                                    onChange={onFormChange}
                                                    placeholder="Enter taxable amount"
                                                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="mb-1.5 block text-[11px] font-bold text-slate-700">GST Applicable?</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => onFormUpdate((cur) => ({ ...cur, gstApplicable: "YES" }))}
                                                    className={`h-12 rounded-xl border text-xs font-bold transition ${form.gstApplicable === "YES" ? "border-emerald-400 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-100" : "border-slate-200 bg-white text-slate-600"}`}
                                                >
                                                    Yes, Apply GST
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onFormUpdate((cur) => ({ ...cur, gstApplicable: "NO", cgstRate: "0", sgstRate: "0", igstRate: "0" }))}
                                                    className={`h-12 rounded-xl border text-xs font-bold transition ${form.gstApplicable === "NO" ? "border-slate-400 bg-slate-100 text-slate-800 ring-2 ring-slate-100" : "border-slate-200 bg-white text-slate-600"}`}
                                                >
                                                    No / N.A.
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {form.gstApplicable === "YES" && (
                                        <div className="mt-4 grid gap-4 md:grid-cols-3">
                                            <div>
                                                <label className="mb-1.5 block text-[11px] font-bold text-slate-700">GST Rate</label>
                                                <select
                                                    name="gstRate"
                                                    value={form.gstRate}
                                                    onChange={onFormChange}
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                                >
                                                    <option value="5">5%</option>
                                                    <option value="12">12%</option>
                                                    <option value="18">18%</option>
                                                    <option value="28">28%</option>
                                                    <option value="CUSTOM">Custom</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block text-[11px] font-bold text-slate-700">Tax Type</label>
                                                <select
                                                    name="taxType"
                                                    value={form.taxType}
                                                    onChange={onFormChange}
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                                >
                                                    <option value="CGST_SGST">CGST + SGST</option>
                                                    <option value="IGST">IGST</option>
                                                </select>
                                            </div>
                                            {form.gstRate === "CUSTOM" ? (
                                                <div>
                                                    <label className="mb-1.5 block text-[11px] font-bold text-slate-700">Custom GST %</label>
                                                    <input
                                                        type="number"
                                                        name="customGstRate"
                                                        min="0"
                                                        max="100"
                                                        step="0.01"
                                                        value={form.customGstRate}
                                                        onChange={onFormChange}
                                                        placeholder="e.g. 18"
                                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                                                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Applied Split</p>
                                                    <p className="mt-1 text-xs font-bold text-slate-700">
                                                        {form.taxType === "IGST"
                                                            ? `IGST ${gstPreview.igstRate}%`
                                                            : `CGST ${gstPreview.cgstRate}% + SGST ${gstPreview.sgstRate}%`}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Breakdown summary */}
                                    <div className="mt-4 grid gap-2 rounded-xl bg-slate-950 p-4 text-white sm:grid-cols-4">
                                        <div><p className="text-[9px] uppercase tracking-wider text-slate-400">Taxable</p><p className="mt-1 text-xs font-bold">{formatCurrency(gstPreview.taxableAmount)}</p></div>
                                        <div><p className="text-[9px] uppercase tracking-wider text-slate-400">CGST</p><p className="mt-1 text-xs font-bold">{formatCurrency(gstPreview.cgstAmount)}</p></div>
                                        <div><p className="text-[9px] uppercase tracking-wider text-slate-400">SGST / IGST</p><p className="mt-1 text-xs font-bold">{formatCurrency(gstPreview.sgstAmount + gstPreview.igstAmount)}</p></div>
                                        <div><p className="text-[9px] uppercase tracking-wider text-blue-300">Grand Total</p><p className="mt-1 text-sm font-extrabold text-blue-200">{formatCurrency(gstPreview.grandTotal)}</p></div>
                                    </div>
                                </div>
                            </section>

                            {/* Assigned Employee & Notes */}
                            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.045)] sm:p-6">
                                <div className="mb-4 flex items-start gap-3 border-b border-slate-100 pb-3">
                                    <div>
                                        <h3 className="text-sm font-bold tracking-[-0.01em] text-slate-950">Assignment & Notes</h3>
                                        <p className="mt-0.5 text-[11px] text-slate-500">Account manager and contract terms.</p>
                                    </div>
                                </div>
                                <div className="grid gap-x-5 gap-y-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-[11px] font-bold text-slate-700">Assigned Employee</label>
                                        <select
                                            name="assignedEmployeeId"
                                            value={form.assignedEmployeeId}
                                            onChange={(event) => {
                                                const employeeId = event.target.value;
                                                const selectedEmp = employees.find((emp) => String(emp.id) === String(employeeId));
                                                onFormUpdate((cur) => ({
                                                    ...cur,
                                                    assignedEmployeeId: employeeId,
                                                    assignedEmployeeCode: selectedEmp?.employeeCode || "",
                                                    assignedEmployeeName: selectedEmp?.name || "",
                                                }));
                                            }}
                                            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                        >
                                            <option value="">Keep unassigned</option>
                                            {employees.map((employee) => (
                                                <option
                                                    key={employee.id}
                                                    value={employee.id}
                                                    disabled={employee.status === "Leave" || employee.status === "Inactive"}
                                                >
                                                    {employee.name}
                                                    {employee.employeeCode ? ` (${employee.employeeCode})` : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-[11px] font-bold text-slate-700">Contract Notes</label>
                                        <textarea
                                            name="notes"
                                            value={form.notes}
                                            onChange={onFormChange}
                                            rows={3}
                                            placeholder="Add notes, special terms, or SLA details..."
                                            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Error notification */}
                            {error && (
                                <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 shadow-sm">
                                    <AlertCircle size={17} className="mt-0.5 shrink-0 text-rose-600" />
                                    <div>
                                        <p className="text-xs font-semibold text-rose-800">Unable to update AMC contract</p>
                                        <p className="mt-1 text-xs text-rose-700">{error}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-6 text-xs font-bold text-white shadow-[0_10px_24px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(37,99,235,0.34)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Pencil size={15} />
                            {saving ? "Saving Changes..." : "Save AMC Contract"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function AmcBilling() {
    const [invoiceRecord, setInvoiceRecord] = useState(null);
    const [reminderRecord, setReminderRecord] = useState(null);
    const [savingReminder, setSavingReminder] = useState(false);
    const [historyInvoiceRecord, setHistoryInvoiceRecord] = useState(null);
    const [newAmcOpen, setNewAmcOpen] = useState(false);
    const [newAmcForm, setNewAmcForm] = useState(emptyNewAmcForm);
    const [ownInvoiceFile, setOwnInvoiceFile] = useState(null);
    const [newAmcError, setNewAmcError] = useState("");
    const [editAmcOpen, setEditAmcOpen] = useState(false);
    const [editAmcRecord, setEditAmcRecord] = useState(null);
    const [editAmcForm, setEditAmcForm] = useState(emptyNewAmcForm);
    const [editAmcError, setEditAmcError] = useState("");
    const [savingEditAmc, setSavingEditAmc] = useState(false);
    const [deletingAmcId, setDeletingAmcId] = useState(null);
    const [records, setRecords] = useState([]);
    const [clients, setClients] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [backendStats, setBackendStats] = useState({
        totalCollected: 0,
        totalPending: 0,
        overdueCount: 0,
        upcomingCount: 0,
    });
    const [recordsLoading, setRecordsLoading] = useState(true);
    const [mastersLoading, setMastersLoading] = useState(true);
    const [savingAmc, setSavingAmc] = useState(false);
    const [savingPayment, setSavingPayment] = useState(false);
    const [recordsError, setRecordsError] = useState("");
    const [mastersError, setMastersError] = useState("");
    const [searchValue, setSearchValue] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [productFilter, setProductFilter] = useState("All");
    const [planFilter, setPlanFilter] = useState("All");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [activeSummary, setActiveSummary] = useState("All");
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [selectedInvoiceDetail, setSelectedInvoiceDetail] =
        useState(null);

    const [invoiceDetailLoading, setInvoiceDetailLoading] =
        useState(false);

    const [invoiceDetailError, setInvoiceDetailError] =
        useState("");
    const [selectedClientGroup, setSelectedClientGroup] =
        useState(null);
    const [paymentRecord, setPaymentRecord] = useState(null);
    const [renewalRecord, setRenewalRecord] = useState(null);
    const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
    const [renewalForm, setRenewalForm] = useState(emptyRenewalForm);
    const [formError, setFormError] = useState("");
    const [activeTab, setActiveTab] = useState("Overview");
    const [localDocuments, setLocalDocuments] = useState({});
    const [documentType, setDocumentType] = useState("AMC Agreement");
    const [documentError, setDocumentError] = useState("");
    const [uploadingDocument, setUploadingDocument] = useState(false);
    const [amcMainTab, setAmcMainTab] = useState("contracts");
    const [adminAmcRequests, setAdminAmcRequests] = useState([]);
    const [adminRequestsLoading, setAdminRequestsLoading] = useState(false);
    const [adminRequestsError, setAdminRequestsError] = useState("");

    const loadAdminAmcRequests = async () => {
        try {
            setAdminRequestsLoading(true);
            setAdminRequestsError("");
            const token = getAuthToken();
            if (!token) return;
            const res = await fetch(`${API_URL}/api/admin/amc-requests`, {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            const result = await res.json();
            if (!res.ok || !result.success) {
                throw new Error(result.message || "Failed to load AMC requests.");
            }
            setAdminAmcRequests(Array.isArray(result.data) ? result.data : []);
        } catch (err) {
            setAdminRequestsError(err.message || "Network error loading AMC requests.");
        } finally {
            setAdminRequestsLoading(false);
        }
    };

    const pendingAmcRequestsCount = useMemo(() => {
        return adminAmcRequests.filter((r) =>
            ["Submitted", "Under Review"].includes(r.status)
        ).length;
    }, [adminAmcRequests]);

    const handleOpenAmcContractFromRequest = (contractId, contractCode) => {
        const found = records.find(
            (r) =>
                r.id === contractId ||
                r._id === contractId ||
                r.contractCode === contractCode
        );
        if (found) {
            setAmcMainTab("contracts");
            setSelectedRecord(found);
        } else {
            setAmcMainTab("contracts");
            setSearchValue(contractCode || "");
        }
    };

    const handleGoToAmcRenewalFromRequest = (contractId, contractCode) => {
        const found = records.find(
            (r) =>
                r.id === contractId ||
                r._id === contractId ||
                r.contractCode === contractCode
        );
        if (found) {
            setAmcMainTab("contracts");
            setSelectedRecord(found);
            openRenewalModal(found);
        } else {
            setAmcMainTab("contracts");
            setSearchValue(contractCode || "");
        }
    };

    const createAmcTimelineEvent = ({
        type,
        title,
        description,
        user = "Mangesh Kondhare",
    }) => ({
        id: `${Date.now()}-${Math.random()}`,
        type,
        title,
        description,
        user,
        time: new Date().toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }),
    });

    const loadClients = async () => {
        const token = getAuthToken();
        if (!token) {
            throw new Error(
                "Login token was not found. Please login again."
            );
        }
        const response = await fetch(
            `${API_URL}/api/admin/clients`,
            {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(
                result.message ||
                "Unable to load clients."
            );
        }
        const normalizedClients = Array.isArray(result.data)
            ? result.data
                .map(normalizeClientFromApi)
                .filter(
                    (client) =>
                        client.id &&
                        client.companyName
                )
                .sort((a, b) =>
                    a.companyName.localeCompare(
                        b.companyName
                    )
                )
            : [];
        setClients(normalizedClients);
    };

    const loadEmployees = async () => {
        const token = getAuthToken();
        if (!token) {
            throw new Error(
                "Login token was not found. Please login again."
            );
        }
        const response = await fetch(
            `${API_URL}/api/employee/employees`,
            {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        const result = await response.json();
        if (response.status === 401) {
            throw new Error(
                "Your login session has expired. Please login again."
            );
        }
        if (!response.ok || !result.success) {
            throw new Error(
                result.message ||
                "Unable to load employees."
            );
        }
        const normalizedEmployees = Array.isArray(result.data)
            ? result.data
                .map(normalizeEmployeeFromApi)
                .filter(
                    (employee) =>
                        employee.id &&
                        employee.name &&
                        employee.isActive
                )
                .sort((a, b) =>
                    a.name.localeCompare(
                        b.name
                    )
                )
            : [];
        setEmployees(normalizedEmployees);
    };

    const loadAmcContracts = async () => {
        try {
            setRecordsLoading(true);
            setRecordsError("");
            const token = getAuthToken();
            if (!token) {
                throw new Error(
                    "Login token was not found. Please login again."
                );
            }
            const response = await fetch(
                `${API_URL}/api/admin/amc/contracts?limit=500`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const result = await response.json();
            if (response.status === 401) {
                throw new Error(
                    "Your login session has expired. Please login again."
                );
            }
            if (!response.ok || result.success !== true) {
                throw new Error(
                    result.message ||
                    "Unable to load AMC contracts."
                );
            }
            const normalizedRecords = Array.isArray(result.data)
                ? result.data.map(
                    normalizeAmcContractFromApi
                )
                : [];
            setRecords(normalizedRecords);
            setBackendStats({
                totalCollected: Number(
                    result.stats
                        ?.totalCollected ||
                    0
                ),
                totalPending: Number(
                    result.stats
                        ?.totalPending ||
                    0
                ),
                overdueCount: Number(
                    result.stats
                        ?.overdueCount ||
                    0
                ),
                upcomingCount: Number(
                    result.stats
                        ?.upcomingCount ||
                    0
                ),
            });
        } catch (error) {
            console.error(
                "Load AMC contracts error:",
                error
            );
            setRecords([]);
            setBackendStats({
                totalCollected: 0,
                totalPending: 0,
                overdueCount: 0,
                upcomingCount: 0,
            });
            setRecordsError(
                error.message ||
                "Unable to load AMC contracts."
            );
        } finally {
            setRecordsLoading(false);
        }
    };

    const loadAmcMasters = async () => {
        try {
            setMastersLoading(true);
            setMastersError("");
            await Promise.all([
                loadClients(),
                loadEmployees(),
            ]);
        } catch (error) {
            console.error(
                "Load AMC masters error:",
                error
            );
            setMastersError(
                error.message ||
                "Unable to load AMC masters."
            );
        } finally {
            setMastersLoading(false);
        }
    };

    useEffect(() => {
        loadAmcContracts();
        loadAmcMasters();
        loadAdminAmcRequests();
    }, []);

    const stats = backendStats;

    const selectedNewAmcClient =
        clients.find(
            (client) =>
                String(client.id) ===
                String(newAmcForm.clientId)
        ) || null;

    const availableClientProducts =
        selectedNewAmcClient
            ? selectedNewAmcClient.products.filter(
                (product) =>
                    product.clientProductId &&
                    product.productId &&
                    product.productName &&
                    product.installationStatus !==
                    "Inactive"
            )
            : [];

    const selectedNewAmcProduct =
        availableClientProducts.find(
            (product) =>
                String(
                    product.clientProductId
                ) ===
                String(
                    newAmcForm.clientProductId
                )
        ) || null;

    const productFilterOptions =
        [
            "All",
            ...new Set(
                records
                    .map(
                        (record) =>
                            record.product
                    )
                    .filter(Boolean)
            ),
        ];

    const filteredRecords = useMemo(() => {
        return records.filter((record) => {
            const search = searchValue.trim().toLowerCase();
            const matchesSearch =
                !search ||
                [
                    record.contractNo,
                    record.clientCode,
                    record.client,
                    record.contactPerson,
                    record.mobile,
                    record.product,
                    record.invoiceNo,
                    record.assignedTo,
                ].some((value) =>
                    String(value || "")
                        .toLowerCase()
                        .includes(search)
                );
            const matchesStatus =
                statusFilter === "All" || record.status === statusFilter;
            const matchesProduct =
                productFilter === "All" || record.product === productFilter;
            const matchesPlan =
                planFilter === "All" || record.plan === planFilter;
            const matchesSummary =
                activeSummary === "All" ||
                (activeSummary === "Collected" && record.paidAmount > 0) ||
                (activeSummary === "Pending" && record.pendingAmount > 0) ||
                (activeSummary === "Overdue" && record.status === "Overdue") ||
                (activeSummary === "Upcoming" &&
                    ["Upcoming", "Pending", "Partially Paid"].includes(record.status));
            return (
                matchesSearch &&
                matchesStatus &&
                matchesProduct &&
                matchesPlan &&
                matchesSummary
            );
        });
    }, [
        records,
        searchValue,
        statusFilter,
        productFilter,
        planFilter,
        activeSummary,
    ]);

    const groupedClients =
        useMemo(() => {
            const clientMap =
                new Map();

            filteredRecords.forEach(
                (record) => {
                    const key =
                        String(
                            record.clientId ||
                            record.clientCode ||
                            record.client ||
                            ""
                        );

                    if (!key) {
                        return;
                    }

                    if (
                        !clientMap.has(
                            key
                        )
                    ) {
                        clientMap.set(
                            key,
                            {
                                key,

                                clientId:
                                    record.clientId ||
                                    "",

                                clientCode:
                                    record.clientCode ||
                                    "",

                                clientName:
                                    record.client ||
                                    record.clientName ||
                                    "Unknown Client",

                                contactPerson:
                                    record.contactPerson ||
                                    "",

                                mobile:
                                    record.mobile ||
                                    "",

                                records:
                                    [],

                                productIds:
                                    new Set(),

                                invoiceIds:
                                    new Set(),

                                totalAmount:
                                    0,

                                paidAmount:
                                    0,

                                pendingAmount:
                                    0,

                                overdueCount:
                                    0,

                                upcomingCount:
                                    0,

                                nextRenewalDate:
                                    null,
                            }
                        );
                    }

                    const group =
                        clientMap.get(
                            key
                        );

                    group.records.push(
                        record
                    );

                    if (
                        record.clientProductId ||
                        record.productId ||
                        record.product
                    ) {
                        group.productIds.add(
                            String(
                                record.clientProductId ||
                                record.productId ||
                                record.product
                            )
                        );
                    }

                    if (
                        record.currentInvoiceId ||
                        record.invoiceNo ||
                        record.id
                    ) {
                        group.invoiceIds.add(
                            String(
                                record.currentInvoiceId ||
                                record.invoiceNo ||
                                record.id
                            )
                        );
                    }

                    group.totalAmount +=
                        Number(
                            record.totalAmount ??
                            record.amount ??
                            0
                        );

                    group.paidAmount +=
                        Number(
                            record.paidAmount ||
                            0
                        );

                    group.pendingAmount +=
                        Number(
                            record.pendingAmount ??
                            Math.max(
                                Number(
                                    record.totalAmount ||
                                    record.amount ||
                                    0
                                ) -
                                Number(
                                    record.paidAmount ||
                                    0
                                ),
                                0
                            )
                        );

                    if (
                        record.status ===
                        "Overdue"
                    ) {
                        group.overdueCount++;
                    }

                    if (
                        [
                            "Upcoming",
                            "Pending",
                            "Partially Paid",
                        ].includes(
                            record.status
                        )
                    ) {
                        group.upcomingCount++;
                    }

                    /*
        * NEXT RENEWAL
        *
        * Only future/current AMC expiry dates
        * should be considered.
        *
        * Historical expired AMC periods must
        * never become "Next Renewal".
        */

                    const renewalDate =
                        record.expiryDateValue ||
                        "";

                    if (renewalDate) {
                        const renewal =
                            new Date(
                                `${renewalDate}T00:00:00`
                            );

                        const today =
                            new Date();

                        today.setHours(
                            0,
                            0,
                            0,
                            0
                        );

                        if (
                            !Number.isNaN(
                                renewal.getTime()
                            ) &&
                            renewal >= today &&
                            (
                                !group.nextRenewalDate ||
                                renewal <
                                group.nextRenewalDate
                            )
                        ) {
                            group.nextRenewalDate =
                                renewal;
                        }
                    }
                }
            );

            return Array.from(
                clientMap.values()
            )
                .map(
                    (group) => ({
                        ...group,

                        productCount:
                            group.productIds
                                .size,

                        invoiceCount:
                            group.invoiceIds
                                .size,

                        nextRenewal:
                            group.nextRenewalDate
                                ? group.nextRenewalDate.toLocaleDateString(
                                    "en-GB",
                                    {
                                        day:
                                            "2-digit",

                                        month:
                                            "short",

                                        year:
                                            "numeric",
                                    }
                                )
                                : "—",
                    })
                )
                .sort(
                    (
                        first,
                        second
                    ) =>
                        second.pendingAmount -
                        first.pendingAmount ||
                        first.clientName.localeCompare(
                            second.clientName
                        )
                );
        }, [
            filteredRecords,
        ]);
    const selectedClientRecords =
        useMemo(() => {
            if (
                !selectedClientGroup
            ) {
                return [];
            }

            return filteredRecords.filter(
                (record) =>
                    String(
                        record.clientId ||
                        record.clientCode ||
                        record.client ||
                        ""
                    ) ===
                    String(
                        selectedClientGroup.key
                    )
            );
        }, [
            filteredRecords,
            selectedClientGroup,
        ]);

    const selectedClientProducts =
        useMemo(() => {
            const map =
                new Map();

            selectedClientRecords.forEach(
                (record) => {
                    const key =
                        String(
                            record.clientProductId ||
                            record.productId ||
                            record.product ||
                            ""
                        );

                    if (
                        !map.has(
                            key
                        )
                    ) {
                        map.set(
                            key,
                            {
                                key,

                                product:
                                    record.product ||
                                    "Unknown Product",

                                productCode:
                                    record.productCode ||
                                    "",

                                version:
                                    record.version ||
                                    "",

                                plan:
                                    record.plan ||
                                    "Standard",

                                users:
                                    record.users ||
                                    1,

                                records:
                                    [],
                            }
                        );
                    }

                    map.get(
                        key
                    ).records.push(
                        record
                    );
                }
            );

            return Array.from(
                map.values()
            );
        }, [
            selectedClientRecords,
        ]);
    const clearFilters = () => {
        setSearchValue("");
        setStatusFilter("All");
        setProductFilter("All");
        setPlanFilter("All");
        setActiveSummary("All");
    };
    const handleOpenAmcInvoiceDetail =
        async (record) => {
            const contractId =
                record.mongoId ||
                record.id ||
                "";

            const targetInvoiceId =
                String(
                    record.currentInvoiceId ||
                    record.amcInvoiceId ||
                    ""
                );

            const targetInvoiceCode =
                record.invoiceCode ||
                record.invoiceNo ||
                "";

            if (!contractId) {
                alert(
                    "AMC contract ID was not found."
                );

                return;
            }

            try {
                setInvoiceDetailLoading(
                    true
                );

                setInvoiceDetailError(
                    ""
                );

                const token =
                    getAuthToken();

                if (!token) {
                    throw new Error(
                        "Login token was not found. Please login again."
                    );
                }

                const response =
                    await fetch(
                        `${API_URL}/api/admin/amc/contract/${contractId}`,
                        {
                            method:
                                "GET",

                            headers: {
                                Accept:
                                    "application/json",

                                Authorization:
                                    `Bearer ${token}`,
                            },
                        }
                    );

                const result =
                    await response.json();

                if (
                    response.status ===
                    401
                ) {
                    throw new Error(
                        "Your login session has expired. Please login again."
                    );
                }

                if (
                    !response.ok ||
                    result.success !==
                    true
                ) {
                    throw new Error(
                        result.message ||
                        "Unable to load AMC invoice details."
                    );
                }

                const contract =
                    result.data ||
                    {};

                const invoices =
                    Array.isArray(
                        contract.invoiceHistory
                    )
                        ? contract.invoiceHistory
                        : Array.isArray(
                            contract.invoices
                        )
                            ? contract.invoices
                            : [];

                let selectedInvoice =
                    null;

                if (
                    targetInvoiceId
                ) {
                    selectedInvoice =
                        invoices.find(
                            (invoice) =>
                                String(
                                    invoice._id ||
                                    invoice.id ||
                                    ""
                                ) ===
                                targetInvoiceId
                        ) ||
                        null;
                }

                if (
                    !selectedInvoice &&
                    targetInvoiceCode
                ) {
                    selectedInvoice =
                        invoices.find(
                            (invoice) =>
                                String(
                                    invoice.invoiceCode ||
                                    invoice.invoiceNo ||
                                    ""
                                ) ===
                                String(
                                    targetInvoiceCode
                                )
                        ) ||
                        null;
                }

                if (
                    !selectedInvoice
                ) {
                    selectedInvoice =
                        contract.currentInvoice ||
                        contract.invoice ||
                        invoices[0] ||
                        null;
                }

                if (
                    !selectedInvoice
                ) {
                    throw new Error(
                        "AMC invoice was not found."
                    );
                }

                const normalizedInvoice =
                    normalizeAmcInvoiceDetail(
                        selectedInvoice,
                        contract
                    );

                const normalizedHistory =
                    invoices.map(
                        (invoice) =>
                            normalizeAmcInvoiceDetail(
                                invoice,
                                contract
                            )
                    );

                setSelectedInvoiceDetail({
                    ...normalizedInvoice,

                    invoiceHistory:
                        normalizedHistory,
                });
            } catch (
            error
            ) {
                console.error(
                    "Load AMC invoice detail error:",
                    error
                );

                setInvoiceDetailError(
                    error.message ||
                    "Unable to load AMC invoice."
                );

                alert(
                    error.message ||
                    "Unable to load AMC invoice."
                );
            } finally {
                setInvoiceDetailLoading(
                    false
                );
            }
        };

    const openPaymentModal = (record) => {
        setPaymentRecord(record);
        setFormError("");
        setPaymentForm({
            ...emptyPaymentForm,
            amount: String(record.pendingAmount || ""),
            paymentDate: new Date().toISOString().slice(0, 10),
        });
    };

    const closePaymentModal = () => {
        setPaymentRecord(null);
        setPaymentForm(emptyPaymentForm);
        setFormError("");
    };

    const handlePaymentChange = (event) => {
        const { name, value } = event.target;
        setPaymentForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleRecordPayment =
        async (event) => {
            event.preventDefault();
            if (!paymentRecord || savingPayment) {
                return;
            }
            const amount = Number(paymentForm.amount);
            if (!Number.isFinite(amount) || amount <= 0) {
                setFormError("Enter a valid payment amount.");
                return;
            }
            if (amount > Number(paymentRecord.pendingAmount || 0)) {
                setFormError(
                    `Payment cannot exceed ${formatCurrency(
                        paymentRecord.pendingAmount
                    )}.`
                );
                return;
            }
            if (!paymentForm.paymentDate) {
                setFormError("Please select the payment date.");
                return;
            }
            const referenceRequiredModes = [
                "Bank Transfer",
                "UPI",
                "Cheque",
                "Card",
            ];
            if (
                referenceRequiredModes.includes(
                    paymentForm.mode
                ) &&
                !paymentForm.referenceNo.trim()
            ) {
                setFormError(
                    `Reference number is required for ${paymentForm.mode}.`
                );
                return;
            }
            const invoiceId =
                paymentRecord.currentInvoiceId ||
                paymentRecord.amcInvoiceId ||
                "";
            const contractId =
                paymentRecord.mongoId ||
                paymentRecord.id ||
                "";
            if (!invoiceId && !contractId) {
                setFormError(
                    "AMC invoice or contract ID was not found."
                );
                return;
            }
            try {
                setSavingPayment(true);
                setFormError("");
                const token = getAuthToken();
                if (!token) {
                    throw new Error(
                        "Login token was not found. Please login again."
                    );
                }
                const response = await fetch(
                    `${API_URL}/api/admin/amc/payment`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            amcInvoiceId: invoiceId,
                            amcContractId: contractId,
                            amount,
                            paymentDate: paymentForm.paymentDate,
                            mode: paymentForm.mode,
                            referenceNo: paymentForm.referenceNo.trim(),
                            notes: paymentForm.notes.trim(),
                        }),
                    }
                );
                let result = {};
                try {
                    result = await response.json();
                } catch {
                    throw new Error(
                        "Invalid response received from server."
                    );
                }
                if (response.status === 401) {
                    throw new Error(
                        "Your login session has expired. Please login again."
                    );
                }
                if (!response.ok || result.success !== true) {
                    throw new Error(
                        result.message ||
                        "Unable to record AMC payment."
                    );
                }
                const responseContract =
                    result.data?.contract ||
                    result.contract;
                const responsePayment =
                    result.data?.payment ||
                    result.payment;
                if (!responseContract) {
                    throw new Error(
                        "Updated AMC contract was not returned by server."
                    );
                }
                const normalizedContract =
                    normalizeAmcContractFromApi(
                        responseContract
                    );
                const normalizedPayment = {
                    id: responsePayment?._id ||
                        responsePayment?.id ||
                        `${Date.now()}`,
                    paymentCode: responsePayment?.paymentCode || "",
                    amcInvoiceId: responsePayment?.amcInvoiceId || invoiceId,
                    date: responsePayment?.paymentDate
                        ? new Date(
                            responsePayment.paymentDate
                        ).toLocaleDateString(
                            "en-GB",
                            {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                            }
                        )
                        : new Date(
                            `${paymentForm.paymentDate}T00:00:00`
                        ).toLocaleDateString(
                            "en-GB",
                            {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                            }
                        ),
                    paymentDate: responsePayment?.paymentDate ||
                        paymentForm.paymentDate,
                    amount: Number(
                        responsePayment?.amount ||
                        amount
                    ),
                    mode: responsePayment?.mode ||
                        paymentForm.mode,
                    referenceNo: responsePayment?.referenceNo ||
                        paymentForm.referenceNo.trim() ||
                        "—",
                    notes: responsePayment?.notes ||
                        paymentForm.notes.trim(),
                    receivedBy: responsePayment?.receivedByName ||
                        "Admin",
                };
                const finalRecord = {
                    ...paymentRecord,
                    ...normalizedContract,
                    paymentHistory: [
                        ...(
                            paymentRecord.paymentHistory ||
                            []
                        ),
                        normalizedPayment,
                    ],
                };
                setRecords(
                    (current) =>
                        current.map(
                            (record) =>
                                record.id ===
                                    paymentRecord.id
                                    ? finalRecord
                                    : record
                        )
                );
                setSelectedRecord(
                    (current) =>
                        current?.id ===
                            paymentRecord.id
                            ? {
                                ...current,
                                ...finalRecord,
                            }
                            : current
                );
                setInvoiceRecord(
                    (current) =>
                        current?.id ===
                            paymentRecord.id
                            ? {
                                ...current,
                                ...finalRecord,
                            }
                            : current
                );
                closePaymentModal();
                await loadAmcContracts();
                alert(
                    result.message ||
                    "AMC payment recorded successfully."
                );
            } catch (error) {
                console.error(
                    "Record AMC payment error:",
                    error
                );
                setFormError(
                    error.message ||
                    "Unable to record AMC payment."
                );
            } finally {
                setSavingPayment(false);
            }
        };

    const openRenewalModal = (record) => {
        if (!record) {
            return;
        }

        const isCancelled = record.status === "Cancelled" || record.isDeleted === true;
        if (isCancelled) {
            alert("Cancelled AMC contracts cannot be renewed.");
            return;
        }

        if (record.isCurrent === false) {
            alert("Only the current AMC cycle can be renewed.");
            return;
        }

        const pendingAmount = Number(record.pendingAmount || 0);

        if (pendingAmount > 0) {
            const confirmed = window.confirm(
                `This AMC still has ${formatCurrency(
                    pendingAmount
                )} outstanding.\n\n` +
                `Renewal will create a NEW AMC invoice. ` +
                `The old pending amount will remain against this invoice.\n\n` +
                `Do you want to continue?`
            );

            if (!confirmed) {
                return;
            }
        }

        let startDate = "";
        let defaultExpiryDate = "";
        let defaultDueDate = "";

        if (record.expiryDate) {
            const expiry = new Date(record.expiryDate);
            if (!Number.isNaN(expiry.getTime())) {
                const nextStart = new Date(expiry);
                nextStart.setDate(nextStart.getDate() + 1);
                startDate = nextStart.toISOString().slice(0, 10);

                const nextEnd = new Date(nextStart);
                nextEnd.setFullYear(nextEnd.getFullYear() + 1);
                nextEnd.setDate(nextEnd.getDate() - 1);
                defaultExpiryDate = nextEnd.toISOString().slice(0, 10);
                defaultDueDate = startDate;
            }
        }

        if (!startDate) {
            const today = new Date();
            startDate = today.toISOString().slice(0, 10);
            const nextEnd = new Date(today);
            nextEnd.setFullYear(nextEnd.getFullYear() + 1);
            nextEnd.setDate(nextEnd.getDate() - 1);
            defaultExpiryDate = nextEnd.toISOString().slice(0, 10);
            defaultDueDate = startDate;
        }

        setRenewalRecord(record);
        setFormError("");
        setRenewalForm({
            amount: String(
                record.taxableAmount ||
                record.amount ||
                record.totalAmount ||
                ""
            ),
            startDate,
            expiryDate: defaultExpiryDate,
            dueDate: defaultDueDate,
            plan: record.plan || "Standard",
            notes: "",
        });
    };

    const closeRenewalModal = () => {
        setRenewalRecord(null);
        setRenewalForm(emptyRenewalForm);
        setFormError("");
    };

    const handleRenewalChange = (event) => {
        const { name, value } = event.target;
        setRenewalForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleGenerateRenewal =
        async (event) => {
            event.preventDefault();

            if (
                !renewalRecord ||
                savingAmc
            ) {
                return;
            }

            if (
                !renewalForm.amount ||
                !renewalForm.startDate ||
                !renewalForm.expiryDate ||
                !renewalForm.dueDate
            ) {
                setFormError(
                    "Please complete all required renewal fields."
                );

                return;
            }

            const amount =
                Number(
                    renewalForm.amount
                );

            if (
                !Number.isFinite(
                    amount
                ) ||
                amount <= 0
            ) {
                setFormError(
                    "Please enter a valid AMC taxable amount."
                );

                return;
            }

            const contractId =
                renewalRecord.mongoId ||
                renewalRecord.id;

            if (
                !contractId
            ) {
                setFormError(
                    "AMC contract ID was not found."
                );

                return;
            }

            try {
                setSavingAmc(
                    true
                );

                setFormError(
                    ""
                );

                const token =
                    getAuthToken();

                if (
                    !token
                ) {
                    throw new Error(
                        "Login token was not found. Please login again."
                    );
                }

                /*
                * IMPORTANT:
                *
                * renewalForm.amount is currently the AMC
                * taxable/basic amount used by the renewal form.
                *
                * Backend will calculate GST and final invoice total.
                */
                const response =
                    await fetch(
                        `${API_URL}/api/admin/amc/contract/${contractId}/renew`,
                        {
                            method:
                                "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Accept:
                                    "application/json",

                                Authorization:
                                    `Bearer ${token}`,
                            },

                            body:
                                JSON.stringify({
                                    startDate:
                                        renewalForm.startDate,

                                    expiryDate:
                                        renewalForm.expiryDate,

                                    dueDate:
                                        renewalForm.dueDate,

                                    taxableAmount:
                                        amount,

                                    plan:
                                        renewalForm.plan,

                                    licensedUsers:
                                        renewalRecord.licensedUsers ||
                                        renewalRecord.users ||
                                        1,

                                    /*
                                    * Keep the same GST structure
                                    * as the current AMC unless you
                                    * later add GST controls to the
                                    * renewal modal.
                                    */
                                    cgstRate:
                                        Number(
                                            renewalRecord.cgstRate ||
                                            0
                                        ),

                                    sgstRate:
                                        Number(
                                            renewalRecord.sgstRate ||
                                            0
                                        ),

                                    igstRate:
                                        Number(
                                            renewalRecord.igstRate ||
                                            0
                                        ),

                                    notes:
                                        renewalForm.notes.trim(),
                                }),
                        }
                    );

                let result =
                    {};

                try {
                    result =
                        await response.json();
                } catch {
                    throw new Error(
                        "Invalid response received from server."
                    );
                }

                if (
                    response.status ===
                    401
                ) {
                    throw new Error(
                        "Your login session has expired. Please login again."
                    );
                }

                if (
                    response.status ===
                    409
                ) {
                    throw new Error(
                        result.message ||
                        "AMC renewal already exists for this period."
                    );
                }

                if (
                    !response.ok ||
                    result.success !==
                    true
                ) {
                    throw new Error(
                        result.message ||
                        "Unable to renew AMC contract."
                    );
                }

                /*
                * Backend returns the renewed contract
                * already connected to the NEW invoice.
                */
                const backendContract =
                    result.data?.contract ||
                    result.contract;

                if (
                    !backendContract
                ) {
                    throw new Error(
                        "AMC was renewed, but the updated contract was not returned."
                    );
                }

                const updatedRecord =
                    normalizeAmcContractFromApi(
                        backendContract
                    );

                /*
                * Update current frontend state immediately.
                */
                setRecords(
                    (current) =>
                        current.map(
                            (record) =>
                                record.id ===
                                    renewalRecord.id
                                    ? updatedRecord
                                    : record
                        )
                );

                setSelectedRecord(
                    (current) =>
                        current?.id ===
                            renewalRecord.id
                            ? updatedRecord
                            : current
                );

                setInvoiceRecord(
                    (current) =>
                        current?.id ===
                            renewalRecord.id
                            ? updatedRecord
                            : current
                );
                /*
                * Keep the renewed contract because
                * the backend has now connected it
                * with the NEW current invoice.
                */
                closeRenewalModal();

                /*
                * Reload AMC list from MongoDB.
                */
                await loadAmcContracts();

                /*
                * Close the old invoice detail first.
                */
                setSelectedInvoiceDetail(
                    null
                );

                /*
                * Open the NEW current invoice created
                * by the renewal endpoint.
                */
                await handleOpenAmcInvoiceDetail(
                    updatedRecord
                );

                alert(
                    result.message ||
                    "AMC renewed successfully and the new invoice has been generated."
                );
            } catch (
            error
            ) {
                console.error(
                    "Renew AMC error:",
                    error
                );

                setFormError(
                    error.message ||
                    "Unable to renew AMC contract."
                );
            } finally {
                setSavingAmc(
                    false
                );
            }
        };

    const handleSendReminder = (record) => {
        setReminderRecord(record);
    };

    const deriveGstRates = (form) => {
        if (form.gstApplicable !== "YES") {
            return { cgstRate: 0, sgstRate: 0, igstRate: 0, effectiveRate: 0 };
        }

        const selectedRate =
            form.gstRate === "CUSTOM"
                ? Number(form.customGstRate || 0)
                : Number(form.gstRate || 0);
        const effectiveRate = Number.isFinite(selectedRate) && selectedRate >= 0
            ? selectedRate
            : 0;

        if (form.taxType === "IGST") {
            return { cgstRate: 0, sgstRate: 0, igstRate: effectiveRate, effectiveRate };
        }

        const halfRate = effectiveRate / 2;
        return {
            cgstRate: halfRate,
            sgstRate: halfRate,
            igstRate: 0,
            effectiveRate,
        };
    };

    const gstPreview = useMemo(() => {
        const taxableAmount = Math.max(Number(newAmcForm.taxableAmount || 0), 0);
        const rates = deriveGstRates(newAmcForm);
        const cgstAmount = taxableAmount * (rates.cgstRate / 100);
        const sgstAmount = taxableAmount * (rates.sgstRate / 100);
        const igstAmount = taxableAmount * (rates.igstRate / 100);
        const totalTaxAmount = cgstAmount + sgstAmount + igstAmount;

        return {
            ...rates,
            taxableAmount,
            cgstAmount,
            sgstAmount,
            igstAmount,
            totalTaxAmount,
            grandTotal: taxableAmount + totalTaxAmount,
        };
    }, [newAmcForm]);

    const editGstPreview = useMemo(() => {
        const taxableAmount = Math.max(Number(editAmcForm.taxableAmount || 0), 0);
        const rates = deriveGstRates(editAmcForm);
        const cgstAmount = taxableAmount * (rates.cgstRate / 100);
        const sgstAmount = taxableAmount * (rates.sgstRate / 100);
        const igstAmount = taxableAmount * (rates.igstRate / 100);
        const totalTaxAmount = cgstAmount + sgstAmount + igstAmount;

        return {
            ...rates,
            taxableAmount,
            cgstAmount,
            sgstAmount,
            igstAmount,
            totalTaxAmount,
            grandTotal: taxableAmount + totalTaxAmount,
        };
    }, [editAmcForm]);

    const handleNewAmcChange = (event) => {
        const { name, value } = event.target;
        setNewAmcForm((current) => {
            const next = { ...current, [name]: value };

            if (name === "gstApplicable" && value === "NO") {
                next.cgstRate = "0";
                next.sgstRate = "0";
                next.igstRate = "0";
            }

            return next;
        });
        if (newAmcError) {
            setNewAmcError("");
        }
    };

    const handleOwnInvoiceFileChange = (event) => {
        const file = event.target.files?.[0] || null;
        if (!file) return;

        const allowedTypes = [
            "application/pdf",
            "image/jpeg",
            "image/png",
        ];
        const extensionAllowed = /\.(pdf|jpe?g|png)$/i.test(file.name);

        if ((!allowedTypes.includes(file.type) && !extensionAllowed) || file.size > 10 * 1024 * 1024) {
            setOwnInvoiceFile(null);
            event.target.value = "";
            setNewAmcError("Upload a PDF, JPG, JPEG or PNG file up to 10 MB.");
            return;
        }

        setOwnInvoiceFile(file);
        setNewAmcError("");
    };

    const closeNewAmcDrawer = () => {
        setNewAmcOpen(false);
        setNewAmcForm(emptyNewAmcForm);
        setOwnInvoiceFile(null);
        setNewAmcError("");
    };

    const handleCreateAmcContract =
        async (event) => {
            event.preventDefault();
            if (!newAmcForm.clientId) {
                setNewAmcError("Please select a client.");
                return;
            }
            if (!newAmcForm.clientProductId) {
                setNewAmcError("Please select a client product.");
                return;
            }
            if (!newAmcForm.startDate) {
                setNewAmcError("Please select the AMC start date.");
                return;
            }
            if (!newAmcForm.expiryDate) {
                setNewAmcError("Please select the AMC expiry date.");
                return;
            }
            if (!newAmcForm.dueDate) {
                setNewAmcError("Please select the payment due date.");
                return;
            }
            const taxableAmount = Number(newAmcForm.taxableAmount);
            if (!taxableAmount || taxableAmount <= 0) {
                setNewAmcError("Please enter a valid AMC taxable amount.");
                return;
            }
            const licensedUsers = Number(newAmcForm.licensedUsers);
            if (newAmcForm.gstApplicable === "YES" && newAmcForm.gstRate === "CUSTOM") {
                const customRate = Number(newAmcForm.customGstRate);
                if (!Number.isFinite(customRate) || customRate < 0 || customRate > 100) {
                    setNewAmcError("Enter a valid custom GST rate between 0 and 100%.");
                    return;
                }
            }
            if (newAmcForm.invoiceSource === "UPLOAD" && !ownInvoiceFile) {
                setNewAmcError("Please choose the self-made invoice or receipt file.");
                return;
            }
            if (!licensedUsers || licensedUsers <= 0) {
                setNewAmcError("Please enter a valid licensed user count.");
                return;
            }
            try {
                setSavingAmc(true);
                setNewAmcError("");
                const response = await fetch(
                    `${API_URL}/api/admin/amc/contract`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${getAuthToken()}`,
                        },
                        body: JSON.stringify({
                            clientId: newAmcForm.clientId,
                            clientProductId: newAmcForm.clientProductId,
                            plan: newAmcForm.plan,
                            licensedUsers,
                            startDate: newAmcForm.startDate,
                            expiryDate: newAmcForm.expiryDate,
                            dueDate: newAmcForm.dueDate,
                            taxableAmount,
                            cgstRate: gstPreview.cgstRate,
                            sgstRate: gstPreview.sgstRate,
                            igstRate: gstPreview.igstRate,
                            assignedEmployeeId: newAmcForm.assignedEmployeeId || "",
                            notes: newAmcForm.notes.trim(),
                        }),
                    }
                );
                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(
                        result.message ||
                        "Unable to create AMC contract."
                    );
                }
                const createdContract =
                    result.data?.contract ||
                    result.data;

                const createdRecord =
                    normalizeAmcContractFromApi(
                        createdContract
                    );

                const contractId =
                    createdContract?._id ||
                    createdContract?.id ||
                    createdRecord.id;

                if (!contractId) {
                    throw new Error(
                        "AMC was created but contract ID was not returned."
                    );
                }

                /*
                * If user selected Upload Own Invoice,
                * save that actual file in backend documents.
                */
                if (
                    newAmcForm.invoiceSource ===
                    "UPLOAD" &&
                    ownInvoiceFile
                ) {
                    const formData =
                        new FormData();

                    formData.append(
                        "documentType",
                        "Own Invoice / Bill"
                    );

                    formData.append(
                        "documents",
                        ownInvoiceFile
                    );

                    const uploadResponse =
                        await fetch(
                            `${API_URL}/api/admin/amc/contract/${contractId}/documents`,
                            {
                                method: "POST",

                                headers: {
                                    Authorization:
                                        `Bearer ${getAuthToken()}`,
                                },

                                body:
                                    formData,
                            }
                        );

                    const uploadResult =
                        await uploadResponse.json();

                    if (
                        !uploadResponse.ok ||
                        !uploadResult.success
                    ) {
                        throw new Error(
                            uploadResult.message ||
                            "AMC created, but own invoice upload failed."
                        );
                    }
                }

                closeNewAmcDrawer();

                await loadAmcContracts();

                alert(
                    newAmcForm.invoiceSource ===
                        "UPLOAD"
                        ? "AMC contract and own invoice saved successfully."
                        : "AMC contract created successfully."
                );
            } catch (error) {
                console.error(
                    "Create AMC contract error:",
                    error
                );
                setNewAmcError(
                    error.message ||
                    "Unable to create AMC contract."
                );
            } finally {
                setSavingAmc(false);
            }
        };

    const handleOpenEditAmc = (record) => {
        if (!record) return;
        setEditAmcRecord(record);
        setEditAmcError("");

        const isIgst = Number(record.igstRate || 0) > 0;
        const effectiveRate = isIgst
            ? Number(record.igstRate || 0)
            : (Number(record.cgstRate || 0) + Number(record.sgstRate || 0));
        const isStandardRate = [18, 12, 5, 28, 0].includes(effectiveRate);

        const toInputDate = (d) => {
            if (!d) return "";
            if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
            const parsed = new Date(d);
            return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
        };

        setEditAmcForm({
            ...emptyNewAmcForm,
            id: record.mongoId || record.id || "",
            contractCode: record.contractCode || record.contractNo || "",
            clientId: record.clientId || "",
            clientCode: record.clientCode || "",
            clientName: record.client || record.clientName || "",
            contactPerson: record.contactPerson || "",
            contactMobile: record.contactMobile || record.mobile || "",
            contactEmail: record.contactEmail || "",
            clientProductId: record.clientProductId || "",
            productId: record.productId || "",
            productCode: record.productCode || "",
            productName: record.product || record.productName || "",
            productVersion: record.productVersion || record.version || "",
            plan: record.plan || "Standard",
            licensedUsers: String(record.licensedUsers || record.users || "1"),
            startDate: record.startDateValue || toInputDate(record.startDate),
            expiryDate: record.expiryDateValue || toInputDate(record.expiryDate),
            dueDate: record.dueDateValue || toInputDate(record.dueDate),
            taxableAmount: String(record.taxableAmount !== undefined ? record.taxableAmount : ""),
            status: record.status || "Pending",
            gstApplicable: (Number(record.totalTaxAmount || 0) > 0 || effectiveRate > 0) ? "YES" : "NO",
            gstRate: isStandardRate ? String(effectiveRate) : "CUSTOM",
            customGstRate: isStandardRate ? "" : String(effectiveRate),
            taxType: isIgst ? "IGST" : "CGST_SGST",
            cgstRate: String(record.cgstRate ?? 9),
            sgstRate: String(record.sgstRate ?? 9),
            igstRate: String(record.igstRate ?? 0),
            assignedEmployeeId: record.assignedEmployeeId || "",
            assignedEmployeeCode: record.assignedEmployeeCode || "",
            assignedEmployeeName: record.assignedEmployeeName || record.assignedTo || "",
            notes: record.notes || "",
        });
        setEditAmcOpen(true);
    };

    const closeEditAmcDrawer = () => {
        setEditAmcOpen(false);
        setEditAmcRecord(null);
        setEditAmcError("");
    };

    const handleEditAmcChange = (event) => {
        const { name, value } = event.target;
        setEditAmcForm((current) => {
            const next = { ...current, [name]: value };
            if (name === "gstApplicable" && value === "NO") {
                next.cgstRate = "0";
                next.sgstRate = "0";
                next.igstRate = "0";
            }
            return next;
        });
        if (editAmcError) {
            setEditAmcError("");
        }
    };

    const handleSaveEditAmc = async (event) => {
        event.preventDefault();
        if (!editAmcRecord) return;

        const contractId = editAmcRecord.mongoId || editAmcRecord.id;
        if (!contractId) {
            setEditAmcError("AMC contract ID is missing.");
            return;
        }

        if (!editAmcForm.startDate) {
            setEditAmcError("Please select the AMC start date.");
            return;
        }
        if (!editAmcForm.expiryDate) {
            setEditAmcError("Please select the AMC expiry date.");
            return;
        }
        if (!editAmcForm.dueDate) {
            setEditAmcError("Please select the payment due date.");
            return;
        }
        const taxableAmount = Number(editAmcForm.taxableAmount);
        if (!taxableAmount || taxableAmount <= 0) {
            setEditAmcError("Please enter a valid AMC taxable amount.");
            return;
        }
        const licensedUsers = Number(editAmcForm.licensedUsers);
        if (!licensedUsers || licensedUsers <= 0) {
            setEditAmcError("Please enter a valid licensed user count.");
            return;
        }
        if (editAmcForm.gstApplicable === "YES" && editAmcForm.gstRate === "CUSTOM") {
            const customRate = Number(editAmcForm.customGstRate);
            if (!Number.isFinite(customRate) || customRate < 0 || customRate > 100) {
                setEditAmcError("Enter a valid custom GST rate between 0 and 100%.");
                return;
            }
        }

        try {
            setSavingEditAmc(true);
            setEditAmcError("");

            const response = await fetch(`${API_URL}/api/admin/amc/contract/${contractId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getAuthToken()}`,
                },
                body: JSON.stringify({
                    plan: editAmcForm.plan,
                    licensedUsers,
                    startDate: editAmcForm.startDate,
                    expiryDate: editAmcForm.expiryDate,
                    dueDate: editAmcForm.dueDate,
                    taxableAmount,
                    cgstRate: editGstPreview.cgstRate,
                    sgstRate: editGstPreview.sgstRate,
                    igstRate: editGstPreview.igstRate,
                    assignedEmployeeId: editAmcForm.assignedEmployeeId || "",
                    status: editAmcForm.status,
                    notes: editAmcForm.notes.trim(),
                }),
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to update AMC contract.");
            }

            const updatedContract = result.data;
            const normalized = normalizeAmcContractFromApi(updatedContract);

            setSelectedRecord((current) =>
                current?.id === normalized.id ? { ...current, ...normalized } : current
            );
            setRecords((current) =>
                current.map((rec) => (rec.id === normalized.id ? { ...rec, ...normalized } : rec))
            );
            setSelectedClientGroup((current) => {
                if (!current) return null;
                return {
                    ...current,
                    records: (current.records || []).map((rec) =>
                        rec.id === normalized.id ? { ...rec, ...normalized } : rec
                    ),
                };
            });

            closeEditAmcDrawer();
            await loadAmcContracts();
            alert("AMC contract updated successfully.");
        } catch (error) {
            console.error("Save AMC contract error:", error);
            setEditAmcError(error.message || "Unable to update AMC contract.");
        } finally {
            setSavingEditAmc(false);
        }
    };

    const handleDeleteAmc = async (record) => {
        if (!record) return;
        const contractId = record.mongoId || record.id;
        if (!contractId) {
            alert("AMC contract ID not found.");
            return;
        }

        const contractCode = record.contractNo || record.contractCode || "this AMC contract";
        const clientName = record.client || record.clientName || "this client";
        const confirmMsg = `Are you sure you want to delete ${contractCode} for "${clientName}"?\n\nThis will soft-delete the contract and its draft invoices.`;
        if (!window.confirm(confirmMsg)) {
            return;
        }

        try {
            setDeletingAmcId(contractId);
            const response = await fetch(`${API_URL}/api/admin/amc/contract/${contractId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${getAuthToken()}`,
                },
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to delete AMC contract.");
            }

            setSelectedRecord((current) => (current?.id === contractId ? null : current));
            setRecords((current) => current.filter((rec) => rec.id !== contractId && rec.mongoId !== contractId));

            setSelectedClientGroup((current) => {
                if (!current) return null;
                const updatedRecs = (current.records || []).filter(
                    (rec) => rec.id !== contractId && rec.mongoId !== contractId
                );
                if (updatedRecs.length === 0) {
                    return null;
                }
                return {
                    ...current,
                    records: updatedRecs,
                };
            });

            await loadAmcContracts();
            alert("AMC contract deleted successfully.");
        } catch (error) {
            console.error("Delete AMC contract error:", error);
            alert(error.message || "Unable to delete AMC contract.");
        } finally {
            setDeletingAmcId(null);
        }
    };

    const handleRenewClientGroupAmc = (clientGroup) => {
        if (!clientGroup || !clientGroup.records || clientGroup.records.length === 0) {
            alert("No AMC contract found for this client.");
            return;
        }
        openRenewalModal(clientGroup.records[0]);
    };

    const handleEditClientGroupAmc = (clientGroup) => {
        if (!clientGroup || !clientGroup.records || clientGroup.records.length === 0) {
            alert("No AMC contract found for this client.");
            return;
        }
        handleOpenEditAmc(clientGroup.records[0]);
    };

    const handleDeleteClientGroupAmc = (clientGroup) => {
        if (!clientGroup || !clientGroup.records || clientGroup.records.length === 0) {
            alert("No AMC contract found for this client.");
            return;
        }
        handleDeleteAmc(clientGroup.records[0]);
    };

    const handleOpenInvoicePreview = (record) => {
        const invoiceTimelineEvent = createAmcTimelineEvent({
            type: "invoice",
            title: "Invoice preview opened",
            description: `Invoice ${record.invoiceNo || "draft invoice"
                } was opened for preview.`,
        });
        const updatedRecord = {
            ...record,
            timeline: [
                ...(record.timeline || []),
                invoiceTimelineEvent,
            ],
        };
        setRecords((current) =>
            current.map((item) =>
                item.id === record.id ? updatedRecord : item
            )
        );
        setSelectedRecord((current) =>
            current?.id === record.id ? updatedRecord : current
        );
        setInvoiceRecord(updatedRecord);
    };

    const handleSaveReminder =
        async (reminderEntry) => {
            if (!reminderRecord) {
                return;
            }
            const contractId =
                reminderRecord.mongoId ||
                reminderRecord.id;
            if (!contractId) {
                alert(
                    "AMC contract ID was not found."
                );
                return;
            }
            try {
                setSavingReminder(true);
                const token = getAuthToken();
                if (!token) {
                    throw new Error(
                        "Login token was not found. Please login again."
                    );
                }
                const response = await fetch(
                    `${API_URL}/api/admin/amc/contract/${contractId}/reminder`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            channel: reminderEntry.channel,
                            message: reminderEntry.message,
                            followUpDate: reminderEntry.followUpDate,
                            assignedEmployeeId: reminderEntry.assignedEmployeeId || "",
                            notes: reminderEntry.notes || "",
                        }),
                    }
                );
                const result = await response.json();
                if (response.status === 401) {
                    throw new Error(
                        "Your login session has expired. Please login again."
                    );
                }
                if (!response.ok || result.success !== true) {
                    throw new Error(
                        result.message ||
                        "Unable to save AMC reminder."
                    );
                }
                const updatedContract =
                    normalizeAmcContractFromApi(
                        result.data.contract
                    );
                const savedReminder = result.data.reminder;
                const normalizedReminder = {
                    id: savedReminder._id || savedReminder.id,
                    channel: savedReminder.channel,
                    message: savedReminder.message,
                    followUpDate: savedReminder.followUpDate
                        ? new Date(
                            savedReminder.followUpDate
                        ).toLocaleDateString(
                            "en-GB",
                            {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                            }
                        )
                        : "Not scheduled",
                    assignedEmployeeId: savedReminder.assignedEmployeeId || "",
                    assignedEmployeeCode: savedReminder.assignedEmployeeCode || "",
                    assignedEmployeeName: savedReminder.assignedEmployeeName || "Unassigned",
                    assignedTo: savedReminder.assignedEmployeeName || "Unassigned",
                    notes: savedReminder.notes || "",
                    sentAt: savedReminder.sentAt
                        ? new Date(
                            savedReminder.sentAt
                        ).toLocaleString(
                            "en-IN"
                        )
                        : "—",
                    sentBy: savedReminder.sentByName || "Admin",
                    status: savedReminder.status || "Sent",
                };
                const finalRecord = {
                    ...updatedContract,
                    reminderHistory: [
                        ...(
                            reminderRecord.reminderHistory ||
                            []
                        ),
                        normalizedReminder,
                    ],
                };
                setRecords(
                    (current) =>
                        current.map(
                            (record) =>
                                record.id ===
                                    reminderRecord.id
                                    ? finalRecord
                                    : record
                        )
                );
                setSelectedRecord(
                    (current) =>
                        current?.id ===
                            reminderRecord.id
                            ? finalRecord
                            : current
                );
                setReminderRecord(null);
                await loadAmcContracts();
                alert(
                    result.message ||
                    "AMC reminder saved successfully."
                );
            } catch (error) {
                console.error(
                    "Save AMC reminder error:",
                    error
                );
                alert(
                    error.message ||
                    "Unable to save AMC reminder."
                );
            } finally {
                setSavingReminder(false);
            }
        };

    const formatFileSize = (bytes) => {
        const value = Number(bytes || 0);
        if (!value) return "—";
        if (value < 1024) return `${value} B`;
        if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
        return `${(value / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getRecordDocuments = (record) => {
        if (!record) return [];

        const backendDocuments = Array.isArray(record.documents)
            ? record.documents
            : [];

        const frontendDocuments =
            localDocuments[String(record.id)] || [];

        const systemInvoiceDocument =
            record.invoiceNo
                ? [{
                    id: `system-invoice-${record.id}`,
                    type: "System Generated Invoice",
                    name: `${record.invoiceNo}.pdf`,
                    mimeType: "application/pdf",
                    size: 0,
                    url: "",
                    source: "System Generated",
                    status: "Ready",
                    uploadedAt: record.invoiceDate || null,
                    uploadedBy: "System",
                    systemInvoice: true,
                    localOnly: true,
                }]
                : [];

        return [
            ...systemInvoiceDocument,
            ...backendDocuments,
            ...frontendDocuments,
        ];
    };

    const handleDocumentUpload =
        async (event) => {
            const files =
                Array.from(
                    event.target.files ||
                    []
                );

            event.target.value =
                "";

            if (
                !selectedRecord ||
                files.length === 0
            ) {
                return;
            }

            const allowedTypes = [
                "application/pdf",
                "image/jpeg",
                "image/png",
            ];

            const invalidFile =
                files.find(
                    (file) =>
                        (
                            !allowedTypes.includes(
                                file.type
                            ) &&
                            !/\.(pdf|jpe?g|png)$/i.test(
                                file.name
                            )
                        ) ||
                        file.size >
                        10 *
                        1024 *
                        1024
                );

            if (invalidFile) {
                setDocumentError(
                    "Only PDF, JPG, JPEG and PNG documents up to 10 MB are allowed."
                );
                return;
            }

            try {
                setUploadingDocument(
                    true
                );

                setDocumentError(
                    ""
                );

                const token =
                    getAuthToken();

                if (!token) {
                    throw new Error(
                        "Login token was not found. Please login again."
                    );
                }

                const contractId =
                    selectedRecord.mongoId ||
                    selectedRecord.id;

                if (!contractId) {
                    throw new Error(
                        "AMC contract ID was not found."
                    );
                }

                const formData =
                    new FormData();

                formData.append(
                    "documentType",
                    documentType
                );

                files.forEach(
                    (file) => {
                        formData.append(
                            "documents",
                            file
                        );
                    }
                );

                const response =
                    await fetch(
                        `${API_URL}/api/admin/amc/contract/${contractId}/documents`,
                        {
                            method:
                                "POST",

                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                            },

                            body:
                                formData,
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
                        "Unable to upload AMC document."
                    );
                }

                const backendContract =
                    result.data?.contract ||
                    result.data;

                if (backendContract) {
                    const updatedRecord =
                        normalizeAmcContractFromApi(
                            backendContract
                        );

                    setSelectedRecord(
                        updatedRecord
                    );

                    setRecords(
                        (current) =>
                            current.map(
                                (record) =>
                                    record.id ===
                                        updatedRecord.id
                                        ? updatedRecord
                                        : record
                            )
                    );
                } else {
                    await loadAmcContracts();
                }

                alert(
                    files.length === 1
                        ? "Document uploaded successfully."
                        : `${files.length} documents uploaded successfully.`
                );
            } catch (error) {
                console.error(
                    "AMC document upload error:",
                    error
                );

                setDocumentError(
                    error.message ||
                    "Unable to upload document."
                );
            } finally {
                setUploadingDocument(
                    false
                );
            }
        };

    const handlePreviewDocument =
        async (document) => {
            if (
                document.systemInvoice
            ) {
                handleOpenInvoicePreview(
                    selectedRecord
                );

                return;
            }

            try {
                const token =
                    getAuthToken();

                if (!token) {
                    throw new Error(
                        "Login token was not found."
                    );
                }

                const contractId =
                    selectedRecord.mongoId ||
                    selectedRecord.id;

                const endpoint =
                    `${API_URL}/api/admin/amc/contract/${contractId}/document/${document.id}/view`;

                const response =
                    await fetch(
                        endpoint,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                            },
                        }
                    );

                if (!response.ok) {
                    let message =
                        "Unable to preview document.";

                    try {
                        const result =
                            await response.json();

                        message =
                            result.message ||
                            message;
                    } catch {
                        // file response
                    }

                    throw new Error(
                        message
                    );
                }

                const blob =
                    await response.blob();

                const objectUrl =
                    URL.createObjectURL(
                        blob
                    );

                const newWindow =
                    window.open(
                        objectUrl,
                        "_blank"
                    );

                if (!newWindow) {
                    URL.revokeObjectURL(
                        objectUrl
                    );

                    throw new Error(
                        "Popup blocked. Please allow popups."
                    );
                }

                setTimeout(
                    () => {
                        URL.revokeObjectURL(
                            objectUrl
                        );
                    },
                    60000
                );
            } catch (error) {
                console.error(
                    "Preview document error:",
                    error
                );

                alert(
                    error.message ||
                    "Unable to preview document."
                );
            }
        };
    const handleDownloadDocument =
        async (document) => {
            if (
                document.systemInvoice
            ) {
                handleOpenInvoicePreview(
                    selectedRecord
                );

                return;
            }

            try {
                const token =
                    getAuthToken();

                const contractId =
                    selectedRecord.mongoId ||
                    selectedRecord.id;

                const endpoint =
                    `${API_URL}/api/admin/amc/contract/${contractId}/document/${document.id}/download`;

                const response =
                    await fetch(
                        endpoint,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                            },
                        }
                    );

                if (!response.ok) {
                    throw new Error(
                        "Unable to download document."
                    );
                }

                const blob =
                    await response.blob();

                const objectUrl =
                    URL.createObjectURL(
                        blob
                    );

                const anchor =
                    window.document.createElement(
                        "a"
                    );

                anchor.href =
                    objectUrl;

                anchor.download =
                    document.fileName ||
                    document.name ||
                    "document";

                window.document.body.appendChild(
                    anchor
                );

                anchor.click();

                anchor.remove();

                setTimeout(
                    () =>
                        URL.revokeObjectURL(
                            objectUrl
                        ),
                    1000
                );
            } catch (error) {
                console.error(
                    "Download document error:",
                    error
                );

                alert(
                    error.message ||
                    "Unable to download document."
                );
            }
        };

    const handleRemoveLocalDocument =
        async (document) => {
            if (
                !selectedRecord ||
                !document?.id ||
                document.systemInvoice
            ) {
                return;
            }

            const confirmed =
                window.confirm(
                    `Remove "${document.fileName || document.name}"?`
                );

            if (!confirmed) {
                return;
            }

            try {
                const token =
                    getAuthToken();

                const contractId =
                    selectedRecord.mongoId ||
                    selectedRecord.id;

                const response =
                    await fetch(
                        `${API_URL}/api/admin/amc/contract/${contractId}/document/${document.id}`,
                        {
                            method:
                                "DELETE",

                            headers: {
                                Accept:
                                    "application/json",

                                Authorization:
                                    `Bearer ${token}`,
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
                        "Unable to remove document."
                    );
                }

                const backendContract =
                    result.data?.contract ||
                    result.data;

                if (backendContract) {
                    const updatedRecord =
                        normalizeAmcContractFromApi(
                            backendContract
                        );

                    setSelectedRecord(
                        updatedRecord
                    );

                    setRecords(
                        (current) =>
                            current.map(
                                (record) =>
                                    record.id ===
                                        updatedRecord.id
                                        ? updatedRecord
                                        : record
                            )
                    );
                } else {
                    setSelectedRecord(
                        (current) => ({
                            ...current,

                            documents:
                                (
                                    current.documents ||
                                    []
                                ).filter(
                                    (item) =>
                                        item.id !==
                                        document.id
                                ),
                        })
                    );
                }

                alert(
                    "Document removed successfully."
                );
            } catch (error) {
                console.error(
                    "Remove document error:",
                    error
                );

                alert(
                    error.message ||
                    "Unable to remove document."
                );
            }

        };

    /* =====================================================
AMC INVOICE / CYCLE DETAIL
===================================================== */

    if (selectedInvoiceDetail) {
        const invoice =
            selectedInvoiceDetail;

        const invoiceHistory =
            Array.isArray(
                invoice.invoiceHistory
            )
                ? invoice.invoiceHistory
                : [];

        const collectionPercent =
            invoice.totalAmount > 0
                ? Math.min(
                    Math.round(
                        (
                            invoice.paidAmount /
                            invoice.totalAmount
                        ) *
                        100
                    ),
                    100
                )
                : 0;

        return (
            <>
                <div className="enterprise-page space-y-6 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.055),transparent_28%)]">
                    {/* BACK */}

                    <button
                        type="button"
                        onClick={() =>
                            setSelectedInvoiceDetail(
                                null
                            )
                        }
                        className="flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-violet-600"
                    >
                        <ArrowLeft
                            size={18}
                        />

                        Back to Client AMC
                    </button>

                    {/* HEADER */}

                    <section className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-600">
                                    AMC Invoice
                                </p>

                                {invoice.isCurrent && (
                                    <span className="rounded-full bg-violet-100 px-2 py-1 text-[9px] font-semibold text-violet-700">
                                        Current Cycle
                                    </span>
                                )}
                            </div>

                            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                                {invoice.invoiceCode ||
                                    "AMC Invoice"}
                            </h1>

                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                <span>
                                    {
                                        invoice.clientName
                                    }
                                </span>

                                <span>
                                    {
                                        invoice.clientCode
                                    }
                                </span>

                                <span>
                                    {
                                        invoice.productName
                                    }
                                </span>

                                <span>
                                    {
                                        invoice.productCode
                                    }
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    setHistoryInvoiceRecord(
                                        {
                                            invoiceNo:
                                                invoice.invoiceCode,

                                            invoiceCode:
                                                invoice.invoiceCode,

                                            client:
                                                invoice.clientName,

                                            clientName:
                                                invoice.clientName,

                                            clientCode:
                                                invoice.clientCode,

                                            product:
                                                invoice.productName,

                                            productName:
                                                invoice.productName,

                                            productCode:
                                                invoice.productCode,

                                            plan:
                                                invoice.plan,

                                            users:
                                                invoice.licensedUsers,

                                            licensedUsers:
                                                invoice.licensedUsers,

                                            startDate:
                                                formatBusinessDate(
                                                    invoice.startDate
                                                ),

                                            expiryDate:
                                                formatBusinessDate(
                                                    invoice.expiryDate
                                                ),

                                            dueDate:
                                                formatBusinessDate(
                                                    invoice.dueDate
                                                ),

                                            amount:
                                                invoice.totalAmount,

                                            totalAmount:
                                                invoice.totalAmount,

                                            paidAmount:
                                                invoice.paidAmount,

                                            pendingAmount:
                                                invoice.pendingAmount,

                                            taxableAmount:
                                                invoice.taxableAmount,

                                            cgstRate:
                                                invoice.cgstRate,

                                            cgstAmount:
                                                invoice.cgstAmount,

                                            sgstRate:
                                                invoice.sgstRate,

                                            sgstAmount:
                                                invoice.sgstAmount,

                                            igstRate:
                                                invoice.igstRate,

                                            igstAmount:
                                                invoice.igstAmount,

                                            status:
                                                invoice.paymentStatus,
                                        }
                                    )
                                }
                                className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                            >
                                <FileText
                                    size={15}
                                />

                                Invoice Preview
                            </button>

                            {invoice.pendingAmount >
                                0 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const matchingRecord =
                                                records.find(
                                                    (
                                                        record
                                                    ) =>
                                                        String(
                                                            record.mongoId ||
                                                            record.id
                                                        ) ===
                                                        String(
                                                            invoice.amcContractId
                                                        )
                                                );

                                            if (
                                                !matchingRecord
                                            ) {
                                                alert(
                                                    "AMC contract record was not found."
                                                );

                                                return;
                                            }

                                            openPaymentModal({
                                                ...matchingRecord,

                                                currentInvoiceId:
                                                    invoice.amcInvoiceId,

                                                amcInvoiceId:
                                                    invoice.amcInvoiceId,

                                                invoiceNo:
                                                    invoice.invoiceCode,

                                                invoiceCode:
                                                    invoice.invoiceCode,

                                                amount:
                                                    invoice.totalAmount,

                                                totalAmount:
                                                    invoice.totalAmount,

                                                paidAmount:
                                                    invoice.paidAmount,

                                                pendingAmount:
                                                    invoice.pendingAmount,
                                            });
                                        }}
                                        className="flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                                    >
                                        <IndianRupee
                                            size={15}
                                        />

                                        Record Payment
                                    </button>
                                )}
                        </div>
                    </section>

                    {/* SUMMARY */}

                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                Invoice Total
                            </p>

                            <p className="mt-3 text-2xl font-semibold text-slate-950">
                                {formatCurrency(
                                    invoice.totalAmount
                                )}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                Received
                            </p>

                            <p className="mt-3 text-2xl font-semibold text-emerald-700">
                                {formatCurrency(
                                    invoice.paidAmount
                                )}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                Outstanding
                            </p>

                            <p className="mt-3 text-2xl font-semibold text-rose-600">
                                {formatCurrency(
                                    invoice.pendingAmount
                                )}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                Collection
                            </p>

                            <p className="mt-3 text-2xl font-semibold text-violet-700">
                                {
                                    collectionPercent
                                }
                                %
                            </p>

                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-violet-600"
                                    style={{
                                        width:
                                            `${collectionPercent}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </section>

                    {/* DETAILS */}

                    <section className="grid gap-6 xl:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <h2 className="text-sm font-semibold text-slate-950">
                                AMC Cycle
                            </h2>

                            <dl className="mt-5 grid grid-cols-2 gap-5">
                                <div>
                                    <dt className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                        Start Date
                                    </dt>

                                    <dd className="mt-1 text-sm font-semibold text-slate-800">
                                        {formatBusinessDate(
                                            invoice.startDate
                                        )}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                        Expiry Date
                                    </dt>

                                    <dd className="mt-1 text-sm font-semibold text-slate-800">
                                        {formatBusinessDate(
                                            invoice.expiryDate
                                        )}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                        Invoice Date
                                    </dt>

                                    <dd className="mt-1 text-sm font-semibold text-slate-800">
                                        {formatBusinessDate(
                                            invoice.invoiceDate
                                        )}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                        Due Date
                                    </dt>

                                    <dd className="mt-1 text-sm font-semibold text-slate-800">
                                        {formatBusinessDate(
                                            invoice.dueDate
                                        )}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                        Contract
                                    </dt>

                                    <dd className="mt-1 text-sm font-semibold text-slate-800">
                                        {invoice.contractCode ||
                                            "—"}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                        Status
                                    </dt>

                                    <dd className="mt-1">
                                        <StatusBadge
                                            status={
                                                invoice.paymentStatus
                                            }
                                        />
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <h2 className="text-sm font-semibold text-slate-950">
                                Product & Tax
                            </h2>

                            <dl className="mt-5 grid grid-cols-2 gap-5">
                                <div>
                                    <dt className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                        Product
                                    </dt>

                                    <dd className="mt-1 text-sm font-semibold text-slate-800">
                                        {invoice.productName}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                        Plan
                                    </dt>

                                    <dd className="mt-1 text-sm font-semibold text-slate-800">
                                        {invoice.plan}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                        Taxable
                                    </dt>

                                    <dd className="mt-1 text-sm font-semibold text-slate-800">
                                        {formatCurrency(
                                            invoice.taxableAmount
                                        )}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                        Licensed Users
                                    </dt>

                                    <dd className="mt-1 text-sm font-semibold text-slate-800">
                                        {
                                            invoice.licensedUsers
                                        }
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                        CGST
                                    </dt>

                                    <dd className="mt-1 text-sm font-semibold text-slate-800">
                                        {
                                            invoice.cgstRate
                                        }
                                        % ·{" "}
                                        {formatCurrency(
                                            invoice.cgstAmount
                                        )}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                        SGST / IGST
                                    </dt>

                                    <dd className="mt-1 text-sm font-semibold text-slate-800">
                                        {invoice.igstRate >
                                            0
                                            ? `${invoice.igstRate}% · ${formatCurrency(
                                                invoice.igstAmount
                                            )}`
                                            : `${invoice.sgstRate}% · ${formatCurrency(
                                                invoice.sgstAmount
                                            )}`}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </section>

                    {/* INSTALLMENTS */}

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                            <div>
                                <h2 className="text-sm font-semibold text-slate-950">
                                    Payment Installments
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    {
                                        invoice
                                            .payments
                                            .length
                                    }{" "}
                                    payment
                                    {invoice
                                        .payments
                                        .length ===
                                        1
                                        ? ""
                                        : "s"}{" "}
                                    recorded against this invoice.
                                </p>
                            </div>

                            <p className="text-sm font-semibold text-emerald-700">
                                {formatCurrency(
                                    invoice.paidAmount
                                )}
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50">
                                        <th className="px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                            #
                                        </th>

                                        <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                            Receipt
                                        </th>

                                        <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                            Date
                                        </th>

                                        <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                            Mode
                                        </th>

                                        <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                            Reference
                                        </th>

                                        <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                            Received By
                                        </th>

                                        <th className="px-5 py-3 text-right text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                            Amount
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {invoice.payments.map(
                                        (
                                            payment,
                                            index
                                        ) => (
                                            <tr
                                                key={
                                                    payment.id ||
                                                    index
                                                }
                                                className="border-b border-slate-100 last:border-b-0"
                                            >
                                                <td className="px-5 py-4 text-xs text-slate-500">
                                                    #
                                                    {index +
                                                        1}
                                                </td>

                                                <td className="px-4 py-4 text-xs font-semibold text-violet-700">
                                                    {payment.paymentCode ||
                                                        "—"}
                                                </td>

                                                <td className="px-4 py-4 text-xs text-slate-600">
                                                    {formatBusinessDate(
                                                        payment.paymentDate
                                                    )}
                                                </td>

                                                <td className="px-4 py-4 text-xs text-slate-700">
                                                    {payment.mode}
                                                </td>

                                                <td className="px-4 py-4 text-xs text-slate-500">
                                                    {payment.referenceNo ||
                                                        "—"}
                                                </td>

                                                <td className="px-4 py-4 text-xs text-slate-600">
                                                    {payment.receivedBy ||
                                                        "Admin"}
                                                </td>

                                                <td className="px-5 py-4 text-right text-xs font-semibold text-emerald-700">
                                                    {formatCurrency(
                                                        payment.amount
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    )}

                                    {invoice.payments.length ===
                                        0 && (
                                            <tr>
                                                <td
                                                    colSpan={
                                                        7
                                                    }
                                                    className="px-6 py-10 text-center text-xs text-slate-500"
                                                >
                                                    No payments have been recorded against this AMC invoice.
                                                </td>
                                            </tr>
                                        )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* CYCLE HISTORY */}

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className="border-b border-slate-200 px-5 py-4">
                            <h2 className="text-sm font-semibold text-slate-950">
                                AMC Cycle History
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                                Previous and current AMC invoices under this contract.
                            </p>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {invoiceHistory.map(
                                (
                                    history
                                ) => (
                                    <button
                                        key={
                                            history.id
                                        }
                                        type="button"
                                        onClick={() =>
                                            setSelectedInvoiceDetail(
                                                {
                                                    ...history,

                                                    invoiceHistory,
                                                }
                                            )
                                        }
                                        className={`grid w-full gap-3 px-5 py-4 text-left transition hover:bg-slate-50 md:grid-cols-[1.2fr_1fr_1fr_1fr_auto] ${history.id ===
                                                invoice.id
                                                ? "bg-violet-50/60"
                                                : ""
                                            }`}
                                    >
                                        <div>
                                            <p className="text-xs font-semibold text-slate-900">
                                                {history.invoiceCode ||
                                                    "AMC Invoice"}
                                            </p>

                                            <p className="mt-1 text-[10px] text-slate-400">
                                                {history.id ===
                                                    invoice.id
                                                    ? "Selected cycle"
                                                    : history.isCurrent
                                                        ? "Current cycle"
                                                        : "Historical cycle"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[9px] font-semibold uppercase text-slate-400">
                                                Period
                                            </p>

                                            <p className="mt-1 text-xs text-slate-700">
                                                {formatBusinessDate(
                                                    history.startDate
                                                )}
                                                {" → "}
                                                {formatBusinessDate(
                                                    history.expiryDate
                                                )}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[9px] font-semibold uppercase text-slate-400">
                                                Amount
                                            </p>

                                            <p className="mt-1 text-xs font-semibold text-slate-900">
                                                {formatCurrency(
                                                    history.totalAmount
                                                )}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[9px] font-semibold uppercase text-slate-400">
                                                Balance
                                            </p>

                                            <p className="mt-1 text-xs font-semibold text-rose-600">
                                                {formatCurrency(
                                                    history.pendingAmount
                                                )}
                                            </p>
                                        </div>

                                        <div className="flex items-center">
                                            <StatusBadge
                                                status={
                                                    history.paymentStatus
                                                }
                                            />
                                        </div>
                                    </button>
                                )
                            )}
                        </div>
                    </section>
                </div>

                {historyInvoiceRecord && (
                    <AmcInvoice
                        record={
                            historyInvoiceRecord
                        }
                        onClose={() =>
                            setHistoryInvoiceRecord(
                                null
                            )
                        }
                    />
                )}

                {paymentRecord && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <button
                            type="button"
                            onClick={
                                closePaymentModal
                            }
                            className="enterprise-backdrop absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
                        />

                        <form
                            onSubmit={
                                handleRecordPayment
                            }
                            className="enterprise-modal relative w-full max-w-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                        >
                            <div className="border-b border-slate-200 px-6 py-5">
                                <h2 className="text-lg font-semibold text-slate-950">
                                    Record AMC Payment
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    {invoice.invoiceCode}
                                    {" · "}
                                    {formatCurrency(
                                        invoice.pendingAmount
                                    )}{" "}
                                    pending
                                </p>
                            </div>

                            <div className="space-y-4 p-6">
                                {formError && (
                                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
                                        {
                                            formError
                                        }
                                    </div>
                                )}

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                                        Amount
                                    </label>

                                    <input
                                        name="amount"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={
                                            paymentForm.amount
                                        }
                                        onChange={
                                            handlePaymentChange
                                        }
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-400"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                                        Payment Date
                                    </label>

                                    <input
                                        name="paymentDate"
                                        type="date"
                                        value={
                                            paymentForm.paymentDate
                                        }
                                        onChange={
                                            handlePaymentChange
                                        }
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-400"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                                        Payment Mode
                                    </label>

                                    <select
                                        name="mode"
                                        value={
                                            paymentForm.mode
                                        }
                                        onChange={
                                            handlePaymentChange
                                        }
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-400"
                                    >
                                        <option>
                                            Bank Transfer
                                        </option>
                                        <option>
                                            Cash
                                        </option>
                                        <option>
                                            UPI
                                        </option>
                                        <option>
                                            Cheque
                                        </option>
                                        <option>
                                            Card
                                        </option>
                                        <option>
                                            Other
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                                        Reference No
                                    </label>

                                    <input
                                        name="referenceNo"
                                        value={
                                            paymentForm.referenceNo
                                        }
                                        onChange={
                                            handlePaymentChange
                                        }
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-400"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                                        Notes
                                    </label>

                                    <textarea
                                        name="notes"
                                        rows={3}
                                        value={
                                            paymentForm.notes
                                        }
                                        onChange={
                                            handlePaymentChange
                                        }
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                                <button
                                    type="button"
                                    onClick={
                                        closePaymentModal
                                    }
                                    className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        savingPayment
                                    }
                                    className="h-10 rounded-xl bg-emerald-600 px-5 text-xs font-semibold text-white disabled:opacity-50"
                                >
                                    {savingPayment
                                        ? "Saving..."
                                        : "Save Payment"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </>
        );
    }
    // Render the detail view when a record is selected
    if (selectedRecord) {
        return (
            <>
                {/* Detail View - Full Page */}
                <div className="enterprise-page space-y-6 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.055),transparent_28%)]">
                    {/* Back button */}
                    <button
                        type="button"
                        onClick={() => setSelectedRecord(null)}
                        className="flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-violet-600"
                    >
                        <ArrowLeft size={18} />
                        Back to AMC & Billing
                    </button>

                    {/* Header */}
                    <section className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-xl font-bold text-violet-700">
                                {selectedRecord.client
                                    .split(" ")
                                    .slice(0, 2)
                                    .map((word) => word[0])
                                    .join("")}
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                                        {selectedRecord.client}
                                    </h1>
                                    <StatusBadge status={selectedRecord.status} />
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                                    <span>Contract: {selectedRecord.contractNo}</span>
                                    <span>Product: {selectedRecord.product}</span>
                                    <span>Plan: {selectedRecord.plan}</span>
                                    <span>Client Code: {selectedRecord.clientCode}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => handleOpenInvoicePreview(selectedRecord)}
                                className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                            >
                                <FileText size={16} />
                                Invoice Preview
                            </button>
                            {selectedRecord.status !== "Cancelled" && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        openRenewalModal(invoice || selectedRecord)
                                    }
                                    className="flex h-11 items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                                >
                                    <RefreshCw size={15} />
                                    Renew AMC
                                </button>
                            )}
                            {selectedRecord.pendingAmount > 0 && (
                                <button
                                    type="button"
                                    onClick={() => openPaymentModal(selectedRecord)}
                                    className="flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700"
                                >
                                    <IndianRupee size={16} />
                                    Record Payment
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => handleOpenEditAmc(selectedRecord)}
                                className="flex h-11 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                            >
                                <Pencil size={16} />
                                Edit Contract
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDeleteAmc(selectedRecord)}
                                disabled={deletingAmcId === (selectedRecord.mongoId || selectedRecord.id)}
                                className="flex h-11 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                            >
                                <Trash2 size={16} />
                                Delete Contract
                            </button>
                        </div>
                    </section>

                    {/* Summary Cards */}
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="enterprise-surface enterprise-surface--interactive p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        AMC Status
                                    </p>
                                    <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                                        {selectedRecord.status}
                                    </p>
                                    <p className="mt-2 text-xs font-medium text-slate-500">
                                        {selectedRecord.plan} plan
                                    </p>
                                </div>
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                                    <CheckCircle2 size={20} />
                                </div>
                            </div>
                        </div>
                        <div className="enterprise-surface enterprise-surface--interactive p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        Total Amount
                                    </p>
                                    <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                                        {formatCurrency(selectedRecord.amount)}
                                    </p>
                                    <p className="mt-2 text-xs font-medium text-slate-500">
                                        Invoice total
                                    </p>
                                </div>
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                                    <IndianRupee size={20} />
                                </div>
                            </div>
                        </div>
                        <div className="enterprise-surface enterprise-surface--interactive p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        Pending Amount
                                    </p>
                                    <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-rose-600">
                                        {formatCurrency(selectedRecord.pendingAmount)}
                                    </p>
                                    <p className="mt-2 text-xs font-medium text-rose-500">
                                        Awaiting collection
                                    </p>
                                </div>
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                                    <WalletCards size={20} />
                                </div>
                            </div>
                        </div>
                        <div className="enterprise-surface enterprise-surface--interactive p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        Due Date
                                    </p>
                                    <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                                        {selectedRecord.dueDate}
                                    </p>
                                    <p className="mt-2 text-xs font-medium text-slate-500">
                                        Payment deadline
                                    </p>
                                </div>
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                                    <CalendarDays size={20} />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Tabs */}
                    <section className="border-b border-slate-200">
                        <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Tabs">
                            {["Overview", "Payments", "Reminders", "Renewals", "Documents", "Activity"].map((tab) => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setActiveTab(tab)}
                                    className={`whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-semibold transition ${activeTab === tab
                                            ? "border-violet-600 text-violet-700"
                                            : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </nav>
                    </section>

                    {/* Tab Content */}
                    <section className="space-y-6">
                        {activeTab === "Overview" && (
                            <>
                                {/* Two-column info cards */}
                                <div className="grid gap-6 lg:grid-cols-2">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                                        <h3 className="text-sm font-semibold text-slate-950">Contract Information</h3>
                                        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4">
                                            <div>
                                                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Contact Person</dt>
                                                <dd className="mt-1 text-sm font-medium text-slate-800">{selectedRecord.contactPerson}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Mobile</dt>
                                                <dd className="mt-1 text-sm font-medium text-slate-800">{selectedRecord.mobile}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Email</dt>
                                                <dd className="mt-1 text-sm font-medium text-slate-800">{selectedRecord.contactEmail || "—"}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Product</dt>
                                                <dd className="mt-1 text-sm font-medium text-slate-800">{selectedRecord.product}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Plan</dt>
                                                <dd className="mt-1 text-sm font-medium text-slate-800">{selectedRecord.plan}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">AMC Period</dt>
                                                <dd className="mt-1 text-sm font-medium text-slate-800">{selectedRecord.startDate} – {selectedRecord.expiryDate}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Invoice</dt>
                                                <dd className="mt-1 text-sm font-medium text-violet-700">{selectedRecord.invoiceNo || "Not generated"}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Assigned Employee</dt>
                                                <dd className="mt-1 text-sm font-medium text-slate-800">{selectedRecord.assignedTo}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Due Date</dt>
                                                <dd className="mt-1 text-sm font-medium text-slate-800">{selectedRecord.dueDate}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Status</dt>
                                                <dd className="mt-1"><StatusBadge status={selectedRecord.status} /></dd>
                                            </div>
                                        </dl>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                                        <h3 className="text-sm font-semibold text-slate-950">Billing Information</h3>
                                        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4">
                                            <div>
                                                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Invoice Amount</dt>
                                                <dd className="mt-1 text-sm font-medium text-slate-800">{formatCurrency(selectedRecord.amount)}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">GST</dt>
                                                <dd className="mt-1 text-sm font-medium text-slate-800">
                                                    {selectedRecord.cgstAmount > 0 && `CGST ${formatCurrency(selectedRecord.cgstAmount)}`}
                                                    {selectedRecord.sgstAmount > 0 && `, SGST ${formatCurrency(selectedRecord.sgstAmount)}`}
                                                    {selectedRecord.igstAmount > 0 && `, IGST ${formatCurrency(selectedRecord.igstAmount)}`}
                                                    {!selectedRecord.cgstAmount && !selectedRecord.sgstAmount && !selectedRecord.igstAmount && "—"}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Paid Amount</dt>
                                                <dd className="mt-1 text-sm font-medium text-emerald-700">{formatCurrency(selectedRecord.paidAmount)}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Pending Amount</dt>
                                                <dd className="mt-1 text-sm font-medium text-rose-700">{formatCurrency(selectedRecord.pendingAmount)}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Payment Status</dt>
                                                <dd className="mt-1"><StatusBadge status={selectedRecord.status} /></dd>
                                            </div>
                                            <div>
                                                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Last Payment Date</dt>
                                                <dd className="mt-1 text-sm font-medium text-slate-800">
                                                    {selectedRecord.paymentHistory?.length > 0
                                                        ? selectedRecord.paymentHistory[selectedRecord.paymentHistory.length - 1].date
                                                        : "—"}
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>
                                </div>
                                {/* Notes if any */}
                                {selectedRecord.notes && (
                                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                                        <h3 className="text-sm font-semibold text-slate-950">Notes</h3>
                                        <p className="mt-2 text-sm text-slate-600">{selectedRecord.notes}</p>
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === "Payments" && (
                            <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                                <div className="border-b border-slate-200 px-6 py-4">
                                    <h3 className="text-sm font-semibold text-slate-950">Payment History</h3>
                                    <p className="text-xs text-slate-500">All payments recorded for this AMC contract.</p>
                                </div>
                                {(selectedRecord.paymentHistory || []).length === 0 ? (
                                    <div className="flex min-h-[180px] flex-col items-center justify-center px-6 text-center">
                                        <CreditCard size={24} className="text-slate-300" />
                                        <p className="mt-3 text-sm font-semibold text-slate-700">No payments recorded</p>
                                        <p className="mt-1 text-xs text-slate-400">Payments will appear here once recorded.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="enterprise-table min-w-full divide-y divide-slate-200">
                                            <thead className="bg-slate-50/80">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Date</th>
                                                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Amount</th>
                                                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Mode</th>
                                                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Reference</th>
                                                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Received By</th>
                                                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {selectedRecord.paymentHistory.map((payment) => (
                                                    <tr key={payment.id} className="transition hover:bg-slate-50/70">
                                                        <td className="px-6 py-4 text-sm font-medium text-slate-800">{payment.date}</td>
                                                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">{formatCurrency(payment.amount)}</td>
                                                        <td className="px-6 py-4 text-sm text-slate-600">{payment.mode}</td>
                                                        <td className="px-6 py-4 text-sm text-slate-500">{payment.referenceNo}</td>
                                                        <td className="px-6 py-4 text-sm text-slate-600">{payment.receivedBy}</td>
                                                        <td className="px-6 py-4">
                                                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                                                                Completed
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "Reminders" && (
                            <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                                <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-950">Reminder History</h3>
                                        <p className="text-xs text-slate-500">All reminders sent for this AMC contract.</p>
                                    </div>
                                    {selectedRecord.pendingAmount > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => handleSendReminder(selectedRecord)}
                                            className="flex h-9 items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
                                        >
                                            <BellRing size={15} />
                                            Send Reminder
                                        </button>
                                    )}
                                </div>
                                {(selectedRecord.reminderHistory || []).length === 0 ? (
                                    <div className="flex min-h-[180px] flex-col items-center justify-center px-6 text-center">
                                        <BellRing size={24} className="text-slate-300" />
                                        <p className="mt-3 text-sm font-semibold text-slate-700">No reminders recorded</p>
                                        <p className="mt-1 text-xs text-slate-400">Reminders will appear here once sent.</p>
                                    </div>
                                ) : (
                                    <div className="relative px-6 py-2">
                                        <div className="absolute bottom-7 left-[39px] top-7 w-px bg-slate-200" />
                                        {[...(selectedRecord.reminderHistory || [])]
                                            .reverse()
                                            .map((reminder) => (
                                                <article key={reminder.id} className="relative flex gap-4 border-b border-slate-100 py-5 last:border-b-0">
                                                    <AmcTimelineIcon type="reminder" />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                            <div>
                                                                <p className="text-sm font-semibold text-slate-900">{reminder.channel}</p>
                                                                <p className="mt-1 text-xs text-slate-500">{reminder.message}</p>
                                                                {reminder.notes && (
                                                                    <p className="mt-2 text-xs text-slate-400">Note: {reminder.notes}</p>
                                                                )}
                                                                <p className="mt-2 text-xs text-slate-500">
                                                                    Assigned to: <span className="font-medium text-slate-700">{reminder.assignedTo}</span>
                                                                </p>
                                                            </div>
                                                            <div className="shrink-0 text-right">
                                                                <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${reminder.status === "Sent"
                                                                        ? "bg-emerald-50 text-emerald-700"
                                                                        : "bg-amber-50 text-amber-700"
                                                                    }`}>
                                                                    {reminder.status}
                                                                </span>
                                                                <p className="mt-1 text-xs text-slate-400">{reminder.sentAt}</p>
                                                                <p className="text-xs text-slate-400">Follow-up: {reminder.followUpDate}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </article>
                                            ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "Renewals" && (
                            <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                                <div className="border-b border-slate-200 px-6 py-4">
                                    <h3 className="text-sm font-semibold text-slate-950">Renewal History</h3>
                                    <p className="text-xs text-slate-500">Previous AMC periods and renewal details.</p>
                                </div>
                                {(selectedRecord.renewalHistory || []).length === 0 ? (
                                    <div className="flex min-h-[180px] flex-col items-center justify-center px-6 text-center">
                                        <RefreshCw size={24} className="text-slate-300" />
                                        <p className="mt-3 text-sm font-semibold text-slate-700">No renewals yet</p>
                                        <p className="mt-1 text-xs text-slate-400">Previous AMC periods will appear here after the first renewal.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="enterprise-table min-w-full divide-y divide-slate-200">
                                            <thead className="bg-slate-50/80">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Period</th>
                                                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Invoice</th>
                                                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Amount</th>
                                                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Status</th>
                                                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Renewed By</th>
                                                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Renewal Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {selectedRecord.renewalHistory.map((history) => (
                                                    <tr key={history.id} className="transition hover:bg-slate-50/70">
                                                        <td className="px-6 py-4 text-sm font-medium text-slate-800">{history.startDate} – {history.expiryDate}</td>
                                                        <td className="px-6 py-4 text-sm text-violet-600">{history.invoiceNo}</td>
                                                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">{formatCurrency(history.amount)}</td>
                                                        <td className="px-6 py-4"><StatusBadge status={history.status} /></td>
                                                        <td className="px-6 py-4 text-sm text-slate-600">{history.renewedBy || "System"}</td>
                                                        <td className="px-6 py-4 text-sm text-slate-500">{history.archivedAt || "—"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "Documents" && (
                            <div className="space-y-5">
                                <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                                    <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <FolderOpen size={18} className="text-violet-600" />
                                                <h3 className="text-sm font-semibold text-slate-950">
                                                    AMC Documents
                                                </h3>
                                            </div>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Keep invoices, agreements, payment receipts and supporting documents with this AMC contract.
                                            </p>
                                        </div>

                                        <div className="flex flex-col gap-2 sm:flex-row">
                                            <select
                                                value={documentType}
                                                onChange={(event) => {
                                                    setDocumentType(event.target.value);
                                                    setDocumentError("");
                                                }}
                                                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            >
                                                <option>AMC Agreement</option>
                                                <option>Own Invoice / Bill</option>
                                                <option>Payment Receipt</option>
                                                <option>Quotation</option>
                                                <option>Purchase Order</option>
                                                <option>Other Document</option>
                                            </select>

                                            <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700">
                                                <Upload size={15} />
                                                {uploadingDocument
                                                    ? "Uploading..."
                                                    : "Upload Document"}
                                                <input
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                                                    multiple
                                                    disabled={
                                                        uploadingDocument
                                                    }
                                                    onChange={
                                                        handleDocumentUpload
                                                    }
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    {documentError && (
                                        <div className="mx-6 mt-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
                                            <AlertCircle size={15} className="mt-0.5 shrink-0" />
                                            <span>{documentError}</span>
                                        </div>
                                    )}

                                    <div className="mx-6 mt-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                                        <div className="flex items-start gap-3">
                                            <Paperclip size={16} className="mt-0.5 shrink-0 text-blue-600" />
                                            <div>
                                                <p className="text-xs font-semibold text-blue-900">
                                                    Frontend document workspace is ready
                                                </p>
                                                <p className="mt-1 text-[10px] leading-5 text-blue-700">
                                                    Files selected here can be previewed during this browser session. They are marked
                                                    "Pending Backend Save" until the document upload/storage API is connected.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {getRecordDocuments(selectedRecord).length === 0 ? (
                                        <div className="flex min-h-[220px] flex-col items-center justify-center px-6 py-10 text-center">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                                <FileText size={26} />
                                            </div>
                                            <h4 className="mt-4 text-sm font-semibold text-slate-700">
                                                No documents available
                                            </h4>
                                            <p className="mt-1 max-w-md text-xs leading-5 text-slate-400">
                                                Upload an AMC agreement, your own bill, receipt or another supporting document.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
                                            {getRecordDocuments(selectedRecord).map((document) => {
                                                const isImage =
                                                    document.mimeType?.startsWith("image/") ||
                                                    /\.(jpg|jpeg|png)$/i.test(document.name || "");

                                                return (
                                                    <article
                                                        key={document.id}
                                                        className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-violet-200 hover:shadow-[0_12px_35px_rgba(15,23,42,0.07)]"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isImage
                                                                    ? "bg-cyan-50 text-cyan-700"
                                                                    : document.systemInvoice
                                                                        ? "bg-violet-50 text-violet-700"
                                                                        : "bg-blue-50 text-blue-700"
                                                                }`}>
                                                                {isImage ? (
                                                                    <FileImage size={20} />
                                                                ) : (
                                                                    <FileText size={20} />
                                                                )}
                                                            </div>

                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate text-xs font-semibold text-slate-900">
                                                                    {document.name}
                                                                </p>
                                                                <p className="mt-1 text-[10px] font-medium text-slate-500">
                                                                    {document.type}
                                                                </p>
                                                            </div>

                                                            {document.localOnly && !document.systemInvoice && (
                                                                <button
                                                                    type="button"
                                                                    title="Remove document"
                                                                    onClick={() => handleRemoveLocalDocument(document)}
                                                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                                                                >
                                                                    <Trash2 size={15} />
                                                                </button>
                                                            )}
                                                        </div>

                                                        <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]">
                                                            <div className="rounded-lg bg-slate-50 px-3 py-2">
                                                                <p className="text-slate-400">Size</p>
                                                                <p className="mt-1 font-semibold text-slate-700">
                                                                    {document.systemInvoice
                                                                        ? "Generated PDF"
                                                                        : formatFileSize(document.size)}
                                                                </p>
                                                            </div>

                                                            <div className="rounded-lg bg-slate-50 px-3 py-2">
                                                                <p className="text-slate-400">Source</p>
                                                                <p className="mt-1 truncate font-semibold text-slate-700">
                                                                    {document.source}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="mt-3 flex items-center justify-between gap-2">
                                                            <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${document.status === "Pending Backend Save"
                                                                    ? "bg-amber-50 text-amber-700"
                                                                    : "bg-emerald-50 text-emerald-700"
                                                                }`}>
                                                                {document.status}
                                                            </span>

                                                            <span className="truncate text-[9px] text-slate-400">
                                                                {document.uploadedBy || "System"}
                                                            </span>
                                                        </div>

                                                        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
                                                            <button
                                                                type="button"
                                                                onClick={() => handlePreviewDocument(document)}
                                                                className="flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
                                                            >
                                                                <Eye size={14} />
                                                                Preview
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => handleDownloadDocument(document)}
                                                                className="flex h-9 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 text-[10px] font-semibold text-violet-700 transition hover:bg-violet-100"
                                                            >
                                                                <Download size={14} />
                                                                {document.systemInvoice ? "Open Invoice" : "Download"}
                                                            </button>
                                                        </div>
                                                    </article>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    {[
                                        ["System Invoice", selectedRecord.invoiceNo ? "Available" : "Not Generated"],
                                        ["Own Bill / Receipt", getRecordDocuments(selectedRecord).some((item) => item.type === "Own Invoice / Bill") ? "Added" : "Not Added"],
                                        ["AMC Agreement", getRecordDocuments(selectedRecord).some((item) => item.type === "AMC Agreement") ? "Added" : "Not Added"],
                                        ["Payment Receipt", getRecordDocuments(selectedRecord).some((item) => item.type === "Payment Receipt") ? "Added" : "Not Added"],
                                    ].map(([label, value]) => (
                                        <div key={label} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                                            <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                                                {label}
                                            </p>
                                            <p className={`mt-2 text-xs font-semibold ${["Available", "Added"].includes(value)
                                                    ? "text-emerald-700"
                                                    : "text-slate-500"
                                                }`}>
                                                {value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === "Activity" && (
                            <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                                <div className="border-b border-slate-200 px-6 py-4">
                                    <h3 className="text-sm font-semibold text-slate-950">Activity Timeline</h3>
                                    <p className="text-xs text-slate-500">Complete history of all actions on this AMC contract.</p>
                                </div>
                                {(selectedRecord.timeline || []).length === 0 ? (
                                    <div className="flex min-h-[180px] flex-col items-center justify-center px-6 text-center">
                                        <History size={24} className="text-slate-300" />
                                        <p className="mt-3 text-sm font-semibold text-slate-700">No activity recorded</p>
                                        <p className="mt-1 text-xs text-slate-400">Actions like creation, payments, and renewals will appear here.</p>
                                    </div>
                                ) : (
                                    <div className="relative px-6 py-2">
                                        <div className="absolute bottom-7 left-[39px] top-7 w-px bg-slate-200" />
                                        {[...(selectedRecord.timeline || [])]
                                            .reverse()
                                            .map((activity) => (
                                                <article key={activity.id} className="relative flex gap-4 border-b border-slate-100 py-5 last:border-b-0">
                                                    <AmcTimelineIcon type={activity.type} />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                            <div>
                                                                <p className="text-sm font-semibold text-slate-900">{activity.title}</p>
                                                                <p className="mt-1 text-xs text-slate-500">{activity.description}</p>
                                                                <p className="mt-2 text-xs text-slate-400">By <span className="font-medium text-slate-600">{activity.user}</span></p>
                                                            </div>
                                                            <span className="shrink-0 text-xs text-slate-400">{activity.time}</span>
                                                        </div>
                                                    </div>
                                                </article>
                                            ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </section>

                    {/* Sticky Footer Actions */}
                    <div className="sticky bottom-0 z-10 border-t border-slate-200 bg-white/80 backdrop-blur-md px-6 py-4 flex flex-wrap justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => handleOpenEditAmc(selectedRecord)}
                            className="flex h-11 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                            <Pencil size={15} />
                            Edit AMC
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDeleteAmc(selectedRecord)}
                            disabled={deletingAmcId === (selectedRecord.mongoId || selectedRecord.id)}
                            className="flex h-11 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                        >
                            <Trash2 size={15} />
                            Delete AMC
                        </button>
                        <button
                            type="button"
                            onClick={() => handleOpenInvoicePreview(selectedRecord)}
                            className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                            <FileText size={16} />
                            Invoice Preview
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                const record = selectedRecord;
                                setSelectedRecord(null);
                                openRenewalModal(record);
                            }}
                            className="flex h-11 items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
                        >
                            <RefreshCw size={15} />
                            Renew AMC
                        </button>
                        {selectedRecord.pendingAmount > 0 && (
                            <button
                                type="button"
                                onClick={() => openPaymentModal(selectedRecord)}
                                className="flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700"
                            >
                                <IndianRupee size={16} />
                                Record Payment
                            </button>
                        )}
                    </div>
                </div>

                {/* Modals - kept outside detail view */}
                {paymentRecord && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <button
                            type="button"
                            onClick={closePaymentModal}
                            className="enterprise-backdrop absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
                        />
                        <form
                            onSubmit={handleRecordPayment}
                            className="enterprise-modal relative w-full max-w-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                        >
                            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                                <div>
                                    <h2 className="text-base font-semibold text-slate-950">Record AMC Payment</h2>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {paymentRecord.client} · Pending {formatCurrency(paymentRecord.pendingAmount)}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closePaymentModal}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500"
                                >
                                    <X size={17} />
                                </button>
                            </div>
                            <div className="space-y-5 px-6 py-6">
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">Payment amount *</label>
                                        <input
                                            type="number"
                                            name="amount"
                                            value={paymentForm.amount}
                                            onChange={handlePaymentChange}
                                            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">Payment date *</label>
                                        <input
                                            type="date"
                                            name="paymentDate"
                                            value={paymentForm.paymentDate}
                                            onChange={handlePaymentChange}
                                            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">Payment mode</label>
                                        <select
                                            name="mode"
                                            value={paymentForm.mode}
                                            onChange={handlePaymentChange}
                                            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                                        >
                                            <option>Bank Transfer</option>
                                            <option>UPI</option>
                                            <option>Cheque</option>
                                            <option>Cash</option>
                                            <option>Card</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">Reference number</label>
                                        <input
                                            name="referenceNo"
                                            value={paymentForm.referenceNo}
                                            onChange={handlePaymentChange}
                                            placeholder="UTR / cheque / transaction no."
                                            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">Notes</label>
                                    <textarea
                                        name="notes"
                                        value={paymentForm.notes}
                                        onChange={handlePaymentChange}
                                        rows={3}
                                        className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none"
                                    />
                                </div>
                                {formError && (
                                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
                                        {formError}
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50/60 px-6 py-4">
                                <button
                                    type="button"
                                    disabled={savingPayment}
                                    onClick={closePaymentModal}
                                    className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-semibold text-white hover:bg-emerald-700"
                                >
                                    <ReceiptIndianRupee size={15} />
                                    Save Payment
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {renewalRecord && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <button
                            type="button"
                            onClick={closeRenewalModal}
                            className="enterprise-backdrop absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
                        />
                        <form
                            onSubmit={handleGenerateRenewal}
                            className="enterprise-modal relative w-full max-w-[620px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                        >
                            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                                <div>
                                    <h2 className="text-base font-semibold text-slate-950">Renew AMC Contract</h2>
                                    <p className="mt-1 text-xs text-slate-500">{renewalRecord.client} · {renewalRecord.product}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeRenewalModal}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500"
                                >
                                    <X size={17} />
                                </button>
                            </div>
                            <div className="space-y-5 px-6 py-6">
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">AMC amount *</label>
                                        <input
                                            type="number"
                                            name="amount"
                                            value={renewalForm.amount}
                                            onChange={handleRenewalChange}
                                            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">Plan</label>
                                        <select
                                            name="plan"
                                            value={renewalForm.plan}
                                            onChange={handleRenewalChange}
                                            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                                        >
                                            <option>Premium</option>
                                            <option>Standard</option>
                                            <option>Basic</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid gap-5 sm:grid-cols-3">
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">Start date *</label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            value={renewalForm.startDate}
                                            onChange={handleRenewalChange}
                                            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">Expiry date *</label>
                                        <input
                                            type="date"
                                            name="expiryDate"
                                            value={renewalForm.expiryDate}
                                            onChange={handleRenewalChange}
                                            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">Due date *</label>
                                        <input
                                            type="date"
                                            name="dueDate"
                                            value={renewalForm.dueDate}
                                            onChange={handleRenewalChange}
                                            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">Notes</label>
                                    <textarea
                                        name="notes"
                                        value={renewalForm.notes}
                                        onChange={handleRenewalChange}
                                        rows={3}
                                        className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none"
                                    />
                                </div>
                                {formError && (
                                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
                                        {formError}
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50/60 px-6 py-4">
                                <button
                                    type="button"
                                    onClick={closeRenewalModal}
                                    className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-5 text-xs font-semibold text-white hover:bg-violet-700"
                                >
                                    <FileText size={15} />
                                    Generate Renewal
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {newAmcOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-end p-3 sm:p-5 lg:p-7">
                        <button
                            type="button"
                            aria-label="Close new AMC drawer"
                            onClick={closeNewAmcDrawer}
                            className="enterprise-backdrop absolute inset-0 bg-slate-950/55 backdrop-blur-[3px]"
                        />
                        <div className="enterprise-drawer relative z-10 flex h-[calc(100vh-24px)] w-full max-w-[980px] flex-col overflow-hidden rounded-[26px] border border-white/70 bg-[#f8fafc] shadow-[0_32px_100px_rgba(15,23,42,0.30)] sm:h-[calc(100vh-40px)] lg:h-[calc(100vh-56px)]">
                            <div className="relative flex min-h-[92px] shrink-0 items-center justify-between overflow-hidden border-b border-violet-100 bg-gradient-to-r from-violet-700 via-violet-600 to-indigo-600 px-7 text-white">
                                <div>
                                    <h2 className="text-xl font-bold tracking-[-0.02em] text-white">New AMC Contract</h2>
                                    <p className="mt-1.5 text-xs font-medium text-violet-100">Create, bill and assign a complete annual maintenance contract.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeNewAmcDrawer}
                                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <form
                                onSubmit={handleCreateAmcContract}
                                className="flex min-h-0 flex-1 flex-col"
                            >
                                <div className="flex-1 overflow-y-auto bg-slate-50/70 px-5 py-5 sm:px-7 sm:py-6">
                                    <div className="space-y-5">
                                        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.045)] sm:p-6">
                                            <div className="mb-5 flex items-start gap-3 border-b border-slate-100 pb-4">
                                                <h3 className="text-sm font-bold tracking-[-0.01em] text-slate-950">Client Information</h3>
                                                <p className="mt-1 text-[11px] leading-5 text-slate-500">Select the client and primary contact details.</p>
                                            </div>
                                            <div className="grid gap-x-5 gap-y-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-1.5 block text-[11px] font-bold text-slate-700">Client <span className="ml-1 text-rose-500">*</span></label>
                                                    <select
                                                        name="clientId"
                                                        value={newAmcForm.clientId}
                                                        disabled={mastersLoading}
                                                        onChange={(event) => {
                                                            const clientId = event.target.value;
                                                            const selectedClient = clients.find(
                                                                (client) => String(client.id) === String(clientId)
                                                            );
                                                            setNewAmcForm((current) => ({
                                                                ...current,
                                                                clientId,
                                                                clientCode: selectedClient?.clientCode || "",
                                                                clientName: selectedClient?.companyName || "",
                                                                contactPerson: selectedClient?.contactPerson || "",
                                                                contactMobile: selectedClient?.mobile || "",
                                                                contactEmail: selectedClient?.email || "",
                                                                clientProductId: "",
                                                                productId: "",
                                                                productCode: "",
                                                                productName: "",
                                                                productVersion: "",
                                                                plan: "Standard",
                                                                licensedUsers: "1",
                                                            }));
                                                            setNewAmcError("");
                                                        }}
                                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
                                                    >
                                                        <option value="">
                                                            {mastersLoading ? "Loading clients..." : "Select client"}
                                                        </option>
                                                        {clients.map((client) => (
                                                            <option key={client.id} value={client.id}>
                                                                {client.companyName}
                                                                {client.clientCode ? ` (${client.clientCode})` : ""}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="mb-1.5 block text-[11px] font-bold text-slate-700">Contact Person</label>
                                                    <input
                                                        type="text"
                                                        value={newAmcForm.contactPerson}
                                                        readOnly
                                                        placeholder="From Client Master"
                                                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 text-sm font-medium text-slate-500 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1.5 block text-[11px] font-bold text-slate-700">Mobile</label>
                                                    <input
                                                        type="text"
                                                        value={newAmcForm.contactMobile}
                                                        readOnly
                                                        placeholder="From Client Master"
                                                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 text-sm font-medium text-slate-500 outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </section>
                                        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.045)] sm:p-6">
                                            <div className="mb-5 flex items-start gap-3 border-b border-slate-100 pb-4">
                                                <h3 className="text-sm font-bold tracking-[-0.01em] text-slate-950">Product & Plan</h3>
                                                <p className="mt-1 text-[11px] leading-5 text-slate-500">Configure the software product and AMC plan.</p>
                                            </div>
                                            <div className="grid gap-x-5 gap-y-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-1.5 block text-[11px] font-bold text-slate-700">Client Product <span className="ml-1 text-rose-500">*</span></label>
                                                    <select
                                                        name="clientProductId"
                                                        value={newAmcForm.clientProductId}
                                                        disabled={!newAmcForm.clientId || mastersLoading}
                                                        onChange={(event) => {
                                                            const clientProductId = event.target.value;
                                                            const selectedProduct = availableClientProducts.find(
                                                                (product) => String(product.clientProductId) === String(clientProductId)
                                                            );
                                                            setNewAmcForm((current) => ({
                                                                ...current,
                                                                clientProductId,
                                                                productId: selectedProduct?.productId || "",
                                                                productCode: selectedProduct?.productCode || "",
                                                                productName: selectedProduct?.productName || "",
                                                                productVersion: selectedProduct?.version || "",
                                                                plan: ["Basic", "Standard", "Premium"].includes(selectedProduct?.supportType)
                                                                    ? selectedProduct.supportType
                                                                    : "Standard",
                                                                licensedUsers: String(selectedProduct?.licensedUsers || 1),
                                                            }));
                                                            setNewAmcError("");
                                                        }}
                                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
                                                    >
                                                        <option value="">
                                                            {!newAmcForm.clientId
                                                                ? "Select client first"
                                                                : availableClientProducts.length === 0
                                                                    ? "No assigned products"
                                                                    : "Select client product"}
                                                        </option>
                                                        {availableClientProducts.map((product) => (
                                                            <option key={product.clientProductId} value={product.clientProductId}>
                                                                {product.productCode ? `${product.productCode} - ` : ""}
                                                                {product.productName}
                                                                {product.version ? ` (${product.version})` : ""}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="mb-1.5 block text-[11px] font-bold text-slate-700">Product Version</label>
                                                    <input
                                                        type="text"
                                                        value={newAmcForm.productVersion}
                                                        readOnly
                                                        placeholder="From Client Product"
                                                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 text-sm font-medium text-slate-500 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1.5 block text-[11px] font-bold text-slate-700">AMC plan</label>
                                                    <select
                                                        name="plan"
                                                        value={newAmcForm.plan}
                                                        onChange={handleNewAmcChange}
                                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                    >
                                                        <option>Premium</option>
                                                        <option>Standard</option>
                                                        <option>Basic</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="mb-1.5 block text-[11px] font-bold text-slate-700">Number of users <span className="text-rose-500">*</span></label>
                                                    <input
                                                        type="number"
                                                        name="licensedUsers"
                                                        min="1"
                                                        value={newAmcForm.licensedUsers}
                                                        onChange={handleNewAmcChange}
                                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                    />
                                                </div>
                                            </div>
                                        </section>
                                        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.045)] sm:p-6">
                                            <div className="mb-5 flex items-start gap-3 border-b border-slate-100 pb-4">
                                                <h3 className="text-sm font-bold tracking-[-0.01em] text-slate-950">AMC Period & Billing</h3>
                                                <p className="mt-1 text-[11px] leading-5 text-slate-500">Set the AMC duration, amount and due date.</p>
                                            </div>
                                            <div className="grid gap-x-5 gap-y-4 md:grid-cols-3">
                                                <div>
                                                    <label className="mb-1.5 block text-[11px] font-bold text-slate-700">Start date <span className="text-rose-500">*</span></label>
                                                    <input
                                                        type="date"
                                                        name="startDate"
                                                        value={newAmcForm.startDate}
                                                        onChange={handleNewAmcChange}
                                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1.5 block text-[11px] font-bold text-slate-700">Expiry date <span className="text-rose-500">*</span></label>
                                                    <input
                                                        type="date"
                                                        name="expiryDate"
                                                        value={newAmcForm.expiryDate}
                                                        onChange={handleNewAmcChange}
                                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1.5 block text-[11px] font-bold text-slate-700">Due date <span className="text-rose-500">*</span></label>
                                                    <input
                                                        type="date"
                                                        name="dueDate"
                                                        value={newAmcForm.dueDate}
                                                        onChange={handleNewAmcChange}
                                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                                    <div>
                                                        <h4 className="text-sm font-bold text-slate-900">Invoice & GST</h4>
                                                        <p className="mt-1 text-[11px] text-slate-500">Choose invoice source and GST treatment for this AMC.</p>
                                                    </div>
                                                    <div className="rounded-lg bg-violet-50 px-3 py-2 text-right">
                                                        <p className="text-[9px] font-bold uppercase tracking-wider text-violet-500">Invoice Total</p>
                                                        <p className="mt-0.5 text-base font-extrabold text-violet-700">{formatCurrency(gstPreview.grandTotal)}</p>
                                                    </div>
                                                </div>

                                                <div className="mt-5 grid gap-4 md:grid-cols-2">
                                                    <div>
                                                        <label className="mb-2 block text-[11px] font-bold text-slate-700">Invoice source</label>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setNewAmcForm((current) => ({ ...current, invoiceSource: "SYSTEM" }));
                                                                    setNewAmcError("");
                                                                }}
                                                                className={`rounded-xl border px-3 py-3 text-left transition ${newAmcForm.invoiceSource === "SYSTEM" ? "border-violet-400 bg-violet-50 ring-2 ring-violet-100" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                                                            >
                                                                <p className="text-xs font-bold text-slate-900">System Invoice</p>
                                                                <p className="mt-1 text-[10px] text-slate-500">Generate from this AMC.</p>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setNewAmcForm((current) => ({ ...current, invoiceSource: "UPLOAD" }));
                                                                    setNewAmcError("");
                                                                }}
                                                                className={`rounded-xl border px-3 py-3 text-left transition ${newAmcForm.invoiceSource === "UPLOAD" ? "border-violet-400 bg-violet-50 ring-2 ring-violet-100" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                                                            >
                                                                <p className="text-xs font-bold text-slate-900">Upload Own Bill</p>
                                                                <p className="mt-1 text-[10px] text-slate-500">PDF / JPG / PNG receipt.</p>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="mb-2 block text-[11px] font-bold text-slate-700">GST applicable?</label>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => setNewAmcForm((current) => ({ ...current, gstApplicable: "YES" }))}
                                                                className={`h-12 rounded-xl border text-xs font-bold transition ${newAmcForm.gstApplicable === "YES" ? "border-emerald-400 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-100" : "border-slate-200 bg-white text-slate-600"}`}
                                                            >
                                                                Yes, Apply GST
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setNewAmcForm((current) => ({ ...current, gstApplicable: "NO", cgstRate: "0", sgstRate: "0", igstRate: "0" }))}
                                                                className={`h-12 rounded-xl border text-xs font-bold transition ${newAmcForm.gstApplicable === "NO" ? "border-slate-400 bg-slate-100 text-slate-800 ring-2 ring-slate-100" : "border-slate-200 bg-white text-slate-600"}`}
                                                            >
                                                                No / N.A.
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {newAmcForm.gstApplicable === "YES" && (
                                                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                                                        <div>
                                                            <label className="mb-1.5 block text-[11px] font-bold text-slate-700">GST rate</label>
                                                            <select name="gstRate" value={newAmcForm.gstRate} onChange={handleNewAmcChange} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100">
                                                                <option value="5">5%</option>
                                                                <option value="12">12%</option>
                                                                <option value="18">18%</option>
                                                                <option value="28">28%</option>
                                                                <option value="CUSTOM">Custom</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="mb-1.5 block text-[11px] font-bold text-slate-700">Tax type</label>
                                                            <select name="taxType" value={newAmcForm.taxType} onChange={handleNewAmcChange} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100">
                                                                <option value="CGST_SGST">CGST + SGST</option>
                                                                <option value="IGST">IGST</option>
                                                            </select>
                                                        </div>
                                                        {newAmcForm.gstRate === "CUSTOM" ? (
                                                            <div>
                                                                <label className="mb-1.5 block text-[11px] font-bold text-slate-700">Custom GST %</label>
                                                                <input type="number" name="customGstRate" min="0" max="100" step="0.01" value={newAmcForm.customGstRate} onChange={handleNewAmcChange} placeholder="e.g. 18" className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
                                                            </div>
                                                        ) : (
                                                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                                                                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Applied split</p>
                                                                <p className="mt-1 text-xs font-bold text-slate-700">{newAmcForm.taxType === "IGST" ? `IGST ${gstPreview.igstRate}%` : `CGST ${gstPreview.cgstRate}% + SGST ${gstPreview.sgstRate}%`}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {newAmcForm.invoiceSource === "UPLOAD" && (
                                                    <div className="mt-4 rounded-xl border border-dashed border-violet-300 bg-violet-50/50 p-4">
                                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                            <div>
                                                                <p className="text-xs font-bold text-slate-800">Self-made bill / receipt</p>
                                                                <p className="mt-1 text-[10px] text-slate-500">PDF, JPG, JPEG or PNG · maximum 10 MB. Document storage will be connected with the backend next.</p>
                                                            </div>
                                                            <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-violet-600 px-4 text-xs font-bold text-white hover:bg-violet-700">
                                                                Choose File
                                                                <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={handleOwnInvoiceFileChange} className="hidden" />
                                                            </label>
                                                        </div>
                                                        {ownInvoiceFile && (
                                                            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-violet-200 bg-white px-3 py-3">
                                                                <div className="min-w-0">
                                                                    <p className="truncate text-xs font-bold text-slate-800">{ownInvoiceFile.name}</p>
                                                                    <p className="mt-0.5 text-[10px] text-slate-500">{(ownInvoiceFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                                                </div>
                                                                <button type="button" onClick={() => setOwnInvoiceFile(null)} className="rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-rose-600 hover:bg-rose-50">Remove</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="mt-4 grid gap-2 rounded-xl bg-slate-950 p-4 text-white sm:grid-cols-4">
                                                    <div><p className="text-[9px] uppercase tracking-wider text-slate-400">Taxable</p><p className="mt-1 text-xs font-bold">{formatCurrency(gstPreview.taxableAmount)}</p></div>
                                                    <div><p className="text-[9px] uppercase tracking-wider text-slate-400">CGST</p><p className="mt-1 text-xs font-bold">{formatCurrency(gstPreview.cgstAmount)}</p></div>
                                                    <div><p className="text-[9px] uppercase tracking-wider text-slate-400">SGST / IGST</p><p className="mt-1 text-xs font-bold">{formatCurrency(gstPreview.sgstAmount + gstPreview.igstAmount)}</p></div>
                                                    <div><p className="text-[9px] uppercase tracking-wider text-violet-300">Grand Total</p><p className="mt-1 text-sm font-extrabold text-violet-200">{formatCurrency(gstPreview.grandTotal)}</p></div>
                                                </div>
                                            </div>
                                            <div className="mt-4 grid gap-x-5 gap-y-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-1.5 block text-[11px] font-bold text-slate-700">AMC amount <span className="text-rose-500">*</span></label>
                                                    <div className="relative">
                                                        <IndianRupee
                                                            size={16}
                                                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                                        />
                                                        <input
                                                            type="number"
                                                            name="taxableAmount"
                                                            min="0"
                                                            step="0.01"
                                                            value={newAmcForm.taxableAmount}
                                                            onChange={handleNewAmcChange}
                                                            placeholder="Enter taxable amount"
                                                            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="mb-1.5 block text-[11px] font-bold text-slate-700">Assigned Employee</label>
                                                    <select
                                                        name="assignedEmployeeId"
                                                        value={newAmcForm.assignedEmployeeId}
                                                        disabled={mastersLoading}
                                                        onChange={(event) => {
                                                            const employeeId = event.target.value;
                                                            const selectedEmployee = employees.find(
                                                                (employee) => String(employee.id) === String(employeeId)
                                                            );
                                                            setNewAmcForm((current) => ({
                                                                ...current,
                                                                assignedEmployeeId: employeeId,
                                                                assignedEmployeeCode: selectedEmployee?.employeeCode || "",
                                                                assignedEmployeeName: selectedEmployee?.name || "",
                                                            }));
                                                            setNewAmcError("");
                                                        }}
                                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
                                                    >
                                                        <option value="">Keep unassigned</option>
                                                        {employees.map((employee) => (
                                                            <option key={employee.id} value={employee.id}
                                                                disabled={employee.status === "Leave" || employee.status === "Inactive"}
                                                            >
                                                                {employee.name}
                                                                {employee.employeeCode ? ` (${employee.employeeCode})` : ""}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="mt-5">
                                                <label className="mb-1.5 block text-[11px] font-bold text-slate-700">Notes</label>
                                                <textarea
                                                    name="notes"
                                                    value={newAmcForm.notes}
                                                    onChange={handleNewAmcChange}
                                                    rows={4}
                                                    placeholder="Add contract notes, support terms or special conditions..."
                                                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-700 shadow-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                />
                                            </div>
                                        </section>
                                        {newAmcError && (
                                            <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 shadow-sm">
                                                <AlertCircle size={17} className="mt-0.5 shrink-0 text-rose-600" />
                                                <div>
                                                    <p className="text-xs font-semibold text-rose-800">Unable to create AMC contract</p>
                                                    <p className="mt-1 text-xs text-rose-700">{newAmcError}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
                                    <button
                                        type="button"
                                        onClick={closeNewAmcDrawer}
                                        className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={savingAmc}
                                        className="flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 text-xs font-bold text-white shadow-[0_10px_24px_rgba(124,58,237,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(124,58,237,0.34)] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <FileText size={15} />
                                        {savingAmc ? "Creating..." : "Create AMC Contract"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {invoiceRecord && (
                    <AmcInvoice
                        record={invoiceRecord}
                        onClose={() => setInvoiceRecord(null)}
                    />
                )}
                {historyInvoiceRecord && (
                    <AmcInvoice
                        record={historyInvoiceRecord}
                        onClose={() => setHistoryInvoiceRecord(null)}
                    />
                )}
                {reminderRecord && (
                    <AmcReminderModal
                        record={reminderRecord}
                        employees={employees}
                        saving={savingReminder}
                        onClose={() => {
                            if (!savingReminder) {
                                setReminderRecord(null);
                            }
                        }}
                        onSubmit={handleSaveReminder}
                    />
                )}
                {editAmcOpen && (
                    <EditAmcDrawer
                        isOpen={editAmcOpen}
                        onClose={closeEditAmcDrawer}
                        record={editAmcRecord}
                        form={editAmcForm}
                        onFormChange={handleEditAmcChange}
                        onFormUpdate={setEditAmcForm}
                        gstPreview={editGstPreview}
                        employees={employees}
                        saving={savingEditAmc}
                        error={editAmcError}
                        onSubmit={handleSaveEditAmc}
                    />
                )}
            </>
        );
    }
    if (
        selectedClientGroup
    ) {
        return (
            <>
                <div className="enterprise-page space-y-6">
                    {/* HEADER */}
                    <section className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4">
                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedClientGroup(
                                        null
                                    )
                                }
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
                            >
                                <ArrowLeft
                                    size={17}
                                />
                            </button>

                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-600">
                                    Client AMC
                                </p>

                                <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                                    {
                                        selectedClientGroup.clientName
                                    }
                                </h1>

                                <p className="mt-1 text-xs text-slate-500">
                                    {
                                        selectedClientGroup.clientCode ||
                                        "No client code"
                                    }
                                    {" · "}
                                    {
                                        selectedClientGroup.productCount
                                    }{" "}
                                    product
                                    {
                                        selectedClientGroup.productCount ===
                                            1
                                            ? ""
                                            : "s"
                                    }{" "}
                                    under AMC
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setNewAmcForm(
                                    {
                                        ...emptyNewAmcForm,

                                        clientId:
                                            selectedClientGroup.clientId,

                                        clientCode:
                                            selectedClientGroup.clientCode,

                                        clientName:
                                            selectedClientGroup.clientName,
                                    }
                                );

                                setNewAmcOpen(
                                    true
                                );
                            }}
                            className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white transition hover:bg-violet-700"
                        >
                            <Plus
                                size={15}
                            />

                            New AMC Contract
                        </button>
                    </section>

                    {/* CLIENT SUMMARY */}
                    <section className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:grid-cols-2 xl:grid-cols-4">
                        <div className="border-b border-slate-200 p-5 sm:border-r xl:border-b-0">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                Total AMC Billed
                            </p>

                            <p className="mt-2 text-xl font-semibold text-slate-950">
                                {formatCurrency(
                                    selectedClientGroup.totalAmount
                                )}
                            </p>
                        </div>

                        <div className="border-b border-slate-200 p-5 xl:border-b-0 xl:border-r">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                Received
                            </p>

                            <p className="mt-2 text-xl font-semibold text-emerald-700">
                                {formatCurrency(
                                    selectedClientGroup.paidAmount
                                )}
                            </p>
                        </div>

                        <div className="border-b border-slate-200 p-5 sm:border-r xl:border-b-0">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                Outstanding
                            </p>

                            <p className="mt-2 text-xl font-semibold text-amber-700">
                                {formatCurrency(
                                    selectedClientGroup.pendingAmount
                                )}
                            </p>
                        </div>

                        <div className="p-5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                Next Renewal
                            </p>

                            <p className="mt-2 text-xl font-semibold text-slate-950">
                                {
                                    selectedClientGroup.nextRenewal
                                }
                            </p>
                        </div>
                    </section>

                    {/* PRODUCT GROUPS */}
                    <section className="space-y-4">
                        {selectedClientProducts.map(
                            (productGroup) => {
                                const total =
                                    productGroup.records.reduce(
                                        (
                                            sum,
                                            record
                                        ) =>
                                            sum +
                                            Number(
                                                record.totalAmount ||
                                                record.amount ||
                                                0
                                            ),
                                        0
                                    );

                                const paid =
                                    productGroup.records.reduce(
                                        (
                                            sum,
                                            record
                                        ) =>
                                            sum +
                                            Number(
                                                record.paidAmount ||
                                                0
                                            ),
                                        0
                                    );

                                const pending =
                                    productGroup.records.reduce(
                                        (
                                            sum,
                                            record
                                        ) =>
                                            sum +
                                            Number(
                                                record.pendingAmount ||
                                                0
                                            ),
                                        0
                                    );

                                return (
                                    <article
                                        key={
                                            productGroup.key
                                        }
                                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]"
                                    >
                                        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h2 className="text-sm font-semibold text-slate-950">
                                                        {
                                                            productGroup.product
                                                        }
                                                    </h2>

                                                    {productGroup.productCode && (
                                                        <span className="rounded-md bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-500">
                                                            {
                                                                productGroup.productCode
                                                            }
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    {
                                                        productGroup.plan
                                                    }
                                                    {" · "}
                                                    {
                                                        productGroup.users
                                                    }{" "}
                                                    users
                                                    {productGroup.version
                                                        ? ` · ${productGroup.version}`
                                                        : ""}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-3 gap-5 text-right">
                                                <div>
                                                    <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                                        Billed
                                                    </p>

                                                    <p className="mt-1 text-xs font-semibold text-slate-800">
                                                        {formatCurrency(
                                                            total
                                                        )}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                                        Received
                                                    </p>

                                                    <p className="mt-1 text-xs font-semibold text-emerald-700">
                                                        {formatCurrency(
                                                            paid
                                                        )}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                                        Pending
                                                    </p>

                                                    <p className="mt-1 text-xs font-semibold text-amber-700">
                                                        {formatCurrency(
                                                            pending
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="min-w-full">
                                                <thead>
                                                    <tr className="border-b border-slate-200 bg-slate-50/80">
                                                        <th className="px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                            AMC Period
                                                        </th>

                                                        <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                            Invoice
                                                        </th>

                                                        <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                            Total
                                                        </th>

                                                        <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                            Paid
                                                        </th>

                                                        <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                            Pending
                                                        </th>

                                                        <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                            Status
                                                        </th>

                                                        <th className="px-5 py-3 text-right text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {productGroup.records.map(
                                                        (
                                                            record
                                                        ) => (
                                                            <tr
                                                                key={
                                                                    record.id
                                                                }
                                                                className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                                                            >
                                                                <td className="px-5 py-4 text-xs text-slate-600">
                                                                    {
                                                                        record.startDate
                                                                    }
                                                                    <span className="mx-1 text-slate-300">
                                                                        →
                                                                    </span>
                                                                    {
                                                                        record.expiryDate
                                                                    }
                                                                </td>

                                                                <td className="px-4 py-4">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setInvoiceRecord(
                                                                                record
                                                                            )
                                                                        }
                                                                        className="text-left text-xs font-semibold text-violet-700 hover:underline"
                                                                    >
                                                                        {
                                                                            record.invoiceNo ||
                                                                            "Open invoice"
                                                                        }
                                                                    </button>

                                                                    <p className="mt-1 text-[10px] text-slate-400">
                                                                        Due{" "}
                                                                        {
                                                                            record.dueDate
                                                                        }
                                                                    </p>
                                                                </td>

                                                                <td className="px-4 py-4 text-xs font-semibold text-slate-800">
                                                                    {formatCurrency(
                                                                        record.totalAmount ||
                                                                        record.amount
                                                                    )}
                                                                </td>

                                                                <td className="px-4 py-4 text-xs font-semibold text-emerald-700">
                                                                    {formatCurrency(
                                                                        record.paidAmount
                                                                    )}
                                                                </td>

                                                                <td className="px-4 py-4 text-xs font-semibold text-amber-700">
                                                                    {formatCurrency(
                                                                        record.pendingAmount
                                                                    )}
                                                                </td>

                                                                <td className="px-4 py-4">
                                                                    <StatusBadge
                                                                        status={
                                                                            record.status
                                                                        }
                                                                    />
                                                                </td>

                                                                <td className="px-5 py-4">
                                                                    <div className="flex justify-end gap-2">
                                                                        {record.pendingAmount >
                                                                            0 && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        openPaymentModal(
                                                                                            record
                                                                                        )
                                                                                    }
                                                                                    className="flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100"
                                                                                >
                                                                                    <IndianRupee
                                                                                        size={
                                                                                            13
                                                                                        }
                                                                                    />
                                                                                    Payment
                                                                                </button>
                                                                            )}

                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                handleOpenAmcInvoiceDetail(
                                                                                    record
                                                                                )
                                                                            }
                                                                            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
                                                                        >
                                                                            <Eye
                                                                                size={
                                                                                    13
                                                                                }
                                                                            />
                                                                            Open
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                openRenewalModal(
                                                                                    record
                                                                                )
                                                                            }
                                                                            className="flex h-9 items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 text-[10px] font-semibold text-amber-700 hover:bg-amber-100"
                                                                            title="Renew AMC Contract"
                                                                        >
                                                                            <RefreshCw
                                                                                size={
                                                                                    13
                                                                                }
                                                                            />
                                                                            Renew
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                handleOpenEditAmc(
                                                                                    record
                                                                                )
                                                                            }
                                                                            className="flex h-9 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 text-[10px] font-semibold text-blue-700 hover:bg-blue-100"
                                                                            title="Edit AMC Contract"
                                                                        >
                                                                            <Pencil
                                                                                size={
                                                                                    13
                                                                                }
                                                                            />
                                                                            Edit
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                handleDeleteAmc(
                                                                                    record
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                deletingAmcId ===
                                                                                (record.mongoId ||
                                                                                    record.id)
                                                                            }
                                                                            className="flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-[10px] font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                                                                            title="Delete AMC Contract"
                                                                        >
                                                                            <Trash2
                                                                                size={
                                                                                    13
                                                                                }
                                                                            />
                                                                            Delete
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </article>
                                );
                            }
                        )}
                    </section>
                </div>

                {paymentRecord && (
                    // KEEP YOUR EXISTING PAYMENT MODAL HERE
                    // DO NOT COPY THIS COMMENT.
                    // Use the same payment modal currently used in the file.
                    null
                )}

                {invoiceRecord && (
                    <AmcInvoice
                        record={
                            invoiceRecord
                        }
                        onClose={() =>
                            setInvoiceRecord(
                                null
                            )
                        }
                    />
                )}

                {editAmcOpen && (
                    <EditAmcDrawer
                        isOpen={editAmcOpen}
                        onClose={closeEditAmcDrawer}
                        record={editAmcRecord}
                        form={editAmcForm}
                        onFormChange={handleEditAmcChange}
                        onFormUpdate={setEditAmcForm}
                        gstPreview={editGstPreview}
                        employees={employees}
                        saving={savingEditAmc}
                        error={editAmcError}
                        onSubmit={handleSaveEditAmc}
                    />
                )}

                {renewalRecord && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <button
                            type="button"
                            onClick={closeRenewalModal}
                            className="enterprise-backdrop absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
                        />
                        <form
                            onSubmit={handleGenerateRenewal}
                            className="enterprise-modal relative w-full max-w-[620px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                        >
                            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                                <div>
                                    <h2 className="text-base font-semibold text-slate-950">Renew AMC Contract</h2>
                                    <p className="mt-1 text-xs text-slate-500">{renewalRecord.client || renewalRecord.clientName} · {renewalRecord.product || renewalRecord.productName}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeRenewalModal}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500"
                                >
                                    <X size={17} />
                                </button>
                            </div>
                            <div className="space-y-5 px-6 py-6">
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">AMC amount *</label>
                                        <input
                                            type="number"
                                            name="amount"
                                            value={renewalForm.amount}
                                            onChange={handleRenewalChange}
                                            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">Plan</label>
                                        <select
                                            name="plan"
                                            value={renewalForm.plan}
                                            onChange={handleRenewalChange}
                                            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                                        >
                                            <option>Premium</option>
                                            <option>Standard</option>
                                            <option>Basic</option>
                                            <option>Custom</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid gap-5 sm:grid-cols-3">
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">Start date *</label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            value={renewalForm.startDate}
                                            onChange={handleRenewalChange}
                                            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">Expiry date *</label>
                                        <input
                                            type="date"
                                            name="expiryDate"
                                            value={renewalForm.expiryDate}
                                            onChange={handleRenewalChange}
                                            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">Due date *</label>
                                        <input
                                            type="date"
                                            name="dueDate"
                                            value={renewalForm.dueDate}
                                            onChange={handleRenewalChange}
                                            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">Notes</label>
                                    <textarea
                                        name="notes"
                                        value={renewalForm.notes}
                                        onChange={handleRenewalChange}
                                        rows={3}
                                        className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none"
                                    />
                                </div>
                                {formError && (
                                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
                                        {formError}
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50/60 px-6 py-4">
                                <button
                                    type="button"
                                    onClick={closeRenewalModal}
                                    className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingAmc}
                                    className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                                >
                                    <FileText size={15} />
                                    {savingAmc ? "Renewing..." : "Generate Renewal"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </>
        );
    }
    // Original main content (list view)
    return (
        <>
            <div className="enterprise-page space-y-6">
                {/* Heading */}
                <section className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                            Revenue Operations
                        </div>
                        <h1 className="mt-0.5 text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                            AMC Contracts & Billing
                        </h1>
                        <p className="mt-0.5 max-w-2xl text-xs text-slate-500">
                            Manage annual maintenance contracts, renewals, invoices, reminders and client payments.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setNewAmcError("");
                                setNewAmcOpen(true);
                            }}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-[#1548D1] active:bg-[#0F3DB8] transition"
                        >
                            <Plus size={15} strokeWidth={2.5} />
                            <span>New AMC Contract</span>
                        </button>
                    </div>
                </section>

                {/* Main Navigation Tabs */}
                <div className="flex items-center gap-1 border-b border-slate-200">
                    <button
                        type="button"
                        onClick={() => setAmcMainTab("contracts")}
                        className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
                            amcMainTab === "contracts"
                                ? "border-blue-600 text-blue-600 font-bold"
                                : "border-transparent text-slate-500 hover:text-slate-900"
                        }`}
                    >
                        <FolderOpen size={15} />
                        <span>AMC Contracts</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            {records.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setAmcMainTab("requests");
                            loadAdminAmcRequests();
                        }}
                        className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
                            amcMainTab === "requests"
                                ? "border-blue-600 text-blue-600 font-bold"
                                : "border-transparent text-slate-500 hover:text-slate-900"
                        }`}
                    >
                        <RefreshCw size={15} />
                        <span>Renewal Requests</span>
                        {pendingAmcRequestsCount > 0 ? (
                            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                                {pendingAmcRequestsCount} Pending
                            </span>
                        ) : (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                {adminAmcRequests.length}
                            </span>
                        )}
                    </button>
                </div>

                {amcMainTab === "requests" ? (
                    <AmcRenewalRequestsTab
                        requests={adminAmcRequests}
                        loading={adminRequestsLoading}
                        error={adminRequestsError}
                        onRefresh={loadAdminAmcRequests}
                        records={records}
                        onOpenContract={handleOpenAmcContractFromRequest}
                        onGoToRenewal={handleGoToAmcRenewalFromRequest}
                    />
                ) : (
                    <>
                        {/* Statistics - High Density Linear Standard */}
                        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <button
                        type="button"
                        onClick={() => setActiveSummary("Collected")}
                        className={`rounded-xl border p-3.5 text-left transition shadow-2xs ${
                            activeSummary === "Collected"
                                ? "border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20"
                                : "border-slate-200/90 bg-white hover:border-slate-300"
                        }`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    AMC Collected
                                </p>
                                <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                                    {formatCurrency(stats.totalCollected)}
                                </p>
                                <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                                    <TrendingUp size={13} />
                                    Payments received
                                </p>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                <IndianRupee size={16} />
                            </div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveSummary("Pending")}
                        className={`rounded-xl border p-3.5 text-left transition shadow-2xs ${
                            activeSummary === "Pending"
                                ? "border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20"
                                : "border-slate-200/90 bg-white hover:border-slate-300"
                        }`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    Pending Amount
                                </p>
                                <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                                    {formatCurrency(stats.totalPending)}
                                </p>
                                <p className="mt-1 text-[11px] font-medium text-amber-600">
                                    Awaiting collection
                                </p>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                                <WalletCards size={16} />
                            </div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveSummary("Overdue")}
                        className={`rounded-xl border p-3.5 text-left transition shadow-2xs ${
                            activeSummary === "Overdue"
                                ? "border-rose-500 bg-rose-50/40 ring-2 ring-rose-500/20"
                                : "border-slate-200/90 bg-white hover:border-slate-300"
                        }`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    Overdue Renewals
                                </p>
                                <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                                    {stats.overdueCount}
                                </p>
                                <p className="mt-1 text-[11px] font-medium text-rose-600">
                                    Need immediate follow-up
                                </p>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                                <AlertCircle size={16} />
                            </div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveSummary("Upcoming")}
                        className={`rounded-xl border p-3.5 text-left transition shadow-2xs ${
                            activeSummary === "Upcoming"
                                ? "border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20"
                                : "border-slate-200/90 bg-white hover:border-slate-300"
                        }`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    Upcoming Renewals
                                </p>
                                <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                                    {stats.upcomingCount}
                                </p>
                                <p className="mt-1 text-[11px] font-medium text-blue-600">
                                    Pending & upcoming
                                </p>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                <CalendarDays size={16} />
                            </div>
                        </div>
                    </button>
                </section>

                {/* Modern Zoho-Grade AMC Contracts & Renewals DataTable */}
                <DataTable
                    moduleName="AMC Contracts"
                    viewTitle="All AMC Contracts"
                    views={[
                        { id: "all", label: "All AMC Contracts" },
                        { id: "Collected", label: "Active & Paid" },
                        { id: "Upcoming", label: "Upcoming Renewals" },
                        { id: "Overdue", label: "Overdue Renewals" },
                    ]}
                    activeView={activeSummary === "All" ? "all" : activeSummary}
                    onViewChange={(id) => setActiveSummary(id === "all" ? "All" : id)}
                    onCreateClick={() => {
                        setNewAmcError("");
                        setNewAmcOpen(true);
                    }}
                    createButtonLabel="New AMC Contract"
                    selectable={true}
                    columns={[
                        {
                            key: "clientName",
                            label: "Client",
                            sortable: true,
                            render: (_, clientGroup) => (
                                <div className="flex min-w-[200px] items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-xs font-bold text-violet-700">
                                        {clientGroup.clientName
                                            ?.split(" ")
                                            .slice(0, 2)
                                            .map((w) => w[0])
                                            .join("")
                                            .toUpperCase() || "C"}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="max-w-[200px] truncate text-xs font-semibold text-slate-900">
                                            {clientGroup.clientName}
                                        </p>
                                        <p className="mt-0.5 text-[10px] text-slate-400">
                                            {clientGroup.clientCode || "No client code"}
                                        </p>
                                    </div>
                                </div>
                            ),
                        },
                        {
                            key: "productCount",
                            label: "Products",
                            sortable: true,
                            render: (val) => (
                                <div>
                                    <p className="text-xs font-semibold text-slate-800">{val}</p>
                                    <p className="text-[10px] text-slate-400">
                                        Product{val === 1 ? "" : "s"}
                                    </p>
                                </div>
                            ),
                        },
                        {
                            key: "recordCount",
                            label: "AMC Invoices",
                            sortable: true,
                            render: (_, clientGroup) => (
                                <div>
                                    <p className="text-xs font-semibold text-slate-800">
                                        {clientGroup.records?.length || 0}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                        AMC invoice{clientGroup.records?.length === 1 ? "" : "s"}
                                    </p>
                                </div>
                            ),
                        },
                        {
                            key: "totalAmount",
                            label: "Total Billed",
                            sortable: true,
                            render: (val) => (
                                <span className="text-xs font-semibold text-slate-900">
                                    {formatCurrency(val)}
                                </span>
                            ),
                        },
                        {
                            key: "paidAmount",
                            label: "Received",
                            sortable: true,
                            render: (val) => (
                                <span className="text-xs font-semibold text-emerald-700">
                                    {formatCurrency(val)}
                                </span>
                            ),
                        },
                        {
                            key: "pendingAmount",
                            label: "Pending",
                            sortable: true,
                            render: (_, clientGroup) => (
                                <div>
                                    <p
                                        className={`text-xs font-semibold ${
                                            clientGroup.pendingAmount > 0
                                                ? "text-rose-600"
                                                : "text-emerald-700"
                                        }`}
                                    >
                                        {formatCurrency(clientGroup.pendingAmount)}
                                    </p>
                                    {clientGroup.overdueCount > 0 && (
                                        <p className="mt-0.5 text-[10px] font-medium text-rose-500">
                                            {clientGroup.overdueCount} overdue
                                        </p>
                                    )}
                                </div>
                            ),
                        },
                        {
                            key: "nextRenewal",
                            label: "Next Renewal",
                            sortable: true,
                            render: (_, clientGroup) => (
                                <div>
                                    <p className="whitespace-nowrap text-xs font-semibold text-slate-700">
                                        {clientGroup.nextRenewal}
                                    </p>
                                    {clientGroup.upcomingCount > 0 && (
                                        <p className="mt-0.5 text-[10px] text-violet-500">
                                            {clientGroup.upcomingCount} active / upcoming
                                        </p>
                                    )}
                                </div>
                            ),
                        },
                    ]}
                    data={groupedClients}
                    loading={recordsLoading}
                    error={null}
                    onRetry={loadAmcContracts}
                    idKey="key"
                    onRowClick={(clientGroup) => setSelectedClientGroup(clientGroup)}
                    searchPlaceholder="Search client, product, invoice..."
                    statusFilters={statusOptions.map((s) => ({ label: s, value: s }))}
                    activeStatusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    toolbarActions={
                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                value={productFilter}
                                onChange={(e) => setProductFilter(e.target.value)}
                                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-hidden"
                            >
                                {productFilterOptions.map((product) => (
                                    <option key={product} value={product}>
                                        {product}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={planFilter}
                                onChange={(e) => setPlanFilter(e.target.value)}
                                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-hidden"
                            >
                                {planOptions.map((plan) => (
                                    <option key={plan} value={plan}>
                                        {plan}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="button"
                                onClick={loadAmcContracts}
                                disabled={recordsLoading}
                                className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
                            >
                                <RefreshCw
                                    size={12}
                                    className={recordsLoading ? "animate-spin text-violet-600" : ""}
                                />
                                Refresh
                            </button>
                        </div>
                    }
                    rowActions={[
                        {
                            label: "View AMC",
                            icon: Eye,
                            className: "text-violet-600 hover:text-violet-800 hover:bg-violet-50",
                            onClick: (clientGroup) => setSelectedClientGroup(clientGroup),
                        },
                        {
                            label: "Renew AMC",
                            icon: RefreshCw,
                            className: "text-amber-600 hover:text-amber-800 hover:bg-amber-50",
                            onClick: (clientGroup) => handleRenewClientGroupAmc(clientGroup),
                        },
                        {
                            label: "Edit AMC",
                            icon: Pencil,
                            className: "text-blue-600 hover:text-blue-800 hover:bg-blue-50",
                            onClick: (clientGroup) => handleEditClientGroupAmc(clientGroup),
                        },
                        {
                            label: "Delete AMC",
                            icon: Trash2,
                            className: "text-rose-600 hover:text-rose-800 hover:bg-rose-50",
                            onClick: (clientGroup) => handleDeleteClientGroupAmc(clientGroup),
                        },
                    ]}
                    initialPageSize={25}
                    emptyTitle="No AMC clients found"
                    emptyDescription="Try changing your search or filters or create a new AMC contract."
                />
                    </>
                )}
            </div>

            {/* Modals (only visible when not in detail view) */}
            {paymentRecord && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <button
                        type="button"
                        onClick={closePaymentModal}
                        className="enterprise-backdrop absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
                    />
                    <form
                        onSubmit={handleRecordPayment}
                        className="enterprise-modal relative w-full max-w-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                    >
                        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                            <div>
                                <h2 className="text-base font-semibold text-slate-950">Record AMC Payment</h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    {paymentRecord.client} · Pending {formatCurrency(paymentRecord.pendingAmount)}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closePaymentModal}
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500"
                            >
                                <X size={17} />
                            </button>
                        </div>
                        <div className="space-y-5 px-6 py-6">
                            <div className="grid gap-5 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">Payment amount *</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={paymentForm.amount}
                                        onChange={handlePaymentChange}
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">Payment date *</label>
                                    <input
                                        type="date"
                                        name="paymentDate"
                                        value={paymentForm.paymentDate}
                                        onChange={handlePaymentChange}
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-5 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">Payment mode</label>
                                    <select
                                        name="mode"
                                        value={paymentForm.mode}
                                        onChange={handlePaymentChange}
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                                    >
                                        <option>Bank Transfer</option>
                                        <option>UPI</option>
                                        <option>Cheque</option>
                                        <option>Cash</option>
                                        <option>Card</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">Reference number</label>
                                    <input
                                        name="referenceNo"
                                        value={paymentForm.referenceNo}
                                        onChange={handlePaymentChange}
                                        placeholder="UTR / cheque / transaction no."
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-semibold text-slate-700">Notes</label>
                                <textarea
                                    name="notes"
                                    value={paymentForm.notes}
                                    onChange={handlePaymentChange}
                                    rows={3}
                                    className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none"
                                />
                            </div>
                            {formError && (
                                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
                                    {formError}
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50/60 px-6 py-4">
                            <button
                                type="button"
                                disabled={savingPayment}
                                onClick={closePaymentModal}
                                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                                <ReceiptIndianRupee size={15} />
                                Save Payment
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {renewalRecord && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <button
                        type="button"
                        onClick={closeRenewalModal}
                        className="enterprise-backdrop absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
                    />
                    <form
                        onSubmit={handleGenerateRenewal}
                        className="enterprise-modal relative w-full max-w-[620px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                    >
                        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                            <div>
                                <h2 className="text-base font-semibold text-slate-950">Renew AMC Contract</h2>
                                <p className="mt-1 text-xs text-slate-500">{renewalRecord.client} · {renewalRecord.product}</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeRenewalModal}
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500"
                            >
                                <X size={17} />
                            </button>
                        </div>
                        <div className="space-y-5 px-6 py-6">
                            <div className="grid gap-5 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">AMC amount *</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={renewalForm.amount}
                                        onChange={handleRenewalChange}
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">Plan</label>
                                    <select
                                        name="plan"
                                        value={renewalForm.plan}
                                        onChange={handleRenewalChange}
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                                    >
                                        <option>Premium</option>
                                        <option>Standard</option>
                                        <option>Basic</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid gap-5 sm:grid-cols-3">
                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">Start date *</label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={renewalForm.startDate}
                                        onChange={handleRenewalChange}
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">Expiry date *</label>
                                    <input
                                        type="date"
                                        name="expiryDate"
                                        value={renewalForm.expiryDate}
                                        onChange={handleRenewalChange}
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">Due date *</label>
                                    <input
                                        type="date"
                                        name="dueDate"
                                        value={renewalForm.dueDate}
                                        onChange={handleRenewalChange}
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-semibold text-slate-700">Notes</label>
                                <textarea
                                    name="notes"
                                    value={renewalForm.notes}
                                    onChange={handleRenewalChange}
                                    rows={3}
                                    className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none"
                                />
                            </div>
                            {formError && (
                                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
                                    {formError}
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50/60 px-6 py-4">
                            <button
                                type="button"
                                onClick={closeRenewalModal}
                                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-5 text-xs font-semibold text-white hover:bg-violet-700"
                            >
                                <FileText size={15} />
                                Generate Renewal
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {newAmcOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-end p-3 sm:p-5 lg:p-7">

                    {/* BACKDROP */}
                    <button
                        type="button"
                        aria-label="Close new AMC drawer"
                        onClick={closeNewAmcDrawer}
                        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[3px]"
                    />

                    {/* MAIN MODAL */}
                    <div className="relative z-10 flex h-[calc(100vh-24px)] w-full max-w-[980px] flex-col overflow-hidden rounded-[24px] border border-white/70 bg-slate-50 shadow-[0_30px_100px_rgba(15,23,42,0.30)] sm:h-[calc(100vh-40px)] lg:h-[calc(100vh-56px)]">

                        {/* =====================================================
                HEADER
            ====================================================== */}
                        <div className="relative flex min-h-[88px] shrink-0 items-center justify-between overflow-hidden border-b border-violet-500/20 bg-gradient-to-r from-violet-700 via-violet-600 to-indigo-600 px-7">

                            <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-white/10" />
                            <div className="absolute right-32 top-10 h-24 w-24 rounded-full bg-white/5" />

                            <div className="relative flex items-center gap-4">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                                    <FileText size={21} className="text-white" />
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold tracking-[-0.02em] text-white">
                                        New AMC Contract
                                    </h2>

                                    <p className="mt-1 text-xs font-medium text-violet-100">
                                        Create annual maintenance contract, billing and assignment.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={closeNewAmcDrawer}
                                className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        {/* =====================================================
                FORM
            ====================================================== */}
                        <form
                            onSubmit={handleCreateAmcContract}
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            {/* SCROLLABLE CONTENT */}
                            <div className="min-h-0 flex-1 overflow-y-auto">

                                <div className="mx-auto max-w-[920px] space-y-5 p-6 lg:p-7">

                                    {/* ERROR */}
                                    {newAmcError && (
                                        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                            <AlertCircle size={17} className="mt-0.5 shrink-0" />

                                            <span>
                                                {newAmcError}
                                            </span>
                                        </div>
                                    )}

                                    {mastersError && (
                                        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                            <AlertCircle size={17} className="mt-0.5 shrink-0" />

                                            <span>
                                                {mastersError}
                                            </span>
                                        </div>
                                    )}

                                    {/* =================================================
                            CLIENT INFORMATION
                        ================================================== */}
                                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                                        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                                                <UserRound size={17} />
                                            </div>

                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900">
                                                    Client Information
                                                </h3>

                                                <p className="mt-0.5 text-[11px] text-slate-500">
                                                    Select the client and verify contact details.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">

                                            {/* CLIENT */}
                                            <div className="md:col-span-2">
                                                <label className="mb-1.5 block text-[11px] font-bold text-slate-600">
                                                    Client
                                                    <span className="ml-1 text-rose-500">*</span>
                                                </label>

                                                <select
                                                    name="clientId"
                                                    value={newAmcForm.clientId}
                                                    disabled={mastersLoading}
                                                    onChange={(event) => {
                                                        const clientId = event.target.value;

                                                        const client =
                                                            clients.find(
                                                                (item) =>
                                                                    String(item.id) ===
                                                                    String(clientId)
                                                            ) || null;

                                                        setNewAmcForm((current) => ({
                                                            ...current,

                                                            clientId,

                                                            clientCode:
                                                                client?.clientCode || "",

                                                            clientName:
                                                                client?.companyName || "",

                                                            contactPerson:
                                                                client?.contactPerson || "",

                                                            contactMobile:
                                                                client?.mobile || "",

                                                            contactEmail:
                                                                client?.email || "",

                                                            clientProductId: "",
                                                            productId: "",
                                                            productCode: "",
                                                            productName: "",
                                                            productVersion: "",
                                                        }));

                                                        if (newAmcError) {
                                                            setNewAmcError("");
                                                        }
                                                    }}
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 disabled:bg-slate-50"
                                                >
                                                    <option value="">
                                                        {mastersLoading
                                                            ? "Loading clients..."
                                                            : "Select client"}
                                                    </option>

                                                    {clients.map((client) => (
                                                        <option
                                                            key={client.id}
                                                            value={client.id}
                                                        >
                                                            {client.companyName}
                                                            {client.clientCode
                                                                ? ` — ${client.clientCode}`
                                                                : ""}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* CONTACT */}
                                            <div>
                                                <label className="mb-1.5 block text-[11px] font-bold text-slate-600">
                                                    Contact Person
                                                </label>

                                                <input
                                                    type="text"
                                                    value={newAmcForm.contactPerson}
                                                    readOnly
                                                    placeholder="From Client Master"
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-600 outline-none"
                                                />
                                            </div>

                                            {/* MOBILE */}
                                            <div>
                                                <label className="mb-1.5 block text-[11px] font-bold text-slate-600">
                                                    Mobile
                                                </label>

                                                <input
                                                    type="text"
                                                    value={newAmcForm.contactMobile}
                                                    readOnly
                                                    placeholder="From Client Master"
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-600 outline-none"
                                                />
                                            </div>

                                            {/* EMAIL */}
                                            <div className="md:col-span-2">
                                                <label className="mb-1.5 block text-[11px] font-bold text-slate-600">
                                                    Email
                                                </label>

                                                <input
                                                    type="text"
                                                    value={newAmcForm.contactEmail}
                                                    readOnly
                                                    placeholder="From Client Master"
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-600 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </section>

                                    {/* =================================================
                            PRODUCT & PLAN
                        ================================================== */}
                                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                                        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                                                <FolderOpen size={17} />
                                            </div>

                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900">
                                                    Product & Plan
                                                </h3>

                                                <p className="mt-0.5 text-[11px] text-slate-500">
                                                    Configure software product, AMC plan and licensed users.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 lg:grid-cols-3">

                                            <div className="md:col-span-2">
                                                <label className="mb-1.5 block text-[11px] font-bold text-slate-600">
                                                    Client Product
                                                    <span className="ml-1 text-rose-500">*</span>
                                                </label>

                                                <select
                                                    name="clientProductId"
                                                    value={newAmcForm.clientProductId}
                                                    disabled={!newAmcForm.clientId}
                                                    onChange={(event) => {
                                                        const clientProductId =
                                                            event.target.value;

                                                        const product =
                                                            availableClientProducts.find(
                                                                (item) =>
                                                                    String(
                                                                        item.clientProductId
                                                                    ) ===
                                                                    String(clientProductId)
                                                            ) || null;

                                                        setNewAmcForm((current) => ({
                                                            ...current,

                                                            clientProductId,

                                                            productId:
                                                                product?.productId || "",

                                                            productCode:
                                                                product?.productCode || "",

                                                            productName:
                                                                product?.productName || "",

                                                            productVersion:
                                                                product?.version || "",

                                                            licensedUsers: String(
                                                                product?.licensedUsers || 1
                                                            ),

                                                            plan:
                                                                product?.supportType ||
                                                                current.plan,
                                                        }));

                                                        if (newAmcError) {
                                                            setNewAmcError("");
                                                        }
                                                    }}
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 disabled:bg-slate-50"
                                                >
                                                    <option value="">
                                                        {!newAmcForm.clientId
                                                            ? "Select client first"
                                                            : "Select client product"}
                                                    </option>

                                                    {availableClientProducts.map(
                                                        (product) => (
                                                            <option
                                                                key={
                                                                    product.clientProductId
                                                                }
                                                                value={
                                                                    product.clientProductId
                                                                }
                                                            >
                                                                {product.productName}
                                                                {product.productCode
                                                                    ? ` — ${product.productCode}`
                                                                    : ""}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="mb-1.5 block text-[11px] font-bold text-slate-600">
                                                    Product Version
                                                </label>

                                                <input
                                                    value={
                                                        selectedNewAmcProduct?.version ||
                                                        newAmcForm.productVersion
                                                    }
                                                    readOnly
                                                    placeholder="From Client Product"
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-600 outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-1.5 block text-[11px] font-bold text-slate-600">
                                                    AMC Plan
                                                </label>

                                                <select
                                                    name="plan"
                                                    value={newAmcForm.plan}
                                                    onChange={handleNewAmcChange}
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
                                                >
                                                    <option value="Premium">Premium</option>
                                                    <option value="Standard">Standard</option>
                                                    <option value="Basic">Basic</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="mb-1.5 block text-[11px] font-bold text-slate-600">
                                                    Licensed Users
                                                </label>

                                                <input
                                                    type="number"
                                                    min="1"
                                                    name="licensedUsers"
                                                    value={newAmcForm.licensedUsers}
                                                    onChange={handleNewAmcChange}
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-1.5 block text-[11px] font-bold text-slate-600">
                                                    Assigned Employee
                                                </label>

                                                <select
                                                    name="assignedEmployeeId"
                                                    value={newAmcForm.assignedEmployeeId}
                                                    onChange={handleNewAmcChange}
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
                                                >
                                                    <option value="">
                                                        Unassigned
                                                    </option>

                                                    {employees.map((employee) => (
                                                        <option
                                                            key={employee.id}
                                                            value={employee.id}
                                                        >
                                                            {employee.name}
                                                            {employee.employeeCode
                                                                ? ` — ${employee.employeeCode}`
                                                                : ""}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </section>

                                    {/* =================================================
                            AMC PERIOD
                        ================================================== */}
                                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                                        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                                                <CalendarDays size={17} />
                                            </div>

                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900">
                                                    AMC Period
                                                </h3>

                                                <p className="mt-0.5 text-[11px] text-slate-500">
                                                    Set contract validity and payment due date.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3">

                                            <div>
                                                <label className="mb-1.5 block text-[11px] font-bold text-slate-600">
                                                    Start Date
                                                    <span className="ml-1 text-rose-500">*</span>
                                                </label>

                                                <input
                                                    type="date"
                                                    name="startDate"
                                                    value={newAmcForm.startDate}
                                                    onChange={handleNewAmcChange}
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-1.5 block text-[11px] font-bold text-slate-600">
                                                    Expiry Date
                                                    <span className="ml-1 text-rose-500">*</span>
                                                </label>

                                                <input
                                                    type="date"
                                                    name="expiryDate"
                                                    value={newAmcForm.expiryDate}
                                                    onChange={handleNewAmcChange}
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-1.5 block text-[11px] font-bold text-slate-600">
                                                    Payment Due Date
                                                    <span className="ml-1 text-rose-500">*</span>
                                                </label>

                                                <input
                                                    type="date"
                                                    name="dueDate"
                                                    value={newAmcForm.dueDate}
                                                    onChange={handleNewAmcChange}
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
                                                />
                                            </div>
                                        </div>
                                    </section>

                                    {/* =================================================
                            BILLING & GST
                        ================================================== */}
                                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                                        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                                <ReceiptIndianRupee size={17} />
                                            </div>

                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900">
                                                    Billing & GST
                                                </h3>

                                                <p className="mt-0.5 text-[11px] text-slate-500">
                                                    Configure AMC amount, GST structure and invoice source.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-5">

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

                                                <div className="lg:col-span-2">
                                                    <label className="mb-1.5 block text-[11px] font-bold text-slate-600">
                                                        Taxable AMC Amount
                                                        <span className="ml-1 text-rose-500">*</span>
                                                    </label>

                                                    <div className="relative">
                                                        <IndianRupee
                                                            size={15}
                                                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                                        />

                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            name="taxableAmount"
                                                            value={
                                                                newAmcForm.taxableAmount
                                                            }
                                                            onChange={handleNewAmcChange}
                                                            placeholder="Enter AMC amount"
                                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="mb-1.5 block text-[11px] font-bold text-slate-600">
                                                        GST Applicable
                                                    </label>

                                                    <select
                                                        name="gstApplicable"
                                                        value={
                                                            newAmcForm.gstApplicable
                                                        }
                                                        onChange={handleNewAmcChange}
                                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
                                                    >
                                                        <option value="YES">Yes</option>
                                                        <option value="NO">No</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="mb-1.5 block text-[11px] font-bold text-slate-600">
                                                        GST Rate
                                                    </label>

                                                    <select
                                                        name="gstRate"
                                                        value={newAmcForm.gstRate}
                                                        onChange={handleNewAmcChange}
                                                        disabled={
                                                            newAmcForm.gstApplicable !==
                                                            "YES"
                                                        }
                                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 disabled:bg-slate-50"
                                                    >
                                                        <option value="5">5%</option>
                                                        <option value="12">12%</option>
                                                        <option value="18">18%</option>
                                                        <option value="28">28%</option>
                                                        <option value="CUSTOM">
                                                            Custom
                                                        </option>
                                                    </select>
                                                </div>

                                                {newAmcForm.gstRate === "CUSTOM" &&
                                                    newAmcForm.gstApplicable === "YES" && (
                                                        <div>
                                                            <label className="mb-1.5 block text-[11px] font-bold text-slate-600">
                                                                Custom GST %
                                                            </label>

                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                step="0.01"
                                                                name="customGstRate"
                                                                value={
                                                                    newAmcForm.customGstRate
                                                                }
                                                                onChange={
                                                                    handleNewAmcChange
                                                                }
                                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
                                                            />
                                                        </div>
                                                    )}

                                                <div className="lg:col-span-2">
                                                    <label className="mb-1.5 block text-[11px] font-bold text-slate-600">
                                                        Tax Type
                                                    </label>

                                                    <select
                                                        name="taxType"
                                                        value={newAmcForm.taxType}
                                                        onChange={handleNewAmcChange}
                                                        disabled={
                                                            newAmcForm.gstApplicable !==
                                                            "YES"
                                                        }
                                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 disabled:bg-slate-50"
                                                    >
                                                        <option value="CGST_SGST">
                                                            CGST + SGST
                                                        </option>

                                                        <option value="IGST">
                                                            IGST
                                                        </option>
                                                    </select>
                                                </div>

                                                <div className="lg:col-span-2">
                                                    <label className="mb-1.5 block text-[11px] font-bold text-slate-600">
                                                        Invoice Source
                                                    </label>

                                                    <select
                                                        name="invoiceSource"
                                                        value={
                                                            newAmcForm.invoiceSource
                                                        }
                                                        onChange={handleNewAmcChange}
                                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
                                                    >
                                                        <option value="SYSTEM">
                                                            Generate System Invoice
                                                        </option>

                                                        <option value="UPLOAD">
                                                            Upload Own Invoice / Bill
                                                        </option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* GST PREVIEW */}
                                            <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-violet-100 bg-violet-50/50 p-4 md:grid-cols-4">

                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                        Taxable
                                                    </p>

                                                    <p className="mt-1 text-sm font-bold text-slate-900">
                                                        {formatCurrency(
                                                            gstPreview.taxableAmount
                                                        )}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                        GST
                                                    </p>

                                                    <p className="mt-1 text-sm font-bold text-slate-900">
                                                        {formatCurrency(
                                                            gstPreview.totalTaxAmount
                                                        )}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                        Rate
                                                    </p>

                                                    <p className="mt-1 text-sm font-bold text-slate-900">
                                                        {gstPreview.effectiveRate}%
                                                    </p>
                                                </div>

                                                <div className="rounded-xl bg-violet-600 px-3 py-2.5">
                                                    <p className="text-[9px] font-bold uppercase tracking-wider text-violet-200">
                                                        Grand Total
                                                    </p>

                                                    <p className="mt-0.5 text-base font-bold text-white">
                                                        {formatCurrency(
                                                            gstPreview.grandTotal
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* OWN INVOICE */}
                                            {newAmcForm.invoiceSource === "UPLOAD" && (
                                                <div className="mt-5 rounded-2xl border border-dashed border-violet-300 bg-violet-50/40 p-4">

                                                    <label className="mb-2 block text-[11px] font-bold text-slate-700">
                                                        Upload Own Invoice / Bill
                                                    </label>

                                                    <input
                                                        type="file"
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                        onChange={
                                                            handleOwnInvoiceFileChange
                                                        }
                                                        className="block w-full text-xs text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-violet-100 file:px-4 file:py-2.5 file:text-xs file:font-bold file:text-violet-700 hover:file:bg-violet-200"
                                                    />

                                                    {ownInvoiceFile && (
                                                        <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-700">
                                                            <CheckCircle2 size={15} />

                                                            {ownInvoiceFile.name}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    {/* =================================================
                            NOTES
                        ================================================== */}
                                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                                        <div className="px-5 py-4">
                                            <label className="mb-1.5 block text-[11px] font-bold text-slate-600">
                                                Internal Notes
                                            </label>

                                            <textarea
                                                name="notes"
                                                value={newAmcForm.notes}
                                                onChange={handleNewAmcChange}
                                                rows={3}
                                                placeholder="Add AMC notes, special terms or internal instructions..."
                                                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
                                            />
                                        </div>
                                    </section>

                                </div>
                            </div>

                            {/* =====================================================
                    STICKY FOOTER
                ====================================================== */}
                            <div className="shrink-0 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">

                                <div className="mx-auto flex max-w-[920px] items-center justify-between gap-4">

                                    <div className="hidden sm:block">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Contract Total
                                        </p>

                                        <p className="mt-0.5 text-lg font-bold tracking-tight text-slate-950">
                                            {formatCurrency(
                                                gstPreview.grandTotal
                                            )}
                                        </p>
                                    </div>

                                    <div className="ml-auto flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={closeNewAmcDrawer}
                                            disabled={savingAmc}
                                            className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="submit"
                                            disabled={savingAmc}
                                            className="flex h-11 min-w-[190px] items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 text-sm font-bold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {savingAmc ? (
                                                <>
                                                    <RefreshCw
                                                        size={16}
                                                        className="animate-spin"
                                                    />
                                                    Creating...
                                                </>
                                            ) : (
                                                <>
                                                    <FileText size={16} />
                                                    Create AMC Contract
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {invoiceRecord && (
                <AmcInvoice
                    record={invoiceRecord}
                    onClose={() => setInvoiceRecord(null)}
                />
            )}
            {historyInvoiceRecord && (
                <AmcInvoice
                    record={historyInvoiceRecord}
                    onClose={() => setHistoryInvoiceRecord(null)}
                />
            )}
            {reminderRecord && (
                <AmcReminderModal
                    record={reminderRecord}
                    employees={employees}
                    saving={savingReminder}
                    onClose={() => {
                        if (!savingReminder) {
                            setReminderRecord(null);
                        }
                    }}
                    onSubmit={handleSaveReminder}
                />
            )}

            {editAmcOpen && (
                <EditAmcDrawer
                    isOpen={editAmcOpen}
                    onClose={closeEditAmcDrawer}
                    record={editAmcRecord}
                    form={editAmcForm}
                    onFormChange={handleEditAmcChange}
                    onFormUpdate={setEditAmcForm}
                    gstPreview={editGstPreview}
                    employees={employees}
                    saving={savingEditAmc}
                    error={editAmcError}
                    onSubmit={handleSaveEditAmc}
                />
            )}
        </>
    );
}
