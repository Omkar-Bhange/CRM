import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
    AlertCircle,
    BriefcaseBusiness,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Filter,
    ListTodo,
    MoreHorizontal,
    Plus,
    RefreshCw,
    Search,
    Timer,
    UserCheck,
    ArrowLeft,
    Edit2,
    Trash2,
    Send,
    UserPlus,
    Mail,
    FileText,
    MessageSquare,
    Activity,
    Clock,
    Calendar,
    User,
    Building,
    FolderKanban,
    CheckSquare,
    X,
    ChevronDown,
    ChevronRight,
    ShieldAlert,
    Users,
} from "lucide-react";

import API_URL from "../../config/api";
import TaskKanbanBoard from "./TaskKanbanBoard";
import TaskDetailsDrawer from "./TaskDetailsDrawer";
import TaskStatusModal from "./TaskStatusModal";
import TaskCreateModal from "./TaskCreateModal";
import TaskEditModal from "./TaskEditModal";

function getStatusClasses(status) {
    if (status === "Completed") {
        return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";
    }
    if (status === "In Progress") {
        return "bg-violet-50 text-violet-700 ring-violet-600/10";
    }
    if (status === "Testing") {
        return "bg-blue-50 text-blue-700 ring-blue-600/10";
    }
    if (status === "Blocked" || status === "Waiting") {
        return "bg-rose-50 text-rose-700 ring-rose-600/10";
    }
    return "bg-slate-100 text-slate-600 ring-slate-500/10";
}

function getPriorityClasses(priority) {
    if (priority === "Critical") {
        return "bg-rose-50 text-rose-700 ring-rose-600/10";
    }
    if (priority === "High") {
        return "bg-orange-50 text-orange-700 ring-orange-600/10";
    }
    if (priority === "Medium") {
        return "bg-amber-50 text-amber-700 ring-amber-600/10";
    }
    return "bg-slate-100 text-slate-600 ring-slate-500/10";
}

function getTodayDateKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function parseAdminTaskDate(value) {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}

function isAdminTaskCompleted(task) {
    return ["Completed", "Resolved", "Closed"].includes(task?.status);
}

function isAdminTaskOverdue(task) {
    if (!task || isAdminTaskCompleted(task)) {
        return false;
    }
    const dueDate = parseAdminTaskDate(task.dueDateValue);
    const today = parseAdminTaskDate(getTodayDateKey());
    if (!dueDate || !today) {
        return false;
    }
    return dueDate < today;
}

function isAdminTaskDueToday(task) {
    if (!task || isAdminTaskCompleted(task)) {
        return false;
    }
    return task.dueDateValue === getTodayDateKey();
}

function formatMinutes(minutes) {
    if (!minutes || isNaN(minutes) || minutes <= 0) return "0h 0m";
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
}

function formatDateForDisplay(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function formatDateForInput(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
}

function AdminTaskQueueRow({
    task,
    onOpen,
    onMenu,
    updatingTaskId,
    taskMenu,
}) {
    const overdue = isAdminTaskOverdue(task);
    const dueToday = isAdminTaskDueToday(task);
    const completed = isAdminTaskCompleted(task);

    const displayProgress = completed
        ? 100
        : Math.min(Number(task.progress || 0), 100);

    return (
        <div
            onClick={() => onOpen(task)}
            className={`group grid cursor-pointer gap-3 border-t border-slate-100 px-4 py-2.5 transition first:border-t-0 hover:bg-slate-50/80 xl:grid-cols-[minmax(260px,1.65fr)_minmax(150px,1fr)_minmax(150px,1fr)_90px_110px_105px_140px_90px] xl:items-center ${
                overdue ? "bg-rose-50/30" : completed ? "bg-white" : ""
            }`}
        >
            {/* TASK */}
            <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold leading-4 text-slate-900">
                    {task.title}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-1.5">
                    <span className="text-[9px] font-bold text-violet-600">
                        {task.taskNo}
                    </span>
                    {task.workType && (
                        <>
                            <span className="text-[8px] text-slate-300">•</span>
                            <span className="truncate text-[9px] text-slate-500">
                                {task.workType}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* CLIENT / PROJECT */}
            <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-slate-800">
                    {task.client || "—"}
                </p>
                <p className="mt-0.5 truncate text-[9px] text-slate-500">
                    {task.project || "General"}
                </p>
            </div>

            {/* ASSIGNED TO */}
            <div className="flex min-w-0 items-center gap-2">
                <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold ${
                        task.assignedEmployeeId
                            ? "bg-slate-900 text-white"
                            : "bg-rose-100 text-rose-700"
                    }`}
                >
                    {task.assignedEmployeeId ? task.initials || "?" : "!"}
                </div>
                <div className="min-w-0">
                    <p
                        className={`truncate text-[10px] font-semibold ${
                            task.assignedEmployeeId ? "text-slate-700" : "text-rose-700"
                        }`}
                    >
                        {task.assignedEmployeeName || "Unassigned"}
                    </p>
                    {task.assignedEmployeeCode && (
                        <p className="mt-0.5 text-[8px] text-slate-400">
                            {task.assignedEmployeeCode}
                        </p>
                    )}
                </div>
            </div>

            {/* PRIORITY */}
            <div>
                <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ring-1 ring-inset ${getPriorityClasses(
                        task.priority
                    )}`}
                >
                    {task.priority}
                </span>
            </div>

            {/* STATUS */}
            <div>
                <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ring-1 ring-inset ${getStatusClasses(
                        task.status
                    )}`}
                >
                    {task.status}
                </span>
            </div>

            {/* DUE */}
            <div>
                <p
                    className={`text-[10px] font-semibold ${
                        overdue
                            ? "text-rose-700"
                            : dueToday
                            ? "text-amber-700"
                            : completed
                            ? "text-emerald-700"
                            : "text-slate-700"
                    }`}
                >
                    {completed ? "Completed" : task.dueDate}
                </p>
                {!completed && (overdue || dueToday) && (
                    <p
                        className={`mt-0.5 text-[8px] font-semibold ${
                            overdue ? "text-rose-500" : "text-amber-500"
                        }`}
                    >
                        {overdue ? "Overdue" : "Due today"}
                    </p>
                )}
            </div>

            {/* PROGRESS */}
            <div>
                <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                            className={`h-full rounded-full ${
                                completed ? "bg-emerald-500" : "bg-violet-500"
                            }`}
                            style={{
                                width: `${displayProgress}%`,
                            }}
                        />
                    </div>
                    <span className="w-8 text-right text-[9px] font-semibold text-slate-600">
                        {displayProgress}%
                    </span>
                </div>
                <p className="mt-1 text-[8px] text-slate-400">
                    {task.spentTime} / {task.estimatedTime}
                </p>
            </div>

            {/* ACTION */}
            <div
                className="flex justify-end gap-1.5"
                onClick={(event) => event.stopPropagation()}
            >
                <button
                    type="button"
                    disabled={updatingTaskId === task.id}
                    onClick={() => onOpen(task)}
                    className="flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-semibold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-60"
                >
                    {updatingTaskId === task.id ? (
                        <RefreshCw size={13} className="animate-spin" />
                    ) : (
                        "Open"
                    )}
                </button>
                <button
                    type="button"
                    onClick={(event) => onMenu(event, task)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                        taskMenu.task && String(taskMenu.task.id) === String(task.id)
                            ? "border-violet-300 bg-violet-50 text-violet-700"
                            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                >
                    <MoreHorizontal size={15} />
                </button>
            </div>
        </div>
    );
}

function AdminTaskSection({
    section,
    expanded,
    onToggle,
    onOpenTask,
    onOpenMenu,
    updatingTaskId,
    taskMenu,
}) {
    const Icon = section.icon;

    const toneClasses = {
        danger: {
            wrapper: "border-rose-200",
            header: "bg-gradient-to-r from-rose-50 via-white to-white hover:from-rose-100/70",
            icon: "bg-rose-100 text-rose-700",
            count: "bg-rose-100 text-rose-700",
        },
        active: {
            wrapper: "border-blue-200 shadow-2xs",
            header: "bg-gradient-to-r from-blue-50/50 via-white to-white hover:from-blue-100/40",
            icon: "bg-blue-50 text-[#1B59F8]",
            count: "bg-blue-100 text-[#1B59F8]",
        },
        success: {
            wrapper: "border-emerald-200",
            header: "bg-emerald-50/60 hover:bg-emerald-50",
            icon: "bg-emerald-100 text-emerald-700",
            count: "bg-emerald-100 text-emerald-700",
        },
        completed: {
            wrapper: "border-slate-200",
            header: "bg-slate-50/80 hover:bg-slate-100",
            icon: "bg-slate-100 text-slate-600",
            count: "bg-slate-200 text-slate-600",
        },
        empty: {
            wrapper: "border-slate-200",
            header: "bg-gradient-to-r from-slate-50 to-white hover:bg-slate-50",
            icon: "bg-emerald-50 text-emerald-600",
            count: "bg-slate-100 text-slate-500",
        },
    };

    const tone = toneClasses[section.tone] || toneClasses.completed;

    return (
        <section className={`overflow-hidden rounded-xl border bg-white ${tone.wrapper}`}>
            <button
                type="button"
                onClick={onToggle}
                className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition ${tone.header}`}
            >
                <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone.icon}`}>
                        <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xs font-bold text-slate-900">{section.title}</h3>
                            <span className={`inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-[9px] font-bold ${tone.count}`}>
                                {section.tasks.length}
                            </span>
                        </div>
                        <p className="mt-1 text-[10px] text-slate-500">{section.subtitle}</p>
                    </div>
                </div>

                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm">
                    {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
            </button>

            {expanded && (
                <div className="border-t border-slate-100">
                    {section.tasks.length > 0 && (
                        <div className="hidden grid-cols-[minmax(260px,1.65fr)_minmax(150px,1fr)_minmax(150px,1fr)_90px_110px_105px_140px_90px] gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-2 xl:grid">
                            <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">Task</span>
                            <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">Client / Project</span>
                            <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">Assigned To</span>
                            <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">Priority</span>
                            <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">Status</span>
                            <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">Due</span>
                            <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">Progress / Time</span>
                            <span className="text-right text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">Action</span>
                        </div>
                    )}

                    {section.tasks.length > 0 ? (
                        section.tasks.map((task) => (
                            <AdminTaskQueueRow
                                key={task.id}
                                task={task}
                                onOpen={onOpenTask}
                                onMenu={onOpenMenu}
                                updatingTaskId={updatingTaskId}
                                taskMenu={taskMenu}
                            />
                        ))
                    ) : (
                        <div className="flex items-center justify-center gap-2 py-3.5 text-xs text-slate-400">
                            <CheckCircle2 size={14} className="text-emerald-500" />
                            <span>
                                {section.id === "attention"
                                    ? "No tasks require attention"
                                    : section.id === "active"
                                    ? "No active tasks"
                                    : section.id === "completedToday"
                                    ? "No tasks completed today"
                                    : "No previous completed tasks"}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}

export default function Tasks({
    initialProject = null,
    onInitialProjectHandled = null,
    employees: initialEmployees = [],
    projects: initialProjects = [],
}) {
    const getAuthToken = () =>
        localStorage.getItem("client-connect-token") ||
        sessionStorage.getItem("client-connect-token") ||
        "";

    const [tasks, setTasks] = useState([]);
    const [employees, setEmployees] = useState(initialEmployees);
    const [clients, setClients] = useState([]);
    const [projects, setProjects] = useState(initialProjects);
    const [products, setProducts] = useState([]);

    const [tasksLoading, setTasksLoading] = useState(true);
    const [tasksError, setTasksError] = useState("");
    const [updatingTaskId, setUpdatingTaskId] = useState(null);

    // FILTERS
    const [searchValue, setSearchValue] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [employeeFilter, setEmployeeFilter] = useState("All");
    const [projectFilter, setProjectFilter] = useState("All");
    const [clientFilter, setClientFilter] = useState("All");
    const [dueFilter, setDueFilter] = useState("All");
    const [filtersOpen, setFiltersOpen] = useState(false);

    // VIEW
    const [taskView, setTaskView] = useState("list"); // "list" | "board"

    // SECTIONS TOGGLE
    const [openAdminTaskSections, setOpenAdminTaskSections] = useState({
        attention: false,
        active: true,
        completedToday: false,
        completedPrevious: false,
    });

    // MODAL STATES
    const [selectedTask, setSelectedTask] = useState(null);
    const [createTaskOpen, setCreateTaskOpen] = useState(false);
    const [preselectedProject, setPreselectedProject] = useState(null);
    const [newTaskInitialStatus, setNewTaskInitialStatus] = useState("Assigned");
    const [editTaskOpen, setEditTaskOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);

    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [statusModalTask, setStatusModalTask] = useState(null);
    const [statusModalTarget, setStatusModalTarget] = useState("Blocked");
    const [statusModalLoading, setStatusModalLoading] = useState(false);

    const [taskMenu, setTaskMenu] = useState({
        task: null,
        top: 0,
        left: 0,
    });
    const [deletingTaskId, setDeletingTaskId] = useState(null);

    // NORMALIZE TASK HELPER
    const normalizeTaskFromApi = (task) => {
        const assignedEmployeeName = task.assignedEmployeeName || "";
        return {
            ...task,
            id: task._id || task.id,
            taskNo: task.taskCode || task.taskNo || "",
            taskCode: task.taskCode || task.taskNo || "",
            clientId: task.clientId ? String(task.clientId) : "",
            productId: task.productId ? String(task.productId) : "",
            client: task.clientName || task.client || "Internal Development",
            clientName: task.clientName || task.client || "Internal Development",
            projectId: task.projectId ? String(task.projectId) : "",
            projectCode: task.projectCode || "",
            projectName: task.projectName || "",
            project: task.projectName || task.project || "",
            assignedEmployeeId:
                task.assignedEmployeeId?._id || task.assignedEmployeeId
                    ? String(task.assignedEmployeeId?._id || task.assignedEmployeeId)
                    : "",
            assignedEmployeeCode: task.assignedEmployeeCode || "",
            assignedEmployeeName: task.assignedEmployeeName || "Not assigned",
            initials: String(assignedEmployeeName || "")
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((word) => word.charAt(0).toUpperCase())
                .join(""),
            priority: task.priority || "Medium",
            status: task.status || "Assigned",
            dueDate: formatDateForDisplay(task.dueDate),
            dueDateValue: formatDateForInput(task.dueDate),
            estimatedTime: formatMinutes(task.estimatedMinutes),
            spentTime: formatMinutes(task.spentMinutes),
            estimatedMinutes: Number(task.estimatedMinutes || 0),
            spentMinutes: Number(task.spentMinutes || 0),
            progress: Number(task.progress || 0),
            description: task.description || "",
            checklist: Array.isArray(task.checklist) ? task.checklist : [],
            blockerReason: task.blockerReason || "",
            waitingFor: task.waitingFor || "",
            expectedResolutionDate: task.expectedResolutionDate || null,
            resolutionNote: task.resolutionNote || "",
            comments: Array.isArray(task.comments) ? task.comments : [],
            timeline: Array.isArray(task.timeline) ? task.timeline : [],
            attachments: Array.isArray(task.attachments) ? task.attachments : [],
        };
    };

    // FETCHING
    const loadTasks = async () => {
        try {
            setTasksLoading(true);
            setTasksError("");
            const res = await fetch(`${API_URL}/api/admin/tasks`, {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${getAuthToken()}`,
                },
            });
            const result = await res.json();
            if (!res.ok || !result.success) {
                throw new Error(result.message || "Unable to load tasks.");
            }
            const normalized = Array.isArray(result.data) ? result.data.map(normalizeTaskFromApi) : [];
            setTasks(normalized);
        } catch (err) {
            console.error("Load tasks error:", err);
            setTasksError(err.message || "Failed to load tasks.");
        } finally {
            setTasksLoading(false);
        }
    };

    const loadEmployees = async () => {
        try {
            const res = await fetch(`${API_URL}/api/admin/employees`, {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${getAuthToken()}`,
                },
            });
            const result = await res.json();
            if (res.ok && result.success && Array.isArray(result.data)) {
                setEmployees(result.data);
            }
        } catch (err) {
            console.error("Load employees error:", err);
        }
    };

    const loadClients = async () => {
        try {
            const res = await fetch(`${API_URL}/api/admin/clients`, {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${getAuthToken()}`,
                },
            });
            const result = await res.json();
            if (res.ok && result.success && Array.isArray(result.data)) {
                setClients(result.data);
            }
        } catch (err) {
            console.error("Load clients error:", err);
        }
    };

    const loadProjects = async () => {
        try {
            const res = await fetch(`${API_URL}/api/admin/projects`, {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${getAuthToken()}`,
                },
            });
            const result = await res.json();
            if (res.ok && result.success && Array.isArray(result.data)) {
                setProjects(result.data);
            }
        } catch (err) {
            console.error("Load projects error:", err);
        }
    };

    const loadProducts = async () => {
        try {
            const res = await fetch(`${API_URL}/api/admin/products`, {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${getAuthToken()}`,
                },
            });
            const result = await res.json();
            if (res.ok && result.success && Array.isArray(result.data)) {
                setProducts(result.data);
            }
        } catch (err) {
            console.error("Load products error:", err);
        }
    };

    useEffect(() => {
        loadTasks();
        if (!initialEmployees || initialEmployees.length === 0) loadEmployees();
        if (!initialProjects || initialProjects.length === 0) loadProjects();
        loadClients();
        loadProducts();
    }, []);

    // HANDLE INITIAL PROJECT PROP (FROM PHASE 3)
    useEffect(() => {
        if (initialProject) {
            setPreselectedProject(initialProject);
            setCreateTaskOpen(true);
            if (typeof onInitialProjectHandled === "function") {
                onInitialProjectHandled();
            }
        }
    }, [initialProject]);

    // FILTERED TASKS
    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            const search = searchValue.trim().toLowerCase();
            const matchesSearch =
                !search ||
                [
                    task.taskNo,
                    task.taskCode,
                    task.title,
                    task.workType,
                    task.client,
                    task.projectCode,
                    task.projectName,
                    task.project,
                    task.assignedEmployeeCode,
                    task.assignedEmployeeName,
                    task.priority,
                    task.status,
                    task.blockerReason,
                ].some((val) => String(val || "").toLowerCase().includes(search));

            const matchesStatus = statusFilter === "All" || task.status === statusFilter;
            const matchesPriority = priorityFilter === "All" || task.priority === priorityFilter;
            const matchesEmployee =
                employeeFilter === "All" || String(task.assignedEmployeeId) === String(employeeFilter);
            const matchesProject =
                projectFilter === "All" || String(task.projectId) === String(projectFilter);
            const matchesClient =
                clientFilter === "All" || String(task.clientId) === String(clientFilter);

            let matchesDue = true;
            if (dueFilter === "Overdue") {
                matchesDue = isAdminTaskOverdue(task);
            } else if (dueFilter === "Due Today") {
                matchesDue = isAdminTaskDueToday(task);
            } else if (dueFilter === "Upcoming") {
                matchesDue =
                    !isAdminTaskCompleted(task) &&
                    !isAdminTaskOverdue(task) &&
                    !isAdminTaskDueToday(task);
            }

            return (
                matchesSearch &&
                matchesStatus &&
                matchesPriority &&
                matchesEmployee &&
                matchesProject &&
                matchesClient &&
                matchesDue
            );
        });
    }, [
        tasks,
        searchValue,
        statusFilter,
        priorityFilter,
        employeeFilter,
        projectFilter,
        clientFilter,
        dueFilter,
    ]);

    // SECTIONS COMPUTATION
    const adminTaskSections = useMemo(() => {
        const activeTasks = filteredTasks.filter((task) => !isAdminTaskCompleted(task));
        const completedTasks = filteredTasks.filter((task) => isAdminTaskCompleted(task));
        const overdueTasks = activeTasks.filter((task) => isAdminTaskOverdue(task));
        const dueTodayTasks = activeTasks.filter((task) => isAdminTaskDueToday(task));
        const blockedTasks = activeTasks.filter((task) =>
            ["Blocked", "Waiting"].includes(task.status)
        );
        const unassignedTasks = activeTasks.filter((task) => !task.assignedEmployeeId);

        const attentionMap = new Map();
        [...overdueTasks, ...blockedTasks, ...unassignedTasks].forEach((t) => {
            attentionMap.set(String(t.id), t);
        });

        const todayKey = getTodayDateKey();
        const completedTodayTasks = completedTasks.filter((t) => {
            const compDate = t.completedAt ? formatDateForInput(t.completedAt) : "";
            return compDate === todayKey;
        });

        const completedEarlierTasks = completedTasks.filter((t) => {
            const compDate = t.completedAt ? formatDateForInput(t.completedAt) : "";
            return compDate !== todayKey;
        });

        return [
            {
                id: "attention",
                title: "Attention Needed",
                subtitle: "Overdue, blocked, or unassigned tasks",
                icon: AlertCircle,
                tone: "danger",
                tasks: Array.from(attentionMap.values()),
            },
            {
                id: "active",
                title: "Active Tasks",
                subtitle: "Currently assigned and in-progress work",
                icon: Clock3,
                tone: "active",
                tasks: activeTasks,
            },
            {
                id: "completedToday",
                title: "Completed Today",
                subtitle: "Finished tasks logged today",
                icon: CheckCircle2,
                tone: "success",
                tasks: completedTodayTasks,
            },
            {
                id: "completedPrevious",
                title: "Completed Earlier",
                subtitle: "Archived finished tasks",
                icon: CheckCircle2,
                tone: "completed",
                tasks: completedEarlierTasks,
            },
        ];
    }, [filteredTasks]);

    // STATUS TRANSITION ACTIONS
    const handleStatusTransition = async (task, payload) => {
        const taskId = task.id || task._id;
        try {
            setUpdatingTaskId(taskId);
            const response = await fetch(`${API_URL}/api/admin/task/${taskId}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getAuthToken()}`,
                },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to update task status.");
            }
            const updatedTask = normalizeTaskFromApi(result.data);
            setTasks((current) =>
                current.map((t) => (String(t.id) === String(taskId) ? updatedTask : t))
            );
            if (selectedTask && String(selectedTask.id) === String(taskId)) {
                setSelectedTask(updatedTask);
            }
            setStatusModalOpen(false);
            setStatusModalTask(null);
            return updatedTask;
        } catch (error) {
            console.error("Update task status error:", error);
            alert(error.message || "Unable to update task status.");
            throw error;
        } finally {
            setUpdatingTaskId(null);
        }
    };

    const handleDirectStatusChange = async (task, nextStatus) => {
        await handleStatusTransition(task, { status: nextStatus });
    };

    const handlePromptStatus = (task, targetStatus) => {
        setStatusModalTask(task);
        setStatusModalTarget(targetStatus);
        setStatusModalOpen(true);
    };

    const handleResumeTask = async (task) => {
        let target = "In Progress";
        if (Array.isArray(task.timeline) && task.timeline.length > 0) {
            for (let i = task.timeline.length - 1; i >= 0; i--) {
                const entry = task.timeline[i];
                const match = entry?.description?.match(/Status changed from (\w+(?:\s+\w+)*) to Blocked/i);
                if (match && match[1] && match[1] !== "Blocked") {
                    target = match[1];
                    break;
                }
            }
        }
        await handleStatusTransition(task, {
            status: target,
            note: "Resumed from Blocked.",
        });
    };

    const handleStatusModalSubmit = async (payload) => {
        if (!statusModalTask) return;
        try {
            setStatusModalLoading(true);
            await handleStatusTransition(statusModalTask, payload);
        } finally {
            setStatusModalLoading(false);
        }
    };

    const handleDeleteTask = async (task) => {
        if (!window.confirm(`Are you sure you want to delete task "${task.title}"?`)) return;
        const taskId = task.id || task._id;
        try {
            setDeletingTaskId(taskId);
            const res = await fetch(`${API_URL}/api/admin/task/${taskId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${getAuthToken()}`,
                },
            });
            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.message || "Failed to delete task.");
            setTasks((prev) => prev.filter((t) => String(t.id) !== String(taskId)));
            if (selectedTask && String(selectedTask.id) === String(taskId)) {
                setSelectedTask(null);
            }
        } catch (err) {
            alert(err.message || "Error deleting task.");
        } finally {
            setDeletingTaskId(null);
        }
    };

    const handleTaskCreated = (newTask) => {
        const normalized = normalizeTaskFromApi(newTask);
        setTasks((prev) => [normalized, ...prev]);
        setCreateTaskOpen(false);
        setPreselectedProject(null);
    };

    const handleTaskUpdated = (updated) => {
        const normalized = normalizeTaskFromApi(updated);
        setTasks((prev) =>
            prev.map((t) => (String(t.id) === String(normalized.id) ? normalized : t))
        );
        if (selectedTask && String(selectedTask.id) === String(normalized.id)) {
            setSelectedTask(normalized);
        }
    };

    const closeTaskActionMenu = () => {
        setTaskMenu({ task: null, top: 0, left: 0 });
    };

    const activeTasksCount = tasks.filter((t) => !isAdminTaskCompleted(t)).length;
    const completedCount = tasks.filter((t) => isAdminTaskCompleted(t)).length;
    const unassignedCount = tasks.filter((t) => !isAdminTaskCompleted(t) && !t.assignedEmployeeId).length;

    return (
        <div className="w-full space-y-5">
            {/* TOP HEADER */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">
                        Task Management
                    </h1>
                    <p className="mt-0.5 text-xs text-slate-500">
                        {activeTasksCount} active · {completedCount} completed · {unassignedCount} unassigned
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={loadTasks}
                        disabled={tasksLoading}
                        className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 transition"
                    >
                        <RefreshCw size={13} className={tasksLoading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setNewTaskInitialStatus("Assigned");
                            setCreateTaskOpen(true);
                        }}
                        className="flex h-9 items-center gap-1.5 rounded-xl bg-violet-600 px-4 text-xs font-bold text-white shadow-md shadow-violet-200 hover:bg-violet-700 transition"
                    >
                        <Plus size={15} />
                        New Task
                    </button>
                </div>
            </div>

            {/* FILTER & VIEW BAR */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    {/* VIEW SWITCHER & SEARCH */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <div className="flex rounded-lg border border-slate-200 bg-slate-50/80 p-0.5">
                            {[
                                { id: "list", label: "List View" },
                                { id: "board", label: "Board View" },
                            ].map((view) => (
                                <button
                                    key={view.id}
                                    type="button"
                                    onClick={() => setTaskView(view.id)}
                                    className={`h-7 rounded-md px-3 text-xs font-medium transition ${
                                        taskView === view.id
                                            ? "bg-white text-slate-900 shadow-2xs font-bold"
                                            : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    {view.label}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full sm:w-64">
                            <Search
                                size={14}
                                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                type="text"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                placeholder="Search by title, code, client, project..."
                                className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() => setFiltersOpen(!filtersOpen)}
                            className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition ${
                                filtersOpen ||
                                statusFilter !== "All" ||
                                priorityFilter !== "All" ||
                                employeeFilter !== "All" ||
                                projectFilter !== "All" ||
                                clientFilter !== "All" ||
                                dueFilter !== "All"
                                    ? "border-violet-200 bg-violet-50 text-violet-700"
                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                            <Filter size={13} />
                            Filters
                            {(statusFilter !== "All" ||
                                priorityFilter !== "All" ||
                                employeeFilter !== "All" ||
                                projectFilter !== "All" ||
                                clientFilter !== "All" ||
                                dueFilter !== "All") && (
                                <span className="h-1.5 w-1.5 rounded-full bg-violet-600" />
                            )}
                        </button>
                    </div>

                    <div className="text-[11px] font-semibold text-slate-500">
                        Showing {filteredTasks.length} of {tasks.length} tasks
                    </div>
                </div>

                {/* EXPANDABLE FILTER OPTIONS */}
                {filtersOpen && (
                    <div className="mt-3 border-t border-slate-100 pt-3">
                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                            <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                                    Project
                                </label>
                                <select
                                    value={projectFilter}
                                    onChange={(e) => setProjectFilter(e.target.value)}
                                    className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                >
                                    <option value="All">All Projects</option>
                                    {projects.map((p) => (
                                        <option key={p._id || p.id} value={String(p._id || p.id)}>
                                            {p.name || p.projectName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                                    Assignee
                                </label>
                                <select
                                    value={employeeFilter}
                                    onChange={(e) => setEmployeeFilter(e.target.value)}
                                    className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                >
                                    <option value="All">All Assignees</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id || emp._id} value={String(emp.id || emp._id)}>
                                            {emp.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                                    Status
                                </label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="Assigned">Assigned</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Testing">Testing</option>
                                    <option value="Blocked">Blocked</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                                    Priority
                                </label>
                                <select
                                    value={priorityFilter}
                                    onChange={(e) => setPriorityFilter(e.target.value)}
                                    className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                >
                                    <option value="All">All Priorities</option>
                                    <option value="Critical">Critical</option>
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                                    Schedule
                                </label>
                                <select
                                    value={dueFilter}
                                    onChange={(e) => setDueFilter(e.target.value)}
                                    className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                >
                                    <option value="All">All Schedules</option>
                                    <option value="Overdue">Overdue Only</option>
                                    <option value="Due Today">Due Today</option>
                                    <option value="Upcoming">Upcoming</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                                    Client
                                </label>
                                <select
                                    value={clientFilter}
                                    onChange={(e) => setClientFilter(e.target.value)}
                                    className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                >
                                    <option value="All">All Clients</option>
                                    {clients.map((c) => (
                                        <option key={c._id || c.id} value={String(c._id || c.id)}>
                                            {c.companyName || c.clientName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-3 flex justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchValue("");
                                    setStatusFilter("All");
                                    setPriorityFilter("All");
                                    setEmployeeFilter("All");
                                    setProjectFilter("All");
                                    setClientFilter("All");
                                    setDueFilter("All");
                                }}
                                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                            >
                                Reset All Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* VIEW CONTENT */}
            {taskView === "list" ? (
                <div className="space-y-3">
                    {adminTaskSections.map((section) => (
                        <AdminTaskSection
                            key={section.id}
                            section={section}
                            expanded={openAdminTaskSections[section.id] ?? false}
                            onToggle={() =>
                                setOpenAdminTaskSections((prev) => ({
                                    ...prev,
                                    [section.id]: !prev[section.id],
                                }))
                            }
                            onOpenTask={(task) => setSelectedTask(task)}
                            onOpenMenu={(e, task) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setTaskMenu({
                                    task,
                                    top: rect.bottom + window.scrollY,
                                    left: rect.left + window.scrollX - 120,
                                });
                            }}
                            updatingTaskId={updatingTaskId}
                            taskMenu={taskMenu}
                        />
                    ))}
                </div>
            ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                    <TaskKanbanBoard
                        tasks={filteredTasks}
                        onOpenTask={(task) => setSelectedTask(task)}
                        onDirectStatusChange={handleDirectStatusChange}
                        onPromptStatus={handlePromptStatus}
                        onResumeTask={handleResumeTask}
                        onCreateTaskWithStatus={(status) => {
                            setNewTaskInitialStatus(status);
                            setCreateTaskOpen(true);
                        }}
                        updatingTaskId={updatingTaskId}
                    />
                </div>
            )}

            {/* TASK DETAILS DRAWER */}
            <TaskDetailsDrawer
                task={selectedTask}
                isOpen={Boolean(selectedTask)}
                onClose={() => setSelectedTask(null)}
                onEditTask={(task) => {
                    setEditingTask(task);
                    setEditTaskOpen(true);
                }}
                onDeleteTask={handleDeleteTask}
                onDirectStatusChange={handleDirectStatusChange}
                onPromptStatus={handlePromptStatus}
                onResumeTask={handleResumeTask}
                onTaskUpdated={handleTaskUpdated}
                employees={employees}
                projects={projects}
                getAuthToken={getAuthToken}
            />

            {/* STATUS TRANSITION MODAL (BLOCKED / COMPLETED / REOPEN) */}
            <TaskStatusModal
                isOpen={statusModalOpen}
                task={statusModalTask}
                targetStatus={statusModalTarget}
                onClose={() => {
                    setStatusModalOpen(false);
                    setStatusModalTask(null);
                }}
                onSubmit={handleStatusModalSubmit}
                loading={statusModalLoading}
            />

            {/* CREATE TASK MODAL */}
            <TaskCreateModal
                isOpen={createTaskOpen}
                onClose={() => {
                    setCreateTaskOpen(false);
                    setPreselectedProject(null);
                }}
                initialProject={preselectedProject}
                initialStatus={newTaskInitialStatus}
                projects={projects}
                employees={employees}
                clients={clients}
                products={products}
                onTaskCreated={handleTaskCreated}
                getAuthToken={getAuthToken}
            />

            {/* EDIT TASK MODAL */}
            <TaskEditModal
                isOpen={editTaskOpen}
                task={editingTask}
                onClose={() => {
                    setEditTaskOpen(false);
                    setEditingTask(null);
                }}
                projects={projects}
                employees={employees}
                clients={clients}
                onTaskUpdated={handleTaskUpdated}
                getAuthToken={getAuthToken}
            />

            {/* CONTEXT MENU PORTAL */}
            {taskMenu.task &&
                createPortal(
                    <>
                        <button
                            type="button"
                            aria-label="Close task actions"
                            onClick={closeTaskActionMenu}
                            className="fixed inset-0 z-[9998] cursor-default bg-transparent"
                        />
                        <div
                            onMouseDown={(e) => e.stopPropagation()}
                            className="fixed z-[9999] w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-2xl text-xs font-semibold"
                            style={{
                                top: `${taskMenu.top}px`,
                                left: `${taskMenu.left}px`,
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    const t = taskMenu.task;
                                    closeTaskActionMenu();
                                    setSelectedTask(t);
                                }}
                                className="flex w-full items-center px-4 py-2 text-slate-700 hover:bg-slate-50 transition"
                            >
                                Open Details
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const t = taskMenu.task;
                                    closeTaskActionMenu();
                                    setEditingTask(t);
                                    setEditTaskOpen(true);
                                }}
                                className="flex w-full items-center px-4 py-2 text-slate-700 hover:bg-slate-50 transition"
                            >
                                Edit Task
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const t = taskMenu.task;
                                    closeTaskActionMenu();
                                    handlePromptStatus(t, "Blocked");
                                }}
                                className="flex w-full items-center px-4 py-2 text-rose-700 hover:bg-rose-50 transition"
                            >
                                Block Task
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const t = taskMenu.task;
                                    closeTaskActionMenu();
                                    handlePromptStatus(t, "Completed");
                                }}
                                className="flex w-full items-center px-4 py-2 text-emerald-700 hover:bg-emerald-50 transition"
                            >
                                Mark Completed
                            </button>
                            <div className="my-1 border-t border-slate-100" />
                            <button
                                type="button"
                                disabled={deletingTaskId === taskMenu.task.id}
                                onClick={() => {
                                    const t = taskMenu.task;
                                    closeTaskActionMenu();
                                    handleDeleteTask(t);
                                }}
                                className="flex w-full items-center px-4 py-2 text-rose-600 hover:bg-rose-50 transition"
                            >
                                Delete Task
                            </button>
                        </div>
                    </>,
                    document.body
                )}
        </div>
    );
}
