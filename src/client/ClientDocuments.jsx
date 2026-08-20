import { useEffect, useMemo, useState } from "react";
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
                    value={documents.length}
                    description="Files linked to your client account"
                    icon={FolderOpen}
                    iconClass="bg-cyan-100 text-cyan-700"
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
                    iconClass="bg-violet-100 text-violet-700"
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

                <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                    {filteredDocuments.map((document) => {
                        const Icon = getDocumentIcon(
                            document.documentType
                        );

                        return (
                            <article
                                key={document.id}
                                className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[0_14px_40px_rgba(15,23,42,0.08)]"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div
                                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${getDocumentIconClasses(
                                            document.documentType
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
                                        {document.productName}
                                    </p>

                                    <p className="mt-3 line-clamp-2 text-[10px] leading-5 text-slate-500">
                                        {document.description}
                                    </p>
                                </div>

                                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                                    <div>
                                        <p className="text-[9px] text-slate-400">
                                            {document.documentType} ·{" "}
                                            {bytesToSize(document.size || 0)}
                                        </p>

                                        <p className="mt-1 text-[9px] text-slate-500">
                                            {formatDocumentDate(
    document.uploadedAt ||
    document.createdAt
)}
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
                                            onClick={() => handleDownload(document)}
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
        document
    );
                                            return (
                                                <div
                                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl 
                                                        ${
                                                           getDocumentIconClasses(
    document
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
                                                    selectedDocument.documentType
                                                }{" "}
                                                ·{" "}
                                                {bytesToSize(selectedDocument.size || 0)}
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
                                        selectedDocument.productName
                                    }
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
                                    value={
                                        selectedDocument.uploadedByName
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

    <div className="px-6 text-center">

        <FileText
            size={32}
            className="mx-auto text-slate-300"
        />

        <p className="mt-3 text-sm font-semibold text-slate-700">
            Document Preview
        </p>

        <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500">
            Open this document securely in a new tab to view its contents.
        </p>

        <button
            type="button"
            onClick={() =>
                handlePreviewDocument(
                    selectedDocument
                )
            }
            className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 text-xs font-semibold text-white transition hover:bg-cyan-700"
        >
            <Eye size={15} />

            Preview Document
        </button>

    </div>

</section>
                        </div>

                        <div className="grid gap-3 border-t border-slate-200 p-5 sm:grid-cols-2 sm:px-6">
                            <button
                                type="button"
                                onClick={() => handleDownload(selectedDocument)}
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