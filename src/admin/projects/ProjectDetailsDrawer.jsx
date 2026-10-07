import { useState, useMemo } from "react";
import {
  X,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Calendar,
  AlertTriangle,
  UserRound,
  Users,
  ListTodo,
  Plus,
  RefreshCw,
  ArrowRightLeft,
  Pencil,
  Trash2,
  LockKeyhole,
  FileText,
  UserCheck,
  Activity,
  History,
  ShieldCheck,
  Check,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import API_URL from "../../config/api";
import {
  getStageStyle,
  getBusinessStatusStyle,
} from "./ProjectTransitionModal";

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
  return `${date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })} at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function money(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

function getTaskStatusStyle(status) {
  switch (status) {
    case "Completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "In Progress":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Testing / Review":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Blocked":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "Assigned":
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export default function ProjectDetailsDrawer({
  isOpen,
  onClose,
  projectDetails,
  loading = false,
  employees = [],
  onRefresh,
  onCreateProjectTask,
  onOpenCompleteProject,
  onOpenConvertProduct,
  onOpenMoveProject,
  onOpenAssignPm,
  onOpenAddMember,
  onOpenEditMember,
  onRemoveMember,
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [removingMember, setRemovingMember] = useState(false);
  const [removeError, setRemoveError] = useState("");

  if (!isOpen) return null;

  const project = projectDetails?.project || {};
  const summary = projectDetails?.summary || {};
  const teamMembers = Array.isArray(project.teamMembers) ? project.teamMembers : [];
  const combinedTeam = Array.isArray(projectDetails?.team) ? projectDetails.team : [];
  const tasks = Array.isArray(projectDetails?.tasks) ? projectDetails.tasks : [];
  const timeline = Array.isArray(project.timeline) ? project.timeline : [];

  // Active vs Removed team members
  const activeMembers = teamMembers.filter((m) => m.status !== "Removed");
  const removedMembers = teamMembers.filter((m) => m.status === "Removed");

  // Legacy task assignees who are not yet explicit team members
  const legacyAssignees = combinedTeam.filter((m) => !m.isExplicitMember && !m.isProjectManager);

  // Compute workload snapshot per team member
  const memberWorkload = useMemo(() => {
    const map = {};
    for (const t of tasks) {
      const empId = t.assignedEmployeeId ? String(t.assignedEmployeeId) : "";
      if (!empId) continue;
      if (!map[empId]) {
        map[empId] = { total: 0, open: 0, inProgress: 0, completed: 0, overdue: 0 };
      }
      map[empId].total += 1;
      if (t.status === "Completed") {
        map[empId].completed += 1;
      } else if (t.status === "In Progress") {
        map[empId].inProgress += 1;
        map[empId].open += 1;
      } else {
        map[empId].open += 1;
      }
      if (t.status !== "Completed" && t.dueDate && new Date(t.dueDate) < new Date()) {
        map[empId].overdue += 1;
      }
    }
    return map;
  }, [tasks]);

  const handleConfirmRemove = async () => {
    if (!memberToRemove || !onRemoveMember) return;
    try {
      setRemovingMember(true);
      setRemoveError("");
      await onRemoveMember(memberToRemove);
      setMemberToRemove(null);
    } catch (err) {
      setRemoveError(err.message || "Failed to remove member.");
    } finally {
      setRemovingMember(false);
    }
  };

  const isReadOnly = Boolean(project.convertedToProduct || project.isReadOnly);

  return (
    <>
      <button
        type="button"
        aria-label="Close project details"
        onClick={onClose}
        className="fixed inset-0 z-[90] bg-slate-950/40 backdrop-blur-[2px]"
      />

      <aside className="fixed inset-y-0 right-0 z-[100] flex w-full max-w-[920px] flex-col bg-white shadow-[-24px_0_70px_rgba(15,23,42,0.18)] animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4.5 bg-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded border border-violet-100">
                {project.projectCode || "PROJECT"}
              </span>
              <span
                className={`rounded-lg border px-2 py-0.5 text-xs font-semibold ${getBusinessStatusStyle(
                  project.status
                )}`}
              >
                Status: {project.status || "Planned"}
              </span>
              <span
                className={`rounded-lg border px-2 py-0.5 text-xs font-semibold ${getStageStyle(
                  project.stage
                )}`}
              >
                Stage: {project.stage || "Planning"}
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-950">
              {project.projectName || "Project Workspace"}
            </h2>

            <p className="text-xs text-slate-500">
              {project.clientName || "Internal Project"}
              {project.projectType ? ` • ${project.projectType}` : ""}
              {project.requirementCode ? ` • From: ${project.requirementCode}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isReadOnly && typeof onOpenMoveProject === "function" && (
              <button
                type="button"
                onClick={() => onOpenMoveProject(project)}
                className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition shadow-xs"
              >
                <ArrowRightLeft size={13} />
                <span>Move Project</span>
              </button>
            )}

            {typeof onRefresh === "function" && (
              <button
                type="button"
                onClick={onRefresh}
                className="flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition"
                title="Refresh project details"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex h-8.5 w-8.5 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 px-6 bg-slate-50/50">
          {[
            { id: "overview", label: "Overview", icon: BriefcaseBusiness },
            { id: "team", label: "Team", icon: Users, count: activeMembers.length },
            { id: "tasks", label: "Tasks", icon: ListTodo, count: tasks.length },
            { id: "activity", label: "Activity", icon: History, count: timeline.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition ${
                  isActive
                    ? "border-violet-600 text-violet-700 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isActive
                        ? "bg-violet-100 text-violet-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto bg-slate-50/60 p-6">
          {loading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <RefreshCw size={26} className="mx-auto animate-spin text-violet-600" />
                <p className="mt-3 text-sm text-slate-500 font-medium">
                  Loading project workspace...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-5">
                  {/* Progress & Quick Stats Card */}
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                          Task Progress
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-violet-700">
                            {Number(summary.progress || 0)}%
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            completed ({Number(summary.completedTasks || 0)} of{" "}
                            {Number(summary.totalTasks || 0)} tasks)
                          </span>
                        </div>
                        <div className="mt-2.5 h-2.5 w-full lg:w-[320px] overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-violet-600 transition-all duration-300"
                            style={{ width: `${Math.min(Math.max(Number(summary.progress || 0), 0), 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Project Manager Spotlight */}
                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 min-w-[260px]">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <UserCheck size={13} className="text-violet-600" />
                            Project Manager
                          </span>
                          {!isReadOnly && typeof onOpenAssignPm === "function" && (
                            <button
                              type="button"
                              onClick={() => onOpenAssignPm(project)}
                              className="text-[11px] font-semibold text-violet-600 hover:text-violet-800 transition"
                            >
                              {project.projectManager ? "Change" : "Assign Manager"}
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700 font-bold text-xs">
                            {project.projectManagerName ? project.projectManagerName.charAt(0).toUpperCase() : "?"}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              {project.projectManagerName || "No Project Manager assigned"}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {project.projectManager ? "Leadership & Coordination" : "Click to assign employee"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <span className="block text-[11px] font-medium text-slate-400">Client</span>
                        <span className="text-xs font-semibold text-slate-800">
                          {project.clientName || "Internal"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-medium text-slate-400">Priority</span>
                        <span className="text-xs font-semibold text-slate-800">
                          {project.priority || "Medium"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-medium text-slate-400">Start Date</span>
                        <span className="text-xs font-semibold text-slate-800">
                          {formatDate(project.startDate)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-medium text-slate-400">Target Due Date</span>
                        <span className="text-xs font-semibold text-slate-800">
                          {formatDate(project.dueDate)}
                        </span>
                      </div>
                    </div>
                  </section>

                  {/* Task Statistics Cards */}
                  <section>
                    <div className="mb-2.5 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Task Summary
                      </h3>
                      <span className="text-[11px] text-slate-400">
                        Synchronized with task tracking
                      </span>
                    </div>

                    <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
                      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                        <span className="text-[11px] font-medium text-slate-500 block mb-1">
                          Total Tasks
                        </span>
                        <span className="text-xl font-bold text-slate-900">
                          {Number(summary.totalTasks || 0)}
                        </span>
                      </div>

                      <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5 shadow-xs">
                        <span className="text-[11px] font-medium text-emerald-700 block mb-1">
                          Completed
                        </span>
                        <span className="text-xl font-bold text-emerald-800">
                          {Number(summary.completedTasks || 0)}
                        </span>
                      </div>

                      <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 shadow-xs">
                        <span className="text-[11px] font-medium text-blue-700 block mb-1">
                          In Progress
                        </span>
                        <span className="text-xl font-bold text-blue-800">
                          {Number(summary.inProgressTasks || 0)}
                        </span>
                      </div>

                      <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3.5 shadow-xs">
                        <span className="text-[11px] font-medium text-amber-700 block mb-1">
                          Blocked
                        </span>
                        <span className="text-xl font-bold text-amber-800">
                          {Number(summary.blockedTasks || 0)}
                        </span>
                      </div>

                      <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3.5 shadow-xs">
                        <span className="text-[11px] font-medium text-rose-700 block mb-1">
                          Overdue
                        </span>
                        <span className="text-xl font-bold text-rose-800">
                          {Number(summary.overdueTasks || 0)}
                        </span>
                      </div>
                    </div>
                  </section>

                  {/* Project Description */}
                  {project.description && (
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                        Description & Scope
                      </h3>
                      <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {project.description}
                      </p>
                    </section>
                  )}

                  {/* Project Completion Action / Banner */}
                  {project.status !== "Completed" && (
                    <section
                      className={`rounded-2xl border p-5 ${
                        Number(summary.totalTasks || 0) > 0 &&
                        Number(summary.completedTasks || 0) === Number(summary.totalTasks || 0) &&
                        Number(summary.progress || 0) >= 100
                          ? "border-emerald-200 bg-emerald-50/70"
                          : "border-amber-200 bg-amber-50/70"
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2
                              size={17}
                              className={
                                Number(summary.progress || 0) >= 100
                                  ? "text-emerald-600"
                                  : "text-amber-600"
                              }
                            />
                            <h3 className="text-sm font-bold text-slate-900">
                              Project Delivery & Completion
                            </h3>
                          </div>
                          <p className="mt-1 text-xs text-slate-600">
                            {Number(summary.totalTasks || 0) === 0
                              ? "Create and execute project tasks before completing this project."
                              : Number(summary.completedTasks || 0) === Number(summary.totalTasks || 0) &&
                                Number(summary.progress || 0) >= 100
                              ? "All tasks are completed. Project is ready for formal completion and delivery sign-off."
                              : `${Number(summary.completedTasks || 0)}/${Number(summary.totalTasks || 0)} tasks completed. Finish all tasks before marking completed.`}
                          </p>
                        </div>

                        {typeof onOpenCompleteProject === "function" && (
                          <button
                            type="button"
                            onClick={() => onOpenCompleteProject(project)}
                            disabled={
                              Number(summary.totalTasks || 0) === 0 ||
                              Number(summary.completedTasks || 0) !== Number(summary.totalTasks || 0) ||
                              Number(summary.progress || 0) < 100
                            }
                            className="h-9 shrink-0 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 shadow-xs"
                          >
                            Complete Project
                          </button>
                        )}
                      </div>
                    </section>
                  )}

                  {project.status === "Completed" && (
                    <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-emerald-600" />
                        <h3 className="text-sm font-bold text-emerald-950">
                          Project Completed & Delivered
                        </h3>
                      </div>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <span className="block text-[11px] font-medium text-emerald-800">Completed Date</span>
                          <span className="text-xs font-semibold text-emerald-950">{formatDate(project.completedDate)}</span>
                        </div>
                        <div>
                          <span className="block text-[11px] font-medium text-emerald-800">Delivery Date</span>
                          <span className="text-xs font-semibold text-emerald-950">{formatDate(project.deliveryDate)}</span>
                        </div>
                        <div>
                          <span className="block text-[11px] font-medium text-emerald-800">Final Amount</span>
                          <span className="text-xs font-semibold text-emerald-950">{money(project.finalAmount)}</span>
                        </div>
                        <div>
                          <span className="block text-[11px] font-medium text-emerald-800">Completed By</span>
                          <span className="text-xs font-semibold text-emerald-950">{project.completedByName || "Admin"}</span>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* AMC Info if applicable */}
                  {project.amcApplicable && (
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                        AMC & Warranty Details
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <span className="block text-[11px] font-medium text-slate-400">Proposed AMC</span>
                          <span className="text-xs font-semibold text-slate-800">{money(project.proposedAmcAmount)}</span>
                        </div>
                        <div>
                          <span className="block text-[11px] font-medium text-slate-400">Warranty End</span>
                          <span className="text-xs font-semibold text-slate-800">{formatDate(project.warrantyEndDate)}</span>
                        </div>
                        <div>
                          <span className="block text-[11px] font-medium text-slate-400">AMC Status</span>
                          <span className="text-xs font-semibold text-slate-800">
                            {project.amcActivated ? "Activated" : "Pending Activation"}
                          </span>
                        </div>
                      </div>
                    </section>
                  )}
                </div>
              )}

              {/* TAB 2: TEAM */}
              {activeTab === "team" && (
                <div className="space-y-5">
                  {/* Team Top Action Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Project Team Allocation
                      </h3>
                      <p className="text-xs text-slate-500">
                        Explicit team members responsible for executing this project.
                      </p>
                    </div>

                    {!isReadOnly && typeof onOpenAddMember === "function" && (
                      <button
                        type="button"
                        onClick={() => onOpenAddMember(project)}
                        className="inline-flex items-center gap-1.5 h-8.5 px-3.5 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition shadow-xs self-start sm:self-auto"
                      >
                        <Plus size={14} />
                        <span>Add Team Member</span>
                      </button>
                    )}
                  </div>

                  {/* Project Manager Card */}
                  <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white font-bold text-sm">
                          <UserCheck size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {project.projectManagerName || "No Project Manager Assigned"}
                            </span>
                            <span className="bg-violet-100 text-violet-800 border border-violet-200 text-[10px] font-bold px-2 py-0.2 rounded-full">
                              Project Manager
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Overall project leadership and delivery accountability
                          </p>
                        </div>
                      </div>

                      {!isReadOnly && typeof onOpenAssignPm === "function" && (
                        <button
                          type="button"
                          onClick={() => onOpenAssignPm(project)}
                          className="h-8 px-3 rounded-lg border border-violet-200 bg-white text-violet-700 text-xs font-semibold hover:bg-violet-50 transition"
                        >
                          {project.projectManager ? "Change PM" : "Assign PM"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Active Team Members List */}
                  {activeMembers.length > 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-xs">
                          <thead className="bg-slate-50/80">
                            <tr className="text-left font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                              <th className="px-4 py-3">Employee</th>
                              <th className="px-4 py-3">Project Role</th>
                              <th className="px-4 py-3">Responsibility / Scope</th>
                              <th className="px-4 py-3">Project Workload</th>
                              <th className="px-4 py-3">Added Date</th>
                              {!isReadOnly && <th className="px-4 py-3 text-right">Actions</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {activeMembers.map((member) => {
                              const empId = String(member.employeeId?._id || member.employeeId || "");
                              const workload = memberWorkload[empId] || { total: 0, open: 0, inProgress: 0, overdue: 0 };
                              return (
                                <tr key={member._id || empId} className="hover:bg-slate-50/60 transition">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2.5">
                                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold text-xs">
                                        {member.employeeName?.charAt(0).toUpperCase() || "E"}
                                      </div>
                                      <div>
                                        <p className="font-bold text-slate-900">
                                          {member.employeeName}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-mono">
                                          {member.employeeCode || "—"}
                                        </p>
                                      </div>
                                    </div>
                                  </td>

                                  <td className="px-4 py-3">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-violet-50 text-violet-700 border border-violet-100">
                                      {member.role || "Team Member"}
                                    </span>
                                  </td>

                                  <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">
                                    {member.responsibility || "—"}
                                  </td>

                                  <td className="px-4 py-3">
                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                                        <span>{workload.total} Tasks</span>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-blue-600">{workload.inProgress} In Progress</span>
                                      </div>
                                      {workload.overdue > 0 && (
                                        <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-0.5">
                                          <AlertTriangle size={10} /> {workload.overdue} Overdue
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                                    {formatDate(member.addedAt)}
                                  </td>

                                  {!isReadOnly && (
                                    <td className="px-4 py-3 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        {typeof onOpenEditMember === "function" && (
                                          <button
                                            type="button"
                                            onClick={() => onOpenEditMember(project, member)}
                                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                                            title="Edit Role / Responsibility"
                                          >
                                            <Pencil size={13} />
                                          </button>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() => setMemberToRemove(member)}
                                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                          title="Remove from Team"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                      <Users size={28} className="mx-auto text-slate-300 mb-2" />
                      <h4 className="text-sm font-bold text-slate-800">No explicit team members yet</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Add developers, leads, and consultants to the project team to manage assignments.
                      </p>
                      {!isReadOnly && typeof onOpenAddMember === "function" && (
                        <button
                          type="button"
                          onClick={() => onOpenAddMember(project)}
                          className="mt-3.5 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition"
                        >
                          <Plus size={13} /> Add First Team Member
                        </button>
                      )}
                    </div>
                  )}

                  {/* Legacy Task Assignees (from tasks, not explicit team yet) */}
                  {legacyAssignees.length > 0 && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
                      <div>
                        <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles size={13} />
                          Existing Task Assignees (Historical)
                        </h4>
                        <p className="text-[11px] text-amber-700 mt-0.5">
                          These employees have active tasks in this project but were assigned under legacy mode without explicit team records.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {legacyAssignees.map((assignee) => (
                          <div
                            key={assignee.employeeId}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-amber-200/80 bg-white"
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-800">
                                {assignee.employeeName}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {assignee.employeeCode || "Employee"} • Task Assignee
                              </p>
                            </div>

                            {!isReadOnly && typeof onOpenAddMember === "function" && (
                              <button
                                type="button"
                                onClick={() =>
                                  onOpenAddMember(project, {
                                    id: assignee.employeeId,
                                    name: assignee.employeeName,
                                    employeeCode: assignee.employeeCode,
                                  })
                                }
                                className="h-7 px-2.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-[11px] font-semibold hover:bg-amber-100 transition"
                              >
                                + Add to Team
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Removed Members History (if any) */}
                  {removedMembers.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        Past / Removed Team Members ({removedMembers.length})
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {removedMembers.map((m) => (
                          <div
                            key={m._id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs text-slate-500"
                          >
                            <span className="line-through">{m.employeeName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({m.role})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: TASKS */}
              {activeTab === "tasks" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Project Work Tasks
                      </h3>
                      <p className="text-xs text-slate-500">
                        Work assigned to project team members.
                      </p>
                    </div>

                    {!isReadOnly && typeof onCreateProjectTask === "function" && (
                      <button
                        type="button"
                        onClick={() => onCreateProjectTask(project)}
                        className="inline-flex items-center gap-1.5 h-8.5 px-3.5 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition shadow-xs"
                      >
                        <Plus size={14} />
                        <span>Create Task</span>
                      </button>
                    )}
                  </div>

                  {tasks.length > 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-xs">
                          <thead className="bg-slate-50/80">
                            <tr className="text-left font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                              <th className="px-4 py-3">Task</th>
                              <th className="px-4 py-3">Assignee</th>
                              <th className="px-4 py-3">Priority</th>
                              <th className="px-4 py-3">Due Date</th>
                              <th className="px-4 py-3">Progress</th>
                              <th className="px-4 py-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {tasks.map((task) => (
                              <tr key={task.id || task.taskCode} className="hover:bg-slate-50/60 transition">
                                <td className="px-4 py-3">
                                  <span className="font-mono text-[11px] font-bold text-violet-600 block">
                                    {task.taskCode}
                                  </span>
                                  <span className="font-medium text-slate-900 max-w-[200px] truncate block">
                                    {task.title}
                                  </span>
                                </td>

                                <td className="px-4 py-3">
                                  <span className="font-semibold text-slate-800 block">
                                    {task.assignedEmployeeName || "Unassigned"}
                                  </span>
                                  {task.assignedEmployeeCode && (
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {task.assignedEmployeeCode}
                                    </span>
                                  )}
                                </td>

                                <td className="px-4 py-3 font-medium text-slate-700">
                                  {task.priority || "Medium"}
                                </td>

                                <td className="px-4 py-3 font-mono text-slate-600">
                                  {formatDate(task.dueDate)}
                                </td>

                                <td className="px-4 py-3">
                                  <div className="w-[100px]">
                                    <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                                      <span>Progress</span>
                                      <span className="font-bold">{task.progress || 0}%</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                      <div
                                        className="h-full rounded-full bg-violet-600"
                                        style={{ width: `${task.progress || 0}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>

                                <td className="px-4 py-3">
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getTaskStatusStyle(
                                      task.status
                                    )}`}
                                  >
                                    {task.status || "Assigned"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                      <ListTodo size={28} className="mx-auto text-slate-300 mb-2" />
                      <h4 className="text-sm font-bold text-slate-800">No project tasks yet</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Break down deliverables into manageable tasks for the project team.
                      </p>
                      {!isReadOnly && typeof onCreateProjectTask === "function" && (
                        <button
                          type="button"
                          onClick={() => onCreateProjectTask(project)}
                          className="mt-3.5 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition"
                        >
                          <Plus size={13} /> Create First Task
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: ACTIVITY / TIMELINE */}
              {activeTab === "activity" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Project Activity & Stage Timeline
                      </h3>
                      <p className="text-xs text-slate-500">
                        Audit trail of stage movements, manager assignments, and team changes.
                      </p>
                    </div>
                  </div>

                  {timeline.length > 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                        {timeline.map((entry, idx) => (
                          <div key={entry._id || idx} className="relative">
                            {/* Dot */}
                            <div className="absolute -left-[27px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 ring-4 ring-white" />

                            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900">
                                  {entry.action || "Activity Logged"}
                                </span>
                                <span className="font-mono text-[10px] text-slate-400">
                                  {formatDateTime(entry.createdAt)}
                                </span>
                              </div>

                              {entry.description && (
                                <p className="text-xs text-slate-600 leading-relaxed">
                                  {entry.description}
                                </p>
                              )}

                              {entry.notes && entry.notes !== entry.description && (
                                <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded-lg border border-slate-100">
                                  Note: "{entry.notes}"
                                </p>
                              )}

                              <div className="text-[10px] text-slate-400 pt-1">
                                Performed by: <strong className="text-slate-600">{entry.performedByName || "Admin"}</strong>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                      <History size={28} className="mx-auto text-slate-300 mb-2" />
                      <h4 className="text-sm font-bold text-slate-800">No activity logged yet</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Timeline events will appear as the project advances stages or updates team membership.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      {/* Remove Member Confirmation Modal */}
      {memberToRemove && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-rose-600 flex items-center gap-1.5">
                <AlertTriangle size={16} />
                Remove Team Member
              </h3>
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            {removeError && (
              <div className="rounded-lg bg-rose-50 p-2 text-xs text-rose-700 font-medium">
                {removeError}
              </div>
            )}

            <div className="space-y-2 text-xs text-slate-600">
              <p>
                Are you sure you want to remove{" "}
                <strong className="text-slate-900">{memberToRemove.employeeName}</strong> from this project team?
              </p>
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-amber-900 text-[11px] font-medium leading-relaxed">
                ⚠️ <strong>Existing tasks assigned to this employee will remain unchanged.</strong>
                <p className="mt-1 text-amber-800">
                  The employee record and their past workload will not be deleted.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                disabled={removingMember}
                className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                disabled={removingMember}
                className="h-8 px-3.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition disabled:opacity-50 shadow-xs"
              >
                {removingMember ? "Removing..." : "Confirm Removal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

