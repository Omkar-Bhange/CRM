import {
    useEffect,
    useMemo,
    useState,
} from "react";
import AmcReminderModal from "./AmcReminderModal";
import AmcInvoice from "./AmcInvoice";
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

const employeeOptions = [
    "Akash Pawar",
    "Sneha Kale",
    "Rohit More",
    "Pooja Shinde",
    "Nilesh Jadhav",
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

export default function AmcBilling() {
    const [invoiceRecord, setInvoiceRecord] = useState(null);
    const [reminderRecord, setReminderRecord] = useState(null);
    const [savingReminder, setSavingReminder] = useState(false);
    const [historyInvoiceRecord, setHistoryInvoiceRecord] = useState(null);
    const [newAmcOpen, setNewAmcOpen] = useState(false);
    const [newAmcForm, setNewAmcForm] = useState(emptyNewAmcForm);
    const [ownInvoiceFile, setOwnInvoiceFile] = useState(null);
    const [newAmcError, setNewAmcError] = useState("");
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
    const [paymentRecord, setPaymentRecord] = useState(null);
    const [renewalRecord, setRenewalRecord] = useState(null);
    const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
    const [renewalForm, setRenewalForm] = useState(emptyRenewalForm);
    const [formError, setFormError] = useState("");
    const [activeTab, setActiveTab] = useState("Overview");
    const [localDocuments, setLocalDocuments] = useState({});
    const [documentType, setDocumentType] = useState("AMC Agreement");
    const [documentError, setDocumentError] = useState("");
    const [
    uploadingDocument,
    setUploadingDocument,
] = useState(false);

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

    const clearFilters = () => {
        setSearchValue("");
        setStatusFilter("All");
        setProductFilter("All");
        setPlanFilter("All");
        setActiveSummary("All");
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
        setRenewalRecord(record);
        setFormError("");
        setRenewalForm({
            amount: String(record.amount),
            startDate: "",
            expiryDate: "",
            dueDate: "",
            plan: record.plan,
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

    const handleGenerateRenewal = (event) => {
        event.preventDefault();
        if (!renewalRecord) return;
        if (
            !renewalForm.amount ||
            !renewalForm.startDate ||
            !renewalForm.expiryDate ||
            !renewalForm.dueDate
        ) {
            setFormError("Please complete all required renewal fields.");
            return;
        }
        const amount = Number(renewalForm.amount);
        if (!amount || amount <= 0) {
            setFormError("Please enter a valid AMC amount.");
            return;
        }
        const formatDateValue = (value) =>
            new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
        const formattedStart = formatDateValue(renewalForm.startDate);
        const formattedExpiry = formatDateValue(renewalForm.expiryDate);
        const formattedDue = formatDateValue(renewalForm.dueDate);
        const invoiceNo = `AMC-2026-${String(Date.now()).slice(-4)}`;
        const previousPeriodEntry = {
            id: `${renewalRecord.id}-${Date.now()}`,
            startDate: renewalRecord.startDate,
            expiryDate: renewalRecord.expiryDate,
            dueDate: renewalRecord.dueDate,
            invoiceNo: renewalRecord.invoiceNo || "Not generated",
            invoiceDate: renewalRecord.invoiceDate || "—",
            amount: renewalRecord.amount,
            paidAmount: renewalRecord.paidAmount,
            pendingAmount: renewalRecord.pendingAmount,
            status: renewalRecord.status,
            plan: renewalRecord.plan,
            product: renewalRecord.product,
            users: renewalRecord.users,
            paymentHistory: renewalRecord.paymentHistory || [],
            archivedAt: new Date().toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }),
        };
        const renewalTimelineEvent = createAmcTimelineEvent({
            type: "renewal",
            title: "AMC contract renewed",
            description: `Previous AMC period ${renewalRecord.startDate} to ${renewalRecord.expiryDate} was archived. New AMC period created from ${formattedStart} to ${formattedExpiry}.`,
        });
        const invoiceTimelineEvent = createAmcTimelineEvent({
            type: "invoice",
            title: "Renewal invoice generated",
            description: `Invoice ${invoiceNo} was generated for ${formatCurrency(
                amount
            )}.`,
        });
        const updatedRecord = {
            ...renewalRecord,
            renewalHistory: [
                ...(renewalRecord.renewalHistory || []),
                previousPeriodEntry,
            ],
            startDate: formattedStart,
            expiryDate: formattedExpiry,
            dueDate: formattedDue,
            plan: renewalForm.plan,
            amount,
            paidAmount: 0,
            pendingAmount: amount,
            invoiceNo,
            invoiceDate: new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }),
            status: "Pending",
            reminderStatus: "Not Sent",
            lastReminder: "—",
            paymentHistory: [],
            timeline: [
                ...(renewalRecord.timeline || []),
                renewalTimelineEvent,
                invoiceTimelineEvent,
            ],
        };
        setRecords((current) =>
            current.map((record) =>
                record.id === renewalRecord.id ? updatedRecord : record
            )
        );
        setSelectedRecord((current) =>
            current?.id === renewalRecord.id ? updatedRecord : current
        );
        setInvoiceRecord((current) =>
            current?.id === renewalRecord.id ? updatedRecord : current
        );
        closeRenewalModal();
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
                            <button
                                type="button"
                                className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                            >
                                <MoreHorizontal size={16} />
                                Edit Contract
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
                                    className={`whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-semibold transition ${
                                        activeTab === tab
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
                                                                <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${
                                                                    reminder.status === "Sent"
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
                                                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                                                                isImage
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
                                                            <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${
                                                                document.status === "Pending Backend Save"
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
                                            <p className={`mt-2 text-xs font-semibold ${
                                                ["Available", "Added"].includes(value)
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
                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-violet-600">
                            <BadgeIndianRupee size={16} />
                            Revenue Operations
                        </div>
                        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                            AMC & Billing
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                            Manage annual maintenance contracts, renewals, invoices,
                            reminders and client payments.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                            <Download size={16} />
                            Export
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setNewAmcError("");
                                setNewAmcOpen(true);
                            }}
                            className="flex h-11 items-center gap-2 rounded-xl bg-violet-600 px-5 text-xs font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:-translate-y-0.5 hover:bg-violet-700"
                        >
                            <Plus size={17} />
                            New AMC Contract
                        </button>
                    </div>
                </section>

                {/* Statistics */}
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <button
                        type="button"
                        onClick={() => setActiveSummary("Collected")}
                        className={`enterprise-surface--interactive rounded-2xl border bg-white p-5 text-left shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 ${activeSummary === "Collected"
                            ? "border-emerald-300 ring-4 ring-emerald-50"
                            : "border-slate-200"
                            }`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    AMC Collected
                                </p>
                                <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                                    {formatCurrency(stats.totalCollected)}
                                </p>
                                <p className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600">
                                    <TrendingUp size={14} />
                                    Payments received
                                </p>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                <IndianRupee size={20} />
                            </div>
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSummary("Pending")}
                        className={`enterprise-surface--interactive rounded-2xl border bg-white p-5 text-left shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 ${activeSummary === "Pending"
                            ? "border-amber-300 ring-4 ring-amber-50"
                            : "border-slate-200"
                            }`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    Pending Amount
                                </p>
                                <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                                    {formatCurrency(stats.totalPending)}
                                </p>
                                <p className="mt-2 text-xs font-medium text-amber-600">
                                    Awaiting collection
                                </p>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                                <WalletCards size={20} />
                            </div>
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSummary("Overdue")}
                        className={`enterprise-surface--interactive rounded-2xl border bg-white p-5 text-left shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 ${activeSummary === "Overdue"
                            ? "border-rose-300 ring-4 ring-rose-50"
                            : "border-slate-200"
                            }`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    Overdue Renewals
                                </p>
                                <p className="mt-3 text-2xl font-semibold text-slate-950">
                                    {stats.overdueCount}
                                </p>
                                <p className="mt-2 text-xs font-medium text-rose-600">
                                    Need immediate follow-up
                                </p>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                                <AlertCircle size={20} />
                            </div>
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSummary("Upcoming")}
                        className={`enterprise-surface--interactive rounded-2xl border bg-white p-5 text-left shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 ${activeSummary === "Upcoming"
                            ? "border-violet-300 ring-4 ring-violet-50"
                            : "border-slate-200"
                            }`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    Upcoming Renewals
                                </p>
                                <p className="mt-3 text-2xl font-semibold text-slate-950">
                                    {stats.upcomingCount}
                                </p>
                                <p className="mt-2 text-xs font-medium text-violet-600">
                                    Pending and upcoming
                                </p>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                                <CalendarDays size={20} />
                            </div>
                        </div>
                    </button>
                </section>

                {/* Main table */}
                <section className="enterprise-surface overflow-hidden shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                    <div className="border-b border-slate-200 px-5 py-5 lg:px-6">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                            <div>
                                <h2 className="text-sm font-semibold text-slate-950">
                                    AMC Contracts & Renewals
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    {filteredRecords.length} records found
                                </p>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <div className="relative sm:w-[340px]">
                                    <Search
                                        size={17}
                                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                    <input
                                        type="search"
                                        value={searchValue}
                                        onChange={(event) => setSearchValue(event.target.value)}
                                        placeholder="Search client, product, invoice..."
                                        className="enterprise-input h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFiltersOpen((current) => !current)}
                                    className={`flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-semibold transition ${filtersOpen
                                        ? "border-violet-300 bg-violet-50 text-violet-700"
                                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                        }`}
                                >
                                    <SlidersHorizontal size={16} />
                                    Filters
                                </button>
                            </div>
                        </div>
                        {filtersOpen && (
                            <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 xl:grid-cols-4">
                                <div>
                                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                        Status
                                    </label>
                                    <select
                                        value={statusFilter}
                                        onChange={(event) => setStatusFilter(event.target.value)}
                                        className="enterprise-input h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    >
                                        {statusOptions.map((status) => (
                                            <option key={status}>{status}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                        Product
                                    </label>
                                    <select
                                        value={productFilter}
                                        onChange={(event) => setProductFilter(event.target.value)}
                                        className="enterprise-input h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    >
                                        {productFilterOptions.map(
                                            (product) => (
                                                <option key={product}>{product}</option>
                                            ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                        Plan
                                    </label>
                                    <select
                                        value={planFilter}
                                        onChange={(event) => setPlanFilter(event.target.value)}
                                        className="enterprise-input h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    >
                                        {planOptions.map((plan) => (
                                            <option key={plan}>{plan}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                                    >
                                        <Filter size={15} />
                                        Clear Filters
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="hidden overflow-x-auto xl:block">
                        <table className="enterprise-table min-w-full">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/80">
                                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                        Client / Product
                                    </th>
                                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                        AMC Period
                                    </th>
                                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                        Invoice
                                    </th>
                                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                        Amount
                                    </th>
                                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                        Reminder
                                    </th>
                                    <th className="px-6 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.map((record) => (
                                    <tr
                                        key={record.id}
                                        className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/70"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex min-w-[270px] items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-xs font-bold text-violet-700">
                                                    {record.client
                                                        .split(" ")
                                                        .slice(0, 2)
                                                        .map((word) => word[0])
                                                        .join("")}
                                                </div>
                                                <div className="min-w-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedRecord(record)}
                                                        className="max-w-[250px] truncate text-left text-sm font-semibold text-slate-900 transition hover:text-violet-700"
                                                    >
                                                        {record.client}
                                                    </button>
                                                    <p className="mt-1 text-[10px] text-slate-500">
                                                        {record.product} · {record.plan} · {record.users}{" "}
                                                        users
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="whitespace-nowrap text-xs font-semibold text-slate-700">
                                                {record.startDate}
                                            </p>
                                            <p className="mt-1 whitespace-nowrap text-[10px] text-slate-400">
                                                to {record.expiryDate}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-xs font-semibold text-violet-600">
                                                {record.invoiceNo || "Not generated"}
                                            </p>
                                            <p className="mt-1 text-[10px] text-slate-400">
                                                Due {record.dueDate}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-xs font-semibold text-slate-900">
                                                {formatCurrency(record.amount)}
                                            </p>
                                            <p
                                                className={`mt-1 text-[10px] font-medium ${record.pendingAmount > 0
                                                    ? "text-rose-600"
                                                    : "text-emerald-600"
                                                    }`}
                                            >
                                                Pending {formatCurrency(record.pendingAmount)}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <StatusBadge status={record.status} />
                                        </td>
                                        <td className="px-4 py-4">
                                            <ReminderBadge status={record.reminderStatus} />
                                            <p className="mt-1 text-[9px] text-slate-400">
                                                {record.lastReminder}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">
                                                {record.pendingAmount > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openPaymentModal(record)}
                                                        className="flex h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                                    >
                                                        <IndianRupee size={14} />
                                                        Payment
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedRecord(record)}
                                                    className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                                                >
                                                    <Eye size={14} />
                                                    Open
                                                </button>
                                                <button
                                                    type="button"
                                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                                                >
                                                    <MoreHorizontal size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="divide-y divide-slate-100 xl:hidden">
                        {filteredRecords.map((record) => (
                            <article key={record.id} className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {record.client}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {record.product} · {record.plan}
                                        </p>
                                    </div>
                                    <StatusBadge status={record.status} />
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[9px] font-semibold uppercase text-slate-400">
                                            Amount
                                        </p>
                                        <p className="mt-1 text-xs font-semibold text-slate-900">
                                            {formatCurrency(record.amount)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-semibold uppercase text-slate-400">
                                            Pending
                                        </p>
                                        <p className="mt-1 text-xs font-semibold text-rose-600">
                                            {formatCurrency(record.pendingAmount)}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    {record.pendingAmount > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => openPaymentModal(record)}
                                            className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-50 text-xs font-semibold text-emerald-700"
                                        >
                                            <IndianRupee size={14} />
                                            Payment
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setSelectedRecord(record)}
                                        className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600"
                                    >
                                        Open
                                        <ArrowUpRight size={14} />
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>

                    {filteredRecords.length === 0 && (
                        <div className="enterprise-empty-state m-5 flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
                            <Search size={26} className="text-slate-300" />
                            <p className="mt-4 text-sm font-semibold text-slate-800">
                                No AMC records found
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Change the search or clear the selected filters.
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50/60 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-6">
                        <p>
                            Showing {filteredRecords.length} of {records.length} AMC records
                        </p>
                        <button
                            type="button"
                            onClick={loadAmcContracts}
                            disabled={recordsLoading}
                            className="flex items-center gap-1 font-semibold text-violet-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <RefreshCw
                                size={13}
                                className={recordsLoading ? "animate-spin" : ""}
                            />
                            {recordsLoading ? "Refreshing..." : "Refresh data"}
                        </button>
                    </div>
                </section>
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
                <div className="fixed inset-0 z-[110]">
                    <button
                        type="button"
                        aria-label="Close new AMC drawer"
                        onClick={closeNewAmcDrawer}
                    className="enterprise-backdrop absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
                    />
                <div className="enterprise-drawer absolute inset-y-0 right-0 flex w-full max-w-[720px] flex-col bg-white shadow-2xl">
                        <div className="flex h-[78px] shrink-0 items-center justify-between border-b border-slate-200 px-6">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-950">New AMC Contract</h2>
                                <p className="mt-1 text-xs text-slate-500">Create an annual maintenance contract for a client product.</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeNewAmcDrawer}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form
                            onSubmit={handleCreateAmcContract}
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <div className="flex-1 overflow-y-auto px-8 py-6">
                                <div className="space-y-6">
                                    <section>
                                        <div className="mb-4">
                                            <h3 className="text-sm font-semibold text-slate-950">Client Information</h3>
                                            <p className="mt-1 text-xs text-slate-500">Select the client and primary contact details.</p>
                                        </div>
                                        <div className="grid gap-5 sm:grid-cols-2">
                                            <div>
                                                <label className="mb-2 block text-xs font-semibold text-slate-700">Client <span className="ml-1 text-rose-500">*</span></label>
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
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:opacity-60"
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
                                                <label className="mb-2 block text-xs font-semibold text-slate-700">Contact Person</label>
                                                <input
                                                    type="text"
                                                    value={newAmcForm.contactPerson}
                                                    readOnly
                                                    placeholder="From Client Master"
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-xs font-semibold text-slate-700">Mobile</label>
                                                <input
                                                    type="text"
                                                    value={newAmcForm.contactMobile}
                                                    readOnly
                                                    placeholder="From Client Master"
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </section>
                                    <section className="border-t border-slate-200 pt-6">
                                        <div className="mb-4">
                                            <h3 className="text-sm font-semibold text-slate-950">Product & Plan</h3>
                                            <p className="mt-1 text-xs text-slate-500">Configure the software product and AMC plan.</p>
                                        </div>
                                        <div className="grid gap-5 sm:grid-cols-2">
                                            <div>
                                                <label className="mb-2 block text-xs font-semibold text-slate-700">Client Product <span className="ml-1 text-rose-500">*</span></label>
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
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:opacity-60"
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
                                                <label className="mb-2 block text-xs font-semibold text-slate-700">Product Version</label>
                                                <input
                                                    type="text"
                                                    value={newAmcForm.productVersion}
                                                    readOnly
                                                    placeholder="From Client Product"
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-xs font-semibold text-slate-700">AMC plan</label>
                                                <select
                                                    name="plan"
                                                    value={newAmcForm.plan}
                                                    onChange={handleNewAmcChange}
                                                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none"
                                                >
                                                    <option>Premium</option>
                                                    <option>Standard</option>
                                                    <option>Basic</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-xs font-semibold text-slate-700">Number of users <span className="text-rose-500">*</span></label>
                                                <input
                                                    type="number"
                                                    name="licensedUsers"
                                                    min="1"
                                                    value={newAmcForm.licensedUsers}
                                                    onChange={handleNewAmcChange}
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                />
                                            </div>
                                        </div>
                                    </section>
                                    <section className="border-t border-slate-200 pt-6">
                                        <div className="mb-4">
                                            <h3 className="text-sm font-semibold text-slate-950">AMC Period & Billing</h3>
                                            <p className="mt-1 text-xs text-slate-500">Set the AMC duration, amount and due date.</p>
                                        </div>
                                        <div className="grid gap-5 sm:grid-cols-3">
                                            <div>
                                                <label className="mb-2 block text-xs font-semibold text-slate-700">Start date <span className="text-rose-500">*</span></label>
                                                <input
                                                    type="date"
                                                    name="startDate"
                                                    value={newAmcForm.startDate}
                                                    onChange={handleNewAmcChange}
                                                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-xs font-semibold text-slate-700">Expiry date <span className="text-rose-500">*</span></label>
                                                <input
                                                    type="date"
                                                    name="expiryDate"
                                                    value={newAmcForm.expiryDate}
                                                    onChange={handleNewAmcChange}
                                                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-xs font-semibold text-slate-700">Due date <span className="text-rose-500">*</span></label>
                                                <input
                                                    type="date"
                                                    name="dueDate"
                                                    value={newAmcForm.dueDate}
                                                    onChange={handleNewAmcChange}
                                                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
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
                                        <div className="mt-5 grid gap-5 sm:grid-cols-2">
                                            <div>
                                                <label className="mb-2 block text-xs font-semibold text-slate-700">AMC amount <span className="text-rose-500">*</span></label>
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
                                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pl-8 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-xs font-semibold text-slate-700">Assigned Employee</label>
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
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:opacity-60"
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
                                            <label className="mb-2 block text-xs font-semibold text-slate-700">Notes</label>
                                            <textarea
                                                name="notes"
                                                value={newAmcForm.notes}
                                                onChange={handleNewAmcChange}
                                                rows={4}
                                                placeholder="Add contract notes, support terms or special conditions..."
                                                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>
                                    </section>
                                    {newAmcError && (
                                        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                                            <AlertCircle size={17} className="mt-0.5 shrink-0 text-rose-600" />
                                            <div>
                                                <p className="text-xs font-semibold text-rose-800">Unable to create AMC contract</p>
                                                <p className="mt-1 text-xs text-rose-700">{newAmcError}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
                                <button
                                    type="button"
                                    onClick={closeNewAmcDrawer}
                                    className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingAmc}
                                    className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-5 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
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
        </>
    );
}
