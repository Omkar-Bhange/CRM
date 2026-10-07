import { useState, useEffect } from "react";
import {
  X,
  ArrowRight,
  ArrowRightLeft,
  Calendar,
  User,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  Users,
  ListTodo,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import API_URL from "../../config/api";

export const PROJECT_STAGES = [
  "Planning",
  "Team Assigned",
  "Tasks Created",
  "In Progress",
  "Testing / Review",
  "Client Review",
  "Completed",
  "Closed",
];

export const BUSINESS_STATUSES = [
  "Planned",
  "Active",
  "On Hold",
  "Completed",
  "Cancelled",
];

export function getStageStyle(stage) {
  switch (stage) {
    case "Planning":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "Team Assigned":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "Tasks Created":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "In Progress":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Testing / Review":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Client Review":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "Completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Closed":
      return "bg-teal-50 text-teal-800 border-teal-300";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export function getBusinessStatusStyle(status) {
  switch (status) {
    case "Active":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Completed":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "On Hold":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Cancelled":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "Planned":
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export function getProjectWorkflowRecommendations(currentStage) {
  switch (currentStage) {
    case "Planning":
      return {
        recommended: ["Team Assigned"],
        alternatives: ["In Progress", "Tasks Created"],
        hint: "Form the project team and designate the Project Manager.",
      };
    case "Team Assigned":
      return {
        recommended: ["Tasks Created"],
        alternatives: ["Planning", "In Progress"],
        hint: "Define and assign initial project tasks to team members.",
      };
    case "Tasks Created":
      return {
        recommended: ["In Progress"],
        alternatives: ["Team Assigned", "Testing / Review"],
        hint: "Work has commenced on project tasks.",
      };
    case "In Progress":
      return {
        recommended: ["Testing / Review"],
        alternatives: ["Tasks Created", "Client Review"],
        hint: "Development or execution is ready for QA, testing, and internal review.",
      };
    case "Testing / Review":
      return {
        recommended: ["Client Review"],
        alternatives: ["In Progress", "Completed"],
        hint: "Testing passed; ready for client demonstration, UAT, or inspection.",
      };
    case "Client Review":
      return {
        recommended: ["Completed"],
        alternatives: ["Testing / Review", "In Progress"],
        hint: "Client approval received; ready for delivery, handover, and completion.",
      };
    case "Completed":
      return {
        recommended: ["Closed"],
        alternatives: ["Client Review", "In Progress"],
        hint: "Warranty/closure sign-off finished; mark project as Closed.",
      };
    case "Closed":
      return {
        recommended: [],
        alternatives: ["In Progress", "Completed"],
        hint: "Project is fully closed and archived.",
      };
    default:
      return {
        recommended: ["Team Assigned"],
        alternatives: PROJECT_STAGES.filter((s) => s !== currentStage),
        hint: "Advance project to the next operational stage.",
      };
  }
}

export default function ProjectTransitionModal({
  isOpen,
  onClose,
  project,
  onSuccess,
}) {
  const currentStage = project?.stage || "Planning";
  const currentStatus = project?.status || "Planned";

  const workflow = getProjectWorkflowRecommendations(currentStage);

  const [targetStage, setTargetStage] = useState(
    workflow.recommended[0] || currentStage
  );
  const [targetStatus, setTargetStatus] = useState(currentStatus);

  // Dynamic stage fields
  const [notes, setNotes] = useState("");
  const [testingOwner, setTestingOwner] = useState("");
  const [testingNotes, setTestingNotes] = useState("");
  const [clientReviewDate, setClientReviewDate] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [pendingItems, setPendingItems] = useState("");
  const [closureNotes, setClosureNotes] = useState("");
  const [closureDate, setClosureDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen && project) {
      const wf = getProjectWorkflowRecommendations(project.stage || "Planning");
      setTargetStage(wf.recommended[0] || project.stage || "Planning");
      setTargetStatus(project.status || "Planned");
      setNotes("");
      setTestingOwner(project.projectManagerName || "");
      setTestingNotes("");
      setClientReviewDate("");
      setReviewNotes("");
      setCompletionNotes("");
      setPendingItems("");
      setClosureNotes("");
      setClosureDate(new Date().toISOString().split("T")[0]);
      setErrorMessage("");
    }
  }, [isOpen, project]);

  if (!isOpen || !project) return null;

  const getAuthToken = () =>
    localStorage.getItem("client-connect-token") ||
    sessionStorage.getItem("client-connect-token") ||
    "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (targetStage === currentStage && targetStatus === currentStatus) {
      setErrorMessage("Please select a different stage or status to move the project.");
      return;
    }

    try {
      setSubmitting(true);
      const token = getAuthToken();

      const payload = {
        stage: targetStage,
        status: targetStatus,
        notes: notes.trim(),
      };

      if (targetStage === "Testing / Review") {
        if (testingOwner) payload.testingOwner = testingOwner.trim();
        if (testingNotes) payload.notes = testingNotes.trim() + (notes ? ` | ${notes.trim()}` : "");
      } else if (targetStage === "Client Review") {
        if (clientReviewDate) payload.clientReviewDate = clientReviewDate;
        if (reviewNotes) payload.notes = reviewNotes.trim() + (notes ? ` | ${notes.trim()}` : "");
      } else if (targetStage === "Completed") {
        if (completionNotes) payload.completionNotes = completionNotes.trim();
        if (pendingItems) payload.notes = `Pending: ${pendingItems.trim()}` + (notes ? ` | ${notes.trim()}` : "");
      } else if (targetStage === "Closed") {
        if (closureNotes) payload.closureNotes = closureNotes.trim();
        if (closureDate) payload.closureDate = closureDate;
      }

      const res = await fetch(`${API_URL}/api/admin/project/${project._id || project.id}/stage-transition`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update project stage.");
      }

      if (typeof onSuccess === "function") {
        onSuccess(data.data || { ...project, stage: targetStage, status: targetStatus });
      }
      onClose();
    } catch (err) {
      console.error("Project stage transition error:", err);
      setErrorMessage(err.message || "Unable to update project stage.");
    } finally {
      setSubmitting(false);
    }
  };

  const isRecommended = workflow.recommended.includes(targetStage);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <ArrowRightLeft size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Move Project Stage
                </h3>
                <span className="font-mono text-xs font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100">
                  {project.projectCode}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-[380px]">
                {project.projectName} • {project.clientName || "Internal"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Current vs Target Comparison Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Current Position
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-semibold ${getStageStyle(
                      currentStage
                    )}`}
                  >
                    Stage: {currentStage}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold ${getBusinessStatusStyle(
                      currentStatus
                    )}`}
                  >
                    Status: {currentStatus}
                  </span>
                </div>
              </div>

              <div className="md:border-l md:border-slate-200 md:pl-4">
                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  Target Stage
                  {isRecommended && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-semibold lowercase bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      <Sparkles size={10} /> recommended
                    </span>
                  )}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-bold ${getStageStyle(
                      targetStage
                    )}`}
                  >
                    Stage: {targetStage}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold ${getBusinessStatusStyle(
                      targetStatus
                    )}`}
                  >
                    Status: {targetStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Select Target Stage */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Select Workflow Stage
            </label>

            {/* Quick Recommended Buttons */}
            {workflow.recommended.length > 0 && (
              <div className="mb-2.5">
                <span className="block text-[11px] font-medium text-slate-500 mb-1">
                  Recommended Next:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {workflow.recommended.map((stg) => (
                    <button
                      key={stg}
                      type="button"
                      onClick={() => {
                        setTargetStage(stg);
                        if (["In Progress", "Testing / Review", "Client Review"].includes(stg) && currentStatus === "Planned") {
                          setTargetStatus("Active");
                        } else if (["Completed", "Closed"].includes(stg)) {
                          setTargetStatus("Completed");
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        targetStage === stg
                          ? "bg-violet-600 text-white border-violet-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:border-violet-300 hover:bg-violet-50/50"
                      }`}
                    >
                      <ArrowRight size={13} />
                      {stg}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* All Stage Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {PROJECT_STAGES.map((stg) => {
                const isCurrent = stg === currentStage;
                const isSelected = stg === targetStage;
                return (
                  <button
                    key={stg}
                    type="button"
                    onClick={() => {
                      setTargetStage(stg);
                      if (["In Progress", "Testing / Review", "Client Review"].includes(stg) && currentStatus === "Planned") {
                        setTargetStatus("Active");
                      } else if (["Completed", "Closed"].includes(stg)) {
                        setTargetStatus("Completed");
                      }
                    }}
                    className={`text-left p-2 rounded-lg border text-xs transition ${
                      isSelected
                        ? "border-violet-600 bg-violet-50/60 font-semibold text-violet-900 ring-1 ring-violet-600"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    } ${isCurrent ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{stg}</span>
                      {isCurrent && (
                        <span className="text-[9px] text-slate-400 font-normal">
                          (current)
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {workflow.hint && (
              <p className="mt-1.5 text-[11px] text-slate-500 italic flex items-center gap-1">
                <Sparkles size={11} className="text-violet-500 shrink-0" />
                {workflow.hint}
              </p>
            )}
          </div>

          {/* Business Status Alignment (Separate concept) */}
          <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/30">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Business Status Alignment
              </label>
              <span className="text-[10px] text-slate-400">
                (Business Status vs Workflow Stage are distinct)
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {BUSINESS_STATUSES.map((st) => (
                <label
                  key={st}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs cursor-pointer transition ${
                    targetStatus === st
                      ? "bg-slate-900 text-white border-slate-900 font-semibold"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="projectStatus"
                    value={st}
                    checked={targetStatus === st}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    className="sr-only"
                  />
                  <span>{st}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Dynamic Stage-Specific Fields */}
          {targetStage === "Team Assigned" && (
            <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-900">
                <Users size={15} />
                Stage Requirements: Team Allocation
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-sky-100">
                  <span className="text-slate-500 block text-[11px]">Project Manager:</span>
                  <span className="font-semibold text-slate-800">
                    {project.projectManagerName || "Unassigned"}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-sky-100">
                  <span className="text-slate-500 block text-[11px]">Allocated Team Members:</span>
                  <span className="font-semibold text-slate-800">
                    {Array.isArray(project.teamMembers) ? project.teamMembers.length : 0} members
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-sky-700">
                Tip: You can assign the Project Manager and team members from the Project Details workspace.
              </p>
            </div>
          )}

          {targetStage === "Tasks Created" && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                <ListTodo size={15} />
                Stage Requirements: Task Breakdown
              </div>
              <p className="text-xs text-indigo-800">
                Project team is in place. Work packages and individual assignments should now be created.
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-indigo-100">
                <span>Team: <strong>{Array.isArray(project.teamMembers) ? project.teamMembers.length : 0} members</strong></span>
                <span>•</span>
                <span>Current Tasks: <strong>{project.totalTasks || 0} tasks</strong></span>
              </div>
            </div>
          )}

          {targetStage === "Testing / Review" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <ShieldCheck size={15} />
                Quality Assurance & Review Details
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Testing Owner / Lead
                </label>
                <input
                  type="text"
                  value={testingOwner}
                  onChange={(e) => setTestingOwner(e.target.value)}
                  placeholder="e.g. Omkar (QA Lead)"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Testing Scope & Checklist Notes
                </label>
                <textarea
                  rows={2}
                  value={testingNotes}
                  onChange={(e) => setTestingNotes(e.target.value)}
                  placeholder="e.g. UAT build deployed on staging, regression passed, core APIs verified..."
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>
          )}

          {targetStage === "Client Review" && (
            <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
                <Calendar size={15} />
                Client Demonstration & UAT Review
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Client Review / Demo Date
                  </label>
                  <input
                    type="date"
                    value={clientReviewDate}
                    onChange={(e) => setClientReviewDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Client Review Observations & Notes
                </label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g. Walkthrough conducted with client stakeholders, minor changes requested in reports..."
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>
          )}

          {targetStage === "Completed" && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <CheckCircle2 size={15} />
                Project Completion & Handover
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Completion / Delivery Summary
                </label>
                <textarea
                  rows={2}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="e.g. Project delivered, live deployment completed, training given to client team..."
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Pending Observations / Follow-up Items (if any)
                </label>
                <input
                  type="text"
                  value={pendingItems}
                  onChange={(e) => setPendingItems(e.target.value)}
                  placeholder="e.g. Warranty handover document pending signature..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>
          )}

          {targetStage === "Closed" && (
            <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-900">
                <ShieldCheck size={15} />
                Final Project Closure & Archival
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Closure Date
                  </label>
                  <input
                    type="date"
                    value={closureDate}
                    onChange={(e) => setClosureDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Closure Notes
                </label>
                <textarea
                  rows={2}
                  value={closureNotes}
                  onChange={(e) => setClosureNotes(e.target.value)}
                  placeholder="e.g. Final sign-off received from client. All deliverables archived..."
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>
          )}

          {/* General Transition Remarks */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Transition Remarks / Activity Notes (optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Stage moved after sprint demo approval..."
              className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3.5 bg-slate-50/60">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 h-9 px-5 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition disabled:opacity-50 shadow-xs"
          >
            {submitting ? (
              <>
                <Clock size={13} className="animate-spin" />
                <span>Moving Stage...</span>
              </>
            ) : (
              <>
                <span>Confirm Move to {targetStage}</span>
                <ArrowRight size={13} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

