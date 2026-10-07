import { useState, useRef } from "react";
import {
  X,
  Play,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  RotateCcw,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  User,
  Users,
  FolderKanban,
  Building,
  AlertCircle,
  CheckSquare,
  Square,
  Plus,
  Send,
  Paperclip,
  Download,
  FileText,
  Activity,
  MessageSquare,
  ChevronDown,
  Info,
  Check,
} from "lucide-react";
import API_URL from "../../config/api";

function formatMinutes(minutes) {
  if (!minutes || isNaN(minutes) || minutes <= 0) return "0h 0m";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function calculateOverdue(dueDateVal, status) {
  if (!dueDateVal || status === "Completed") return null;
  const due = new Date(`${dueDateVal}T00:00:00`);
  if (isNaN(due.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (due < today) {
    const diffDays = Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  return null;
}

export default function TaskDetailsDrawer({
  task,
  isOpen,
  onClose,
  onEditTask,
  onDeleteTask,
  onDirectStatusChange,
  onPromptStatus,
  onResumeTask,
  onTaskUpdated,
  employees = [],
  projects = [],
  getAuthToken,
}) {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "checklist" | "comments" | "attachments" | "activity"
  const [newChecklistText, setNewChecklistText] = useState("");
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [editingChecklistId, setEditingChecklistId] = useState(null);
  const [editingChecklistText, setEditingChecklistText] = useState("");

  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const fileInputRef = useRef(null);

  const [reassigning, setReassigning] = useState(false);
  const [selectedNewAssignee, setSelectedNewAssignee] = useState("");
  const [reassignLoading, setReassignLoading] = useState(false);

  if (!isOpen || !task) return null;

  const overdueDays = calculateOverdue(task.dueDateValue, task.status);
  const checklist = Array.isArray(task.checklist) ? task.checklist : [];
  const completedChecklistCount = checklist.filter((item) => item.completed).length;
  const checklistPercent = checklist.length > 0 ? Math.round((completedChecklistCount / checklist.length) * 100) : 0;
  const comments = Array.isArray(task.comments) ? task.comments : [];
  const attachments = Array.isArray(task.attachments) ? task.attachments : [];
  const timeline = Array.isArray(task.timeline) ? task.timeline : [];

  // Project team members for reassignment prioritization
  const linkedProject = projects.find((p) => String(p._id || p.id) === String(task.projectId));
  const projectTeamMemberIds = new Set(
    (linkedProject?.teamMembers || [])
      .filter((m) => m.status === "Active" || !m.status)
      .map((m) => String(m.employeeId))
  );

  const projectTeamEmployees = employees.filter((e) => projectTeamMemberIds.has(String(e.id || e._id)));
  const otherEmployees = employees.filter((e) => !projectTeamMemberIds.has(String(e.id || e._id)));

  // CHECKLIST HANDLERS
  const handleAddChecklist = async (e) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    try {
      setChecklistLoading(true);
      const res = await fetch(`${API_URL}/api/admin/task/${task.id || task._id}/checklist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ text: newChecklistText.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to add checklist item.");
      setNewChecklistText("");
      onTaskUpdated({ ...task, checklist: data.data });
    } catch (err) {
      alert(err.message);
    } finally {
      setChecklistLoading(false);
    }
  };

  const handleToggleChecklist = async (item) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/task/${task.id || task._id}/checklist/${item._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ completed: !item.completed }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to update checklist item.");
      onTaskUpdated({ ...task, checklist: data.data });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveChecklistEdit = async (itemId) => {
    if (!editingChecklistText.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/task/${task.id || task._id}/checklist/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ text: editingChecklistText.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to update checklist text.");
      setEditingChecklistId(null);
      setEditingChecklistText("");
      onTaskUpdated({ ...task, checklist: data.data });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteChecklist = async (itemId) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/task/${task.id || task._id}/checklist/${itemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to remove checklist item.");
      onTaskUpdated({ ...task, checklist: data.data });
    } catch (err) {
      alert(err.message);
    }
  };

  // COMMENT HANDLER
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      setCommentLoading(true);
      const res = await fetch(`${API_URL}/api/admin/task/${task.id || task._id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ message: commentText.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to add comment.");
      setCommentText("");
      onTaskUpdated(data.data);
    } catch (err) {
      alert(err.message);
    } finally {
      setCommentLoading(false);
    }
  };

  // ATTACHMENT HANDLER
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("attachment", file);

    try {
      setUploadingAttachment(true);
      const res = await fetch(`${API_URL}/api/admin/task/${task.id || task._id}/attachment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to upload attachment.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      onTaskUpdated(data.data);
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingAttachment(false);
    }
  };

  // QUICK REASSIGN HANDLER
  const handleReassign = async () => {
    if (!selectedNewAssignee) return;
    const targetEmp = employees.find((e) => String(e.id || e._id) === String(selectedNewAssignee));
    if (!targetEmp) return;

    try {
      setReassignLoading(true);
      const res = await fetch(`${API_URL}/api/admin/task/${task.id || task._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          assignedEmployeeId: targetEmp.id || targetEmp._id,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to reassign task.");
      setReassigning(false);
      onTaskUpdated(data.data);
    } catch (err) {
      alert(err.message);
    } finally {
      setReassignLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 overflow-hidden bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="relative w-screen max-w-2xl bg-white shadow-2xl flex flex-col">
          {/* HEADER */}
          <div className="border-b border-slate-200 px-6 py-4 bg-slate-50/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                  {task.taskNo || task.taskCode}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    task.status === "Completed"
                      ? "bg-emerald-100 text-emerald-800"
                      : task.status === "Blocked"
                      ? "bg-rose-100 text-rose-800"
                      : task.status === "Testing"
                      ? "bg-blue-100 text-blue-800"
                      : task.status === "In Progress"
                      ? "bg-violet-100 text-violet-800"
                      : "bg-slate-200 text-slate-800"
                  }`}
                >
                  {task.status}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    task.priority === "Critical"
                      ? "bg-rose-50 text-rose-700"
                      : task.priority === "High"
                      ? "bg-orange-50 text-orange-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {task.priority} Priority
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            <h2 className="mt-2 text-base font-bold text-slate-950 line-clamp-2">{task.title}</h2>

            {/* QUICK ACTIONS ROW */}
            <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/80">
              {task.status === "Assigned" && (
                <button
                  type="button"
                  onClick={() => onDirectStatusChange(task, "In Progress")}
                  className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-violet-700 transition"
                >
                  <Play size={12} fill="currentColor" /> Start Work
                </button>
              )}
              {task.status === "In Progress" && (
                <>
                  <button
                    type="button"
                    onClick={() => onDirectStatusChange(task, "Testing")}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
                  >
                    Move to Testing <ArrowRight size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onPromptStatus(task, "Blocked")}
                    className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                  >
                    <ShieldAlert size={12} /> Block Task
                  </button>
                  <button
                    type="button"
                    onClick={() => onPromptStatus(task, "Completed")}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                  >
                    <CheckCircle2 size={12} /> Mark Completed
                  </button>
                </>
              )}
              {task.status === "Testing" && (
                <>
                  <button
                    type="button"
                    onClick={() => onPromptStatus(task, "Completed")}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                  >
                    <CheckCircle2 size={12} /> Mark Completed
                  </button>
                  <button
                    type="button"
                    onClick={() => onPromptStatus(task, "Blocked")}
                    className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                  >
                    <ShieldAlert size={12} /> Block Task
                  </button>
                </>
              )}
              {task.status === "Blocked" && (
                <button
                  type="button"
                  onClick={() => onResumeTask(task)}
                  className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition"
                >
                  <Play size={12} fill="currentColor" /> Resume Task
                </button>
              )}
              {task.status === "Completed" && (
                <button
                  type="button"
                  onClick={() => onPromptStatus(task, "Reopen")}
                  className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition"
                >
                  <RotateCcw size={12} /> Reopen Task
                </button>
              )}

              <div className="ml-auto flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onEditTask(task)}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  <Edit2 size={12} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteTask(task)}
                  className="flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* PROMINENT BLOCKED ALERT BANNER */}
          {task.status === "Blocked" && (
            <div className="border-b border-rose-200 bg-rose-50/90 px-6 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-rose-900">Task Currently Blocked</h4>
                    <p className="mt-0.5 text-xs text-rose-800">
                      <strong>Reason:</strong> {task.blockerReason || "Administrative blocker"}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-4 text-[11px] text-rose-700">
                      {task.waitingFor && (
                        <span>
                          <strong>Waiting For:</strong> {task.waitingFor}
                        </span>
                      )}
                      {task.expectedResolutionDate && (
                        <span>
                          <strong>Expected Date:</strong>{" "}
                          {new Date(task.expectedResolutionDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onResumeTask(task)}
                  className="shrink-0 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition"
                >
                  Resume
                </button>
              </div>
            </div>
          )}

          {/* KEY INFO STRIP */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-slate-200 bg-white px-6 py-3 text-xs">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Project</span>
              <p className="mt-0.5 font-semibold text-slate-900 truncate">
                {task.projectName || task.project || "—"}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Client</span>
              <p className="mt-0.5 font-semibold text-slate-900 truncate">{task.client || task.clientName || "—"}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Assignee</span>
              <div className="mt-0.5 flex items-center justify-between">
                <span className="font-semibold text-slate-900 truncate">
                  {task.assignedEmployeeName || "Unassigned"}
                </span>
                <button
                  type="button"
                  onClick={() => setReassigning(!reassigning)}
                  className="text-[10px] text-violet-600 font-semibold hover:underline ml-1"
                >
                  {reassigning ? "Cancel" : "Change"}
                </button>
              </div>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Due Date</span>
              <p className="mt-0.5 font-semibold">
                {overdueDays ? (
                  <span className="text-rose-600 font-bold">
                    {task.dueDate} (Overdue by {overdueDays}d)
                  </span>
                ) : (
                  <span className="text-slate-900">{task.dueDate || "—"}</span>
                )}
              </p>
            </div>
          </div>

          {/* INLINE REASSIGN PANEL */}
          {reassigning && (
            <div className="border-b border-violet-100 bg-violet-50/50 px-6 py-3">
              <label className="block text-[11px] font-bold text-violet-900 mb-1">
                Reassign Task {linkedProject ? "(Project Team prioritized)" : ""}
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedNewAssignee}
                  onChange={(e) => setSelectedNewAssignee(e.target.value)}
                  className="flex-1 rounded-xl border border-violet-200 bg-white p-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-violet-300"
                >
                  <option value="">Select Employee</option>
                  {projectTeamEmployees.length > 0 && (
                    <optgroup label="⭐ PROJECT TEAM">
                      {projectTeamEmployees.map((emp) => (
                        <option key={emp.id || emp._id} value={emp.id || emp._id}>
                          {emp.name} ({emp.employeeCode})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label={projectTeamEmployees.length > 0 ? "OTHER EMPLOYEES" : "ALL EMPLOYEES"}>
                    {otherEmployees.map((emp) => (
                      <option key={emp.id || emp._id} value={emp.id || emp._id}>
                        {emp.name} ({emp.employeeCode})
                      </option>
                    ))}
                  </optgroup>
                </select>
                <button
                  type="button"
                  disabled={!selectedNewAssignee || reassignLoading}
                  onClick={handleReassign}
                  className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-700 disabled:opacity-50"
                >
                  {reassignLoading ? "Saving..." : "Assign"}
                </button>
              </div>
              {selectedNewAssignee &&
                linkedProject &&
                !projectTeamMemberIds.has(String(selectedNewAssignee)) && (
                  <p className="mt-1.5 text-[11px] text-amber-800 flex items-center gap-1">
                    <AlertCircle size={13} className="text-amber-600" />
                    This employee is not currently part of the Project Team.
                  </p>
                )}
            </div>
          )}

          {/* TABS NAVIGATION */}
          <div className="flex border-b border-slate-200 px-6 bg-white gap-6">
            {[
              { id: "overview", label: "Overview", icon: Info },
              {
                id: "checklist",
                label: `Checklist (${completedChecklistCount}/${checklist.length})`,
                icon: CheckSquare,
              },
              { id: "comments", label: `Comments (${comments.length})`, icon: MessageSquare },
              { id: "attachments", label: `Attachments (${attachments.length})`, icon: Paperclip },
              { id: "activity", label: `Activity (${timeline.length})`, icon: Activity },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 py-3 text-xs font-bold border-b-2 transition ${
                    active
                      ? "border-violet-600 text-violet-700"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB CONTENTS */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40">
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* DESCRIPTION */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</h3>
                  <div className="mt-2 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {task.description || <span className="text-slate-400 italic">No description provided.</span>}
                  </div>
                </div>

                {/* TIME METRICS */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Estimated</span>
                    <p className="mt-1 text-base font-bold text-slate-900">
                      {formatMinutes(task.estimatedMinutes)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Spent</span>
                    <p className="mt-1 text-base font-bold text-violet-700">
                      {formatMinutes(task.spentMinutes)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Remaining</span>
                    <p className="mt-1 text-base font-bold text-slate-700">
                      {formatMinutes(Math.max(0, (task.estimatedMinutes || 0) - (task.spentMinutes || 0)))}
                    </p>
                  </div>
                </div>

                {/* PROGRESS BAR */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Task Progress</span>
                    <span className="font-bold text-violet-700">{task.progress || 0}%</span>
                  </div>
                  <div className="mt-2 h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-violet-600 transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, task.progress || 0))}%` }}
                    />
                  </div>
                </div>

                {/* RESOLUTION NOTE IF COMPLETED */}
                {task.resolutionNote && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
                    <h3 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-600" /> Completion Resolution Note
                    </h3>
                    <p className="mt-1 text-xs text-emerald-800 leading-relaxed">{task.resolutionNote}</p>
                  </div>
                )}
              </div>
            )}

            {/* CHECKLIST TAB */}
            {activeTab === "checklist" && (
              <div className="space-y-4">
                {/* PROGRESS BOX */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">Checklist Completion</span>
                    <span className="text-violet-700">
                      {completedChecklistCount} of {checklist.length} completed ({checklistPercent}%)
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-violet-600 transition-all duration-300"
                      style={{ width: `${checklistPercent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">
                    Checking all items does not automatically complete the task. The task must still be explicitly completed.
                  </p>
                </div>

                {/* ADD CHECKLIST ITEM FORM */}
                <form onSubmit={handleAddChecklist} className="flex gap-2">
                  <input
                    type="text"
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    placeholder="Add new checklist item..."
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />
                  <button
                    type="submit"
                    disabled={!newChecklistText.trim() || checklistLoading}
                    className="flex items-center gap-1 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-700 disabled:opacity-50"
                  >
                    <Plus size={14} /> Add
                  </button>
                </form>

                {/* ITEMS LIST */}
                <div className="space-y-2">
                  {checklist.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
                      No checklist items yet. Add subtasks above.
                    </div>
                  ) : (
                    checklist.map((item) => {
                      const isEditing = editingChecklistId === item._id;

                      return (
                        <div
                          key={item._id}
                          className={`flex items-start gap-3 rounded-xl border p-3 transition ${
                            item.completed
                              ? "border-slate-200 bg-slate-50/60"
                              : "border-slate-200 bg-white shadow-2xs hover:border-slate-300"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleChecklist(item)}
                            className="mt-0.5 text-slate-400 hover:text-violet-600 transition"
                          >
                            {item.completed ? (
                              <CheckCircle2 size={16} className="text-emerald-600" />
                            ) : (
                              <Square size={16} />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editingChecklistText}
                                  onChange={(e) => setEditingChecklistText(e.target.value)}
                                  className="w-full rounded-lg border border-violet-300 p-1.5 text-xs text-slate-800 outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveChecklistEdit(item._id)}
                                  className="rounded-lg bg-violet-600 p-1.5 text-white hover:bg-violet-700"
                                >
                                  <Check size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingChecklistId(null)}
                                  className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100"
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <p
                                  className={`text-xs ${
                                    item.completed ? "text-slate-400 line-through" : "font-medium text-slate-800"
                                  }`}
                                >
                                  {item.text}
                                </p>
                                {item.completed && item.completedByName && (
                                  <p className="mt-0.5 text-[10px] text-slate-400">
                                    Completed by {item.completedByName} on{" "}
                                    {item.completedAt ? new Date(item.completedAt).toLocaleDateString() : ""}
                                  </p>
                                )}
                              </>
                            )}
                          </div>

                          {!isEditing && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingChecklistId(item._id);
                                  setEditingChecklistText(item.text);
                                }}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteChecklist(item._id)}
                                className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* COMMENTS TAB */}
            {activeTab === "comments" && (
              <div className="space-y-4">
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim() || commentLoading}
                    className="flex items-center gap-1 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-700 disabled:opacity-50"
                  >
                    <Send size={14} /> Send
                  </button>
                </form>

                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
                      No comments yet.
                    </div>
                  ) : (
                    comments.map((comment, index) => (
                      <div key={comment._id || index} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">
                            {comment.authorName || comment.authorRole || "User"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ""}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {comment.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ATTACHMENTS TAB */}
            {activeTab === "attachments" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingAttachment}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-700 disabled:opacity-50"
                  >
                    <Paperclip size={14} /> {uploadingAttachment ? "Uploading..." : "Upload File"}
                  </button>
                </div>

                <div className="space-y-2">
                  {attachments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
                      No files attached.
                    </div>
                  ) : (
                    attachments.map((file, idx) => (
                      <div
                        key={file._id || idx}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <FileText size={18} className="text-violet-600 shrink-0" />
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-800 truncate">{file.fileName}</p>
                            <p className="text-[10px] text-slate-400">
                              Uploaded by {file.uploadedByName || "User"} •{" "}
                              {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : ""}
                            </p>
                          </div>
                        </div>
                        <a
                          href={`${API_URL}${file.fileUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          download={file.fileName}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                        >
                          <Download size={13} />
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ACTIVITY / TIMELINE TAB */}
            {activeTab === "activity" && (
              <div className="relative pl-6 space-y-4 before:absolute before:bottom-0 before:left-2.5 before:top-2 before:w-0.5 before:bg-slate-200">
                {timeline.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
                    No activity recorded yet.
                  </div>
                ) : (
                  [...timeline].reverse().map((event, idx) => (
                    <div key={event._id || idx} className="relative">
                      <div className="absolute -left-6 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-violet-600 shadow-2xs" />
                      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{event.action}</span>
                          <span className="text-[10px] text-slate-400">
                            {event.createdAt ? new Date(event.createdAt).toLocaleString() : ""}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600">{event.description}</p>
                        {event.performedByName && (
                          <p className="mt-1 text-[10px] text-slate-400">
                            By {event.performedByName} ({event.performedByRole || "User"})
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
