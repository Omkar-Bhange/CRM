import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, RotateCcw, X, Clock, Calendar, ShieldAlert } from "lucide-react";

export default function TaskStatusModal({
  isOpen,
  task,
  targetStatus, // "Blocked" | "Completed" | "Reopen"
  onClose,
  onSubmit, // async ({ status, blockerReason, waitingFor, expectedResolutionDate, completionNote, actualMinutes, note }) => void
  loading = false,
}) {
  const [blockerReason, setBlockerReason] = useState("");
  const [waitingFor, setWaitingFor] = useState("Client");
  const [expectedResolutionDate, setExpectedResolutionDate] = useState("");
  const [completionNote, setCompletionNote] = useState("");
  const [actualMinutes, setActualMinutes] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setBlockerReason(task?.blockerReason || "");
      setWaitingFor(task?.waitingFor || "Client");
      setExpectedResolutionDate(task?.expectedResolutionDate ? String(task.expectedResolutionDate).slice(0, 10) : "");
      setCompletionNote(task?.resolutionNote || "");
      setActualMinutes(task?.spentMinutes ? String(task.spentMinutes) : "");
      setReopenReason("");
      setNote("");
      setError("");
    }
  }, [isOpen, task, targetStatus]);

  if (!isOpen || !task) return null;

  const isBlocked = targetStatus === "Blocked";
  const isCompleted = targetStatus === "Completed";
  const isReopen = targetStatus === "Reopen";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isBlocked && !blockerReason.trim()) {
      setError("Please provide a blocker reason.");
      return;
    }

    if (isReopen && !reopenReason.trim()) {
      setError("Please provide a reason for reopening this task.");
      return;
    }

    try {
      if (isBlocked) {
        await onSubmit({
          status: "Blocked",
          blockerReason: blockerReason.trim(),
          waitingFor: waitingFor.trim(),
          expectedResolutionDate: expectedResolutionDate || null,
          note: note.trim() || undefined,
        });
      } else if (isCompleted) {
        await onSubmit({
          status: "Completed",
          completionNote: completionNote.trim() || undefined,
          actualMinutes: actualMinutes ? Number(actualMinutes) : undefined,
          note: note.trim() || undefined,
        });
      } else if (isReopen) {
        await onSubmit({
          status: "In Progress",
          note: `Reopened: ${reopenReason.trim()}`,
        });
      }
    } catch (err) {
      setError(err?.message || "Failed to update task status.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${
              isBlocked
                ? "bg-rose-50 text-rose-600 ring-rose-200"
                : isCompleted
                ? "bg-emerald-50 text-emerald-600 ring-emerald-200"
                : "bg-amber-50 text-amber-600 ring-amber-200"
            }`}
          >
            {isBlocked && <ShieldAlert size={22} />}
            {isCompleted && <CheckCircle2 size={22} />}
            {isReopen && <RotateCcw size={22} />}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isBlocked && "Block Task"}
              {isCompleted && "Complete Task"}
              {isReopen && "Reopen Task"}
            </h3>
            <p className="text-xs text-slate-500">
              {task.taskCode || task.taskNo} — {task.title}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-700">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* BLOCKED FORM */}
          {isBlocked && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Blocker Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={blockerReason}
                  onChange={(e) => setBlockerReason(e.target.value)}
                  placeholder="e.g. Waiting for client's SQL backup / Dependency on payment gateway API"
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-50"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Waiting For</label>
                  <select
                    value={waitingFor}
                    onChange={(e) => setWaitingFor(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-50"
                  >
                    <option value="Client">Client</option>
                    <option value="Vendor / 3rd Party">Vendor / 3rd Party</option>
                    <option value="Internal Dependency">Internal Dependency</option>
                    <option value="Management Approval">Management Approval</option>
                    <option value="Hardware / Device">Hardware / Device</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Expected Resolution Date</label>
                  <input
                    type="date"
                    value={expectedResolutionDate}
                    onChange={(e) => setExpectedResolutionDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-800 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-50"
                  />
                </div>
              </div>
            </>
          )}

          {/* COMPLETED FORM */}
          {isCompleted && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Completion Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                  placeholder="Describe resolution or test verification details..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Actual Time Spent (minutes) <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={actualMinutes}
                  onChange={(e) => setActualMinutes(e.target.value)}
                  placeholder={task.spentMinutes ? `Current: ${task.spentMinutes} min` : "e.g. 120"}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
                />
              </div>
            </>
          )}

          {/* REOPEN FORM */}
          {isReopen && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Reason for Reopening <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="e.g. Bug resurfaced during client testing / Change in requirement..."
                className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-50"
                required
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Task will return to <strong>In Progress</strong> and this action will be logged in the activity timeline.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm transition disabled:opacity-50 ${
                isBlocked
                  ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200"
                  : isCompleted
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                  : "bg-amber-600 hover:bg-amber-700 shadow-amber-200"
              }`}
            >
              {loading && <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              {isBlocked && "Confirm Block"}
              {isCompleted && "Mark Completed"}
              {isReopen && "Reopen Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
