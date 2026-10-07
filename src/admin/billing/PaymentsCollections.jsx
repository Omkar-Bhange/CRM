import {
    useEffect,
    useMemo,
    useState,
    useRef,
} from "react";
import * as XLSX from "xlsx";
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    CreditCard,
    FileSpreadsheet,
    IndianRupee,
    PackageCheck,
    Printer,
    Receipt,
    RefreshCw,
    Search,
    ShieldCheck,
    SlidersHorizontal,
    Users,
    WalletCards,
    X,
} from "lucide-react";

import API_URL from "../../config/api";
import DataTable from "../../components/data/DataTable";

/* =====================================================
   AUTH
===================================================== */

const getAuthToken = () =>
    localStorage.getItem("client-connect-token") ||
    sessionStorage.getItem("client-connect-token") ||
    "";

/* =====================================================
   FORMAT HELPERS
===================================================== */

const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })}`;

const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

/*
 * Returns:
 * 2026-27
 * for any payment date falling inside
 * 01-Apr-2026 → 31-Mar-2027.
 */
const getFinancialYear = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = date.getMonth(); // Jan = 0, Apr = 3
    const startYear = month >= 3 ? year : year - 1;
    const endYear = String(startYear + 1).slice(-2);
    return `${startYear}-${endYear}`;
};

function amountToWords(amount) {
    const ones = [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
        "Seventeen", "Eighteen", "Nineteen",
    ];

    const tens = [
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
    ];

    const convertBelowHundred = (number) => {
        if (number < 20) return ones[number];
        return `${tens[Math.floor(number / 10)]} ${ones[number % 10]}`.trim();
    };

    const convertBelowThousand = (number) => {
        if (number < 100) return convertBelowHundred(number);
        return `${ones[Math.floor(number / 100)]} Hundred ${convertBelowHundred(number % 100)}`.trim();
    };

    const numericAmount = Math.floor(Number(amount || 0));
    if (numericAmount === 0) return "Zero Rupees Only";

    let remaining = numericAmount;
    const words = [];

    const crore = Math.floor(remaining / 10000000);
    if (crore) {
        words.push(`${convertBelowThousand(crore)} Crore`);
        remaining %= 10000000;
    }

    const lakh = Math.floor(remaining / 100000);
    if (lakh) {
        words.push(`${convertBelowThousand(lakh)} Lakh`);
        remaining %= 100000;
    }

    const thousand = Math.floor(remaining / 1000);
    if (thousand) {
        words.push(`${convertBelowThousand(thousand)} Thousand`);
        remaining %= 1000;
    }

    if (remaining) {
        words.push(convertBelowThousand(remaining));
    }

    return `${words.join(" ")} Rupees Only`;
}

/* =====================================================
   NORMALIZE PAYMENT
===================================================== */

const normalizePayment = (payment = {}, sourceType = "") => ({
    id: String(payment._id || payment.id || ""),
    sourceType,
    clientId: payment.clientId ? String(payment.clientId) : "",
    clientCode: payment.clientCode || "",
    clientName: payment.clientName || "",
    invoiceId: payment.productSaleId || payment.amcInvoiceId || payment.invoiceId || "",
    invoiceNo: payment.invoiceNo || payment.saleCode || payment.invoiceCode || payment.amcInvoiceNo || "",
    paymentDate: payment.paymentDate || payment.createdAt || null,
    amount: Number(payment.amount || 0),
    mode: payment.mode || "",
    referenceNo: payment.referenceNo || "",
    notes: payment.notes || "",
    createdAt: payment.createdAt || null,
    amcInvoiceId: payment.amcInvoiceId ? String(payment.amcInvoiceId) : "",
    contractCode: payment.contractCode || "",
    invoiceCode: payment.invoiceCode || payment.invoiceNo || "",
    productCode: payment.productCode || "",
    productName: payment.productName || "",
    productVersion: payment.productVersion || "",
    plan: payment.plan || "",
    licensedUsers: Number(payment.licensedUsers || 0),
    contractStartDate: payment.contractStartDate || null,
    contractExpiryDate: payment.contractExpiryDate || null,
    invoiceDate: payment.invoiceDate || null,
    dueDate: payment.dueDate || null,
    invoiceTotalAmount: Number(payment.invoiceTotalAmount || 0),
    invoicePaidAmount: Number(payment.invoicePaidAmount || 0),
    invoicePendingAmount: Number(payment.invoicePendingAmount || 0),
    invoicePaymentStatus: payment.invoicePaymentStatus || "",
});

/* =====================================================
   VISUAL BADGES
===================================================== */

function PaymentModeBadge({ mode }) {
    if (!mode) return <span className="text-slate-400">—</span>;

    const lower = mode.toLowerCase();
    let badgeStyle = "bg-slate-100 text-slate-700 border-slate-200";

    if (lower.includes("upi")) {
        badgeStyle = "bg-purple-50 text-purple-700 border-purple-200/80";
    } else if (lower.includes("bank") || lower.includes("neft") || lower.includes("rtgs") || lower.includes("imps") || lower.includes("transfer")) {
        badgeStyle = "bg-blue-50 text-blue-700 border-blue-200/80";
    } else if (lower.includes("cheque") || lower.includes("check")) {
        badgeStyle = "bg-amber-50 text-amber-700 border-amber-200/80";
    } else if (lower.includes("cash")) {
        badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200/80";
    } else if (lower.includes("card")) {
        badgeStyle = "bg-indigo-50 text-indigo-700 border-indigo-200/80";
    }

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${badgeStyle}`}>
            <CreditCard className="h-2.5 w-2.5 opacity-70" />
            {mode}
        </span>
    );
}

function SourceTypeBadge({ sourceType }) {
    if (sourceType === "PRODUCT_SALE") {
        return (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/80">
                <PackageCheck className="h-2.5 w-2.5" />
                Product Sale
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200/80">
            <ShieldCheck className="h-2.5 w-2.5" />
            AMC
        </span>
    );
}

/* =====================================================
   MAIN COMPONENT
===================================================== */

export default function PaymentsCollections() {
    /* =================================================
       DATA
    ================================================= */
    const [productSalePayments, setProductSalePayments] = useState([]);
    const [amcPayments, setAmcPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    /* =================================================
       FILTERS
    ================================================= */
    const [searchValue, setSearchValue] = useState("");
    const [sourceFilter, setSourceFilter] = useState("ALL");
    const [modeFilter, setModeFilter] = useState("ALL");
    const [financialYearFilter, setFinancialYearFilter] = useState("ALL");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [selectedClientKey, setSelectedClientKey] = useState("");

    /* =================================================
       UI VIEW & MODAL STATES
    ================================================= */
    const [tableViewMode, setTableViewMode] = useState("clients"); // "clients" | "transactions"
    const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState(null);
    const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
    const exportDropdownRef = useRef(null);

    // Close export dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e) {
            if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
                setExportDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    /* =================================================
       LOAD PAYMENTS
    ================================================= */
    const loadPayments = async () => {
        try {
            setLoading(true);
            setError("");

            const token = getAuthToken();
            if (!token) {
                throw new Error("Login token was not found. Please login again.");
            }

            const headers = {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            };

            /* PRODUCT SALE PAYMENTS */
            const saleResponse = await fetch(
                `${API_URL}/api/admin/product-sale-payments?limit=500`,
                { method: "GET", headers }
            );
            const saleResult = await saleResponse.json();

            if (saleResponse.status === 401) {
                throw new Error("Your login session has expired. Please login again.");
            }
            if (!saleResponse.ok || saleResult.success !== true) {
                throw new Error(saleResult.message || "Unable to load product sale payments.");
            }

            /* AMC PAYMENTS */
            const amcResponse = await fetch(
                `${API_URL}/api/admin/amc-payments?limit=500`,
                { method: "GET", headers }
            );
            const amcResult = await amcResponse.json();

            if (amcResponse.status === 401) {
                throw new Error("Your login session has expired. Please login again.");
            }
            if (!amcResponse.ok || amcResult.success !== true) {
                throw new Error(amcResult.message || "Unable to load AMC payments.");
            }

            const normalizedSalePayments = Array.isArray(saleResult.data)
                ? saleResult.data.map((payment) => normalizePayment(payment, "PRODUCT_SALE"))
                : [];

            const normalizedAmcPayments = Array.isArray(amcResult.data)
                ? amcResult.data.map((payment) => normalizePayment(payment, "AMC"))
                : [];

            setProductSalePayments(normalizedSalePayments);
            setAmcPayments(normalizedAmcPayments);
        } catch (loadError) {
            console.error("Load Payments & Collections Error:", loadError);
            setProductSalePayments([]);
            setAmcPayments([]);
            setError(loadError.message || "Unable to load payments.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPayments();
    }, []);

    /* =================================================
       ALL PAYMENTS
    ================================================= */
    const allPayments = useMemo(
        () =>
            [...productSalePayments, ...amcPayments].sort(
                (first, second) =>
                    new Date(second.paymentDate || 0).getTime() -
                    new Date(first.paymentDate || 0).getTime()
            ),
        [productSalePayments, amcPayments]
    );

    /* =================================================
       AVAILABLE FINANCIAL YEARS
    ================================================= */
    const financialYears = useMemo(() => {
        const years = new Set();
        allPayments.forEach((payment) => {
            const fy = getFinancialYear(payment.paymentDate);
            if (fy) years.add(fy);
        });
        return Array.from(years).sort(
            (first, second) =>
                Number(second.split("-")[0]) - Number(first.split("-")[0])
        );
    }, [allPayments]);

    /* =================================================
       AVAILABLE PAYMENT MODES
    ================================================= */
    const paymentModes = useMemo(() => {
        const modes = new Set();
        allPayments.forEach((payment) => {
            if (payment.mode) modes.add(payment.mode);
        });
        return Array.from(modes).sort();
    }, [allPayments]);

    /* =================================================
       FILTER ENGINE
    ================================================= */
    const filteredPayments = useMemo(() => {
        const search = searchValue.trim().toLowerCase();

        return allPayments.filter((payment) => {
            /* CLIENT SEARCH */
            if (search) {
                const haystack = [
                    payment.clientName,
                    payment.clientCode,
                    payment.invoiceNo,
                    payment.invoiceCode,
                    payment.referenceNo,
                    payment.productName,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                if (!haystack.includes(search)) {
                    return false;
                }
            }

            /* SOURCE */
            if (sourceFilter !== "ALL" && payment.sourceType !== sourceFilter) {
                return false;
            }

            /* PAYMENT MODE */
            if (modeFilter !== "ALL" && payment.mode !== modeFilter) {
                return false;
            }

            /* FINANCIAL YEAR */
            if (financialYearFilter !== "ALL") {
                const paymentFy = getFinancialYear(payment.paymentDate);
                if (paymentFy !== financialYearFilter) {
                    return false;
                }
            }

            /* CUSTOM FROM / TO DATE */
            if (fromDate || toDate) {
                if (!payment.paymentDate) return false;
                const paymentDate = new Date(payment.paymentDate);
                if (Number.isNaN(paymentDate.getTime())) return false;

                if (fromDate) {
                    const from = new Date(`${fromDate}T00:00:00`);
                    if (paymentDate < from) return false;
                }

                if (toDate) {
                    const to = new Date(`${toDate}T23:59:59.999`);
                    if (paymentDate > to) return false;
                }
            }

            return true;
        });
    }, [
        allPayments,
        searchValue,
        sourceFilter,
        modeFilter,
        financialYearFilter,
        fromDate,
        toDate,
    ]);

    /* =================================================
       CLIENT-WISE GROUPING
    ================================================= */
    const groupedClients = useMemo(() => {
        const map = new Map();

        filteredPayments.forEach((payment) => {
            const key = String(
                payment.clientId ||
                payment.clientCode ||
                payment.clientName ||
                ""
            );
            if (!key) return;

            if (!map.has(key)) {
                map.set(key, {
                    key,
                    clientId: payment.clientId,
                    clientCode: payment.clientCode,
                    clientName: payment.clientName || "Unknown Client",
                    payments: [],
                    productSaleReceived: 0,
                    amcReceived: 0,
                    totalReceived: 0,
                    lastPaymentDate: null,
                });
            }

            const group = map.get(key);
            group.payments.push(payment);

            if (payment.sourceType === "PRODUCT_SALE") {
                group.productSaleReceived += Number(payment.amount || 0);
            }
            if (payment.sourceType === "AMC") {
                group.amcReceived += Number(payment.amount || 0);
            }
            group.totalReceived += Number(payment.amount || 0);

            if (payment.paymentDate) {
                if (
                    !group.lastPaymentDate ||
                    new Date(payment.paymentDate) > new Date(group.lastPaymentDate)
                ) {
                    group.lastPaymentDate = payment.paymentDate;
                }
            }
        });

        return Array.from(map.values()).sort(
            (first, second) =>
                second.totalReceived - first.totalReceived ||
                first.clientName.localeCompare(second.clientName)
        );
    }, [filteredPayments]);

    /* =================================================
       CURRENT SELECTED CLIENT
    ================================================= */
    const selectedClientGroup = useMemo(
        () =>
            groupedClients.find(
                (client) => String(client.key) === String(selectedClientKey)
            ) || null,
        [groupedClients, selectedClientKey]
    );

    useEffect(() => {
        if (selectedClientKey && !selectedClientGroup) {
            setSelectedClientKey("");
        }
    }, [selectedClientKey, selectedClientGroup]);

    /* =================================================
       PRODUCT SALE PAYMENTS FOR SELECTED CLIENT
    ================================================= */
    const selectedClientProductPayments = useMemo(() => {
        if (!selectedClientGroup) return [];

        return selectedClientGroup.payments
            .filter((payment) => payment.sourceType === "PRODUCT_SALE")
            .sort(
                (first, second) =>
                    new Date(second.paymentDate || 0).getTime() -
                    new Date(first.paymentDate || 0).getTime()
            );
    }, [selectedClientGroup]);

    /* =================================================
       AMC CYCLE GROUPING FOR SELECTED CLIENT
    ================================================= */
    const selectedClientAmcCycles = useMemo(() => {
        if (!selectedClientGroup) return [];

        const map = new Map();

        selectedClientGroup.payments
            .filter((payment) => payment.sourceType === "AMC")
            .forEach((payment) => {
                const key = String(
                    payment.amcInvoiceId ||
                    payment.invoiceCode ||
                    payment.invoiceNo ||
                    ""
                );
                if (!key) return;

                if (!map.has(key)) {
                    map.set(key, {
                        key,
                        amcInvoiceId: payment.amcInvoiceId,
                        invoiceCode: payment.invoiceCode || payment.invoiceNo,
                        contractCode: payment.contractCode,
                        productCode: payment.productCode,
                        productName: payment.productName || "AMC",
                        productVersion: payment.productVersion,
                        plan: payment.plan,
                        licensedUsers: payment.licensedUsers,
                        contractStartDate: payment.contractStartDate,
                        contractExpiryDate: payment.contractExpiryDate,
                        invoiceDate: payment.invoiceDate,
                        dueDate: payment.dueDate,
                        invoiceTotalAmount: payment.invoiceTotalAmount,
                        invoicePaidAmount: payment.invoicePaidAmount,
                        invoicePendingAmount: payment.invoicePendingAmount,
                        invoicePaymentStatus: payment.invoicePaymentStatus,
                        installments: [],
                        filteredInstallmentTotal: 0,
                    });
                }

                const cycle = map.get(key);
                cycle.installments.push(payment);
                cycle.filteredInstallmentTotal += Number(payment.amount || 0);
            });

        return Array.from(map.values())
            .map((cycle) => ({
                ...cycle,
                installments: cycle.installments.sort(
                    (first, second) =>
                        new Date(second.paymentDate || 0).getTime() -
                        new Date(first.paymentDate || 0).getTime()
                ),
            }))
            .sort(
                (first, second) =>
                    new Date(second.contractStartDate || second.invoiceDate || 0).getTime() -
                    new Date(first.contractStartDate || first.invoiceDate || 0).getTime()
            );
    }, [selectedClientGroup]);

    /* =================================================
       FILTERED SUMMARY
    ================================================= */
    const summary = useMemo(() => {
        const productSaleReceived = filteredPayments
            .filter((p) => p.sourceType === "PRODUCT_SALE")
            .reduce((sum, p) => sum + Number(p.amount || 0), 0);

        const amcReceived = filteredPayments
            .filter((p) => p.sourceType === "AMC")
            .reduce((sum, p) => sum + Number(p.amount || 0), 0);

        return {
            productSaleReceived,
            amcReceived,
            totalReceived: productSaleReceived + amcReceived,
            paymentCount: filteredPayments.length,
            clientCount: groupedClients.length,
        };
    }, [filteredPayments, groupedClients]);

    /* =================================================
       ACTIVE FILTER COUNT & CLEAR
    ================================================= */
    const activeFilterCount = [
        sourceFilter !== "ALL",
        modeFilter !== "ALL",
        financialYearFilter !== "ALL",
        Boolean(fromDate),
        Boolean(toDate),
        Boolean(searchValue.trim()),
    ].filter(Boolean).length;

    const clearFilters = () => {
        setSearchValue("");
        setSourceFilter("ALL");
        setModeFilter("ALL");
        setFinancialYearFilter("ALL");
        setFromDate("");
        setToDate("");
        setSelectedClientKey("");
    };

    /* QUICK DATE PRESETS */
    const applyDatePreset = (preset) => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        if (preset === "today") {
            const dateStr = now.toISOString().slice(0, 10);
            setFromDate(dateStr);
            setToDate(dateStr);
            setFinancialYearFilter("ALL");
        } else if (preset === "thisMonth") {
            const firstDay = new Date(year, month, 1).toISOString().slice(0, 10);
            const lastDay = new Date(year, month + 1, 0).toISOString().slice(0, 10);
            setFromDate(firstDay);
            setToDate(lastDay);
            setFinancialYearFilter("ALL");
        } else if (preset === "lastMonth") {
            const firstDay = new Date(year, month - 1, 1).toISOString().slice(0, 10);
            const lastDay = new Date(year, month, 0).toISOString().slice(0, 10);
            setFromDate(firstDay);
            setToDate(lastDay);
            setFinancialYearFilter("ALL");
        } else if (preset === "thisFY") {
            const currentFY = getFinancialYear(now.toISOString());
            if (currentFY) setFinancialYearFilter(currentFY);
            setFromDate("");
            setToDate("");
        } else if (preset === "all") {
            setFromDate("");
            setToDate("");
            setFinancialYearFilter("ALL");
        }
    };

    /* EXPORT EXCEL */
    const handleExportExcel = (type = "transactions") => {
        setExportDropdownOpen(false);
        if (type === "transactions") {
            const rows = filteredPayments.map((p, idx) => ({
                "S.No": idx + 1,
                "Payment Date": formatDate(p.paymentDate),
                "Client Name": p.clientName || "—",
                "Client Code": p.clientCode || "—",
                "Stream": p.sourceType === "PRODUCT_SALE" ? "Product Sale" : "AMC Maintenance",
                "Invoice / Ref": p.invoiceNo || p.invoiceCode || "—",
                "Mode": p.mode || "—",
                "Reference / UTR": p.referenceNo || "—",
                "Amount (INR)": p.amount,
                "Notes": p.notes || "",
            }));

            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Collections_Transactions");
            XLSX.writeFile(
                wb,
                `Collections_Transactions_${new Date().toISOString().slice(0, 10)}.xlsx`
            );
        } else {
            const rows = groupedClients.map((c, idx) => ({
                "S.No": idx + 1,
                "Client Name": c.clientName,
                "Client Code": c.clientCode || "—",
                "Product Sale Received (INR)": c.productSaleReceived,
                "AMC Received (INR)": c.amcReceived,
                "Total Received (INR)": c.totalReceived,
                "Payment Count": c.payments?.length || 0,
                "Last Payment Date": formatDate(c.lastPaymentDate),
            }));

            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Client_Collections_Summary");
            XLSX.writeFile(
                wb,
                `Client_Collections_Summary_${new Date().toISOString().slice(0, 10)}.xlsx`
            );
        }
    };

    /* =================================================
       RECEIPT VOUCHER MODAL
    ================================================= */
    const renderReceiptModal = () => {
        if (!selectedPaymentForReceipt) return null;
        const p = selectedPaymentForReceipt;
        const receiptCode = `RCP-${p.id ? p.id.slice(-8).toUpperCase() : "TXN"}`;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fade-in">
                <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
                    {/* MODAL TOP BAR (Controls) */}
                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-3.5">
                        <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-[#1B59F8]" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                Official Payment Receipt
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                            >
                                <Printer className="h-3.5 w-3.5" />
                                Print Voucher
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedPaymentForReceipt(null)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* VOUCHER BODY */}
                    <div id="payment-receipt-print-area" className="p-6 sm:p-8 space-y-6">
                        {/* HEADER BRANDING */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-100 pb-6">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1B59F8] text-white font-bold text-sm shadow-sm">
                                        CC
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 leading-tight">
                                            Client Connect CRM
                                        </h3>
                                        <p className="text-[11px] text-slate-500">Revenue & Collections Operations</p>
                                    </div>
                                </div>
                            </div>

                            <div className="sm:text-right">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Payment Verified & Cleared
                                </span>
                                <p className="mt-2 text-xs font-mono font-bold text-slate-900">
                                    {receiptCode}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                    Date: <span className="font-semibold text-slate-700">{formatDate(p.paymentDate)}</span>
                                </p>
                            </div>
                        </div>

                        {/* CLIENT & ALLOCATION GRID */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Received From
                                </p>
                                <p className="mt-1 text-sm font-bold text-slate-900">
                                    {p.clientName || "Unknown Client"}
                                </p>
                                {p.clientCode && (
                                    <span className="mt-1 inline-block text-[11px] font-mono font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                        Client ID: {p.clientCode}
                                    </span>
                                )}
                            </div>

                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Accounted Against
                                </p>
                                <div className="mt-1 flex items-center gap-2">
                                    <SourceTypeBadge sourceType={p.sourceType} />
                                    <span className="text-xs font-semibold text-slate-700">
                                        {p.invoiceNo || p.invoiceCode || "Direct Receipt"}
                                    </span>
                                </div>
                                {p.productName && (
                                    <p className="mt-1 text-[11px] text-slate-500">
                                        Product / Service: <span className="font-medium text-slate-700">{p.productName}</span>
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* TRANSACTION DETAILS */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-b border-slate-100 pb-6">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Payment Mode
                                </p>
                                <div className="mt-1">
                                    <PaymentModeBadge mode={p.mode || "Standard"} />
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Reference / UTR No.
                                </p>
                                <p className="mt-1 text-xs font-mono font-medium text-slate-800">
                                    {p.referenceNo || "—"}
                                </p>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Financial Year
                                </p>
                                <p className="mt-1 text-xs font-semibold text-slate-700">
                                    FY {getFinancialYear(p.paymentDate) || "—"}
                                </p>
                            </div>
                            {p.notes && (
                                <div className="col-span-2 sm:col-span-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                        Remarks & Notes
                                    </p>
                                    <p className="mt-1 text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                                        {p.notes}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* HIGHLIGHTED AMOUNT BANNER */}
                        <div className="rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white p-5">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
                                        Amount Received
                                    </p>
                                    <p className="mt-0.5 text-xs text-blue-700">
                                        {amountToWords(p.amount)}
                                    </p>
                                </div>
                                <div className="sm:text-right">
                                    <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-blue-700">
                                        {formatCurrency(p.amount)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* FOOTER NOTICE */}
                        <div className="flex items-center justify-between pt-2 text-[10px] text-slate-400">
                            <p>This is a computer-generated voucher and requires no physical signature.</p>
                            <p className="font-mono">CRM-REC-V1</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    /* =================================================
       PAGE RENDER
    ================================================= */
    return (
        <div className="enterprise-page space-y-6">
            {/* =========================================
                PAGE TOP HEADER
            ========================================= */}
            <header className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/20">
                                <WalletCards className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg font-bold tracking-tight text-slate-900">
                                        Payments & Collections
                                    </h1>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200/60">
                                        <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                                        Revenue Hub
                                    </span>
                                </div>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Consolidated financial receipts across Product Sales & AMC contracts with installment ledgers.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* TOP ACTION BAR */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* VIEW MODE PILL TOGGLE */}
                        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100/80 p-1 text-xs">
                            <button
                                type="button"
                                onClick={() => setTableViewMode("clients")}
                                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition ${
                                    tableViewMode === "clients"
                                        ? "bg-white text-slate-900 shadow-2xs"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <Users className="h-3.5 w-3.5" />
                                Client Summary
                                <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600">
                                    {groupedClients.length}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setTableViewMode("transactions")}
                                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition ${
                                    tableViewMode === "transactions"
                                        ? "bg-white text-slate-900 shadow-2xs"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <Receipt className="h-3.5 w-3.5" />
                                All Transactions
                                <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600">
                                    {filteredPayments.length}
                                </span>
                            </button>
                        </div>

                        {/* EXPORT DROPDOWN */}
                        <div className="relative" ref={exportDropdownRef}>
                            <button
                                type="button"
                                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                                className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                            >
                                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Export</span>
                                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                            </button>

                            {exportDropdownOpen && (
                                <div className="absolute right-0 mt-1.5 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-30 animate-fade-in">
                                    <button
                                        type="button"
                                        onClick={() => handleExportExcel("transactions")}
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                                    >
                                        <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                                        <div>
                                            <p className="font-semibold text-slate-900">Export Transactions</p>
                                            <p className="text-[10px] text-slate-400">All {filteredPayments.length} filtered records</p>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleExportExcel("clients")}
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                                    >
                                        <Users className="h-4 w-4 text-blue-600" />
                                        <div>
                                            <p className="font-semibold text-slate-900">Export Client Summary</p>
                                            <p className="text-[10px] text-slate-400">{groupedClients.length} clients overview</p>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* REFRESH BUTTON */}
                        <button
                            type="button"
                            onClick={loadPayments}
                            disabled={loading}
                            className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${loading ? "animate-spin text-[#1B59F8]" : ""}`} />
                            {loading ? "Syncing..." : "Refresh"}
                        </button>
                    </div>
                </div>
            </header>

            {/* ERROR BANNER */}
            {error && (
                <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-xs font-semibold text-rose-800">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{error}</span>
                </div>
            )}

            {/* =========================================
                KPI SUMMARY CARDS
            ========================================= */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. TOTAL COLLECTIONS */}
                <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Total Collected
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                            <IndianRupee className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                            {formatCurrency(summary.totalReceived)}
                        </h2>
                    </div>
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-blue-700">
                            <CheckCircle2 className="h-3 w-3 text-blue-600" />
                            100% Collected
                        </span>
                        <span>{summary.paymentCount} Receipts</span>
                    </div>
                </div>

                {/* 2. PRODUCT SALE REVENUE */}
                <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Product Sales
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <PackageCheck className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <h2 className="text-2xl font-extrabold tracking-tight text-emerald-700">
                            {formatCurrency(summary.productSaleReceived)}
                        </h2>
                    </div>
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <span className="font-semibold text-emerald-700">
                            {summary.totalReceived > 0
                                ? `${Math.round((summary.productSaleReceived / summary.totalReceived) * 100)}% of Total`
                                : "0%"}
                        </span>
                        <span>Product Invoices</span>
                    </div>
                </div>

                {/* 3. AMC REVENUE */}
                <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            AMC Maintenance
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                            <ShieldCheck className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <h2 className="text-2xl font-extrabold tracking-tight text-[#1B59F8]">
                            {formatCurrency(summary.amcReceived)}
                        </h2>
                    </div>
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <span className="font-semibold text-blue-700">
                            {summary.totalReceived > 0
                                ? `${Math.round((summary.amcReceived / summary.totalReceived) * 100)}% of Total`
                                : "0%"}
                        </span>
                        <span>AMC Contracts</span>
                    </div>
                </div>

                {/* 4. ACTIVITY & CLIENTS */}
                <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Active Payers
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                            <Users className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                            {summary.clientCount}
                        </h2>
                        <span className="text-xs font-semibold text-slate-400">Clients</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <span className="font-medium text-slate-700">
                            {summary.paymentCount} total transactions
                        </span>
                        <span>In filter</span>
                    </div>
                </div>
            </section>

            {/* =========================================
                ADVANCED FILTER BAR
            ========================================= */}
            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4 text-[#1B59F8]" />
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                            Filters & Query Engine
                        </h2>
                        {activeFilterCount > 0 && (
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#1B59F8] border border-blue-200/80">
                                {activeFilterCount} Active
                            </span>
                        )}
                    </div>

                    {/* QUICK DATE PRESETS */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => applyDatePreset("today")}
                            className="rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                        >
                            Today
                        </button>
                        <button
                            type="button"
                            onClick={() => applyDatePreset("thisMonth")}
                            className="rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                        >
                            This Month
                        </button>
                        <button
                            type="button"
                            onClick={() => applyDatePreset("lastMonth")}
                            className="rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                        >
                            Last Month
                        </button>
                        <button
                            type="button"
                            onClick={() => applyDatePreset("thisFY")}
                            className="rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                        >
                            This FY
                        </button>
                        {activeFilterCount > 0 && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition"
                            >
                                <X className="h-3 w-3" />
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                    {/* SEARCH INPUT */}
                    <div className="sm:col-span-2">
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Search Records
                        </label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                            <input
                                type="text"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                placeholder="Client, code, invoice, product, UTR..."
                                className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-7 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#1B59F8] focus:ring-2 focus:ring-blue-100"
                            />
                            {searchValue && (
                                <button
                                    type="button"
                                    onClick={() => setSearchValue("")}
                                    className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* SOURCE FILTER */}
                    <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Revenue Stream
                        </label>
                        <select
                            value={sourceFilter}
                            onChange={(e) => setSourceFilter(e.target.value)}
                            className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none focus:border-[#1B59F8] focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="ALL">All Streams</option>
                            <option value="PRODUCT_SALE">Product Sales</option>
                            <option value="AMC">AMC Contracts</option>
                        </select>
                    </div>

                    {/* PAYMENT MODE FILTER */}
                    <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Payment Mode
                        </label>
                        <select
                            value={modeFilter}
                            onChange={(e) => setModeFilter(e.target.value)}
                            className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none focus:border-[#1B59F8] focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="ALL">All Modes</option>
                            {paymentModes.map((mode) => (
                                <option key={mode} value={mode}>
                                    {mode}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* FINANCIAL YEAR */}
                    <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Financial Year
                        </label>
                        <select
                            value={financialYearFilter}
                            onChange={(e) => setFinancialYearFilter(e.target.value)}
                            className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none focus:border-[#1B59F8] focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="ALL">All Financial Years</option>
                            {financialYears.map((year) => (
                                <option key={year} value={year}>
                                    FY {year}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* DATE RANGE: FROM / TO */}
                    <div className="grid grid-cols-2 gap-2 sm:col-span-2 xl:col-span-1">
                        <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                From Date
                            </label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2 text-[11px] text-slate-700 outline-none focus:border-[#1B59F8] focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                To Date
                            </label>
                            <input
                                type="date"
                                value={toDate}
                                min={fromDate || undefined}
                                onChange={(e) => setToDate(e.target.value)}
                                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2 text-[11px] text-slate-700 outline-none focus:border-[#1B59F8] focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* =========================================
                PRIMARY DATA TABLE
            ========================================= */}
            {tableViewMode === "clients" ? (
                /* -----------------------------------------
                   VIEW 1: CLIENT COLLECTIONS ROLLUP
                ----------------------------------------- */
                <DataTable
                    moduleName="Collections"
                    viewTitle="Client Collections Summary"
                    views={[
                        { id: "all", label: "All Collections" },
                        { id: "products", label: "Product Sale Collections" },
                        { id: "amc", label: "AMC Collections" },
                    ]}
                    activeView={
                        sourceFilter === "PRODUCT_SALE"
                            ? "products"
                            : sourceFilter === "AMC"
                            ? "amc"
                            : "all"
                    }
                    onViewChange={(viewId) => {
                        if (viewId === "products") setSourceFilter("PRODUCT_SALE");
                        else if (viewId === "amc") setSourceFilter("AMC");
                        else setSourceFilter("ALL");
                    }}
                    selectable={true}
                    columns={[
                        {
                            key: "clientName",
                            label: "Client",
                            sortable: true,
                            render: (_, client) => (
                                <div className="flex min-w-[220px] items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-100 to-indigo-100 text-xs font-bold text-[#1B59F8] border border-blue-200/60">
                                        {client.clientName
                                            ?.split(" ")
                                            .slice(0, 2)
                                            .map((w) => w[0])
                                            .join("")
                                            .toUpperCase() || "C"}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900 hover:text-[#1B59F8] transition">
                                            {client.clientName}
                                        </p>
                                        <span className="mt-0.5 inline-block font-mono text-[10px] text-slate-400">
                                            {client.clientCode || "No Code"}
                                        </span>
                                    </div>
                                </div>
                            ),
                        },
                        {
                            key: "productSaleReceived",
                            label: "Product Sales",
                            sortable: true,
                            render: (val) => (
                                <span className="text-xs font-semibold text-slate-700">
                                    {formatCurrency(val)}
                                </span>
                            ),
                        },
                        {
                            key: "amcReceived",
                            label: "AMC Received",
                            sortable: true,
                            render: (val) => (
                                <span className="text-xs font-semibold text-slate-700">
                                    {formatCurrency(val)}
                                </span>
                            ),
                        },
                        {
                            key: "totalReceived",
                            label: "Total Collected",
                            sortable: true,
                            render: (val) => (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-emerald-700">
                                        {formatCurrency(val)}
                                    </span>
                                </div>
                            ),
                        },
                        {
                            key: "payments",
                            label: "Receipts",
                            sortable: true,
                            render: (_, client) => (
                                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                                    <Receipt className="h-2.5 w-2.5 opacity-60" />
                                    {client.payments?.length || 0} txn
                                </span>
                            ),
                        },
                        {
                            key: "lastPaymentDate",
                            label: "Last Payment",
                            sortable: true,
                            render: (val) => (
                                <span className="text-xs text-slate-500">
                                    {formatDate(val)}
                                </span>
                            ),
                        },
                    ]}
                    data={groupedClients}
                    loading={loading}
                    error={error}
                    onRetry={loadPayments}
                    idKey="key"
                    onRowClick={(client) => setSelectedClientKey(client.key)}
                    searchPlaceholder="Search client collections..."
                    toolbarActions={
                        activeFilterCount > 0 && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="flex h-8 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-[#1B59F8] hover:bg-blue-100 transition"
                            >
                                Reset Filters ({activeFilterCount})
                            </button>
                        )
                    }
                    rowActions={[
                        {
                            label: "Open Ledger",
                            icon: () => (
                                <span className="flex items-center gap-1 text-[11px] font-semibold text-[#1B59F8] px-2.5 py-1 bg-blue-50 rounded-lg border border-blue-200/80 hover:bg-blue-100 transition">
                                    Ledger
                                    <ChevronRight className="h-3 w-3" />
                                </span>
                            ),
                            onClick: (client) => setSelectedClientKey(client.key),
                        },
                    ]}
                    initialPageSize={25}
                    emptyTitle="No client payment records found"
                    emptyDescription="Try clearing or adjusting the selected filters to view results."
                />
            ) : (
                /* -----------------------------------------
                   VIEW 2: INDIVIDUAL TRANSACTIONS LEDGER
                ----------------------------------------- */
                <DataTable
                    moduleName="Transactions"
                    viewTitle="All Collection Transactions"
                    views={[
                        { id: "all", label: "All Transactions" },
                        { id: "products", label: "Product Sale Receipts" },
                        { id: "amc", label: "AMC Receipts" },
                    ]}
                    activeView={
                        sourceFilter === "PRODUCT_SALE"
                            ? "products"
                            : sourceFilter === "AMC"
                            ? "amc"
                            : "all"
                    }
                    onViewChange={(viewId) => {
                        if (viewId === "products") setSourceFilter("PRODUCT_SALE");
                        else if (viewId === "amc") setSourceFilter("AMC");
                        else setSourceFilter("ALL");
                    }}
                    selectable={true}
                    columns={[
                        {
                            key: "paymentDate",
                            label: "Date",
                            sortable: true,
                            render: (val) => (
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3 w-3 text-slate-400" />
                                    <span className="text-xs font-semibold text-slate-700">
                                        {formatDate(val)}
                                    </span>
                                </div>
                            ),
                        },
                        {
                            key: "clientName",
                            label: "Client",
                            sortable: true,
                            render: (_, p) => (
                                <div>
                                    <p className="text-xs font-bold text-slate-900">{p.clientName}</p>
                                    <p className="text-[10px] font-mono text-slate-400">{p.clientCode || "—"}</p>
                                </div>
                            ),
                        },
                        {
                            key: "sourceType",
                            label: "Stream",
                            sortable: true,
                            render: (val) => <SourceTypeBadge sourceType={val} />,
                        },
                        {
                            key: "invoiceNo",
                            label: "Invoice / Ref",
                            sortable: true,
                            render: (val, p) => (
                                <span className="font-mono text-xs font-semibold text-slate-700">
                                    {val || p.invoiceCode || "—"}
                                </span>
                            ),
                        },
                        {
                            key: "mode",
                            label: "Mode",
                            sortable: true,
                            render: (val) => <PaymentModeBadge mode={val} />,
                        },
                        {
                            key: "referenceNo",
                            label: "Reference / UTR",
                            sortable: true,
                            render: (val) => (
                                <span className="text-xs font-mono text-slate-500">
                                    {val || "—"}
                                </span>
                            ),
                        },
                        {
                            key: "amount",
                            label: "Amount Received",
                            sortable: true,
                            render: (val) => (
                                <span className="text-xs font-bold text-emerald-700">
                                    {formatCurrency(val)}
                                </span>
                            ),
                        },
                    ]}
                    data={filteredPayments}
                    loading={loading}
                    error={error}
                    onRetry={loadPayments}
                    idKey="id"
                    onRowClick={(p) => setSelectedPaymentForReceipt(p)}
                    searchPlaceholder="Search transactions..."
                    toolbarActions={
                        activeFilterCount > 0 && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="flex h-8 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-[#1B59F8] hover:bg-blue-100 transition"
                            >
                                Reset Filters ({activeFilterCount})
                            </button>
                        )
                    }
                    rowActions={[
                        {
                            label: "View Receipt",
                            icon: () => (
                                <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 px-2.5 py-1 bg-white rounded-lg border border-slate-200 shadow-2xs hover:bg-slate-50 transition">
                                    <Receipt className="h-3 w-3 text-blue-600" />
                                    Receipt
                                </span>
                            ),
                            onClick: (p) => setSelectedPaymentForReceipt(p),
                        },
                    ]}
                    initialPageSize={25}
                    emptyTitle="No collection transactions found"
                    emptyDescription="No payment entries match the selected filters."
                />
            )}

            {/* =========================================
                CLIENT PAYMENT LEDGER (DEEP DIVE SECTION)
            ========================================= */}
            {selectedClientGroup && (
                <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md animate-fade-in">
                    {/* LEDGER HERO HEADER */}
                    <div className="flex flex-col gap-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-blue-50/20 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-base font-bold text-white shadow-md shadow-blue-500/20">
                                {selectedClientGroup.clientName
                                    ?.split(" ")
                                    .slice(0, 2)
                                    .map((w) => w[0])
                                    .join("")
                                    .toUpperCase() || "C"}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#1B59F8]">
                                        Client Payment Ledger
                                    </span>
                                    {selectedClientGroup.clientCode && (
                                        <span className="font-mono text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                            {selectedClientGroup.clientCode}
                                        </span>
                                    )}
                                </div>
                                <h2 className="mt-1 text-lg font-bold text-slate-900">
                                    {selectedClientGroup.clientName}
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Showing{" "}
                                    <span className="font-semibold text-slate-800">
                                        {selectedClientGroup.payments.length}
                                    </span>{" "}
                                    payment{selectedClientGroup.payments.length === 1 ? "" : "s"} totaling{" "}
                                    <span className="font-bold text-emerald-700">
                                        {formatCurrency(selectedClientGroup.totalReceived)}
                                    </span>{" "}
                                    under current filter.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setSelectedClientKey("")}
                                className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition"
                            >
                                <X className="h-3.5 w-3.5" />
                                Close Ledger
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6 p-6">
                        {/* =================================
                            1. PRODUCT SALE COLLECTIONS
                        ================================= */}
                        {selectedClientProductPayments.length > 0 && (
                            <div className="overflow-hidden rounded-xl border border-slate-200/90 shadow-2xs">
                                <div className="flex flex-col gap-2 border-b border-slate-200 bg-gradient-to-r from-emerald-50/60 to-white px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-2">
                                        <PackageCheck className="h-4 w-4 text-emerald-600" />
                                        <div>
                                            <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                                                Product Sale Collections
                                            </h3>
                                            <p className="text-[11px] text-slate-500">
                                                Payments received against direct product sale invoices.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-left sm:text-right">
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                            Filtered Total
                                        </p>
                                        <p className="text-xs font-bold text-emerald-700">
                                            {formatCurrency(
                                                selectedClientProductPayments.reduce(
                                                    (tot, p) => tot + Number(p.amount || 0),
                                                    0
                                                )
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-100">
                                        <thead className="bg-slate-50/80">
                                            <tr>
                                                <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                    Payment Date
                                                </th>
                                                <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                    Invoice No.
                                                </th>
                                                <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                    Mode
                                                </th>
                                                <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                    Reference / UTR
                                                </th>
                                                <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                    Notes
                                                </th>
                                                <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                    Amount
                                                </th>
                                                <th className="px-4 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {selectedClientProductPayments.map((p) => (
                                                <tr key={p.id} className="hover:bg-slate-50/60 transition">
                                                    <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap">
                                                        {formatDate(p.paymentDate)}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs font-mono font-bold text-slate-900 whitespace-nowrap">
                                                        {p.invoiceNo || "—"}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                                                        <PaymentModeBadge mode={p.mode} />
                                                    </td>
                                                    <td className="px-4 py-3 text-xs font-mono text-slate-500 whitespace-nowrap">
                                                        {p.referenceNo || "—"}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">
                                                        {p.notes || "—"}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-xs font-bold text-emerald-700 whitespace-nowrap">
                                                        {formatCurrency(p.amount)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center whitespace-nowrap">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedPaymentForReceipt(p)}
                                                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                                                        >
                                                            <Receipt className="h-3 w-3 text-blue-600" />
                                                            Receipt
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* =================================
                            2. AMC MAINTENANCE COLLECTIONS
                        ================================= */}
                        {selectedClientAmcCycles.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-[#1B59F8]" />
                                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                        AMC Maintenance Cycles & Installments
                                    </h3>
                                </div>

                                {selectedClientAmcCycles.map((cycle) => {
                                    const totalContract = cycle.invoiceTotalAmount || 0;
                                    const paidAmount = cycle.invoicePaidAmount || cycle.filteredInstallmentTotal || 0;
                                    const percentPaid = totalContract > 0 ? Math.min(100, Math.round((paidAmount / totalContract) * 100)) : 100;

                                    return (
                                        <div
                                            key={cycle.key}
                                            className="overflow-hidden rounded-xl border border-slate-200/90 shadow-2xs"
                                        >
                                            {/* CYCLE HEADER */}
                                            <div className="border-b border-slate-200 bg-gradient-to-r from-blue-50/40 via-white to-slate-50/50 p-5">
                                                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h4 className="text-sm font-bold text-slate-950">
                                                                {cycle.productName}
                                                            </h4>
                                                            {cycle.productCode && (
                                                                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-600">
                                                                    {cycle.productCode}
                                                                </span>
                                                            )}
                                                            {cycle.plan && (
                                                                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200/60">
                                                                    {cycle.plan}
                                                                </span>
                                                            )}
                                                            <span
                                                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                                                    cycle.invoicePaymentStatus === "Paid"
                                                                        ? "bg-emerald-100 text-emerald-800"
                                                                        : cycle.invoicePaymentStatus === "Partially Paid"
                                                                        ? "bg-amber-100 text-amber-800"
                                                                        : "bg-blue-100 text-[#1B59F8]"
                                                                }`}
                                                            >
                                                                {cycle.invoicePaymentStatus || "Active"}
                                                            </span>
                                                        </div>

                                                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                                                            <span>
                                                                Invoice:{" "}
                                                                <strong className="font-mono text-slate-800">
                                                                    {cycle.invoiceCode || "—"}
                                                                </strong>
                                                            </span>
                                                            {cycle.contractCode && (
                                                                <span>
                                                                    Contract:{" "}
                                                                    <strong className="font-mono text-slate-800">
                                                                        {cycle.contractCode}
                                                                    </strong>
                                                                </span>
                                                            )}
                                                            <span className="font-medium text-[#1B59F8]">
                                                                Cycle: {formatDate(cycle.contractStartDate)} → {formatDate(cycle.contractExpiryDate)}
                                                            </span>
                                                        </div>

                                                        {/* PROGRESS BAR */}
                                                        {totalContract > 0 && (
                                                            <div className="mt-3 max-w-md">
                                                                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-1">
                                                                    <span>Collection Progress</span>
                                                                    <span>{percentPaid}% Cleared</span>
                                                                </div>
                                                                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200">
                                                                    <div
                                                                        className={`h-full rounded-full transition-all duration-500 ${
                                                                            percentPaid >= 100
                                                                                ? "bg-emerald-500"
                                                                                : "bg-[#1B59F8]"
                                                                        }`}
                                                                        style={{ width: `${percentPaid}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* FINANCIAL SUMMARY METRICS */}
                                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                                        <div className="rounded-lg bg-white p-2.5 border border-slate-200 text-left">
                                                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                                                Contract Value
                                                            </p>
                                                            <p className="mt-1 text-xs font-bold text-slate-900">
                                                                {formatCurrency(cycle.invoiceTotalAmount)}
                                                            </p>
                                                        </div>
                                                        <div className="rounded-lg bg-white p-2.5 border border-slate-200 text-left">
                                                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                                                Total Paid
                                                            </p>
                                                            <p className="mt-1 text-xs font-bold text-emerald-700">
                                                                {formatCurrency(cycle.invoicePaidAmount || cycle.filteredInstallmentTotal)}
                                                            </p>
                                                        </div>
                                                        <div className="rounded-lg bg-white p-2.5 border border-slate-200 text-left">
                                                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                                                Balance Due
                                                            </p>
                                                            <p className="mt-1 text-xs font-bold text-rose-600">
                                                                {formatCurrency(cycle.invoicePendingAmount)}
                                                            </p>
                                                        </div>
                                                        <div className="rounded-lg bg-blue-50/50 p-2.5 border border-blue-200/60 text-left">
                                                            <p className="text-[9px] font-bold uppercase tracking-wider text-[#1B59F8]">
                                                                Filtered Receipts
                                                            </p>
                                                            <p className="mt-1 text-xs font-bold text-[#1B59F8]">
                                                                {formatCurrency(cycle.filteredInstallmentTotal)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* INSTALLMENTS TABLE */}
                                            <div className="p-4">
                                                <div className="mb-2 flex items-center justify-between">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                        Payment Installments ({cycle.installments.length})
                                                    </p>
                                                </div>

                                                <div className="overflow-x-auto rounded-lg border border-slate-200">
                                                    <table className="min-w-full divide-y divide-slate-100">
                                                        <thead className="bg-slate-50">
                                                            <tr>
                                                                <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                                                    #
                                                                </th>
                                                                <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                                                    Date
                                                                </th>
                                                                <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                                                    Mode
                                                                </th>
                                                                <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                                                    Reference / UTR
                                                                </th>
                                                                <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                                                    Notes
                                                                </th>
                                                                <th className="px-3 py-2 text-right text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                                                    Amount
                                                                </th>
                                                                <th className="px-3 py-2 text-center text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                                                    Receipt
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 bg-white">
                                                            {cycle.installments.map((p, idx) => (
                                                                <tr key={p.id} className="hover:bg-slate-50/60 transition">
                                                                    <td className="px-3 py-2.5 text-xs font-mono font-semibold text-slate-400">
                                                                        #{idx + 1}
                                                                    </td>
                                                                    <td className="px-3 py-2.5 text-xs text-slate-700 whitespace-nowrap">
                                                                        {formatDate(p.paymentDate)}
                                                                    </td>
                                                                    <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                                                                        <PaymentModeBadge mode={p.mode} />
                                                                    </td>
                                                                    <td className="px-3 py-2.5 text-xs font-mono text-slate-500 whitespace-nowrap">
                                                                        {p.referenceNo || "—"}
                                                                    </td>
                                                                    <td className="px-3 py-2.5 text-xs text-slate-500 max-w-xs truncate">
                                                                        {p.notes || "—"}
                                                                    </td>
                                                                    <td className="px-3 py-2.5 text-right text-xs font-bold text-[#1B59F8] whitespace-nowrap">
                                                                        {formatCurrency(p.amount)}
                                                                    </td>
                                                                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setSelectedPaymentForReceipt(p)}
                                                                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                                                                        >
                                                                            <Receipt className="h-3 w-3 text-blue-600" />
                                                                            Receipt
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* EMPTY LEDGER STATE */}
                        {selectedClientProductPayments.length === 0 &&
                            selectedClientAmcCycles.length === 0 && (
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-10 text-center">
                                    <p className="text-sm font-semibold text-slate-700">
                                        No transactions found for this client
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        No payments match the current filter range. Try clearing or expanding your filters.
                                    </p>
                                </div>
                            )}
                    </div>
                </section>
            )}

            {/* RECEIPT VOUCHER MODAL */}
            {renderReceiptModal()}
        </div>
    );
}