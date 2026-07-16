import { useMemo, useState } from "react";
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

const initialAmcRecords = [
    {
        id: 1,
        contractNo: "AMC-CTR-1001",
        clientCode: "CL-1001",
        client: "Shree Ganesh Industries",
        contactPerson: "Ramesh Patil",
        mobile: "9876543210",
        product: "NexERP",
        version: "v3.4.2",
        plan: "Premium",
        users: 12,
        startDate: "16 Jul 2025",
        expiryDate: "15 Jul 2026",
        invoiceNo: "AMC-2026-0048",
        invoiceDate: "01 Jul 2026",
        dueDate: "15 Jul 2026",
        amount: 45000,
        paidAmount: 0,
        pendingAmount: 45000,
        status: "Pending",
        reminderStatus: "Sent",
        assignedTo: "Akash Pawar",
        lastReminder: "12 Jul 2026",
        paymentHistory: [],
        reminderHistory: [],
        timeline: [
            {
                id: 1,
                type: "created",
                title: "AMC contract created",
                description:
                    "Premium AMC contract was created for NexERP.",
                user: "Mangesh Kondhare",
                time: "01 Jul 2026, 10:15 AM",
            },
            {
                id: 2,
                type: "invoice",
                title: "AMC invoice generated",
                description: "Invoice AMC-2026-0048 was generated.",
                user: "Mangesh Kondhare",
                time: "01 Jul 2026, 10:18 AM",
            },
            {
                id: 3,
                type: "reminder",
                title: "Payment reminder sent",
                description:
                    "AMC payment reminder was sent to the client.",
                user: "Akash Pawar",
                time: "12 Jul 2026, 11:30 AM",
            },
        ],
        renewalHistory: [],
    },
    {
        id: 2,
        contractNo: "AMC-CTR-1002",
        clientCode: "CL-1002",
        client: "Kavya Textiles Pvt Ltd",
        contactPerson: "Sunita Sharma",
        mobile: "9823012456",
        product: "BillFlow",
        version: "v2.8.1",
        plan: "Standard",
        users: 5,
        startDate: "04 Aug 2025",
        expiryDate: "03 Aug 2026",
        invoiceNo: "AMC-2026-0051",
        invoiceDate: "20 Jul 2026",
        dueDate: "03 Aug 2026",
        amount: 18000,
        paidAmount: 18000,
        pendingAmount: 0,
        status: "Paid",
        reminderStatus: "Not Required",
        assignedTo: "Sneha Kale",
        paymentHistory: [
            {
                id: 1,
                date: "03 Aug 2026",
                amount: 18000,
                mode: "Bank Transfer",
                referenceNo: "UTR98451236",
                notes: "Full AMC payment received.",
                receivedBy: "Mangesh Kondhare",
            },
        ],
        lastReminder: "—",
        timeline: [],
        renewalHistory: [],
        reminderHistory: [],
    },
    {
        id: 3,
        contractNo: "AMC-CTR-1003",
        clientCode: "CL-1003",
        client: "Omkar Traders",
        contactPerson: "Vijay Kulkarni",
        mobile: "9890123456",
        product: "RetailPOS",
        version: "v4.1.3",
        plan: "Standard",
        users: 6,
        startDate: "22 Jun 2025",
        expiryDate: "21 Jun 2026",
        invoiceNo: "AMC-2026-0039",
        invoiceDate: "05 Jun 2026",
        dueDate: "21 Jun 2026",
        amount: 12000,
        paidAmount: 0,
        pendingAmount: 12000,
        status: "Overdue",
        reminderStatus: "Sent",
        assignedTo: "Rohit More",
        lastReminder: "10 Jul 2026",
        paymentHistory: [],
        timeline: [],
        renewalHistory: [],
        reminderHistory: [],
    },
    {
        id: 4,
        contractNo: "AMC-CTR-1004",
        clientCode: "CL-1004",
        client: "Precision Auto Parts",
        contactPerson: "Anil Deshmukh",
        mobile: "9765432109",
        product: "NexERP",
        version: "v3.4.2",
        plan: "Premium",
        users: 18,
        startDate: "10 Nov 2025",
        expiryDate: "09 Nov 2026",
        invoiceNo: "AMC-2026-0042",
        invoiceDate: "25 Oct 2026",
        dueDate: "09 Nov 2026",
        amount: 60000,
        paidAmount: 60000,
        pendingAmount: 0,
        status: "Paid",
        reminderStatus: "Not Required",
        assignedTo: "Pooja Shinde",
        lastReminder: "—",
        paymentHistory: [],
        timeline: [],
        renewalHistory: [],
        reminderHistory: [],
    },
    {
        id: 5,
        contractNo: "AMC-CTR-1005",
        clientCode: "CL-1005",
        client: "GreenLeaf Agro",
        contactPerson: "Priya Joshi",
        mobile: "9012345678",
        product: "StockPro",
        version: "v2.5.0",
        plan: "Premium",
        users: 10,
        startDate: "18 Jul 2025",
        expiryDate: "17 Jul 2026",
        invoiceNo: "AMC-2026-0049",
        invoiceDate: "02 Jul 2026",
        dueDate: "17 Jul 2026",
        amount: 25000,
        paidAmount: 10000,
        pendingAmount: 15000,
        status: "Partially Paid",
        reminderStatus: "Sent",
        assignedTo: "Akash Pawar",
        lastReminder: "11 Jul 2026",
        paymentHistory: [],
        timeline: [],
        renewalHistory: [],
        reminderHistory: [],
    },
    {
        id: 6,
        contractNo: "AMC-CTR-1006",
        clientCode: "CL-1006",
        client: "Apex Medical Distributors",
        contactPerson: "Rahul Shah",
        mobile: "9988776655",
        product: "NexERP",
        version: "v3.4.2",
        plan: "Standard",
        users: 8,
        startDate: "13 Jan 2026",
        expiryDate: "12 Jan 2027",
        invoiceNo: "",
        invoiceDate: "",
        dueDate: "12 Jan 2027",
        amount: 30000,
        paidAmount: 0,
        pendingAmount: 30000,
        status: "Upcoming",
        reminderStatus: "Not Sent",
        assignedTo: "Sneha Kale",
        lastReminder: "—",
        paymentHistory: [
            {
                id: 1,
                date: "08 Jul 2026",
                amount: 10000,
                mode: "UPI",
                referenceNo: "UPI458721",
                notes: "Advance AMC payment.",
                receivedBy: "Mangesh Kondhare",
            },
        ],
        timeline: [],
        renewalHistory: [],
        reminderHistory: [],


    },
];
const emptyNewAmcForm = {
    client: "",
    contactPerson: "",
    mobile: "",
    product: "",
    version: "",
    plan: "Standard",
    users: "",
    startDate: "",
    expiryDate: "",
    dueDate: "",
    amount: "",
    assignedTo: "",
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

const productOptions = [
    "All",
    "NexERP",
    "BillFlow",
    "RetailPOS",
    "StockPro",
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
    const [historyInvoiceRecord, setHistoryInvoiceRecord] = useState(null);
    const [newAmcOpen, setNewAmcOpen] = useState(false);
    const [newAmcForm, setNewAmcForm] = useState(emptyNewAmcForm);
    const [newAmcError, setNewAmcError] = useState("");
    const [records, setRecords] = useState(initialAmcRecords);
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

    const stats = useMemo(() => {
        const totalCollected = records.reduce(
            (sum, record) => sum + record.paidAmount,
            0
        );

        const totalPending = records.reduce(
            (sum, record) => sum + record.pendingAmount,
            0
        );

        const overdueCount = records.filter(
            (record) => record.status === "Overdue"
        ).length;

        const upcomingCount = records.filter(
            (record) =>
                record.status === "Upcoming" ||
                record.status === "Pending" ||
                record.status === "Partially Paid"
        ).length;

        return {
            totalCollected,
            totalPending,
            overdueCount,
            upcomingCount,
        };
    }, [records]);

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

    const handleRecordPayment = (event) => {
        event.preventDefault();

        if (!paymentRecord) return;

        const amount = Number(paymentForm.amount);
        const paymentEntry = {
            id: Date.now(),
            date: paymentForm.paymentDate
                ? new Date(`${paymentForm.paymentDate}T00:00:00`).toLocaleDateString(
                    "en-GB",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                    }
                )
                : new Date().toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                }),
            amount,
            mode: paymentForm.mode,
            referenceNo: paymentForm.referenceNo.trim() || "—",
            notes: paymentForm.notes.trim() || "AMC payment received.",
            receivedBy: "Mangesh Kondhare",
        };
        const paymentTimelineEvent = createAmcTimelineEvent({
            type: "payment",
            title: "AMC payment received",
            description: `${formatCurrency(amount)} received through ${paymentForm.mode
                }${paymentForm.referenceNo.trim()
                    ? ` · Reference ${paymentForm.referenceNo.trim()}`
                    : ""
                }.`,
        });

        if (!amount || amount <= 0) {
            setFormError("Enter a valid payment amount.");
            return;
        }

        if (amount > paymentRecord.pendingAmount) {
            setFormError(
                `Payment cannot exceed ${formatCurrency(
                    paymentRecord.pendingAmount
                )}.`
            );
            return;
        }

        setRecords((current) =>
            current.map((record) => {
                if (record.id !== paymentRecord.id) return record;

                const paidAmount = record.paidAmount + amount;
                const pendingAmount = Math.max(record.amount - paidAmount, 0);

                return {
                    ...record,
                    paidAmount,
                    pendingAmount,

                    status:
                        pendingAmount === 0
                            ? "Paid"
                            : paidAmount > 0
                                ? "Partially Paid"
                                : record.status,

                    paymentHistory: [
                        ...(record.paymentHistory || []),
                        paymentEntry,
                    ],

                    timeline: [
                        ...(record.timeline || []),
                        paymentTimelineEvent,
                    ],
                };
            })
        );

        setSelectedRecord((current) => {
            if (!current || current.id !== paymentRecord.id) return current;

            const paidAmount = current.paidAmount + amount;
            const pendingAmount = Math.max(current.amount - paidAmount, 0);

            return {
                ...current,
                paidAmount,
                pendingAmount,
                status:
                    pendingAmount === 0
                        ? "Paid"
                        : paidAmount > 0
                            ? "Partially Paid"
                            : current.status,
                paymentHistory: [
                    ...(current.paymentHistory || []),

                    paymentEntry,
                ],
                timeline: [
                    ...(current.timeline || []),
                    paymentTimelineEvent,
                ],
            };
        });

        closePaymentModal();
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
    const handleNewAmcChange = (event) => {
        const { name, value } = event.target;

        setNewAmcForm((current) => ({
            ...current,
            [name]: value,
        }));

        if (newAmcError) {
            setNewAmcError("");
        }
    };

    const closeNewAmcDrawer = () => {
        setNewAmcOpen(false);
        setNewAmcForm(emptyNewAmcForm);
        setNewAmcError("");
    };

    const handleCreateAmcContract = (event) => {
        event.preventDefault();

        if (!newAmcForm.client.trim()) {
            setNewAmcError("Please select or enter the client.");
            return;
        }

        if (!newAmcForm.product) {
            setNewAmcError("Please select the software product.");
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

        const amount = Number(newAmcForm.amount);
        const users = Number(newAmcForm.users);

        if (!amount || amount <= 0) {
            setNewAmcError("Please enter a valid AMC amount.");
            return;
        }

        if (!users || users <= 0) {
            setNewAmcError("Please enter a valid number of users.");
            return;
        }

        const formatDate = (value) =>
            new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });

        const nextId =
            Math.max(...records.map((record) => Number(record.id)), 0) + 1;

        const contractNo = `AMC-CTR-${String(1000 + nextId)}`;
        const invoiceNo = `AMC-2026-${String(Date.now()).slice(-4)}`;


        const newRecord = {
            id: nextId,
            contractNo,
            clientCode: `CL-${String(1000 + nextId)}`,
            client: newAmcForm.client.trim(),
            contactPerson: newAmcForm.contactPerson.trim() || "Not provided",
            mobile: newAmcForm.mobile.trim() || "Not provided",
            product: newAmcForm.product,
            version: newAmcForm.version.trim() || "Current",
            plan: newAmcForm.plan,
            users,
            startDate: formatDate(newAmcForm.startDate),
            expiryDate: formatDate(newAmcForm.expiryDate),
            invoiceNo,
            invoiceDate: new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }),
            dueDate: formatDate(newAmcForm.dueDate),
            amount,
            paidAmount: 0,
            pendingAmount: amount,
            status: "Pending",
            reminderStatus: "Not Sent",
            assignedTo: newAmcForm.assignedTo || "Unassigned",
            lastReminder: "—",
            notes: newAmcForm.notes.trim(),
            paymentHistory: [],
            renewalHistory: [],
            reminderHistory: [],

            timeline: [
                createAmcTimelineEvent({
                    type: "created",
                    title: "AMC contract created",
                    description: `${newAmcForm.plan} AMC contract was created for ${newAmcForm.product}.`,
                }),

                createAmcTimelineEvent({
                    type: "invoice",
                    title: "AMC invoice generated",
                    description: `Invoice ${invoiceNo} was generated for ${formatCurrency(
                        amount
                    )}.`,
                }),

                ...(newAmcForm.assignedTo
                    ? [
                        createAmcTimelineEvent({
                            type: "assignment",
                            title: `Assigned to ${newAmcForm.assignedTo}`,
                            description:
                                "Employee was assigned to manage this AMC contract.",
                        }),
                    ]
                    : []),
            ],
        };

        setRecords((current) => [newRecord, ...current]);
        closeNewAmcDrawer();
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
    const handleSaveReminder = (reminderEntry) => {
        if (!reminderRecord) return;

        const formattedFollowUpDate = reminderEntry.followUpDate
            ? new Date(
                `${reminderEntry.followUpDate}T00:00:00`
            ).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            })
            : "Not scheduled";

        const savedReminder = {
            ...reminderEntry,
            followUpDate: formattedFollowUpDate,
        };

        const reminderTimelineEvent = createAmcTimelineEvent({
            type: "reminder",
            title:
                reminderEntry.channel === "Phone Call"
                    ? "Payment follow-up call logged"
                    : `${reminderEntry.channel} reminder sent`,
            description: `${reminderEntry.channel === "Phone Call"
                ? "Follow-up call recorded"
                : `Payment reminder sent through ${reminderEntry.channel}`
                }. Next follow-up: ${formattedFollowUpDate}.`,
            user: reminderEntry.sentBy,
        });

        const updateRecord = (record) => ({
            ...record,
            reminderStatus:
                reminderEntry.channel === "Phone Call"
                    ? "Call Logged"
                    : "Sent",
            lastReminder: reminderEntry.sentAt,
            assignedTo:
                reminderEntry.assignedTo === "Unassigned"
                    ? record.assignedTo
                    : reminderEntry.assignedTo,
            reminderHistory: [
                ...(record.reminderHistory || []),
                savedReminder,
            ],
            timeline: [
                ...(record.timeline || []),
                reminderTimelineEvent,
            ],
        });

        setRecords((current) =>
            current.map((record) =>
                record.id === reminderRecord.id
                    ? updateRecord(record)
                    : record
            )
        );

        setSelectedRecord((current) =>
            current?.id === reminderRecord.id
                ? updateRecord(current)
                : current
        );

        setReminderRecord(null);
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
                                        {productOptions.map((product) => (
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
                            className="flex items-center gap-1 font-semibold text-violet-600"
                        >
                            <RefreshCw size={13} />
                            Refresh data
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
                                    type="button"
                                    onClick={() => {
                                        const record = selectedRecord;
                                        setSelectedRecord(null);
                                        openPaymentModal(record);
                                    }}
                                    className="flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700"
                                >
                                    <ReceiptIndianRupee size={15} />
                                    Record Payment
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
                                        <div className="sm:col-span-2">
                                            <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                Client <span className="text-rose-500">*</span>
                                            </label>

                                            <input
                                                name="client"
                                                value={newAmcForm.client}
                                                onChange={handleNewAmcChange}
                                                placeholder="Enter client or company name"
                                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                Contact person
                                            </label>

                                            <input
                                                name="contactPerson"
                                                value={newAmcForm.contactPerson}
                                                onChange={handleNewAmcChange}
                                                placeholder="Primary contact name"
                                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                Mobile number
                                            </label>

                                            <input
                                                name="mobile"
                                                value={newAmcForm.mobile}
                                                onChange={handleNewAmcChange}
                                                placeholder="Client mobile number"
                                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
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
                                                Product <span className="text-rose-500">*</span>
                                            </label>

                                            <select
                                                name="product"
                                                value={newAmcForm.product}
                                                onChange={handleNewAmcChange}
                                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            >
                                                <option value="">Select product</option>
                                                <option>NexERP</option>
                                                <option>BillFlow</option>
                                                <option>RetailPOS</option>
                                                <option>StockPro</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                Version
                                            </label>

                                            <input
                                                name="version"
                                                value={newAmcForm.version}
                                                onChange={handleNewAmcChange}
                                                placeholder="Example: v3.4.2"
                                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
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
                                                min="1"
                                                name="users"
                                                value={newAmcForm.users}
                                                onChange={handleNewAmcChange}
                                                placeholder="Example: 10"
                                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
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
                                                    min="1"
                                                    name="amount"
                                                    value={newAmcForm.amount}
                                                    onChange={handleNewAmcChange}
                                                    placeholder="Enter annual AMC amount"
                                                    className="h-11 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                Assigned employee
                                            </label>

                                            <select
                                                name="assignedTo"
                                                value={newAmcForm.assignedTo}
                                                onChange={handleNewAmcChange}
                                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none"
                                            >
                                                <option value="">Keep unassigned</option>
                                                {employeeOptions.map((employee) => (
                                                    <option key={employee}>{employee}</option>
                                                ))}
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
                                    className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-5 text-xs font-semibold text-white transition hover:bg-violet-700"
                                >
                                    <FileText size={15} />
                                    Create AMC Contract
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
                    onClose={() => setReminderRecord(null)}
                    onSubmit={handleSaveReminder}
                />
            )}  
        </>
    );
}