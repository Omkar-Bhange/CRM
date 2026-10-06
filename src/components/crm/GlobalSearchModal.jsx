import { useState, useEffect, useRef } from "react";
import {
  Search,
  X,
  Users,
  ClipboardList,
  BriefcaseBusiness,
  Headphones,
  ListTodo,
  CreditCard,
  ReceiptIndianRupee,
  ArrowRight,
  Loader2,
  Clock,
} from "lucide-react";
import API_URL from "../../config/api";

const getAuthToken = () =>
  localStorage.getItem("client-connect-token") ||
  sessionStorage.getItem("client-connect-token") ||
  "";

export default function GlobalSearchModal({
  isOpen,
  onClose,
  onNavigate,
  clients = [],
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Perform search with debounce
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // Try calling backend global search endpoint if available
        const token = getAuthToken();
        const res = await fetch(
          `${API_URL}/api/admin/global-search?q=${encodeURIComponent(q)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setResults(json.data);
            setLoading(false);
            return;
          }
        }

        // Fallback: client-side search across available clients list
        const matchedClients = (clients || [])
          .filter(
            (c) =>
              c.companyName?.toLowerCase().includes(q) ||
              c.clientCode?.toLowerCase().includes(q) ||
              c.contactPerson?.toLowerCase().includes(q)
          )
          .slice(0, 8)
          .map((c) => ({
            id: c._id || c.id,
            title: c.companyName,
            subtitle: `${c.clientCode || ""} • ${c.contactPerson || "Contact"}`,
            category: "Clients",
            targetModule: "clients",
            recordId: c._id || c.id,
            icon: Users,
          }));

        setResults(matchedClients);
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, clients]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 bg-white">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients, leads, tickets, tasks, invoices..."
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-hidden font-medium"
          />
          {loading && <Loader2 size={16} className="animate-spin text-violet-600" />}
          {query && !loading && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={16} />
            </button>
          )}
          <kbd className="hidden sm:inline-block rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-2">
          {query.trim().length >= 2 && results.length === 0 && !loading && (
            <div className="py-10 text-center text-xs text-slate-500">
              <Search size={28} className="mx-auto mb-2 text-slate-300" />
              No records found matching "{query}"
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-1">
              {results.map((item, idx) => {
                const categoryIconMap = {
                  Clients: Users,
                  Leads: ClipboardList,
                  Projects: BriefcaseBusiness,
                  Tasks: ListTodo,
                  Tickets: Headphones,
                  Invoices: CreditCard,
                };
                const Icon = (typeof item.icon === "function" ? item.icon : categoryIconMap[item.category]) || Users;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigate(item.targetModule, item.recordId);
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left hover:bg-violet-50/80 transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-violet-600 group-hover:text-white transition">
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 group-hover:text-violet-900 truncate">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 group-hover:text-violet-600 shrink-0">
                      {item.category}
                      <ArrowRight size={12} />
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {!query && (
            <div className="p-3 text-xs text-slate-400">
              <p className="font-semibold uppercase tracking-wider text-[10px] text-slate-400 mb-2">
                Quick Navigation
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate("clients");
                  }}
                  className="flex items-center gap-2 rounded-lg border border-slate-100 p-2 text-slate-700 hover:bg-slate-50"
                >
                  <Users size={14} className="text-violet-600" />
                  <span>Clients Directory</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate("requirements");
                  }}
                  className="flex items-center gap-2 rounded-lg border border-slate-100 p-2 text-slate-700 hover:bg-slate-50"
                >
                  <ClipboardList size={14} className="text-blue-600" />
                  <span>Leads & Enquiries</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate("tasks");
                  }}
                  className="flex items-center gap-2 rounded-lg border border-slate-100 p-2 text-slate-700 hover:bg-slate-50"
                >
                  <ListTodo size={14} className="text-amber-600" />
                  <span>Tasks & Activities</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate("tickets");
                  }}
                  className="flex items-center gap-2 rounded-lg border border-slate-100 p-2 text-slate-700 hover:bg-slate-50"
                >
                  <Headphones size={14} className="text-rose-600" />
                  <span>Support Tickets</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

