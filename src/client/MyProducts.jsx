import { useEffect, useMemo, useState } from "react";
import {
    Box,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    Clock3,
    Download,
    FileText,
    Headphones,
    KeyRound,
    Laptop,
    LifeBuoy,
    MonitorCog,
    Search,
    ShieldCheck,
    Users,
    X,
} from "lucide-react";

import API_URL from "../config/api";

function StatusBadge({ status }) {
    const styles = {
        Active:
            "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
        Installed:
            "bg-blue-50 text-blue-700 ring-blue-600/10",
        Expired:
            "bg-rose-50 text-rose-700 ring-rose-600/10",
        Suspended:
            "bg-amber-50 text-amber-700 ring-amber-600/10",
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

function DetailItem({ label, value, icon: Icon, valueClass = "" }) {
    return (
        <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-2.5">
            <div className="flex items-center gap-1.5 text-slate-400">
                <Icon size={13} />

                <p className="text-[10px] font-bold uppercase tracking-wider">
                    {label}
                </p>
            </div>

            <p
                className={`mt-1 break-words text-xs font-bold text-slate-800 ${valueClass}`}
            >
                {value}
            </p>
        </div>
    );
}

export default function MyProducts({ onNavigate }) {
const [searchValue, setSearchValue] = useState("");
const [selectedProductId, setSelectedProductId] = useState(null);
const [detailsOpen, setDetailsOpen] = useState(false);
const [documentOpen, setDocumentOpen] = useState(false);
const [productRecords, setProductRecords] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
useEffect(() => {
  const loadProducts = async () => {
    try {
      const token =
        localStorage.getItem("client-connect-token") ||
        sessionStorage.getItem("client-connect-token");

      const response = await fetch(`${API_URL}/api/client/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load products.");
      }

     setProductRecords(
  (result.data.products || []).map((product) => ({
    id: product._id,
    name: product.productName,
    category: product.category || "Software",
    description: product.notes || product.description || "",
    version: product.version || product.currentVersion || "v1.0.0",
    status:
      product.installationStatus === "Inactive"
        ? "Inactive"
        : "Active",
    purchaseDate: product.purchaseDate || "",
    installationDate: product.installationDate || "",
    licenceType: product.licenceType || "Annual Licence",
    licenceKey: product.licenceKey || "",
    licensedUsers: product.licensedUsers || 0,
    activeUsers: product.activeUsers || 0,
    supportPlan: product.supportType || product.supportPlan || "",
    supportStatus: product.supportStatus || "Active",
   amcExpiry: product.expiryDate || "",
    assignedEngineer:
      product.assignedEngineer ||
      product.assignedEmployeeName ||
      "Support Team",
    lastUpdated: product.updatedAt || product.createdAt || "",
    installationStatus: product.installationStatus || "Installed",
    serverType: product.serverType || "",
    database: product.database || "",
    modules: product.modules || [],
    documents: product.documents || [],
  }))
);
    } catch (err) {
      console.error("Load products:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  loadProducts();
}, []);

  const filteredProducts = useMemo(() => {
  const search = searchValue.trim().toLowerCase();

  if (!search) {
    return productRecords;
  }

  return productRecords.filter((product) =>
    [
      product.name,
      product.category,
      product.description,
      product.version,
      product.supportPlan,
      product.assignedEngineer,
      ...(product.modules || []),
    ].some((value) =>
      String(value || "").toLowerCase().includes(search)
    )
  );
}, [searchValue, productRecords]);

    const selectedProduct =
        productRecords.find(
            (product) => product.id === selectedProductId
        ) || null;

    const openProductDetails = (productId) => {
        setSelectedProductId(productId);
        setDetailsOpen(true);
        setDocumentOpen(false);
    };

    const closeProductDetails = () => {
        setDetailsOpen(false);
        setSelectedProductId(null);
        setDocumentOpen(false);
    };

    const handleDownload = (documentName) => {
        alert(
            `${documentName} will download after the document API is connected.`
        );
    };
if (loading) {
  return (
    <div className="flex h-64 items-center justify-center text-sm text-slate-500">
      Loading products...
    </div>
  );
}

if (error) {
  return <div className="p-6 text-sm text-rose-600">{error}</div>;
}
    return (
        <div className="space-y-4">
            <section className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1B59F8]">
                            Software & Licences
                        </span>
                        <span className="text-xs text-slate-400">Total Solution Portal</span>
                    </div>

                    <h1 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
                        My Products
                    </h1>

                    <p className="mt-0.5 text-xs text-slate-500">
                        View your purchased software, licence information, installed modules, AMC coverage and support details.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => onNavigate("tickets")}
                    className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] px-3.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-blue-700"
                >
                    <LifeBuoy size={14} />
                    Raise Product Issue
                </button>
            </section>

            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <article className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Total Products
                            </p>

                            <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                                {productRecords.length}
                            </p>
                        </div>

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1B59F8]">
                            <Box size={16} />
                        </div>
                    </div>

                    <p className="mt-1.5 text-[11px] text-slate-500 truncate">
                        Software purchased by your company
                    </p>
                </article>

                <article className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Active Licences
                            </p>

                            <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                                {
                                    productRecords.filter(
                                        (product) =>
                                            product.status ===
                                            "Active"
                                    ).length
                                }
                            </p>
                        </div>

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                            <CheckCircle2 size={16} />
                        </div>
                    </div>

                    <p className="mt-1.5 text-[11px] text-emerald-600 truncate font-medium">
                        All software licences are active
                    </p>
                </article>

                <article className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Licensed Users
                            </p>

                            <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                                {productRecords.reduce(
                                    (total, product) =>
                                        total +
                                        Number(
                                            product.licensedUsers || 0
                                        ),
                                    0
                                )}
                            </p>
                        </div>

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                            <Users size={16} />
                        </div>
                    </div>

                    <p className="mt-1.5 text-[11px] text-slate-500 truncate">
                        Total users permitted across products
                    </p>
                </article>

                <article className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                AMC Coverage
                            </p>

                            <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                                Active
                            </p>
                        </div>

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                            <ShieldCheck size={16} />
                        </div>
                    </div>

                    <p className="mt-1.5 text-[11px] text-amber-600 truncate font-medium">
                        AMC coverage active
                    </p>
                </article>
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs">
                <div className="flex flex-col gap-3 border-b border-slate-200/90 p-3.5 sm:px-4 sm:py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                            Purchased Software
                        </h2>

                        <p className="text-[11px] text-slate-400">
                            Products currently linked to your client account
                        </p>
                    </div>

                    <div className="relative w-full sm:w-[260px]">
                        <Search
                            size={14}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="search"
                            value={searchValue}
                            onChange={(event) =>
                                setSearchValue(event.target.value)
                            }
                            placeholder="Search product or module..."
                            className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-8 pr-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1B59F8] focus:bg-white focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                </div>

                <div className="grid gap-3.5 p-3.5 sm:p-4 xl:grid-cols-2">
                    {filteredProducts.map((product) => (
                        <article
                            key={product.id}
                            className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs transition hover:border-blue-300"
                        >
                            <div className="border-b border-slate-200/90 bg-slate-50/50 p-3.5 sm:px-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-start gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1B59F8]">
                                            <Box size={18} />
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <h3 className="text-xs font-bold text-slate-900">
                                                    {product.name}
                                                </h3>

                                                <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                                                    {product.version}
                                                </span>
                                            </div>

                                            <p className="text-[10px] font-semibold text-[#1B59F8]">
                                                {product.category}
                                            </p>
                                        </div>
                                    </div>

                                    <StatusBadge
                                        status={product.status}
                                    />
                                </div>

                                {product.description && (
                                    <p className="mt-2 text-[11px] leading-relaxed text-slate-500 line-clamp-2">
                                        {product.description}
                                    </p>
                                )}
                            </div>

                            <div className="p-3.5 sm:p-4">
                                <div className="grid gap-2 sm:grid-cols-2">
                                    <DetailItem
                                        label="Purchase Date"
                                        value={product.purchaseDate || "—"}
                                        icon={CalendarDays}
                                    />

                                    <DetailItem
                                        label="AMC Expiry"
                                        value={product.amcExpiry || "—"}
                                        icon={Clock3}
                                        valueClass="text-amber-600"
                                    />

                                    <DetailItem
                                        label="Licensed Users"
                                        value={`${product.activeUsers} active of ${product.licensedUsers}`}
                                        icon={Users}
                                    />

                                    <DetailItem
                                        label="Support Engineer"
                                        value={product.assignedEngineer || "Support Team"}
                                        icon={Headphones}
                                    />
                                </div>

                                {product.modules?.length > 0 && (
                                    <div className="mt-3">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Enabled Modules
                                        </p>

                                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                                            {product.modules.map(
                                                (module) => (
                                                    <span
                                                        key={module}
                                                        className="rounded-md border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                                                    >
                                                        {module}
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-3.5 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            openProductDetails(
                                                product.id
                                            )
                                        }
                                        className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] px-3 text-xs font-semibold text-white shadow-2xs transition hover:bg-blue-700"
                                    >
                                        <MonitorCog size={14} />
                                        View Product Details
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            onNavigate("tickets")
                                        }
                                        className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-[#1B59F8]"
                                    >
                                        <LifeBuoy size={14} />
                                        Raise Issue
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}

                    {filteredProducts.length === 0 && (
                        <div className="col-span-full flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                            <div className="text-center">
                                <Search
                                    size={24}
                                    className="mx-auto text-slate-300"
                                />

                                <p className="mt-2 text-xs font-bold text-slate-700">
                                    No product found
                                </p>

                                <p className="mt-0.5 text-[11px] text-slate-400">
                                    Try searching with another product or module name.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {detailsOpen && selectedProduct && (
                <>
                    <button
                        type="button"
                        aria-label="Close product details"
                        onClick={closeProductDetails}
                        className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-sm"
                    />

                    <aside className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-[680px] flex-col bg-white shadow-[-20px_0_60px_rgba(15,23,42,0.18)]">
                        <div className="flex items-center justify-between border-b border-slate-200/90 px-5 py-3.5 sm:px-6">
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[#1B59F8]">
                                    Product Details
                                </p>

                                <h2 className="mt-0.5 truncate text-base font-bold text-slate-900">
                                    {selectedProduct.name}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={closeProductDetails}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
                            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-[#1B59F8]">
                                            <Box size={18} />
                                        </div>

                                        <div className="min-w-0">
                                            <h3 className="text-sm font-bold text-slate-900 truncate">
                                                {selectedProduct.name}
                                            </h3>

                                            <p className="mt-0.5 text-[11px] text-slate-500">
                                                {selectedProduct.category} · {selectedProduct.version}
                                            </p>
                                        </div>
                                    </div>

                                    <StatusBadge
                                        status={selectedProduct.status}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2.5 sm:grid-cols-2">
                                <DetailItem
                                    label="Purchase Date"
                                    value={
                                        selectedProduct.purchaseDate || "—"
                                    }
                                    icon={CalendarDays}
                                />

                                <DetailItem
                                    label="Installation Date"
                                    value={
                                        selectedProduct.installationDate || "—"
                                    }
                                    icon={Laptop}
                                />

                                <DetailItem
                                    label="Licence Type"
                                    value={
                                        selectedProduct.licenceType || "—"
                                    }
                                    icon={KeyRound}
                                />

                                <DetailItem
                                    label="Installation Status"
                                    value={
                                        selectedProduct.installationStatus || "Installed"
                                    }
                                    icon={CheckCircle2}
                                />

                                <DetailItem
                                    label="Server"
                                    value={selectedProduct.serverType || "—"}
                                    icon={MonitorCog}
                                />

                                <DetailItem
                                    label="Database"
                                    value={selectedProduct.database || "—"}
                                    icon={ShieldCheck}
                                />
                            </div>

                            <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                            Licence Information
                                        </p>

                                        <p className="text-[11px] text-slate-400">
                                            Software licence and user allocation
                                        </p>
                                    </div>

                                    <ShieldCheck
                                        size={16}
                                        className="text-emerald-600"
                                    />
                                </div>

                                {selectedProduct.licenceKey && (
                                    <div className="mt-3 rounded-lg bg-slate-50 p-3 border border-slate-200/80">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Licence Key
                                        </p>

                                        <p className="mt-1 break-all font-mono text-xs font-bold text-slate-800">
                                            {selectedProduct.licenceKey}
                                        </p>
                                    </div>
                                )}

                                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                                    <DetailItem
                                        label="Licensed Users"
                                        value={
                                            selectedProduct.licensedUsers
                                        }
                                        icon={Users}
                                    />

                                    <DetailItem
                                        label="Active Users"
                                        value={
                                            selectedProduct.activeUsers
                                        }
                                        icon={CheckCircle2}
                                    />
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setDocumentOpen(
                                            (current) => !current
                                        )
                                    }
                                    className="flex w-full items-center justify-between text-left"
                                >
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                            Product Documents
                                        </p>

                                        <p className="text-[11px] text-slate-400">
                                            Licence, AMC and installation files
                                        </p>
                                    </div>

                                    <ChevronDown
                                        size={16}
                                        className={`text-slate-400 transition ${
                                            documentOpen
                                                ? "rotate-180"
                                                : ""
                                        }`}
                                    />
                                </button>

                                {documentOpen && (
                                    <div className="mt-3 space-y-2">
                                        {selectedProduct.documents.map(
                                            (doc) => (
                                                <div
                                                    key={doc.id || doc.name}
                                                    className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5"
                                                >
                                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-rose-500 border border-slate-200/80">
                                                        <FileText
                                                            size={14}
                                                        />
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-xs font-semibold text-slate-800">
                                                            {doc.name}
                                                        </p>

                                                        <p className="text-[10px] text-slate-400">
                                                            {doc.type} · {doc.size}
                                                        </p>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDownload(
                                                                doc.name
                                                            )
                                                        }
                                                        className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-[#1B59F8]"
                                                    >
                                                        <Download
                                                            size={13}
                                                        />
                                                    </button>
                                                </div>
                                            )
                                        )}
                                        {(!selectedProduct.documents || selectedProduct.documents.length === 0) && (
                                            <p className="text-xs text-slate-400 py-2 text-center">No documents linked to this product.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 border-t border-slate-200/90 p-4 sm:px-6">
                            <button
                                type="button"
                                onClick={closeProductDetails}
                                className="h-8.5 px-4 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                Close
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    closeProductDetails();
                                    onNavigate("tickets");
                                }}
                                className="flex h-8.5 items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] px-4 text-xs font-semibold text-white shadow-2xs transition hover:bg-blue-700"
                            >
                                <Headphones size={14} />
                                Raise Support Ticket
                            </button>
                        </div>
                    </aside>
                </>
            )}
        </div>
    );
}