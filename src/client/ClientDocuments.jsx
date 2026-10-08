import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Download,
  Eye,
  FileArchive,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Filter,
  Image,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
  CreditCard,
  Receipt,
  FileSignature,
  FileBox,
} from "lucide-react";
import API_URL from "../config/api";

function bytesToSize(bytes) {
  const value = Number(bytes || 0);
  if (!value || value <= 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    sizes.length - 1
  );
  return `${parseFloat((value / Math.pow(1024, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDocumentDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function sanitizeDocumentTitle(fileName, title) {
  if (title && title !== "Document") return title;
  if (!fileName) return "Document";
  // Strip timestamp prefixes e.g. 1729384729-file.pdf or 1729384729_file.pdf
  let clean = String(fileName).replace(/^\d{9,14}[-_]/, "");
  return clean || fileName;
}

function normalizeCategory(category, docType, name) {
  const text = `${category || ""} ${docType || ""} ${name || ""}`.toLowerCase();
  if (text.includes("invoice") || text.includes("bill")) return "Invoices";
  if (text.includes("receipt") || text.includes("payment")) return "Receipts";
  if (text.includes("amc") || text.includes("contract")) return "AMC / Contracts";
  if (text.includes("agreement") || text.includes("sla") || text.includes("nda")) return "Agreements";
  if (text.includes("quotation") || text.includes("proposal") || text.includes("estimate") || text.includes("purchase order")) return "Proposals";
  return "Other";
}

function getCategoryBadgeColor(cat) {
  switch (cat) {
    case "Invoices":
      return "bg-violet-50 text-violet-700 ring-violet-600/20";
    case "Receipts":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    case "AMC / Contracts":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";
    case "Agreements":
      return "bg-blue-50 text-blue-700 ring-blue-600/20";
    case "Proposals":
      return "bg-indigo-50 text-indigo-700 ring-indigo-600/20";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-500/20";
  }
}

function getFileIcon(mimeType, fileName) {
  const mime = String(mimeType || "").toLowerCase();
  const name = String(fileName || "").toLowerCase();

  if (mime.includes("image") || /\.(jpg|jpeg|png|webp|svg)$/i.test(name)) {
    return { icon: Image, color: "text-blue-600 bg-blue-50 border-blue-200" };
  }
  if (mime.includes("sheet") || /\.(xls|xlsx|csv)$/i.test(name)) {
    return { icon: FileSpreadsheet, color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
  }
  if (mime.includes("zip") || /\.(zip|rar|7z)$/i.test(name)) {
    return { icon: FileArchive, color: "text-purple-600 bg-purple-50 border-purple-200" };
  }
  return { icon: FileText, color: "text-rose-600 bg-rose-50 border-rose-200" };
}

function SummaryCard({ label, value, description, icon: Icon, iconClass }) {
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
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="mt-1.5 text-[11px] text-slate-500 truncate">
        {description}
      </p>
    </article>
  );
}

const CATEGORY_TABS = [
  "All",
  "Invoices",
  "Receipts",
  "AMC / Contracts",
  "Agreements",
  "Proposals",
  "Other",
];

export default function ClientDocuments({ onNavigate }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);

  const getAuthToken = () => {
    return (
      localStorage.getItem("client-connect-token") ||
      sessionStorage.getItem("client-connect-token") ||
      ""
    );
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError("");
      const token = getAuthToken();

      const response = await fetch(`${API_URL}/api/client/amc/documents`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load documents.");
      }

      const formatted = (result.data || []).map((doc) => {
        const cleanTitle = sanitizeDocumentTitle(doc.fileName, doc.name || doc.displayName);
        const clientCategory = normalizeCategory(doc.category, doc.documentType, doc.fileName);

        return {
          id: doc._id || doc.id,
          name: cleanTitle,
          fileName: doc.fileName || cleanTitle,
          documentType: doc.documentType || "Document",
          category: clientCategory,
          productName: doc.productName || "General",
          contractCode: doc.contractCode || "",
          mimeType: doc.mimeType || "",
          size: Number(doc.fileSize || doc.size || 0),
          uploadedAt: doc.uploadedAt || doc.createdAt,
          previewUrl: doc.previewUrl,
          downloadUrl: doc.downloadUrl,
        };
      });

      setDocuments(formatted);
    } catch (err) {
      console.error("Load documents error:", err);
      setError(err.message || "Unable to fetch client documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  // Filtered Documents
  const filteredDocuments = useMemo(() => {
    const search = searchValue.trim().toLowerCase();

    return documents.filter((doc) => {
      const matchesSearch =
        !search ||
        [
          doc.name,
          doc.fileName,
          doc.category,
          doc.documentType,
          doc.productName,
          doc.contractCode,
        ].some((val) => String(val || "").toLowerCase().includes(search));

      const matchesCat =
        selectedCategory === "All" || doc.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [documents, searchValue, selectedCategory]);

  // Paginated Documents
  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const paginatedDocs = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredDocuments.slice(start, start + pageSize);
  }, [filteredDocuments, safePage, pageSize]);

  // Download Action
  const handleDownload = async (doc) => {
    if (!doc?.id) return;

    try {
      setDownloadingId(doc.id);
      const token = getAuthToken();
      const endpoint = `${API_URL}/api/client/amc/document/${doc.id}/download`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Unable to download document from server.");
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = doc.fileName || doc.name || "document";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download error:", err);
      alert(err.message || "Could not download file.");
    } finally {
      setDownloadingId(null);
    }
  };

  // Preview Action
  const handlePreview = async (doc) => {
    try {
      setPreviewDoc(doc);
      setPreviewLoading(true);
      const token = getAuthToken();
      const endpoint = `${API_URL}/api/client/amc/document/${doc.id}/view`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Unable to preview document.");
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      setPreviewBlobUrl(blobUrl);
    } catch (err) {
      console.error("Preview error:", err);
      alert(err.message || "Failed to load document preview.");
      setPreviewDoc(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewBlobUrl) {
      window.URL.revokeObjectURL(previewBlobUrl);
    }
    setPreviewDoc(null);
    setPreviewBlobUrl("");
  };

  // Summary Metrics
  const totalCount = documents.length;
  const invoicesAndReceipts = documents.filter(
    (d) => d.category === "Invoices" || d.category === "Receipts"
  ).length;
  const amcAndContracts = documents.filter(
    (d) => d.category === "AMC / Contracts"
  ).length;
  const agreementsAndProposals = documents.filter(
    (d) => d.category === "Agreements" || d.category === "Proposals"
  ).length;

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <section className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1B59F8]">
              Document Vault
            </span>
            <span className="text-xs text-slate-400">Total Solution Portal</span>
          </div>
          <h1 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
            Documents & Agreements
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 max-w-2xl">
            Access official software invoices, payment receipts, AMC agreements, licence certificates, and proposals in one secure place.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate && onNavigate("billing")}
          className="inline-flex h-8.5 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
        >
          <CreditCard size={14} className="text-[#1B59F8]" />
          <span>View Invoices & AMC</span>
        </button>
      </section>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard
          label="Total Files"
          value={totalCount}
          description="Stored in your account"
          icon={FileBox}
          iconClass="bg-blue-50 text-[#1B59F8]"
        />

        <SummaryCard
          label="Invoices & Receipts"
          value={invoicesAndReceipts}
          description="Billing & payment records"
          icon={Receipt}
          iconClass="bg-emerald-50 text-emerald-700"
        />

        <SummaryCard
          label="AMC / Contracts"
          value={amcAndContracts}
          description="Support renewal agreements"
          icon={ShieldCheck}
          iconClass="bg-amber-50 text-amber-700"
        />

        <SummaryCard
          label="Proposals & Deals"
          value={agreementsAndProposals}
          description="Service terms & quotations"
          icon={FileSignature}
          iconClass="bg-indigo-50 text-indigo-700"
        />
      </section>

      {/* Main Documents Table Card */}
      <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs">
        {/* Category Tabs & Search Bar */}
        <div className="flex flex-col gap-3 border-b border-slate-200/90 p-3.5 sm:px-4 sm:py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {CATEGORY_TABS.map((cat) => {
                const active = selectedCategory === cat;
                const count =
                  cat === "All"
                    ? documents.length
                    : documents.filter((d) => d.category === cat).length;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setPage(1);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      active
                        ? "bg-[#1B59F8] text-white shadow-2xs"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span>{cat}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                        active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-[240px] shrink-0">
              <Search
                size={13}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by file or product..."
                className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-8 pr-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1B59F8] focus:bg-white focus:ring-1 focus:ring-[#1B59F8]/20"
              />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="animate-pulse rounded-lg border border-slate-200/80 p-3.5 bg-slate-50/50 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-8 w-8 rounded-lg bg-slate-200" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 w-48 rounded bg-slate-200" />
                    <div className="h-2.5 w-24 rounded bg-slate-200" />
                  </div>
                </div>
                <div className="h-7 w-24 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600 mb-2">
              <AlertTriangle size={20} />
            </div>
            <p className="text-sm font-bold text-slate-900">Failed to load documents</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{error}</p>
            <button
              type="button"
              onClick={loadDocuments}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              <RefreshCw size={12} />
              Try Again
            </button>
          </div>
        )}

        {/* Documents Table / Card List */}
        {!loading && !error && (
          <div className="divide-y divide-slate-100">
            {paginatedDocs.map((doc) => {
              const fileStyle = getFileIcon(doc.mimeType, doc.fileName);
              const Icon = fileStyle.icon;
              const isDownloading = downloadingId === doc.id;

              return (
                <div
                  key={doc.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 sm:px-4 gap-3 hover:bg-slate-50/60 transition"
                >
                  {/* File Info */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${fileStyle.color}`}
                    >
                      <Icon size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {doc.name}
                        </h3>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.2 text-[10px] font-bold ring-1 ring-inset ${getCategoryBadgeColor(
                            doc.category
                          )}`}
                        >
                          {doc.category}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                        <span className="font-medium text-slate-600">
                          {doc.productName}
                        </span>
                        <span>·</span>
                        <span>{formatDocumentDate(doc.uploadedAt)}</span>
                        <span>·</span>
                        <span>{bytesToSize(doc.size)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handlePreview(doc)}
                      className="inline-flex h-7 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:text-[#1B59F8]"
                      title="Preview document"
                    >
                      <Eye size={13} />
                      <span>View</span>
                    </button>

                    <button
                      type="button"
                      disabled={isDownloading}
                      onClick={() => handleDownload(doc)}
                      className="inline-flex h-7 items-center justify-center gap-1 rounded-lg bg-[#1B59F8] px-2.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-blue-700 disabled:opacity-50"
                      title="Download file"
                    >
                      <Download size={13} />
                      <span>{isDownloading ? "Downloading..." : "Download"}</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Empty State */}
            {filteredDocuments.length === 0 && (
              <div className="flex min-h-[220px] flex-col items-center justify-center p-8 text-center">
                <FileText size={24} className="text-slate-300 mb-2" />
                <h3 className="text-xs font-bold text-slate-700">
                  {searchValue || selectedCategory !== "All"
                    ? "No documents match your filter"
                    : "No Documents Available"}
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-400 max-w-sm">
                  {searchValue || selectedCategory !== "All"
                    ? "Try clearing your search keyword or selecting a different category."
                    : "Official documents uploaded by your account manager will appear here."}
                </p>
                {(searchValue || selectedCategory !== "All") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchValue("");
                      setSelectedCategory("All");
                    }}
                    className="mt-3 text-xs font-semibold text-[#1B59F8] hover:underline"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Pagination Strip */}
        {filteredDocuments.length > pageSize && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500 bg-slate-50/50">
            <span>
              Showing {(safePage - 1) * pageSize + 1} to{" "}
              {Math.min(safePage * pageSize, filteredDocuments.length)} of{" "}
              {filteredDocuments.length} files
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7 px-2.5 rounded border border-slate-200 bg-white font-medium disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-2 font-bold text-slate-700">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-7 px-2.5 rounded border border-slate-200 bg-white font-medium disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close preview"
            onClick={closePreview}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 bg-slate-50">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  {previewDoc.name}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {previewDoc.category} · {bytesToSize(previewDoc.size)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload(previewDoc)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#1B59F8] px-3 text-xs font-semibold text-white shadow-2xs hover:bg-blue-700 transition"
                >
                  <Download size={13} />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={closePreview}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[350px] bg-slate-100/50">
              {previewLoading && (
                <div className="flex flex-col items-center gap-2 text-xs text-slate-500">
                  <RefreshCw size={20} className="animate-spin text-[#1B59F8]" />
                  <span>Loading preview...</span>
                </div>
              )}

              {!previewLoading && previewBlobUrl && (
                <>
                  {previewDoc.mimeType?.includes("image") ||
                  /\.(jpg|jpeg|png|webp|svg)$/i.test(previewDoc.fileName) ? (
                    <img
                      src={previewBlobUrl}
                      alt={previewDoc.name}
                      className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-xs"
                    />
                  ) : previewDoc.mimeType?.includes("pdf") ||
                    /\.pdf$/i.test(previewDoc.fileName) ? (
                    <iframe
                      src={previewBlobUrl}
                      title={previewDoc.name}
                      className="h-[70vh] w-full rounded-lg border border-slate-200"
                    />
                  ) : (
                    <div className="text-center p-6">
                      <FileText size={40} className="mx-auto text-slate-400 mb-2" />
                      <p className="text-sm font-bold text-slate-800">
                        Inline preview not available for this file format
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Please click Download to view this file on your device.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleDownload(previewDoc)}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#1B59F8] px-3.5 py-1.5 text-xs font-semibold text-white"
                      >
                        <Download size={13} />
                        Download File
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}