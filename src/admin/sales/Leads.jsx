import { useEffect, useState, useMemo } from "react";
import {
  Users,
  Target,
  Sparkles,
  TrendingUp,
  UserCheck,
  Building2,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  Plus,
  RefreshCw,
  ArrowRightLeft,
  X,
  CheckCircle2,
  Check,
  Eye,
  Trash2,
  Clock,
  DollarSign,
  Tag,
  Briefcase,
  ChevronRight,
} from "lucide-react";
import API_URL from "../../config/api";
import DataTable from "../../components/data/DataTable";

export default function Leads({ onNavigateToDeals, onNavigateToClients }) {
  const getAuthToken = () =>
    localStorage.getItem("client-connect-token") ||
    sessionStorage.getItem("client-connect-token") ||
    "";

  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({
    totalLeads: 0,
    newToday: 0,
    convertedCount: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");

  // Modals & Drawers
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [convertingLead, setConvertingLead] = useState(null);
  const [savingLead, setSavingLead] = useState(false);
  const [converting, setConverting] = useState(false);

  // New Lead Form State
  const [leadForm, setLeadForm] = useState({
    title: "",
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    alternatePhone: "",
    city: "Mumbai",
    state: "Maharashtra",
    source: "Website",
    priority: "Medium",
    score: 50,
    estimatedBudget: "",
    industry: "Services",
    notes: "",
  });

  // Convert Form State
  const [convertForm, setConvertForm] = useState({
    dealTitle: "",
    dealAmount: "",
    createDeal: true,
  });

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_URL}/api/leads?status=${statusFilter}&source=${sourceFilter}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load leads.");
      setLeads(data.data || []);
    } catch (err) {
      console.error("Load leads error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/leads/stats`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error("Load lead stats error:", err);
    }
  };

  useEffect(() => {
    loadLeads();
    loadStats();
  }, [statusFilter, sourceFilter]);

  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      setSavingLead(true);
      const res = await fetch(`${API_URL}/api/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          ...leadForm,
          estimatedBudget: Number(leadForm.estimatedBudget) || 0,
          score: Number(leadForm.score) || 50,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to create lead.");
      setNewLeadOpen(false);
      setLeadForm({
        title: "",
        companyName: "",
        contactName: "",
        email: "",
        phone: "",
        alternatePhone: "",
        city: "Mumbai",
        state: "Maharashtra",
        source: "Website",
        priority: "Medium",
        score: 50,
        estimatedBudget: "",
        industry: "Services",
        notes: "",
      });
      loadLeads();
      loadStats();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingLead(false);
    }
  };

  const handleOpenConvert = (lead) => {
    setConvertingLead(lead);
    setConvertForm({
      dealTitle: `Deal for ${lead.companyName}`,
      dealAmount: lead.estimatedBudget || "",
      createDeal: true,
    });
    setConvertModalOpen(true);
  };

  const handleConvertLead = async (e) => {
    e.preventDefault();
    if (!convertingLead) return;
    try {
      setConverting(true);
      const res = await fetch(`${API_URL}/api/leads/${convertingLead._id}/convert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(convertForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Conversion failed.");

      setConvertModalOpen(false);
      setConvertingLead(null);
      loadLeads();
      loadStats();

      if (window.confirm("Lead converted successfully! View in Deals Pipeline?")) {
        if (typeof onNavigateToDeals === "function") {
          onNavigateToDeals();
        }
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setConverting(false);
    }
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val || 0);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <section className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            CRM Pipeline & Inbound Engine
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Leads & Prospects</h1>
          <p className="mt-1 text-xs text-slate-500">
            Capture, qualify, score, and convert inbound business inquiries into active client accounts and revenue deals.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setNewLeadOpen(true)}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] px-4 text-xs font-semibold text-white shadow-xs hover:bg-[#1548D1] active:bg-[#0F3DB8] transition"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>New Lead</span>
        </button>
      </section>

      {/* 2. Executive KPI Metrics Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Leads</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Target size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{stats.totalLeads}</p>
          <p className="mt-1 text-xs text-slate-500">Active inbound database</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">New Today</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Sparkles size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{stats.newToday}</p>
          <p className="mt-1 text-xs text-emerald-600 font-medium">Fresh inquiries received today</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Converted to Client</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <UserCheck size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{stats.convertedCount}</p>
          <p className="mt-1 text-xs text-violet-600 font-medium">Transferred to accounts</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Conversion Rate</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{stats.conversionRate}%</p>
          <p className="mt-1 text-xs text-slate-500">Qualification effectiveness</p>
        </div>
      </section>

      {/* 3. Modern Zoho-Grade Leads DataTable */}
      <DataTable
        moduleName="Leads"
        viewTitle="All Leads"
        views={[
          { id: "all", label: "All Leads" },
          { id: "New", label: "New Inbound" },
          { id: "Qualified", label: "Qualified Leads" },
          { id: "Converted", label: "Converted to Client" },
          { id: "Lost", label: "Lost Leads" },
        ]}
        activeView={statusFilter === "All" ? "all" : statusFilter}
        onViewChange={(id) => setStatusFilter(id === "all" ? "All" : id)}
        onCreateClick={() => setNewLeadOpen(true)}
        createButtonLabel="New Lead"
        selectable={true}
        columns={[
          {
            key: "leadCode",
            label: "Lead ID",
            sortable: true,
            render: (_, lead) => (
              <div>
                <span className="font-semibold text-blue-600 text-xs">{lead.leadCode}</span>
                <p className="text-[10px] text-slate-400">{lead.source}</p>
              </div>
            ),
          },
          {
            key: "companyName",
            label: "Company & Inquiry",
            sortable: true,
            render: (_, lead) => (
              <div className="min-w-[180px]">
                <p className="font-semibold text-slate-900 text-xs truncate max-w-[220px]">{lead.companyName}</p>
                <p className="text-[11px] text-slate-500 truncate max-w-[220px]">{lead.title}</p>
              </div>
            ),
          },
          {
            key: "contactName",
            label: "Contact Person",
            sortable: true,
            render: (_, lead) => (
              <div>
                <p className="text-xs font-semibold text-slate-800">{lead.contactName}</p>
                <p className="text-[10px] text-slate-400">{lead.phone}</p>
              </div>
            ),
          },
          {
            key: "score",
            label: "Score",
            sortable: true,
            render: (val) => (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  val >= 70
                    ? "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20"
                    : val >= 40
                    ? "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                    : "bg-slate-50 text-slate-600 ring-1 ring-slate-400/20"
                }`}
              >
                🔥 {val}/100
              </span>
            ),
          },
          {
            key: "estimatedBudget",
            label: "Budget",
            sortable: true,
            render: (val) => <span className="text-xs font-bold text-slate-900">{formatCurrency(val)}</span>,
          },
          {
            key: "status",
            label: "Status",
            sortable: true,
            render: (val) => (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  val === "Converted"
                    ? "bg-violet-50 text-violet-700 ring-1 ring-violet-600/20"
                    : val === "Qualified"
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                    : val === "New"
                    ? "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20"
                    : val === "Lost"
                    ? "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {val}
              </span>
            ),
          },
        ]}
        data={leads}
        loading={loading}
        error={error}
        onRetry={loadLeads}
        idKey="_id"
        onRowClick={(lead) => setSelectedLead(lead)}
        rowActions={[
          {
            label: "Convert Lead",
            icon: ArrowRightLeft,
            className: "text-violet-600 hover:text-violet-800 hover:bg-violet-50",
            condition: (lead) => lead.status !== "Converted",
            onClick: (lead) => handleOpenConvert(lead),
          },
          {
            label: "View Details",
            icon: Eye,
            className: "text-blue-600 hover:text-blue-800 hover:bg-blue-50",
            onClick: (lead) => setSelectedLead(lead),
          },
        ]}
      />

      {/* 4. Quick Add Lead Drawer */}
      {newLeadOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-end p-3 sm:p-5">
          <button
            type="button"
            onClick={() => setNewLeadOpen(false)}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs"
          />
          <div className="relative z-10 flex h-full w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/80">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create New Inbound Lead</h3>
                <p className="text-xs text-slate-500">Record a new customer prospect into the CRM funnel.</p>
              </div>
              <button
                type="button"
                onClick={() => setNewLeadOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="flex flex-1 flex-col overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Inquiry Title / Objective *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise ERP & Multi-Branch Accounting"
                  value={leadForm.title}
                  onChange={(e) => setLeadForm({ ...leadForm, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Organization *</label>
                  <input
                    type="text"
                    required
                    placeholder="Apex Logistics Ltd"
                    value={leadForm.companyName}
                    onChange={(e) => setLeadForm({ ...leadForm, companyName: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Vikram Malhotra"
                    value={leadForm.contactName}
                    onChange={(e) => setLeadForm({ ...leadForm, contactName: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 9876543210"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="vikram@apexlogistics.in"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Source</label>
                  <select
                    value={leadForm.source}
                    onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs focus:border-blue-500 outline-hidden"
                  >
                    <option value="Website">Website</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Referral">Referral</option>
                    <option value="Cold Outreach">Cold Outreach</option>
                    <option value="Inbound Call">Inbound Call</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Budget (₹)</label>
                  <input
                    type="number"
                    placeholder="350000"
                    value={leadForm.estimatedBudget}
                    onChange={(e) => setLeadForm({ ...leadForm, estimatedBudget: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={leadForm.score}
                    onChange={(e) => setLeadForm({ ...leadForm, score: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Requirements & Prospect Notes</label>
                <textarea
                  rows={3}
                  placeholder="Client requirements, expected deliverables, timeline notes..."
                  value={leadForm.notes}
                  onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 outline-hidden"
                />
              </div>

              <div className="mt-auto border-t border-slate-200 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewLeadOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLead}
                  className="rounded-lg bg-[#1B59F8] px-5 py-2 text-xs font-semibold text-white hover:bg-[#1548D1] disabled:opacity-50"
                >
                  {savingLead ? "Saving..." : "Save Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. 1-Click Lead Conversion Modal */}
      {convertModalOpen && convertingLead && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setConvertModalOpen(false)}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs"
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                <ArrowRightLeft size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Convert Lead to Customer</h3>
                <p className="text-xs text-slate-500">{convertingLead.companyName}</p>
              </div>
            </div>

            <form onSubmit={handleConvertLead} className="mt-4 space-y-4">
              <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-3 text-xs text-violet-900 space-y-1.5">
                <p className="font-semibold">This action will automatically create:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-violet-800">
                  <li><strong>Client Account:</strong> {convertingLead.companyName}</li>
                  <li><strong>Primary Contact:</strong> {convertingLead.contactName} ({convertingLead.phone})</li>
                  <li><strong>Active Opportunity:</strong> Deal in "Discovery" stage</li>
                </ul>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deal / Opportunity Title</label>
                <input
                  type="text"
                  required
                  value={convertForm.dealTitle}
                  onChange={(e) => setConvertForm({ ...convertForm, dealTitle: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deal Value (₹)</label>
                <input
                  type="number"
                  required
                  value={convertForm.dealAmount}
                  onChange={(e) => setConvertForm({ ...convertForm, dealAmount: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConvertModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={converting}
                  className="rounded-lg bg-violet-600 px-5 py-2 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-50"
                >
                  {converting ? "Converting..." : "Convert Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
