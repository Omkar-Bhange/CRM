import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    ArrowLeft,
    Eye,
    IndianRupee,
    ReceiptIndianRupee,
    RefreshCw,
    Search,
    WalletCards,
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

function formatCurrency(amount) {
    return new Intl.NumberFormat(
        "en-IN",
        {
            style:
                "currency",

            currency:
                "INR",

            maximumFractionDigits:
                0,
        }
    ).format(
        Number(
            amount ||
            0
        )
    );
}

function formatDate(value) {
    if (!value) {
        return "—";
    }

    const date =
        new Date(
            value
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "—";
    }

    return date.toLocaleDateString(
        "en-GB",
        {
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric",
        }
    );
}

function PaymentStatusBadge({
    status,
}) {
    const classes = {
        Paid:
            "bg-emerald-50 text-emerald-700 ring-emerald-600/10",

        "Partially Paid":
            "bg-blue-50 text-blue-700 ring-blue-600/10",

        Unpaid:
            "bg-amber-50 text-amber-700 ring-amber-600/10",

        Overdue:
            "bg-rose-50 text-rose-700 ring-rose-600/10",
    };

    return (
        <span
            className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${classes[
                status
            ] ||
                "bg-slate-100 text-slate-600 ring-slate-500/10"
                }`}
        >
            {
                status ||
                "Unpaid"
            }
        </span>
    );
}

const normalizeSaleFromApi =
    (
        sale = {}
    ) => ({
        id:
            String(
                sale._id ||
                sale.id ||
                ""
            ),

        saleCode:
            sale.saleCode ||
            "",

        invoiceNo:
            sale.invoiceNo ||
            sale.saleCode ||
            "",

        saleDate:
            sale.saleDate ||
            null,

        invoiceDate:
            sale.invoiceDate ||
            null,

        dueDate:
            sale.dueDate ||
            null,

        clientId:
            sale.clientId
                ? String(
                    sale.clientId
                )
                : "",

        clientCode:
            sale.clientCode ||
            "",

        clientName:
            sale.clientName ||
            "",

        contactPerson:
            sale.contactPerson ||
            "",

        mobile:
            sale.mobile ||
            "",

        email:
            sale.email ||
            "",

        gstNo:
            sale.gstNo ||
            "",

        state:
            sale.state ||
            "",

        billingAddress:
            sale.billingAddress ||
            "",

        items:
            Array.isArray(
                sale.items
            )
                ? sale.items.map(
                    (
                        item
                    ) => ({
                        id:
                            String(
                                item._id ||
                                item.id ||
                                ""
                            ),

                        productId:
                            item.productId
                                ? String(
                                    item.productId
                                )
                                : "",

                        clientProductId:
                            item.clientProductId
                                ? String(
                                    item.clientProductId
                                )
                                : "",

                        productCode:
                            item.productCode ||
                            "",

                        productName:
                            item.productName ||
                            "",

                        version:
                            item.version ||
                            "",

                        licenceType:
                            item.licenceType ||
                            "",

                        licensedUsers:
                            Number(
                                item.licensedUsers ||
                                1
                            ),

                        quantity:
                            Number(
                                item.quantity ||
                                1
                            ),

                        rate:
                            Number(
                                item.rate ||
                                0
                            ),

                        grossAmount:
                            Number(
                                item.grossAmount ||
                                0
                            ),

                        discountAmount:
                            Number(
                                item.discountAmount ||
                                0
                            ),

                        taxableAmount:
                            Number(
                                item.taxableAmount ||
                                0
                            ),

                        gstRate:
                            Number(
                                item.gstRate ||
                                0
                            ),

                        cgstAmount:
                            Number(
                                item.cgstAmount ||
                                0
                            ),

                        sgstAmount:
                            Number(
                                item.sgstAmount ||
                                0
                            ),

                        igstAmount:
                            Number(
                                item.igstAmount ||
                                0
                            ),

                        totalAmount:
                            Number(
                                item.totalAmount ||
                                0
                            ),

                        purchaseDate:
                            item.purchaseDate ||
                            null,

                        installationDate:
                            item.installationDate ||
                            null,

                        supportType:
                            item.supportType ||
                            "Standard",

                        installationStatus:
                            item.installationStatus ||
                            "Not Installed",

                        notes:
                            item.notes ||
                            "",
                    })
                )
                : [],

        grossAmount:
            Number(
                sale.grossAmount ||
                0
            ),

        discountAmount:
            Number(
                sale.discountAmount ||
                0
            ),

        taxableAmount:
            Number(
                sale.taxableAmount ||
                0
            ),

        cgstAmount:
            Number(
                sale.cgstAmount ||
                0
            ),

        sgstAmount:
            Number(
                sale.sgstAmount ||
                0
            ),

        igstAmount:
            Number(
                sale.igstAmount ||
                0
            ),

        totalAmount:
            Number(
                sale.totalAmount ||
                0
            ),

        paidAmount:
            Number(
                sale.paidAmount ||
                0
            ),

        pendingAmount:
            Number(
                sale.pendingAmount ||
                0
            ),

        paymentStatus:
            sale.paymentStatus ||
            "Unpaid",

        status:
            sale.status ||
            "Confirmed",

        notes:
            sale.notes ||
            "",
    });
const emptyPaymentForm = {
    amount: "",
    paymentDate: "",
    mode: "Bank Transfer",
    referenceNo: "",
    notes: "",
};

export default function ProductSales() {
    const [
        selectedSale,
        setSelectedSale,
    ] = useState(null);

    const [
        saleDetailsLoading,
        setSaleDetailsLoading,
    ] = useState(false);

    const [
        saleDetailsError,
        setSaleDetailsError,
    ] = useState("");

    const [
        records,
        setRecords,
    ] =
        useState(
            []
        );
    const [
        paymentRecord,
        setPaymentRecord,
    ] = useState(null);

    const [
        paymentForm,
        setPaymentForm,
    ] = useState(
        emptyPaymentForm
    );

    const [
        savingPayment,
        setSavingPayment,
    ] = useState(false);

    const [
        paymentError,
        setPaymentError,
    ] = useState("");

    const [
        loading,
        setLoading,
    ] =
        useState(
            true
        );

    const [
        error,
        setError,
    ] =
        useState(
            ""
        );

    const [
        searchValue,
        setSearchValue,
    ] =
        useState(
            ""
        );

    const [
        selectedClientGroup,
        setSelectedClientGroup,
    ] =
        useState(
            null
        );


    const loadProductSales =
        async () => {
            try {
                setLoading(
                    true
                );

                setError(
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

                const response =
                    await fetch(
                        `${API_URL}/api/admin/product-sales?limit=100`,
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
                        "Unable to load product sales."
                    );
                }

                const normalized =
                    Array.isArray(
                        result.data
                    )
                        ? result.data.map(
                            normalizeSaleFromApi
                        )
                        : [];

                setRecords(
                    normalized
                );
            } catch (
            error
            ) {
                console.error(
                    "Load Product Sales Error:",
                    error
                );

                setRecords(
                    []
                );

                setError(
                    error.message ||
                    "Unable to load product sales."
                );
            } finally {
                setLoading(
                    false
                );
            }
        };

    useEffect(
        () => {
            loadProductSales();
        },
        []
    );

    const filteredRecords =
        useMemo(
            () => {
                const search =
                    searchValue
                        .trim()
                        .toLowerCase();

                if (
                    !search
                ) {
                    return records;
                }

                return records.filter(
                    (
                        record
                    ) =>
                        [
                            record.saleCode,
                            record.invoiceNo,
                            record.clientCode,
                            record.clientName,

                            ...record.items.map(
                                (
                                    item
                                ) =>
                                    `${item.productCode} ${item.productName}`
                            ),
                        ].some(
                            (
                                value
                            ) =>
                                String(
                                    value ||
                                    ""
                                )
                                    .toLowerCase()
                                    .includes(
                                        search
                                    )
                        )
                );
            },
            [
                records,
                searchValue,
            ]
        );

    const groupedClients =
        useMemo(
            () => {
                const map =
                    new Map();

                filteredRecords.forEach(
                    (
                        record
                    ) => {
                        const key =
                            String(
                                record.clientId ||
                                record.clientCode ||
                                record.clientName ||
                                ""
                            );

                        if (
                            !key
                        ) {
                            return;
                        }

                        if (
                            !map.has(
                                key
                            )
                        ) {
                            map.set(
                                key,
                                {
                                    key,

                                    clientId:
                                        record.clientId,

                                    clientCode:
                                        record.clientCode,

                                    clientName:
                                        record.clientName ||
                                        "Unknown Client",

                                    records:
                                        [],

                                    productIds:
                                        new Set(),

                                    totalAmount:
                                        0,

                                    paidAmount:
                                        0,

                                    pendingAmount:
                                        0,
                                }
                            );
                        }

                        const group =
                            map.get(
                                key
                            );

                        group.records.push(
                            record
                        );

                        record.items.forEach(
                            (
                                item
                            ) => {
                                if (
                                    item.productId ||
                                    item.productCode ||
                                    item.productName
                                ) {
                                    group.productIds.add(
                                        String(
                                            item.productId ||
                                            item.productCode ||
                                            item.productName
                                        )
                                    );
                                }
                            }
                        );

                        group.totalAmount +=
                            Number(
                                record.totalAmount ||
                                0
                            );

                        group.paidAmount +=
                            Number(
                                record.paidAmount ||
                                0
                            );

                        group.pendingAmount +=
                            Number(
                                record.pendingAmount ||
                                0
                            );
                    }
                );

                return Array.from(
                    map.values()
                )
                    .map(
                        (
                            group
                        ) => ({
                            ...group,

                            salesCount:
                                group.records.length,

                            productCount:
                                group.productIds.size,
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
            },
            [
                filteredRecords,
            ]
        );


    const summary =
        useMemo(
            () => {
                return records.reduce(
                    (
                        current,
                        record
                    ) => {
                        current.totalSales++;

                        current.totalAmount +=
                            Number(
                                record.totalAmount ||
                                0
                            );

                        current.paidAmount +=
                            Number(
                                record.paidAmount ||
                                0
                            );

                        current.pendingAmount +=
                            Number(
                                record.pendingAmount ||
                                0
                            );

                        return current;
                    },
                    {
                        totalSales:
                            0,

                        totalAmount:
                            0,

                        paidAmount:
                            0,

                        pendingAmount:
                            0,
                    }
                );
            },
            [
                records,
            ]
        );

    const selectedClientRecords =
        useMemo(
            () => {
                if (
                    !selectedClientGroup
                ) {
                    return [];
                }

                return filteredRecords.filter(
                    (
                        record
                    ) =>
                        String(
                            record.clientId ||
                            record.clientCode ||
                            record.clientName ||
                            ""
                        ) ===
                        String(
                            selectedClientGroup.key
                        )
                );
            },
            [
                filteredRecords,
                selectedClientGroup,
            ]
        );
    const selectedClientProducts =
        useMemo(
            () => {
                const map =
                    new Map();

                selectedClientRecords.forEach(
                    (
                        sale
                    ) => {
                        sale.items.forEach(
                            (
                                item
                            ) => {
                                const key =
                                    String(
                                        item.clientProductId ||
                                        item.productId ||
                                        item.productCode ||
                                        item.productName ||
                                        ""
                                    );

                                if (!key) {
                                    return;
                                }

                                if (
                                    !map.has(
                                        key
                                    )
                                ) {
                                    map.set(
                                        key,
                                        {
                                            key,

                                            productId:
                                                item.productId ||
                                                "",

                                            productCode:
                                                item.productCode ||
                                                "",

                                            productName:
                                                item.productName ||
                                                "Unknown Product",

                                            version:
                                                item.version ||
                                                "",

                                            licenceType:
                                                item.licenceType ||
                                                "",

                                            licensedUsers:
                                                item.licensedUsers ||
                                                1,

                                            sales:
                                                [],

                                            totalAmount:
                                                0,

                                            paidAmount:
                                                0,

                                            pendingAmount:
                                                0,
                                        }
                                    );
                                }

                                const group =
                                    map.get(
                                        key
                                    );

                                group.sales.push({
                                    ...sale,

                                    saleItem:
                                        item,
                                });

                                /*
                                 * We use invoice-level totals here.
                                 * If one sale contains multiple products,
                                 * later we can split payment allocation
                                 * item-wise if needed.
                                 */
                                group.totalAmount +=
                                    Number(
                                        item.totalAmount ||
                                        0
                                    );

                                const saleRatio =
                                    Number(
                                        sale.totalAmount ||
                                        0
                                    ) > 0
                                        ? Number(
                                            item.totalAmount ||
                                            0
                                        ) /
                                        Number(
                                            sale.totalAmount ||
                                            1
                                        )
                                        : 0;

                                group.paidAmount +=
                                    Number(
                                        sale.paidAmount ||
                                        0
                                    ) *
                                    saleRatio;

                                group.pendingAmount +=
                                    Number(
                                        sale.pendingAmount ||
                                        0
                                    ) *
                                    saleRatio;
                            }
                        );
                    }
                );

                return Array.from(
                    map.values()
                );
            },
            [
                selectedClientRecords,
            ]
        );
    const openPaymentModal = (
        sale
    ) => {
        setPaymentRecord(
            sale
        );

        setPaymentError(
            ""
        );

        setPaymentForm({
            amount:
                String(
                    sale.pendingAmount ||
                    ""
                ),

            paymentDate:
                new Date()
                    .toISOString()
                    .slice(0, 10),

            mode:
                "Bank Transfer",

            referenceNo:
                "",

            notes:
                "",
        });
    };

    const closePaymentModal =
        () => {
            setPaymentRecord(
                null
            );

            setPaymentForm(
                emptyPaymentForm
            );

            setPaymentError(
                ""
            );
        };

    const handlePaymentChange =
        (
            event
        ) => {
            const {
                name,
                value,
            } =
                event.target;

            setPaymentForm(
                (
                    current
                ) => ({
                    ...current,
                    [name]:
                        value,
                })
            );

            if (
                paymentError
            ) {
                setPaymentError(
                    ""
                );
            }
        };
    const handleRecordPayment =
        async (
            event
        ) => {
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
                setPaymentError(
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
                setPaymentError(
                    `Payment cannot exceed ${formatCurrency(
                        paymentRecord.pendingAmount
                    )}.`
                );
                return;
            }

            if (
                !paymentForm.paymentDate
            ) {
                setPaymentError(
                    "Please select payment date."
                );
                return;
            }

            const referenceRequiredModes =
                [
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
                setPaymentError(
                    `Reference number is required for ${paymentForm.mode}.`
                );
                return;
            }

            try {
                setSavingPayment(
                    true
                );

                setPaymentError(
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

                const response =
                    await fetch(
                        `${API_URL}/api/admin/product-sales/${paymentRecord.id}/payment`,
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
                                    amount,

                                    paymentDate:
                                        paymentForm.paymentDate,

                                    mode:
                                        paymentForm.mode,

                                    referenceNo:
                                        paymentForm.referenceNo.trim(),

                                    notes:
                                        paymentForm.notes.trim(),
                                }),
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
                        "Unable to record product sale payment."
                    );
                }

                closePaymentModal();

                /*
                 * Reload all sales from backend.
                 */


                const refreshResponse =
                    await fetch(
                        `${API_URL}/api/admin/product-sales?limit=100`,
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

                const refreshResult =
                    await refreshResponse.json();

                if (
                    !refreshResponse.ok ||
                    refreshResult.success !== true
                ) {
                    throw new Error(
                        refreshResult.message ||
                        "Payment was saved, but product sales could not be refreshed."
                    );
                }

                const refreshedRecords =
                    Array.isArray(
                        refreshResult.data
                    )
                        ? refreshResult.data.map(
                            normalizeSaleFromApi
                        )
                        : [];

                setRecords(
                    refreshedRecords
                );


                /*
                 * Recalculate currently opened client group
                 * immediately so header totals update.
                 */
                if (
                    selectedClientGroup
                ) {
                    const clientRecords =
                        refreshedRecords.filter(
                            (record) =>
                                String(
                                    record.clientId ||
                                    record.clientCode ||
                                    record.clientName ||
                                    ""
                                ) ===
                                String(
                                    selectedClientGroup.key
                                )
                        );

                    const productIds =
                        new Set();

                    let totalAmount =
                        0;

                    let paidAmount =
                        0;

                    let pendingAmount =
                        0;

                    clientRecords.forEach(
                        (record) => {
                            totalAmount +=
                                Number(
                                    record.totalAmount ||
                                    0
                                );

                            paidAmount +=
                                Number(
                                    record.paidAmount ||
                                    0
                                );

                            pendingAmount +=
                                Number(
                                    record.pendingAmount ||
                                    0
                                );

                            record.items.forEach(
                                (item) => {
                                    if (
                                        item.productId ||
                                        item.productCode ||
                                        item.productName
                                    ) {
                                        productIds.add(
                                            String(
                                                item.productId ||
                                                item.productCode ||
                                                item.productName
                                            )
                                        );
                                    }
                                }
                            );
                        }
                    );

                    setSelectedClientGroup(
                        (current) => ({
                            ...current,

                            records:
                                clientRecords,

                            salesCount:
                                clientRecords.length,

                            productCount:
                                productIds.size,

                            totalAmount,

                            paidAmount,

                            pendingAmount,
                        })
                    );
                }

                alert(
                    result.message ||
                    "Product sale payment recorded successfully."
                );
            } catch (
            error
            ) {
                console.error(
                    "Product Sale Payment Error:",
                    error
                );

                setPaymentError(
                    error.message ||
                    "Unable to record payment."
                );
            } finally {
                setSavingPayment(
                    false
                );
            }
        };


    const openSaleDetails =
        async (sale) => {
            const saleId =
                sale?.id ||
                sale?._id;

            if (!saleId) {
                alert(
                    "Product Sale ID is missing."
                );
                return;
            }

            try {
                setSaleDetailsLoading(
                    true
                );

                setSaleDetailsError(
                    ""
                );

                /*
                 * Show current row data immediately
                 * while complete data loads.
                 */
                setSelectedSale(
                    sale
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
                        `${API_URL}/api/admin/product-sales/${saleId}`,
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
                        "Unable to load product sale details."
                    );
                }

                /*
                 * Some backends return:
                 * {
                 *   data: {
                 *      sale: {...},
                 *      payments: [...]
                 *   }
                 * }
                 *
                 * Others may return the sale
                 * directly in data.
                 */
                const saleData =
                    result.data?.sale ||
                    result.data ||
                    {};

                const normalized =
                    normalizeSaleFromApi(
                        saleData
                    );

                setSelectedSale({
                    ...normalized,

                    payments:
                        Array.isArray(
                            result.data?.payments
                        )
                            ? result.data.payments
                            : Array.isArray(
                                saleData.payments
                            )
                                ? saleData.payments
                                : [],
                });
            } catch (error) {
                console.error(
                    "Load Product Sale Details Error:",
                    error
                );

                setSaleDetailsError(
                    error.message ||
                    "Unable to load product sale details."
                );
            } finally {
                setSaleDetailsLoading(
                    false
                );
            }
        };

         if (
                    selectedSale
                ) {
                    const salePayments =
                        Array.isArray(
                            selectedSale.payments
                        )
                            ? selectedSale.payments
                            : [];

                    return (
                        <div className="enterprise-page space-y-6">
                            {/* HEADER */}
                            <section className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex items-start gap-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedSale(
                                                null
                                            );

                                            setSaleDetailsError(
                                                ""
                                            );
                                        }}
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
                                    >
                                        <ArrowLeft
                                            size={17}
                                        />
                                    </button>

                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-600">
                                            Product Sale
                                        </p>

                                        <div className="mt-1 flex flex-wrap items-center gap-2">
                                            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                                                {
                                                    selectedSale.saleCode ||
                                                    selectedSale.invoiceNo ||
                                                    "Product Sale"
                                                }
                                            </h1>

                                            <PaymentStatusBadge
                                                status={
                                                    selectedSale.paymentStatus
                                                }
                                            />
                                        </div>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Invoice{" "}
                                            {
                                                selectedSale.invoiceNo ||
                                                "—"
                                            }
                                            {" · "}
                                            {
                                                formatDate(
                                                    selectedSale.saleDate ||
                                                    selectedSale.invoiceDate
                                                )
                                            }
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {Number(
                                        selectedSale.pendingAmount ||
                                        0
                                    ) > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const sale =
                                                        selectedSale;

                                                    setSelectedSale(
                                                        null
                                                    );

                                                    openPaymentModal(
                                                        sale
                                                    );
                                                }}
                                                className="flex h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                            >
                                                <IndianRupee
                                                    size={15}
                                                />

                                                Record Payment
                                            </button>
                                        )}
                                </div>
                            </section>

                            {saleDetailsLoading && (
                                <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-xs font-medium text-violet-700">
                                    Loading complete sale details...
                                </div>
                            )}

                            {saleDetailsError && (
                                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
                                    {
                                        saleDetailsError
                                    }
                                </div>
                            )}

                            {/* SUMMARY */}
                            <section className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:grid-cols-2 xl:grid-cols-4">
                                <div className="border-b border-slate-200 p-5 sm:border-r xl:border-b-0">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                        Invoice Total
                                    </p>

                                    <p className="mt-2 text-xl font-semibold text-slate-950">
                                        {formatCurrency(
                                            selectedSale.totalAmount
                                        )}
                                    </p>
                                </div>

                                <div className="border-b border-slate-200 p-5 xl:border-b-0 xl:border-r">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                        Received
                                    </p>

                                    <p className="mt-2 text-xl font-semibold text-emerald-700">
                                        {formatCurrency(
                                            selectedSale.paidAmount
                                        )}
                                    </p>
                                </div>

                                <div className="border-b border-slate-200 p-5 sm:border-r xl:border-b-0">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                        Outstanding
                                    </p>

                                    <p className="mt-2 text-xl font-semibold text-rose-600">
                                        {formatCurrency(
                                            selectedSale.pendingAmount
                                        )}
                                    </p>
                                </div>

                                <div className="p-5">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                        Sale Status
                                    </p>

                                    <p className="mt-2 text-sm font-semibold text-slate-900">
                                        {
                                            selectedSale.status ||
                                            "Confirmed"
                                        }
                                    </p>
                                </div>
                            </section>

                            {/* CLIENT + INVOICE */}
                            <section className="grid gap-4 xl:grid-cols-2">
                                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-600">
                                        Client
                                    </p>

                                    <h2 className="mt-2 text-lg font-semibold text-slate-950">
                                        {
                                            selectedSale.clientName ||
                                            "—"
                                        }
                                    </h2>

                                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                                Client Code
                                            </p>

                                            <p className="mt-1 text-xs font-semibold text-slate-700">
                                                {
                                                    selectedSale.clientCode ||
                                                    "—"
                                                }
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                                GST No
                                            </p>

                                            <p className="mt-1 text-xs font-semibold text-slate-700">
                                                {
                                                    selectedSale.gstNo ||
                                                    "—"
                                                }
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                                Contact
                                            </p>

                                            <p className="mt-1 text-xs text-slate-700">
                                                {
                                                    selectedSale.contactPerson ||
                                                    "—"
                                                }
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                                Mobile
                                            </p>

                                            <p className="mt-1 text-xs text-slate-700">
                                                {
                                                    selectedSale.mobile ||
                                                    "—"
                                                }
                                            </p>
                                        </div>

                                        <div className="sm:col-span-2">
                                            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                                Billing Address
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-slate-700">
                                                {
                                                    selectedSale.billingAddress ||
                                                    "—"
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </article>

                                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-600">
                                        Invoice
                                    </p>

                                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                                Sale Code
                                            </p>

                                            <p className="mt-1 text-xs font-semibold text-slate-700">
                                                {
                                                    selectedSale.saleCode ||
                                                    "—"
                                                }
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                                Invoice No
                                            </p>

                                            <p className="mt-1 text-xs font-semibold text-slate-700">
                                                {
                                                    selectedSale.invoiceNo ||
                                                    "—"
                                                }
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                                Sale Date
                                            </p>

                                            <p className="mt-1 text-xs text-slate-700">
                                                {
                                                    formatDate(
                                                        selectedSale.saleDate
                                                    )
                                                }
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                                Invoice Date
                                            </p>

                                            <p className="mt-1 text-xs text-slate-700">
                                                {
                                                    formatDate(
                                                        selectedSale.invoiceDate
                                                    )
                                                }
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                                Due Date
                                            </p>

                                            <p className="mt-1 text-xs text-slate-700">
                                                {
                                                    formatDate(
                                                        selectedSale.dueDate
                                                    )
                                                }
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                                State
                                            </p>

                                            <p className="mt-1 text-xs text-slate-700">
                                                {
                                                    selectedSale.state ||
                                                    "—"
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </article>
                            </section>

                            {/* ITEMS */}
                            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                                <div className="border-b border-slate-200 px-5 py-4">
                                    <h2 className="text-sm font-semibold text-slate-950">
                                        Product Details
                                    </h2>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50/80">
                                                <th className="px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                    Product
                                                </th>

                                                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                    Qty
                                                </th>

                                                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                    Rate
                                                </th>

                                                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                    Discount
                                                </th>

                                                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                    Taxable
                                                </th>

                                                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                    GST
                                                </th>

                                                <th className="px-5 py-3 text-right text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                    Total
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {selectedSale.items.map(
                                                (
                                                    item
                                                ) => (
                                                    <tr
                                                        key={
                                                            item.id ||
                                                            item.productId ||
                                                            item.productCode
                                                        }
                                                        className="border-b border-slate-100 last:border-b-0"
                                                    >
                                                        <td className="px-5 py-4">
                                                            <p className="text-xs font-semibold text-slate-900">
                                                                {
                                                                    item.productName ||
                                                                    "—"
                                                                }
                                                            </p>

                                                            <p className="mt-1 text-[10px] text-slate-400">
                                                                {
                                                                    item.productCode ||
                                                                    ""
                                                                }
                                                                {item.version
                                                                    ? ` · ${item.version}`
                                                                    : ""}
                                                                {item.licenceType
                                                                    ? ` · ${item.licenceType}`
                                                                    : ""}
                                                            </p>
                                                        </td>

                                                        <td className="px-4 py-4 text-xs text-slate-700">
                                                            {
                                                                item.quantity
                                                            }
                                                        </td>

                                                        <td className="px-4 py-4 text-xs font-semibold text-slate-700">
                                                            {formatCurrency(
                                                                item.rate
                                                            )}
                                                        </td>

                                                        <td className="px-4 py-4 text-xs text-slate-700">
                                                            {formatCurrency(
                                                                item.discountAmount
                                                            )}
                                                        </td>

                                                        <td className="px-4 py-4 text-xs font-semibold text-slate-700">
                                                            {formatCurrency(
                                                                item.taxableAmount
                                                            )}
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <p className="text-xs font-semibold text-slate-700">
                                                                {
                                                                    item.gstRate
                                                                }
                                                                %
                                                            </p>

                                                            <p className="mt-1 text-[9px] text-slate-400">
                                                                CGST{" "}
                                                                {formatCurrency(
                                                                    item.cgstAmount
                                                                )}
                                                                {" · "}
                                                                SGST{" "}
                                                                {formatCurrency(
                                                                    item.sgstAmount
                                                                )}

                                                                {Number(
                                                                    item.igstAmount ||
                                                                    0
                                                                ) > 0 &&
                                                                    ` · IGST ${formatCurrency(
                                                                        item.igstAmount
                                                                    )}`}
                                                            </p>
                                                        </td>

                                                        <td className="px-5 py-4 text-right text-xs font-semibold text-slate-900">
                                                            {formatCurrency(
                                                                item.totalAmount
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            {/* TOTALS */}
                            <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
                                <article className="rounded-2xl border border-slate-200 bg-white p-5">
                                    <h2 className="text-sm font-semibold text-slate-950">
                                        Payment History
                                    </h2>

                                    {salePayments.length ===
                                        0 ? (
                                        <div className="py-10 text-center text-xs text-slate-400">
                                            No payments recorded yet.
                                        </div>
                                    ) : (
                                        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                                            <table className="min-w-full">
                                                <thead>
                                                    <tr className="border-b border-slate-200 bg-slate-50">
                                                        <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                                            Date
                                                        </th>

                                                        <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                                            Mode
                                                        </th>

                                                        <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                                            Reference
                                                        </th>

                                                        <th className="px-4 py-3 text-right text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                                            Amount
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {salePayments.map(
                                                        (
                                                            payment,
                                                            index
                                                        ) => (
                                                            <tr
                                                                key={
                                                                    payment._id ||
                                                                    payment.id ||
                                                                    index
                                                                }
                                                                className="border-b border-slate-100 last:border-b-0"
                                                            >
                                                                <td className="px-4 py-3 text-xs text-slate-600">
                                                                    {formatDate(
                                                                        payment.paymentDate ||
                                                                        payment.createdAt
                                                                    )}
                                                                </td>

                                                                <td className="px-4 py-3 text-xs text-slate-700">
                                                                    {
                                                                        payment.mode ||
                                                                        "—"
                                                                    }
                                                                </td>

                                                                <td className="px-4 py-3 text-xs text-slate-500">
                                                                    {
                                                                        payment.referenceNo ||
                                                                        "—"
                                                                    }
                                                                </td>

                                                                <td className="px-4 py-3 text-right text-xs font-semibold text-emerald-700">
                                                                    {formatCurrency(
                                                                        payment.amount
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        )
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </article>

                                <article className="rounded-2xl border border-slate-200 bg-white p-5">
                                    <h2 className="text-sm font-semibold text-slate-950">
                                        Invoice Summary
                                    </h2>

                                    <div className="mt-5 space-y-3">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">
                                                Gross Amount
                                            </span>

                                            <span className="font-semibold text-slate-800">
                                                {formatCurrency(
                                                    selectedSale.grossAmount
                                                )}
                                            </span>
                                        </div>

                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">
                                                Discount
                                            </span>

                                            <span className="font-semibold text-slate-800">
                                                {formatCurrency(
                                                    selectedSale.discountAmount
                                                )}
                                            </span>
                                        </div>

                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">
                                                Taxable Amount
                                            </span>

                                            <span className="font-semibold text-slate-800">
                                                {formatCurrency(
                                                    selectedSale.taxableAmount
                                                )}
                                            </span>
                                        </div>

                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">
                                                CGST
                                            </span>

                                            <span className="font-semibold text-slate-800">
                                                {formatCurrency(
                                                    selectedSale.cgstAmount
                                                )}
                                            </span>
                                        </div>

                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">
                                                SGST
                                            </span>

                                            <span className="font-semibold text-slate-800">
                                                {formatCurrency(
                                                    selectedSale.sgstAmount
                                                )}
                                            </span>
                                        </div>

                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">
                                                IGST
                                            </span>

                                            <span className="font-semibold text-slate-800">
                                                {formatCurrency(
                                                    selectedSale.igstAmount
                                                )}
                                            </span>
                                        </div>

                                        <div className="my-4 border-t border-slate-200" />

                                        <div className="flex justify-between">
                                            <span className="text-sm font-semibold text-slate-950">
                                                Invoice Total
                                            </span>

                                            <span className="text-lg font-semibold text-slate-950">
                                                {formatCurrency(
                                                    selectedSale.totalAmount
                                                )}
                                            </span>
                                        </div>

                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">
                                                Received
                                            </span>

                                            <span className="font-semibold text-emerald-700">
                                                {formatCurrency(
                                                    selectedSale.paidAmount
                                                )}
                                            </span>
                                        </div>

                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">
                                                Outstanding
                                            </span>

                                            <span className="font-semibold text-rose-600">
                                                {formatCurrency(
                                                    selectedSale.pendingAmount
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </article>
                            </section>
                        </div>
                    );
                }   
         /*
             * UI comes in the next step.
         *
        * For now this confirms:
            * API loading
            * normalization
             * filtering
         * client grouping
         * totals
         */
    if (
        selectedClientGroup
    ) {
        return (
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
                                Client Product Sales
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
                                    selectedClientGroup.salesCount
                                }{" "}
                                sale
                                {
                                    selectedClientGroup.salesCount ===
                                        1
                                        ? ""
                                        : "s"
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
                                }
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={
                            loadProductSales
                        }
                        disabled={
                            loading
                        }
                        className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                    >
                        <RefreshCw
                            size={15}
                            className={
                                loading
                                    ? "animate-spin"
                                    : ""
                            }
                        />

                        Refresh
                    </button>
                </section>

                {/* SUMMARY */}
                <section className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:grid-cols-2 xl:grid-cols-4">
                    <div className="border-b border-slate-200 p-5 sm:border-r xl:border-b-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Total Billed
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

                        <p className="mt-2 text-xl font-semibold text-rose-600">
                            {formatCurrency(
                                selectedClientGroup.pendingAmount
                            )}
                        </p>
                    </div>

                    <div className="p-5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Total Sales
                        </p>

                        <p className="mt-2 text-xl font-semibold text-slate-950">
                            {
                                selectedClientGroup.salesCount
                            }
                        </p>
                    </div>
                </section>

                {/* PRODUCT GROUPS */}
                <section className="space-y-4">
                    {selectedClientProducts.map(
                        (
                            productGroup
                        ) => (
                            <article
                                key={
                                    productGroup.key
                                }
                                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]"
                            >
                                {/* PRODUCT HEADER */}
                                <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-sm font-semibold text-slate-950">
                                                {
                                                    productGroup.productName
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
                                                productGroup.version ||
                                                "Version not specified"
                                            }
                                            {" · "}
                                            {
                                                productGroup.licenceType ||
                                                "Licence"
                                            }
                                            {" · "}
                                            {
                                                productGroup.licensedUsers
                                            }{" "}
                                            users
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-3 gap-5 text-right">
                                        <div>
                                            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                                Billed
                                            </p>

                                            <p className="mt-1 text-xs font-semibold text-slate-800">
                                                {formatCurrency(
                                                    productGroup.totalAmount
                                                )}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                                Received
                                            </p>

                                            <p className="mt-1 text-xs font-semibold text-emerald-700">
                                                {formatCurrency(
                                                    productGroup.paidAmount
                                                )}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                                Pending
                                            </p>

                                            <p className="mt-1 text-xs font-semibold text-rose-600">
                                                {formatCurrency(
                                                    productGroup.pendingAmount
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* SALES TABLE */}
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50/80">
                                                <th className="px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                    Sale Date
                                                </th>

                                                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                    Invoice
                                                </th>

                                                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                    Qty
                                                </th>

                                                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                    Product Amount
                                                </th>

                                                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                    Invoice Total
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
                                            {productGroup.sales.map(
                                                (
                                                    sale
                                                ) => (
                                                    <tr
                                                        key={`${sale.id}-${sale.saleItem.id || sale.saleItem.productId}`}
                                                        className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                                                    >
                                                        <td className="px-5 py-4 text-xs text-slate-600">
                                                            {formatDate(
                                                                sale.saleDate
                                                            )}
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <p className="text-xs font-semibold text-violet-700">
                                                                {
                                                                    sale.saleCode ||
                                                                    sale.invoiceNo
                                                                }
                                                            </p>

                                                            <p className="mt-1 text-[10px] text-slate-400">
                                                                {
                                                                    sale.invoiceNo
                                                                }
                                                            </p>
                                                        </td>

                                                        <td className="px-4 py-4 text-xs text-slate-700">
                                                            {
                                                                sale.saleItem.quantity
                                                            }
                                                        </td>

                                                        <td className="px-4 py-4 text-xs font-semibold text-slate-800">
                                                            {formatCurrency(
                                                                sale.saleItem.totalAmount
                                                            )}
                                                        </td>

                                                        <td className="px-4 py-4 text-xs font-semibold text-slate-900">
                                                            {formatCurrency(
                                                                sale.totalAmount
                                                            )}
                                                        </td>

                                                        <td className="px-4 py-4 text-xs font-semibold text-emerald-700">
                                                            {formatCurrency(
                                                                sale.paidAmount
                                                            )}
                                                        </td>

                                                        <td className="px-4 py-4 text-xs font-semibold text-rose-600">
                                                            {formatCurrency(
                                                                sale.pendingAmount
                                                            )}
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <PaymentStatusBadge
                                                                status={
                                                                    sale.paymentStatus
                                                                }
                                                            />
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <div className="flex justify-end gap-2">
                                                                {sale.pendingAmount >
                                                                    0 && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                openPaymentModal(
                                                                                    sale
                                                                                )
                                                                            }
                                                                            className="flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-[10px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
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
                                                                        openSaleDetails(
                                                                            sale
                                                                        )
                                                                    }
                                                                    className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
                                                                >
                                                                    <Eye
                                                                        size={
                                                                            13
                                                                        }
                                                                    />
                                                                    Open
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
                        )
                    )}
                </section>
                {paymentRecord && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <button
                            type="button"
                            aria-label="Close payment modal"
                            onClick={
                                closePaymentModal
                            }
                            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
                        />

                        <form
                            onSubmit={
                                handleRecordPayment
                            }
                            className="relative w-full max-w-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.32)]"
                        >
                            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-600">
                                        Product Sale Payment
                                    </p>

                                    <h2 className="mt-1 text-lg font-semibold text-slate-950">
                                        Record Payment
                                    </h2>

                                    <p className="mt-1 text-xs text-slate-500">
                                        {
                                            paymentRecord.clientName
                                        }
                                        {" · "}
                                        {
                                            paymentRecord.saleCode
                                        }
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        closePaymentModal
                                    }
                                    disabled={
                                        savingPayment
                                    }
                                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="space-y-5 p-6">
                                <div className="grid grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <div>
                                        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                            Total
                                        </p>

                                        <p className="mt-1 text-xs font-semibold text-slate-800">
                                            {formatCurrency(
                                                paymentRecord.totalAmount
                                            )}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                            Paid
                                        </p>

                                        <p className="mt-1 text-xs font-semibold text-emerald-700">
                                            {formatCurrency(
                                                paymentRecord.paidAmount
                                            )}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                            Pending
                                        </p>

                                        <p className="mt-1 text-xs font-semibold text-rose-600">
                                            {formatCurrency(
                                                paymentRecord.pendingAmount
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">
                                        Payment Amount
                                    </label>

                                    <input
                                        type="number"
                                        name="amount"
                                        min="0.01"
                                        step="0.01"
                                        value={
                                            paymentForm.amount
                                        }
                                        onChange={
                                            handlePaymentChange
                                        }
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            Payment Date
                                        </label>

                                        <input
                                            type="date"
                                            name="paymentDate"
                                            value={
                                                paymentForm.paymentDate
                                            }
                                            onChange={
                                                handlePaymentChange
                                            }
                                            className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
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
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        >
                                            <option value="Cash">
                                                Cash
                                            </option>

                                            <option value="Bank Transfer">
                                                Bank Transfer
                                            </option>

                                            <option value="UPI">
                                                UPI
                                            </option>

                                            <option value="Cheque">
                                                Cheque
                                            </option>

                                            <option value="Card">
                                                Card
                                            </option>

                                            <option value="Other">
                                                Other
                                            </option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">
                                        Reference No
                                    </label>

                                    <input
                                        type="text"
                                        name="referenceNo"
                                        value={
                                            paymentForm.referenceNo
                                        }
                                        onChange={
                                            handlePaymentChange
                                        }
                                        placeholder="UTR / cheque / transaction number"
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">
                                        Notes
                                    </label>

                                    <textarea
                                        name="notes"
                                        rows="3"
                                        value={
                                            paymentForm.notes
                                        }
                                        onChange={
                                            handlePaymentChange
                                        }
                                        className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    />
                                </div>

                                {paymentError && (
                                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
                                        {
                                            paymentError
                                        }
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50/60 px-6 py-4">
                                <button
                                    type="button"
                                    onClick={
                                        closePaymentModal
                                    }
                                    disabled={
                                        savingPayment
                                    }
                                    className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        savingPayment
                                    }
                                    className="flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <IndianRupee
                                        size={14}
                                    />

                                    {savingPayment
                                        ? "Saving..."
                                        : "Record Payment"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

            </div>
        );
    }

    return (
        <div className="enterprise-page space-y-6">
            {/* PAGE HEADER */}
            <section className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-600">
                        Revenue Operations
                    </p>

                    <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                        Product Sales
                    </h1>

                    <p className="mt-1 text-xs text-slate-500">
                        Track software sales, collections and outstanding balances client-wise.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadProductSales}
                    disabled={loading}
                    className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <RefreshCw
                        size={15}
                        className={
                            loading
                                ? "animate-spin"
                                : ""
                        }
                    />

                    {loading
                        ? "Refreshing..."
                        : "Refresh"}
                </button>
            </section>

            {/* SUMMARY CARDS */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                Total Product Sales
                            </p>

                            <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                                {formatCurrency(
                                    summary.totalAmount
                                )}
                            </p>

                            <p className="mt-2 text-xs text-slate-500">
                                {summary.totalSales} sale
                                {summary.totalSales === 1
                                    ? ""
                                    : "s"}
                            </p>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                            <ReceiptIndianRupee size={20} />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                Received
                            </p>

                            <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-emerald-700">
                                {formatCurrency(
                                    summary.paidAmount
                                )}
                            </p>

                            <p className="mt-2 text-xs text-emerald-600">
                                Product sale collections
                            </p>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                            <IndianRupee size={20} />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                Outstanding
                            </p>

                            <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-rose-600">
                                {formatCurrency(
                                    summary.pendingAmount
                                )}
                            </p>

                            <p className="mt-2 text-xs text-rose-500">
                                Pending collection
                            </p>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                            <WalletCards size={20} />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                Clients
                            </p>

                            <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                                {groupedClients.length}
                            </p>

                            <p className="mt-2 text-xs text-slate-500">
                                Clients with product sales
                            </p>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                            <Eye size={20} />
                        </div>
                    </div>
                </div>
            </section>

            {/* CLIENT-WISE SALES */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-950">
                            Product Sales by Client
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            {groupedClients.length} client
                            {groupedClients.length === 1
                                ? ""
                                : "s"}{" "}
                            found
                        </p>
                    </div>

                    <div className="relative w-full lg:max-w-[320px]">
                        <Search
                            size={16}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="text"
                            value={searchValue}
                            onChange={(event) =>
                                setSearchValue(
                                    event.target.value
                                )
                            }
                            placeholder="Search client, invoice, product..."
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                        />
                    </div>
                </div>

                {error && (
                    <div className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-xs font-medium text-rose-700">
                        {error}
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/80">
                                <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                    Client
                                </th>

                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                    Sales
                                </th>

                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                    Products
                                </th>

                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                    Total Billed
                                </th>

                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                    Received
                                </th>

                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                    Pending
                                </th>

                                <th className="px-6 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {groupedClients.map(
                                (clientGroup) => (
                                    <tr
                                        key={
                                            clientGroup.key
                                        }
                                        className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/70"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex min-w-[220px] items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-xs font-bold text-violet-700">
                                                    {clientGroup.clientName
                                                        ?.split(" ")
                                                        .slice(0, 2)
                                                        .map(
                                                            (word) =>
                                                                word[0]
                                                        )
                                                        .join("")
                                                        .toUpperCase() ||
                                                        "C"}
                                                </div>

                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {
                                                            clientGroup.clientName
                                                        }
                                                    </p>

                                                    <p className="mt-1 text-[10px] text-slate-400">
                                                        {
                                                            clientGroup.clientCode ||
                                                            "No client code"
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-4 py-4">
                                            <p className="text-xs font-semibold text-slate-800">
                                                {
                                                    clientGroup.salesCount
                                                }
                                            </p>

                                            <p className="mt-1 text-[10px] text-slate-400">
                                                Invoice
                                                {clientGroup.salesCount ===
                                                    1
                                                    ? ""
                                                    : "s"}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4">
                                            <p className="text-xs font-semibold text-slate-800">
                                                {
                                                    clientGroup.productCount
                                                }
                                            </p>

                                            <p className="mt-1 text-[10px] text-slate-400">
                                                Product
                                                {clientGroup.productCount ===
                                                    1
                                                    ? ""
                                                    : "s"}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4 text-xs font-semibold text-slate-900">
                                            {formatCurrency(
                                                clientGroup.totalAmount
                                            )}
                                        </td>

                                        <td className="px-4 py-4 text-xs font-semibold text-emerald-700">
                                            {formatCurrency(
                                                clientGroup.paidAmount
                                            )}
                                        </td>

                                        <td className="px-4 py-4">
                                            <p
                                                className={`text-xs font-semibold ${clientGroup.pendingAmount >
                                                    0
                                                    ? "text-rose-600"
                                                    : "text-emerald-700"
                                                    }`}
                                            >
                                                {formatCurrency(
                                                    clientGroup.pendingAmount
                                                )}
                                            </p>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedClientGroup(
                                                            clientGroup
                                                        )
                                                    }
                                                    className="flex h-9 items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
                                                >
                                                    <Eye
                                                        size={
                                                            14
                                                        }
                                                    />

                                                    View Sales
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            )}

                            {!loading &&
                                groupedClients.length ===
                                0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-6 py-12 text-center"
                                        >
                                            <p className="text-sm font-semibold text-slate-700">
                                                No product sales found
                                            </p>

                                            <p className="mt-1 text-xs text-slate-400">
                                                Create a product sale from the Client → Products section.
                                            </p>
                                        </td>
                                    </tr>
                                )}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/60 px-5 py-4 text-xs text-slate-500">
                    <p>
                        Showing {groupedClients.length} client
                        {groupedClients.length === 1
                            ? ""
                            : "s"}{" "}
                        with product sales
                    </p>

                    <button
                        type="button"
                        onClick={loadProductSales}
                        disabled={loading}
                        className="flex items-center gap-1 font-semibold text-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <RefreshCw
                            size={13}
                            className={
                                loading
                                    ? "animate-spin"
                                    : ""
                            }
                        />

                        {loading
                            ? "Refreshing..."
                            : "Refresh data"}
                    </button>
                </div>
            </section>

        </div>
    );
}