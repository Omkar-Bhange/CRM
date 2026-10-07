import API_URL from "../config/api";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    AlertCircle,
    ArrowLeft,
    BriefcaseBusiness,
    CalendarDays,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronRight,

    Circle,
    Clock3,
    File,
    FileText,
    Filter,
    Headphones,
    ListChecks,
    MessageSquare,
    MoreHorizontal,
    Paperclip,
    Pause,
    Play,
    Plus,
    Search,
    Send,
    Timer,
    Trash2,
    Upload,
    UserRound,
    X,
    ShieldAlert,
} from "lucide-react";
import TaskStatusModal from "../admin/tasks/TaskStatusModal";

const initialTasks = [
    {
        id: 1,
        taskNo: "TSK-2084",
        ticketNo: "TKT-1042",
        title: "Fix GST report mismatch",
        description:
            "Investigate the monthly GST summary mismatch and verify the taxable value calculation with sample sales invoices.",
        workType: "Client Support",
        client: "Shree Ganesh Industries",
        clientCode: "CL-1001",
        project: "NexERP",
        module: "GST Reports",
        assignedBy: "Mangesh Kondhare",
        priority: "High",
        status: "In Progress",
        dueDate: "2026-07-14",
        estimatedMinutes: 150,
        spentSeconds: 8142,
        progress: 70,
        createdAt: "2026-07-14T09:10:00",
        startedAt: "2026-07-14T09:30:00",
    },
    {
        id: 2,
        taskNo: "TSK-2087",
        ticketNo: "TKT-1041",
        title: "Resolve barcode printer driver issue",
        description:
            "Verify printer driver compatibility and test barcode printing from the RetailPOS billing module.",
        workType: "Client Support",
        client: "Omkar Traders",
        clientCode: "CL-1003",
        project: "RetailPOS",
        module: "Barcode Printing",
        assignedBy: "Mangesh Kondhare",
        priority: "Critical",
        status: "Assigned",
        dueDate: "2026-07-14",
        estimatedMinutes: 120,
        spentSeconds: 0,
        progress: 0,
        createdAt: "2026-07-14T10:15:00",
        startedAt: "",
    },
    {
        id: 3,
        taskNo: "TSK-2089",
        ticketNo: "",
        title: "Complete StockPro module testing",
        description:
            "Test stock transfer, purchase stock update and batch-wise stock reports before internal release.",
        workType: "Internal Development",
        client: "Internal Development",
        clientCode: "",
        project: "StockPro",
        module: "Inventory",
        assignedBy: "Mangesh Kondhare",
        priority: "Medium",
        status: "Testing",
        dueDate: "2026-07-15",
        estimatedMinutes: 240,
        spentSeconds: 7200,
        progress: 60,
        createdAt: "2026-07-13T14:30:00",
        startedAt: "2026-07-14T11:00:00",
    },
    {
        id: 4,
        taskNo: "TSK-2090",
        ticketNo: "",
        title: "Prepare NexERP installation checklist",
        description:
            "Prepare a standard installation and onboarding checklist for new NexERP customers.",
        workType: "Documentation",
        client: "Internal Development",
        clientCode: "",
        project: "NexERP",
        module: "Documentation",
        assignedBy: "Mangesh Kondhare",
        priority: "Low",
        status: "Assigned",
        dueDate: "2026-07-18",
        estimatedMinutes: 180,
        spentSeconds: 0,
        progress: 0,
        createdAt: "2026-07-14T12:10:00",
        startedAt: "",
    },
    {
        id: 5,
        taskNo: "TSK-2072",
        ticketNo: "TKT-1038",
        title: "Create new user login",
        description:
            "Create and verify the requested StockPro user account with the correct permissions.",
        workType: "Client Support",
        client: "GreenLeaf Agro",
        clientCode: "CL-1005",
        project: "StockPro",
        module: "User Permissions",
        assignedBy: "Mangesh Kondhare",
        priority: "Low",
        status: "Completed",
        dueDate: "2026-07-08",
        estimatedMinutes: 45,
        spentSeconds: 2100,
        progress: 100,
        createdAt: "2026-07-08T09:00:00",
        startedAt: "2026-07-08T09:20:00",
        completedAt: "2026-07-08T09:55:00",
    },
];

const initialChecklists = [
    {
        id: 1,
        taskId: 1,
        title: "Reproduce GST mismatch",
        completed: true,
    },
    {
        id: 2,
        taskId: 1,
        title: "Verify taxable value calculation",
        completed: true,
    },
    {
        id: 3,
        taskId: 1,
        title: "Test three sample invoices",
        completed: false,
    },
    {
        id: 4,
        taskId: 1,
        title: "Confirm corrected report with client",
        completed: false,
    },
    {
        id: 5,
        taskId: 2,
        title: "Verify installed printer driver",
        completed: false,
    },
    {
        id: 6,
        taskId: 2,
        title: "Test sample barcode print",
        completed: false,
    },
];

const initialComments = [
    {
        id: 1,
        taskId: 1,
        user: "Mangesh Kondhare",
        initials: "MK",
        message:
            "Please verify the report with at least three sample invoices before sharing the update with the client.",
        createdAt: "14 Jul 2026, 10:20 AM",
    },
    {
        id: 2,
        taskId: 1,
        user: "Akash Pawar",
        initials: "AP",
        message:
            "The mismatch appears to be related to taxable-value rounding. I am testing the corrected query now.",
        createdAt: "14 Jul 2026, 11:05 AM",
    },
];

const initialFiles = [
    {
        id: 1,
        taskId: 1,
        name: "GST_Report_Sample.xlsx",
        type: "Excel",
        size: "248 KB",
        uploadedBy: "Akash Pawar",
        uploadedAt: "14 Jul 2026, 11:32 AM",
    },
    {
        id: 2,
        taskId: 1,
        name: "GST_Mismatch_Screenshot.png",
        type: "Image",
        size: "1.2 MB",
        uploadedBy: "Mangesh Kondhare",
        uploadedAt: "14 Jul 2026, 10:18 AM",
    },
];

const initialWorkLogs = [
    {
        id: 1,
        taskId: 1,
        date: "14 Jul 2026",
        startTime: "09:30 AM",
        endTime: "10:45 AM",
        duration: "1h 15m",
        note: "Verified report totals and identified taxable-value rounding difference.",
    },
    {
        id: 2,
        taskId: 1,
        date: "14 Jul 2026",
        startTime: "11:10 AM",
        endTime: "11:40 AM",
        duration: "30m",
        note: "Updated report query and tested sample invoices.",
    },
];

const initialTimeline = [
    {
        id: 1,
        taskId: 1,
        type: "created",
        title: "Task created",
        description: "Task created from support ticket TKT-1042.",
        createdAt: "14 Jul 2026, 09:10 AM",
    },
    {
        id: 2,
        taskId: 1,
        type: "started",
        title: "Work started",
        description: "Task status changed from Assigned to In Progress.",
        createdAt: "14 Jul 2026, 09:30 AM",
    },
];

const statusOptions = [
    "Assigned",
    "In Progress",
    "Testing",
    "Blocked",
    "Completed",
];

const priorityOptions = ["Low", "Medium", "High", "Critical"];

function parseDate(dateValue) {
    if (!dateValue) return null;

    const date = new Date(`${dateValue}T00:00:00`);

    return Number.isNaN(date.getTime()) ? null : date;
}

function getTodayDateKey() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function isTaskOverdue(task) {
    if (["Completed", "Resolved"].includes(task.status)) {
        return false;
    }

    const dueDate = parseDate(task.dueDate);
    const today = parseDate(getTodayDateKey());

    if (!dueDate || !today) return false;

    return dueDate < today;
}

function isTaskDueToday(task) {
    return (
        task.dueDate === getTodayDateKey() &&
        !["Completed", "Resolved"].includes(task.status)
    );
}
function getDateKeyFromOffset(days) {
    const date = new Date();

    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + days);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getTaskDaysDifference(dateValue) {
    if (!dateValue) return null;

    const due = parseDate(dateValue);
    const today = parseDate(getTodayDateKey());

    if (!due || !today) return null;

    return Math.round(
        (due.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );
}

function getRelativeTaskDueText(task) {
    if (["Completed", "Resolved"].includes(task.status)) {
        return "Completed";
    }

    const difference = getTaskDaysDifference(task.dueDate);

    if (difference === null) {
        return "No due date";
    }

    if (difference < 0) {
        const days = Math.abs(difference);

        return `${days} day${days !== 1 ? "s" : ""} overdue`;
    }

    if (difference === 0) {
        return "Due today";
    }

    if (difference === 1) {
        return "Due tomorrow";
    }

    return `Due in ${difference} days`;
}

function formatDate(dateValue) {
    const date = parseDate(dateValue);

    if (!date) return "—";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function formatTimer(totalSeconds) {
    const safeSeconds = Math.max(Number(totalSeconds || 0), 0);
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;

    return [hours, minutes, seconds]
        .map((value) => String(value).padStart(2, "0"))
        .join(":");
}

function formatDurationFromSeconds(totalSeconds) {
    const safeSeconds = Math.max(Number(totalSeconds || 0), 0);
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);

    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;

    return `${hours}h ${minutes}m`;
}

function formatEstimatedTime(minutes) {
    const safeMinutes = Math.max(Number(minutes || 0), 0);
    const hours = Math.floor(safeMinutes / 60);
    const remainingMinutes = safeMinutes % 60;

    if (hours === 0) return `${remainingMinutes}m`;
    if (remainingMinutes === 0) return `${hours}h`;

    return `${hours}h ${remainingMinutes}m`;
}

function getStatusClasses(status) {
    const styles = {
        Assigned: "bg-slate-100 text-slate-600 ring-slate-500/10",
        "In Progress":
            "bg-violet-50 text-violet-700 ring-violet-600/10",
        Testing: "bg-blue-50 text-blue-700 ring-blue-600/10",
        Blocked: "bg-rose-50 text-rose-700 ring-rose-600/10",
        Completed:
            "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
    };

    return styles[status] || styles.Assigned;
}

function getPriorityClasses(priority) {
    const styles = {
        Low: "bg-slate-100 text-slate-600 ring-slate-500/10",
        Medium: "bg-amber-50 text-amber-700 ring-amber-600/10",
        High: "bg-orange-50 text-orange-700 ring-orange-600/10",
        Critical: "bg-rose-50 text-rose-700 ring-rose-600/10",
    };

    return styles[priority] || styles.Low;
}

function getTimelineIcon(type) {
    if (type === "completed") {
        return {
            icon: CheckCircle2,
            className: "bg-emerald-100 text-emerald-700",
        };
    }

    if (type === "comment") {
        return {
            icon: MessageSquare,
            className: "bg-blue-100 text-blue-700",
        };
    }

    if (type === "file") {
        return {
            icon: Paperclip,
            className: "bg-amber-100 text-amber-700",
        };
    }

    if (type === "worklog") {
        return {
            icon: Clock3,
            className: "bg-cyan-100 text-cyan-700",
        };
    }

    return {
        icon: Circle,
        className: "bg-violet-100 text-violet-700",
    };
}

function SummaryCard({
    label,
    value,
    description,
    icon: Icon,
    iconClass,
    descriptionClass = "text-slate-500",
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {label}
                    </p>

                    <p className="mt-1.5 text-xl font-semibold text-slate-950">
                        {value}
                    </p>
                </div>

                <div
                    className={`flex h-9 w-9 items-center justify-center  rounded-lg ${iconClass}`}
                >
                    <Icon size={18} />
                </div>
            </div>

            <p className={`mt-3 text-[10px] ${descriptionClass}`}>
                {description}
            </p>
        </div>
    );
}

function TaskQueueRow({
    task,
    onOpen,
    onStart,
    onComplete,
    activeTaskId,
    timerRunning,
}) {
    const overdue = isTaskOverdue(task);
    const dueToday = isTaskDueToday(task);

    const completed = [
        "Completed",
        "Resolved",
    ].includes(task.status);

    const taskIsActive =
        activeTaskId === task.id;

    return (
        <div
            className={`group grid gap-3 border-t border-slate-100 px-4 py-2.5 transition first:border-t-0 xl:grid-cols-[minmax(280px,1.7fr)_minmax(150px,1fr)_95px_110px_105px_150px_90px] xl:items-center ${overdue
                    ? "bg-rose-50/30"
                    : completed
                        ? "bg-white hover:bg-slate-50/70"
                        : "hover:bg-slate-50/80"
                }`}
        >
            {/* TASK */}
            <div className="flex min-w-0 items-center gap-3">
                <button
                    type="button"
                    onClick={() => onStart(task)}
                    disabled={completed}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${taskIsActive
                            ? "bg-violet-600 text-white"
                            : completed
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-violet-50 text-violet-700 hover:bg-violet-100"
                        } disabled:cursor-default`}
                >
                    {completed ? (
                        <CheckCircle2 size={16} />
                    ) : taskIsActive &&
                        timerRunning ? (
                        <Pause size={15} />
                    ) : (
                        <Play size={15} />
                    )}
                </button>

                <div className="min-w-0">
                    <button
                        type="button"
                        onClick={() => onOpen(task)}
                        className={`block max-w-full truncate text-left text-[12px] font-semibold leading-4 transition hover:text-violet-700 ${completed
                                ? "text-slate-700"
                                : "text-slate-900"
                            }`}
                    >
                        {task.title}
                    </button>

                    <div className="mt-1 flex flex-wrap items-center gap-x-1.5">
                        <span className="text-[9px] font-bold text-violet-600">
                            {task.taskNo}
                        </span>

                        {task.ticketNo && (
                            <>
                                <span className="text-[8px] text-slate-300">
                                    •
                                </span>

                                <span className="text-[9px] text-blue-600">
                                    {task.ticketNo}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* CLIENT */}
            <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold leading-4 text-slate-800">
                    {task.client || "—"}
                </p>

                <p className="mt-0.5 truncate text-[9px] text-slate-500">
                    {[task.project, task.module]
                        .filter(Boolean)
                        .join(" · ") || "General"}
                </p>
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
            <div className="min-w-0">
                <p
                    className={`truncate text-[10px] font-semibold ${overdue
                            ? "text-rose-700"
                            : dueToday
                                ? "text-amber-700"
                                : completed
                                    ? "text-emerald-700"
                                    : "text-slate-700"
                        }`}
                >
                    {getRelativeTaskDueText(task)}
                </p>

                {task.dueDate && !completed && (
                    <p className="mt-0.5 text-[8px] text-slate-400">
                        {formatDate(task.dueDate)}
                    </p>
                )}
            </div>

            {/* PROGRESS / TIME */}
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                            className={`h-full rounded-full ${completed
                                    ? "bg-emerald-500"
                                    : "bg-violet-500"
                                }`}
                        style={{
    width: `${
        completed
            ? 100
            : Math.min(Number(task.progress || 0), 100)
    }%`,
}}
                        />
                    </div>

                  <span className="w-8 text-right text-[9px] font-semibold text-slate-600">
    {completed ? 100 : task.progress || 0}%
</span>
                </div>

                <p className="mt-1 text-[8px] text-slate-400">
                    {formatDurationFromSeconds(
                        task.spentSeconds
                    )}{" "}
                    /{" "}
                    {formatEstimatedTime(
                        task.estimatedMinutes
                    )}
                </p>
            </div>

            {/* ACTION */}
            <div className="flex justify-end gap-1.5">
                <button
                    type="button"
                    onClick={() => onOpen(task)}
                    className="flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-semibold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                >
                    Open
                </button>

                {!completed && (
                    <button
                        type="button"
                        onClick={() =>
                            onComplete(task)
                        }
                        title="Complete task"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
                    >
                        <Check size={13} />
                    </button>
                )}
            </div>
        </div>
    );
}
function TaskDaySection({
    section,
    expanded,
    onToggle,
    onOpenTask,
    onStartTask,
    onCompleteTask,
    activeTaskId,
    timerRunning,
}) {
    const Icon = section.icon;

    const toneClasses = {
        pending: {
            wrapper:
                "border-violet-200 shadow-[0_8px_30px_rgba(124,58,237,0.05)]",
            header:
                "bg-gradient-to-r from-violet-50 via-white to-white hover:from-violet-100/70",
            icon:
                "bg-violet-100 text-violet-700",
            count:
                "bg-violet-100 text-violet-700",
        },

        empty: {
            wrapper: "border-slate-200",
            header:
                "bg-gradient-to-r from-slate-50 to-white hover:bg-slate-50",
            icon:
                "bg-emerald-50 text-emerald-600",
            count:
                "bg-slate-100 text-slate-500",
        },

        success: {
            wrapper: "border-emerald-200",
            header:
                "bg-emerald-50/60 hover:bg-emerald-50",
            icon:
                "bg-emerald-100 text-emerald-700",
            count:
                "bg-emerald-100 text-emerald-700",
        },

        completed: {
            wrapper: "border-slate-200",
            header:
                "bg-slate-50/80 hover:bg-slate-100",
            icon:
                "bg-slate-100 text-slate-600",
            count:
                "bg-slate-200 text-slate-600",
        },
    };

    const tone =
        toneClasses[section.tone] ||
        toneClasses.completed;

    return (
        <section
            className={`overflow-hidden rounded-xl border bg-white ${tone.wrapper}`}
        >
            <button
                type="button"
                onClick={onToggle}
                className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition ${tone.header}`}
            >
                <div className="flex min-w-0 items-center gap-3">
                    <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone.icon}`}
                    >
                        <Icon size={16} />
                    </div>

                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xs font-bold text-slate-900">
                                {section.title}
                            </h3>

                            <span
                                className={`inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-[9px] font-bold ${tone.count}`}
                            >
                                {section.tasks.length}
                            </span>
                        </div>

                        <p className="mt-1 text-[10px] text-slate-500">
                            {section.subtitle}
                        </p>

                        {section.id === "pending" &&
                            section.stats &&
                            section.tasks.length > 0 && (
                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                    {section.stats.overdue > 0 && (
                                        <span className="rounded-md bg-rose-100 px-2 py-1 text-[9px] font-semibold text-rose-700">
                                            {section.stats.overdue} overdue
                                        </span>
                                    )}

                                    {section.stats.blocked > 0 && (
                                        <span className="rounded-md bg-rose-100 px-2 py-1 text-[9px] font-semibold text-rose-700">
                                            {section.stats.blocked} blocked
                                        </span>
                                    )}

                                    {section.stats.today > 0 && (
                                        <span className="rounded-md bg-amber-100 px-2 py-1 text-[9px] font-semibold text-amber-700">
                                            {section.stats.today} today
                                        </span>
                                    )}

                                    {section.stats.tomorrow > 0 && (
                                        <span className="rounded-md bg-blue-100 px-2 py-1 text-[9px] font-semibold text-blue-700">
                                            {section.stats.tomorrow} tomorrow
                                        </span>
                                    )}

                                    {section.stats.upcoming > 0 && (
                                        <span className="rounded-md bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-600">
                                            {section.stats.upcoming} upcoming
                                        </span>
                                    )}

                                    {section.stats.unscheduled > 0 && (
                                        <span className="rounded-md bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-600">
                                            {section.stats.unscheduled} unscheduled
                                        </span>
                                    )}
                                </div>
                            )}
                    </div>
                </div>

                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm">
                    {expanded ? (
                        <ChevronDown size={14} />
                    ) : (
                        <ChevronRight size={14} />
                    )}
                </div>
            </button>

            {expanded && (
                <div className="border-t border-slate-100">
                    {section.tasks.length > 0 && (
                        <div className="hidden grid-cols-[minmax(280px,1.7fr)_minmax(150px,1fr)_95px_110px_105px_150px_90px] gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-2 xl:grid">
                            <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                Task
                            </span>

                            <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                Client / Project
                            </span>

                            <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                Priority
                            </span>

                            <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                Status
                            </span>

                            <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                Due
                            </span>

                            <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                Progress / Time
                            </span>

                            <span className="text-right text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                Action
                            </span>
                        </div>
                    )}

                    {section.tasks.length > 0 ? (
                        section.tasks.map((task) => (
                            <TaskQueueRow
                                key={task.id}
                                task={task}
                                onOpen={onOpenTask}
                                onStart={onStartTask}
                                onComplete={onCompleteTask}
                                activeTaskId={activeTaskId}
                                timerRunning={timerRunning}
                            />
                        ))
                    ) : (
                        <div className="flex min-h-[110px] items-center justify-center px-5 py-6">
                            <div className="text-center">
                                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                    <CheckCircle2 size={18} />
                                </div>

                                <p className="mt-2.5 text-xs font-semibold text-slate-800">
                                    {section.id === "pending"
                                        ? "No pending tasks"
                                        : section.id === "completedToday"
                                            ? "No tasks completed today"
                                            : "No previous completed tasks"}
                                </p>

                                <p className="mt-1 text-[10px] text-slate-500">
                                    {section.id === "pending"
                                        ? "You're all caught up. New assigned tasks will appear here."
                                        : section.id === "completedToday"
                                            ? "Tasks completed today will automatically appear here."
                                            : "Older completed tasks will appear here."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}

export default function MyTasks() {
    const fileInputRef = useRef(null);

    const getAuthToken = () => localStorage.getItem("client-connect-token") || sessionStorage.getItem("client-connect-token") || "";
    const [summary, setSummary] = useState({ active: 0, inProgress: 0, dueToday: 0, overdue: 0, completed: 0 });
    const loadTasksDashboard = async () => {
        const response = await fetch(`${API_URL}/api/employee/tasks/dashboard`, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Unable to load tasks.");
        const mapped = (result.data.tasks || []).map((task) => ({ ...task, id: task._id, taskNo: task.taskCode, ticketNo: task.ticketCode, client: task.clientName, project: task.projectName, module: task.productName, assignedBy: task.assignedByName, spentSeconds: Number(task.elapsedSeconds || 0) }));
        setTasks(mapped);
        setSummary(result.data.summary);
        setActiveTaskId(result.data.activeTimer?._id || null);
        setTimerRunning(result.data.activeTimer?.status === "In Progress");
    };
    const updateTimer = async (taskId, action) => {
        const response = await fetch(`${API_URL}/api/employee/tasks/${taskId}/timer`, { method: "PATCH", headers: { Authorization: `Bearer ${getAuthToken()}`, "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Unable to update task timer.");
        await loadTasksDashboard();
    };
    const updateTaskStatus = async (taskId, status, options = {}) => {
        const payload = typeof options === "object" ? options : { progress: options };
        const response = await fetch(`${API_URL}/api/admin/task/${taskId}/status`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${getAuthToken()}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                status,
                progress: payload.progress !== undefined ? payload.progress : (status === "Completed" ? 100 : undefined),
                blockerReason: payload.blockerReason,
                waitingFor: payload.waitingFor,
                expectedResolutionDate: payload.expectedResolutionDate,
                completionNote: payload.completionNote,
                actualMinutes: payload.actualMinutes,
                note: payload.note,
            }),
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Unable to update task.");
        await loadTasksDashboard();
        if (selectedTaskId === taskId && result.data) {
            const fresh = result.data;
            setTasks((cur) => cur.map((t) => t.id === taskId ? { ...t, ...fresh, id: fresh._id, taskNo: fresh.taskCode } : t));
        }
        return result.data;
    };

    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [statusModalTarget, setStatusModalTarget] = useState("Blocked");
    const [statusModalLoading, setStatusModalLoading] = useState(false);
    const [statusModalTask, setStatusModalTask] = useState(null);

    const [tasks, setTasks] = useState([]);
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [detailsTab, setDetailsTab] = useState("overview");

    const [searchValue, setSearchValue] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [dueFilter, setDueFilter] = useState("All");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [openTaskSections, setOpenTaskSections] = useState({
        pending: false,
        completedToday: false,
        completedPrevious: false,
    });

    const [activeTaskId, setActiveTaskId] = useState(null);
    const [timerRunning, setTimerRunning] = useState(true);

    const [checklists, setChecklists] = useState(initialChecklists);
    const [checklistText, setChecklistText] = useState("");

    const [comments, setComments] = useState(initialComments);
    const [commentText, setCommentText] = useState("");

    const [files, setFiles] = useState(initialFiles);
    const [selectedFile, setSelectedFile] = useState(null);

    const [workLogs, setWorkLogs] = useState(initialWorkLogs);
    const [workLogForm, setWorkLogForm] = useState({
        date: "",
        startTime: "",
        endTime: "",
        duration: "",
        note: "",
    });

    const [timeline, setTimeline] = useState(initialTimeline);

    const selectedTask =
        tasks.find((task) => task.id === selectedTaskId) || null;

    const activeTask =
        tasks.find((task) => task.id === activeTaskId) || null;

    useEffect(() => {
        loadTasksDashboard().catch((error) => console.error("Tasks:", error));
        const intervalId = window.setInterval(
            () => loadTasksDashboard().catch((error) => console.error("Tasks:", error)),
            5000
        );
        return () => window.clearInterval(intervalId);
    }, []);

    const filteredTasks = useMemo(() => {
        const priorityRank = {
            Critical: 4,
            High: 3,
            Medium: 2,
            Low: 1,
        };

        const completedStatuses = [
            "Completed",
            "Resolved",
        ];

        return tasks
            .filter((task) => {
                const search =
                    searchValue.trim().toLowerCase();

                const matchesSearch =
                    !search ||
                    [
                        task.taskNo,
                        task.ticketNo,
                        task.title,
                        task.client,
                        task.project,
                        task.module,
                        task.workType,
                        task.status,
                        task.priority,
                    ].some((value) =>
                        String(value || "")
                            .toLowerCase()
                            .includes(search)
                    );

                let matchesStatus = true;
                if (statusFilter === "Attention") {
                    matchesStatus = isTaskOverdue(task) || isTaskDueToday(task) || ["Blocked", "Waiting"].includes(task.status);
                } else if (statusFilter === "Today") {
                    matchesStatus = isTaskDueToday(task);
                } else if (statusFilter !== "All") {
                    matchesStatus = task.status === statusFilter;
                }

                const matchesPriority =
                    priorityFilter === "All" ||
                    task.priority === priorityFilter;

                let matchesDue = true;

                if (dueFilter === "Today") {
                    matchesDue = isTaskDueToday(task);
                } else if (dueFilter === "Overdue") {
                    matchesDue = isTaskOverdue(task);
                } else if (dueFilter === "Upcoming") {
                    matchesDue =
                        !isTaskOverdue(task) &&
                        !isTaskDueToday(task) &&
                        !completedStatuses.includes(
                            task.status
                        );
                }

                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesPriority &&
                    matchesDue
                );
            })
            .sort((a, b) => {
                /*
                 * RULE 1:
                 * Active tasks always appear
                 * before completed tasks.
                 */
                const aCompleted =
                    completedStatuses.includes(a.status);

                const bCompleted =
                    completedStatuses.includes(b.status);

                if (aCompleted !== bCompleted) {
                    return aCompleted ? 1 : -1;
                }

                /*
                 * RULE 2:
                 * Higher priority first.
                 *
                 * Critical
                 * High
                 * Medium
                 * Low
                 */
                const priorityDifference =
                    (priorityRank[b.priority] || 0) -
                    (priorityRank[a.priority] || 0);

                if (priorityDifference !== 0) {
                    return priorityDifference;
                }

                /*
                 * RULE 3:
                 * Same priority =
                 * newest task first.
                 */
                const aCreatedAt =
                    new Date(
                        a.createdAt || 0
                    ).getTime();

                const bCreatedAt =
                    new Date(
                        b.createdAt || 0
                    ).getTime();

                return bCreatedAt - aCreatedAt;
            });
    }, [
        tasks,
        searchValue,
        statusFilter,
        priorityFilter,
        dueFilter,
    ]);

    const activeCount = summary.active;
    const taskSections = useMemo(() => {
        const todayKey = getTodayDateKey();
        const tomorrowKey = getDateKeyFromOffset(1);

        const completedStatuses = [
            "Completed",
            "Resolved",
        ];

        const activeTasks = filteredTasks
            .filter(
                (task) =>
                    !completedStatuses.includes(task.status)
            )
            .sort((a, b) => {
                const priorityRank = {
                    Critical: 4,
                    High: 3,
                    Medium: 2,
                    Low: 1,
                };

                const aOverdue = isTaskOverdue(a);
                const bOverdue = isTaskOverdue(b);

                // 1. Overdue first
                if (aOverdue !== bOverdue) {
                    return aOverdue ? -1 : 1;
                }

                // 2. Blocked tasks need attention
                const aBlocked = a.status === "Blocked";
                const bBlocked = b.status === "Blocked";

                if (aBlocked !== bBlocked) {
                    return aBlocked ? -1 : 1;
                }

                // 3. Due today
                const aToday = isTaskDueToday(a);
                const bToday = isTaskDueToday(b);

                if (aToday !== bToday) {
                    return aToday ? -1 : 1;
                }

                // 4. Earlier due date
                if (a.dueDate && b.dueDate) {
                    const dateDifference =
                        parseDate(a.dueDate) -
                        parseDate(b.dueDate);

                    if (dateDifference !== 0) {
                        return dateDifference;
                    }
                }

                // 5. Higher priority
                const priorityDifference =
                    (priorityRank[b.priority] || 0) -
                    (priorityRank[a.priority] || 0);

                if (priorityDifference !== 0) {
                    return priorityDifference;
                }

                // 6. Newest task
                return (
                    new Date(b.createdAt || 0).getTime() -
                    new Date(a.createdAt || 0).getTime()
                );
            });

        const completedTasks = filteredTasks.filter((task) =>
            completedStatuses.includes(task.status)
        );

        const overdueTasks = activeTasks.filter((task) =>
            isTaskOverdue(task)
        );

        const todayTasks = activeTasks.filter((task) =>
            isTaskDueToday(task)
        );

        const tomorrowTasks = activeTasks.filter(
            (task) => task.dueDate === tomorrowKey
        );

        const upcomingTasks = activeTasks.filter((task) => {
            if (!task.dueDate) return false;

            return (
                task.dueDate > tomorrowKey &&
                !isTaskOverdue(task)
            );
        });

        const blockedTasks = activeTasks.filter(
            (task) => task.status === "Blocked"
        );

        const unscheduledTasks = activeTasks.filter(
            (task) => !task.dueDate
        );

        const completedTodayTasks = completedTasks.filter(
            (task) => {
                const completedDate =
                    task.completedAt ||
                    task.updatedAt ||
                    task.modifiedAt;

                if (!completedDate) return false;

                const date = new Date(completedDate);

                if (Number.isNaN(date.getTime())) {
                    return false;
                }

                const year = date.getFullYear();
                const month = String(
                    date.getMonth() + 1
                ).padStart(2, "0");
                const day = String(
                    date.getDate()
                ).padStart(2, "0");

                return `${year}-${month}-${day}` === todayKey;
            }
        );

        const completedPreviousTasks =
            completedTasks.filter(
                (task) =>
                    !completedTodayTasks.includes(task)
            );

        return [
            {
                id: "pending",
                title: "Pending Work",
                subtitle:
                    activeTasks.length > 0
                        ? "Tasks that still require your action"
                        : "You're caught up — no pending tasks",

                tasks: activeTasks,

                tone:
                    activeTasks.length > 0
                        ? "pending"
                        : "empty",

                icon:
                    activeTasks.length > 0
                        ? ListChecks
                        : CheckCircle2,

                stats: {
                    overdue: overdueTasks.length,
                    blocked: blockedTasks.length,
                    today: todayTasks.length,
                    tomorrow: tomorrowTasks.length,
                    upcoming: upcomingTasks.length,
                    unscheduled: unscheduledTasks.length,
                },
            },

            {
                id: "completedToday",
                title: "Completed Today",
                subtitle:
                    completedTodayTasks.length > 0
                        ? "Tasks successfully completed today"
                        : "No tasks completed today",

                tasks: completedTodayTasks,
                tone: "success",
                icon: CheckCircle2,
            },

            {
                id: "completedPrevious",
                title: "Previous Completed",
                subtitle: "Historical completed tasks",
                tasks: completedPreviousTasks,
                tone: "completed",
                icon: CheckCircle2,
            },
        ];
    }, [filteredTasks]);
    const inProgressCount = summary.inProgress;
    const dueTodayCount = summary.dueToday;
    const overdueCount = summary.overdue;
    const completedCount = summary.completed;
    useEffect(() => {
        if (activeCount > 0) {
            setOpenTaskSections((current) => ({
                ...current,
                pending: true,
            }));
        }
    }, [activeCount]);


    const selectedTaskChecklists = selectedTask
        ? checklists.filter(
            (item) => item.taskId === selectedTask.id
        )
        : [];

    const selectedTaskComments = selectedTask
        ? comments.filter(
            (comment) => comment.taskId === selectedTask.id
        )
        : [];

    const selectedTaskFiles = selectedTask
        ? files.filter((file) => file.taskId === selectedTask.id)
        : [];

    const selectedTaskWorkLogs = selectedTask
        ? workLogs.filter(
            (workLog) => workLog.taskId === selectedTask.id
        )
        : [];

    const selectedTaskTimeline = selectedTask
        ? timeline.filter(
            (item) => item.taskId === selectedTask.id
        )
        : [];

    const checklistProgress = selectedTaskChecklists.length
        ? Math.round(
            (selectedTaskChecklists.filter(
                (item) => item.completed
            ).length /
                selectedTaskChecklists.length) *
            100
        )
        : 0;

    const openTaskDetails = async (task) => {
        try {
            const response = await fetch(`${API_URL}/api/employee/tasks/${task.id}`, {
                headers: { Authorization: `Bearer ${getAuthToken()}` },
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || "Unable to load task details.");
            const detail = { ...result.data, id: result.data._id, taskNo: result.data.taskCode, ticketNo: result.data.ticketCode, client: result.data.clientName, project: result.data.projectName, module: result.data.productName, spentSeconds: Number(result.data.elapsedSeconds || result.data.elapsedMinutes * 60 || 0) };
            setTasks((current) => current.map((item) => item.id === detail.id ? { ...item, ...detail } : item));
            setChecklists((detail.checklist || []).map((item) => ({
                id: item._id,
                _id: item._id,
                taskId: detail.id,
                title: item.text,
                completed: Boolean(item.completed),
                completedByName: item.completedByName,
                completedAt: item.completedAt,
            })));
            setComments((detail.comments || []).map((item) => ({ id: item._id, taskId: detail.id, user: item.authorName, initials: String(item.authorName || "").split(" ").map((name) => name[0]).join(""), message: item.message, createdAt: item.createdAt })));
            setFiles((detail.attachments || []).map((item) => ({ id: item._id, taskId: detail.id, name: item.fileName, type: item.fileType || "File", size: item.fileSize ? `${Math.max(1, Math.round(item.fileSize / 1024))} KB` : "—", uploadedBy: item.uploadedByName, uploadedAt: item.uploadedAt, fileUrl: item.fileUrl })));
            setTimeline((detail.timeline || []).map((item) => ({ id: item._id, taskId: detail.id, type: item.action === "Attachment Uploaded" ? "file" : "started", title: item.action, description: item.description, createdAt: item.createdAt })));
            setSelectedTaskId(detail.id);
            setDetailsTab("overview");
            setChecklistText(""); setCommentText(""); setSelectedFile(null);
        } catch (error) { alert(error.message); }
    };

    const closeTaskDetails = () => {
        setSelectedTaskId(null);
        setDetailsTab("overview");
        setChecklistText("");
        setCommentText("");
        setSelectedFile(null);
    };

    const addTimelineEntry = (
        taskId,
        type,
        title,
        description
    ) => {
        setTimeline((current) => [
            {
                id: Date.now() + Math.random(),
                taskId,
                type,
                title,
                description,
                createdAt: new Date().toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            },
            ...current,
        ]);
    };

    const startTask = async (task) => {
        if (
            ["Completed", "Resolved"].includes(task.status)
        ) {
            return;
        }

        if (
            activeTaskId &&
            activeTaskId !== task.id &&
            timerRunning
        ) {
            const confirmed = window.confirm(
                `Pause "${activeTask?.title}" and start "${task.title}"?`
            );

            if (!confirmed) return;
        }

        try { await updateTimer(task.id, task.status === "Paused" ? "resume" : "start"); } catch (error) { alert(error.message); }
    };

    const pauseResumeTask = async () => {
        if (!activeTask) return;

        try { await updateTimer(activeTask.id, timerRunning ? "pause" : "resume"); } catch (error) { alert(error.message); }
    };

    const completeTask = async (task) => {
        if (task.status === "Completed") return;

        const confirmed = window.confirm(
            `Mark "${task.title}" as completed?`
        );

        if (!confirmed) return;

        try { await updateTimer(task.id, "complete"); } catch (error) { alert(error.message); }
    };

    const updateSelectedTask = (updates) => {
        if (!selectedTask) return;

        setTasks((current) =>
            current.map((task) =>
                task.id === selectedTask.id
                    ? {
                        ...task,
                        ...updates,
                    }
                    : task
            )
        );
    };

    const handleStatusChange = async (event) => {
        if (!selectedTask) return;
        const nextStatus = event.target.value;
        if (nextStatus === "Blocked") {
            setStatusModalTarget("Blocked");
            setStatusModalOpen(true);
            return;
        }
        if (nextStatus === "Completed") {
            setStatusModalTarget("Completed");
            setStatusModalOpen(true);
            return;
        }
        try {
            await updateTaskStatus(selectedTask.id, nextStatus);
        } catch (error) {
            alert(error.message);
        }
    };

    const handleProgressChange = async (event) => {
        if (!selectedTask) return;

        const progress = Math.min(
            Math.max(Number(event.target.value || 0), 0),
            100
        );

        try {
            await updateTaskStatus(selectedTask.id, progress === 100 ? "Completed" : selectedTask.status, { progress });
        } catch (error) {
            alert(error.message);
        }
    };

    const toggleChecklistItem = async (item) => {
        if (!selectedTask) return;
        try {
            const res = await fetch(`${API_URL}/api/admin/task/${selectedTask.id}/checklist/${item.id || item._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` },
                body: JSON.stringify({ completed: !item.completed }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || "Failed to update checklist item.");
            setChecklists((data.data || []).map((i) => ({
                id: i._id,
                _id: i._id,
                taskId: selectedTask.id,
                title: i.text,
                completed: Boolean(i.completed),
                completedByName: i.completedByName,
                completedAt: i.completedAt,
            })));
        } catch (error) {
            alert(error.message);
        }
    };

    const addChecklistItem = async (event) => {
        event.preventDefault();
        if (!selectedTask || !checklistText.trim()) return;
        try {
            const res = await fetch(`${API_URL}/api/admin/task/${selectedTask.id}/checklist`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` },
                body: JSON.stringify({ text: checklistText.trim() }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || "Failed to add checklist item.");
            setChecklists((data.data || []).map((i) => ({
                id: i._id,
                _id: i._id,
                taskId: selectedTask.id,
                title: i.text,
                completed: Boolean(i.completed),
                completedByName: i.completedByName,
                completedAt: i.completedAt,
            })));
            setChecklistText("");
        } catch (error) {
            alert(error.message);
        }
    };

    const deleteChecklistItem = async (itemId) => {
        if (!selectedTask) return;
        try {
            const res = await fetch(`${API_URL}/api/admin/task/${selectedTask.id}/checklist/${itemId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${getAuthToken()}` },
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || "Failed to delete checklist item.");
            setChecklists((data.data || []).map((i) => ({
                id: i._id,
                _id: i._id,
                taskId: selectedTask.id,
                title: i.text,
                completed: Boolean(i.completed),
                completedByName: i.completedByName,
                completedAt: i.completedAt,
            })));
        } catch (error) {
            alert(error.message);
        }
    };

    const addComment = async (event) => {
        event.preventDefault();
        if (!selectedTask || !commentText.trim()) return;
        try {
            const res = await fetch(`${API_URL}/api/admin/task/${selectedTask.id}/comment`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` },
                body: JSON.stringify({ message: commentText.trim() }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || "Failed to add comment.");
            const freshComments = data.data?.comments || [];
            setComments(freshComments.map((item) => ({
                id: item._id,
                taskId: selectedTask.id,
                user: item.authorName,
                initials: String(item.authorName || "").split(" ").map((name) => name[0]).join(""),
                message: item.message,
                createdAt: item.createdAt,
            })));
            setCommentText("");
        } catch (error) {
            alert(error.message);
        }
    };

    const handleFileSelection = (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        const extension = file.name.includes(".")
            ? file.name.split(".").pop().toUpperCase()
            : "FILE";

        const size =
            file.size >= 1024 * 1024
                ? `${(file.size / (1024 * 1024)).toFixed(
                    1
                )} MB`
                : `${Math.max(
                    1,
                    Math.round(file.size / 1024)
                )} KB`;

        setSelectedFile({
            file,
            name: file.name,
            type: extension,
            size,
        });
    };

    const uploadSelectedFile = async () => {
        if (!selectedTask || !selectedFile?.file) return;

        try {
            const formData = new FormData();
            formData.append("attachment", selectedFile.file);
            const res = await fetch(`${API_URL}/api/admin/task/${selectedTask.id}/attachment`, {
                method: "POST",
                headers: { Authorization: `Bearer ${getAuthToken()}` },
                body: formData,
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || "Failed to upload file.");
            const freshAttachments = data.data?.attachments || [];
            setFiles(freshAttachments.map((item) => ({
                id: item._id,
                taskId: selectedTask.id,
                name: item.fileName,
                type: item.fileType || "File",
                size: item.fileSize ? `${Math.max(1, Math.round(item.fileSize / 1024))} KB` : "—",
                uploadedBy: item.uploadedByName,
                uploadedAt: item.uploadedAt,
                fileUrl: item.fileUrl,
            })));
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (error) {
            alert(error.message);
        }
    };

    const handleWorkLogChange = (event) => {
        const { name, value } = event.target;

        setWorkLogForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const addWorkLog = (event) => {
        event.preventDefault();

        if (!selectedTask) return;

        if (!workLogForm.date) {
            alert("Please select work date.");
            return;
        }

        if (!workLogForm.duration.trim()) {
            alert("Please enter duration.");
            return;
        }

        if (!workLogForm.note.trim()) {
            alert("Please enter work description.");
            return;
        }

        const newWorkLog = {
            id: Date.now(),
            taskId: selectedTask.id,
            date: new Date(
                `${workLogForm.date}T00:00:00`
            ).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }),
            startTime: workLogForm.startTime || "—",
            endTime: workLogForm.endTime || "—",
            duration: workLogForm.duration.trim(),
            note: workLogForm.note.trim(),
        };

        setWorkLogs((current) => [
            newWorkLog,
            ...current,
        ]);

        addTimelineEntry(
            selectedTask.id,
            "worklog",
            "Work log added",
            `${newWorkLog.duration} — ${newWorkLog.note}`
        );

        setWorkLogForm({
            date: "",
            startTime: "",
            endTime: "",
            duration: "",
            note: "",
        });
    };

    const toggleTaskSection = (sectionId) => {
        setOpenTaskSections((current) => ({
            ...current,
            [sectionId]: !current[sectionId],
        }));
    };
    return (
        <div>
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
                        Employee Workspace
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                        My Tasks
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                        Manage assigned tasks, work timers, checklists
                        and progress.
                    </p>
                </div>

                {activeTask && (
                    <div className="flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                            <Timer size={16} />
                        </div>

                        <div>
                            <p className="max-w-48 truncate text-[10px] font-semibold text-violet-700">
                                {activeTask.title}
                            </p>

                            <p className="mt-1 font-mono text-sm font-semibold text-slate-900">
                                {formatTimer(
                                    activeTask.spentSeconds
                                )}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={pauseResumeTask}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 text-white transition hover:bg-violet-700"
                        >
                            {timerRunning ? (
                                <Pause size={15} />
                            ) : (
                                <Play size={15} />
                            )}
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <SummaryCard
                    label="Active Tasks"
                    value={activeCount}
                    description="Assigned and ongoing work"
                    icon={ListChecks}
                    iconClass="bg-violet-100 text-violet-700"
                    descriptionClass="text-violet-600"
                />

                <SummaryCard
                    label="In Progress"
                    value={inProgressCount}
                    description="Currently being worked on"
                    icon={Timer}
                    iconClass="bg-blue-100 text-blue-700"
                    descriptionClass="text-blue-600"
                />

                <SummaryCard
                    label="Due Today"
                    value={dueTodayCount}
                    description="Require attention today"
                    icon={CalendarDays}
                    iconClass="bg-amber-100 text-amber-700"
                    descriptionClass="text-amber-600"
                />

                <SummaryCard
                    label="Overdue"
                    value={overdueCount}
                    description="Past the assigned due date"
                    icon={AlertCircle}
                    iconClass="bg-rose-100 text-rose-700"
                    descriptionClass="text-rose-600"
                />

                <SummaryCard
                    label="Completed"
                    value={completedCount}
                    description="Successfully completed"
                    icon={CheckCircle2}
                    iconClass="bg-emerald-100 text-emerald-700"
                    descriptionClass="text-emerald-600"
                />
            </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3.5 xl:flex-row xl:items-center xl:justify-between">
        <div>
            <h3 className="text-sm font-semibold text-slate-950">
                My Work Queue
            </h3>

            <p className="mt-1 text-[10px] text-slate-500">
                {activeCount} pending · {completedCount} completed
            </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
                <Search
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                    type="text"
                    value={searchValue}
                    onChange={(event) =>
                        setSearchValue(event.target.value)
                    }
                    placeholder="Search task, client, project..."
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 sm:w-72"
                />
            </div>

            <button
                type="button"
                onClick={() =>
                    setFiltersOpen((current) => !current)
                }
                className={`flex h-9 items-center justify-center gap-2 rounded-lg border px-3.5 text-[11px] font-semibold transition ${
                    filtersOpen ||
                    statusFilter !== "All" ||
                    priorityFilter !== "All" ||
                    dueFilter !== "All"
                        ? "border-violet-200 bg-violet-50 text-violet-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
            >
                <Filter size={14} />
                Filters
            </button>
        </div>
    </div>

                {filtersOpen && (
                    <div className="grid gap-3 border-b border-slate-200 bg-slate-50/70 px-5 py-4 md:grid-cols-4">
                        <div>
                            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                Status
                            </label>

                            <select
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(
                                        event.target.value
                                    )
                                }
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none"
                            >
                                <option>All</option>

                                {statusOptions.map((status) => (
                                    <option key={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                Priority
                            </label>

                            <select
                                value={priorityFilter}
                                onChange={(event) =>
                                    setPriorityFilter(
                                        event.target.value
                                    )
                                }
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none"
                            >
                                <option>All</option>

                                {priorityOptions.map(
                                    (priority) => (
                                        <option key={priority}>
                                            {priority}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                Due
                            </label>

                            <select
                                value={dueFilter}
                                onChange={(event) =>
                                    setDueFilter(
                                        event.target.value
                                    )
                                }
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none"
                            >
                                <option>All</option>
                                <option>Today</option>
                                <option>Overdue</option>
                                <option>Upcoming</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchValue("");
                                    setStatusFilter("All");
                                    setPriorityFilter("All");
                                    setDueFilter("All");
                                }}
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                )}



                {/* Quick Filters */}
                <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
                    <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick:</span>
                    {[
                        { id: "Attention", label: "Attention" },
                        { id: "Today", label: "Today" },
                        { id: "In Progress", label: "In Progress" },
                        { id: "Testing", label: "Testing" },
                        { id: "Blocked", label: "Blocked" },
                        { id: "Completed", label: "Completed" },
                        { id: "All", label: "All" },
                    ].map((tab) => {
                        const isActive = statusFilter === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => {
                                    setStatusFilter(tab.id);
                                    if (tab.id === "Today") {
                                        setDueFilter("All");
                                    }
                                }}
                                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                    isActive
                                        ? "bg-violet-600 text-white shadow-xs"
                                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="space-y-2.5 bg-slate-50/40 p-3.5 sm:p-4">
                    {taskSections.map((section) => (
                        <TaskDaySection
                            key={section.id}
                            section={section}
                            expanded={
                                openTaskSections[section.id] ?? false
                            }
                            onToggle={() =>
                                toggleTaskSection(section.id)
                            }
                            onOpenTask={openTaskDetails}
                            onStartTask={startTask}
                            onCompleteTask={completeTask}
                            activeTaskId={activeTaskId}
                            timerRunning={timerRunning}
                        />
                    ))}
                </div>
            </div>

            {selectedTask && (
                <>
                    <button
                        type="button"
                        aria-label="Close task details"
                        onClick={closeTaskDetails}
                        className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-[2px]"
                    />

                    <aside className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-[760px] flex-col bg-white shadow-[-24px_0_70px_rgba(15,23,42,0.22)]">
                        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                            <div className="min-w-0 pr-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-semibold text-violet-600">
                                        {selectedTask.taskNo}
                                    </span>

                                    {selectedTask.ticketNo && (
                                        <span className="rounded-lg bg-blue-50 px-2 py-1 text-[9px] font-semibold text-blue-700">
                                            {
                                                selectedTask.ticketNo
                                            }
                                        </span>
                                    )}

                                    <span
                                        className={`rounded-full px-2.5 py-1 text-[9px] font-bold ring-1 ring-inset ${getPriorityClasses(
                                            selectedTask.priority
                                        )}`}
                                    >
                                        {selectedTask.priority}
                                    </span>
                                </div>

                                <h2 className="mt-3 truncate text-xl font-semibold text-slate-950">
                                    {selectedTask.title}
                                </h2>

                                <p className="mt-2 text-xs text-slate-500">
                                    Assigned by{" "}
                                    {selectedTask.assignedBy}
                                </p>

                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    {selectedTask.status === "Assigned" && (
                                        <button
                                            type="button"
                                            onClick={() => updateTimer(selectedTask.id, "start")}
                                            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-violet-700 transition"
                                        >
                                            <Play size={12} fill="currentColor" /> Start Task
                                        </button>
                                    )}
                                    {selectedTask.status === "In Progress" && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => updateTaskStatus(selectedTask.id, "Testing")}
                                                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
                                            >
                                                Move to Testing
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setStatusModalTarget("Blocked");
                                                    setStatusModalOpen(true);
                                                }}
                                                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                                            >
                                                Block Task
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setStatusModalTarget("Completed");
                                                    setStatusModalOpen(true);
                                                }}
                                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                                            >
                                                Complete Task
                                            </button>
                                        </>
                                    )}
                                    {selectedTask.status === "Testing" && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setStatusModalTarget("Completed");
                                                    setStatusModalOpen(true);
                                                }}
                                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                                            >
                                                Complete Task
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setStatusModalTarget("Blocked");
                                                    setStatusModalOpen(true);
                                                }}
                                                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                                            >
                                                Block Task
                                            </button>
                                        </>
                                    )}
                                    {selectedTask.status === "Blocked" && (
                                        <button
                                            type="button"
                                            onClick={() => updateTaskStatus(selectedTask.id, "In Progress", { note: "Resumed from Blocked." })}
                                            className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition"
                                        >
                                            <Play size={12} fill="currentColor" /> Resume Task
                                        </button>
                                    )}
                                    {selectedTask.status === "Completed" && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStatusModalTarget("In Progress");
                                                setStatusModalTask(selectedTask);
                                                setStatusModalOpen(true);
                                            }}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
                                        >
                                            Reopen Task
                                        </button>
                                    )}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={closeTaskDetails}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        {selectedTask.status === "Blocked" && (
                            <div className="border-b border-rose-200 bg-rose-50/90 px-6 py-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-2.5">
                                        <ShieldAlert size={18} className="text-rose-600 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-xs font-bold text-rose-900">Task Currently Blocked</h4>
                                            <p className="mt-0.5 text-xs text-rose-800">
                                                <strong>Reason:</strong> {selectedTask.blockerReason || "Administrative blocker"}
                                            </p>
                                            <div className="mt-1 flex flex-wrap gap-x-4 text-[11px] text-rose-700">
                                                {selectedTask.waitingFor && (
                                                    <span><strong>Waiting For:</strong> {selectedTask.waitingFor}</span>
                                                )}
                                                {selectedTask.expectedResolutionDate && (
                                                    <span><strong>Expected Date:</strong> {new Date(selectedTask.expectedResolutionDate).toLocaleDateString()}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => updateTaskStatus(selectedTask.id, "In Progress", { note: "Resumed from Blocked." })}
                                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition"
                                    >
                                        Resume
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="border-b border-slate-200 px-6">
                            <div className="flex gap-1 overflow-x-auto">
                                {[
                                    {
                                        id: "overview",
                                        label: "Overview",
                                    },
                                    {
                                        id: "checklist",
                                        label: "Checklist",
                                    },
                                    {
                                        id: "comments",
                                        label: "Comments",
                                    },
                                    {
                                        id: "files",
                                        label: "Files",
                                    },
                                    {
                                        id: "worklogs",
                                        label: "Work Logs",
                                    },
                                    {
                                        id: "activity",
                                        label: "Activity",
                                    },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() =>
                                            setDetailsTab(tab.id)
                                        }
                                        className={`whitespace-nowrap border-b-2 px-4 py-4 text-[11px] font-semibold transition ${detailsTab === tab.id
                                                ? "border-violet-600 text-violet-700"
                                                : "border-transparent text-slate-500 hover:text-slate-800"
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {detailsTab === "overview" && (
                                <div className="space-y-6">
                                    <div className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-cyan-50 p-5">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-600">
                                                    Task Timer
                                                </p>

                                                <p className="mt-2 font-mono text-3xl font-semibold text-slate-950">
                                                    {formatTimer(
                                                        selectedTask.spentSeconds
                                                    )}
                                                </p>

                                                <p className="mt-1 text-[10px] text-slate-500">
                                                    Estimated{" "}
                                                    {formatEstimatedTime(
                                                        selectedTask.estimatedMinutes
                                                    )}
                                                </p>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        startTask(
                                                            selectedTask
                                                        )
                                                    }
                                                    disabled={
                                                        selectedTask.status ===
                                                        "Completed"
                                                    }
                                                    className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                                >
                                                    <Play
                                                        size={15}
                                                    />
                                                    {activeTaskId ===
                                                        selectedTask.id
                                                        ? "Resume"
                                                        : "Start"}
                                                </button>

                                                {selectedTask.status !==
                                                    "Completed" && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                completeTask(
                                                                    selectedTask
                                                                )
                                                            }
                                                            className="flex h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                                        >
                                                            <CheckCircle2
                                                                size={
                                                                    15
                                                                }
                                                            />
                                                            Complete
                                                        </button>
                                                    )}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                                            Description
                                        </h3>

                                        <p className="mt-3 text-sm leading-6 text-slate-700">
                                            {
                                                selectedTask.description
                                            }
                                        </p>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="rounded-2xl border border-slate-200 p-4">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <BriefcaseBusiness
                                                    size={15}
                                                />
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em]">
                                                    Client
                                                </p>
                                            </div>

                                            <p className="mt-3 text-xs font-semibold text-slate-900">
                                                {
                                                    selectedTask.client
                                                }
                                            </p>

                                            <p className="mt-1 text-[10px] text-slate-500">
                                                {selectedTask.clientCode ||
                                                    "Internal work"}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 p-4">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <FileText
                                                    size={15}
                                                />
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em]">
                                                    Project
                                                </p>
                                            </div>

                                            <p className="mt-3 text-xs font-semibold text-slate-900">
                                                {
                                                    selectedTask.project
                                                }
                                            </p>

                                            <p className="mt-1 text-[10px] text-slate-500">
                                                {
                                                    selectedTask.module
                                                }
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 p-4">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Headphones
                                                    size={15}
                                                />
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em]">
                                                    Related Ticket
                                                </p>
                                            </div>

                                            <p className="mt-3 text-xs font-semibold text-blue-700">
                                                {selectedTask.ticketNo ||
                                                    "No ticket linked"}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 p-4">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <CalendarDays
                                                    size={15}
                                                />
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em]">
                                                    Due Date
                                                </p>
                                            </div>

                                            <p
                                                className={`mt-3 text-xs font-semibold ${isTaskOverdue(
                                                    selectedTask
                                                )
                                                        ? "text-rose-700"
                                                        : "text-slate-900"
                                                    }`}
                                            >
                                                {formatDate(
                                                    selectedTask.dueDate
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                Task status
                                            </label>

                                            <select
                                                value={
                                                    selectedTask.status
                                                }
                                                onChange={
                                                    handleStatusChange
                                                }
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            >
                                                {statusOptions.map(
                                                    (status) => (
                                                        <option
                                                            key={
                                                                status
                                                            }
                                                        >
                                                            {
                                                                status
                                                            }
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>

                                        <div>
                                            <div className="mb-2 flex items-center justify-between">
                                                <label className="text-xs font-semibold text-slate-700">
                                                    Progress
                                                </label>

                                                <span className="text-xs font-semibold text-violet-700">
                                                    {
                                                        selectedTask.progress
                                                    }
                                                    %
                                                </span>
                                            </div>

                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                step="5"
                                                value={
                                                    selectedTask.progress
                                                }
                                                onChange={
                                                    handleProgressChange
                                                }
                                                className="w-full accent-violet-600"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {detailsTab === "checklist" && (
                                <div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-950">
                                                Task Checklist
                                            </h3>

                                            <p className="mt-1 text-xs text-slate-500">
                                                {
                                                    selectedTaskChecklists.filter(
                                                        (item) =>
                                                            item.completed
                                                    ).length
                                                }{" "}
                                                of{" "}
                                                {
                                                    selectedTaskChecklists.length
                                                }{" "}
                                                completed
                                            </p>
                                        </div>

                                        <span className="text-sm font-semibold text-violet-700">
                                            {
                                                checklistProgress
                                            }
                                            %
                                        </span>
                                    </div>

                                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full rounded-full bg-violet-500"
                                            style={{
                                                width: `${checklistProgress}%`,
                                            }}
                                        />
                                    </div>

                                    <form
                                        onSubmit={
                                            addChecklistItem
                                        }
                                        className="mt-5 flex gap-2"
                                    >
                                        <input
                                            value={
                                                checklistText
                                            }
                                            onChange={(event) =>
                                                setChecklistText(
                                                    event.target
                                                        .value
                                                )
                                            }
                                            placeholder="Add checklist item..."
                                            className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        />

                                        <button
                                            type="submit"
                                            className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white"
                                        >
                                            <Plus size={15} />
                                            Add
                                        </button>
                                    </form>

                                    <div className="mt-5 space-y-2">
                                        {selectedTaskChecklists.map(
                                            (item) => (
                                                <div
                                                    key={
                                                        item.id
                                                    }
                                                    className="group flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3"
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            toggleChecklistItem(
                                                                item.id
                                                            )
                                                        }
                                                        className={`flex h-5 w-5 items-center justify-center rounded-md border ${item.completed
                                                                ? "border-emerald-500 bg-emerald-500 text-white"
                                                                : "border-slate-300 text-transparent"
                                                            }`}
                                                    >
                                                        <Check
                                                            size={
                                                                12
                                                            }
                                                        />
                                                    </button>

                                                    <p
                                                        className={`flex-1 text-xs ${item.completed
                                                                ? "text-slate-400 line-through"
                                                                : "text-slate-700"
                                                            }`}
                                                    >
                                                        {
                                                            item.title
                                                        }
                                                    </p>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            deleteChecklistItem(
                                                                item.id
                                                            )
                                                        }
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                                                    >
                                                        <Trash2
                                                            size={
                                                                14
                                                            }
                                                        />
                                                    </button>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                            {detailsTab === "comments" && (
                                <div>
                                    <form
                                        onSubmit={addComment}
                                        className="rounded-2xl border border-slate-200 p-4"
                                    >
                                        <textarea
                                            value={commentText}
                                            onChange={(event) =>
                                                setCommentText(
                                                    event.target
                                                        .value
                                                )
                                            }
                                            rows={4}
                                            placeholder="Add a comment or work update..."
                                            className="w-full resize-none border-0 text-xs leading-5 text-slate-700 outline-none placeholder:text-slate-400"
                                        />

                                        <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
                                            <button
                                                type="submit"
                                                className="flex h-9 items-center gap-2 rounded-lg bg-violet-600 px-4 text-xs font-semibold text-white"
                                            >
                                                <Send
                                                    size={14}
                                                />
                                                Add Comment
                                            </button>
                                        </div>
                                    </form>

                                    <div className="mt-5 space-y-4">
                                        {selectedTaskComments.map(
                                            (comment) => (
                                                <div
                                                    key={
                                                        comment.id
                                                    }
                                                    className="flex gap-3"
                                                >
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-[10px] font-bold text-white">
                                                        {
                                                            comment.initials
                                                        }
                                                    </div>

                                                    <div className="flex-1 rounded-2xl rounded-tl-md bg-slate-50 p-4">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <p className="text-xs font-semibold text-slate-900">
                                                                {
                                                                    comment.user
                                                                }
                                                            </p>

                                                            <span className="text-[9px] text-slate-400">
                                                                {
                                                                    comment.createdAt
                                                                }
                                                            </span>
                                                        </div>

                                                        <p className="mt-2 text-xs leading-5 text-slate-600">
                                                            {
                                                                comment.message
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                            {detailsTab === "files" && (
                                <div>
                                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-5">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            onChange={
                                                handleFileSelection
                                            }
                                            className="hidden"
                                        />

                                        <div className="flex flex-col items-center text-center">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                                                <Upload
                                                    size={20}
                                                />
                                            </div>

                                            <p className="mt-3 text-xs font-semibold text-slate-800">
                                                Upload task file
                                            </p>

                                            <p className="mt-1 text-[10px] text-slate-500">
                                                Screenshots,
                                                documents, reports
                                                or logs
                                            </p>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    fileInputRef.current?.click()
                                                }
                                                className="mt-4 h-9 rounded-lg border border-slate-200 bg-white px-4 text-[10px] font-semibold text-slate-600"
                                            >
                                                Choose File
                                            </button>
                                        </div>
                                    </div>

                                    {selectedFile && (
                                        <div className="mt-4 flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-violet-700">
                                                <File
                                                    size={17}
                                                />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-xs font-semibold text-slate-900">
                                                    {
                                                        selectedFile.name
                                                    }
                                                </p>

                                                <p className="mt-1 text-[10px] text-slate-500">
                                                    {
                                                        selectedFile.size
                                                    }
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={
                                                    uploadSelectedFile
                                                }
                                                className="h-9 rounded-lg bg-violet-600 px-4 text-[10px] font-semibold text-white"
                                            >
                                                Upload
                                            </button>
                                        </div>
                                    )}

                                    <div className="mt-5 space-y-3">
                                        {selectedTaskFiles.map(
                                            (file) => (
                                                <div
                                                    key={
                                                        file.id
                                                    }
                                                    className="flex items-center gap-3 rounded-xl border border-slate-200 p-4"
                                                >
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                                        <Paperclip
                                                            size={
                                                                17
                                                            }
                                                        />
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-xs font-semibold text-slate-900">
                                                            {
                                                                file.name
                                                            }
                                                        </p>

                                                        <p className="mt-1 text-[10px] text-slate-500">
                                                            {
                                                                file.type
                                                            }{" "}
                                                            ·{" "}
                                                            {
                                                                file.size
                                                            }{" "}
                                                            · Uploaded
                                                            by{" "}
                                                            {
                                                                file.uploadedBy
                                                            }
                                                        </p>

                                                        <p className="mt-1 text-[9px] text-slate-400">
                                                            {
                                                                file.uploadedAt
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                            {detailsTab === "worklogs" && (
                                <div>
                                    <form
                                        onSubmit={addWorkLog}
                                        className="rounded-2xl border border-slate-200 p-5"
                                    >
                                        <h3 className="text-sm font-semibold text-slate-950">
                                            Add Work Log
                                        </h3>

                                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                    Work Date
                                                </label>

                                                <input
                                                    type="date"
                                                    name="date"
                                                    value={
                                                        workLogForm.date
                                                    }
                                                    onChange={
                                                        handleWorkLogChange
                                                    }
                                                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                    Duration
                                                </label>

                                                <input
                                                    name="duration"
                                                    value={
                                                        workLogForm.duration
                                                    }
                                                    onChange={
                                                        handleWorkLogChange
                                                    }
                                                    placeholder="Example: 1h 30m"
                                                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                    Start Time
                                                </label>

                                                <input
                                                    type="time"
                                                    name="startTime"
                                                    value={
                                                        workLogForm.startTime
                                                    }
                                                    onChange={
                                                        handleWorkLogChange
                                                    }
                                                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                    End Time
                                                </label>

                                                <input
                                                    type="time"
                                                    name="endTime"
                                                    value={
                                                        workLogForm.endTime
                                                    }
                                                    onChange={
                                                        handleWorkLogChange
                                                    }
                                                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                Work Description
                                            </label>

                                            <textarea
                                                name="note"
                                                value={
                                                    workLogForm.note
                                                }
                                                onChange={
                                                    handleWorkLogChange
                                                }
                                                rows={4}
                                                placeholder="Describe the work completed..."
                                                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-xs outline-none"
                                            />
                                        </div>

                                        <div className="mt-4 flex justify-end">
                                            <button
                                                type="submit"
                                                className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white"
                                            >
                                                <Clock3
                                                    size={15}
                                                />
                                                Add Work Log
                                            </button>
                                        </div>
                                    </form>

                                    <div className="mt-5 space-y-3">
                                        {selectedTaskWorkLogs.map(
                                            (log) => (
                                                <div
                                                    key={
                                                        log.id
                                                    }
                                                    className="rounded-xl border border-slate-200 p-4"
                                                >
                                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                                        <p className="text-xs font-semibold text-slate-900">
                                                            {
                                                                log.duration
                                                            }
                                                        </p>

                                                        <span className="text-[10px] text-slate-400">
                                                            {
                                                                log.date
                                                            }
                                                        </span>
                                                    </div>

                                                    <p className="mt-2 text-[10px] text-slate-500">
                                                        {
                                                            log.startTime
                                                        }{" "}
                                                        to{" "}
                                                        {
                                                            log.endTime
                                                        }
                                                    </p>

                                                    <p className="mt-3 text-xs leading-5 text-slate-600">
                                                        {
                                                            log.note
                                                        }
                                                    </p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                            {detailsTab === "activity" && (
                                <div className="relative space-y-5 before:absolute before:bottom-4 before:left-5 before:top-4 before:w-px before:bg-slate-200">
                                    {selectedTaskTimeline.map(
                                        (item) => {
                                            const {
                                                icon: Icon,
                                                className,
                                            } =
                                                getTimelineIcon(
                                                    item.type
                                                );

                                            return (
                                                <div
                                                    key={
                                                        item.id
                                                    }
                                                    className="relative flex gap-4"
                                                >
                                                    <div
                                                        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-4 ring-white ${className}`}
                                                    >
                                                        <Icon
                                                            size={
                                                                16
                                                            }
                                                        />
                                                    </div>

                                                    <div className="pt-1">
                                                        <p className="text-xs font-semibold text-slate-900">
                                                            {
                                                                item.title
                                                            }
                                                        </p>

                                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                                            {
                                                                item.description
                                                            }
                                                        </p>

                                                        <p className="mt-2 text-[9px] uppercase tracking-[0.08em] text-slate-400">
                                                            {
                                                                item.createdAt
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            )}
                        </div>
                    </aside>
                </>
            )}

            {/* Task Status Modal for Blocked / Completed / Reopened */}
            <TaskStatusModal
                isOpen={statusModalOpen}
                targetStatus={statusModalTarget}
                task={statusModalTask || selectedTask}
                loading={statusModalLoading}
                onClose={() => {
                    setStatusModalOpen(false);
                    setStatusModalTask(null);
                }}
                onSubmit={async (payload) => {
                    const targetTask = statusModalTask || selectedTask;
                    if (!targetTask) return;
                    setStatusModalLoading(true);
                    try {
                        await updateTaskStatus(targetTask.id, statusModalTarget, payload);
                        setStatusModalOpen(false);
                        setStatusModalTask(null);
                    } catch (err) {
                        alert(err.message || "Failed to update task status.");
                    } finally {
                        setStatusModalLoading(false);
                    }
                }}
            />
        </div>
    );
}
