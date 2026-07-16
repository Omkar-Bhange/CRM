    import { useMemo, useState } from "react";
import {
    AlertCircle,
    Banknote,
    CalendarDays,
    CheckCircle2,
    Clock3,
    CreditCard,
    Download,
    Eye,
    FileText,
    IndianRupee,
    Mail,
    Phone,
    ReceiptText,
    Search,
    ShieldCheck,
    WalletCards,
    X,
} from "lucide-react";

const billingRecords = [
    {
        id: 1,
        invoiceNo: "INV-2026-014",
        product: "NexERP",
        invoiceType: "Annual AMC",
        period: "16 Jul 2026 – 15 Jul 2027",
        invoiceDate: "01 Jul 2026",
        dueDate: "15 Jul 2026",
        amount: 45000,
        paidAmount: 0,
        pendingAmount: 45000,
        status: "Pending",
        paymentDate: "",
        paymentMode: "",
        referenceNo: "",
        description:
            "Annual maintenance and technical support charges for NexERP.",
    },
    {
        id: 2,
        invoiceNo: "INV-2025-011",
        product: "NexERP",
        invoiceType: "Annual AMC",
        period: "16 Jul 2025 – 15 Jul 2026",
        invoiceDate: "01 Jul 2025",
        dueDate: "15 Jul 2025",
        amount: 42000,
        paidAmount: 42000,
        pendingAmount: 0,
        status: "Paid",
        paymentDate: "12 Jul 2025",
        paymentMode: "Bank Transfer",
        referenceNo: "UTR92384721",
        description:
            "Annual maintenance and support charges for NexERP.",
    },
    {
        id: 3,
        invoiceNo: "INV-2024-008",
        product: "NexERP",
        invoiceType: "Annual AMC",
        period: "16 Jul 2024 – 15 Jul 2025",
        invoiceDate: "01 Jul 2024",
        dueDate: "15 Jul 2024",
        amount: 40000,
        paidAmount: 40000,
        pendingAmount: 0,
        status: "Paid",
        paymentDate: "10 Jul 2024",
        paymentMode: "Cheque",
        referenceNo: "CHQ-674821",
        description:
            "Annual maintenance and support charges for NexERP.",
    },
];

const paymentRecords = [
    {
        id: 1,
        receiptNo: "RCT-2025-0081",
        invoiceNo: "INV-2025-011",
        paymentDate: "12 Jul 2025",
        amount: 42000,
        mode: "Bank Transfer",
        referenceNo: "UTR92384721",
        status: "Completed",
    },
    {
        id: 2,
        receiptNo: "RCT-2024-0064",
        invoiceNo: "INV-2024-008",
        paymentDate: "10 Jul 2024",
        amount: 40000,
        mode: "Cheque",
        referenceNo: "CHQ-674821",
        status: "Completed",
    },
];

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number(amount || 0));
}

function StatusBadge({ status }) {
    const styles = {
        Paid:
            "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
        Pending:
            "bg-amber-50 text-amber-700 ring-amber-600/10",
        Overdue:
            "bg-rose-50 text-rose-700 ring-rose-600/10",
        "Partially Paid":
            "bg-blue-50 text-blue-700 ring-blue-600/10",
        Completed:
            "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
    };

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ring-1 ring-inset ${
                styles[status] ||
                "bg-slate-100 text-slate-600 ring-slate-500/10"
            }`}
        >
            {status}
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
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {label}
                    </p>

                    <p className="mt-2 truncate text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                        {value}
                    </p>
                </div>

                <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
                >
                    <Icon size={18} />
                </div>
            </div>

            <p
                className={`mt-4 text-[10px] font-medium ${descriptionClass}`}
            >
                {description}
            </p>
        </article>
    );
}

function DetailItem({ label, value, icon: Icon, valueClass = "" }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 text-slate-400">
                <Icon size={14} />

                <p className="text-[9px] font-semibold uppercase tracking-[0.13em]">
                    {label}
                </p>
            </div>

            <p
                className={`mt-2 break-words text-xs font-semibold text-slate-800 ${valueClass}`}
            >
                {value || "Not available"}
            </p>
        </div>
    );
}

export default function ClientBilling() {
    const [searchValue, setSearchValue] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [selectedInvoiceId, setSelectedInvoiceId] =
        useState(null);

    const selectedInvoice =
        billingRecords.find(
            (record) => record.id === selectedInvoiceId
        ) || null;

    const totalBilled = billingRecords.reduce(
        (total, record) => total + Number(record.amount || 0),
        0
    );

    const totalPaid = billingRecords.reduce(
        (total, record) =>
            total + Number(record.paidAmount || 0),
        0
    );

    const totalPending = billingRecords.reduce(
        (total, record) =>
            total + Number(record.pendingAmount || 0),
        0
    );

    const paidInvoiceCount = billingRecords.filter(
        (record) => record.status === "Paid"
    ).length;

    const filteredBillingRecords = useMemo(() => {
        const search = searchValue.trim().toLowerCase();

        return billingRecords.filter((record) => {
            const matchesSearch =
                !search ||
                [
                    record.invoiceNo,
                    record.product,
                    record.invoiceType,
                    record.period,
                    record.status,
                ].some((value) =>
                    String(value || "")
                        .toLowerCase()
                        .includes(search)
                );

            const matchesStatus =
                statusFilter === "All" ||
                record.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [searchValue, statusFilter]);

    const handleDownloadInvoice = (invoiceNo) => {
        alert(
            `${invoiceNo} PDF will download after the PDF API is connected.`
        );
    };

    const handleDownloadReceipt = (receiptNo) => {
        alert(
            `${receiptNo} will download after the receipt API is connected.`
        );
    };

    const closeInvoiceDrawer = () => {
        setSelectedInvoiceId(null);
    };

    return (
        <div>
            <section className="flex flex-col gap-5 border-b border-slate-200 pb-7 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-600">
                        Billing & Renewals
                    </p>

                    <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
                        Bills & AMC
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                        Review annual maintenance charges, invoices,
                        payment history and renewal information.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        handleDownloadInvoice("INV-2026-014")
                    }
                    className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0f172a] px-4 text-xs font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-cyan-600"
                >
                    <Download size={16} />
                    Download Current Bill
                </button>
            </section>

            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    label="Total Billed"
                    value={formatCurrency(totalBilled)}
                    description={`${billingRecords.length} AMC invoices generated`}
                    icon={ReceiptText}
                    iconClass="bg-violet-100 text-violet-700"
                />

                <SummaryCard
                    label="Total Paid"
                    value={formatCurrency(totalPaid)}
                    description={`${paidInvoiceCount} invoices fully paid`}
                    icon={CheckCircle2}
                    iconClass="bg-emerald-100 text-emerald-700"
                    descriptionClass="text-emerald-600"
                />

                <SummaryCard
                    label="Pending Amount"
                    value={formatCurrency(totalPending)}
                    description="Current AMC payment is pending"
                    icon={IndianRupee}
                    iconClass="bg-amber-100 text-amber-700"
                    descriptionClass="text-amber-600"
                />

                <SummaryCard
                    label="Next Due Date"
                    value="15 Jul 2026"
                    description="Current renewal payment deadline"
                    icon={CalendarDays}
                    iconClass="bg-cyan-100 text-cyan-700"
                />
            </section>

            <section className="mt-5 overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                <div className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-white px-5 py-4">
                    <div className="flex items-center gap-2 text-amber-700">
                        <AlertCircle size={16} />

                        <p className="text-[10px] font-semibold uppercase tracking-[0.15em]">
                            Current AMC Payment Due
                        </p>
                    </div>
                </div>

                <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <p className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                                ₹45,000
                            </p>

                            <p className="mt-2 text-xs text-slate-500">
                                NexERP Annual AMC · 2026–27
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <StatusBadge status="Pending" />

                                <span className="text-[10px] font-medium text-rose-600">
                                    Due on 15 July 2026
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedInvoiceId(1)
                                }
                                className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                            >
                                <Eye size={16} />
                                View Invoice
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    handleDownloadInvoice(
                                        "INV-2026-014"
                                    )
                                }
                                className="flex h-10 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400"
                            >
                                <Download size={16} />
                                Download PDF
                            </button>
                        </div>
                    </div>

                    <div className="mt-7">
                        <div className="mb-2 flex items-center justify-between text-[10px] text-slate-500">
                            <span>Current AMC period progress</span>
                            <span>4 days remaining</span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full w-[92%] rounded-full bg-cyan-500" />
                        </div>

                        <p className="mt-2 text-[9px] text-slate-400">
                            15 July 2025 – 15 July 2026
                        </p>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <DetailItem
                            label="Invoice Number"
                            value="INV-2026-014"
                            icon={FileText}
                        />

                        <DetailItem
                            label="Invoice Date"
                            value="01 Jul 2026"
                            icon={CalendarDays}
                        />

                        <DetailItem
                            label="Due Date"
                            value="15 Jul 2026"
                            icon={Clock3}
                            valueClass="text-amber-700"
                        />

                        <DetailItem
                            label="Support Coverage"
                            value="Annual AMC"
                            icon={ShieldCheck}
                        />
                    </div>
                </div>
            </section>

            <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-950">
                            Invoice History
                        </h2>

                        <p className="mt-1 text-[10px] text-slate-500">
                            All AMC invoices generated for your company
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="relative sm:w-[280px]">
                            <Search
                                size={16}
                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="search"
                                value={searchValue}
                                onChange={(event) =>
                                    setSearchValue(
                                        event.target.value
                                    )
                                }
                                placeholder="Search invoice..."
                                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(event.target.value)
                            }
                            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                        >
                            <option value="All">
                                All Status
                            </option>
                            <option value="Paid">Paid</option>
                            <option value="Pending">
                                Pending
                            </option>
                            <option value="Overdue">
                                Overdue
                            </option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/70">
                                <th className="px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                    Invoice
                                </th>

                                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                    Product
                                </th>

                                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                    Period
                                </th>

                                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                    Due Date
                                </th>

                                <th className="px-4 py-3 text-right text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                    Amount
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
                            {filteredBillingRecords.map(
                                (record) => (
                                    <tr
                                        key={record.id}
                                        className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                                    >
                                        <td className="px-5 py-4">
                                            <p className="text-xs font-semibold text-slate-950">
                                                {record.invoiceNo}
                                            </p>

                                            <p className="mt-1 text-[9px] text-slate-400">
                                                {record.invoiceDate}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4 text-xs font-medium text-slate-700">
                                            {record.product}
                                        </td>

                                        <td className="px-4 py-4 text-xs text-slate-500">
                                            {record.period}
                                        </td>

                                        <td className="px-4 py-4 text-xs text-slate-600">
                                            {record.dueDate}
                                        </td>

                                        <td className="px-4 py-4 text-right text-xs font-semibold text-slate-900">
                                            {formatCurrency(
                                                record.amount
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
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedInvoiceId(
                                                            record.id
                                                        )
                                                    }
                                                    title="View invoice"
                                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                                                >
                                                    <Eye size={14} />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDownloadInvoice(
                                                            record.invoiceNo
                                                        )
                                                    }
                                                    title="Download PDF"
                                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                                                >
                                                    <Download
                                                        size={14}
                                                    />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>

                {filteredBillingRecords.length === 0 && (
                    <div className="flex min-h-[260px] items-center justify-center border-t border-slate-200 bg-slate-50/40">
                        <div className="text-center">
                            <Search
                                size={26}
                                className="mx-auto text-slate-300"
                            />

                            <p className="mt-3 text-sm font-semibold text-slate-700">
                                No invoice found
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                                Try changing the search or status
                                filter.
                            </p>
                        </div>
                    </div>
                )}
            </section>

            <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-950">
                            Payment History
                        </h2>

                        <p className="mt-1 text-[10px] text-slate-500">
                            Completed AMC payments and receipts
                        </p>
                    </div>

                    <WalletCards
                        size={18}
                        className="text-cyan-600"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/70">
                                <th className="px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                    Receipt
                                </th>

                                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                    Invoice
                                </th>

                                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                    Payment Date
                                </th>

                                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                    Payment Mode
                                </th>

                                <th className="px-4 py-3 text-right text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                    Amount
                                </th>

                                <th className="px-5 py-3 text-right text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                    Receipt
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {paymentRecords.map((payment) => (
                                <tr
                                    key={payment.id}
                                    className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                                >
                                    <td className="px-5 py-4">
                                        <p className="text-xs font-semibold text-slate-950">
                                            {payment.receiptNo}
                                        </p>

                                        <div className="mt-1">
                                            <StatusBadge
                                                status={
                                                    payment.status
                                                }
                                            />
                                        </div>
                                    </td>

                                    <td className="px-4 py-4 text-xs font-medium text-slate-700">
                                        {payment.invoiceNo}
                                    </td>

                                    <td className="px-4 py-4 text-xs text-slate-600">
                                        {payment.paymentDate}
                                    </td>

                                    <td className="px-4 py-4">
                                        <p className="text-xs font-medium text-slate-700">
                                            {payment.mode}
                                        </p>

                                        <p className="mt-1 text-[9px] text-slate-400">
                                            {payment.referenceNo}
                                        </p>
                                    </td>

                                    <td className="px-4 py-4 text-right text-xs font-semibold text-slate-900">
                                        {formatCurrency(
                                            payment.amount
                                        )}
                                    </td>

                                    <td className="px-5 py-4 text-right">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleDownloadReceipt(
                                                    payment.receiptNo
                                                )
                                            }
                                            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[10px] font-semibold text-slate-600 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                                        >
                                            <Download size={13} />
                                            PDF
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                            <Banknote size={19} />
                        </div>

                        <div>
                            <h2 className="text-sm font-semibold text-slate-950">
                                Need help with payment?
                            </h2>

                            <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
                                Contact our billing team for bank
                                details, payment confirmation or invoice
                                corrections.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <a
                            href="tel:+919876543210"
                            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                        >
                            <Phone size={15} />
                            Call Billing Team
                        </a>

                        <a
                            href="mailto:billing@totalsolution.in"
                            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0f172a] px-4 text-xs font-semibold text-white transition hover:bg-cyan-600"
                        >
                            <Mail size={15} />
                            Send Email
                        </a>
                    </div>
                </div>
            </section>

            {selectedInvoice && (
                <>
                    <button
                        type="button"
                        aria-label="Close invoice details"
                        onClick={closeInvoiceDrawer}
                        className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-sm"
                    />

                    <aside className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-[640px] flex-col bg-white shadow-[-20px_0_60px_rgba(15,23,42,0.18)]">
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-600">
                                    Invoice Details
                                </p>

                                <h2 className="mt-1 text-lg font-semibold text-slate-950">
                                    {selectedInvoice.invoiceNo}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={closeInvoiceDrawer}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                            <div className="rounded-2xl border border-cyan-200 bg-gradient-to-r from-cyan-50 to-white p-5">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-cyan-700">
                                            Amount Payable
                                        </p>

                                        <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                                            {formatCurrency(
                                                selectedInvoice.amount
                                            )}
                                        </p>

                                        <p className="mt-2 text-xs text-slate-500">
                                            {
                                                selectedInvoice.product
                                            }{" "}
                                            ·{" "}
                                            {
                                                selectedInvoice.invoiceType
                                            }
                                        </p>
                                    </div>

                                    <StatusBadge
                                        status={
                                            selectedInvoice.status
                                        }
                                    />
                                </div>
                            </div>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                <DetailItem
                                    label="Invoice Date"
                                    value={
                                        selectedInvoice.invoiceDate
                                    }
                                    icon={CalendarDays}
                                />

                                <DetailItem
                                    label="Due Date"
                                    value={
                                        selectedInvoice.dueDate
                                    }
                                    icon={Clock3}
                                    valueClass={
                                        selectedInvoice.status ===
                                        "Pending"
                                            ? "text-amber-700"
                                            : ""
                                    }
                                />

                                <DetailItem
                                    label="Billing Period"
                                    value={selectedInvoice.period}
                                    icon={CalendarDays}
                                />

                                <DetailItem
                                    label="Invoice Type"
                                    value={
                                        selectedInvoice.invoiceType
                                    }
                                    icon={ReceiptText}
                                />
                            </div>

                            <div className="mt-5 rounded-2xl border border-slate-200 p-5">
                                <h3 className="text-sm font-semibold text-slate-950">
                                    Payment Summary
                                </h3>

                                <div className="mt-4 space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs">
                                        <span className="text-slate-500">
                                            Invoice amount
                                        </span>

                                        <span className="font-semibold text-slate-900">
                                            {formatCurrency(
                                                selectedInvoice.amount
                                            )}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs">
                                        <span className="text-slate-500">
                                            Paid amount
                                        </span>

                                        <span className="font-semibold text-emerald-700">
                                            {formatCurrency(
                                                selectedInvoice.paidAmount
                                            )}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-slate-700">
                                            Pending amount
                                        </span>

                                        <span className="text-base font-semibold text-amber-700">
                                            {formatCurrency(
                                                selectedInvoice.pendingAmount
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {selectedInvoice.status === "Paid" && (
                                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
                                    <div className="flex items-center gap-2 text-emerald-700">
                                        <CheckCircle2 size={17} />

                                        <h3 className="text-sm font-semibold">
                                            Payment Completed
                                        </h3>
                                    </div>

                                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                        <DetailItem
                                            label="Payment Date"
                                            value={
                                                selectedInvoice.paymentDate
                                            }
                                            icon={CalendarDays}
                                        />

                                        <DetailItem
                                            label="Payment Mode"
                                            value={
                                                selectedInvoice.paymentMode
                                            }
                                            icon={CreditCard}
                                        />

                                        <div className="sm:col-span-2">
                                            <DetailItem
                                                label="Reference Number"
                                                value={
                                                    selectedInvoice.referenceNo
                                                }
                                                icon={FileText}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-5 rounded-2xl border border-slate-200 p-5">
                                <h3 className="text-sm font-semibold text-slate-950">
                                    Description
                                </h3>

                                <p className="mt-3 text-xs leading-6 text-slate-500">
                                    {
                                        selectedInvoice.description
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-3 border-t border-slate-200 p-5 sm:grid-cols-2 sm:px-6">
                            <button
                                type="button"
                                onClick={() =>
                                    handleDownloadInvoice(
                                        selectedInvoice.invoiceNo
                                    )
                                }
                                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0f172a] px-4 text-xs font-semibold text-white transition hover:bg-cyan-600"
                            >
                                <Download size={16} />
                                Download Invoice
                            </button>

                            <button
                                type="button"
                                onClick={closeInvoiceDrawer}
                                className="flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Close
                            </button>
                        </div>
                    </aside>
                </>
            )}
        </div>
    );
}