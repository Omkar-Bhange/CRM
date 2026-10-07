import { useState, useEffect } from "react";
import {
  X,
  AlertCircle,
  FolderKanban,
  UserCheck,
  Calendar,
  Clock,
  BriefcaseBusiness,
  Building,
  CheckCircle2,
  Users,
} from "lucide-react";
import API_URL from "../../config/api";

function estimatedTimeToMinutes(raw) {
  if (!raw || typeof raw !== "string") return 0;
  const val = raw.trim().toLowerCase();
  if (!val) return 0;

  // e.g. "2h 30m", "2h", "45m", "1.5"
  let totalMinutes = 0;
  const hoursMatch = val.match(/(\d+(\.\d+)?)\s*h/);
  const minutesMatch = val.match(/(\d+)\s*m/);

  if (hoursMatch) {
    totalMinutes += parseFloat(hoursMatch[1]) * 60;
  }
  if (minutesMatch) {
    totalMinutes += parseInt(minutesMatch[1], 10);
  }

  if (!hoursMatch && !minutesMatch) {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      totalMinutes = num * 60;
    }
  }

  return Math.round(totalMinutes);
}

export default function TaskCreateModal({
  isOpen,
  onClose,
  initialProject = null,
  initialStatus = "Assigned",
  projects = [],
  employees = [],
  clients = [],
  products = [],
  onTaskCreated,
  getAuthToken,
}) {
  const [title, setTitle] = useState("");
  const [taskFor, setTaskFor] = useState("Project"); // "Project" | "Product" | "General"
  const [projectId, setProjectId] = useState("");
  const [clientId, setClientId] = useState("");
  const [productId, setProductId] = useState("");
  const [generalTaskFor, setGeneralTaskFor] = useState("");
  const [assignedEmployeeId, setAssignedEmployeeId] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [status, setStatus] = useState("Assigned");
  const [dueDate, setDueDate] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("2h");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setError("");
      setStatus(initialStatus || "Assigned");
      setPriority("Medium");
      setEstimatedTime("2h");
      setDescription("");

      // Default due date: tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDueDate(tomorrow.toISOString().slice(0, 10));

      if (initialProject) {
        setTaskFor("Project");
        setProjectId(String(initialProject._id || initialProject.id));
        setClientId(String(initialProject.clientId || ""));
      } else {
        setTaskFor("Project");
        setProjectId("");
        setClientId("");
      }
      setProductId("");
      setGeneralTaskFor("");
      setAssignedEmployeeId("");
    }
  }, [isOpen, initialProject, initialStatus]);

  if (!isOpen) return null;

  // Selected project resolution
  const selectedProject = projects.find((p) => String(p._id || p.id) === String(projectId));

  // Auto-fill client when project is selected
  const handleProjectChange = (projId) => {
    setProjectId(projId);
    const proj = projects.find((p) => String(p._id || p.id) === String(projId));
    if (proj?.clientId) {
      setClientId(String(proj.clientId));
    }
  };

  // Identify Project Team members
  const projectTeamMemberIds = new Set(
    (selectedProject?.teamMembers || [])
      .filter((m) => m.status === "Active" || !m.status)
      .map((m) => String(m.employeeId))
  );

  const projectTeamEmployees = employees.filter((e) =>
    projectTeamMemberIds.has(String(e.id || e._id))
  );
  const otherEmployees = employees.filter(
    (e) => !projectTeamMemberIds.has(String(e.id || e._id))
  );

  const isOutsideTeam =
    taskFor === "Project" &&
    projectId &&
    assignedEmployeeId &&
    !projectTeamMemberIds.has(String(assignedEmployeeId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Please enter a task title.");
      return;
    }
    if (taskFor === "Project" && !projectId) {
      setError("Please select a project.");
      return;
    }
    if (taskFor === "Product" && !productId) {
      setError("Please select a product.");
      return;
    }
    if (taskFor === "General" && !generalTaskFor.trim()) {
      setError("Please specify what this general task is for.");
      return;
    }
    if (!dueDate) {
      setError("Please select a due date.");
      return;
    }

    const estimatedMinutes = estimatedTimeToMinutes(estimatedTime);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      taskFor,
      projectId: taskFor === "Project" ? projectId : null,
      productId: taskFor === "Product" ? productId : null,
      generalTaskFor: taskFor === "General" ? generalTaskFor.trim() : "",
      clientId: clientId || null,
      assignedEmployeeId: assignedEmployeeId || null,
      priority,
      status,
      dueDate,
      estimatedMinutes,
    };

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create task.");
      }

      onTaskCreated(data.data);
      onClose();
    } catch (err) {
      setError(err.message || "Server error creating task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10">
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
            <FolderKanban size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Create New Task</h3>
            <p className="text-xs text-slate-500">Add an assignment with priority and schedule.</p>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-700">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* TITLE */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement user authentication module"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
              required
            />
          </div>

          {/* SCOPE SELECTOR */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Task Scope</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "Project", label: "Project Task" },
                { id: "Product", label: "Product Task" },
                { id: "General", label: "General" },
              ].map((scope) => (
                <button
                  key={scope.id}
                  type="button"
                  onClick={() => setTaskFor(scope.id)}
                  className={`rounded-xl border py-2 text-xs font-semibold transition ${
                    taskFor === scope.id
                      ? "border-violet-600 bg-violet-50 text-violet-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {scope.label}
                </button>
              ))}
            </div>
          </div>

          {/* SCOPE DETAILS */}
          {taskFor === "Project" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Select Project <span className="text-rose-500">*</span>
                </label>
                <select
                  value={projectId}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
                  required
                >
                  <option value="">Select a Project</option>
                  {projects.map((p) => (
                    <option key={p._id || p.id} value={p._id || p.id}>
                      {p.name || p.projectName} ({p.projectCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Client</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
                >
                  <option value="">Internal Development / Auto</option>
                  {clients.map((c) => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.companyName || c.clientName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {taskFor === "Product" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Select Product <span className="text-rose-500">*</span>
                </label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
                  required
                >
                  <option value="">Select a Product</option>
                  {products.map((p) => (
                    <option key={p._id || p.id} value={p._id || p.id}>
                      {p.name || p.productName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Client (Optional)</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
                >
                  <option value="">Internal Development</option>
                  {clients.map((c) => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.companyName || c.clientName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {taskFor === "General" && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                General Task Context <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={generalTaskFor}
                onChange={(e) => setGeneralTaskFor(e.target.value)}
                placeholder="e.g. Office network maintenance / Server upgrade"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
                required
              />
            </div>
          )}

          {/* ASSIGNEE SELECTOR (PROJECT TEAM PRIORITIZED) */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Assigned To {taskFor === "Project" && projectId ? "(Project Team Prioritized)" : ""}
            </label>
            <select
              value={assignedEmployeeId}
              onChange={(e) => setAssignedEmployeeId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
            >
              <option value="">Leave Unassigned (or auto-assign)</option>
              {taskFor === "Project" && projectId && projectTeamEmployees.length > 0 && (
                <optgroup label="⭐ PROJECT TEAM">
                  {projectTeamEmployees.map((emp) => (
                    <option key={emp.id || emp._id} value={emp.id || emp._id}>
                      {emp.name} ({emp.employeeCode})
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup
                label={
                  taskFor === "Project" && projectId && projectTeamEmployees.length > 0
                    ? "OTHER EMPLOYEES"
                    : "ACTIVE EMPLOYEES"
                }
              >
                {(taskFor === "Project" && projectId && projectTeamEmployees.length > 0
                  ? otherEmployees
                  : employees
                ).map((emp) => (
                  <option key={emp.id || emp._id} value={emp.id || emp._id}>
                    {emp.name} ({emp.employeeCode})
                  </option>
                ))}
              </optgroup>
            </select>

            {/* CONTEXT WARNING IF OUTSIDE TEAM */}
            {isOutsideTeam && (
              <div className="mt-2 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-[11px] text-amber-900">
                <div className="flex items-center gap-1.5">
                  <AlertCircle size={14} className="text-amber-600 shrink-0" />
                  <span>This employee is not currently part of the Project Team.</span>
                </div>
              </div>
            )}
          </div>

          {/* PRIORITY, STATUS, DUE DATE, ESTIMATED TIME */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
              <label className="mb-1 block text-xs font-semibold text-slate-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-800 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
              >
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
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
              <label className="mb-1 block text-xs font-semibold text-slate-700">Est. Time</label>
              <input
                type="text"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                placeholder="e.g. 2h / 45m"
                className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
              />
            </div>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline specific objectives, technical details, or acceptance criteria..."
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
            />
          </div>

          {/* FOOTER */}
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
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
