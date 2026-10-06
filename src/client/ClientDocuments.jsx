import { useEffect, useMemo, useState } from "react";
import {
    Archive,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
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

import API_URL from "../config/api";
function getApiFileUrl(url) {
    if (!url) {
        return "";
    }

    if (
        url.startsWith("http://") ||
        url.startsWith("https://")
    ) {
        return url;
    }

    return `${API_URL}${
        url.startsWith("/")
            ? url
            : `/${url}`
    }`;
}


function bytesToSize(bytes) {
    const value = Number(bytes || 0);

    if (!value || value <= 0) {
        return "0 B";
    }

    const sizes = [
        "B",
        "KB",
        "MB",
        "GB",
    ];

    const i = Math.min(
        Math.floor(
            Math.log(value) /
            Math.log(1024)
        ),
        sizes.length - 1
    );

    return `${parseFloat(
        (
            value /
            Math.pow(1024, i)
        ).toFixed(1)
    )} ${sizes[i]}`;
}

function formatDocumentDate(value) {
    if (!value) return "Unknown";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value);
    }
    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function getDocumentIcon(document) {
    const mimeType =
        String(
            document?.mimeType || ""
        ).toLowerCase();

    const fileName =
        String(
            document?.fileName ||
            document?.name ||
            ""
        ).toLowerCase();

    if (
        mimeType.includes(
            "image"
        ) ||
        /\.(jpg|jpeg|png|webp)$/i.test(
            fileName
        )
    ) {
        return Image;
    }

    if (
        mimeType.includes(
            "spreadsheet"
        ) ||
        /\.(xls|xlsx|csv)$/i.test(
            fileName
        )
    ) {
        return FileSpreadsheet;
    }

    if (
        mimeType.includes(
            "zip"
        ) ||
        /\.zip$/i.test(
            fileName
        )
    ) {
        return FileArchive;
    }

    return FileText;
}

function getDocumentIconClasses(document) {
    const mimeType =
        String(
            document?.mimeType || ""
        ).toLowerCase();

    const fileName =
        String(
            document?.fileName ||
            document?.name ||
            ""
        ).toLowerCase();

    if (
        mimeType.includes(
            "image"
        ) ||
        /\.(jpg|jpeg|png|webp)$/i.test(
            fileName
        )
    ) {
        return "bg-blue-50 text-blue-700";
    }

    if (
        /\.(xls|xlsx|csv)$/i.test(
            fileName
        )
    ) {
        return "bg-emerald-50 text-emerald-700";
    }

    if (
        /\.zip$/i.test(
            fileName
        )
    ) {
        return "bg-violet-50 text-violet-700";
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
        <article className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {label}
                    </p>

                    <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                        {value}
                    </p>
                </div>

                <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
                >
                    <Icon size={16} />
                </div>
            </div>

            <p className="mt-1.5 text-[11px] text-slate-500 truncate">
                {description}
            </p>
        </article>
    );
}

function DetailItem({ label, value, icon: Icon }) {
    return (
        <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-2.5">
            <div className="flex items-center gap-1.5 text-slate-400">
                <Icon size={13} />

                <p className="text-[10px] font-bold uppercase tracking-wider">
                    {label}
                </p>
            </div>

            <p className="mt-1 break-words text-xs font-bold text-slate-800">
                {value}
            </p>
        </div>
    );
}

export default function ClientDocuments() {
    const [documents, setDocuments] = useState([]);
    const [documentsLoading, setDocumentsLoading] = useState(true);
    const [documentsError, setDocumentsError] = useState("");
    const [searchValue, setSearchValue] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [typeFilter, setTypeFilter] = useState("All");
    const [selectedDocumentId, setSelectedDocumentId] = useState(null);

    useEffect(() => {
        const loadDocuments = async () => {
            setDocumentsLoading(true);
            setDocumentsError("");

            try {
                const token =
                    localStorage.getItem("client-connect-token") ||
                    sessionStorage.getItem("client-connect-token") ||
                    "";

                const response = await fetch(
                    `${API_URL}/api/client/amc/documents`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.message || "Unable to load documents.");
                }

                setDocuments(result.data || []);
            } catch (error) {
                setDocumentsError(error.message || "Unable to load documents.");
                setDocuments([]);
            } finally {
                setDocumentsLoading(false);
            }
        };

        loadDocuments();
    }, []);

    const selectedDocument =
        documents.find((document) => document.id === selectedDocumentId) ||
        null;

    const categories = [
        "All",
        ...new Set(documents.map((document) => document.category || "General")),
    ];

    const types = [
        "All",
        ...new Set(documents.map((document) => document.documentType || "Document")),
    ];

    const filteredDocuments = useMemo(() => {
        const search = searchValue.trim().toLowerCase();

        return documents.filter((document) => {
            const matchesSearch =
                !search ||
                [
                    document.name,
                    document.category,
                    document.documentType,
                    document.productName,
                    document.status,
                    document.uploadedByName,
                ].some((value) =>
                    String(value || "").toLowerCase().includes(search)
                );

            const matchesCategory =
                categoryFilter === "All" ||
                document.category === categoryFilter;

            const matchesType =
                typeFilter === "All" ||
                document.documentType === typeFilter;

            return matchesSearch && matchesCategory && matchesType;
        });
    }, [documents, searchValue, categoryFilter, typeFilter]);

    // Pagination
    const [docPage, setDocPage] = useState(1);
    const [docPageSize, setDocPageSize] = useState(6);

    useEffect(() => {
        setDocPage(1);
    }, [searchValue, categoryFilter, typeFilter]);

    const totalDocs = filteredDocuments.length;
    const totalDocPages = Math.max(1, Math.ceil(totalDocs / docPageSize));
    const safeDocPage = Math.min(Math.max(1, docPage), totalDocPages);
    const paginatedDocuments = useMemo(() => {
        const start = (safeDocPage - 1) * docPageSize;
        return filteredDocuments.slice(start, start + docPageSize);
    }, [filteredDocuments, safeDocPage, docPageSize]);

    const totalStorage = documents.reduce(
        (total, document) => total + Number(document.size || 0),
        0
    );

   const handleDownload = async (doc) => {
    if (!doc?.id) {
        window.alert(
            "Document information is not available."
        );
        return;
    }

    try {
        const token =
            localStorage.getItem(
                "client-connect-token"
            ) ||
            sessionStorage.getItem(
                "client-connect-token"
            ) ||
            "";

        if (!token) {
            throw new Error(
                "Login token was not found. Please login again."
            );
        }

        const endpoint =
            getApiFileUrl(
                doc.downloadUrl ||
                `/api/client/amc/document/${doc.id}/download`
            );

        const response =
            await fetch(
                endpoint,
                {
                    method: "GET",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

        if (!response.ok) {
            let message =
                "Unable to download document.";

            try {
                const result =
                    await response.json();

                message =
                    result.message ||
                    message;
            } catch {
                // File response may not contain JSON.
            }

            throw new Error(
                message
            );
        }

        const blob =
            await response.blob();

        const url =
            window.URL.createObjectURL(
                blob
            );

        const link =
            window.document.createElement(
                "a"
            );

        link.href = url;

        link.download =
            doc.fileName ||
            doc.name ||
            "document";

        window.document.body.appendChild(
            link
        );

        link.click();

        link.remove();

        setTimeout(() => {
            window.URL.revokeObjectURL(
                url
            );
        }, 1000);
    } catch (error) {
        console.error(
            "Client document download error:",
            error
        );

        window.alert(
            error.message ||
            "Unable to download document."
        );
    }
};

const handlePreviewDocument =
    async (doc) => {
        if (!doc?.id) {
            window.alert(
                "Document information is not available."
            );
            return;
        }

        try {
            const token =
                localStorage.getItem(
                    "client-connect-token"
                ) ||
                sessionStorage.getItem(
                    "client-connect-token"
                ) ||
                "";

            if (!token) {
                throw new Error(
                    "Login token was not found. Please login again."
                );
            }

            const endpoint =
                getApiFileUrl(
                    doc.previewUrl ||
                    `/api/client/amc/document/${doc.id}/view`
                );

            const response =
                await fetch(
                    endpoint,
                    {
                        method: "GET",

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
                    // Binary response.
                }

                throw new Error(
                    message
                );
            }

            const blob =
                await response.blob();

            const objectUrl =
                window.URL.createObjectURL(
                    blob
                );

            const previewWindow =
                window.open(
                    objectUrl,
                    "_blank"
                );

            if (!previewWindow) {
                window.URL.revokeObjectURL(
                    objectUrl
                );

                throw new Error(
                    "Popup was blocked. Please allow popups to preview documents."
                );
            }

            setTimeout(() => {
                window.URL.revokeObjectURL(
                    objectUrl
                );
            }, 60000);
        } catch (error) {
            console.error(
                "Client document preview error:",
                error
            );

            window.alert(
                error.message ||
                "Unable to preview document."
            );
        }
    };
    const handleUploadRequest = async () => {
        const description = window.prompt(
            "Describe the document you need from Total Solution:",
            "Requesting agreement, invoice or installation file"
        );

        if (!description || !description.trim()) {
            return;
        }

        try {
            const token =
                localStorage.getItem("client-connect-token") ||
                sessionStorage.getItem("client-connect-token") ||
                "";

            const response = await fetch(`${API_URL}/api/documents/request`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ description, name: "Document Request" }),
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message || "Unable to submit document request.");
            }

            setDocuments((prev) => [result.data, ...prev]);
            window.alert("Document request submitted successfully.");
        } catch (error) {
            window.alert(error.message || "Unable to submit request.");
        }
    };

    return (
        <div className="space-y-4">
            <section className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1B59F8]">
                            Files & Records
                        </span>
                        <span className="text-xs text-slate-400">Total Solution Portal</span>
                    </div>

                    <h1 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
                        Documents
                    </h1>

                    <p className="mt-0.5 text-xs text-slate-500">
                        Access agreements, invoices, licences, installation records and other files linked to your account.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleUploadRequest}
                    className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] px-3.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-blue-700"
                >
                    <Upload size={14} />
                    Request Upload
                </button>
            </section>

            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <SummaryCard
                    label="Total Documents"
                    value={documents.length}
                    description="Files linked to your client account"
                    icon={FolderOpen}
                    iconClass="bg-blue-50 text-[#1B59F8]"
                />

                <SummaryCard
                    label="Agreements"
                    value={
                        documents.filter(
                            (document) =>
                                document.category === "AMC" ||
                                document.category === "Licence"
                        ).length
                    }
                    description="AMC and licence documents"
                    icon={ShieldCheck}
                    iconClass="bg-indigo-50 text-indigo-600"
                />

                <SummaryCard
                    label="Invoices & Receipts"
                    value={
                        documents.filter(
                            (document) =>
                                document.category === "Invoice" ||
                                document.category === "Receipt"
                        ).length
                    }
                    description="Billing and payment records"
                    icon={FileCheck2}
                    iconClass="bg-emerald-50 text-emerald-600"
                />

                <SummaryCard
                    label="Storage Used"
                    value={bytesToSize(totalStorage)}
                    description="Total size of available files"
                    icon={HardDrive}
                    iconClass="bg-amber-50 text-amber-600"
                />
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs">
                <div className="flex flex-col gap-3 border-b border-slate-200/90 p-3.5 sm:px-4 sm:py-3 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                            Available Documents
                        </h2>

                        <p className="text-[11px] text-slate-400">
                            Documents shared by Total Solution and your company
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative w-full sm:w-[240px]">
                            <Search
                                size={14}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
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
                                className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-8 pr-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1B59F8] focus:bg-white focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <select
                            value={categoryFilter}
                            onChange={(event) =>
                                setCategoryFilter(
                                    event.target.value
                                )
                            }
                            className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none focus:border-[#1B59F8] focus:ring-2 focus:ring-blue-100"
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
                            className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none focus:border-[#1B59F8] focus:ring-2 focus:ring-blue-100"
                        >
                            {types.map((type) => (
                                <option
                                    key={type}
                                    value={type}
                                >
                                    {type === "All"
                                        ? "All Document Types"
                                        : type}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid gap-3 p-3.5 sm:p-4 md:grid-cols-2 xl:grid-cols-3">
                    {paginatedDocuments.map((document) => {
                        const Icon = getDocumentIcon(
                            document.documentType
                        );

                        return (
                            <article
                                key={document.id}
                                className="group rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs transition hover:border-blue-300 hover:shadow-xs"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div
                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${getDocumentIconClasses(
                                            document.documentType
                                        )}`}
                                    >
                                        <Icon size={16} />
                                    </div>

                                    <StatusBadge
                                        status={document.status}
                                    />
                                </div>

                                <div className="mt-2.5">
                                    <h3 className="line-clamp-1 text-xs font-bold text-slate-900 group-hover:text-[#1B59F8] transition-colors">
                                        {document.name}
                                    </h3>

                                    <p className="mt-0.5 text-[10px] font-semibold text-[#1B59F8]">
                                        {document.category} ·{" "}
                                        {document.productName}
                                    </p>

                                    <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
                                        {document.description || "No description provided."}
                                    </p>
                                </div>

                                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                                    <div>
                                        <p className="text-[10px] font-medium text-slate-400">
                                            {document.documentType} ·{" "}
                                            {bytesToSize(document.size || 0)}
                                        </p>

                                        <p className="mt-0.5 text-[10px] text-slate-500">
                                            {formatDocumentDate(
                                                document.uploadedAt ||
                                                document.createdAt
                                            )}
                                        </p>
                                    </div>

                                    <div className="flex gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSelectedDocumentId(
                                                    document.id
                                                )
                                            }
                                            title="View details"
                                            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-[#1B59F8]"
                                        >
                                            <Eye size={13} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDownload(document)}
                                            title="Download"
                                            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-[#1B59F8]"
                                        >
                                            <Download size={13} />
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}

                    {filteredDocuments.length === 0 && (
                        <div className="col-span-full flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                            <div className="text-center">
                                <Search
                                    size={24}
                                    className="mx-auto text-slate-300"
                                />

                                <p className="mt-2 text-xs font-bold text-slate-700">
                                    No document found
                                </p>

                                <p className="mt-0.5 text-[11px] text-slate-400">
                                    Change the search or filter selection.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {filteredDocuments.length > 0 && (
                    <div className="flex flex-col gap-2.5 border-t border-slate-200/80 bg-slate-50/40 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                            <span>
                                Showing{" "}
                                <span className="font-semibold text-slate-800">
                                    {(safeDocPage - 1) * docPageSize + 1}
                                </span>{" "}
                                to{" "}
                                <span className="font-semibold text-slate-800">
                                    {Math.min(safeDocPage * docPageSize, totalDocs)}
                                </span>{" "}
                                of{" "}
                                <span className="font-semibold text-slate-800">
                                    {totalDocs}
                                </span>{" "}
                                documents
                            </span>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-slate-500">Per page:</span>
                                <select
                                    value={docPageSize}
                                    onChange={(e) => {
                                        setDocPageSize(Number(e.target.value));
                                        setDocPage(1);
                                    }}
                                    className="h-7 rounded-md border border-slate-200/90 bg-white px-1.5 text-xs text-slate-700 shadow-2xs focus:border-[#1B59F8] focus:outline-hidden"
                                >
                                    <option value={6}>6</option>
                                    <option value={12}>12</option>
                                    <option value={24}>24</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setDocPage((p) => Math.max(1, p - 1))}
                                    disabled={safeDocPage <= 1}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200/90 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    title="Previous page"
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                <span className="px-2 text-xs font-medium text-slate-700">
                                    {safeDocPage} / {totalDocPages}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setDocPage((p) => Math.min(totalDocPages, p + 1))}
                                    disabled={safeDocPage >= totalDocPages}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200/90 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    title="Next page"
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            <section className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1B59F8]">
                            <Archive size={16} />
                        </div>

                        <div>
                            <h2 className="text-xs font-bold text-slate-900">
                                Need another document?
                            </h2>

                            <p className="mt-0.5 max-w-xl text-[11px] leading-relaxed text-slate-500">
                                Request an invoice copy, licence certificate, agreement or installation document from the support team.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleUploadRequest}
                        className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-[#1B59F8]"
                    >
                        <Upload size={13} />
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
                        <div className="flex items-center justify-between border-b border-slate-200/90 px-5 py-3.5 sm:px-6">
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[#1B59F8]">
                                    Document Details
                                </p>

                                <h2 className="mt-0.5 truncate text-base font-bold text-slate-900">
                                    {selectedDocument.name}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedDocumentId(null)
                                }
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
                            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {(() => {
                                            const Icon = getDocumentIcon(selectedDocument);
                                            return (
                                                <div
                                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${getDocumentIconClasses(
                                                        selectedDocument
                                                    )}`}
                                                >
                                                    <Icon size={18} />
                                                </div>
                                            );
                                        })()}

                                        <div className="min-w-0">
                                            <h3 className="text-xs font-bold text-slate-900 truncate">
                                                {selectedDocument.name}
                                            </h3>

                                            <p className="mt-0.5 text-[11px] text-slate-500">
                                                {selectedDocument.documentType} · {bytesToSize(selectedDocument.size || 0)}
                                            </p>
                                        </div>
                                    </div>

                                    <StatusBadge
                                        status={selectedDocument.status}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2.5 sm:grid-cols-2">
                                <DetailItem
                                    label="Category"
                                    value={selectedDocument.category}
                                    icon={FolderOpen}
                                />

                                <DetailItem
                                    label="Product"
                                    value={selectedDocument.productName}
                                    icon={FileCheck2}
                                />

                                <DetailItem
                                    label="Uploaded On"
                                    value={formatDocumentDate(
                                        selectedDocument.uploadedAt ||
                                        selectedDocument.createdAt
                                    )}
                                    icon={CalendarDays}
                                />

                                <DetailItem
                                    label="Uploaded By"
                                    value={selectedDocument.uploadedByName}
                                    icon={UserRound}
                                />
                            </div>

                            <section className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                    Description
                                </h3>

                                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                                    {selectedDocument.description || "No detailed description available."}
                                </p>
                            </section>

                            <section className="flex min-h-[160px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4">
                                <div className="text-center">
                                    <FileText
                                        size={26}
                                        className="mx-auto text-slate-400"
                                    />

                                    <p className="mt-2 text-xs font-bold text-slate-800">
                                        Document Preview
                                    </p>

                                    <p className="mx-auto mt-0.5 max-w-sm text-[11px] leading-relaxed text-slate-500">
                                        Open this document securely in a new tab to view its contents.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handlePreviewDocument(
                                                selectedDocument
                                            )
                                        }
                                        className="mt-3 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] px-3.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-blue-700"
                                    >
                                        <Eye size={13} />
                                        Preview Document
                                    </button>
                                </div>
                            </section>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 border-t border-slate-200/90 p-4 sm:px-6">
                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedDocumentId(null)
                                }
                                className="h-8.5 px-4 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                Close
                            </button>

                            <button
                                type="button"
                                onClick={() => handleDownload(selectedDocument)}
                                className="flex h-8.5 items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] px-4 text-xs font-semibold text-white shadow-2xs transition hover:bg-blue-700"
                            >
                                <Download size={14} />
                                Download Document
                            </button>
                        </div>
                    </aside>
                </>
            )}
        </div>
    );
}