import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
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
  Layers,
  LifeBuoy,
  MonitorCog,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import API_URL from "../config/api";

function formatDisplayDate(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getSupportStatus(expiryDate) {
  if (!expiryDate) {
    return {
      status: "No AMC",
      label: "No Active AMC",
      daysLeft: null,
      badgeClass: "bg-slate-100 text-slate-700 ring-slate-500/20",
      dotClass: "bg-slate-400",
      textClass: "text-slate-600",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  if (Number.isNaN(expiry.getTime())) {
    return {
      status: "No AMC",
      label: "No Active AMC",
      daysLeft: null,
      badgeClass: "bg-slate-100 text-slate-700 ring-slate-500/20",
      dotClass: "bg-slate-400",
      textClass: "text-slate-600",
    };
  }

  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 30) {
    return {
      status: "Active Support",
      label: "Active Support",
      daysLeft: diffDays,
      badgeClass: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
      dotClass: "bg-emerald-500",
      textClass: "text-emerald-700",
    };
  }

  if (diffDays >= 0) {
    return {
      status: "Expiring Soon",
      label: diffDays === 0 ? "Expires Today" : `Expiring Soon (${diffDays}d left)`,
      daysLeft: diffDays,
      badgeClass: "bg-amber-50 text-amber-700 ring-amber-600/20",
      dotClass: "bg-amber-500",
      textClass: "text-amber-700",
    };
  }

  const daysAgo = Math.abs(diffDays);
  return {
    status: "Expired",
    label: `Expired ${daysAgo}d ago`,
    daysLeft: diffDays,
    badgeClass: "bg-rose-50 text-rose-700 ring-rose-600/20",
    dotClass: "bg-rose-500",
    textClass: "text-rose-700",
  };
}

function ProductStatusBadge({ status }) {
  const styles = {
    Active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    Installed: "bg-blue-50 text-blue-700 ring-blue-600/20",
    Expired: "bg-rose-50 text-rose-700 ring-rose-600/20",
    Suspended: "bg-amber-50 text-amber-700 ring-amber-600/20",
    Inactive: "bg-slate-100 text-slate-600 ring-slate-500/20",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${
        styles[status] || "bg-slate-100 text-slate-600 ring-slate-500/20"
      }`}
    >
      {status || "Active"}
    </span>
  );
}

function SupportBadge({ expiryDate }) {
  const info = getSupportStatus(expiryDate);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ring-inset ${info.badgeClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${info.dotClass}`} />
      {info.label}
    </span>
  );
}

function DetailItem({ label, value, icon: Icon, valueClass = "" }) {
  return (
    <div className="rounded-lg border border-slate-200/80 bg-slate-50/70 p-2.5 transition">
      <div className="flex items-center gap-1.5 text-slate-400">
        <Icon size={13} />
        <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
      </div>
      <p className={`mt-1 break-words text-xs font-semibold text-slate-800 ${valueClass}`}>
        {value || "—"}
      </p>
    </div>
  );
}

export default function MyProducts({ onNavigate }) {
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [documentOpen, setDocumentOpen] = useState(false);
  const [productRecords, setProductRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");
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
          id: product._id || product.productId || String(Math.random()),
          name: product.productName || "Unnamed Software",
          productCode: product.productCode || "",
          category: product.category || "Enterprise Software",
          description: product.notes || product.description || "",
          version: product.version || product.currentVersion || "v1.0.0",
          status: product.installationStatus === "Inactive" ? "Inactive" : "Active",
          installationStatus: product.installationStatus || "Installed",
          purchaseDate: product.purchaseDate || "",
          installationDate: product.installationDate || "",
          licenceType: product.licenceType || "Annual Licence",
          licenceKey: product.licenceKey || "",
          licensedUsers: Number(product.licensedUsers || 1),
          activeUsers: Number(product.activeUsers || 0),
          supportPlan: product.supportType || product.supportPlan || "Standard",
          amcExpiry: product.expiryDate || "",
          assignedEngineer:
            product.assignedEngineer ||
            product.assignedEmployeeName ||
            "Dedicated Support Desk",
          lastUpdated: product.updatedAt || product.createdAt || "",
          serverType: product.serverType || "",
          database: product.database || "",
          modules: Array.isArray(product.modules) ? product.modules : [],
          documents: Array.isArray(product.documents) ? product.documents : [],
        }))
      );
    } catch (err) {
      console.error("Load products error:", err);
      setError(err.message || "Failed to load product details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const search = searchValue.trim().toLowerCase();

    return productRecords.filter((product) => {
      const matchesSearch =
        !search ||
        [
          product.name,
          product.productCode,
          product.category,
          product.description,
          product.version,
          product.licenceType,
          product.assignedEngineer,
          ...(product.modules || []),
        ].some((val) => String(val || "").toLowerCase().includes(search));

      const supportInfo = getSupportStatus(product.amcExpiry);

      let matchesStatus = true;
      if (statusFilter === "Active Support") {
        matchesStatus = supportInfo.status === "Active Support";
      } else if (statusFilter === "Expiring Soon") {
        matchesStatus = supportInfo.status === "Expiring Soon";
      } else if (statusFilter === "Expired") {
        matchesStatus = supportInfo.status === "Expired";
      } else if (statusFilter === "Active Licence") {
        matchesStatus = product.status === "Active";
      }

      return matchesSearch && matchesStatus;
    });
  }, [searchValue, statusFilter, productRecords]);

  const selectedProduct =
    productRecords.find((product) => product.id === selectedProductId) || null;

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

  const handleDownloadDoc = async (doc) => {
    if (doc.downloadUrl || doc.url) {
      window.open(doc.downloadUrl || doc.url, "_blank");
      return;
    }
    // Navigate to documents section to find and download
    if (onNavigate) {
      onNavigate("documents");
    }
  };

  // KPI Calculations
  const totalProducts = productRecords.length;
  const activeLicences = productRecords.filter((p) => p.status === "Active").length;
  const totalSeats = productRecords.reduce(
    (sum, p) => sum + (Number(p.licensedUsers) || 0),
    0
  );
  const activeSupportCount = productRecords.filter(
    (p) => getSupportStatus(p.amcExpiry).status === "Active Support"
  ).length;

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <section className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1B59F8]">
              Software Licences
            </span>
            <span className="text-xs text-slate-400">Total Solution Portal</span>
          </div>
          <h1 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
            My Products & Licences
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 max-w-2xl">
            Review purchased enterprise software, user license capacities, active AMC support validity, and request technical assistance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate && onNavigate("tickets", { openCreateModal: true })}
          className="inline-flex h-8.5 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] px-3.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-blue-700 active:scale-98"
        >
          <LifeBuoy size={14} />
          Raise Support Ticket
        </button>
      </section>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Products
              </p>
              <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                {totalProducts}
              </p>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1B59F8]">
              <Box size={16} />
            </div>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500 truncate">
            Registered software solutions
          </p>
        </article>

        <article className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Active Licences
              </p>
              <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                {activeLicences}
              </p>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="mt-1.5 text-[11px] text-emerald-600 truncate font-medium">
            {activeLicences === totalProducts ? "All licences valid" : `${activeLicences} active licences`}
          </p>
        </article>

        <article className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Licensed Seats
              </p>
              <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                {totalSeats}
              </p>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Users size={16} />
            </div>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500 truncate">
            Authorized user licenses
          </p>
        </article>

        <article className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                AMC Support
              </p>
              <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                {activeSupportCount} Active
              </p>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <ShieldCheck size={16} />
            </div>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500 truncate">
            {activeSupportCount > 0 ? "Priority support active" : "Support renewal pending"}
          </p>
        </article>
      </section>

      {/* Main Products Grid & Search Strip */}
      <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs">
        <div className="flex flex-col gap-3 border-b border-slate-200/90 p-3.5 sm:px-4 sm:py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Purchased Solutions
            </h2>
            <p className="text-[11px] text-slate-400">
              Software deployments and maintenance coverage linked to your company
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-[220px]">
              <Search
                size={13}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search products..."
                className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-8 pr-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1B59F8] focus:bg-white focus:ring-1 focus:ring-[#1B59F8]/20"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none focus:border-[#1B59F8] focus:ring-1 focus:ring-[#1B59F8]/20"
            >
              <option value="All">All Coverage</option>
              <option value="Active Support">Active Support</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="p-4 grid gap-3.5 sm:grid-cols-2">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="animate-pulse rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-slate-200" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 w-32 rounded bg-slate-200" />
                    <div className="h-2.5 w-20 rounded bg-slate-200" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="h-10 rounded-lg bg-slate-200/70" />
                  <div className="h-10 rounded-lg bg-slate-200/70" />
                </div>
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
            <p className="text-sm font-bold text-slate-900">Failed to load products</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{error}</p>
            <button
              type="button"
              onClick={loadProducts}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              <RefreshCw size={12} />
              Try Again
            </button>
          </div>
        )}

        {/* Products Cards List */}
        {!loading && !error && (
          <div className="grid gap-3.5 p-3.5 sm:p-4 xl:grid-cols-2">
            {filteredProducts.map((product) => {
              const supportInfo = getSupportStatus(product.amcExpiry);

              return (
                <article
                  key={product.id}
                  className="flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs transition hover:border-blue-300"
                >
                  {/* Card Header */}
                  <div className="border-b border-slate-200/80 bg-slate-50/50 p-3.5 sm:px-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1B59F8]">
                          <Box size={18} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h3 className="text-xs font-bold text-slate-900 truncate">
                              {product.name}
                            </h3>
                            <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                              {product.version}
                            </span>
                          </div>
                          <p className="text-[10px] font-semibold text-[#1B59F8] mt-0.5">
                            {product.category}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <ProductStatusBadge status={product.status} />
                        <SupportBadge expiryDate={product.amcExpiry} />
                      </div>
                    </div>

                    {product.description && (
                      <p className="mt-2 text-[11px] leading-relaxed text-slate-500 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </div>

                  {/* Card Body Key Metrics */}
                  <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <DetailItem
                        label="Licence Type"
                        value={product.licenceType}
                        icon={KeyRound}
                      />

                      <DetailItem
                        label="Purchase Date"
                        value={formatDisplayDate(product.purchaseDate)}
                        icon={CalendarDays}
                      />

                      <DetailItem
                        label="Support Valid Until"
                        value={formatDisplayDate(product.amcExpiry)}
                        icon={Clock3}
                        valueClass={supportInfo.textClass}
                      />

                      <DetailItem
                        label="Licensed Seats"
                        value={`${product.licensedUsers} ${
                          product.licensedUsers === 1 ? "User" : "Users"
                        }`}
                        icon={Users}
                      />
                    </div>

                    {/* Enabled Modules Pills */}
                    {product.modules?.length > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          <Layers size={11} />
                          <span>Enabled Modules ({product.modules.length})</span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {product.modules.slice(0, 4).map((mod) => (
                            <span
                              key={mod}
                              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                            >
                              {mod}
                            </span>
                          ))}
                          {product.modules.length > 4 && (
                            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                              +{product.modules.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Quick Action Buttons */}
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => openProductDetails(product.id)}
                        className="flex h-8 flex-1 min-w-[100px] items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] px-2.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-blue-700"
                      >
                        <MonitorCog size={13} />
                        <span>View Details</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onNavigate &&
                          onNavigate("tickets", {
                            preselectedProduct: product.name,
                            openCreateModal: true,
                          })
                        }
                        className="flex h-8 flex-1 min-w-[100px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-[#1B59F8]"
                      >
                        <LifeBuoy size={13} />
                        <span>Get Support</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onNavigate && onNavigate("billing")}
                        className="flex h-8 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                        title="View AMC and Billing Information"
                      >
                        <ShieldCheck size={13} className="text-amber-600" />
                        <span className="hidden sm:inline">View AMC</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6">
                <div className="text-center">
                  <Search size={24} className="mx-auto text-slate-300" />
                  <p className="mt-2 text-xs font-bold text-slate-700">No product found</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Try searching with another product name or reset your filter.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Product Details Drawer */}
      {detailsOpen && selectedProduct && (
        <>
          <button
            type="button"
            aria-label="Close product details"
            onClick={closeProductDetails}
            className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-xs"
          />

          <aside className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-[620px] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200/90 px-5 py-3.5 sm:px-6">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#1B59F8]">
                  Product Specifications
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

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Product Card Snapshot in Drawer */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-[#1B59F8]">
                      <Box size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {selectedProduct.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {selectedProduct.category} · Version {selectedProduct.version}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <ProductStatusBadge status={selectedProduct.status} />
                    <SupportBadge expiryDate={selectedProduct.amcExpiry} />
                  </div>
                </div>
              </div>

              {/* Primary Business Details */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Licence & Support Information
                </p>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <DetailItem
                    label="Licence Type"
                    value={selectedProduct.licenceType}
                    icon={KeyRound}
                  />

                  <DetailItem
                    label="Support Plan"
                    value={selectedProduct.supportPlan}
                    icon={ShieldCheck}
                  />

                  <DetailItem
                    label="Purchase Date"
                    value={formatDisplayDate(selectedProduct.purchaseDate)}
                    icon={CalendarDays}
                  />

                  <DetailItem
                    label="Support Valid Until"
                    value={formatDisplayDate(selectedProduct.amcExpiry)}
                    icon={Clock3}
                    valueClass={getSupportStatus(selectedProduct.amcExpiry).textClass}
                  />

                  <DetailItem
                    label="Licensed Users"
                    value={`${selectedProduct.licensedUsers} Permitted`}
                    icon={Users}
                  />

                  <DetailItem
                    label="Installation Status"
                    value={selectedProduct.installationStatus}
                    icon={CheckCircle2}
                  />
                </div>
              </div>

              {/* Support Team contact */}
              <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Headphones size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Assigned Support Desk
                    </p>
                    <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                      {selectedProduct.assignedEngineer}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Available for configuration, bug fixing, and remote maintenance.
                    </p>
                  </div>
                </div>
              </div>

              {/* Licence Key if present */}
              {selectedProduct.licenceKey && (
                <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Product Licence Key
                  </p>
                  <p className="mt-1 break-all font-mono text-xs font-bold text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {selectedProduct.licenceKey}
                  </p>
                </div>
              )}

              {/* Enabled Modules */}
              {selectedProduct.modules?.length > 0 && (
                <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Enabled Software Modules ({selectedProduct.modules.length})
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedProduct.modules.map((mod) => (
                      <span
                        key={mod}
                        className="rounded-md border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                      >
                        {mod}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Documents Collapsible */}
              <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setDocumentOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Product Documents & Manuals
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Agreements, licence keys, and setup guides
                    </p>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform ${
                      documentOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {documentOpen && (
                  <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                    {selectedProduct.documents?.length > 0 ? (
                      selectedProduct.documents.map((doc, idx) => (
                        <div
                          key={doc.id || doc.name || idx}
                          className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-rose-500 border border-slate-200/80">
                            <FileText size={14} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-slate-800">
                              {doc.name || doc.title || "Document"}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {doc.type || "PDF Document"} {doc.size ? `· ${doc.size}` : ""}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDownloadDoc(doc)}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-[#1B59F8]"
                            title="Download document"
                          >
                            <Download size={13} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center">
                        <FileText size={20} className="mx-auto text-slate-300" />
                        <p className="mt-1 text-xs text-slate-500">
                          No product documents currently attached.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            closeProductDetails();
                            if (onNavigate) onNavigate("documents");
                          }}
                          className="mt-2 text-[11px] font-semibold text-[#1B59F8] hover:underline"
                        >
                          Browse Company Documents Archive →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="flex items-center justify-between gap-2.5 border-t border-slate-200/90 p-4 sm:px-6">
              <button
                type="button"
                onClick={() => {
                  closeProductDetails();
                  if (onNavigate) onNavigate("billing");
                }}
                className="h-8.5 px-3.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 transition hover:bg-slate-50 flex items-center gap-1.5"
              >
                <ShieldCheck size={14} className="text-amber-600" />
                <span>Check AMC</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeProductDetails}
                  className="h-8.5 px-3.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    closeProductDetails();
                    if (onNavigate) {
                      onNavigate("tickets", {
                        preselectedProduct: selectedProduct.name,
                        openCreateModal: true,
                      });
                    }
                  }}
                  className="flex h-8.5 items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] px-4 text-xs font-semibold text-white shadow-2xs transition hover:bg-blue-700"
                >
                  <Headphones size={14} />
                  <span>Get Support</span>
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}