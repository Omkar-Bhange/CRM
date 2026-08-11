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

const API_URL = "http://localhost:5000";

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
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 text-slate-400">
                <Icon size={15} />

                <p className="text-[9px] font-semibold uppercase tracking-[0.13em]">
                    {label}
                </p>
            </div>

            <p
                className={`mt-2 break-words text-xs font-semibold text-slate-800 ${valueClass}`}
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
        <div>
            <section className="flex flex-col gap-5 border-b border-slate-200 pb-7 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-600">
                        Software & Licences
                    </p>

                    <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
                        My Products
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                        View your purchased software, licence information,
                        installed modules, AMC coverage and support details.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => onNavigate("tickets")}
                    className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0f172a] px-4 text-xs font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-cyan-600"
                >
                    <LifeBuoy size={16} />
                    Raise Product Issue
                </button>
            </section>

            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Total Products
                            </p>

                            <p className="mt-2 text-2xl font-semibold text-slate-950">
                                {productRecords.length}
                            </p>
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                            <Box size={18} />
                        </div>
                    </div>

                    <p className="mt-4 text-[10px] text-slate-500">
                        Software purchased by your company
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Active Licences
                            </p>

                            <p className="mt-2 text-2xl font-semibold text-slate-950">
                                {
                                    productRecords.filter(
                                        (product) =>
                                            product.status ===
                                            "Active"
                                    ).length
                                }
                            </p>
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                            <CheckCircle2 size={18} />
                        </div>
                    </div>

                    <p className="mt-4 text-[10px] text-emerald-600">
                        All software licences are active
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Licensed Users
                            </p>

                            <p className="mt-2 text-2xl font-semibold text-slate-950">
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

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                            <Users size={18} />
                        </div>
                    </div>

                    <p className="mt-4 text-[10px] text-slate-500">
                        Total users permitted across products
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                AMC Coverage
                            </p>

                            <p className="mt-2 text-2xl font-semibold text-slate-950">
                                Active
                            </p>
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                            <ShieldCheck size={18} />
                        </div>
                    </div>

                    <p className="mt-4 text-[10px] text-amber-600">
                        Coverage available until 15 Jul 2026
                    </p>
                </div>
            </section>

            <section className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-950">
                            Purchased Software
                        </h2>

                        <p className="mt-1 text-[10px] text-slate-500">
                            Products currently linked to your client account
                        </p>
                    </div>

                    <div className="relative w-full sm:w-[300px]">
                        <Search
                            size={16}
                            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="search"
                            value={searchValue}
                            onChange={(event) =>
                                setSearchValue(event.target.value)
                            }
                            placeholder="Search product or module..."
                            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                        />
                    </div>
                </div>

                <div className="grid gap-5 p-5 xl:grid-cols-2">
                    {filteredProducts.map((product) => (
                        <article
                            key={product.id}
                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[0_14px_40px_rgba(15,23,42,0.08)]"
                        >
                            <div className="border-b border-slate-200 bg-gradient-to-r from-cyan-50/70 to-white p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex min-w-0 items-start gap-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                                            <Box size={22} />
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-base font-semibold text-slate-950">
                                                    {product.name}
                                                </h3>

                                                <span className="rounded-md bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-500">
                                                    {product.version}
                                                </span>
                                            </div>

                                            <p className="mt-1 text-[10px] font-medium text-cyan-700">
                                                {product.category}
                                            </p>
                                        </div>
                                    </div>

                                    <StatusBadge
                                        status={product.status}
                                    />
                                </div>

                                <p className="mt-4 text-xs leading-5 text-slate-500">
                                    {product.description}
                                </p>
                            </div>

                            <div className="p-5">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <DetailItem
                                        label="Purchase Date"
                                        value={product.purchaseDate}
                                        icon={CalendarDays}
                                    />

                                    <DetailItem
                                        label="AMC Expiry"
                                        value={product.amcExpiry}
                                        icon={Clock3}
                                        valueClass="text-amber-700"
                                    />

                                    <DetailItem
                                        label="Licensed Users"
                                        value={`${product.activeUsers} active of ${product.licensedUsers}`}
                                        icon={Users}
                                    />

                                    <DetailItem
                                        label="Support Engineer"
                                        value={product.assignedEngineer}
                                        icon={Headphones}
                                    />
                                </div>

                                <div className="mt-4">
                                    <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-400">
                                        Enabled Modules
                                    </p>

                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {product.modules.map(
                                            (module) => (
                                                <span
                                                    key={module}
                                                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[9px] font-semibold text-slate-600"
                                                >
                                                    {module}
                                                </span>
                                            )
                                        )}
                                    </div>
                                </div>

                                <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            openProductDetails(
                                                product.id
                                            )
                                        }
                                        className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0f172a] px-4 text-xs font-semibold text-white transition hover:bg-cyan-600"
                                    >
                                        <MonitorCog size={16} />
                                        View Product Details
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            onNavigate("tickets")
                                        }
                                        className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                                    >
                                        <LifeBuoy size={16} />
                                        Raise Issue
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}

                    {filteredProducts.length === 0 && (
                        <div className="col-span-full flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
                            <div className="text-center">
                                <Search
                                    size={26}
                                    className="mx-auto text-slate-300"
                                />

                                <p className="mt-3 text-sm font-semibold text-slate-700">
                                    No product found
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                    Try searching with another product or
                                    module name.
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
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
                            <div className="min-w-0">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-600">
                                    Product Details
                                </p>

                                <h2 className="mt-1 truncate text-lg font-semibold text-slate-950">
                                    {selectedProduct.name}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={closeProductDetails}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                            <div className="rounded-2xl border border-cyan-200 bg-gradient-to-r from-cyan-50 to-white p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                                            <Box size={22} />
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-950">
                                                {selectedProduct.name}
                                            </h3>

                                            <p className="mt-1 text-xs text-slate-500">
                                                {
                                                    selectedProduct.category
                                                }{" "}
                                                ·{" "}
                                                {
                                                    selectedProduct.version
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    <StatusBadge
                                        status={selectedProduct.status}
                                    />
                                </div>
                            </div>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                <DetailItem
                                    label="Purchase Date"
                                    value={
                                        selectedProduct.purchaseDate
                                    }
                                    icon={CalendarDays}
                                />

                                <DetailItem
                                    label="Installation Date"
                                    value={
                                        selectedProduct.installationDate
                                    }
                                    icon={Laptop}
                                />

                                <DetailItem
                                    label="Licence Type"
                                    value={
                                        selectedProduct.licenceType
                                    }
                                    icon={KeyRound}
                                />

                                <DetailItem
                                    label="Installation Status"
                                    value={
                                        selectedProduct.installationStatus
                                    }
                                    icon={CheckCircle2}
                                />

                                <DetailItem
                                    label="Server"
                                    value={selectedProduct.serverType}
                                    icon={MonitorCog}
                                />

                                <DetailItem
                                    label="Database"
                                    value={selectedProduct.database}
                                    icon={ShieldCheck}
                                />
                            </div>

                            <div className="mt-5 rounded-2xl border border-slate-200 p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-950">
                                            Licence Information
                                        </p>

                                        <p className="mt-1 text-[10px] text-slate-500">
                                            Software licence and user
                                            allocation
                                        </p>
                                    </div>

                                    <ShieldCheck
                                        size={18}
                                        className="text-emerald-600"
                                    />
                                </div>

                                <div className="mt-4 rounded-xl bg-slate-50 p-4">
                                    <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-400">
                                        Licence Key
                                    </p>

                                    <p className="mt-2 break-all font-mono text-xs font-semibold text-slate-800">
                                        {
                                            selectedProduct.licenceKey
                                        }
                                    </p>
                                </div>

                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
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

                            <div className="mt-5 rounded-2xl border border-slate-200 p-5">
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
                                        <p className="text-sm font-semibold text-slate-950">
                                            Product Documents
                                        </p>

                                        <p className="mt-1 text-[10px] text-slate-500">
                                            Licence, AMC and installation
                                            files
                                        </p>
                                    </div>

                                    <ChevronDown
                                        size={18}
                                        className={`text-slate-400 transition ${
                                            documentOpen
                                                ? "rotate-180"
                                                : ""
                                        }`}
                                    />
                                </button>

                                {documentOpen && (
                                    <div className="mt-4 space-y-3">
                                        {selectedProduct.documents.map(
                                            (document) => (
                                                <div
                                                    key={document.id}
                                                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
                                                >
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-rose-500">
                                                        <FileText
                                                            size={16}
                                                        />
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-xs font-semibold text-slate-800">
                                                            {
                                                                document.name
                                                            }
                                                        </p>

                                                        <p className="mt-0.5 text-[9px] text-slate-500">
                                                            {
                                                                document.type
                                                            }{" "}
                                                            ·{" "}
                                                            {
                                                                document.size
                                                            }
                                                        </p>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDownload(
                                                                document.name
                                                            )
                                                        }
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                                                    >
                                                        <Download
                                                            size={15}
                                                        />
                                                    </button>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-3 border-t border-slate-200 p-5 sm:grid-cols-2 sm:px-6">
                            <button
                                type="button"
                                onClick={() => {
                                    closeProductDetails();
                                    onNavigate("tickets");
                                }}
                                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0f172a] px-4 text-xs font-semibold text-white transition hover:bg-cyan-600"
                            >
                                <Headphones size={16} />
                                Raise Support Ticket
                            </button>

                            <button
                                type="button"
                                onClick={closeProductDetails}
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