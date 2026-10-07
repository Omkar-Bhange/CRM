import { useState, useEffect } from "react";
import {
  X,
  ArrowRight,
  ArrowRightLeft,
  Calendar,
  User,
  Phone,
  FileText,
  AlertCircle,
  Clock,
  CircleDollarSign,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import API_URL from "../../config/api";

const ALL_STATUSES = [
  "New",
  "Discussion",
  "Analysis",
  "Estimate Pending",
  "Quotation Pending",
  "Quotation Sent",
  "Negotiation",
  "Approved",
  "Rejected",
  "On Hold",
  "Converted to Project",
];

const CONTACT_METHODS = ["Phone", "WhatsApp", "Email", "Meeting", "Other"];

const REJECTION_REASONS = [
  "Budget Mismatch / Cost Too High",
  "Lost to Competitor",
  "Client Dropped / Deferred Project",
  "Technical Feasibility / Scope Constraint",
  "Delivery Timeline Mismatch",
  "Client Unresponsive",
  "Other",
];

const HOLD_REASONS = [
  "Client Decision Delayed",
  "Client Budget Freeze",
  "Awaiting Client Assets / Inputs",
  "Internal Team Capacity",
  "Third-Party Dependency",
  "Other",
];

function getWorkflowRecommendations(currentStatus) {
  switch (currentStatus) {
    case "New":
      return {
        recommended: ["Discussion"],
        alternatives: ["On Hold", "Rejected"],
      };
    case "Discussion":
      return {
        recommended: ["Analysis"],
        alternatives: ["On Hold", "Rejected"],
      };
    case "Analysis":
      return {
        recommended: ["Estimate Pending"],
        alternatives: ["On Hold", "Rejected"],
      };
    case "Estimate Pending":
      return {
        recommended: ["Quotation Pending"],
        alternatives: ["On Hold", "Rejected"],
      };
    case "Quotation Pending":
      return {
        recommended: ["Quotation Sent"],
        alternatives: ["On Hold", "Rejected"],
      };
    case "Quotation Sent":
      return {
        recommended: ["Negotiation", "Approved"],
        alternatives: ["On Hold", "Rejected"],
      };
    case "Negotiation":
      return {
        recommended: ["Approved"],
        alternatives: ["On Hold", "Rejected"],
      };
    case "Approved":
      return {
        recommended: [],
        alternatives: ["On Hold", "Rejected"],
        note: "Requirement is Approved and ready for Project Conversion.",
      };
    case "On Hold":
      return {
        recommended: ["Discussion", "Analysis"],
        alternatives: ["Rejected"],
      };
    case "Rejected":
      return {
        recommended: ["Discussion", "New"],
        alternatives: ["On Hold"],
      };
    default:
      return {
        recommended: ["Discussion"],
        alternatives: ["On Hold", "Rejected"],
      };
  }
}

function getStatusBadgeStyle(status) {
  switch (status) {
    case "Approved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20";
    case "Rejected":
      return "bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/20";
    case "Converted to Project":
      return "bg-violet-50 text-violet-700 border-violet-200 ring-violet-600/20";
    case "Quotation Sent":
    case "Negotiation":
      return "bg-blue-50 text-blue-700 border-blue-200 ring-blue-600/20";
    case "On Hold":
      return "bg-slate-100 text-slate-700 border-slate-200 ring-slate-600/20";
    default:
      return "bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/20";
  }
}

export default function RequirementTransitionModal({
  isOpen,
  onClose,
  requirement,
  employees = [],
  onSuccess,
  onOpenConvertProject,
}) {
  const [targetStatus, setTargetStatus] = useState("");
  const [contactMethod, setContactMethod] = useState("Phone");
  const [contactPerson, setContactPerson] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [assignedEmployeeId, setAssignedEmployeeId] = useState("");
  const [proposedTimeline, setProposedTimeline] = useState("");
  const [quotationReference, setQuotationReference] = useState("");
  const [quotationAmount, setQuotationAmount] = useState("");
  const [quotationDate, setQuotationDate] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [lostReason, setLostReason] = useState("");
  const [competitor, setCompetitor] = useState("");
  const [holdReason, setHoldReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const currentStatus = requirement?.status || "New";
  const { recommended, alternatives, note } = getWorkflowRecommendations(currentStatus);

  useEffect(() => {
    if (requirement) {
      const rec = getWorkflowRecommendations(requirement.status || "New");
      const defaultTarget =
        rec.recommended[0] ||
        (requirement.status === "Approved" ? "Approved" : "Discussion");
      setTargetStatus(defaultTarget);

      // Prepopulate existing fields
      setContactMethod(requirement.contactMethod || "Phone");
      setContactPerson(
        requirement.contactPerson ||
          requirement.prospectName ||
          requirement.clientName ||
          ""
      );
      setNotes("");
      setFollowUpDate(
        requirement.followUpDate
          ? String(requirement.followUpDate).slice(0, 10)
          : ""
      );
      setNextAction(requirement.nextAction || "");
      setAssignedEmployeeId(requirement.assignedEmployeeId || "");
      setProposedTimeline(requirement.stageData?.proposedTimeline || "");
      setQuotationReference(
        requirement.quotationNo || requirement.quotationReference || ""
      );
      setQuotationAmount(
        requirement.quotedAmount ? String(requirement.quotedAmount) : ""
      );
      setQuotationDate(
        requirement.quotationDate
          ? String(requirement.quotationDate).slice(0, 10)
          : new Date().toISOString().slice(0, 10)
      );
      setValidUntil(
        requirement.validUntil ? String(requirement.validUntil).slice(0, 10) : ""
      );
      setLostReason(requirement.lostReason || "");
      setCompetitor(requirement.competitor || "");
      setHoldReason(requirement.holdReason || "");
      setError("");
    }
  }, [requirement]);

  if (!isOpen || !requirement) return null;

  const getAuthToken = () =>
    localStorage.getItem("client-connect-token") ||
    sessionStorage.getItem("client-connect-token") ||
    "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!targetStatus) {
      setError("Please select a target status.");
      return;
    }

    if (targetStatus === currentStatus) {
      setError("Target status is identical to current status. Please choose a different stage.");
      return;
    }

    if (targetStatus === "Converted to Project") {
      setError("To convert this requirement to a project, please use the dedicated 'Convert to Project' flow.");
      return;
    }

    if (targetStatus === "Rejected" && !lostReason.trim()) {
      setError("Reason for rejection is required when moving to Rejected (Lost).");
      return;
    }

    if (targetStatus === "On Hold" && !holdReason.trim()) {
      setError("Reason for hold is required when moving to On Hold.");
      return;
    }

    try {
      setSubmitting(true);
      const requirementId = requirement._id || requirement.id;

      const payload = {
        status: targetStatus,
        notes: notes.trim(),
        nextAction: nextAction.trim(),
        followUpDate: followUpDate || null,
        contactMethod,
        contactPerson: contactPerson.trim(),
        quotationReference: quotationReference.trim(),
        quotationAmount: quotationAmount ? Number(quotationAmount) : undefined,
        quotationDate: quotationDate || null,
        validUntil: validUntil || null,
        lostReason: lostReason.trim(),
        competitor: competitor.trim(),
        holdReason: holdReason.trim(),
        assignedEmployeeId: assignedEmployeeId || null,
        stageData: proposedTimeline ? { proposedTimeline: proposedTimeline.trim() } : undefined,
      };

      const response = await fetch(
        `${API_URL}/api/admin/requirement/${requirementId}/stage-transition`,
        {
          method: "PATCH",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update requirement stage.");
      }

      if (onSuccess) {
        onSuccess(result.data);
      }
      onClose();
    } catch (err) {
      console.error("Transition error:", err);
      setError(err.message || "Failed to transition stage.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close modal overlay"
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Box */}
      <div className="relative z-[90] flex w-full max-w-2xl flex-col max-h-[92vh] rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <ArrowRightLeft size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Move Requirement
                </h3>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-semibold text-violet-700">
                  {requirement.requirementCode}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-md">
                {requirement.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
          >
            <X size={17} />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex flex-col overflow-y-auto">
          <div className="p-6 space-y-5">
            {/* Error Banner */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-xs text-rose-700">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1 font-medium">{error}</div>
              </div>
            )}

            {/* Stage Progression Banner (Current -> Target) */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Current Stage */}
                <div className="flex-1">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Current Stage
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${getStatusBadgeStyle(
                        currentStatus
                      )}`}
                    >
                      {currentStatus}
                    </span>
                  </div>
                </div>

                <div className="hidden sm:flex items-center text-slate-400">
                  <ArrowRight size={20} />
                </div>

                {/* Target Stage Selector */}
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Target Stage <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={targetStatus}
                    onChange={(e) => {
                      setTargetStatus(e.target.value);
                      setError("");
                    }}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
                  >
                    <option value="" disabled>
                      Select Next Stage...
                    </option>

                    {recommended.length > 0 && (
                      <optgroup label="── Recommended Next Step ──">
                        {recommended.map((st) => (
                          <option key={st} value={st}>
                            {st} (Recommended)
                          </option>
                        ))}
                      </optgroup>
                    )}

                    {alternatives.length > 0 && (
                      <optgroup label="── Exception / Alternatives ──">
                        {alternatives.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </optgroup>
                    )}

                    <optgroup label="── All Stages (Correction) ──">
                      {ALL_STATUSES.filter(
                        (st) =>
                          st !== "Converted to Project" &&
                          !recommended.includes(st) &&
                          !alternatives.includes(st) &&
                          st !== currentStatus
                      ).map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Special Guide for Converted to Project */}
              {currentStatus === "Approved" && (
                <div className="mt-3.5 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/80 p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span className="text-xs text-emerald-800 font-medium">
                      This requirement is approved and ready to start execution!
                    </span>
                  </div>
                  {onOpenConvertProject && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenConvertProject(requirement);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
                    >
                      <CircleDollarSign size={13} />
                      Convert to Project
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* STAGE-SPECIFIC FORM FIELDS */}
            <div className="space-y-4">
              {/* TARGET: DISCUSSION */}
              {targetStatus === "Discussion" && (
                <div className="space-y-3.5 rounded-xl border border-blue-100 bg-blue-50/20 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
                    <Phone size={14} className="text-blue-600" />
                    Discussion Details
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Contact Method
                      </label>
                      <select
                        value={contactMethod}
                        onChange={(e) => setContactMethod(e.target.value)}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-violet-600"
                      >
                        {CONTACT_METHODS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        placeholder="Person spoken with..."
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-violet-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Discussion Notes
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Summary of client discussion, pain points, initial expectations..."
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-violet-600"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Follow-up Date
                      </label>
                      <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-violet-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Next Action
                      </label>
                      <input
                        type="text"
                        value={nextAction}
                        onChange={(e) => setNextAction(e.target.value)}
                        placeholder="e.g. Schedule technical scoping call"
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-violet-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TARGET: ANALYSIS */}
              {targetStatus === "Analysis" && (
                <div className="space-y-3.5 rounded-xl border border-violet-100 bg-violet-50/20 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-violet-900 uppercase tracking-wider">
                    <User size={14} className="text-violet-600" />
                    Analysis & Scoping Details
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Requirement Analysis Summary / Scope Notes
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Technical scope, modules identified, architecture notes..."
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-violet-600"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Assign Analyst / Tech Lead
                      </label>
                      <select
                        value={assignedEmployeeId}
                        onChange={(e) => setAssignedEmployeeId(e.target.value)}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-violet-600"
                      >
                        <option value="">Unassigned</option>
                        {employees.map((emp) => (
                          <option key={emp._id || emp.id} value={emp._id || emp.id}>
                            {emp.name} {emp.designation ? `(${emp.designation})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Follow-up / Due Date
                      </label>
                      <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-violet-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Next Action
                    </label>
                    <input
                      type="text"
                      value={nextAction}
                      onChange={(e) => setNextAction(e.target.value)}
                      placeholder="e.g. Prepare Work Breakdown Structure (WBS)"
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-violet-600"
                    />
                  </div>
                </div>
              )}

              {/* TARGET: ESTIMATE PENDING */}
              {targetStatus === "Estimate Pending" && (
                <div className="space-y-3.5 rounded-xl border border-amber-100 bg-amber-50/20 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
                    <Clock size={14} className="text-amber-600" />
                    Estimation Planning
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Proposed Timeline / Delivery Horizon
                      </label>
                      <input
                        type="text"
                        value={proposedTimeline}
                        onChange={(e) => setProposedTimeline(e.target.value)}
                        placeholder="e.g. 6-8 weeks / Phase 1 in 1 month"
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-violet-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Next Action
                      </label>
                      <input
                        type="text"
                        value={nextAction}
                        onChange={(e) => setNextAction(e.target.value)}
                        placeholder="e.g. Finalize resource hours with Dev Lead"
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-violet-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Scope & Commercial Notes
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Effort calculation, scope boundaries, licensing dependencies..."
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-violet-600"
                    />
                  </div>
                </div>
              )}

              {/* TARGET: QUOTATION PENDING */}
              {targetStatus === "Quotation Pending" && (
                <div className="space-y-3.5 rounded-xl border border-amber-100 bg-amber-50/20 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
                    <FileText size={14} className="text-amber-600" />
                    Quotation Preparation
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Commercial Notes / Pricing Structure
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Payment milestones, AMC clauses, discount approvals..."
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-violet-600"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Quotation Due Date / Follow-up
                      </label>
                      <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-violet-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Next Action
                      </label>
                      <input
                        type="text"
                        value={nextAction}
                        onChange={(e) => setNextAction(e.target.value)}
                        placeholder="e.g. Generate official PDF quotation"
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-violet-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TARGET: QUOTATION SENT */}
              {targetStatus === "Quotation Sent" && (
                <div className="space-y-3.5 rounded-xl border border-blue-100 bg-blue-50/20 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
                    <CircleDollarSign size={14} className="text-blue-600" />
                    Proposal & Quotation Dispatch Details
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Quotation Reference / No
                      </label>
                      <input
                        type="text"
                        value={quotationReference}
                        onChange={(e) => setQuotationReference(e.target.value)}
                        placeholder="e.g. QT-2026-0042"
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-violet-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Quotation Amount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={quotationAmount}
                        onChange={(e) => setQuotationAmount(e.target.value)}
                        placeholder="e.g. 150000"
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-violet-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Quotation Date
                      </label>
                      <input
                        type="date"
                        value={quotationDate}
                        onChange={(e) => setQuotationDate(e.target.value)}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-violet-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Valid Until
                      </label>
                      <input
                        type="date"
                        value={validUntil}
                        onChange={(e) => setValidUntil(e.target.value)}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-violet-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Dispatch Notes / Sent Via
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Sent via Email to CEO, copy to Accounts..."
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-violet-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Next Follow-up Action
                    </label>
                    <input
                      type="text"
                      value={nextAction}
                      onChange={(e) => setNextAction(e.target.value)}
                      placeholder="e.g. Call for review feedback in 3 days"
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-violet-600"
                    />
                  </div>
                </div>
              )}

              {/* TARGET: NEGOTIATION */}
              {targetStatus === "Negotiation" && (
                <div className="space-y-3.5 rounded-xl border border-blue-100 bg-blue-50/20 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
                    <FileText size={14} className="text-blue-600" />
                    Negotiation & Feedback
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Client Feedback Notes & Requested Adjustments
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Price concessions requested, timeline adjustments, scope trimming..."
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-violet-600"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Revised / Discussion Amount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={quotationAmount}
                        onChange={(e) => setQuotationAmount(e.target.value)}
                        placeholder="Current offer..."
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-violet-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Follow-up Date
                      </label>
                      <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-violet-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Next Action
                    </label>
                    <input
                      type="text"
                      value={nextAction}
                      onChange={(e) => setNextAction(e.target.value)}
                      placeholder="e.g. Send revised proposal with 5% discount"
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-violet-600"
                    />
                  </div>
                </div>
              )}

              {/* TARGET: APPROVED */}
              {targetStatus === "Approved" && (
                <div className="space-y-3.5 rounded-xl border border-emerald-100 bg-emerald-50/20 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    Client Approval Details
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Approved / Agreed Amount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={quotationAmount}
                        onChange={(e) => setQuotationAmount(e.target.value)}
                        placeholder="Agreed commercial value..."
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Next Action
                      </label>
                      <input
                        type="text"
                        value={nextAction}
                        onChange={(e) => setNextAction(e.target.value)}
                        placeholder="e.g. Ready for Project Handover & Kickoff"
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Approval Notes / PO Reference
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Confirmation email received, PO number, initial advance terms..."
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              )}

              {/* TARGET: REJECTED (LOST) */}
              {targetStatus === "Rejected" && (
                <div className="space-y-3.5 rounded-xl border border-rose-100 bg-rose-50/20 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-900 uppercase tracking-wider">
                    <ShieldAlert size={14} className="text-rose-600" />
                    Rejection / Lost Deal Analysis
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Reason for Rejection / Lost Reason <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={lostReason}
                      onChange={(e) => setLostReason(e.target.value)}
                      required
                      className="h-9 w-full rounded-lg border border-rose-300 bg-white px-3 text-xs text-slate-800 outline-none focus:border-rose-600"
                    >
                      <option value="">Select Primary Reason...</option>
                      {REJECTION_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Competitor (If lost to an external vendor)
                    </label>
                    <input
                      type="text"
                      value={competitor}
                      onChange={(e) => setCompetitor(e.target.value)}
                      placeholder="Competitor name or agency..."
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-rose-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Post-Mortem Remarks / Notes
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Additional learnings, future re-engagement possibility..."
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-rose-600"
                    />
                  </div>
                </div>
              )}

              {/* TARGET: ON HOLD */}
              {targetStatus === "On Hold" && (
                <div className="space-y-3.5 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                    <Clock size={14} className="text-slate-600" />
                    Place on Hold Details
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Reason for Hold <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={holdReason}
                      onChange={(e) => setHoldReason(e.target.value)}
                      required
                      className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 outline-none focus:border-slate-600"
                    >
                      <option value="">Select Reason for Delay...</option>
                      {HOLD_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Next Review / Follow-up Date
                      </label>
                      <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-slate-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Next Action
                      </label>
                      <input
                        type="text"
                        value={nextAction}
                        onChange={(e) => setNextAction(e.target.value)}
                        placeholder="e.g. Check client status next quarter"
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-slate-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Hold Remarks
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Context for placing on hold..."
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-slate-600"
                    />
                  </div>
                </div>
              )}

              {/* TARGET: ANY OTHER (NEW, ETC.) */}
              {targetStatus &&
                ![
                  "Discussion",
                  "Analysis",
                  "Estimate Pending",
                  "Quotation Pending",
                  "Quotation Sent",
                  "Negotiation",
                  "Approved",
                  "Rejected",
                  "On Hold",
                ].includes(targetStatus) && (
                  <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Reason / Notes for Stage Change
                      </label>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Notes regarding this stage change..."
                        className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Next Action
                      </label>
                      <input
                        type="text"
                        value={nextAction}
                        onChange={(e) => setNextAction(e.target.value)}
                        placeholder="Next planned action..."
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none"
                      />
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-4">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || !targetStatus || targetStatus === currentStatus}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] px-5 text-xs font-semibold text-white shadow-xs hover:bg-[#1548D1] active:bg-[#0F3DB8] disabled:opacity-50 transition"
            >
              {submitting ? (
                <>
                  <Clock size={13} className="animate-spin" />
                  <span>Updating Stage...</span>
                </>
              ) : (
                <>
                  <ArrowRightLeft size={13} />
                  <span>Confirm Stage Move</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

