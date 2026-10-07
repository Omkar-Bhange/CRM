import { useState } from "react";
import {
  ListTodo,
  Timer,
  CheckSquare,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  User,
  FolderKanban,
  RotateCcw,
  Play,
  ArrowRight,
  MoreHorizontal,
  Plus,
} from "lucide-react";

const COLUMNS = [
  {
    id: "Assigned",
    title: "ASSIGNED",
    icon: ListTodo,
    headerColor: "border-slate-300 text-slate-700 bg-slate-50",
    badgeColor: "bg-slate-200 text-slate-800",
    accentBorder: "border-slate-200",
  },
  {
    id: "In Progress",
    title: "IN PROGRESS",
    icon: Timer,
    headerColor: "border-violet-300 text-violet-800 bg-violet-50/70",
    badgeColor: "bg-violet-100 text-violet-800",
    accentBorder: "border-violet-200",
  },
  {
    id: "Testing",
    title: "TESTING",
    icon: CheckSquare,
    headerColor: "border-blue-300 text-blue-800 bg-blue-50/70",
    badgeColor: "bg-blue-100 text-blue-800",
    accentBorder: "border-blue-200",
  },
  {
    id: "Blocked",
    title: "BLOCKED",
    icon: ShieldAlert,
    headerColor: "border-rose-300 text-rose-800 bg-rose-50/70",
    badgeColor: "bg-rose-100 text-rose-800",
    accentBorder: "border-rose-200",
  },
  {
    id: "Completed",
    title: "COMPLETED",
    icon: CheckCircle2,
    headerColor: "border-emerald-300 text-emerald-800 bg-emerald-50/70",
    badgeColor: "bg-emerald-100 text-emerald-800",
    accentBorder: "border-emerald-200",
  },
];

function getPriorityBadge(priority) {
  switch (priority) {
    case "Critical":
      return "bg-rose-50 text-rose-700 ring-rose-600/20";
    case "High":
      return "bg-orange-50 text-orange-700 ring-orange-600/20";
    case "Medium":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";
    case "Low":
    default:
      return "bg-slate-100 text-slate-600 ring-slate-500/20";
  }
}

function calculateOverdueDays(dueDateVal) {
  if (!dueDateVal) return null;
  const due = new Date(`${dueDateVal}T00:00:00`);
  if (isNaN(due.getTime())) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (due < today) {
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  return null;
}

export default function TaskKanbanBoard({
  tasks,
  onOpenTask,
  onDirectStatusChange,
  onPromptStatus, // (task, "Blocked" | "Completed" | "Reopen") => void
  onResumeTask, // (task) => void
  onCreateTaskWithStatus,
  updatingTaskId,
}) {
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = (columnId) => {
    if (dragOverColumn === columnId) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e, targetColumnId) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedTask) return;
    if (draggedTask.status === targetColumnId) {
      setDraggedTask(null);
      return;
    }

    const taskToMove = draggedTask;
    setDraggedTask(null);

    if (targetColumnId === "Blocked") {
      onPromptStatus(taskToMove, "Blocked");
    } else if (targetColumnId === "Completed") {
      onPromptStatus(taskToMove, "Completed");
    } else if (taskToMove.status === "Completed") {
      // Trying to move out of completed
      onPromptStatus(taskToMove, "Reopen");
    } else {
      onDirectStatusChange(taskToMove, targetColumnId);
    }
  };

  return (
    <div className="w-full overflow-x-auto pb-6">
      <div className="grid min-w-[1280px] grid-cols-5 gap-4 px-1">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          const Icon = col.icon;
          const isOver = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={() => handleDragLeave(col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex flex-col rounded-2xl border transition ${
                isOver
                  ? "border-violet-500 bg-violet-50/40 ring-2 ring-violet-200"
                  : "border-slate-200 bg-slate-50/70"
              } p-3`}
            >
              {/* COLUMN HEADER */}
              <div className={`flex items-center justify-between rounded-xl border p-2.5 shadow-2xs ${col.headerColor}`}>
                <div className="flex items-center gap-2">
                  <Icon size={16} />
                  <span className="text-xs font-bold tracking-wide">{col.title}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${col.badgeColor}`}>
                    {colTasks.length}
                  </span>
                </div>
                {onCreateTaskWithStatus && (
                  <button
                    type="button"
                    title={`Create task in ${col.title}`}
                    onClick={() => onCreateTaskWithStatus(col.id)}
                    className="rounded-lg p-1 text-slate-500 hover:bg-white hover:text-slate-800 transition"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>

              {/* CARDS LIST */}
              <div className="mt-3 flex flex-1 flex-col gap-2.5 min-h-[450px]">
                {colTasks.map((task) => {
                  const overdueDays =
                    task.status !== "Completed"
                      ? calculateOverdueDays(task.dueDateValue)
                      : null;
                  const isUpdating = String(updatingTaskId) === String(task.id);
                  const checklistItems = Array.isArray(task.checklist) ? task.checklist : [];
                  const checklistCompleted = checklistItems.filter((i) => i.completed).length;

                  return (
                    <div
                      key={task.id}
                      draggable={!isUpdating}
                      onDragStart={(e) => handleDragStart(e, task)}
                      className={`group relative rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs transition hover:border-slate-300 hover:shadow-sm cursor-grab active:cursor-grabbing ${
                        isUpdating ? "opacity-60 pointer-events-none" : ""
                      } ${overdueDays ? "border-l-4 border-l-rose-500" : ""}`}
                    >
                      {/* TOP ROW: CODE, PRIORITY */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] font-semibold text-slate-500">
                          {task.taskNo || task.taskCode}
                        </span>
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${getPriorityBadge(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      {/* TITLE (CLICKABLE) */}
                      <h4
                        onClick={() => onOpenTask(task)}
                        className="mt-2 text-xs font-bold text-slate-900 line-clamp-2 cursor-pointer hover:text-violet-600 transition"
                      >
                        {task.title}
                      </h4>

                      {/* PROJECT BADGE */}
                      {(task.projectName || task.project) && (
                        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-600">
                          <FolderKanban size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate font-medium">{task.projectName || task.project}</span>
                        </div>
                      )}

                      {/* BLOCKED INFO BOX (VISIBLE ON CARD!) */}
                      {task.status === "Blocked" && (
                        <div className="mt-2.5 rounded-lg border border-rose-200 bg-rose-50/80 p-2 text-[11px] text-rose-900">
                          <p className="font-bold flex items-center gap-1 text-rose-700">
                            <ShieldAlert size={12} /> Reason:
                          </p>
                          <p className="mt-0.5 text-rose-800 line-clamp-2">
                            {task.blockerReason || "Administrative blocker"}
                          </p>
                          {task.waitingFor && (
                            <p className="mt-1 text-[10px] text-rose-600">
                              <span className="font-semibold">Waiting For:</span> {task.waitingFor}
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onResumeTask(task);
                            }}
                            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-rose-600 py-1 text-[10px] font-bold text-white shadow-xs hover:bg-rose-700 transition"
                          >
                            <Play size={11} /> Resume Task
                          </button>
                        </div>
                      )}

                      {/* CHECKLIST PROGRESS */}
                      {checklistItems.length > 0 && (
                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                          <span className="flex items-center gap-1 font-medium">
                            <CheckSquare size={11} className="text-violet-500" /> Checklist
                          </span>
                          <span className="font-bold text-slate-700">
                            {checklistCompleted}/{checklistItems.length}
                          </span>
                        </div>
                      )}

                      {/* FOOTER: ASSIGNEE & DUE DATE */}
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                        {/* ASSIGNEE */}
                        <div className="flex items-center gap-1.5 truncate max-w-[120px]" title={task.assignedEmployeeName}>
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 font-mono text-[9px] font-bold text-slate-700">
                            {task.initials || "—"}
                          </div>
                          <span className="truncate text-slate-600 text-[10px]">
                            {task.assignedEmployeeName || "Unassigned"}
                          </span>
                        </div>

                        {/* DUE DATE / OVERDUE */}
                        <div>
                          {overdueDays ? (
                            <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                              Overdue by {overdueDays}d
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] text-slate-500">
                              <Calendar size={11} />
                              {task.dueDate || "No date"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* CARD QUICK TRANSITION ACTION BAR */}
                      <div className="mt-2.5 flex items-center justify-between border-t border-slate-100/80 pt-2">
                        {task.status === "Assigned" && (
                          <button
                            type="button"
                            onClick={() => onDirectStatusChange(task, "In Progress")}
                            className="flex items-center gap-1 text-[10px] font-bold text-violet-700 hover:text-violet-900"
                          >
                            <Play size={10} fill="currentColor" /> Start Work
                          </button>
                        )}
                        {task.status === "In Progress" && (
                          <div className="flex items-center justify-between w-full">
                            <button
                              type="button"
                              onClick={() => onPromptStatus(task, "Blocked")}
                              className="text-[10px] font-semibold text-rose-600 hover:text-rose-800"
                            >
                              Block
                            </button>
                            <button
                              type="button"
                              onClick={() => onDirectStatusChange(task, "Testing")}
                              className="flex items-center gap-1 text-[10px] font-bold text-blue-700 hover:text-blue-900"
                            >
                              Testing <ArrowRight size={10} />
                            </button>
                          </div>
                        )}
                        {task.status === "Testing" && (
                          <div className="flex items-center justify-between w-full">
                            <button
                              type="button"
                              onClick={() => onPromptStatus(task, "Blocked")}
                              className="text-[10px] font-semibold text-rose-600 hover:text-rose-800"
                            >
                              Block
                            </button>
                            <button
                              type="button"
                              onClick={() => onPromptStatus(task, "Completed")}
                              className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-900"
                            >
                              Complete <CheckCircle2 size={10} />
                            </button>
                          </div>
                        )}
                        {task.status === "Completed" && (
                          <button
                            type="button"
                            onClick={() => onPromptStatus(task, "Reopen")}
                            className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 hover:text-amber-900 ml-auto"
                          >
                            <RotateCcw size={10} /> Reopen
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {colTasks.length === 0 && (
                  <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 py-10 text-center text-xs text-slate-400">
                    No {col.title.toLowerCase()} tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
