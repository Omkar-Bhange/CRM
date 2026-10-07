import { useState, useEffect } from "react";
import {
  X,
  ArrowRightLeft,
  CircleDollarSign,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  FileText,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Layers,
  Sparkles,
  RefreshCw,
  Send,
  HelpCircle,
  Tag,
  ArrowRight,
} from "lucide-react";
import API_URL from "../../config/api";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function money(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
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

function getPriorityBadgeStyle(priority) {
  switch (priority) {
    case "Critical":
      return "bg-rose-50 text-rose-700 ring-rose-600/20";
    case "High":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";
    case "Medium":
      return "bg-blue-50 text-blue-700 ring-blue-600/20";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-500/20";
  }
}

export default function RequirementDetailsDrawer({
  isOpen,
  onClose,
  requirement,
  onOpenMoveModal,
  onOpenConvertProject,
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [details, setDetails] = useState(requirement);
  const [loading, setLoading] = useState(false);

  const getAuthToken = () =>
    localStorage.getItem("client-connect-token") ||
    sessionStorage.getItem("client-connect-token") ||
    "";

  // Fetch full requirement on open to get latest timeline entries
  const fetchLatestDetails = async () => {
    if (!requirement) return;
    const reqId = requirement._id || requirement.id;
    if (!reqId) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/requirement/${reqId}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      const result = await res.json();
      if (res.ok && result.success && result.data) {
        setDetails(result.data);
      }
    } catch (e) {
      console.error("Failed to load requirement details:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && requirement) {
      setDetails(requirement);
      fetchLatestDetails();
    }
  }, [isOpen, requirement?._id, requirement?.id, requirement?.updatedAt]);

  if (!isOpen || !requirement) return null;

  const currentItem = details || requirement;
  const timeline = Array.isArray(currentItem.timeline) ? currentItem.timeline : [];
  const reversedTimeline = [...timeline].reverse();

  const customerName =
    currentItem.sourceType === "Existing Client"
      ? currentItem.clientName || "Existing Client"
      : currentItem.prospectCompany || currentItem.prospectName || "Prospect";

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close requirement details"
        onClick={onClose}
        className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-[2px]"
      />

      {/* Side Drawer */}
      <aside className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-[720px] flex-col bg-white shadow-[-24px_0_70px_rgba(15,23,42,0.18)] animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-violet-600">
                  {currentItem.requirementCode}
                </span>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getStatusBadgeStyle(
                    currentItem.status
                  )}`}
                >
                  {currentItem.status}
                </span>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${getPriorityBadgeStyle(
                    currentItem.priority
                  )}`}
                >
                  {currentItem.priority || "Medium"}
                </span>
              </div>

              <h2 className="mt-1 text-base font-bold text-slate-900 leading-snug">
                {currentItem.title}
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {currentItem.status !== "Converted to Project" && onOpenMoveModal && (
                <button
                  type="button"
                  onClick={() => onOpenMoveModal(currentItem)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition"
                >
                  <ArrowRightLeft size={13} className="text-violet-600" />
                  <span>Move Stage</span>
                </button>
              )}

              {currentItem.status === "Approved" && onOpenConvertProject && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenConvertProject(currentItem);
                  }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
                >
                  <CircleDollarSign size={13} />
                  <span>Convert to Project</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-4 flex gap-6 border-b border-slate-100 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`pb-2.5 transition border-b-2 ${
                activeTab === "overview"
                  ? "border-violet-600 text-violet-700 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Overview & Specifications
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("activity")}
              className={`flex items-center gap-1.5 pb-2.5 transition border-b-2 ${
                activeTab === "activity"
                  ? "border-violet-600 text-violet-700 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Activity & Timeline</span>
              {timeline.length > 0 && (
                <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600 font-mono">
                  {timeline.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "overview" && (
            <>
              {/* Highlight Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Source
                  </span>
                  <p className="mt-0.5 text-xs font-bold text-slate-800 truncate">
                    {currentItem.sourceType || "Existing Client"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Quoted Amount
                  </span>
                  <p className="mt-0.5 text-xs font-bold text-slate-900">
                    {money(currentItem.quotedAmount)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Expected Delivery
                  </span>
                  <p className="mt-0.5 text-xs font-semibold text-slate-800">
                    {formatDate(currentItem.expectedDeliveryDate)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Type
                  </span>
                  <p className="mt-0.5 text-xs font-semibold text-slate-800 truncate">
                    {currentItem.requirementType || "—"}
                  </p>
                </div>
              </div>

              {/* Status Specific Banners */}
              {currentItem.status === "Rejected" && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert size={18} className="text-rose-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-bold text-rose-900">
                        Deal Lost / Rejected: {currentItem.lostReason || "No reason recorded"}
                      </p>
                      {currentItem.competitor && (
                        <p className="mt-0.5 text-rose-700">
                          Won by competitor: <span className="font-semibold">{currentItem.competitor}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {currentItem.status === "On Hold" && (
                <div className="rounded-xl border border-slate-200 bg-slate-100/70 p-4">
                  <div className="flex items-start gap-2.5">
                    <Clock size={18} className="text-slate-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-bold text-slate-900">
                        On Hold: {currentItem.holdReason || "No specific reason recorded"}
                      </p>
                      {currentItem.followUpDate && (
                        <p className="mt-0.5 text-slate-600">
                          Scheduled for review on:{" "}
                          <span className="font-semibold">{formatDate(currentItem.followUpDate)}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Client / Prospect Section */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Building2 size={13} className="text-violet-600" />
                  Client & Contact Information
                </h3>

                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Entity / Company</span>
                    <span className="font-bold text-slate-800">{customerName}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Contact Person</span>
                    <span className="font-medium text-slate-800">
                      {currentItem.contactPerson || currentItem.prospectName || "—"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Phone / Mobile</span>
                    <span className="font-medium text-slate-800">
                      {currentItem.prospectMobile || "—"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Email</span>
                    <span className="font-medium text-slate-800">
                      {currentItem.prospectEmail || "—"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">City / Location</span>
                    <span className="font-medium text-slate-800">
                      {currentItem.prospectCity || "—"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Contact Method</span>
                    <span className="font-medium text-slate-800">
                      {currentItem.contactMethod || currentItem.source || "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Requirement Scope & Specification */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <FileText size={13} className="text-violet-600" />
                  Scope & Requirements
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-1">
                      Detailed Description
                    </span>
                    <div className="rounded-lg bg-slate-50 p-3 text-slate-800 whitespace-pre-wrap leading-relaxed border border-slate-100">
                      {currentItem.description || "No description provided."}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Assigned Lead / Analyst</span>
                      <span className="font-semibold text-slate-800">
                        {currentItem.assignedEmployeeName || "Unassigned"}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Estimated Budget</span>
                      <span className="font-semibold text-slate-800">
                        {money(currentItem.estimatedBudget)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quotation & Commercial Details */}
              {(currentItem.quotationNo ||
                currentItem.quotationReference ||
                currentItem.quotedAmount ||
                currentItem.quotationDate) && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <CircleDollarSign size={13} className="text-blue-600" />
                    Quotation & Commercial Terms
                  </h3>

                  <div className="grid gap-3 sm:grid-cols-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Quotation Ref</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {currentItem.quotationReference || currentItem.quotationNo || "—"}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Quotation Date</span>
                      <span className="font-medium text-slate-800">
                        {formatDate(currentItem.quotationDate)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Quoted Amount</span>
                      <span className="font-bold text-slate-900">
                        {money(currentItem.quotedAmount)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Valid Until</span>
                      <span className="font-medium text-slate-800">
                        {formatDate(currentItem.validUntil)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Next Action & Follow-up */}
              {(currentItem.nextAction || currentItem.followUpDate || currentItem.notes) && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <Clock size={13} className="text-amber-600" />
                    Next Action & Follow-up
                  </h3>

                  <div className="space-y-2.5 text-xs">
                    {currentItem.nextAction && (
                      <div className="flex items-start gap-2">
                        <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
                          Next Action
                        </span>
                        <span className="font-semibold text-slate-800">{currentItem.nextAction}</span>
                      </div>
                    )}

                    {currentItem.followUpDate && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-[11px]">Scheduled Date:</span>
                        <span className="font-semibold text-slate-800">
                          {formatDate(currentItem.followUpDate)}
                        </span>
                      </div>
                    )}

                    {currentItem.notes && (
                      <div>
                        <span className="text-slate-400 block text-[11px] mb-1">Remarks / Notes</span>
                        <div className="rounded-lg bg-slate-50 p-2.5 text-slate-700 text-xs border border-slate-100">
                          {currentItem.notes}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* System Audit Information */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-[11px] text-slate-500 flex flex-wrap justify-between gap-2">
                <span>
                  Created by <strong className="text-slate-700">{currentItem.createdByName || "Admin"}</strong> on{" "}
                  {formatDateTime(currentItem.createdAt)}
                </span>
                {currentItem.updatedAt && (
                  <span>
                    Updated: {formatDateTime(currentItem.updatedAt)} by{" "}
                    <strong className="text-slate-700">{currentItem.updatedByName || "Admin"}</strong>
                  </span>
                )}
              </div>
            </>
          )}

          {/* Activity & Timeline Tab */}
          {activeTab === "activity" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Workflow Activity History
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Chronological audit trail of stage movements, discussions, and updates.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fetchLatestDetails}
                  disabled={loading}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                  title="Refresh Timeline"
                >
                  <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                </button>
              </div>

              {reversedTimeline.length === 0 ? (
                /* Empty state for older records without timeline entries */
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/40">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Clock size={18} />
                  </div>
                  <h4 className="mt-3 text-xs font-bold text-slate-800">
                    No stage transitions recorded yet
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                    This requirement was originally recorded on {formatDate(currentItem.createdAt)}.
                    Future stage movements made via "Move Stage" will be tracked chronologically here.
                  </p>
                </div>
              ) : (
                /* Vertical Timeline */
                <div className="relative pl-6 space-y-6 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-[2px] before:bg-slate-200">
                  {reversedTimeline.map((item, index) => {
                    const isNewest = index === 0;
                    return (
                      <div key={item._id || index} className="relative group">
                        {/* Timeline Bullet */}
                        <div
                          className={`absolute -left-[19px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${
                            isNewest
                              ? "bg-violet-600 shadow-xs"
                              : "bg-slate-300 group-hover:bg-slate-400"
                          }`}
                        />

                        {/* Content Card */}
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-slate-300 transition">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold text-slate-900">
                                {item.action || "Stage Movement"}
                              </p>

                              {item.oldStatus && item.newStatus && (
                                <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                                  <span
                                    className={`inline-flex rounded-full border px-2 py-0.2 font-semibold ${getStatusBadgeStyle(
                                      item.oldStatus
                                    )}`}
                                  >
                                    {item.oldStatus}
                                  </span>
                                  <ArrowRight size={11} className="text-slate-400" />
                                  <span
                                    className={`inline-flex rounded-full border px-2 py-0.2 font-semibold ${getStatusBadgeStyle(
                                      item.newStatus
                                    )}`}
                                  >
                                    {item.newStatus}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="text-right shrink-0">
                              <span className="block text-[10px] text-slate-400 font-mono">
                                {formatDateTime(item.createdAt)}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-600">
                                by {item.performedByName || "Admin"}
                              </span>
                            </div>
                          </div>

                          {/* Remarks / Notes */}
                          {item.notes && (
                            <div className="mt-2.5 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-700 leading-relaxed border border-slate-100">
                              {item.notes}
                            </div>
                          )}

                          {/* Next Action & Follow-up */}
                          {(item.nextAction || item.followUpDate) && (
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                              {item.nextAction && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-amber-800 font-semibold border border-amber-200">
                                  <span>Next:</span> {item.nextAction}
                                </span>
                              )}
                              {item.followUpDate && (
                                <span className="inline-flex items-center gap-1 text-slate-500">
                                  <Calendar size={11} />
                                  Follow-up: {formatDate(item.followUpDate)}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Metadata Tags */}
                          {item.metadata && Object.keys(item.metadata).length > 0 && (
                            <div className="mt-2.5 flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 text-[10px]">
                              {item.metadata.contactMethod && (
                                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-600">
                                  Via: {item.metadata.contactMethod}
                                </span>
                              )}
                              {item.metadata.contactPerson && (
                                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-600">
                                  Person: {item.metadata.contactPerson}
                                </span>
                              )}
                              {item.metadata.quotationReference && (
                                <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-blue-700 font-mono font-medium">
                                  Quote #{item.metadata.quotationReference}
                                </span>
                              )}
                              {item.metadata.quotationAmount > 0 && (
                                <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-emerald-700 font-medium">
                                  {money(item.metadata.quotationAmount)}
                                </span>
                              )}
                              {item.metadata.lostReason && (
                                <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-rose-700 font-medium">
                                  Lost Reason: {item.metadata.lostReason}
                                </span>
                              )}
                              {item.metadata.competitor && (
                                <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-rose-700 font-medium">
                                  Competitor: {item.metadata.competitor}
                                </span>
                              )}
                              {item.metadata.holdReason && (
                                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-700 font-medium">
                                  Hold Reason: {item.metadata.holdReason}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

