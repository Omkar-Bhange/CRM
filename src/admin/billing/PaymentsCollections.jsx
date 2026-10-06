import {
    useEffect,
    useMemo,
    useState,
} from "react";

import API_URL from "../../config/api";
import DataTable from "../../components/data/DataTable";

/* =====================================================
   AUTH
===================================================== */

const getAuthToken = () =>
    localStorage.getItem(
        "client-connect-token"
    ) ||
    sessionStorage.getItem(
        "client-connect-token"
    ) ||
    "";

/* =====================================================
   FORMAT HELPERS
===================================================== */

const formatCurrency = (
    value
) =>
    `₹${Number(
        value || 0
    ).toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }
    )}`;

const formatDate = (
    value
) => {
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
        "en-IN"
    );
};

/*
 * Returns:
 *
 * 2026-27
 *
 * for any payment date falling inside
 * 01-Apr-2026 → 31-Mar-2027.
 */
const getFinancialYear =
    (
        value
    ) => {
        if (!value) {
            return "";
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
            return "";
        }

        const year =
            date.getFullYear();

        const month =
            date.getMonth();

        /*
         * JS month:
         * Jan = 0
         * Apr = 3
         */
        const startYear =
            month >= 3
                ? year
                : year - 1;

        const endYear =
            String(
                startYear +
                    1
            ).slice(
                -2
            );

        return `${startYear}-${endYear}`;
    };

/* =====================================================
   NORMALIZE PAYMENT
===================================================== */

const normalizePayment =
    (
        payment = {},
        sourceType = ""
    ) => ({
        id:
            String(
                payment._id ||
                    payment.id ||
                    ""
            ),

        sourceType,

        clientId:
            payment.clientId
                ? String(
                    payment.clientId
                )
                : "",

        clientCode:
            payment.clientCode ||
            "",

        clientName:
            payment.clientName ||
            "",

        /*
         * PRODUCT SALE / AMC REFERENCE
         */
        invoiceId:
            payment.productSaleId ||
            payment.amcInvoiceId ||
            payment.invoiceId ||
            "",

        invoiceNo:
            payment.invoiceNo ||
            payment.saleCode ||
            payment.invoiceCode ||
            payment.amcInvoiceNo ||
            "",

        paymentDate:
            payment.paymentDate ||
            payment.createdAt ||
            null,

        amount:
            Number(
                payment.amount ||
                0
            ),

        mode:
            payment.mode ||
            "",

        referenceNo:
            payment.referenceNo ||
            "",

        notes:
            payment.notes ||
            "",

        createdAt:
            payment.createdAt ||
            null,

        /* =================================================
           AMC LINKED INVOICE INFORMATION
        ================================================= */

        amcInvoiceId:
            payment.amcInvoiceId
                ? String(
                    payment.amcInvoiceId
                )
                : "",

        contractCode:
            payment.contractCode ||
            "",

        invoiceCode:
            payment.invoiceCode ||
            payment.invoiceNo ||
            "",

        productCode:
            payment.productCode ||
            "",

        productName:
            payment.productName ||
            "",

        productVersion:
            payment.productVersion ||
            "",

        plan:
            payment.plan ||
            "",

        licensedUsers:
            Number(
                payment.licensedUsers ||
                0
            ),

        contractStartDate:
            payment.contractStartDate ||
            null,

        contractExpiryDate:
            payment.contractExpiryDate ||
            null,

        invoiceDate:
            payment.invoiceDate ||
            null,

        dueDate:
            payment.dueDate ||
            null,

        invoiceTotalAmount:
            Number(
                payment.invoiceTotalAmount ||
                0
            ),

        invoicePaidAmount:
            Number(
                payment.invoicePaidAmount ||
                0
            ),

        invoicePendingAmount:
            Number(
                payment.invoicePendingAmount ||
                0
            ),

        invoicePaymentStatus:
            payment.invoicePaymentStatus ||
            "",
    });

/* =====================================================
   COMPONENT
===================================================== */

export default function PaymentsCollections() {
    /* =================================================
       DATA
    ================================================= */

    const [
        productSalePayments,
        setProductSalePayments,
    ] =
        useState(
            []
        );

    const [
        amcPayments,
        setAmcPayments,
    ] =
        useState(
            []
        );

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

    /* =================================================
       FILTERS
    ================================================= */

    const [
        searchValue,
        setSearchValue,
    ] =
        useState(
            ""
        );

    const [
        sourceFilter,
        setSourceFilter,
    ] =
        useState(
            "ALL"
        );

    const [
        modeFilter,
        setModeFilter,
    ] =
        useState(
            "ALL"
        );

    const [
        financialYearFilter,
        setFinancialYearFilter,
    ] =
        useState(
            "ALL"
        );

    const [
        fromDate,
        setFromDate,
    ] =
        useState(
            ""
        );

    const [
        toDate,
        setToDate,
    ] =
        useState(
            ""
        );

    /*
     * Keep only the client key.
     *
     * This prevents the ledger from keeping
     * old unfiltered payment records when the
     * administrator changes a filter.
     */
    const [
        selectedClientKey,
        setSelectedClientKey,
    ] =
        useState(
            ""
        );

    /* =================================================
       LOAD PAYMENTS
    ================================================= */

    const loadPayments =
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

                if (!token) {
                    throw new Error(
                        "Login token was not found. Please login again."
                    );
                }

                const headers = {
                    Accept:
                        "application/json",

                    Authorization:
                        `Bearer ${token}`,
                };

                /* =====================================
                   PRODUCT SALE PAYMENTS
                ===================================== */

                const saleResponse =
                    await fetch(
                        `${API_URL}/api/admin/product-sale-payments?limit=500`,
                        {
                            method:
                                "GET",

                            headers,
                        }
                    );

                const saleResult =
                    await saleResponse.json();

                if (
                    saleResponse.status ===
                    401
                ) {
                    throw new Error(
                        "Your login session has expired. Please login again."
                    );
                }

                if (
                    !saleResponse.ok ||
                    saleResult.success !==
                        true
                ) {
                    throw new Error(
                        saleResult.message ||
                        "Unable to load product sale payments."
                    );
                }

                /* =====================================
                   AMC PAYMENTS
                ===================================== */

                const amcResponse =
                    await fetch(
                        `${API_URL}/api/admin/amc-payments?limit=500`,
                        {
                            method:
                                "GET",

                            headers,
                        }
                    );

                const amcResult =
                    await amcResponse.json();

                if (
                    amcResponse.status ===
                    401
                ) {
                    throw new Error(
                        "Your login session has expired. Please login again."
                    );
                }

                if (
                    !amcResponse.ok ||
                    amcResult.success !==
                        true
                ) {
                    throw new Error(
                        amcResult.message ||
                        "Unable to load AMC payments."
                    );
                }

                const normalizedSalePayments =
                    Array.isArray(
                        saleResult.data
                    )
                        ? saleResult.data.map(
                            (
                                payment
                            ) =>
                                normalizePayment(
                                    payment,
                                    "PRODUCT_SALE"
                                )
                        )
                        : [];

                const normalizedAmcPayments =
                    Array.isArray(
                        amcResult.data
                    )
                        ? amcResult.data.map(
                            (
                                payment
                            ) =>
                                normalizePayment(
                                    payment,
                                    "AMC"
                                )
                        )
                        : [];

                setProductSalePayments(
                    normalizedSalePayments
                );

                setAmcPayments(
                    normalizedAmcPayments
                );
            } catch (
                loadError
            ) {
                console.error(
                    "Load Payments & Collections Error:",
                    loadError
                );

                setProductSalePayments(
                    []
                );

                setAmcPayments(
                    []
                );

                setError(
                    loadError.message ||
                    "Unable to load payments."
                );
            } finally {
                setLoading(
                    false
                );
            }
        };

    useEffect(
        () => {
            loadPayments();
        },
        []
    );

    /* =================================================
       ALL PAYMENTS
    ================================================= */

    const allPayments =
        useMemo(
            () =>
                [
                    ...productSalePayments,
                    ...amcPayments,
                ].sort(
                    (
                        first,
                        second
                    ) =>
                        new Date(
                            second.paymentDate ||
                            0
                        ).getTime() -
                        new Date(
                            first.paymentDate ||
                            0
                        ).getTime()
                ),
            [
                productSalePayments,
                amcPayments,
            ]
        );

    /* =================================================
       AVAILABLE FINANCIAL YEARS
    ================================================= */

    const financialYears =
        useMemo(
            () => {
                const years =
                    new Set();

                allPayments.forEach(
                    (
                        payment
                    ) => {
                        const fy =
                            getFinancialYear(
                                payment.paymentDate
                            );

                        if (fy) {
                            years.add(
                                fy
                            );
                        }
                    }
                );

                return Array.from(
                    years
                ).sort(
                    (
                        first,
                        second
                    ) =>
                        Number(
                            second.split(
                                "-"
                            )[0]
                        ) -
                        Number(
                            first.split(
                                "-"
                            )[0]
                        )
                );
            },
            [
                allPayments,
            ]
        );

    /* =================================================
       AVAILABLE PAYMENT MODES
    ================================================= */

    const paymentModes =
        useMemo(
            () => {
                const modes =
                    new Set();

                allPayments.forEach(
                    (
                        payment
                    ) => {
                        if (
                            payment.mode
                        ) {
                            modes.add(
                                payment.mode
                            );
                        }
                    }
                );

                return Array.from(
                    modes
                ).sort();
            },
            [
                allPayments,
            ]
        );

    /* =================================================
       FILTER ENGINE

       IMPORTANT:
       Everything below this point uses
       filteredPayments.

       Therefore:
       summary
       client totals
       payment count
       ledger
       AMC installment rows

       all stay synchronized.
    ================================================= */

    const filteredPayments =
        useMemo(
            () => {
                const search =
                    searchValue
                        .trim()
                        .toLowerCase();

                return allPayments.filter(
                    (
                        payment
                    ) => {
                        /* =============================
                           CLIENT SEARCH
                        ============================= */

                        if (search) {
                            const haystack =
                                [
                                    payment.clientName,
                                    payment.clientCode,
                                    payment.invoiceNo,
                                    payment.invoiceCode,
                                    payment.referenceNo,
                                    payment.productName,
                                ]
                                    .filter(
                                        Boolean
                                    )
                                    .join(
                                        " "
                                    )
                                    .toLowerCase();

                            if (
                                !haystack.includes(
                                    search
                                )
                            ) {
                                return false;
                            }
                        }

                        /* =============================
                           SOURCE
                        ============================= */

                        if (
                            sourceFilter !==
                                "ALL" &&
                            payment.sourceType !==
                                sourceFilter
                        ) {
                            return false;
                        }

                        /* =============================
                           PAYMENT MODE
                        ============================= */

                        if (
                            modeFilter !==
                                "ALL" &&
                            payment.mode !==
                                modeFilter
                        ) {
                            return false;
                        }

                        /* =============================
                           FINANCIAL YEAR

                           Based on PAYMENT DATE because
                           this screen reports collections.
                        ============================= */

                        if (
                            financialYearFilter !==
                            "ALL"
                        ) {
                            const paymentFy =
                                getFinancialYear(
                                    payment.paymentDate
                                );

                            if (
                                paymentFy !==
                                financialYearFilter
                            ) {
                                return false;
                            }
                        }

                        /* =============================
                           CUSTOM FROM / TO DATE
                        ============================= */

                        if (
                            fromDate ||
                            toDate
                        ) {
                            if (
                                !payment.paymentDate
                            ) {
                                return false;
                            }

                            const paymentDate =
                                new Date(
                                    payment.paymentDate
                                );

                            if (
                                Number.isNaN(
                                    paymentDate.getTime()
                                )
                            ) {
                                return false;
                            }

                            if (
                                fromDate
                            ) {
                                const from =
                                    new Date(
                                        `${fromDate}T00:00:00`
                                    );

                                if (
                                    paymentDate <
                                    from
                                ) {
                                    return false;
                                }
                            }

                            if (
                                toDate
                            ) {
                                const to =
                                    new Date(
                                        `${toDate}T23:59:59.999`
                                    );

                                if (
                                    paymentDate >
                                    to
                                ) {
                                    return false;
                                }
                            }
                        }

                        return true;
                    }
                );
            },
            [
                allPayments,
                searchValue,
                sourceFilter,
                modeFilter,
                financialYearFilter,
                fromDate,
                toDate,
            ]
        );

    /* =================================================
       CLIENT-WISE GROUPING
       FROM FILTERED PAYMENTS
    ================================================= */

    const groupedClients =
        useMemo(
            () => {
                const map =
                    new Map();

                filteredPayments.forEach(
                    (
                        payment
                    ) => {
                        const key =
                            String(
                                payment.clientId ||
                                payment.clientCode ||
                                payment.clientName ||
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

                                    clientId:
                                        payment.clientId,

                                    clientCode:
                                        payment.clientCode,

                                    clientName:
                                        payment.clientName ||
                                        "Unknown Client",

                                    payments:
                                        [],

                                    productSaleReceived:
                                        0,

                                    amcReceived:
                                        0,

                                    totalReceived:
                                        0,

                                    lastPaymentDate:
                                        null,
                                }
                            );
                        }

                        const group =
                            map.get(
                                key
                            );

                        group.payments.push(
                            payment
                        );

                        if (
                            payment.sourceType ===
                            "PRODUCT_SALE"
                        ) {
                            group.productSaleReceived +=
                                Number(
                                    payment.amount ||
                                    0
                                );
                        }

                        if (
                            payment.sourceType ===
                            "AMC"
                        ) {
                            group.amcReceived +=
                                Number(
                                    payment.amount ||
                                    0
                                );
                        }

                        group.totalReceived +=
                            Number(
                                payment.amount ||
                                0
                            );

                        if (
                            payment.paymentDate
                        ) {
                            if (
                                !group.lastPaymentDate ||
                                new Date(
                                    payment.paymentDate
                                ) >
                                    new Date(
                                        group.lastPaymentDate
                                    )
                            ) {
                                group.lastPaymentDate =
                                    payment.paymentDate;
                            }
                        }
                    }
                );

                return Array.from(
                    map.values()
                ).sort(
                    (
                        first,
                        second
                    ) =>
                        second.totalReceived -
                            first.totalReceived ||
                        first.clientName.localeCompare(
                            second.clientName
                        )
                );
            },
            [
                filteredPayments,
            ]
        );

    /* =================================================
       CURRENT SELECTED CLIENT

       This always comes from CURRENT FILTERED DATA.
    ================================================= */

    const selectedClientGroup =
        useMemo(
            () =>
                groupedClients.find(
                    (
                        client
                    ) =>
                        String(
                            client.key
                        ) ===
                        String(
                            selectedClientKey
                        )
                ) ||
                null,
            [
                groupedClients,
                selectedClientKey,
            ]
        );

    /*
     * If filters remove the currently selected client,
     * close its ledger.
     */
    useEffect(
        () => {
            if (
                selectedClientKey &&
                !selectedClientGroup
            ) {
                setSelectedClientKey(
                    ""
                );
            }
        },
        [
            selectedClientKey,
            selectedClientGroup,
        ]
    );

    /* =================================================
       PRODUCT SALE PAYMENTS FOR SELECTED CLIENT
    ================================================= */

    const selectedClientProductPayments =
        useMemo(
            () => {
                if (
                    !selectedClientGroup
                ) {
                    return [];
                }

                return selectedClientGroup.payments
                    .filter(
                        (
                            payment
                        ) =>
                            payment.sourceType ===
                            "PRODUCT_SALE"
                    )
                    .sort(
                        (
                            first,
                            second
                        ) =>
                            new Date(
                                second.paymentDate ||
                                0
                            ).getTime() -
                            new Date(
                                first.paymentDate ||
                                0
                            ).getTime()
                    );
            },
            [
                selectedClientGroup,
            ]
        );

    /* =================================================
       AMC CYCLE GROUPING
       FOR SELECTED CLIENT
    ================================================= */

    const selectedClientAmcCycles =
        useMemo(
            () => {
                if (
                    !selectedClientGroup
                ) {
                    return [];
                }

                const map =
                    new Map();

                selectedClientGroup.payments
                    .filter(
                        (
                            payment
                        ) =>
                            payment.sourceType ===
                            "AMC"
                    )
                    .forEach(
                        (
                            payment
                        ) => {
                            /*
                             * The correct grouping key is
                             * the AMC INVOICE.
                             *
                             * Multiple installments against
                             * the same invoice remain inside
                             * one AMC cycle.
                             */
                            const key =
                                String(
                                    payment.amcInvoiceId ||
                                    payment.invoiceCode ||
                                    payment.invoiceNo ||
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

                                        amcInvoiceId:
                                            payment.amcInvoiceId,

                                        invoiceCode:
                                            payment.invoiceCode ||
                                            payment.invoiceNo,

                                        contractCode:
                                            payment.contractCode,

                                        productCode:
                                            payment.productCode,

                                        productName:
                                            payment.productName ||
                                            "AMC",

                                        productVersion:
                                            payment.productVersion,

                                        plan:
                                            payment.plan,

                                        licensedUsers:
                                            payment.licensedUsers,

                                        contractStartDate:
                                            payment.contractStartDate,

                                        contractExpiryDate:
                                            payment.contractExpiryDate,

                                        invoiceDate:
                                            payment.invoiceDate,

                                        dueDate:
                                            payment.dueDate,

                                        invoiceTotalAmount:
                                            payment.invoiceTotalAmount,

                                        invoicePaidAmount:
                                            payment.invoicePaidAmount,

                                        invoicePendingAmount:
                                            payment.invoicePendingAmount,

                                        invoicePaymentStatus:
                                            payment.invoicePaymentStatus,

                                        installments:
                                            [],

                                        /*
                                         * This is FILTERED collection
                                         * for the selected date/FY filters.
                                         */
                                        filteredInstallmentTotal:
                                            0,
                                    }
                                );
                            }

                            const cycle =
                                map.get(
                                    key
                                );

                            cycle.installments.push(
                                payment
                            );

                            cycle.filteredInstallmentTotal +=
                                Number(
                                    payment.amount ||
                                    0
                                );
                        }
                    );

                return Array.from(
                    map.values()
                )
                    .map(
                        (
                            cycle
                        ) => ({
                            ...cycle,

                            installments:
                                cycle.installments.sort(
                                    (
                                        first,
                                        second
                                    ) =>
                                        new Date(
                                            second.paymentDate ||
                                            0
                                        ).getTime() -
                                        new Date(
                                            first.paymentDate ||
                                            0
                                        ).getTime()
                                ),
                        })
                    )
                    .sort(
                        (
                            first,
                            second
                        ) =>
                            new Date(
                                second.contractStartDate ||
                                second.invoiceDate ||
                                0
                            ).getTime() -
                            new Date(
                                first.contractStartDate ||
                                first.invoiceDate ||
                                0
                            ).getTime()
                    );
            },
            [
                selectedClientGroup,
            ]
        );

    /* =================================================
       FILTERED SUMMARY
    ================================================= */

    const summary =
        useMemo(
            () => {
                const productSaleReceived =
                    filteredPayments
                        .filter(
                            (
                                payment
                            ) =>
                                payment.sourceType ===
                                "PRODUCT_SALE"
                        )
                        .reduce(
                            (
                                total,
                                payment
                            ) =>
                                total +
                                Number(
                                    payment.amount ||
                                    0
                                ),
                            0
                        );

                const amcReceived =
                    filteredPayments
                        .filter(
                            (
                                payment
                            ) =>
                                payment.sourceType ===
                                "AMC"
                        )
                        .reduce(
                            (
                                total,
                                payment
                            ) =>
                                total +
                                Number(
                                    payment.amount ||
                                    0
                                ),
                            0
                        );

                return {
                    productSaleReceived,

                    amcReceived,

                    totalReceived:
                        productSaleReceived +
                        amcReceived,

                    paymentCount:
                        filteredPayments.length,

                    clientCount:
                        groupedClients.length,
                };
            },
            [
                filteredPayments,
                groupedClients,
            ]
        );

    /* =================================================
       ACTIVE FILTER COUNT
    ================================================= */

    const activeFilterCount =
        [
            sourceFilter !==
                "ALL",
            modeFilter !==
                "ALL",
            financialYearFilter !==
                "ALL",
            Boolean(
                fromDate
            ),
            Boolean(
                toDate
            ),
            Boolean(
                searchValue.trim()
            ),
        ].filter(
            Boolean
        ).length;

    /* =================================================
       CLEAR FILTERS
    ================================================= */

    const clearFilters =
        () => {
            setSearchValue(
                ""
            );

            setSourceFilter(
                "ALL"
            );

            setModeFilter(
                "ALL"
            );

            setFinancialYearFilter(
                "ALL"
            );

            setFromDate(
                ""
            );

            setToDate(
                ""
            );

            setSelectedClientKey(
                ""
            );
        };

    /* =================================================
       UI
    ================================================= */

    return (
        <div className="enterprise-page space-y-6">
            {/* =========================================
                PAGE HEADER
            ========================================= */}

            <section className="flex flex-col gap-3 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-bold tracking-tight text-slate-900">
                            Payments & Collections
                        </h1>
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                            Revenue Operations
                        </span>
                    </div>

                    <p className="mt-0.5 text-xs text-slate-500">
                        Track Product Sale and AMC collections, payment cycles, and installment history.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadPayments}
                    disabled={loading}
                    className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? "Refreshing..." : "Refresh"}
                </button>
            </section>

            {/* =========================================
                ERROR
            ========================================= */}

            {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
                    {error}
                </div>
            )}

            {/* =========================================
                FILTER PANEL
            ========================================= */}

            <section className="rounded-xl border border-slate-200/90 bg-white shadow-2xs">
                <div className="flex flex-col gap-2.5 border-b border-slate-200/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-semibold text-slate-950">
                                Collection Filters
                            </h2>

                            {activeFilterCount > 0 && (
                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-[#1B59F8]">
                                    {activeFilterCount} Active
                                </span>
                            )}
                        </div>

                        <p className="mt-0.5 text-[11px] text-slate-500">
                            Summary cards and client ledgers automatically follow these filters.
                        </p>
                    </div>

                    {activeFilterCount > 0 && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="flex h-7 items-center rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                <div className="grid gap-3 p-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
                    {/* SEARCH */}
                    <div className="sm:col-span-2 xl:col-span-2">
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                            Search
                        </label>
                        <input
                            type="text"
                            value={searchValue}
                            onChange={(event) => setSearchValue(event.target.value)}
                            placeholder="Client, invoice, product, reference..."
                            className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none transition focus:border-[#1B59F8] focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    {/* SOURCE */}
                    <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                            Source
                        </label>
                        <select
                            value={sourceFilter}
                            onChange={(event) => setSourceFilter(event.target.value)}
                            className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none focus:border-[#1B59F8] focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="ALL">All Sources</option>
                            <option value="PRODUCT_SALE">Product Sale</option>
                            <option value="AMC">AMC</option>
                        </select>
                    </div>

                    {/* MODE */}
                    <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                            Payment Mode
                        </label>
                        <select
                            value={modeFilter}
                            onChange={(event) => setModeFilter(event.target.value)}
                            className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none focus:border-[#1B59F8] focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="ALL">All Modes</option>
                            {paymentModes.map((mode) => (
                                <option key={mode} value={mode}>{mode}</option>
                            ))}
                        </select>
                    </div>

                    {/* FINANCIAL YEAR */}
                    <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                            Financial Year
                        </label>
                        <select
                            value={financialYearFilter}
                            onChange={(event) => setFinancialYearFilter(event.target.value)}
                            className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none focus:border-[#1B59F8] focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="ALL">All Financial Years</option>
                            {financialYears.map((year) => (
                                <option key={year} value={year}>FY {year}</option>
                            ))}
                        </select>
                    </div>

                    {/* RESULT COUNT */}
                    <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                            Result
                        </label>
                        <div className="flex h-8 items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5">
                            <span className="text-xs font-semibold text-slate-700">
                                {filteredPayments.length} payment{filteredPayments.length === 1 ? "" : "s"}
                            </span>
                        </div>
                    </div>

                    {/* FROM DATE */}
                    <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                            From Date
                        </label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(event) => setFromDate(event.target.value)}
                            className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-[#1B59F8] focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    {/* TO DATE */}
                    <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                            To Date
                        </label>
                        <input
                            type="date"
                            value={toDate}
                            min={fromDate || undefined}
                            onChange={(event) => setToDate(event.target.value)}
                            className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-[#1B59F8] focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                </div>
            </section>

            {/* =========================================
                SUMMARY
            ========================================= */}

            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {/* TOTAL */}
                <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Received</span>
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#1B59F8] border border-blue-100">All Collections</span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-xl font-bold tracking-tight text-slate-900">{formatCurrency(summary.totalReceived)}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">Filtered combined receipts</p>
                </div>

                {/* PRODUCT */}
                <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Product Sales</span>
                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-100">Product</span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-xl font-bold tracking-tight text-emerald-700">{formatCurrency(summary.productSaleReceived)}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">Product sale receipts</p>
                </div>

                {/* AMC */}
                <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">AMC Collection</span>
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#1B59F8] border border-blue-100">AMC</span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-xl font-bold tracking-tight text-[#1B59F8]">{formatCurrency(summary.amcReceived)}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">AMC installment receipts</p>
                </div>

                {/* TRANSACTIONS */}
                <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Transactions</span>
                        <span className="inline-flex items-center rounded-md bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">
                            {summary.clientCount} client{summary.clientCount === 1 ? "" : "s"}
                        </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-xl font-bold tracking-tight text-slate-900">{summary.paymentCount}</span>
                        <span className="text-xs text-slate-500">records</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">Across active filtered clients</p>
                </div>
            </section>

            {/* Modern Zoho-Grade Client-wise Collections DataTable */}
            <DataTable
                moduleName="Collections"
                viewTitle="All Collections"
                views={[
                    { id: "all", label: "All Collections" },
                    { id: "products", label: "Product Sale Collections" },
                    { id: "amc", label: "AMC Collections" },
                ]}
                selectable={true}
                columns={[
                    {
                        key: "clientName",
                        label: "Client",
                        sortable: true,
                        render: (_, client) => (
                            <div className="flex min-w-[200px] items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-xs font-bold text-blue-700">
                                    {client.clientName
                                        ?.split(" ")
                                        .slice(0, 2)
                                        .map((w) => w[0])
                                        .join("")
                                        .toUpperCase() || "C"}
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-900">
                                        {client.clientName}
                                    </p>
                                    <p className="mt-0.5 text-[10px] text-slate-400">
                                        {client.clientCode || "No code"}
                                    </p>
                                </div>
                            </div>
                        ),
                    },
                    {
                        key: "productSaleReceived",
                        label: "Product Sale",
                        sortable: true,
                        render: (val) => (
                            <span className="text-xs font-medium text-slate-700">
                                {formatCurrency(val)}
                            </span>
                        ),
                    },
                    {
                        key: "amcReceived",
                        label: "AMC",
                        sortable: true,
                        render: (val) => (
                            <span className="text-xs font-medium text-slate-700">
                                {formatCurrency(val)}
                            </span>
                        ),
                    },
                    {
                        key: "totalReceived",
                        label: "Total Received",
                        sortable: true,
                        render: (val) => (
                            <span className="text-xs font-semibold text-emerald-700">
                                {formatCurrency(val)}
                            </span>
                        ),
                    },
                    {
                        key: "paymentCount",
                        label: "Payments",
                        sortable: true,
                        render: (_, client) => (
                            <span className="text-xs font-medium text-slate-600">
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
                        label: "View Ledger",
                        icon: () => <span className="text-[11px] font-semibold text-[#1B59F8] px-2 py-0.5 bg-blue-50 rounded-md border border-blue-200 hover:bg-blue-100 transition">Ledger</span>,
                        onClick: (client) => setSelectedClientKey(client.key),
                    },
                ]}
                initialPageSize={25}
                emptyTitle="No payment records found"
                emptyDescription="Change or clear the selected collection filters."
            />

            {/* =========================================
                CLIENT PAYMENT LEDGER
            ========================================= */}

            {selectedClientGroup && (
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.03)]">
                    {/* LEDGER HEADER */}

                    <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1B59F8]">
                                Client Payment Ledger
                            </p>

                            <h2 className="mt-1 text-lg font-semibold text-slate-950">
                                {
                                    selectedClientGroup.clientName
                                }
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                                {selectedClientGroup.clientCode ||
                                    "No client code"}
                                {" · "}
                                {
                                    selectedClientGroup
                                        .payments
                                        .length
                                }{" "}
                                payment
                                {selectedClientGroup
                                    .payments
                                    .length ===
                                1
                                    ? ""
                                    : "s"}
                                {" · "}
                                {formatCurrency(
                                    selectedClientGroup.totalReceived
                                )}{" "}
                                received in current filter
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setSelectedClientKey(
                                    ""
                                )
                            }
                            className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                            Close
                        </button>
                    </div>

                    <div className="space-y-6 p-5">
                        {/* =================================
                            PRODUCT SALE COLLECTIONS
                        ================================= */}

                        {selectedClientProductPayments.length >
                            0 && (
                            <div className="overflow-hidden rounded-xl border border-slate-200">
                                <div className="flex flex-col gap-2 border-b border-slate-200 bg-emerald-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h3 className="text-xs font-semibold text-emerald-800">
                                            Product Sale Collections
                                        </h3>

                                        <p className="mt-1 text-[10px] text-slate-500">
                                            Payments received against original product sale invoices.
                                        </p>
                                    </div>

                                    <div className="text-left sm:text-right">
                                        <p className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">
                                            Filtered Collection
                                        </p>

                                        <p className="mt-1 text-xs font-semibold text-emerald-700">
                                            {formatCurrency(
                                                selectedClientProductPayments.reduce(
                                                    (
                                                        total,
                                                        payment
                                                    ) =>
                                                        total +
                                                        Number(
                                                            payment.amount ||
                                                            0
                                                        ),
                                                    0
                                                )
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50">
                                                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                                    Date
                                                </th>

                                                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                                    Invoice
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
                                            {selectedClientProductPayments.map(
                                                (
                                                    payment
                                                ) => (
                                                    <tr
                                                        key={
                                                            payment.id
                                                        }
                                                        className="border-b border-slate-100 last:border-b-0"
                                                    >
                                                        <td className="px-4 py-3 text-xs text-slate-600">
                                                            {formatDate(
                                                                payment.paymentDate
                                                            )}
                                                        </td>

                                                        <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                                                            {payment.invoiceNo ||
                                                                "—"}
                                                        </td>

                                                        <td className="px-4 py-3 text-xs text-slate-700">
                                                            {payment.mode ||
                                                                "—"}
                                                        </td>

                                                        <td className="px-4 py-3 text-xs text-slate-500">
                                                            {payment.referenceNo ||
                                                                "—"}
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
                            </div>
                        )}

                        {/* =================================
                            AMC COLLECTIONS
                        ================================= */}

                        {selectedClientAmcCycles.length >
                            0 && (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-950">
                                        AMC Collections
                                    </h3>

                                    <p className="mt-1 text-xs text-slate-500">
                                        AMC receipts grouped by maintenance cycle and invoice. Each receipt is shown as an installment.
                                    </p>
                                </div>

                                {selectedClientAmcCycles.map(
                                    (
                                        cycle
                                    ) => (
                                        <div
                                            key={
                                                cycle.key
                                            }
                                            className="overflow-hidden rounded-xl border border-slate-200"
                                        >
                                            {/* =========================
                                                AMC CYCLE HEADER
                                            ========================= */}

                                            <div className="border-b border-slate-200 bg-blue-50/30 px-4 py-4">
                                                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h4 className="text-sm font-semibold text-slate-950">
                                                                {
                                                                    cycle.productName
                                                                }
                                                            </h4>

                                                            {cycle.productCode && (
                                                                <span className="rounded-md bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-500">
                                                                    {
                                                                        cycle.productCode
                                                                    }
                                                                </span>
                                                            )}

                                                            <span
                                                                className={`rounded-full px-2 py-1 text-[9px] font-semibold ${
                                                                    cycle.invoicePaymentStatus ===
                                                                    "Paid"
                                                                        ? "bg-emerald-100 text-emerald-700"
                                                                        : cycle.invoicePaymentStatus ===
                                                                          "Partially Paid"
                                                                        ? "bg-amber-100 text-amber-700"
                                                                        : "bg-blue-100 text-[#1B59F8]"
                                                                }`}
                                                            >
                                                                {cycle.invoicePaymentStatus ||
                                                                    "AMC"}
                                                            </span>
                                                        </div>

                                                        <p className="mt-1 text-[10px] text-slate-500">
                                                            Invoice:{" "}
                                                            <span className="font-semibold text-slate-700">
                                                                {cycle.invoiceCode ||
                                                                    "—"}
                                                            </span>
                                                        </p>

                                                        {cycle.contractCode && (
                                                            <p className="mt-1 text-[10px] text-slate-500">
                                                                Contract:{" "}
                                                                {
                                                                    cycle.contractCode
                                                                }
                                                            </p>
                                                        )}

                                                        <p className="mt-2 text-[10px] font-semibold text-[#1B59F8]">
                                                            AMC Cycle:{" "}
                                                            {formatDate(
                                                                cycle.contractStartDate
                                                            )}
                                                            {" → "}
                                                            {formatDate(
                                                                cycle.contractExpiryDate
                                                            )}
                                                        </p>

                                                        {cycle.contractStartDate && (
                                                            <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                                                AMC FY{" "}
                                                                {getFinancialYear(
                                                                    cycle.contractStartDate
                                                                ) ||
                                                                    "—"}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* FINANCIAL SUMMARY */}

                                                    <div className="grid grid-cols-2 gap-x-7 gap-y-3 sm:grid-cols-3 xl:grid-cols-5">
                                                        <div>
                                                            <p className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">
                                                                AMC Amount
                                                            </p>

                                                            <p className="mt-1 text-xs font-semibold text-slate-900">
                                                                {formatCurrency(
                                                                    cycle.invoiceTotalAmount
                                                                )}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">
                                                                Total Received
                                                            </p>

                                                            <p className="mt-1 text-xs font-semibold text-emerald-700">
                                                                {formatCurrency(
                                                                    cycle.invoicePaidAmount ||
                                                                        cycle.filteredInstallmentTotal
                                                                )}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">
                                                                Pending
                                                            </p>

                                                            <p className="mt-1 text-xs font-semibold text-rose-600">
                                                                {formatCurrency(
                                                                    cycle.invoicePendingAmount
                                                                )}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">
                                                                Filtered Receipt
                                                            </p>

                                                            <p className="mt-1 text-xs font-semibold text-[#1B59F8]">
                                                                {formatCurrency(
                                                                    cycle.filteredInstallmentTotal
                                                                )}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">
                                                                Installments
                                                            </p>

                                                            <p className="mt-1 text-xs font-semibold text-slate-900">
                                                                {
                                                                    cycle
                                                                        .installments
                                                                        .length
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* =========================
                                                INSTALLMENTS
                                            ========================= */}

                                            <div className="px-4 py-3">
                                                <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                        Payment Installments
                                                    </p>

                                                    <p className="text-[9px] text-slate-400">
                                                        {
                                                            cycle
                                                                .installments
                                                                .length
                                                        }{" "}
                                                        receipt
                                                        {cycle
                                                            .installments
                                                            .length ===
                                                        1
                                                            ? ""
                                                            : "s"}{" "}
                                                        in current filter
                                                    </p>
                                                </div>

                                                <div className="overflow-x-auto rounded-lg border border-slate-200">
                                                    <table className="min-w-full">
                                                        <thead>
                                                            <tr className="border-b border-slate-200 bg-slate-50">
                                                                <th className="px-3 py-2 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                                                    Installment
                                                                </th>

                                                                <th className="px-3 py-2 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                                                    Date
                                                                </th>

                                                                <th className="px-3 py-2 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                                                    Mode
                                                                </th>

                                                                <th className="px-3 py-2 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                                                    Reference
                                                                </th>

                                                                <th className="px-3 py-2 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                                                    Notes
                                                                </th>

                                                                <th className="px-3 py-2 text-right text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                                                    Amount
                                                                </th>
                                                            </tr>
                                                        </thead>

                                                        <tbody>
                                                            {cycle.installments.map(
                                                                (
                                                                    payment,
                                                                    index
                                                                ) => (
                                                                    <tr
                                                                        key={
                                                                            payment.id
                                                                        }
                                                                        className="border-b border-slate-100 last:border-b-0"
                                                                    >
                                                                        <td className="px-3 py-3 text-xs font-semibold text-slate-500">
                                                                            #
                                                                            {index +
                                                                                1}
                                                                        </td>

                                                                        <td className="px-3 py-3 text-xs text-slate-600">
                                                                            {formatDate(
                                                                                payment.paymentDate
                                                                            )}
                                                                        </td>

                                                                        <td className="px-3 py-3 text-xs text-slate-700">
                                                                            {payment.mode ||
                                                                                "—"}
                                                                        </td>

                                                                        <td className="px-3 py-3 text-xs text-slate-500">
                                                                            {payment.referenceNo ||
                                                                                "—"}
                                                                        </td>

                                                                        <td className="max-w-[260px] px-3 py-3 text-xs text-slate-500">
                                                                            {payment.notes ||
                                                                                "—"}
                                                                        </td>

                                                                        <td className="px-3 py-3 text-right text-xs font-semibold text-[#1B59F8]">
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
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        )}

                        {/* NOTHING FOR CLIENT AFTER FILTER */}

                        {selectedClientProductPayments.length ===
                            0 &&
                            selectedClientAmcCycles.length ===
                                0 && (
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-10 text-center">
                                    <p className="text-sm font-semibold text-slate-700">
                                        No transactions found
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                        This client has no payments matching the current filters.
                                    </p>
                                </div>
                            )}
                    </div>
                </section>
            )}
        </div>
    );
}