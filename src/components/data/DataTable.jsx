import { useState, useMemo, useRef, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  MoreHorizontal,
  Inbox,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
  Plus,
  Download,
  Trash2,
  X,
  Check,
  LayoutList,
  LayoutGrid,
  Table as TableIcon,
  CheckSquare,
  Square,
  RotateCcw,
  ArrowUpDown,
  Layers,
  HelpCircle,
} from "lucide-react";

export default function DataTable({
  // Core Data & Columns
  columns = [],
  data = [],
  loading = false,
  error = null,
  onRetry,
  idKey = "_id",

  // Zoho Module & View Header Props
  moduleName = "Records",
  viewTitle = "",
  views = [],
  activeView = "all",
  onViewChange,
  onCreateClick,
  createButtonLabel = "",
  onCreateDropdownItems = [],
  headerActions = null,
  moreActions = [],

  // Search & Filter Props
  searchPlaceholder = "Search records...",
  searchKey = "",
  customSearch,
  statusFilters = [],
  activeStatusFilter = "",
  onStatusFilterChange,
  systemFilters = [],
  fieldFilters = [],
  defaultFilterOpen = false,

  // Selection & Batch Actions
  selectable = false,
  selectedIds = [],
  onSelectRow,
  onSelectAll,
  batchActions = [],

  // View Modes (List, Cards/Kanban, Sheet)
  viewMode = "list",
  onViewModeChange,
  showViewModes = true,

  // Row Interactions
  rowActions = [],
  onRowClick,

  // Pagination
  initialPageSize = 25,
  pageSizeOptions = [10, 25, 50, 100],

  // Empty State & Toolbar
  emptyTitle = "No records found",
  emptyDescription = "There are no records matching your current filter criteria.",
  toolbarActions,
}) {
  // Search & Sorting States
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc"); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Zoho UI State
  const [filterPanelOpen, setFilterPanelOpen] = useState(defaultFilterOpen);
  const [filterSearchTerm, setFilterSearchTerm] = useState("");
  const [selectedSystemFilters, setSelectedSystemFilters] = useState([]);
  const [selectedFieldFilters, setSelectedFieldFilters] = useState({});

  // Dropdown States
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [createSplitOpen, setCreateSplitOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [columnCustomizerOpen, setColumnCustomizerOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [internalViewMode, setInternalViewMode] = useState(viewMode);

  // Column Visibility
  const [visibleColumns, setVisibleColumns] = useState(() =>
    columns.map((c) => c.key)
  );

  // Update visible columns if columns change
  useEffect(() => {
    setVisibleColumns((prev) => {
      const keys = columns.map((c) => c.key);
      if (prev.length === 0) return keys;
      return keys.filter((k) => prev.includes(k) || !columns.some((c) => c.key === k));
    });
  }, [columns]);

  // Dropdown Refs
  const viewRef = useRef(null);
  const createSplitRef = useRef(null);
  const moreRef = useRef(null);
  const sortRef = useRef(null);
  const colCustomRef = useRef(null);
  const statusDropdownRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (viewRef.current && !viewRef.current.contains(e.target)) setViewMenuOpen(false);
      if (createSplitRef.current && !createSplitRef.current.contains(e.target)) setCreateSplitOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreMenuOpen(false);
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortMenuOpen(false);
      if (colCustomRef.current && !colCustomRef.current.contains(e.target)) setColumnCustomizerOpen(false);
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) setStatusDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sorting Handler
  const handleSort = (colKey) => {
    if (sortColumn === colKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(colKey);
      setSortDirection("asc");
    }
  };

  // Toggle System Filter
  const toggleSystemFilter = (id) => {
    setSelectedSystemFilters((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
    setCurrentPage(1);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedSystemFilters([]);
    setSelectedFieldFilters({});
    if (onStatusFilterChange) onStatusFilterChange("");
    setCurrentPage(1);
  };

  const activeFilterCount =
    (searchTerm ? 1 : 0) +
    selectedSystemFilters.length +
    Object.keys(selectedFieldFilters).length +
    (activeStatusFilter ? 1 : 0);

  // Filter & Search Logic
  const filteredData = useMemo(() => {
    let result = Array.isArray(data) ? [...data] : [];

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      if (typeof customSearch === "function") {
        result = result.filter((item) => customSearch(item, q));
      } else if (searchKey) {
        result = result.filter((item) =>
          String(item[searchKey] || "")
            .toLowerCase()
            .includes(q)
        );
      } else {
        result = result.filter((item) =>
          Object.values(item).some((val) =>
            String(val || "")
              .toLowerCase()
              .includes(q)
          )
        );
      }
    }

    // System defined filters
    if (selectedSystemFilters.length > 0) {
      if (selectedSystemFilters.includes("active")) {
        result = result.filter(
          (item) =>
            item.status === "Active" ||
            item.status === "active" ||
            item.isActive === true
        );
      }
      if (selectedSystemFilters.includes("untouched")) {
        result = result.filter(
          (item) => !item.lastContactedAt && !item.updatedAt
        );
      }
      if (selectedSystemFilters.includes("overdue")) {
        result = result.filter(
          (item) => item.isOverdue || item.paymentStatus === "Overdue"
        );
      }
    }

    // Sorting
    if (sortColumn) {
      result.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];

        if (valA == null) return 1;
        if (valB == null) return -1;

        let comp = 0;
        if (typeof valA === "number" && typeof valB === "number") {
          comp = valA - valB;
        } else if (valA instanceof Date || !isNaN(Date.parse(valA))) {
          comp = new Date(valA).getTime() - new Date(valB).getTime();
        } else {
          comp = String(valA).localeCompare(String(valB));
        }

        return sortDirection === "asc" ? comp : -comp;
      });
    }

    return result;
  }, [
    data,
    searchTerm,
    searchKey,
    customSearch,
    sortColumn,
    sortDirection,
    selectedSystemFilters,
  ]);

  // Pagination Calculations
  const totalRecords = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const validPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, validPage, pageSize]);

  const [internalSelectedIds, setInternalSelectedIds] = useState([]);
  const effectiveSelectedIds = onSelectRow ? selectedIds : internalSelectedIds;

  const handleSelectRow = (id, checked) => {
    if (onSelectRow) {
      onSelectRow(id, checked);
    } else {
      setInternalSelectedIds((prev) =>
        checked ? [...prev, id] : prev.filter((item) => item !== id)
      );
    }
  };

  const handleSelectAll = (checked, pageIds) => {
    if (onSelectAll) {
      onSelectAll(checked, pageIds);
    } else {
      setInternalSelectedIds((prev) => {
        if (!checked) {
          return prev.filter((id) => !pageIds.includes(id));
        }
        return Array.from(new Set([...prev, ...pageIds]));
      });
    }
  };

  const allSelectedOnPage =
    paginatedData.length > 0 &&
    paginatedData.every((item) => effectiveSelectedIds.includes(item[idKey]));

  // Active columns to render
  const renderedColumns = useMemo(() => {
    return columns.filter((col) => visibleColumns.includes(col.key));
  }, [columns, visibleColumns]);

  // Active view label
  const currentViewLabel =
    viewTitle ||
    views.find((v) => v.id === activeView)?.label ||
    `All ${moduleName}`;

  // Default system filters if none passed
  const activeSystemFiltersList =
    systemFilters.length > 0
      ? systemFilters
      : [
          { id: "active", label: "Active Records" },
          { id: "untouched", label: "Untouched Records" },
          { id: "overdue", label: "Overdue / Attention Needed" },
        ];

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      {/* 1. Zoho Module Sub-Header - Linear Single-Line Precision */}
      <div className="flex items-center justify-between gap-2.5 border-b border-slate-200 bg-white px-3 sm:px-4 min-h-[48px] select-none flex-nowrap overflow-x-auto custom-scrollbar">
        {/* Left: View Selector & View Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* View Selector Dropdown */}
          <div className="relative" ref={viewRef}>
            <button
              type="button"
              onClick={() => setViewMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-bold text-slate-900 hover:bg-slate-100 transition tracking-tight"
            >
              <span>{currentViewLabel}</span>
              <ChevronDown size={14} className="text-slate-500 shrink-0" />
            </button>

            {viewMenuOpen && (
              <div className="absolute left-0 mt-1.5 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    System & Custom Views
                  </span>
                  <span className="text-[10px] text-slate-400">Zoho Views</span>
                </div>
                <div className="py-1 space-y-0.5 max-h-60 overflow-y-auto">
                  {(views.length > 0
                    ? views
                    : [
                        { id: "all", label: `All ${moduleName}` },
                        { id: "active", label: `Active ${moduleName}` },
                        { id: "my", label: `My ${moduleName}` },
                      ]
                  ).map((v) => {
                    const isSelected = activeView === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setViewMenuOpen(false);
                          if (onViewChange) onViewChange(v.id);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                          isSelected
                            ? "bg-blue-50 text-blue-700 font-bold"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>{v.label}</span>
                        {isSelected && <Check size={14} className="text-blue-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setFilterPanelOpen((prev) => !prev)}
            title="Toggle Filter Panel"
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
              filterPanelOpen || activeFilterCount > 0
                ? "border-blue-300 bg-blue-50/80 text-blue-700 shadow-2xs"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Filter size={13} className={filterPanelOpen ? "text-blue-600" : "text-slate-500"} />
            <span className="hidden sm:inline">Filter</span>
            {activeFilterCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort Menu Button */}
          <div className="relative" ref={sortRef}>
            <button
              type="button"
              onClick={() => setSortMenuOpen((prev) => !prev)}
              title="Sort Records"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              <ArrowUpDown size={13} className="text-slate-500" />
              <span className="hidden md:inline">Sort</span>
            </button>

            {sortMenuOpen && (
              <div className="absolute left-0 mt-1.5 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2 py-1 text-[11px] font-bold text-slate-400 border-b border-slate-100">
                  Sort By Column
                </div>
                <div className="py-1 max-h-48 overflow-y-auto space-y-0.5">
                  {columns
                    .filter((c) => c.sortable !== false)
                    .map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => {
                          handleSort(c.key);
                          setSortMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs ${
                          sortColumn === c.key
                            ? "bg-blue-50 text-blue-700 font-bold"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>{c.label}</span>
                        {sortColumn === c.key && (
                          <span className="text-[10px] uppercase font-semibold text-blue-600">
                            {sortDirection}
                          </span>
                        )}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* View Modes Switcher: List, Cards, Sheet */}
          {showViewModes && (
            <div className="hidden lg:flex items-center rounded-lg border border-slate-200 bg-slate-50/80 p-0.5">
              <button
                type="button"
                onClick={() => {
                  setInternalViewMode("list");
                  if (onViewModeChange) onViewModeChange("list");
                }}
                title="Tabular List View"
                className={`flex h-6 w-7 items-center justify-center rounded-md text-xs transition ${
                  internalViewMode === "list"
                    ? "bg-white text-blue-700 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <LayoutList size={13} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setInternalViewMode("kanban");
                  if (onViewModeChange) onViewModeChange("kanban");
                }}
                title="Kanban / Cards View"
                className={`flex h-6 w-7 items-center justify-center rounded-md text-xs transition ${
                  internalViewMode === "kanban"
                    ? "bg-white text-blue-700 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <LayoutGrid size={13} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setInternalViewMode("sheet");
                  if (onViewModeChange) onViewModeChange("sheet");
                }}
                title="Sheet View"
                className={`flex h-6 w-7 items-center justify-center rounded-md text-xs transition ${
                  internalViewMode === "sheet"
                    ? "bg-white text-blue-700 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <TableIcon size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Right: Quick Search, Status Dropdown/Pills, Custom Actions, Split Create CTA, and More Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Search */}
          <div className="relative w-32 sm:w-44 md:w-52">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/80 pl-8 pr-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Quick Status Filter: Dropdown if > 4, else Pills */}
          {statusFilters && statusFilters.length > 0 && (
            statusFilters.length > 4 ? (
              <div className="relative" ref={statusDropdownRef}>
                <button
                  type="button"
                  onClick={() => setStatusDropdownOpen((prev) => !prev)}
                  className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition ${
                    activeStatusFilter && activeStatusFilter !== "All" && activeStatusFilter !== "all"
                      ? "border-blue-300 bg-blue-50/80 text-blue-700 shadow-2xs"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  title="Filter by Status"
                >
                  <span className="text-slate-400 font-normal">Status:</span>
                  <span className="max-w-[120px] truncate font-bold">
                    {(() => {
                      const matched = statusFilters.find(
                        (opt) => (typeof opt === "string" ? opt : opt.value) === activeStatusFilter
                      );
                      return matched ? (typeof matched === "string" ? matched : matched.label) : activeStatusFilter || "All";
                    })()}
                  </span>
                  <ChevronDown size={13} className="text-slate-400 shrink-0" />
                </button>

                {statusDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2.5 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                      Filter by Status
                    </div>
                    <div className="py-0.5 max-h-60 overflow-y-auto space-y-0.5 custom-scrollbar">
                      {statusFilters.map((opt) => {
                        const label = typeof opt === "string" ? opt : opt.label;
                        const val = typeof opt === "string" ? opt : opt.value;
                        const isSelected = activeStatusFilter === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => {
                              setStatusDropdownOpen(false);
                              if (onStatusFilterChange) onStatusFilterChange(val);
                              setCurrentPage(1);
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                              isSelected
                                ? "bg-blue-50 text-blue-700 font-bold"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <span className="truncate">{label}</span>
                            {isSelected && <Check size={14} className="text-blue-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-1">
                {statusFilters.map((opt) => {
                  const label = typeof opt === "string" ? opt : opt.label;
                  const val = typeof opt === "string" ? opt : opt.value;
                  const isSelected = activeStatusFilter === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        if (onStatusFilterChange) onStatusFilterChange(val);
                        setCurrentPage(1);
                      }}
                      className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )
          )}

          {/* Custom Header Actions */}
          {headerActions}
          {toolbarActions}

          {/* Zoho Split Primary Button [ + Create [Entity] | ▾ ] */}
          {onCreateClick && (
            <div className="relative inline-flex rounded-lg shadow-xs" ref={createSplitRef}>
              <button
                type="button"
                onClick={onCreateClick}
                className="inline-flex items-center gap-1.5 rounded-l-lg bg-[#1B59F8] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1548D1] active:bg-[#0F3DB8] transition"
              >
                <Plus size={14} strokeWidth={2.5} />
                <span className="hidden sm:inline">
                  {createButtonLabel || `Create ${moduleName.replace(/s$/, "")}`}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setCreateSplitOpen((prev) => !prev)}
                title="More creation options"
                aria-label="More creation options"
                className="inline-flex items-center rounded-r-lg border-l border-blue-400/40 bg-[#1B59F8] px-1.5 py-1.5 text-xs text-white hover:bg-[#1548D1] active:bg-[#0F3DB8] transition"
              >
                <ChevronDown size={13} />
              </button>

              {createSplitOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/10 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateSplitOpen(false);
                      onCreateClick();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 text-left"
                  >
                    <Plus size={13} className="text-blue-600" />
                    <span>Create {moduleName.replace(/s$/, "")}</span>
                  </button>
                  {onCreateDropdownItems.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCreateSplitOpen(false);
                        item.onClick();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 text-left"
                    >
                      {item.icon ? <item.icon size={13} className="text-slate-400" /> : null}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* More Actions [ ... ] Button */}
          <div className="relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreMenuOpen((prev) => !prev)}
              title="More Actions"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
            >
              <MoreHorizontal size={15} />
            </button>

            {moreMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-52 rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/10 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    // Export CSV
                    if (filteredData.length > 0) {
                      const csvHeader = renderedColumns.map((c) => `"${c.label}"`).join(",");
                      const csvRows = filteredData.map((row) =>
                        renderedColumns
                          .map((c) => `"${String(row[c.key] ?? "").replace(/"/g, '""')}"`)
                          .join(",")
                      );
                      const blob = new Blob([csvHeader + "\n" + csvRows.join("\n")], {
                        type: "text/csv;charset=utf-8;",
                      });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.setAttribute("href", url);
                      link.setAttribute("download", `${moduleName.toLowerCase()}_export.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <Download size={13} className="text-slate-400" />
                  <span>Export to CSV</span>
                </button>

                {onRetry && (
                  <button
                    type="button"
                    onClick={() => {
                      setMoreMenuOpen(false);
                      onRetry();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <RefreshCw size={13} className="text-slate-400" />
                    <span>Refresh Records</span>
                  </button>
                )}

                {moreActions.map((act, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setMoreMenuOpen(false);
                      act.onClick();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    {act.icon && <act.icon size={13} className="text-slate-400" />}
                    <span>{act.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Work Area: Side-by-Side Filter Panel + Data Grid */}
      <div className="flex w-full min-h-[400px] relative overflow-hidden">
        {/* Left Side-by-Side Collapsible Filter Panel (Zoho CRM standard) */}
        {filterPanelOpen && (
          <aside
            aria-label="Filter module records"
            className="w-64 sm:w-72 shrink-0 border-r border-slate-200 bg-[#fbfcfd] p-3 flex flex-col justify-between animate-in slide-in-from-left-2 duration-150 select-none z-10"
          >
            <div>
              {/* Filter Panel Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-900">
                  Filter {moduleName} by
                </span>
                <div className="flex items-center gap-1">
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setFilterPanelOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Filter Search Input */}
              <div className="relative mt-2.5 mb-3">
                <Search
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={filterSearchTerm}
                  onChange={(e) => setFilterSearchTerm(e.target.value)}
                  placeholder="Search filter criteria..."
                  className="h-7 w-full rounded-md border border-slate-200 bg-white pl-7 pr-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              {/* System Defined Filters Accordion */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  <span>System Defined Filters</span>
                </div>
                <div className="space-y-1.5">
                  {activeSystemFiltersList
                    .filter((sf) =>
                      sf.label.toLowerCase().includes(filterSearchTerm.toLowerCase())
                    )
                    .map((sf) => {
                      const isChecked = selectedSystemFilters.includes(sf.id);
                      return (
                        <label
                          key={sf.id}
                          className="flex items-center gap-2 cursor-pointer rounded-md p-1 hover:bg-slate-100 transition text-xs text-slate-700 font-medium"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSystemFilter(sf.id)}
                            className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="truncate">{sf.label}</span>
                        </label>
                      );
                    })}
                </div>
              </div>

              {/* Filter By Fields Accordion */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  <span>Filter By Fields</span>
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {columns
                    .filter((col) => col.key && col.label)
                    .filter((col) =>
                      col.label.toLowerCase().includes(filterSearchTerm.toLowerCase())
                    )
                    .map((col) => (
                      <label
                        key={col.key}
                        className="flex items-center gap-2 cursor-pointer rounded-md p-1 hover:bg-slate-100 transition text-xs text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(selectedFieldFilters[col.key])}
                          onChange={(e) => {
                            setSelectedFieldFilters((prev) => {
                              const next = { ...prev };
                              if (e.target.checked) next[col.key] = true;
                              else delete next[col.key];
                              return next;
                            });
                          }}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="truncate">{col.label}</span>
                      </label>
                    ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-200 mt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={() => setFilterPanelOpen(false)}
                className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 shadow-2xs"
              >
                Apply
              </button>
            </div>
          </aside>
        )}

        {/* Right Data Grid Area */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          {/* Zoho Floating Batch Action Bar (when rows are selected) */}
          {selectable && effectiveSelectedIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200 bg-blue-50/90 px-3 sm:px-4 py-2 text-xs text-blue-900 animate-in slide-in-from-top-1 duration-150">
              <div className="flex items-center gap-2.5">
                <span className="font-bold flex items-center gap-1.5">
                  <CheckSquare size={14} className="text-blue-600" />
                  {effectiveSelectedIds.length} {effectiveSelectedIds.length === 1 ? "Record" : "Records"} Selected
                </span>
                <span className="text-blue-300">|</span>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false, [])}
                  className="text-blue-700 hover:text-blue-950 font-semibold hover:underline"
                >
                  Clear Selection
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {(batchActions.length > 0
                  ? batchActions
                  : [
                      {
                        label: "Export Selected",
                        icon: Download,
                        onClick: (ids) => {
                          const selectedRows = filteredData.filter((r) =>
                            ids.includes(r[idKey])
                          );
                          if (selectedRows.length > 0) {
                            const csvHeader = renderedColumns
                              .map((c) => `"${c.label}"`)
                              .join(",");
                            const csvRows = selectedRows.map((row) =>
                              renderedColumns
                                .map(
                                  (c) =>
                                    `"${String(row[c.key] ?? "").replace(
                                      /"/g,
                                      '""'
                                    )}"`
                                )
                                .join(",")
                            );
                            const blob = new Blob(
                              [csvHeader + "\n" + csvRows.join("\n")],
                              {
                                type: "text/csv;charset=utf-8;",
                              }
                            );
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.setAttribute("href", url);
                            link.setAttribute(
                              "download",
                              `${moduleName.toLowerCase()}_selected_export.csv`
                            );
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }
                        },
                      },
                    ]
                ).map((act, idx) => {
                  const ActIcon = act.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => act.onClick(effectiveSelectedIds)}
                      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                        act.variant === "danger"
                          ? "bg-rose-600 text-white hover:bg-rose-700 shadow-2xs"
                          : "bg-white border border-blue-200 text-blue-800 hover:bg-blue-100 shadow-2xs"
                      }`}
                    >
                      {ActIcon && <ActIcon size={12} />}
                      <span>{act.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Table Container */}
          <div className="overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-[#f8fafc] text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none">
                <tr>
                  {selectable && (
                    <th className="w-10 px-3 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={allSelectedOnPage}
                        onChange={(e) => {
                          const pageIds = paginatedData.map((item) => item[idKey]);
                          handleSelectAll(e.target.checked, pageIds);
                        }}
                        aria-label="Select all rows"
                        className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                  )}

                  {renderedColumns.map((col) => {
                    const isSortable = col.sortable !== false;
                    const isSorted = sortColumn === col.key;

                    return (
                      <th
                        key={col.key}
                        scope="col"
                        style={{ width: col.width }}
                        onClick={() => isSortable && handleSort(col.key)}
                        className={`px-3 py-2.5 font-semibold text-slate-600 whitespace-nowrap ${
                          col.align === "right"
                            ? "text-right"
                            : col.align === "center"
                            ? "text-center"
                            : "text-left"
                        } ${isSortable ? "cursor-pointer hover:bg-slate-100/80 transition" : ""}`}
                      >
                        <div
                          className={`inline-flex items-center gap-1.5 ${
                            col.align === "right" ? "flex-row-reverse" : ""
                          }`}
                        >
                          <span>{col.label}</span>
                          {isSortable && (
                            <span className="text-slate-400">
                              {isSorted ? (
                                sortDirection === "asc" ? (
                                  <ChevronUp size={13} className="text-blue-600" />
                                ) : (
                                  <ChevronDown size={13} className="text-blue-600" />
                                )
                              ) : (
                                <ChevronsUpDown size={12} />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}

                  {/* Actions Column */}
                  {rowActions.length > 0 && (
                    <th scope="col" className="w-16 px-3 py-2.5 text-right font-semibold text-slate-600">
                      Actions
                    </th>
                  )}

                  {/* Column Customizer Icon Header Button (Zoho standard [=--=]) */}
                  <th scope="col" className="w-9 px-2 py-2.5 text-center select-none">
                    <div className="relative" ref={colCustomRef}>
                      <button
                        type="button"
                        onClick={() => setColumnCustomizerOpen((prev) => !prev)}
                        title="Customize Columns"
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
                      >
                        <SlidersHorizontal size={13} />
                      </button>

                      {columnCustomizerOpen && (
                        <div className="absolute right-0 mt-1 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50 text-left normal-case">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5">
                            <span className="text-xs font-bold text-slate-800">Customize Columns</span>
                            <button
                              type="button"
                              onClick={() => setColumnCustomizerOpen(false)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <X size={13} />
                            </button>
                          </div>
                          <div className="max-h-56 overflow-y-auto space-y-1">
                            {columns.map((col) => (
                              <label
                                key={col.key}
                                className="flex items-center gap-2 px-1 py-1 rounded hover:bg-slate-50 cursor-pointer text-xs text-slate-700"
                              >
                                <input
                                  type="checkbox"
                                  checked={visibleColumns.includes(col.key)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setVisibleColumns((prev) => [...prev, col.key]);
                                    } else {
                                      if (visibleColumns.length > 1) {
                                        setVisibleColumns((prev) =>
                                          prev.filter((k) => k !== col.key)
                                        );
                                      }
                                    }
                                  }}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="truncate">{col.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  // Loading Skeleton
                  Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      {selectable && (
                        <td className="px-3 py-3 text-center">
                          <div className="mx-auto h-3.5 w-3.5 rounded bg-slate-200" />
                        </td>
                      )}
                      {renderedColumns.map((col, cIdx) => (
                        <td key={cIdx} className="px-3 py-3">
                          <div
                            className="h-3.5 rounded bg-slate-100"
                            style={{ width: `${60 + ((cIdx * 17) % 35)}%` }}
                          />
                        </td>
                      ))}
                      {rowActions.length > 0 && (
                        <td className="px-3 py-3 text-right">
                          <div className="ml-auto h-5 w-5 rounded bg-slate-100" />
                        </td>
                      )}
                      <td className="px-2 py-3" />
                    </tr>
                  ))
                ) : error ? (
                  // Error State
                  <tr>
                    <td
                      colSpan={
                        renderedColumns.length +
                        (selectable ? 1 : 0) +
                        (rowActions.length > 0 ? 1 : 0) +
                        1
                      }
                      className="py-12 text-center"
                    >
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                        <AlertCircle size={32} className="text-rose-500" />
                        <p className="text-xs font-semibold text-slate-900">
                          Failed to load {moduleName.toLowerCase()} data
                        </p>
                        <p className="text-[11px] text-slate-500">{error}</p>
                        {onRetry && (
                          <button
                            type="button"
                            onClick={onRetry}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                          >
                            <RefreshCw size={13} />
                            Retry
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  // Empty State
                  <tr>
                    <td
                      colSpan={
                        renderedColumns.length +
                        (selectable ? 1 : 0) +
                        (rowActions.length > 0 ? 1 : 0) +
                        1
                      }
                      className="py-12 text-center"
                    >
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-slate-400">
                        <Inbox size={36} strokeWidth={1.5} className="text-slate-300" />
                        <p className="text-xs font-semibold text-slate-800">{emptyTitle}</p>
                        <p className="text-[11px] text-slate-500">{emptyDescription}</p>
                        {onCreateClick && (
                          <button
                            type="button"
                            onClick={onCreateClick}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#1B59F8] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1548D1]"
                          >
                            <Plus size={14} strokeWidth={2.5} />
                            <span>{createButtonLabel || `Create ${moduleName.replace(/s$/, "")}`}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  // Data Rows
                  paginatedData.map((row, rowIdx) => {
                    const rowId = row[idKey] || rowIdx;
                    const isSelected = effectiveSelectedIds.includes(rowId);

                    return (
                      <tr
                        key={rowId}
                        onClick={() => onRowClick && onRowClick(row)}
                        className={`transition duration-100 hover:bg-slate-50/90 ${
                          isSelected ? "bg-blue-50/50" : ""
                        } ${onRowClick ? "cursor-pointer" : ""}`}
                      >
                        {selectable && (
                          <td
                            className="px-3 py-2 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                handleSelectRow(rowId, e.target.checked);
                              }}
                              aria-label={`Select row ${rowIdx + 1}`}
                              className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                        )}

                        {renderedColumns.map((col) => (
                          <td
                            key={col.key}
                            className={`px-3 py-2 text-slate-700 whitespace-nowrap text-xs ${
                              col.align === "right"
                                ? "text-right"
                                : col.align === "center"
                                ? "text-center"
                                : "text-left"
                            }`}
                          >
                            {col.render ? col.render(row[col.key], row) : row[col.key] ?? "—"}
                          </td>
                        ))}

                        {rowActions.length > 0 && (
                          <td
                            className="px-3 py-2 text-right whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1">
                              {rowActions.map((act, actIdx) => {
                                if (act.condition && !act.condition(row)) return null;
                                const ActIcon = act.icon;
                                return (
                                  <button
                                    key={actIdx}
                                    type="button"
                                    onClick={() => act.onClick(row)}
                                    title={act.label}
                                    className={`flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition ${
                                      act.className || ""
                                    }`}
                                  >
                                    <ActIcon size={13} />
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                        )}

                        {/* Blank customizer cell spacer */}
                        <td className="px-2 py-2" />
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 3. Zoho Bottom Status & Pagination Bar */}
          {!loading && !error && filteredData.length > 0 && (
            <div className="flex flex-col gap-2.5 border-t border-slate-200 bg-white px-4 py-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between select-none">
              {/* Left: Total Records Count */}
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">
                  Total Records: <strong className="text-slate-900">{totalRecords}</strong>
                </span>
                {effectiveSelectedIds.length > 0 && (
                  <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
                    {effectiveSelectedIds.length} Selected
                  </span>
                )}
              </div>

              {/* Right: Page Size Selector & Pagination */}
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <div className="flex items-center gap-1.5">
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    aria-label="Records per page"
                    className="h-7 rounded border border-slate-200 bg-white px-2 text-xs text-slate-800 font-medium focus:border-blue-500 focus:outline-hidden"
                  >
                    {pageSizeOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt} per page
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-slate-600 text-xs font-medium mr-1">
                    {(validPage - 1) * pageSize + 1} to{" "}
                    {Math.min(validPage * pageSize, totalRecords)} of {totalRecords}
                  </span>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={validPage <= 1}
                    title="Previous Page"
                    className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={validPage >= totalPages}
                    title="Next Page"
                    className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
