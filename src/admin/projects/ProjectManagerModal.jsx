import { useState, useEffect } from "react";
import { X, UserCheck, AlertCircle, Clock, ShieldCheck, UserX } from "lucide-react";
import API_URL from "../../config/api";

export default function ProjectManagerModal({
  isOpen,
  onClose,
  project,
  employees = [],
  onSuccess,
}) {
  const [selectedPmId, setSelectedPmId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen && project) {
      setSelectedPmId(project.projectManager || "");
      setErrorMessage("");
    }
  }, [isOpen, project]);

  if (!isOpen || !project) return null;

  const currentPmName = project.projectManagerName || "Unassigned";

  const getAuthToken = () =>
    localStorage.getItem("client-connect-token") ||
    sessionStorage.getItem("client-connect-token") ||
    "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      setSubmitting(true);
      const token = getAuthToken();

      const res = await fetch(
        `${API_URL}/api/admin/project/${project._id || project.id}/project-manager`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            projectManagerId: selectedPmId || null,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update Project Manager.");
      }

      if (typeof onSuccess === "function") {
        onSuccess(data.data);
      }
      onClose();
    } catch (err) {
      console.error("Assign Project Manager error:", err);
      setErrorMessage(err.message || "Unable to assign Project Manager.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <UserCheck size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {project.projectManager ? "Change Project Manager" : "Assign Project Manager"}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {project.projectCode} • {project.projectName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Current PM Display */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Current Project Manager
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">
                {currentPmName}
              </span>
              {!project.projectManager && (
                <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                  None assigned
                </span>
              )}
            </div>
          </div>

          {/* PM Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Select Project Manager
            </label>
            <select
              value={selectedPmId}
              onChange={(e) => setSelectedPmId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            >
              <option value="">— Unassigned (Clear Manager) —</option>
              {employees
                .filter((emp) => emp.id || emp._id)
                .map((emp) => {
                  const id = emp.id || emp._id;
                  return (
                    <option key={id} value={id}>
                      {emp.name} {emp.employeeCode ? `(${emp.employeeCode})` : ""} {emp.designation ? `• ${emp.designation}` : ""}
                    </option>
                  );
                })}
            </select>
            <p className="mt-1 text-[11px] text-slate-500">
              The Project Manager is responsible for overall project execution, team coordination, and client communication.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5 bg-slate-50/60">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-8.5 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 h-8.5 px-4 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition disabled:opacity-50 shadow-xs"
          >
            {submitting ? (
              <>
                <Clock size={12} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Manager</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

