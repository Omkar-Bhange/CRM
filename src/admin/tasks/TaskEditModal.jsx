import { useState, useEffect } from "react";
import { X, AlertCircle, Edit2, FolderKanban } from "lucide-react";
import API_URL from "../../config/api";

function estimatedTimeToMinutes(raw) {
  if (!raw || typeof raw !== "string") return 0;
  const val = raw.trim().toLowerCase();
  if (!val) return 0;
  let totalMinutes = 0;
  const hoursMatch = val.match(/(\d+(\.\d+)?)\s*h/);
  const minutesMatch = val.match(/(\d+)\s*m/);
  if (hoursMatch) totalMinutes += parseFloat(hoursMatch[1]) * 60;
  if (minutesMatch) totalMinutes += parseInt(minutesMatch[1], 10);
  if (!hoursMatch && !minutesMatch) {
    const num = parseFloat(val);
    if (!isNaN(num)) totalMinutes = num * 60;
  }
  return Math.round(totalMinutes);
}

export default function TaskEditModal({
  isOpen,
  task,
  onClose,
  projects = [],
  employees = [],
  clients = [],
  onTaskUpdated,
  getAuthToken,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [assignedEmployeeId, setAssignedEmployeeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setPriority(task.priority || "Medium");
      setDueDate(task.dueDateValue || (task.dueDate ? String(task.dueDate).slice(0, 10) : ""));
      setEstimatedTime(task.estimatedTime || (task.estimatedMinutes ? `${Math.round(task.estimatedMinutes / 60)}h` : "2h"));
      setAssignedEmployeeId(task.assignedEmployeeId || "");
      setError("");
    }
  }, [isOpen, task]);

  if (!isOpen || !task) return null;

  const linkedProject = projects.find((p) => String(p._id || p.id) === String(task.projectId));
  const projectTeamMemberIds = new Set(
    (linkedProject?.teamMembers || [])
      .filter((m) => m.status === "Active" || !m.status)
      .map((m) => String(m.employeeId))
  );

  const projectTeamEmployees = employees.filter((e) => projectTeamMemberIds.has(String(e.id || e._id)));
  const otherEmployees = employees.filter((e) => !projectTeamMemberIds.has(String(e.id || e._id)));

  const isOutsideTeam =
    task.projectId &&
    assignedEmployeeId &&
    !projectTeamMemberIds.has(String(assignedEmployeeId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }
    if (!dueDate) {
      setError("Due date is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const estimatedMinutes = estimatedTimeToMinutes(estimatedTime);

      const res = await fetch(`${API_URL}/api/admin/task/${task.id || task._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          priority,
          dueDate,
          estimatedMinutes,
          assignedEmployeeId: assignedEmployeeId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to update task.");

      onTaskUpdated(data.data);
      onClose();
    } catch (err) {
      setError(err.message || "Server error updating task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-200">
            <Edit2 size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Edit Task</h3>
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
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Assigned Employee {linkedProject ? "(Project Team Prioritized)" : ""}
            </label>
            <select
              value={assignedEmployeeId}
              onChange={(e) => setAssignedEmployeeId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
            >
              <option value="">Leave Unassigned</option>
              {linkedProject && projectTeamEmployees.length > 0 && (
                <optgroup label="⭐ PROJECT TEAM">
                  {projectTeamEmployees.map((emp) => (
                    <option key={emp.id || emp._id} value={emp.id || emp._id}>
                      {emp.name} ({emp.employeeCode})
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup
                label={linkedProject && projectTeamEmployees.length > 0 ? "OTHER EMPLOYEES" : "ACTIVE EMPLOYEES"}
              >
                {(linkedProject && projectTeamEmployees.length > 0 ? otherEmployees : employees).map((emp) => (
                  <option key={emp.id || emp._id} value={emp.id || emp._id}>
                    {emp.name} ({emp.employeeCode})
                  </option>
                ))}
              </optgroup>
            </select>
            {isOutsideTeam && (
              <p className="mt-1.5 text-[11px] text-amber-800 flex items-center gap-1">
                <AlertCircle size={13} className="text-amber-600" />
                This employee is not currently part of the Project Team.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-800 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Estimated Time</label>
              <input
                type="text"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                placeholder="e.g. 2h / 45m"
                className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
            />
          </div>

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
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-violet-700 transition disabled:opacity-50"
            >
              {loading && <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
