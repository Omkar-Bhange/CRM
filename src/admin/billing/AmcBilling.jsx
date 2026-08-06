import {
    useEffect,
    useMemo,
    useState,
} from "react";
import AmcReminderModal from "./AmcReminderModal";
import AmcInvoice from "./AmcInvoice";
import {
    AlertCircle,
    ArrowUpRight,
    BadgeIndianRupee,
    BellRing,
    CalendarDays,
    CheckCircle2,
    Clock3,
    CreditCard,
    Download,
    Eye,
    FileText,
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
const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000";

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
        const [
    savingReminder,
    setSavingReminder,
] = useState(false);
    const [historyInvoiceRecord, setHistoryInvoiceRecord] = useState(null);
    const [newAmcOpen, setNewAmcOpen] = useState(false);
    const [newAmcForm, setNewAmcForm] = useState(emptyNewAmcForm);
    const [newAmcError, setNewAmcError] = useState("");
    const [records, setRecords] =
        useState([]);
    const [clients, setClients] =
        useState([]);

    const [employees, setEmployees] =
        useState([]);

    const [
        backendStats,
        setBackendStats,
    ] = useState({
        totalCollected: 0,
        totalPending: 0,
        overdueCount: 0,
        upcomingCount: 0,
    });

    const [
        recordsLoading,
        setRecordsLoading,
    ] = useState(true);

    const [
        mastersLoading,
        setMastersLoading,
    ] = useState(true);

    const [
        savingAmc,
        setSavingAmc,
    ] = useState(false);
        const [
        savingPayment,
        setSavingPayment,
    ] = useState(false);

    const [
        recordsError,
        setRecordsError,
    ] = useState("");

    const [
        mastersError,
        setMastersError,
    ] = useState("");
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
        const token =
            getAuthToken();

        if (!token) {
            throw new Error(
                "Login token was not found. Please login again."
            );
        }

        const response =
            await fetch(
                `${API_URL}/api/admin/clients`,
                {
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
                "Unable to load clients."
            );
        }

        const normalizedClients =
            Array.isArray(result.data)
                ? result.data
                    .map(
                        normalizeClientFromApi
                    )
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

        setClients(
            normalizedClients
        );
    };
    const loadEmployees = async () => {
        const token =
            getAuthToken();

        if (!token) {
            throw new Error(
                "Login token was not found. Please login again."
            );
        }

        const response =
            await fetch(
                `${API_URL}/api/employee/employees`,
                {
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
            response.status === 401
        ) {
            throw new Error(
                "Your login session has expired. Please login again."
            );
        }

        if (
            !response.ok ||
            !result.success
        ) {
            throw new Error(
                result.message ||
                "Unable to load employees."
            );
        }

        const normalizedEmployees =
            Array.isArray(result.data)
                ? result.data
                    .map(
                        normalizeEmployeeFromApi
                    )
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

        setEmployees(
            normalizedEmployees
        );
    };
    

    const loadAmcContracts = async () => {
    try {
        setRecordsLoading(true);
        setRecordsError("");

        const token =
            getAuthToken();

        if (!token) {
            throw new Error(
                "Login token was not found. Please login again."
            );
        }

        const response =
            await fetch(
                `${API_URL}/api/admin/amc/contracts?limit=500`,
                {
                    method: "GET",

                    headers: {
                        Accept:
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

        /*
         * This line is missing in your current code.
         */
        const result =
            await response.json();

        if (
            response.status === 401
        ) {
            throw new Error(
                "Your login session has expired. Please login again."
            );
        }

        if (
            !response.ok ||
            result.success !== true
        ) {
            throw new Error(
                result.message ||
                "Unable to load AMC contracts."
            );
        }

        const normalizedRecords =
            Array.isArray(result.data)
                ? result.data.map(
                    normalizeAmcContractFromApi
                )
                : [];

        setRecords(
            normalizedRecords
        );

        setBackendStats({
            totalCollected:
                Number(
                    result.stats
                        ?.totalCollected ||
                    0
                ),

            totalPending:
                Number(
                    result.stats
                        ?.totalPending ||
                    0
                ),

            overdueCount:
                Number(
                    result.stats
                        ?.overdueCount ||
                    0
                ),

            upcomingCount:
                Number(
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

    const stats =
        backendStats;
    const selectedNewAmcClient =
        clients.find(
            (client) =>
                String(client.id) ===
                String(
                    newAmcForm.clientId
                )
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

            if (
                !paymentRecord ||
                savingPayment
            ) {
                return;
            }

            const amount =
                Number(
                    paymentForm.amount
                );

            if (
                !Number.isFinite(
                    amount
                ) ||
                amount <= 0
            ) {
                setFormError(
                    "Enter a valid payment amount."
                );
                return;
            }

            if (
                amount >
                Number(
                    paymentRecord.pendingAmount ||
                    0
                )
            ) {
                setFormError(
                    `Payment cannot exceed ${formatCurrency(
                        paymentRecord.pendingAmount
                    )}.`
                );
                return;
            }

            if (
                !paymentForm.paymentDate
            ) {
                setFormError(
                    "Please select the payment date."
                );
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

            if (
                !invoiceId &&
                !contractId
            ) {
                setFormError(
                    "AMC invoice or contract ID was not found."
                );
                return;
            }

            try {
                setSavingPayment(
                    true
                );

                setFormError(
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
                        `${API_URL}/api/admin/amc/payment`,
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
                                    amcInvoiceId:
                                        invoiceId,

                                    amcContractId:
                                        contractId,

                                    amount,

                                    paymentDate:
                                        paymentForm.paymentDate,

                                    mode:
                                        paymentForm.mode,

                                    referenceNo:
                                        paymentForm.referenceNo
                                            .trim(),

                                    notes:
                                        paymentForm.notes
                                            .trim(),
                                }),
                        }
                    );

                let result = {};

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
                    !response.ok ||
                    result.success !== true
                ) {
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

                if (
                    !responseContract
                ) {
                    throw new Error(
                        "Updated AMC contract was not returned by server."
                    );
                }

                const normalizedContract =
                    normalizeAmcContractFromApi(
                        responseContract
                    );

                const normalizedPayment = {
                    id:
                        responsePayment?._id ||
                        responsePayment?.id ||
                        `${Date.now()}`,

                    paymentCode:
                        responsePayment?.paymentCode ||
                        "",

                    amcInvoiceId:
                        responsePayment?.amcInvoiceId ||
                        invoiceId,

                    date:
                        responsePayment?.paymentDate
                            ? new Date(
                                responsePayment.paymentDate
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
                            : new Date(
                                `${paymentForm.paymentDate}T00:00:00`
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
                            ),

                    paymentDate:
                        responsePayment?.paymentDate ||
                        paymentForm.paymentDate,

                    amount:
                        Number(
                            responsePayment?.amount ||
                            amount
                        ),

                    mode:
                        responsePayment?.mode ||
                        paymentForm.mode,

                    referenceNo:
                        responsePayment?.referenceNo ||
                        paymentForm.referenceNo.trim() ||
                        "—",

                    notes:
                        responsePayment?.notes ||
                        paymentForm.notes.trim(),

                    receivedBy:
                        responsePayment?.receivedByName ||
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

                /*
                 * Reload totals and records from MongoDB.
                 */
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
                setSavingPayment(
                    false
                );
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
    const handleNewAmcChange = (
        event
    ) => {
        const {
            name,
            value,
        } = event.target;

        setNewAmcForm(
            (current) => ({
                ...current,
                [name]:
                    value,
            })
        );

        if (newAmcError) {
            setNewAmcError("");
        }
    };

    const closeNewAmcDrawer = () => {
        setNewAmcOpen(false);
        setNewAmcForm(emptyNewAmcForm);
        setNewAmcError("");
    };

    const handleCreateAmcContract =
        async (event) => {
            event.preventDefault();

            if (
                !newAmcForm.clientId
            ) {
                setNewAmcError(
                    "Please select a client."
                );
                return;
            }

            if (
                !newAmcForm.clientProductId
            ) {
                setNewAmcError(
                    "Please select a client product."
                );
                return;
            }

            if (
                !newAmcForm.startDate
            ) {
                setNewAmcError(
                    "Please select the AMC start date."
                );
                return;
            }

            if (
                !newAmcForm.expiryDate
            ) {
                setNewAmcError(
                    "Please select the AMC expiry date."
                );
                return;
            }

            if (
                !newAmcForm.dueDate
            ) {
                setNewAmcError(
                    "Please select the payment due date."
                );
                return;
            }

            const taxableAmount =
                Number(
                    newAmcForm.taxableAmount
                );

            if (
                !taxableAmount ||
                taxableAmount <= 0
            ) {
                setNewAmcError(
                    "Please enter a valid AMC taxable amount."
                );
                return;
            }

            const licensedUsers =
                Number(
                    newAmcForm.licensedUsers
                );

            if (
                !licensedUsers ||
                licensedUsers <= 0
            ) {
                setNewAmcError(
                    "Please enter a valid licensed user count."
                );
                return;
            }

            try {
                setSavingAmc(true);
                setNewAmcError("");

                const response =
                    await fetch(
                        `${API_URL}/api/admin/amc/contract`,
                        {
                            method:
                                "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${getAuthToken()}`,
                            },

                            body:
                                JSON.stringify({
                                    clientId:
                                        newAmcForm.clientId,

                                    clientProductId:
                                        newAmcForm.clientProductId,

                                    plan:
                                        newAmcForm.plan,

                                    licensedUsers,

                                    startDate:
                                        newAmcForm.startDate,

                                    expiryDate:
                                        newAmcForm.expiryDate,

                                    dueDate:
                                        newAmcForm.dueDate,

                                    taxableAmount,

                                    cgstRate:
                                        Number(
                                            newAmcForm.cgstRate ||
                                            0
                                        ),

                                    sgstRate:
                                        Number(
                                            newAmcForm.sgstRate ||
                                            0
                                        ),

                                    igstRate:
                                        Number(
                                            newAmcForm.igstRate ||
                                            0
                                        ),

                                    assignedEmployeeId:
                                        newAmcForm
                                            .assignedEmployeeId ||
                                        "",

                                    notes:
                                        newAmcForm.notes
                                            .trim(),
                                }),
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
                        "Unable to create AMC contract."
                    );
                }

                const createdRecord =
                    normalizeAmcContractFromApi(
                        result.data
                    );

                setRecords(
                    (current) => [
                        createdRecord,
                        ...current,
                    ]
                );

                closeNewAmcDrawer();

                await loadAmcContracts();

                alert(
                    "AMC contract created successfully."
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

            const token =
                getAuthToken();

            if (!token) {
                throw new Error(
                    "Login token was not found. Please login again."
                );
            }

            const response =
                await fetch(
                    `${API_URL}/api/admin/amc/contract/${contractId}/reminder`,
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
                                channel:
                                    reminderEntry.channel,

                                message:
                                    reminderEntry.message,

                                followUpDate:
                                    reminderEntry.followUpDate,

                                assignedEmployeeId:
                                    reminderEntry
                                        .assignedEmployeeId ||
                                    "",

                                notes:
                                    reminderEntry.notes ||
                                    "",
                            }),
                    }
                );

            const result =
                await response.json();

            if (
                response.status === 401
            ) {
                throw new Error(
                    "Your login session has expired. Please login again."
                );
            }

            if (
                !response.ok ||
                result.success !== true
            ) {
                throw new Error(
                    result.message ||
                    "Unable to save AMC reminder."
                );
            }

            const updatedContract =
                normalizeAmcContractFromApi(
                    result.data.contract
                );

            const savedReminder =
                result.data.reminder;

            const normalizedReminder = {
                id:
                    savedReminder._id ||
                    savedReminder.id,

                channel:
                    savedReminder.channel,

                message:
                    savedReminder.message,

                followUpDate:
                    savedReminder.followUpDate
                        ? new Date(
                            savedReminder.followUpDate
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
                        : "Not scheduled",

                assignedEmployeeId:
                    savedReminder
                        .assignedEmployeeId ||
                    "",

                assignedEmployeeCode:
                    savedReminder
                        .assignedEmployeeCode ||
                    "",

                assignedEmployeeName:
                    savedReminder
                        .assignedEmployeeName ||
                    "Unassigned",

                assignedTo:
                    savedReminder
                        .assignedEmployeeName ||
                    "Unassigned",

                notes:
                    savedReminder.notes ||
                    "",

                sentAt:
                    savedReminder.sentAt
                        ? new Date(
                            savedReminder.sentAt
                        ).toLocaleString(
                            "en-IN"
                        )
                        : "—",

                sentBy:
                    savedReminder
                        .sentByName ||
                    "Admin",

                status:
                    savedReminder.status ||
                    "Sent",
            };

            const finalRecord = {
                ...updatedContract,

                reminderHistory: [
                    ...(
                        reminderRecord
                            .reminderHistory ||
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

            setReminderRecord(
                null
            );

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
            setSavingReminder(
                false
            );
        }
    };

    return (
        <>
            <div className="space-y-6">
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
                        className={`rounded-2xl border bg-white p-5 text-left shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 ${activeSummary === "Collected"
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
                        className={`rounded-2xl border bg-white p-5 text-left shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 ${activeSummary === "Pending"
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
                        className={`rounded-2xl border bg-white p-5 text-left shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 ${activeSummary === "Overdue"
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
                        className={`rounded-2xl border bg-white p-5 text-left shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 ${activeSummary === "Upcoming"
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
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
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
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
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
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
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
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
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
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
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
                        <table className="min-w-full">
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
                        <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
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
    onClick={
        loadAmcContracts
    }
    disabled={
        recordsLoading
    }
    className="flex items-center gap-1 font-semibold text-violet-600 disabled:cursor-not-allowed disabled:opacity-60"
>
    <RefreshCw
        size={13}
        className={
            recordsLoading
                ? "animate-spin"
                : ""
        }
    />

    {recordsLoading
        ? "Refreshing..."
        : "Refresh data"}
</button>
                    </div>
                </section>
            </div>

            {/* AMC details */}
            {selectedRecord && (
                <div className="fixed inset-0 z-[90]">
                    <button
                        type="button"
                        onClick={() => setSelectedRecord(null)}
                        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
                    />

                    <div className="absolute inset-y-0 right-0 flex w-full max-w-[720px] flex-col bg-white shadow-2xl">
                        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-bold text-violet-600">
                                        {selectedRecord.contractNo}
                                    </span>

                                    <StatusBadge status={selectedRecord.status} />
                                </div>

                                <h2 className="mt-3 text-xl font-semibold text-slate-950">
                                    {selectedRecord.client}
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    {selectedRecord.product} · {selectedRecord.plan} AMC
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedRecord(null)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex-1 space-y-6 overflow-y-auto p-6">
                            <section className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-3">
                                <div>
                                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                        Total AMC
                                    </p>

                                    <p className="mt-2 text-lg font-semibold text-slate-950">
                                        {formatCurrency(selectedRecord.amount)}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                        Paid
                                    </p>

                                    <p className="mt-2 text-lg font-semibold text-emerald-700">
                                        {formatCurrency(selectedRecord.paidAmount)}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                        Pending
                                    </p>

                                    <p className="mt-2 text-lg font-semibold text-rose-700">
                                        {formatCurrency(selectedRecord.pendingAmount)}
                                    </p>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-slate-200 bg-white p-5">
                                <h3 className="text-sm font-semibold text-slate-950">
                                    Contract Information
                                </h3>

                                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                                    <div>
                                        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                            Contact person
                                        </p>

                                        <p className="mt-1 text-xs font-semibold text-slate-800">
                                            {selectedRecord.contactPerson}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                            Mobile
                                        </p>

                                        <p className="mt-1 text-xs font-semibold text-slate-800">
                                            {selectedRecord.mobile}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                            AMC period
                                        </p>

                                        <p className="mt-1 text-xs font-semibold text-slate-800">
                                            {selectedRecord.startDate} – {selectedRecord.expiryDate}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                            Assigned employee
                                        </p>

                                        <p className="mt-1 text-xs font-semibold text-slate-800">
                                            {selectedRecord.assignedTo}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                            Invoice
                                        </p>

                                        <p className="mt-1 text-xs font-semibold text-violet-700">
                                            {selectedRecord.invoiceNo || "Not generated"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                            Due date
                                        </p>

                                        <p className="mt-1 text-xs font-semibold text-slate-800">
                                            {selectedRecord.dueDate}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-slate-200 bg-white p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-950">
                                            Reminder Status
                                        </h3>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Last reminder: {selectedRecord.lastReminder}
                                        </p>
                                    </div>

                                    <ReminderBadge status={selectedRecord.reminderStatus} />
                                </div>

                                {selectedRecord.pendingAmount > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => handleSendReminder(selectedRecord)}
                                        className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
                                    >
                                        <BellRing size={15} />
                                        Send Payment Reminder
                                    </button>
                                )}
                            </section>
                            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-950">
                                            Reminder History
                                        </h3>

                                        <p className="mt-1 text-xs text-slate-500">
                                            WhatsApp, email, SMS and call follow-up history.
                                        </p>
                                    </div>

                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                                        {(selectedRecord.reminderHistory || []).length} reminders
                                    </span>
                                </div>

                                {(selectedRecord.reminderHistory || []).length === 0 ? (
                                    <div className="flex min-h-[170px] flex-col items-center justify-center px-6 text-center">
                                        <BellRing size={24} className="text-slate-300" />

                                        <p className="mt-3 text-xs font-semibold text-slate-700">
                                            No reminders recorded
                                        </p>

                                        <p className="mt-1 max-w-xs text-[10px] leading-5 text-slate-400">
                                            Payment reminders and follow-up calls will appear here.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {[...(selectedRecord.reminderHistory || [])]
                                            .reverse()
                                            .map((reminder) => (
                                                <article
                                                    key={reminder.id}
                                                    className="px-5 py-4 transition hover:bg-slate-50"
                                                >
                                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                        <div>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <p className="text-xs font-semibold text-slate-900">
                                                                    {reminder.channel}
                                                                </p>

                                                                <span className="rounded-full bg-violet-50 px-2 py-1 text-[9px] font-bold text-violet-700">
                                                                    {reminder.status}
                                                                </span>
                                                            </div>

                                                            <p className="mt-2 text-xs leading-5 text-slate-500">
                                                                {reminder.message}
                                                            </p>

                                                            {reminder.notes && (
                                                                <p className="mt-2 text-[10px] leading-5 text-slate-400">
                                                                    Internal note: {reminder.notes}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div className="shrink-0 sm:text-right">
                                                            <p className="text-[10px] font-semibold text-slate-600">
                                                                {reminder.sentAt}
                                                            </p>

                                                            <p className="mt-1 text-[9px] text-slate-400">
                                                                Follow-up: {reminder.followUpDate}
                                                            </p>

                                                            <p className="mt-1 text-[9px] text-slate-400">
                                                                {reminder.assignedTo}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </article>
                                            ))}
                                    </div>
                                )}
                            </section>
                            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-950">
                                            Payment History
                                        </h3>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Complete record of AMC payments received.
                                        </p>
                                    </div>

                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                                        {(selectedRecord.paymentHistory || []).length} payments
                                    </span>
                                </div>

                                {(selectedRecord.paymentHistory || []).length === 0 ? (
                                    <div className="flex min-h-[180px] flex-col items-center justify-center px-6 text-center">
                                        <CreditCard size={24} className="text-slate-300" />

                                        <p className="mt-3 text-xs font-semibold text-slate-700">
                                            No payments recorded
                                        </p>

                                        <p className="mt-1 text-[10px] text-slate-400">
                                            Payments entered for this AMC contract will appear here.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {[...(selectedRecord.paymentHistory || [])]
                                            .reverse()
                                            .map((payment) => (
                                                <article
                                                    key={payment.id}
                                                    className="px-5 py-4 transition hover:bg-slate-50"
                                                >
                                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                                                <ReceiptIndianRupee size={18} />
                                                            </div>

                                                            <div>
                                                                <p className="text-sm font-semibold text-slate-900">
                                                                    {formatCurrency(payment.amount)}
                                                                </p>

                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    {payment.mode} · {payment.referenceNo}
                                                                </p>

                                                                {payment.notes && (
                                                                    <p className="mt-2 text-xs leading-5 text-slate-500">
                                                                        {payment.notes}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="sm:text-right">
                                                            <p className="text-xs font-semibold text-slate-700">
                                                                {payment.date}
                                                            </p>

                                                            <p className="mt-1 text-[10px] text-slate-400">
                                                                Received by {payment.receivedBy}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </article>
                                            ))}
                                    </div>
                                )}
                            </section>
                            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-950">
                                            Renewal History
                                        </h3>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Previous AMC periods, invoices and payment status.
                                        </p>
                                    </div>

                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                                        {(selectedRecord.renewalHistory || []).length} renewals
                                    </span>
                                </div>

                                {(selectedRecord.renewalHistory || []).length === 0 ? (
                                    <div className="flex min-h-[180px] flex-col items-center justify-center px-6 text-center">
                                        <RefreshCw size={24} className="text-slate-300" />

                                        <p className="mt-3 text-xs font-semibold text-slate-700">
                                            No previous renewals
                                        </p>

                                        <p className="mt-1 max-w-xs text-[10px] leading-5 text-slate-400">
                                            Previous AMC periods will appear here after the first renewal.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {[...(selectedRecord.renewalHistory || [])]
                                            .reverse()
                                            .map((history) => (
                                                <article
                                                    key={history.id}
                                                    className="px-5 py-4 transition hover:bg-slate-50"
                                                >
                                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                        <div className="flex min-w-0 items-start gap-3">
                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                                                                <RefreshCw size={18} />
                                                            </div>

                                                            <div className="min-w-0">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <p className="text-xs font-semibold text-slate-900">
                                                                        {history.startDate} – {history.expiryDate}
                                                                    </p>

                                                                    <StatusBadge status={history.status} />
                                                                </div>

                                                                <p className="mt-2 text-xs text-slate-500">
                                                                    {history.product} · {history.plan} · {history.users} users
                                                                </p>

                                                                <p className="mt-1 text-[10px] text-slate-400">
                                                                    Invoice: {history.invoiceNo}
                                                                </p>

                                                                <p className="mt-1 text-[10px] text-slate-400">
                                                                    Archived {history.archivedAt}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="sm:text-right">
                                                            <p className="text-sm font-semibold text-slate-900">
                                                                {formatCurrency(history.amount)}
                                                            </p>

                                                            <p className="mt-1 text-[10px] font-medium text-emerald-600">
                                                                Paid {formatCurrency(history.paidAmount)}
                                                            </p>

                                                            <p
                                                                className={`mt-1 text-[10px] font-medium ${history.pendingAmount > 0
                                                                    ? "text-rose-600"
                                                                    : "text-slate-400"
                                                                    }`}
                                                            >
                                                                Pending {formatCurrency(history.pendingAmount)}
                                                            </p>

                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setHistoryInvoiceRecord({
                                                                        ...selectedRecord,
                                                                        startDate: history.startDate,
                                                                        expiryDate: history.expiryDate,
                                                                        dueDate: history.dueDate,
                                                                        invoiceNo: history.invoiceNo,
                                                                        invoiceDate: history.invoiceDate,
                                                                        amount: history.amount,
                                                                        paidAmount: history.paidAmount,
                                                                        pendingAmount: history.pendingAmount,
                                                                        status: history.status,
                                                                        plan: history.plan,
                                                                        product: history.product,
                                                                        users: history.users,
                                                                    });
                                                                }}
                                                                className="mt-3 flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-semibold text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 sm:ml-auto"
                                                            >
                                                                <FileText size={13} />
                                                                View old invoice
                                                            </button>
                                                        </div>
                                                    </div>
                                                </article>
                                            ))}
                                    </div>
                                )}
                            </section>
                            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-950">
                                            AMC Activity Timeline
                                        </h3>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Complete history of contract, invoice, reminder,
                                            payment and renewal activity.
                                        </p>
                                    </div>

                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                                        {(selectedRecord.timeline || []).length} activities
                                    </span>
                                </div>

                                {(selectedRecord.timeline || []).length === 0 ? (
                                    <div className="flex min-h-[190px] flex-col items-center justify-center px-6 text-center">
                                        <History size={25} className="text-slate-300" />

                                        <p className="mt-3 text-xs font-semibold text-slate-700">
                                            No AMC activity recorded
                                        </p>

                                        <p className="mt-1 max-w-xs text-[10px] leading-5 text-slate-400">
                                            Contract creation, payments, reminders and renewals
                                            will appear here.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="relative px-5 py-1">
                                        <div className="absolute bottom-7 left-[39px] top-7 w-px bg-slate-200" />

                                        {[...(selectedRecord.timeline || [])]
                                            .reverse()
                                            .map((activity) => (
                                                <article
                                                    key={activity.id}
                                                    className="relative flex gap-4 border-b border-slate-100 py-5 last:border-b-0"
                                                >
                                                    <AmcTimelineIcon type={activity.type} />

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-semibold text-slate-900">
                                                                    {activity.title}
                                                                </p>

                                                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                                                    {activity.description}
                                                                </p>

                                                                <p className="mt-2 text-[10px] text-slate-400">
                                                                    By{" "}
                                                                    <span className="font-semibold text-slate-600">
                                                                        {activity.user}
                                                                    </span>
                                                                </p>
                                                            </div>

                                                            <span className="shrink-0 text-[9px] font-medium text-slate-400">
                                                                {activity.time}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </article>
                                            ))}
                                    </div>
                                )}
                            </section>
                        </div>

                        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
                            <button
                                type="button"
                                onClick={() => handleOpenInvoicePreview(selectedRecord)}
                                className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                <FileText size={15} />
                                Invoice Preview
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    const record = selectedRecord;
                                    setSelectedRecord(null);
                                    openRenewalModal(record);
                                }}
                                className="flex h-10 items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 text-xs font-semibold text-violet-700"
                            >
                                <RefreshCw size={15} />
                                Renew AMC
                            </button>

                            {selectedRecord.pendingAmount > 0 && (
                               <button
    type="submit"
    disabled={
        savingPayment
    }
    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
>
    {savingPayment ? (
        <>
            <RefreshCw
                size={15}
                className="animate-spin"
            />
            Saving Payment...
        </>
    ) : (
        <>
            <ReceiptIndianRupee
                size={15}
            />
            Record Payment
        </>
    )}
</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Payment modal */}
            {paymentRecord && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <button
                        type="button"
                        onClick={closePaymentModal}
                        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
                    />

                    <form
                        onSubmit={handleRecordPayment}
                        className="relative w-full max-w-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                    >
                        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                            <div>
                                <h2 className="text-base font-semibold text-slate-950">
                                    Record AMC Payment
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    {paymentRecord.client} · Pending{" "}
                                    {formatCurrency(paymentRecord.pendingAmount)}
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
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">
                                        Payment amount *
                                    </label>

                                    <input
                                        type="number"
                                        name="amount"
                                        value={paymentForm.amount}
                                        onChange={handlePaymentChange}
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">
                                        Payment date *
                                    </label>

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
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">
                                        Payment mode
                                    </label>

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
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">
                                        Reference number
                                    </label>

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
                                <label className="mb-2 block text-xs font-semibold text-slate-700">
                                    Notes
                                </label>

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
    disabled={
        savingPayment
    }
    onClick={
        closePaymentModal
    }
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

            {/* Renewal modal */}
            {renewalRecord && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <button
                        type="button"
                        onClick={closeRenewalModal}
                        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
                    />

                    <form
                        onSubmit={handleGenerateRenewal}
                        className="relative w-full max-w-[620px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                    >
                        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                            <div>
                                <h2 className="text-base font-semibold text-slate-950">
                                    Renew AMC Contract
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    {renewalRecord.client} · {renewalRecord.product}
                                </p>
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
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">
                                        AMC amount *
                                    </label>

                                    <input
                                        type="number"
                                        name="amount"
                                        value={renewalForm.amount}
                                        onChange={handleRenewalChange}
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">
                                        Plan
                                    </label>

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
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">
                                        Start date *
                                    </label>

                                    <input
                                        type="date"
                                        name="startDate"
                                        value={renewalForm.startDate}
                                        onChange={handleRenewalChange}
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">
                                        Expiry date *
                                    </label>

                                    <input
                                        type="date"
                                        name="expiryDate"
                                        value={renewalForm.expiryDate}
                                        onChange={handleRenewalChange}
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">
                                        Due date *
                                    </label>

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
                                <label className="mb-2 block text-xs font-semibold text-slate-700">
                                    Notes
                                </label>

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
                        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
                    />

                    <div className="absolute inset-y-0 right-0 flex w-full max-w-[720px] flex-col bg-white shadow-2xl">
                        <div className="flex h-[78px] shrink-0 items-center justify-between border-b border-slate-200 px-6">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-950">
                                    New AMC Contract
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    Create an annual maintenance contract for a client product.
                                </p>
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
                            <div className="flex-1 space-y-6 overflow-y-auto p-6">
                                <section>
                                    <div className="mb-4">
                                        <h3 className="text-sm font-semibold text-slate-950">
                                            Client Information
                                        </h3>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Select the client and primary contact details.
                                        </p>
                                    </div>

                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                Client
                                                <span className="ml-1 text-rose-500">
                                                    *
                                                </span>
                                            </label>

                                            <select
                                                name="clientId"
                                                value={
                                                    newAmcForm.clientId
                                                }
                                                disabled={
                                                    mastersLoading
                                                }
                                                onChange={(event) => {
                                                    const clientId =
                                                        event.target.value;

                                                    const selectedClient =
                                                        clients.find(
                                                            (client) =>
                                                                String(
                                                                    client.id
                                                                ) ===
                                                                String(
                                                                    clientId
                                                                )
                                                        );

                                                    setNewAmcForm(
                                                        (current) => ({
                                                            ...current,

                                                            clientId,

                                                            clientCode:
                                                                selectedClient
                                                                    ?.clientCode ||
                                                                "",

                                                            clientName:
                                                                selectedClient
                                                                    ?.companyName ||
                                                                "",

                                                            contactPerson:
                                                                selectedClient
                                                                    ?.contactPerson ||
                                                                "",

                                                            contactMobile:
                                                                selectedClient
                                                                    ?.mobile ||
                                                                "",

                                                            contactEmail:
                                                                selectedClient
                                                                    ?.email ||
                                                                "",

                                                            clientProductId:
                                                                "",

                                                            productId:
                                                                "",

                                                            productCode:
                                                                "",

                                                            productName:
                                                                "",

                                                            productVersion:
                                                                "",

                                                            plan:
                                                                "Standard",

                                                            licensedUsers:
                                                                "1",
                                                        })
                                                    );

                                                    setNewAmcError("");
                                                }}
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:opacity-60"
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
                                                            ? ` (${client.clientCode})`
                                                            : ""}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                Contact Person
                                            </label>

                                            <input
                                                type="text"
                                                value={
                                                    newAmcForm.contactPerson
                                                }
                                                readOnly
                                                placeholder="From Client Master"
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                Mobile
                                            </label>

                                            <input
                                                type="text"
                                                value={
                                                    newAmcForm.contactMobile
                                                }
                                                readOnly
                                                placeholder="From Client Master"
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 outline-none"
                                            />
                                        </div>

                                    </div>
                                </section>

                                <section className="border-t border-slate-200 pt-6">
                                    <div className="mb-4">
                                        <h3 className="text-sm font-semibold text-slate-950">
                                            Product & Plan
                                        </h3>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Configure the software product and AMC plan.
                                        </p>
                                    </div>

                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                Client Product
                                                <span className="ml-1 text-rose-500">
                                                    *
                                                </span>
                                            </label>

                                            <select
                                                name="clientProductId"
                                                value={
                                                    newAmcForm.clientProductId
                                                }
                                                disabled={
                                                    !newAmcForm.clientId ||
                                                    mastersLoading
                                                }
                                                onChange={(event) => {
                                                    const clientProductId =
                                                        event.target.value;

                                                    const selectedProduct =
                                                        availableClientProducts.find(
                                                            (product) =>
                                                                String(
                                                                    product.clientProductId
                                                                ) ===
                                                                String(
                                                                    clientProductId
                                                                )
                                                        );

                                                    setNewAmcForm(
                                                        (current) => ({
                                                            ...current,

                                                            clientProductId,

                                                            productId:
                                                                selectedProduct
                                                                    ?.productId ||
                                                                "",

                                                            productCode:
                                                                selectedProduct
                                                                    ?.productCode ||
                                                                "",

                                                            productName:
                                                                selectedProduct
                                                                    ?.productName ||
                                                                "",

                                                            productVersion:
                                                                selectedProduct
                                                                    ?.version ||
                                                                "",

                                                            plan:
                                                                [
                                                                    "Basic",
                                                                    "Standard",
                                                                    "Premium",
                                                                ].includes(
                                                                    selectedProduct
                                                                        ?.supportType
                                                                )
                                                                    ? selectedProduct
                                                                        .supportType
                                                                    : "Standard",

                                                            licensedUsers:
                                                                String(
                                                                    selectedProduct
                                                                        ?.licensedUsers ||
                                                                    1
                                                                ),
                                                        })
                                                    );

                                                    setNewAmcError("");
                                                }}
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:opacity-60"
                                            >
                                                <option value="">
                                                    {!newAmcForm.clientId
                                                        ? "Select client first"
                                                        : availableClientProducts.length ===
                                                            0
                                                            ? "No assigned products"
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
                                                            {product.productCode
                                                                ? `${product.productCode} - `
                                                                : ""}

                                                            {product.productName}

                                                            {product.version
                                                                ? ` (${product.version})`
                                                                : ""}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                Product Version
                                            </label>

                                            <input
                                                type="text"
                                                value={
                                                    newAmcForm.productVersion
                                                }
                                                readOnly
                                                placeholder="From Client Product"
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                AMC plan
                                            </label>

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
                                            <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                Number of users <span className="text-rose-500">*</span>
                                            </label>

                                            <input
                                                type="number"
                                                name="licensedUsers"
                                                min="1"
                                                value={
                                                    newAmcForm.licensedUsers
                                                }
                                                onChange={
                                                    handleNewAmcChange
                                                }
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>
                                    </div>
                                </section>

                                <section className="border-t border-slate-200 pt-6">
                                    <div className="mb-4">
                                        <h3 className="text-sm font-semibold text-slate-950">
                                            AMC Period & Billing
                                        </h3>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Set the AMC duration, amount and due date.
                                        </p>
                                    </div>

                                    <div className="grid gap-5 sm:grid-cols-3">
                                        <div>
                                            <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                Start date <span className="text-rose-500">*</span>
                                            </label>

                                            <input
                                                type="date"
                                                name="startDate"
                                                value={newAmcForm.startDate}
                                                onChange={handleNewAmcChange}
                                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                Expiry date <span className="text-rose-500">*</span>
                                            </label>

                                            <input
                                                type="date"
                                                name="expiryDate"
                                                value={newAmcForm.expiryDate}
                                                onChange={handleNewAmcChange}
                                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                Due date <span className="text-rose-500">*</span>
                                            </label>

                                            <input
                                                type="date"
                                                name="dueDate"
                                                value={newAmcForm.dueDate}
                                                onChange={handleNewAmcChange}
                                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                AMC amount <span className="text-rose-500">*</span>
                                            </label>

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
                                                    value={
                                                        newAmcForm.taxableAmount
                                                    }
                                                    onChange={
                                                        handleNewAmcChange
                                                    }
                                                    placeholder="Enter taxable amount"
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                Assigned Employee
                                            </label>

                                            <select
                                                name="assignedEmployeeId"
                                                value={
                                                    newAmcForm.assignedEmployeeId
                                                }
                                                disabled={
                                                    mastersLoading
                                                }
                                                onChange={(event) => {
                                                    const employeeId =
                                                        event.target.value;

                                                    const selectedEmployee =
                                                        employees.find(
                                                            (employee) =>
                                                                String(
                                                                    employee.id
                                                                ) ===
                                                                String(
                                                                    employeeId
                                                                )
                                                        );

                                                    setNewAmcForm(
                                                        (current) => ({
                                                            ...current,

                                                            assignedEmployeeId:
                                                                employeeId,

                                                            assignedEmployeeCode:
                                                                selectedEmployee
                                                                    ?.employeeCode ||
                                                                "",

                                                            assignedEmployeeName:
                                                                selectedEmployee
                                                                    ?.name ||
                                                                "",
                                                        })
                                                    );

                                                    setNewAmcError("");
                                                }}
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:opacity-60"
                                            >
                                                <option value="">
                                                    Keep unassigned
                                                </option>

                                                {employees.map(
                                                    (employee) => (
                                                        <option
                                                            key={employee.id}
                                                            value={employee.id}
                                                            disabled={
                                                                employee.status ===
                                                                "Leave" ||
                                                                employee.status ===
                                                                "Inactive"
                                                            }
                                                        >
                                                            {employee.name}

                                                            {employee.employeeCode
                                                                ? ` (${employee.employeeCode})`
                                                                : ""}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mt-5">
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            Notes
                                        </label>

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
                                        <AlertCircle
                                            size={17}
                                            className="mt-0.5 shrink-0 text-rose-600"
                                        />

                                        <div>
                                            <p className="text-xs font-semibold text-rose-800">
                                                Unable to create AMC contract
                                            </p>

                                            <p className="mt-1 text-xs text-rose-700">
                                                {newAmcError}
                                            </p>
                                        </div>
                                    </div>
                                )}
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

                                    {savingAmc
                                        ? "Creating..."
                                        : "Create AMC Contract"}
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
            setReminderRecord(
                null
            );
        }
    }}
    onSubmit={
        handleSaveReminder
    }
/>

            )}
        </>
    );
}