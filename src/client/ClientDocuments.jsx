import { useMemo, useState } from "react";
import {
    Archive,
    CalendarDays,
    Download,
    Eye,
    FileArchive,
    FileCheck2,
    FileSpreadsheet,
    FileText,
    FolderOpen,
    HardDrive,
    Image,
    Search,
    ShieldCheck,
    Upload,
    UserRound,
    X,
} from "lucide-react";

const clientDocuments = [
    {
        id: 1,
        name: "AMC Agreement 2026-27.pdf",
        category: "AMC",
        type: "PDF",
        size: "1.4 MB",
        uploadedOn: "02 Jul 2026",
        uploadedBy: "Mangesh Kondhare",
        description:
            "Annual maintenance agreement for NexERP covering the period 16 July 2026 to 15 July 2027.",
        product: "NexERP",
        status: "Active",
    },
    {
        id: 2,
        name: "NexERP Licence Certificate.pdf",
        category: "Licence",
        type: "PDF",
        size: "340 KB",
        uploadedOn: "12 Mar 2022",
        uploadedBy: "Mangesh Kondhare",
        description:
            "Software licence certificate issued to Shree Ganesh Industries for 12 licensed users.",
        product: "NexERP",
        status: "Active",
    },
    {
        id: 3,
        name: "Installation Details.pdf",
        category: "Installation",
        type: "PDF",
        size: "280 KB",
        uploadedOn: "18 Mar 2022",
        uploadedBy: "Akash Pawar",
        description:
            "NexERP installation details including server configuration, database and deployment information.",
        product: "NexERP",
        status: "Verified",
    },
    {
        id: 4,
        name: "AMC Invoice INV-2026-014.pdf",
        category: "Invoice",
        type: "PDF",
        size: "190 KB",
        uploadedOn: "01 Jul 2026",
        uploadedBy: "System",
        description:
            "Annual maintenance invoice generated for the 2026-27 billing period.",
        product: "NexERP",
        status: "Pending",
    },
    {
        id: 5,
        name: "Payment Receipt RCT-2025-0081.pdf",
        category: "Receipt",
        type: "PDF",
        size: "145 KB",
        uploadedOn: "12 Jul 2025",
        uploadedBy: "Mangesh Kondhare",
        description:
            "Payment receipt for NexERP AMC invoice INV-2025-011.",
        product: "NexERP",
        status: "Paid",
    },
    {
        id: 6,
        name: "NexERP User Import Template.xlsx",
        category: "Template",
        type: "Excel",
        size: "84 KB",
        uploadedOn: "18 Jun 2026",
        uploadedBy: "Sneha Kale",
        description:
            "Excel template used to import users into the NexERP user management module.",
        product: "NexERP",
        status: "Available",
    },
    {
        id: 7,
        name: "ERP Setup Screenshots.zip",
        category: "Installation",
        type: "ZIP",
        size: "18 MB",
        uploadedOn: "20 Mar 2022",
        uploadedBy: "Akash Pawar",
        description:
            "Archive containing installation screenshots and configuration references.",
        product: "NexERP",
        status: "Available",
    },
    {
        id: 8,
        name: "GST Certificate.pdf",
        category: "Company",
        type: "PDF",
        size: "480 KB",
        uploadedOn: "12 Jan 2026",
        uploadedBy: "Ramesh Patil",
        description:
            "GST registration certificate submitted by Shree Ganesh Industries.",
        product: "Company",
        status: "Verified",
    },
];

function getDocumentIcon(type) {
    if (type === "Excel") {
        return FileSpreadsheet;
    }

    if (type === "ZIP") {
        return FileArchive;
    }

    if (type === "Image") {
        return Image;
    }

    return FileText;
}

function getDocumentIconClasses(type) {
    if (type === "Excel") {
        return "bg-emerald-50 text-emerald-700";
    }

    if (type === "ZIP") {
        return "bg-violet-50 text-violet-700";
    }

    if (type === "Image") {
        return "bg-blue-50 text-blue-700";
    }

    return "bg-rose-50 text-rose-700";
}

function StatusBadge({ status }) {
    const styles = {
        Active:
            "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
        Verified:
            "bg-blue-50 text-blue-700 ring-blue-600/10",
        Pending:
            "bg-amber-50 text-amber-700 ring-amber-600/10",
        Paid:
            "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
        Available:
            "bg-slate-100 text-slate-700 ring-slate-500/10",
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
}) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {label}
                    </p>

                    <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                        {value}
                    </p>
                </div>

                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
                >
                    <Icon size={18} />
                </div>
            </div>

            <p className="mt-4 text-[10px] text-slate-500">
                {description}
            </p>
        </article>
    );
}

function DetailItem({ label, value, icon: Icon }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 text-slate-400">
                <Icon size={14} />

                <p className="text-[9px] font-semibold uppercase tracking-[0.13em]">
                    {label}
                </p>
            </div>

            <p className="mt-2 break-words text-xs font-semibold text-slate-800">
                {value}
            </p>
        </div>
    );
}

export default function ClientDocuments() {
    const [searchValue, setSearchValue] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [typeFilter, setTypeFilter] = useState("All");
    const [selectedDocumentId, setSelectedDocumentId] =
        useState(null);

    const selectedDocument =
        clientDocuments.find(
            (document) => document.id === selectedDocumentId
        ) || null;

    const categories = [
        "All",
        ...new Set(
            clientDocuments.map(
                (document) => document.category
            )
        ),
    ];

    const filteredDocuments = useMemo(() => {
        const search = searchValue.trim().toLowerCase();

        return clientDocuments.filter((document) => {
            const matchesSearch =
                !search ||
                [
                    document.name,
                    document.category,
                    document.type,
                    document.product,
                    document.status,
                    document.uploadedBy,
                ].some((value) =>
                    String(value || "")
                        .toLowerCase()
                        .includes(search)
                );

            const matchesCategory =
                categoryFilter === "All" ||
                document.category === categoryFilter;

            const matchesType =
                typeFilter === "All" ||
                document.type === typeFilter;

            return (
                matchesSearch &&
                matchesCategory &&
                matchesType
            );
        });
    }, [searchValue, categoryFilter, typeFilter]);

    const totalStorage = "20.9 MB";

    const handleDownload = (documentName) => {
        alert(
            `${documentName} will download after the document API is connected.`
        );
    };

    const handleUploadRequest = () => {
        alert(
            "Client document upload requests will be connected to the Admin approval workflow."
        );
    };

    return (
        <div>
            <section className="flex flex-col gap-5 border-b border-slate-200 pb-7 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-600">
                        Files & Records
                    </p>

                    <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
                        Documents
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                        Access agreements, invoices, licences,
                        installation records and other files linked
                        to your account.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleUploadRequest}
                    className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0f172a] px-4 text-xs font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-cyan-600"
                >
                    <Upload size={16} />
                    Request Upload
                </button>
            </section>

            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    label="Total Documents"
                    value={clientDocuments.length}
                    description="Files linked to your client account"
                    icon={FolderOpen}
                    iconClass="bg-cyan-100 text-cyan-700"
                />

                <SummaryCard
                    label="Agreements"
                    value={
                        clientDocuments.filter(
                            (document) =>
                                document.category === "AMC" ||
                                document.category === "Licence"
                        ).length
                    }
                    description="AMC and licence documents"
                    icon={ShieldCheck}
                    iconClass="bg-violet-100 text-violet-700"
                />

                <SummaryCard
                    label="Invoices & Receipts"
                    value={
                        clientDocuments.filter(
                            (document) =>
                                document.category === "Invoice" ||
                                document.category === "Receipt"
                        ).length
                    }
                    description="Billing and payment records"
                    icon={FileCheck2}
                    iconClass="bg-emerald-100 text-emerald-700"
                />

                <SummaryCard
                    label="Storage Used"
                    value={totalStorage}
                    description="Total size of available files"
                    icon={HardDrive}
                    iconClass="bg-amber-100 text-amber-700"
                />
            </section>

            <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                <div className="flex flex-col gap-4 border-b border-slate-200 p-5 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-950">
                            Available Documents
                        </h2>

                        <p className="mt-1 text-[10px] text-slate-500">
                            Documents shared by Total Solution and your
                            company
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
                                placeholder="Search documents..."
                                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                            />
                        </div>

                        <select
                            value={categoryFilter}
                            onChange={(event) =>
                                setCategoryFilter(
                                    event.target.value
                                )
                            }
                            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                        >
                            {categories.map((category) => (
                                <option
                                    key={category}
                                    value={category}
                                >
                                    {category === "All"
                                        ? "All Categories"
                                        : category}
                                </option>
                            ))}
                        </select>

                        <select
                            value={typeFilter}
                            onChange={(event) =>
                                setTypeFilter(
                                    event.target.value
                                )
                            }
                            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                        >
                            <option value="All">
                                All File Types
                            </option>
                            <option value="PDF">PDF</option>
                            <option value="Excel">Excel</option>
                            <option value="ZIP">ZIP</option>
                            <option value="Image">Image</option>
                        </select>
                    </div>
                </div>

                <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                    {filteredDocuments.map((document) => {
                        const Icon = getDocumentIcon(
                            document.type
                        );

                        return (
                            <article
                                key={document.id}
                                className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[0_14px_40px_rgba(15,23,42,0.08)]"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div
                                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${getDocumentIconClasses(
                                            document.type
                                        )}`}
                                    >
                                        <Icon size={19} />
                                    </div>

                                    <StatusBadge
                                        status={document.status}
                                    />
                                </div>

                                <div className="mt-4">
                                    <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-950">
                                        {document.name}
                                    </h3>

                                    <p className="mt-1 text-[10px] font-medium text-cyan-700">
                                        {document.category} ·{" "}
                                        {document.product}
                                    </p>

                                    <p className="mt-3 line-clamp-2 text-[10px] leading-5 text-slate-500">
                                        {document.description}
                                    </p>
                                </div>

                                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                                    <div>
                                        <p className="text-[9px] text-slate-400">
                                            {document.type} ·{" "}
                                            {document.size}
                                        </p>

                                        <p className="mt-1 text-[9px] text-slate-500">
                                            {document.uploadedOn}
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSelectedDocumentId(
                                                    document.id
                                                )
                                            }
                                            title="View details"
                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                                        >
                                            <Eye size={14} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleDownload(
                                                    document.name
                                                )
                                            }
                                            title="Download"
                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                                        >
                                            <Download size={14} />
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}

                    {filteredDocuments.length === 0 && (
                        <div className="col-span-full flex min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
                            <div className="text-center">
                                <Search
                                    size={28}
                                    className="mx-auto text-slate-300"
                                />

                                <p className="mt-3 text-sm font-semibold text-slate-700">
                                    No document found
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                    Change the search or filter
                                    selection.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                            <Archive size={19} />
                        </div>

                        <div>
                            <h2 className="text-sm font-semibold text-slate-950">
                                Need another document?
                            </h2>

                            <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
                                Request an invoice copy, licence
                                certificate, agreement or installation
                                document from the support team.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleUploadRequest}
                        className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                    >
                        <Upload size={15} />
                        Request Document
                    </button>
                </div>
            </section>

            {selectedDocument && (
                <>
                    <button
                        type="button"
                        aria-label="Close document details"
                        onClick={() =>
                            setSelectedDocumentId(null)
                        }
                        className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-sm"
                    />

                    <aside className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-[620px] flex-col bg-white shadow-[-20px_0_60px_rgba(15,23,42,0.18)]">
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
                            <div className="min-w-0">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-600">
                                    Document Details
                                </p>

                                <h2 className="mt-1 truncate text-lg font-semibold text-slate-950">
                                    {selectedDocument.name}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedDocumentId(null)
                                }
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                            <div className="rounded-2xl border border-cyan-200 bg-gradient-to-r from-cyan-50 to-white p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        {(() => {
                                            const Icon =
                                                getDocumentIcon(
                                                    selectedDocument.type
                                                );

                                            return (
                                                <div
                                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${getDocumentIconClasses(
                                                        selectedDocument.type
                                                    )}`}
                                                >
                                                    <Icon size={22} />
                                                </div>
                                            );
                                        })()}

                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-950">
                                                {
                                                    selectedDocument.name
                                                }
                                            </h3>

                                            <p className="mt-1 text-[10px] text-slate-500">
                                                {
                                                    selectedDocument.type
                                                }{" "}
                                                ·{" "}
                                                {
                                                    selectedDocument.size
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    <StatusBadge
                                        status={
                                            selectedDocument.status
                                        }
                                    />
                                </div>
                            </div>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                <DetailItem
                                    label="Category"
                                    value={
                                        selectedDocument.category
                                    }
                                    icon={FolderOpen}
                                />

                                <DetailItem
                                    label="Product"
                                    value={
                                        selectedDocument.product
                                    }
                                    icon={FileCheck2}
                                />

                                <DetailItem
                                    label="Uploaded On"
                                    value={
                                        selectedDocument.uploadedOn
                                    }
                                    icon={CalendarDays}
                                />

                                <DetailItem
                                    label="Uploaded By"
                                    value={
                                        selectedDocument.uploadedBy
                                    }
                                    icon={UserRound}
                                />
                            </div>

                            <section className="mt-5 rounded-2xl border border-slate-200 p-5">
                                <h3 className="text-sm font-semibold text-slate-950">
                                    Description
                                </h3>

                                <p className="mt-3 text-xs leading-6 text-slate-500">
                                    {
                                        selectedDocument.description
                                    }
                                </p>
                            </section>

                            <section className="mt-5 flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
                                <div className="text-center">
                                    <FileText
                                        size={32}
                                        className="mx-auto text-slate-300"
                                    />

                                    <p className="mt-3 text-sm font-semibold text-slate-700">
                                        Document preview
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Preview will appear after file
                                        storage is connected.
                                    </p>
                                </div>
                            </section>
                        </div>

                        <div className="grid gap-3 border-t border-slate-200 p-5 sm:grid-cols-2 sm:px-6">
                            <button
                                type="button"
                                onClick={() =>
                                    handleDownload(
                                        selectedDocument.name
                                    )
                                }
                                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0f172a] px-4 text-xs font-semibold text-white transition hover:bg-cyan-600"
                            >
                                <Download size={16} />
                                Download Document
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedDocumentId(null)
                                }
                                className="h-11 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
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