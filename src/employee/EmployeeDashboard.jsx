import { useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    ArrowUpRight,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Headphones,
    ListTodo,
    LogIn,
    LogOut,
    Pause,
    Play,
    Timer,
    TrendingUp,
} from "lucide-react";

const initialTasks = [
    {
        id: 1,
        taskNo: "TSK-2084",
        ticketNo: "TKT-1042",
        title: "Fix GST report mismatch",
        client: "Shree Ganesh Industries",
        project: "NexERP",
        priority: "High",
        status: "In Progress",
        dueDate: "Today",
        estimatedMinutes: 150,
        spentSeconds: 8142,
        progress: 70,
    },
    {
        id: 2,
        taskNo: "TSK-2087",
        ticketNo: "TKT-1041",
        title: "Barcode printer driver issue",
        client: "Omkar Traders",
        project: "RetailPOS",
        priority: "Critical",
        status: "Assigned",
        dueDate: "Today",
        estimatedMinutes: 120,
        spentSeconds: 0,
        progress: 0,
    },
    {
        id: 3,
        taskNo: "TSK-2089",
        ticketNo: "",
        title: "Complete StockPro module testing",
        client: "Internal Development",
        project: "StockPro",
        priority: "Medium",
        status: "Testing",
        dueDate: "Tomorrow",
        estimatedMinutes: 240,
        spentSeconds: 7200,
        progress: 60,
    },
];

const assignedTickets = [
    {
        id: 1,
        ticketNo: "TKT-1042",
        title: "GST report mismatch in monthly summary",
        client: "Shree Ganesh Industries",
        project: "NexERP",
        priority: "High",
        status: "In Progress",
        dueDate: "Today",
    },
    {
        id: 2,
        ticketNo: "TKT-1038",
        title: "Need new user login created",
        client: "GreenLeaf Agro",
        project: "StockPro",
        priority: "Low",
        status: "Resolved",
        dueDate: "08 Jul",
    },
];

const initialWorkLogs = [
    {
        id: 1,
        type: "login",
        title: "Logged in",
        description: "Attendance login recorded",
        time: "09:02 AM",
    },
    {
        id: 2,
        type: "task",
        title: "Started TKT-1042",
        description: "GST report mismatch investigation",
        time: "09:20 AM",
    },
    {
        id: 3,
        type: "completed",
        title: "Resolved TKT-1038",
        description: "Created new user login for GreenLeaf Agro",
        time: "11:35 AM",
    },
    {
        id: 4,
        type: "call",
        title: "Client support call",
        description: "Shree Ganesh Industries · 25 minutes",
        time: "12:10 PM",
    },
    {
        id: 5,
        type: "task",
        title: "Resumed TKT-1042",
        description: "Testing corrected report on staging",
        time: "02:00 PM",
    },
];

function formatTimer(totalSeconds) {
    const safeSeconds = Math.max(Number(totalSeconds || 0), 0);
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;

    return [hours, minutes, seconds]
        .map((value) => String(value).padStart(2, "0"))
        .join(":");
}

function formatDuration(totalSeconds) {
    const seconds = Math.max(Number(totalSeconds || 0), 0);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;

    return `${hours}h ${minutes}m`;
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

function getStatusClasses(status) {
    const styles = {
        Assigned: "bg-slate-100 text-slate-600 ring-slate-500/10",
        "In Progress":
            "bg-violet-50 text-violet-700 ring-violet-600/10",
        Testing: "bg-blue-50 text-blue-700 ring-blue-600/10",
        Resolved:
            "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
        Completed:
            "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
        Blocked: "bg-rose-50 text-rose-700 ring-rose-600/10",
    };

    return styles[status] || styles.Assigned;
}

function DashboardCard({
    label,
    value,
    description,
    icon: Icon,
    iconClass,
    descriptionClass = "text-slate-500",
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {label}
                    </p>

                    <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                        {value}
                    </p>
                </div>

                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
                >
                    <Icon size={18} />
                </div>
            </div>

            <p className={`mt-4 text-[10px] font-medium ${descriptionClass}`}>
                {description}
            </p>
        </div>
    );
}

export default function EmployeeDashboard() {
    const [tasks, setTasks] = useState(initialTasks);
    const [workLogs, setWorkLogs] = useState(initialWorkLogs);
    const [activeTaskId, setActiveTaskId] = useState(1);
    const [timerRunning, setTimerRunning] = useState(true);
    const [attendanceStatus, setAttendanceStatus] =
        useState("Logged In");
    const [loginTime, setLoginTime] = useState("09:02 AM");

    const activeTask =
        tasks.find((task) => task.id === activeTaskId) || null;

    useEffect(() => {
        if (!timerRunning || !activeTaskId) {
            return undefined;
        }

        const intervalId = window.setInterval(() => {
            setTasks((current) =>
                current.map((task) =>
                    task.id === activeTaskId
                        ? {
                              ...task,
                              spentSeconds:
                                  Number(task.spentSeconds || 0) + 1,
                          }
                        : task
                )
            );
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, [activeTaskId, timerRunning]);

    const activeTaskCount = tasks.filter(
        (task) =>
            !["Completed", "Resolved"].includes(task.status)
    ).length;

    const dueTodayCount = tasks.filter(
        (task) =>
            task.dueDate === "Today" &&
            !["Completed", "Resolved"].includes(task.status)
    ).length;

    const hoursToday = useMemo(() => {
        const totalSeconds = tasks.reduce(
            (total, task) =>
                total + Number(task.spentSeconds || 0),
            0
        );

        return formatDuration(totalSeconds);
    }, [tasks]);

    const addWorkLog = (title, description, type = "task") => {
        setWorkLogs((current) => [
            ...current,
            {
                id: Date.now(),
                type,
                title,
                description,
                time: new Date().toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            },
        ]);
    };

    const handlePauseResume = () => {
        if (!activeTask) return;

        setTimerRunning((current) => {
            const nextValue = !current;

            addWorkLog(
                `${nextValue ? "Resumed" : "Paused"} ${
                    activeTask.ticketNo || activeTask.taskNo
                }`,
                activeTask.title,
                "task"
            );

            return nextValue;
        });
    };

    const handleStartTask = (taskId) => {
        const task = tasks.find((item) => item.id === taskId);

        if (!task) return;

        setTasks((current) =>
            current.map((item) =>
                item.id === taskId
                    ? {
                          ...item,
                          status:
                              item.status === "Assigned"
                                  ? "In Progress"
                                  : item.status,
                          progress: Math.max(
                              Number(item.progress || 0),
                              10
                          ),
                      }
                    : item
            )
        );

        setActiveTaskId(taskId);
        setTimerRunning(true);

        addWorkLog(
            `Started ${task.ticketNo || task.taskNo}`,
            task.title,
            "task"
        );
    };

    const handleCompleteTask = () => {
        if (!activeTask) return;

        const completedTask = activeTask;

        setTasks((current) =>
            current.map((task) =>
                task.id === activeTask.id
                    ? {
                          ...task,
                          status: "Completed",
                          progress: 100,
                      }
                    : task
            )
        );

        setTimerRunning(false);
        setActiveTaskId(null);

        addWorkLog(
            `Completed ${
                completedTask.ticketNo || completedTask.taskNo
            }`,
            completedTask.title,
            "completed"
        );
    };

    const handleAttendanceToggle = () => {
        if (attendanceStatus === "Logged In") {
            setAttendanceStatus("Logged Out");

            addWorkLog(
                "Logged out",
                "Attendance logout recorded",
                "logout"
            );

            return;
        }

        const currentTime = new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
        });

        setLoginTime(currentTime);
        setAttendanceStatus("Logged In");

        addWorkLog(
            "Logged in",
            "Attendance login recorded",
            "login"
        );
    };

    return (
        <div>
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
                        Employee Workspace
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                        Good afternoon, Akash
                    </h2>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>
                            {new Date().toLocaleDateString("en-IN", {
                                weekday: "long",
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                            })}
                        </span>

                        <span>•</span>

                        <span
                            className={
                                attendanceStatus === "Logged In"
                                    ? "font-medium text-emerald-600"
                                    : "font-medium text-rose-600"
                            }
                        >
                            {attendanceStatus}
                            {attendanceStatus === "Logged In"
                                ? ` at ${loginTime}`
                                : ""}
                        </span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleAttendanceToggle}
                    className={`flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold transition ${
                        attendanceStatus === "Logged In"
                            ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                            : "bg-violet-600 text-white hover:bg-violet-700"
                    }`}
                >
                    {attendanceStatus === "Logged In" ? (
                        <LogOut size={15} />
                    ) : (
                        <LogIn size={15} />
                    )}

                    {attendanceStatus === "Logged In"
                        ? "Logout"
                        : "Login"}
                </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <DashboardCard
                    label="Hours Today"
                    value={hoursToday}
                    description={`Login recorded at ${loginTime}`}
                    icon={Clock3}
                    iconClass="bg-cyan-100 text-cyan-700"
                    descriptionClass="text-emerald-600"
                />

                <DashboardCard
                    label="Active Tasks"
                    value={activeTaskCount}
                    description={`${dueTodayCount} due today`}
                    icon={ListTodo}
                    iconClass="bg-amber-100 text-amber-700"
                    descriptionClass={
                        dueTodayCount > 0
                            ? "text-rose-600"
                            : "text-slate-500"
                    }
                />

                <DashboardCard
                    label="Tickets Assigned"
                    value={assignedTickets.length}
                    description="1 ticket currently in progress"
                    icon={Headphones}
                    iconClass="bg-blue-100 text-blue-700"
                    descriptionClass="text-blue-600"
                />

                <DashboardCard
                    label="Solved This Week"
                    value="7"
                    description="+2 compared with last week"
                    icon={CheckCircle2}
                    iconClass="bg-emerald-100 text-emerald-700"
                    descriptionClass="text-emerald-600"
                />
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
                <section className="overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-[0_12px_40px_rgba(109,40,217,0.08)]">
                    <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50 to-cyan-50 px-5 py-4">
                        <div className="flex items-center gap-2 text-violet-700">
                            <Timer size={16} />

                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">
                                Active Task Timer
                            </p>
                        </div>
                    </div>

                    <div className="p-5">
                        {activeTask ? (
                            <>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-semibold text-slate-950">
                                            {activeTask.title}
                                        </h3>

                                        <p className="mt-1 text-[10px] text-slate-500">
                                            {activeTask.ticketNo ||
                                                activeTask.taskNo}
                                            {" · "}
                                            {activeTask.client}
                                        </p>
                                    </div>

                                    <span
                                        className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-semibold ring-1 ring-inset ${getPriorityClasses(
                                            activeTask.priority
                                        )}`}
                                    >
                                        {activeTask.priority}
                                    </span>
                                </div>

                                <p className="mt-6 font-mono text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                                    {formatTimer(
                                        activeTask.spentSeconds
                                    )}
                                </p>

                                <div className="mt-4">
                                    <div className="flex items-center justify-between text-[9px] font-medium text-slate-400">
                                        <span>Task progress</span>
                                        <span>
                                            {activeTask.progress}%
                                        </span>
                                    </div>

                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                                            style={{
                                                width: `${Math.min(
                                                    activeTask.progress,
                                                    100
                                                )}%`,
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={handlePauseResume}
                                        className="flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 text-xs font-semibold text-white transition hover:bg-violet-700"
                                    >
                                        {timerRunning ? (
                                            <Pause size={15} />
                                        ) : (
                                            <Play size={15} />
                                        )}

                                        {timerRunning
                                            ? "Pause"
                                            : "Resume"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleCompleteTask}
                                        className="flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                    >
                                        <CheckCircle2 size={15} />
                                        Mark Done
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex min-h-[245px] flex-col items-center justify-center text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                    <Timer size={20} />
                                </div>

                                <h3 className="mt-4 text-sm font-semibold text-slate-900">
                                    No active task
                                </h3>

                                <p className="mt-1 text-xs text-slate-500">
                                    Start a task from your assigned work.
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-950">
                                My Tasks
                            </h3>

                            <p className="mt-1 text-[10px] text-slate-500">
                                Assigned and active work
                            </p>
                        </div>

                        <button
                            type="button"
                            className="flex items-center gap-1.5 text-[10px] font-semibold text-violet-600"
                        >
                            View all
                            <ArrowUpRight size={13} />
                        </button>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className="flex flex-col gap-4 px-5 py-4 transition hover:bg-slate-50/70 md:flex-row md:items-center"
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleStartTask(task.id)
                                    }
                                    disabled={[
                                        "Completed",
                                        "Resolved",
                                    ].includes(task.status)}
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <Play size={15} />
                                </button>

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-semibold text-slate-900">
                                        {task.title}
                                    </p>

                                    <p className="mt-1 text-[10px] text-slate-500">
                                        {task.ticketNo ||
                                            task.taskNo}
                                        {" · "}
                                        {task.client}
                                        {" · Due "}
                                        {task.dueDate}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <span
                                        className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ring-1 ring-inset ${getPriorityClasses(
                                            task.priority
                                        )}`}
                                    >
                                        {task.priority}
                                    </span>

                                    <span
                                        className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ring-1 ring-inset ${getStatusClasses(
                                            task.status
                                        )}`}
                                    >
                                        {task.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-2">
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-950">
                                My Assigned Tickets
                            </h3>

                            <p className="mt-1 text-[10px] text-slate-500">
                                Support issues requiring attention
                            </p>
                        </div>

                        <span className="text-[10px] text-slate-400">
                            {assignedTickets.length} assigned
                        </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {assignedTickets.map((ticket) => (
                            <div
                                key={ticket.id}
                                className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50/70 sm:flex-row sm:items-center"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-slate-900">
                                        {ticket.title}
                                    </p>

                                    <p className="mt-1 text-[10px] text-slate-500">
                                        {ticket.ticketNo} ·{" "}
                                        {ticket.client} ·{" "}
                                        {ticket.project}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span
                                        className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ring-1 ring-inset ${getPriorityClasses(
                                            ticket.priority
                                        )}`}
                                    >
                                        {ticket.priority}
                                    </span>

                                    <span
                                        className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ring-1 ring-inset ${getStatusClasses(
                                            ticket.status
                                        )}`}
                                    >
                                        {ticket.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-950">
                                Today’s Work Log
                            </h3>

                            <p className="mt-1 text-[10px] text-slate-500">
                                Attendance and work activity
                            </p>
                        </div>

                        <span className="text-[10px] text-slate-400">
                            Auto-recorded
                        </span>
                    </div>

                    <div className="max-h-[350px] overflow-y-auto px-5 py-5">
                        <div className="relative space-y-5 before:absolute before:bottom-2 before:left-[5px] before:top-2 before:w-px before:bg-slate-200">
                            {workLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className="relative flex gap-4"
                                >
                                    <span
                                        className={`relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-white ${
                                            log.type === "completed"
                                                ? "bg-emerald-500"
                                                : log.type ===
                                                    "logout"
                                                  ? "bg-rose-500"
                                                  : "bg-violet-500"
                                        }`}
                                    />

                                    <div>
                                        <p className="text-xs font-semibold text-slate-800">
                                            {log.title}
                                        </p>

                                        <p className="mt-1 text-[10px] text-slate-500">
                                            {log.description}
                                        </p>

                                        <p className="mt-1 text-[9px] uppercase tracking-[0.08em] text-slate-400">
                                            {log.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {dueTodayCount > 0 && (
                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
                    <AlertCircle
                        size={18}
                        className="mt-0.5 shrink-0 text-amber-600"
                    />

                    <div>
                        <p className="text-xs font-semibold text-amber-800">
                            {dueTodayCount} task
                            {dueTodayCount > 1 ? "s are" : " is"} due
                            today
                        </p>

                        <p className="mt-1 text-[10px] text-amber-700">
                            Complete the work or update its status before
                            ending your day.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}   