import { useEffect, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Award,
  Sparkles,
  Calendar,
  Building2,
  User,
  Plus,
  RefreshCw,
  X,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Layers,
  ArrowRight,
  Filter,
  FileText,
} from "lucide-react";
import API_URL from "../../config/api";
import QuotationModal from "./QuotationModal";

const STAGES = [
  { id: "Discovery", label: "Discovery", color: "border-blue-500 bg-blue-50/30 text-blue-700" },
  { id: "Demo / Presentation", label: "Demo & Pitch", color: "border-indigo-500 bg-indigo-50/30 text-indigo-700" },
  { id: "Proposal / Quotation", label: "Proposal Sent", color: "border-amber-500 bg-amber-50/30 text-amber-700" },
  { id: "Negotiation / Review", label: "Negotiation", color: "border-purple-500 bg-purple-50/30 text-purple-700" },
  { id: "Closed Won", label: "Closed Won", color: "border-emerald-500 bg-emerald-50/30 text-emerald-700" },
  { id: "Closed Lost", label: "Closed Lost", color: "border-rose-500 bg-rose-50/30 text-rose-700" },
];

export default function DealsPipeline({ clients = [], employees = [] }) {
  const getAuthToken = () =>
    localStorage.getItem("client-connect-token") ||
    sessionStorage.getItem("client-connect-token") ||
    "";

  const [pipelineData, setPipelineData] = useState({
    summary: {
      totalDeals: 0,
      totalPipelineValue: 0,
      weightedForecastValue: 0,
      wonValue: 0,
      wonCount: 0,
      winRate: 0,
    },
    columns: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Drag and Drop States
  const [draggedDeal, setDraggedDeal] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  // Modals & Drawers
  const [newDealOpen, setNewDealOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [quotationDeal, setQuotationDeal] = useState(null);
  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [stageTargetDeal, setStageTargetDeal] = useState(null);
  const [targetStage, setTargetStage] = useState("");
  const [lostReason, setLostReason] = useState("");
  const [lostNotes, setLostNotes] = useState("");

  const [dealForm, setDealForm] = useState({
    title: "",
    clientId: "",
    amount: "",
    stage: "Discovery",
    expectedCloseDate: "",
    priority: "Medium",
    dealType: "New Business",
    assignedTo: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const loadPipeline = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_URL}/api/deals/pipeline`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load deals pipeline.");
      setPipelineData(data.data);
    } catch (err) {
      console.error("Load pipeline error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPipeline();
  }, []);

  const handleCreateDeal = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch(`${API_URL}/api/deals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          ...dealForm,
          amount: Number(dealForm.amount) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to create deal.");
      setNewDealOpen(false);
      setDealForm({
        title: "",
        clientId: "",
        amount: "",
        stage: "Discovery",
        expectedCloseDate: "",
        priority: "Medium",
        dealType: "New Business",
        assignedTo: "",
        notes: "",
      });
      loadPipeline();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePromptStageChange = (deal, newStage) => {
    if (newStage === "Closed Lost") {
      setStageTargetDeal(deal);
      setTargetStage(newStage);
      setLostReason("Price / Budget Constraint");
      setLostNotes("");
      setStageModalOpen(true);
    } else {
      executeStageChange(deal._id, newStage);
    }
  };

  const executeStageChange = async (dealId, stage, lostReasonVal = "", lostNotesVal = "") => {
    try {
      const res = await fetch(`${API_URL}/api/deals/${dealId}/stage`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          stage,
          lostReason: lostReasonVal,
          lostReasonNotes: lostNotesVal,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to update stage.");
      setStageModalOpen(false);
      setStageTargetDeal(null);
      loadPipeline();
    } catch (err) {
      alert(err.message);
    }
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val || 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <section className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            Revenue Forecasting & Opportunities
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Deals Pipeline</h1>
          <p className="mt-1 text-xs text-slate-500">
            Track sales stages, win probabilities, expected close dates, and weighted pipeline revenue.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadPipeline}
            disabled={loading}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-blue-600" : ""} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setNewDealOpen(true)}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] px-4 text-xs font-semibold text-white shadow-xs hover:bg-[#1548D1] active:bg-[#0F3DB8] transition"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>New Deal</span>
          </button>
        </div>
      </section>

      {/* 2. Pipeline Summary Metrics Strip */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Pipeline Value</p>
          <p className="mt-1.5 text-xl font-bold text-slate-900">{formatCurrency(pipelineData.summary?.totalPipelineValue)}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">{pipelineData.summary?.totalDeals || 0} active deals</p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Weighted Forecast</p>
          <p className="mt-1.5 text-xl font-bold text-blue-900">{formatCurrency(pipelineData.summary?.weightedForecastValue)}</p>
          <p className="mt-0.5 text-[11px] text-blue-700 font-medium">Probability-adjusted revenue</p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Won Revenue</p>
          <p className="mt-1.5 text-xl font-bold text-emerald-900">{formatCurrency(pipelineData.summary?.wonValue)}</p>
          <p className="mt-0.5 text-[11px] text-emerald-700 font-medium">{pipelineData.summary?.wonCount || 0} deals closed won</p>
        </div>

        <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Win Rate</p>
          <p className="mt-1.5 text-xl font-bold text-purple-900">{pipelineData.summary?.winRate || 0}%</p>
          <p className="mt-0.5 text-[11px] text-purple-700 font-medium">Closed deal conversion</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Average Deal Size</p>
          <p className="mt-1.5 text-xl font-bold text-slate-900">
            {formatCurrency(
              pipelineData.summary?.totalDeals > 0
                ? Math.round(pipelineData.summary?.totalPipelineValue / pipelineData.summary?.totalDeals)
                : 0
            )}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">Per opportunity</p>
        </div>
      </section>

      {/* 3. Visual Kanban Pipeline Board */}
      <section className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar min-h-[550px]">
        {STAGES.map((colDef) => {
          const colData = pipelineData.columns?.find((c) => c.stage === colDef.id) || {
            count: 0,
            totalValue: 0,
            deals: [],
          };

          const isOver = dragOverStage === colDef.id;

          return (
            <div
              key={colDef.id}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverStage !== colDef.id) setDragOverStage(colDef.id);
              }}
              onDragLeave={() => {
                if (dragOverStage === colDef.id) setDragOverStage(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverStage(null);
                if (draggedDeal && draggedDeal.stage !== colDef.id) {
                  handlePromptStageChange(draggedDeal, colDef.id);
                  setDraggedDeal(null);
                }
              }}
              className={`flex w-72 shrink-0 flex-col rounded-xl border transition-all duration-150 ${
                isOver
                  ? "border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-md"
                  : "border-slate-200/90 bg-slate-50/70"
              } overflow-hidden`}
            >
              {/* Column Header */}
              <div className={`border-t-3 px-3 py-2.5 bg-white border-b border-slate-200 ${colDef.color}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{colDef.label}</span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-700">
                    {colData.count}
                  </span>
                </div>
                <p className="mt-1 text-[11px] font-semibold text-slate-600">{formatCurrency(colData.totalValue)}</p>
              </div>

              {/* Cards List */}
              <div className="flex flex-1 flex-col gap-2.5 p-2.5 overflow-y-auto">
                {colData.deals && colData.deals.length > 0 ? (
                  colData.deals.map((deal) => {
                    const isDraggingThis = draggedDeal?._id === deal._id;
                    return (
                      <div
                        key={deal._id}
                        draggable={true}
                        onDragStart={(e) => {
                          setDraggedDeal(deal);
                          e.dataTransfer.setData("text/plain", deal._id);
                        }}
                        onDragEnd={() => {
                          setDraggedDeal(null);
                          setDragOverStage(null);
                        }}
                        onClick={() => setSelectedDeal(deal)}
                        className={`group cursor-grab active:cursor-grabbing rounded-xl border border-slate-200 bg-white p-3 shadow-2xs hover:border-blue-400 hover:shadow-xs transition duration-150 ${
                          isDraggingThis ? "opacity-35 scale-95 border-dashed border-blue-400" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <span className="text-[10px] font-bold text-blue-600">{deal.dealCode}</span>
                          <span
                            className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                              deal.priority === "Critical"
                                ? "bg-rose-50 text-rose-700 ring-1 ring-rose-500/20"
                                : deal.priority === "High"
                                ? "bg-amber-50 text-amber-700 ring-1 ring-amber-500/20"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {deal.priority}
                          </span>
                        </div>

                        <h4 className="mt-1 text-xs font-bold text-slate-900 line-clamp-2">{deal.title}</h4>
                        <p className="mt-0.5 text-[11px] text-slate-500 truncate flex items-center gap-1">
                          <Building2 size={11} className="shrink-0" />
                          {deal.clientName}
                        </p>

                        <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                          <span className="font-bold text-slate-900">{formatCurrency(deal.amount)}</span>
                          <span className="text-[10px] font-semibold text-slate-500">
                            {deal.probability}% Prob
                          </span>
                        </div>

                        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                          <span>Due: {formatDate(deal.expectedCloseDate)}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setQuotationDeal(deal);
                              }}
                              title="Generate Proposal"
                              className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 hover:bg-blue-100 transition"
                            >
                              + Quote
                            </button>
                            <select
                              onClick={(e) => e.stopPropagation()}
                              value={deal.stage}
                              onChange={(e) => handlePromptStageChange(deal, e.target.value)}
                              className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 text-[9px] font-semibold text-slate-700 outline-hidden"
                            >
                              {STAGES.map((s) => (
                                <option key={s.id} value={s.id}>
                                  Move: {s.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-slate-400">
                    <Layers size={22} className="stroke-1 text-slate-300 mb-1" />
                    <p className="text-[11px] font-medium">No deals in {colDef.label}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* 4. Quick Add Deal Modal */}
      {newDealOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setNewDealOpen(false)}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs"
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create New Opportunity</h3>
                <p className="text-xs text-slate-500">Add an active commercial deal to the sales pipeline.</p>
              </div>
              <button
                type="button"
                onClick={() => setNewDealOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deal Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nexora ERP Enterprise Suite + Cloud Setup"
                  value={dealForm.title}
                  onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Client Account *</label>
                  <select
                    required
                    value={dealForm.clientId}
                    onChange={(e) => setDealForm({ ...dealForm, clientId: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs focus:border-blue-500 outline-hidden"
                  >
                    <option value="">Select Client...</option>
                    {clients.map((c) => (
                      <option key={c._id || c.id} value={c._id || c.id}>
                        {c.companyName} ({c.clientCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Deal Value (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="250000"
                    value={dealForm.amount}
                    onChange={(e) => setDealForm({ ...dealForm, amount: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Pipeline Stage</label>
                  <select
                    value={dealForm.stage}
                    onChange={(e) => setDealForm({ ...dealForm, stage: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs focus:border-blue-500 outline-hidden"
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Close Date *</label>
                  <input
                    type="date"
                    required
                    value={dealForm.expectedCloseDate}
                    onChange={(e) => setDealForm({ ...dealForm, expectedCloseDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deal Summary & Deliverables</label>
                <textarea
                  rows={2}
                  placeholder="Key terms, software licenses, scope of delivery..."
                  value={dealForm.notes}
                  onChange={(e) => setDealForm({ ...dealForm, notes: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNewDealOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#1B59F8] px-5 py-2 text-xs font-bold text-white hover:bg-[#1548D1] disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Deal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Closed Lost Reason Modal */}
      {stageModalOpen && stageTargetDeal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setStageModalOpen(false)}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs"
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Log Closed Lost Reason</h3>
            <p className="text-xs text-slate-500 mt-0.5">Capture why this opportunity did not convert for sales analytics.</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Reason</label>
                <select
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs outline-hidden"
                >
                  <option value="Price / Budget Constraint">Price / Budget Constraint</option>
                  <option value="Competitor Selected">Competitor Selected</option>
                  <option value="Feature Gap">Feature Gap</option>
                  <option value="Project Postponed / Cancelled">Project Postponed / Cancelled</option>
                  <option value="Unresponsive">Unresponsive</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Notes</label>
                <textarea
                  rows={2}
                  placeholder="Competitor name, feedback from client..."
                  value={lostNotes}
                  onChange={(e) => setLostNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStageModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => executeStageChange(stageTargetDeal._id, "Closed Lost", lostReason, lostNotes)}
                  className="rounded-lg bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700"
                >
                  Mark Lost
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. CPQ Line-Item Quotation Modal */}
      <QuotationModal
        isOpen={Boolean(quotationDeal)}
        onClose={() => setQuotationDeal(null)}
        deal={quotationDeal}
        onQuotationCreated={() => loadPipeline()}
      />
    </div>
  );
}
