import API_URL from "../config/api";
import { useEffect, useMemo, useState } from "react";
import { LoadingState } from "../components/ui";
import {
    AlertCircle,
    ArrowUpRight,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Headphones,
    LayoutDashboard,
    ListTodo,
    LogIn,
    LogOut,
    Pause,
    Play,
    Timer,
    TrendingUp,
} from "lucide-react";

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
            "bg-blue-50 text-[#1B59F8] ring-blue-600/10",
        Testing: "bg-amber-50 text-amber-700 ring-amber-600/10",
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
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {label}
                </span>

                <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconClass}`}
                >
                    <Icon size={14} />
                </div>
            </div>

            <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">
                    {value}
                </span>
            </div>

            <p className={`mt-1 text-[11px] font-medium truncate ${descriptionClass}`}>
                {description}
            </p>
        </div>
    );
}

export default function EmployeeDashboard({ onNavigate }) {


const [employee, setEmployee] = useState(null);

const [loading, setLoading] = useState(true);

const [error, setError] = useState("");
const [todayAttendance, setTodayAttendance] = useState(null);
const [dashboardSummary, setDashboardSummary] = useState({ activeTaskCount: 0, dueTodayCount: 0, ticketCount: 0, solvedThisWeek: 0 });
const getAuthToken = () => {
    return (
        localStorage.getItem("client-connect-token") ||
        sessionStorage.getItem("client-connect-token") ||
        ""
    );
};




const mapTask = (task, formatDate) => {
    if (!task) return null;

    return {
        id: task._id,
        taskNo: task.taskCode || "",
        ticketNo: task.ticketCode || "",
        title: task.title || "Untitled Task",
        client: task.clientName || "Internal",
        project:
            task.projectName ||
            task.productName ||
            task.project ||
            "General",

        priority: task.priority || "Low",
        status: task.status || "Assigned",

        dueDate: formatDate
            ? formatDate(task.dueDate)
            : "—",

        estimatedMinutes:
            Number(task.estimatedMinutes || 0),

        elapsedSeconds:
            Number(
                task.elapsedSeconds ??
                (Number(task.spentMinutes || 0) * 60)
            ),

        startedAt:
            task.startedAt || null,

        progress:
            Number(task.progress || 0),
    };
};
const loadDashboard = async () => {
    const response = await fetch(`${API_URL}/api/employee/dashboard`, {
        headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            "Content-Type": "application/json",
        },
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load dashboard.");
    }

    const data = result.data;
    const formatDate = (value) =>
        value
            ? new Date(value).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
              })
            : "—";

 const mappedTasks = (data.tasks || [])
    .map((task) => mapTask(task, formatDate))
    .filter(Boolean);

const mappedActiveTask =
    mapTask(data.activeTask, formatDate);

    setEmployee(data.employee);
    setTodayAttendance(data.attendance || null);
    setAttendanceStatus(data.attendance?.workStatus || data.attendance?.status || "Absent");
    setLoginTime(
        data.attendance?.loginTime
            ? new Date(data.attendance.loginTime).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
              })
            : "—"
    );
    setDashboardSummary(data.summary || { activeTaskCount: 0, dueTodayCount: 0, ticketCount: 0, solvedThisWeek: 0 });
setTasks(mappedTasks);
setActiveTaskData(mappedActiveTask);
    setAssignedTickets(
        (data.tickets || []).map((ticket) => ({
            id: ticket._id,
            ticketNo: ticket.ticketCode,
            title: ticket.title,
            client: ticket.clientName,
            project: ticket.productName,
            priority: ticket.priority,
            status: ticket.status,
            dueDate: formatDate(ticket.createdAt),
        }))
    );
    setWorkLogs(
        (data.workLog || []).map((log) => ({
            ...log,
            time: new Date(log.time).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
            }),
        }))
    );
};


    const [tasks, setTasks] = useState([]);
    const [assignedTickets, setAssignedTickets] = useState([]);
    const [workLogs, setWorkLogs] = useState([]);
   const [activeTaskData, setActiveTaskData] = useState(null);
const [liveTaskSeconds, setLiveTaskSeconds] = useState(0);
    const [attendanceStatus, setAttendanceStatus] =
        useState("Absent");
    const [loginTime, setLoginTime] = useState("—");

const activeTask = activeTaskData;
const workdayStarted =
    Boolean(todayAttendance?.loginTime) &&
    !todayAttendance?.logoutTime;

const workdayCompleted =
    Boolean(todayAttendance?.loginTime) &&
    Boolean(todayAttendance?.logoutTime);
    const hour = new Date().getHours();

    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

useEffect(() => {
    loadDashboard()
        .catch((err) => {
            console.error("Dashboard:", err);
            setError(err.message);
        })
        .finally(() => setLoading(false));
}, []);

useEffect(() => {
    if (!activeTask) {
        setLiveTaskSeconds(0);
        return;
    }

    const backendSeconds =
        Number(activeTask.elapsedSeconds || 0);

    if (
        activeTask.status !== "In Progress" ||
        !activeTask.startedAt
    ) {
        setLiveTaskSeconds(backendSeconds);
        return;
    }

    /*
     * IMPORTANT:
     *
     * /api/employee/dashboard already returns elapsedSeconds
     * including the running portion at fetch time.
     *
     * Therefore we use that returned value as the base and
     * only count forward from when THIS page received it.
     */
    const receivedAt = Date.now();

    const tick = () => {
        const sinceFetch = Math.max(
            0,
            Math.floor(
                (Date.now() - receivedAt) / 1000
            )
        );

        setLiveTaskSeconds(
            backendSeconds + sinceFetch
        );
    };

    tick();

    const timer = window.setInterval(
        tick,
        1000
    );

    return () => {
        window.clearInterval(timer);
    };
}, [
    activeTask?.id,
    activeTask?.status,
    activeTask?.elapsedSeconds,
    activeTask?.startedAt,
]);


    const activeTaskCount = dashboardSummary.activeTaskCount;

    const dueTodayCount = dashboardSummary.dueTodayCount;

   const hoursToday = useMemo(() => {
    const minutes = Number(
        dashboardSummary.hoursToday || 0
    );

    return `${Math.floor(minutes / 60)}h ${
        minutes % 60
    }m`;
}, [dashboardSummary.hoursToday]);

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



const handlePauseResume = async () => {
    if (!activeTask) return;

    const action =
        activeTask.status === "Paused"
            ? "resume"
            : "pause";

    try {
        const response = await fetch(
            `${API_URL}/api/employee/tasks/${activeTask.id}/${action}`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${getAuthToken()}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message ||
                    `Unable to ${action} task.`
            );
        }

        await loadDashboard();
    } catch (error) {
        console.error(`${action} task:`, error);
        alert(error.message);
    }
};

  const handleStartTask = async (taskId) => {
    try {
        const response = await fetch(
            `${API_URL}/api/employee/tasks/${taskId}/start`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${getAuthToken()}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "Unable to start task."
            );
        }

        await loadDashboard();
    } catch (error) {
        console.error("Start task:", error);
        alert(error.message);
    }
};

const handleCompleteTask = async () => {
    if (!activeTask) return;

    try {
        const response = await fetch(
            `${API_URL}/api/employee/tasks/${activeTask.id}/end`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${getAuthToken()}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message ||
                    "Unable to complete task."
            );
        }

        await loadDashboard();
    } catch (error) {
        console.error(
            "Complete task:",
            error
        );

        alert(error.message);
    }
};

const handleAttendanceToggle = async () => {
const isWorking =
    Boolean(todayAttendance?.loginTime) &&
    !todayAttendance?.logoutTime;

    const endpoint =
        isWorking ? "logout" : "login";

    try {
        /*
        =========================================================
        1. UPDATE ATTENDANCE ON BACKEND
        =========================================================
        */

        const response = await fetch(
            `${API_URL}/api/attendance/${endpoint}`,
            {
                method: "POST",

                headers: {
                    Authorization:
                        `Bearer ${getAuthToken()}`,

                    "Content-Type":
                        "application/json",
                },

                body: JSON.stringify({
                    source: "web",
                }),
            }
        );

        const result =
            await response.json();

        if (
            !response.ok ||
            !result.success
        ) {
            throw new Error(
                result.message ||
                "Attendance update failed."
            );
        }

        /*
        =========================================================
        2. END WORKDAY -> STOP LOCAL AGENT
        =========================================================
        */

        if (isWorking) {
            try {
                const agentResponse =
                    await fetch(
                        "http://127.0.0.1:4500/logout",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",
                            },
                        }
                    );

                const agentResult =
                    await agentResponse.json();

                if (
                    !agentResponse.ok ||
                    !agentResult.success
                ) {
                    console.warn(
                        "ClientConnect Agent stop warning:",
                        agentResult.message
                    );
                } else {
                    console.log(
                        "ClientConnect Agent stopped:",
                        agentResult.message
                    );
                }
            } catch (agentError) {
                /*
                 * Attendance logout already succeeded.
                 * Do not fail End Workday if agent is unavailable.
                 */

                console.warn(
                    "ClientConnect Agent could not be stopped:",
                    agentError
                );
            }
        }

        /*
        =========================================================
        3. START WORKDAY -> START LOCAL AGENT
        =========================================================
        */

        if (!isWorking) {
            try {
                const storedUserRaw =
                    localStorage.getItem(
                        "client-connect-current-user"
                    );

                const storedUser =
                    storedUserRaw
                        ? JSON.parse(storedUserRaw)
                        : null;

              const employeeCode =
    employee?.employeeCode ||
    employee?.code ||
    storedUser?.employeeCode ||
    storedUser?.code ||
    "";

                if (employeeCode) {
                    const agentResponse =
                        await fetch(
                            "http://127.0.0.1:4500/login",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json",
                                },

                                body: JSON.stringify({
                                    employeeCode,
                                }),
                            }
                        );

                    const agentResult =
                        await agentResponse.json();

                    if (
                        !agentResponse.ok ||
                        !agentResult.success
                    ) {
                        console.warn(
                            "ClientConnect Agent start warning:",
                            agentResult.message
                        );
                    } else {
                        console.log(
                            "ClientConnect Agent started:",
                            agentResult.message
                        );
                    }
                } else {
                    console.warn(
                        "Agent start skipped: employeeCode not found."
                    );
                }
            } catch (agentError) {
                console.warn(
                    "ClientConnect Agent could not be started:",
                    agentError
                );
            }
        }

        /*
        =========================================================
        4. REFRESH DASHBOARD
        =========================================================
        */

     await loadDashboard();

        addWorkLog(
            isWorking
                ? "Logged out"
                : "Logged in",

            `Attendance ${
                isWorking
                    ? "logout"
                    : "login"
            } recorded`,

            isWorking
                ? "logout"
                : "login"
        );

    } catch (err) {
        console.error(
            "Dashboard attendance toggle:",
            err
        );

        alert(
            err.message ||
            "Unable to update attendance."
        );
    }
};
    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <LoadingState message="Loading employee workspace..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-rose-800 shadow-2xs">
                <div className="flex items-center gap-3">
                    <AlertCircle size={18} className="shrink-0 text-rose-600" />
                    <div>
                        <h4 className="text-xs font-semibold">Error Loading Dashboard</h4>
                        <p className="mt-0.5 text-xs text-rose-600">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header Module Bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200/80">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1B59F8] border border-blue-100 shadow-2xs shrink-0">
                        <LayoutDashboard size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-bold tracking-tight text-slate-900">
                                {greeting}, {employee?.name || "Employee"}
                            </h1>
                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-[#1B59F8] border border-blue-200/80">
                                Employee Workspace
                            </span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                                <CalendarDays size={12} className="text-slate-400" />
                                {new Date().toLocaleDateString("en-IN", {
                                    weekday: "short",
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                })}
                            </span>
                            <span>•</span>
                            <span
                                className={`inline-flex items-center gap-1.5 font-medium ${
                                    attendanceStatus === "Working"
                                        ? "text-emerald-700"
                                        : "text-slate-500"
                                }`}
                            >
                                <span
                                    className={`h-1.5 w-1.5 rounded-full ${
                                        attendanceStatus === "Working"
                                            ? "bg-emerald-500 animate-pulse"
                                            : "bg-slate-300"
                                    }`}
                                />
                                {attendanceStatus}
                                {attendanceStatus === "Working"
                                    ? ` at ${loginTime}`
                                    : ""}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleAttendanceToggle}
                        disabled={workdayCompleted}
                        className={`flex h-8 items-center justify-center gap-1.5 rounded-lg px-3.5 text-xs font-semibold shadow-2xs transition ${
                            workdayStarted
                                ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                : workdayCompleted
                                  ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                                  : "bg-[#1B59F8] text-white hover:bg-blue-700"
                        }`}
                    >
                        {workdayStarted ? (
                            <LogOut size={13} />
                        ) : workdayCompleted ? (
                            <CheckCircle2 size={13} />
                        ) : (
                            <LogIn size={13} />
                        )}

                        {workdayStarted
                            ? "End Workday"
                            : workdayCompleted
                              ? "Workday Completed"
                              : "Start Workday"}
                    </button>
                </div>
            </div>

            {/* Top 4 KPI Metrics */}
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <DashboardCard
                    label="Hours Today"
                    value={hoursToday}
                    description={`Login recorded at ${loginTime}`}
                    icon={Clock3}
                    iconClass="bg-blue-50 text-[#1B59F8] border border-blue-100"
                    descriptionClass="text-slate-500"
                />

                <DashboardCard
                    label="Active Tasks"
                    value={activeTaskCount}
                    description={`${dueTodayCount} due today`}
                    icon={ListTodo}
                    iconClass="bg-amber-50 text-amber-700 border border-amber-100"
                    descriptionClass={
                        dueTodayCount > 0
                            ? "text-rose-600 font-semibold"
                            : "text-slate-500"
                    }
                />

                <DashboardCard
                    label="Tickets Assigned"
                    value={dashboardSummary.ticketCount}
                    description={`${dashboardSummary.ticketCount} open assignment${dashboardSummary.ticketCount === 1 ? "" : "s"}`}
                    icon={Headphones}
                    iconClass="bg-sky-50 text-sky-700 border border-sky-100"
                    descriptionClass="text-slate-500"
                />

                <DashboardCard
                    label="Solved This Week"
                    value={dashboardSummary.solvedThisWeek}
                    description="Resolved in current week"
                    icon={CheckCircle2}
                    iconClass="bg-emerald-50 text-emerald-700 border border-emerald-100"
                    descriptionClass="text-emerald-600 font-medium"
                />
            </div>

            {/* Active Task Timer + My Tasks Queue */}
            <div className="grid gap-3 xl:grid-cols-[380px_minmax(0,1fr)]">
                {/* Active Task Timer */}
                <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/50 px-4 py-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-[#1B59F8] border border-blue-100">
                                <Timer size={13} />
                            </div>
                            <p className="text-xs font-semibold text-slate-900">
                                Active Task Timer
                            </p>
                        </div>
                        {activeTask && (
                            <span
                                className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ring-1 ring-inset ${
                                    activeTask.status === "In Progress"
                                        ? "bg-blue-50 text-[#1B59F8] ring-blue-500/20"
                                        : "bg-amber-50 text-amber-700 ring-amber-500/20"
                                }`}
                            >
                                {activeTask.status}
                            </span>
                        )}
                    </div>

                    <div className="p-4">
                        {activeTask ? (
                            <>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h3 className="truncate text-xs font-semibold text-slate-900">
                                            {activeTask.title}
                                        </h3>

                                        <p className="mt-0.5 text-[10px] text-slate-500 truncate">
                                            {activeTask.ticketNo || activeTask.taskNo}
                                            {" · "}
                                            {activeTask.client}
                                        </p>
                                    </div>

                                    <span
                                        className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ring-1 ring-inset ${getPriorityClasses(
                                            activeTask.priority
                                        )}`}
                                    >
                                        {activeTask.priority}
                                    </span>
                                </div>

                                <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/70 py-3 text-center">
                                    <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                        Elapsed Time
                                    </p>
                                    <p className="mt-0.5 font-mono text-3xl font-bold tracking-tight text-slate-900">
                                        {formatTimer(liveTaskSeconds)}
                                    </p>
                                </div>

                                <div className="mt-3">
                                    <div className="flex items-center justify-between text-[9px] font-medium text-slate-500">
                                        <span>Progress</span>
                                        <span className="font-semibold text-slate-700">{activeTask.progress}%</span>
                                    </div>

                                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full rounded-full bg-[#1B59F8] transition-all duration-300"
                                            style={{
                                                width: `${Math.min(activeTask.progress, 100)}%`,
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={handlePauseResume}
                                        className="flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
                                    >
                                        {activeTask?.status === "Paused" ? (
                                            <Play size={13} />
                                        ) : (
                                            <Pause size={13} />
                                        )}

                                        {activeTask?.status === "Paused"
                                            ? "Resume"
                                            : "Pause"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleCompleteTask}
                                        className="flex h-8 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700 shadow-2xs transition hover:bg-emerald-100"
                                    >
                                        <CheckCircle2 size={13} />
                                        Mark Done
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex min-h-[190px] flex-col items-center justify-center text-center p-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                                    <Timer size={18} />
                                </div>

                                <h3 className="mt-3 text-xs font-semibold text-slate-900">
                                    No active task
                                </h3>

                                <p className="mt-1 text-[11px] text-slate-500 max-w-[220px]">
                                    Start a task from your queue to begin automatic time tracking.
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                {/* My Tasks Queue */}
                <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/50 px-4 py-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-50 text-amber-700 border border-amber-100">
                                <ListTodo size={13} />
                            </div>
                            <h3 className="text-xs font-semibold text-slate-900">
                                My Tasks
                            </h3>
                            <span className="text-[10px] text-slate-400 font-normal">
                                ({tasks.length})
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => onNavigate?.("tasks")}
                            className="flex items-center gap-1 text-[11px] font-semibold text-[#1B59F8] hover:underline"
                        >
                            View all
                            <ArrowUpRight size={12} />
                        </button>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                        {tasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400 mb-2">
                                    <ListTodo size={16} />
                                </div>
                                <p className="text-xs font-semibold text-slate-700">No assigned tasks</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Tasks assigned to you will appear here.</p>
                            </div>
                        ) : (
                            tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="flex flex-col gap-3 px-4 py-3 transition hover:bg-slate-50/70 md:flex-row md:items-center"
                                >
                                    <button
                                        type="button"
                                        onClick={() => handleStartTask(task.id)}
                                        disabled={["Completed", "Resolved"].includes(task.status)}
                                        title="Start task timer"
                                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1B59F8] border border-blue-100 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <Play size={12} />
                                    </button>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-semibold text-slate-900">
                                            {task.title}
                                        </p>

                                        <p className="mt-0.5 text-[10px] text-slate-500 truncate">
                                            {task.ticketNo || task.taskNo}
                                            {" · "}
                                            {task.client}
                                            {" · Due "}
                                            {task.dueDate}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ring-1 ring-inset ${getPriorityClasses(
                                                task.priority
                                            )}`}
                                        >
                                            {task.priority}
                                        </span>

                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ring-1 ring-inset ${getStatusClasses(
                                                task.status
                                            )}`}
                                        >
                                            {task.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            {/* Bottom Row: My Assigned Tickets & Work Log */}
            <div className="grid gap-3 xl:grid-cols-2">
                {/* Tickets Section */}
                <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/50 px-4 py-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-50 text-sky-700 border border-sky-100">
                                <Headphones size={13} />
                            </div>
                            <h3 className="text-xs font-semibold text-slate-900">
                                My Assigned Tickets
                            </h3>
                        </div>

                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            {assignedTickets.length} assigned
                        </span>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                        {assignedTickets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400 mb-2">
                                    <Headphones size={16} />
                                </div>
                                <p className="text-xs font-semibold text-slate-700">No support tickets assigned</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">You're all caught up with helpdesk issues.</p>
                            </div>
                        ) : (
                            assignedTickets.map((ticket) => (
                                <div
                                    key={ticket.id}
                                    className="flex flex-col gap-2.5 px-4 py-3 transition hover:bg-slate-50/70 sm:flex-row sm:items-center"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-slate-900 truncate">
                                            {ticket.title}
                                        </p>

                                        <p className="mt-0.5 text-[10px] text-slate-500 truncate">
                                            {ticket.ticketNo} · {ticket.client} · {ticket.project}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ring-1 ring-inset ${getPriorityClasses(
                                                ticket.priority
                                            )}`}
                                        >
                                            {ticket.priority}
                                        </span>

                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ring-1 ring-inset ${getStatusClasses(
                                                ticket.status
                                            )}`}
                                        >
                                            {ticket.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Today's Work Log */}
                <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/50 px-4 py-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-[#1B59F8] border border-blue-100">
                                <Clock3 size={13} />
                            </div>
                            <h3 className="text-xs font-semibold text-slate-900">
                                Today’s Work Log
                            </h3>
                        </div>

                        <span className="text-[10px] text-slate-400 font-medium">
                            Auto-recorded
                        </span>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto p-4">
                        {workLogs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400 mb-2">
                                    <Clock3 size={16} />
                                </div>
                                <p className="text-xs font-semibold text-slate-700">No work activity recorded today</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Activity is logged automatically as tasks are started.</p>
                            </div>
                        ) : (
                            <div className="relative space-y-4 before:absolute before:bottom-2 before:left-[5px] before:top-2 before:w-px before:bg-slate-200">
                                {workLogs.map((log) => (
                                    <div
                                        key={log.id}
                                        className="relative flex gap-3.5"
                                    >
                                        <span
                                            className={`relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-white ${
                                                log.type === "completed"
                                                    ? "bg-emerald-500"
                                                    : log.type === "logout"
                                                      ? "bg-rose-500"
                                                      : "bg-[#1B59F8]"
                                            }`}
                                        />

                                        <div>
                                            <p className="text-xs font-semibold text-slate-800">
                                                {log.title}
                                            </p>

                                            <p className="mt-0.5 text-[10px] text-slate-500">
                                                {log.description}
                                            </p>

                                            <p className="mt-0.5 text-[9px] uppercase tracking-wider text-slate-400">
                                                {log.time}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Due Today Alert Banner */}
            {dueTodayCount > 0 && (
                <div className="flex items-center gap-3 rounded-xl border border-amber-200/90 bg-amber-50/80 px-4 py-3 shadow-2xs">
                    <AlertCircle
                        size={16}
                        className="shrink-0 text-amber-600"
                    />

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-1">
                        <p className="text-xs font-semibold text-amber-800">
                            {dueTodayCount} task{dueTodayCount > 1 ? "s are" : " is"} due today
                        </p>
                        <p className="text-[11px] text-amber-700">
                            Please complete or update status before shift end.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}   
