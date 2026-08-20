import API_URL from "../config/api";
import { useEffect, useMemo, useState } from "react";
import {
    Activity,
    AlertCircle,
    AppWindow,
    BarChart3,
    BriefcaseBusiness,
    Check,
    CheckCircle2,
    ChevronDown,
    Clock3,
    Coffee,
    FileText,
    Keyboard,
    Laptop,
    ListTodo,
    Monitor,
    MousePointer2,
    Pause,
    Play,
    RefreshCw,
    Save,
    Search,
    ShieldCheck,
    Square,
    Timer,
    TrendingUp,
    X,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| AGENT-READY DATA CONTRACT
|--------------------------------------------------------------------------
| Later the Windows Agent can send records matching this structure:
|
| {
|   employeeId: "EMP-001",
|   deviceId: "AKASH-PC",
|   capturedAt: "2026-07-14T10:20:00.000Z",
|   applicationName: "Visual Studio Code",
|   processName: "Code.exe",
|   windowTitle: "Dashboard.jsx - Client Connect",
|   category: "Development",
|   productivity: "Productive",
|   activityStatus: "Active",
|   keyboardEvents: 154,
|   mouseEvents: 89,
|   idleSeconds: 0,
|   taskId: "TSK-2084",
|   ticketId: "TKT-1042",
|   screenshotUrl: null
| }
|--------------------------------------------------------------------------
*/

const DEMO_DATE = "2026-07-14";
const API_BASE_URL =API_URL;

const initialAgentStatus = {
    connected: true,
    deviceId: "AKASH-PC",
    agentVersion: "v1.0.0",
    operatingSystem: "Windows 11 Pro",
    lastSyncAt: "2026-07-14T17:04:00",
    syncIntervalSeconds: 60,
    trackingEnabled: true,
};

const initialTasks = [
    {
        id: "TSK-2084",
        ticketId: "TKT-1042",
        title: "Fix GST report mismatch",
        client: "Shree Ganesh Industries",
        project: "NexERP",
        status: "In Progress",
    },
    {
        id: "TSK-2087",
        ticketId: "TKT-1045",
        title: "Resolve barcode printer issue",
        client: "Omkar Traders",
        project: "RetailPOS",
        status: "Assigned",
    },
    {
        id: "TSK-2089",
        ticketId: "",
        title: "Complete StockPro testing",
        client: "Internal Development",
        project: "StockPro",
        status: "Testing",
    },
];

const initialSessions = [
    {
        id: 1,
        type: "login",
        title: "Workday started",
        description: "Attendance login recorded from employee workspace.",
        startedAt: "09:02",
        endedAt: "09:02",
        durationSeconds: 0,
        taskId: "",
        applicationName: "",
        status: "Completed",
    },
    {
        id: 2,
        type: "task",
        title: "GST report investigation",
        description: "Checked GST report values and sales-register totals.",
        startedAt: "09:20",
        endedAt: "10:45",
        durationSeconds: 5100,
        taskId: "TSK-2084",
        applicationName: "Visual Studio Code",
        status: "Completed",
    },
    {
        id: 3,
        type: "break",
        title: "Morning break",
        description: "Employee marked a short break.",
        startedAt: "10:45",
        endedAt: "10:57",
        durationSeconds: 720,
        taskId: "",
        applicationName: "",
        status: "Completed",
    },
    {
        id: 4,
        type: "task",
        title: "Updated GST report query",
        description: "Modified report query and tested invoice calculations.",
        startedAt: "10:57",
        endedAt: "12:25",
        durationSeconds: 5280,
        taskId: "TSK-2084",
        applicationName: "SQL Server Management Studio",
        status: "Completed",
    },
    {
        id: 5,
        type: "break",
        title: "Lunch break",
        description: "Lunch break recorded.",
        startedAt: "13:05",
        endedAt: "13:40",
        durationSeconds: 2100,
        taskId: "",
        applicationName: "",
        status: "Completed",
    },
    {
        id: 6,
        type: "task",
        title: "Testing corrected GST report",
        description: "Testing report output with client invoice samples.",
        startedAt: "13:40",
        endedAt: "",
        durationSeconds: 12240,
        taskId: "TSK-2084",
        applicationName: "Visual Studio Code",
        status: "Running",
    },
];

const initialAgentEvents = [
    {
        id: 1,
        employeeId: "EMP-001",
        deviceId: "AKASH-PC",
        capturedAt: "2026-07-14T16:58:00",
        applicationName: "Visual Studio Code",
        processName: "Code.exe",
        windowTitle: "Dashboard.jsx - Client Connect",
        category: "Development",
        productivity: "Productive",
        activityStatus: "Active",
        keyboardEvents: 184,
        mouseEvents: 76,
        idleSeconds: 0,
        taskId: "TSK-2084",
        ticketId: "TKT-1042",
        screenshotUrl: null,
    },
    {
        id: 2,
        employeeId: "EMP-001",
        deviceId: "AKASH-PC",
        capturedAt: "2026-07-14T16:48:00",
        applicationName: "Google Chrome",
        processName: "chrome.exe",
        windowTitle: "GST Report Testing - localhost",
        category: "Browser",
        productivity: "Productive",
        activityStatus: "Active",
        keyboardEvents: 54,
        mouseEvents: 121,
        idleSeconds: 0,
        taskId: "TSK-2084",
        ticketId: "TKT-1042",
        screenshotUrl: null,
    },
    {
        id: 3,
        employeeId: "EMP-001",
        deviceId: "AKASH-PC",
        capturedAt: "2026-07-14T16:38:00",
        applicationName: "SQL Server Management Studio",
        processName: "Ssms.exe",
        windowTitle: "GSTMonthlySummary.sql",
        category: "Development",
        productivity: "Productive",
        activityStatus: "Active",
        keyboardEvents: 95,
        mouseEvents: 42,
        idleSeconds: 0,
        taskId: "TSK-2084",
        ticketId: "TKT-1042",
        screenshotUrl: null,
    },
    {
        id: 4,
        employeeId: "EMP-001",
        deviceId: "AKASH-PC",
        capturedAt: "2026-07-14T16:28:00",
        applicationName: "WhatsApp Business",
        processName: "WhatsApp.exe",
        windowTitle: "Shree Ganesh Industries",
        category: "Communication",
        productivity: "Productive",
        activityStatus: "Active",
        keyboardEvents: 32,
        mouseEvents: 18,
        idleSeconds: 0,
        taskId: "TSK-2084",
        ticketId: "TKT-1042",
        screenshotUrl: null,
    },
    {
        id: 5,
        employeeId: "EMP-001",
        deviceId: "AKASH-PC",
        capturedAt: "2026-07-14T16:18:00",
        applicationName: "Google Chrome",
        processName: "chrome.exe",
        windowTitle: "YouTube",
        category: "Entertainment",
        productivity: "Unproductive",
        activityStatus: "Active",
        keyboardEvents: 3,
        mouseEvents: 11,
        idleSeconds: 0,
        taskId: "",
        ticketId: "",
        screenshotUrl: null,
    },
    {
        id: 6,
        employeeId: "EMP-001",
        deviceId: "AKASH-PC",
        capturedAt: "2026-07-14T16:08:00",
        applicationName: "Google Chrome",
        processName: "chrome.exe",
        windowTitle: "GST documentation",
        category: "Research",
        productivity: "Productive",
        activityStatus: "Idle",
        keyboardEvents: 0,
        mouseEvents: 0,
        idleSeconds: 420,
        taskId: "TSK-2084",
        ticketId: "TKT-1042",
        screenshotUrl: null,
    },
];

const initialApplicationUsage = [
    {
        id: 1,
        applicationName: "Visual Studio Code",
        category: "Development",
        totalSeconds: 12420,
        productivity: "Productive",
        percentage: 39,
    },
    {
        id: 2,
        applicationName: "Google Chrome",
        category: "Browser",
        totalSeconds: 7020,
        productivity: "Productive",
        percentage: 22,
    },
    {
        id: 3,
        applicationName: "SQL Server Management Studio",
        category: "Development",
        totalSeconds: 5580,
        productivity: "Productive",
        percentage: 18,
    },
    {
        id: 4,
        applicationName: "WhatsApp Business",
        category: "Communication",
        totalSeconds: 2700,
        productivity: "Productive",
        percentage: 9,
    },
    {
        id: 5,
        applicationName: "Microsoft Excel",
        category: "Office",
        totalSeconds: 2100,
        productivity: "Productive",
        percentage: 7,
    },
    {
        id: 6,
        applicationName: "Other",
        category: "Other",
        totalSeconds: 1500,
        productivity: "Neutral",
        percentage: 5,
    },
];

const initialTimeDistribution = [
    {
        id: 1,
        category: "Development",
        seconds: 18000,
        percentage: 54,
    },
    {
        id: 2,
        category: "Testing",
        seconds: 6120,
        percentage: 18,
    },
    {
        id: 3,
        category: "Client Support",
        seconds: 4200,
        percentage: 13,
    },
    {
        id: 4,
        category: "Documentation",
        seconds: 2700,
        percentage: 8,
    },
    {
        id: 5,
        category: "Communication",
        seconds: 2400,
        percentage: 7,
    },
];

const initialIdleSessions = [
    {
        id: 1,
        startedAt: "11:25",
        endedAt: "11:33",
        durationSeconds: 480,
        lastApplication: "Google Chrome",
        reason: "No keyboard or mouse activity detected.",
    },
    {
        id: 2,
        startedAt: "15:12",
        endedAt: "15:21",
        durationSeconds: 540,
        lastApplication: "Visual Studio Code",
        reason: "No keyboard or mouse activity detected.",
    },
];

const initialDailyNotes = [
    {
        id: 1,
        text: "GST report taxable-value issue identified.",
        completed: true,
    },
    {
        id: 2,
        text: "Corrected query tested with three sample invoices.",
        completed: true,
    },
    {
        id: 3,
        text: "Waiting for client confirmation before closing ticket.",
        completed: false,
    },
];

function formatSeconds(totalSeconds) {
    const seconds = Math.max(Number(totalSeconds || 0), 0);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;

    return `${hours}h ${minutes}m`;
}

function formatTimer(totalSeconds) {
    const seconds = Math.max(Number(totalSeconds || 0), 0);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return [hours, minutes, remainingSeconds]
        .map((value) => String(value).padStart(2, "0"))
        .join(":");
}

function formatAgentTime(value) {
    if (!value) return "Never";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Never";

    return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getProductivityClasses(productivity) {
    const styles = {
        Productive:
            "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
        Neutral: "bg-slate-100 text-slate-600 ring-slate-500/10",
        Unproductive: "bg-rose-50 text-rose-700 ring-rose-600/10",
    };

    return styles[productivity] || styles.Neutral;
}

function getActivityClasses(status) {
    const styles = {
        Active: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
        Idle: "bg-amber-50 text-amber-700 ring-amber-600/10",
        Offline: "bg-slate-100 text-slate-600 ring-slate-500/10",
    };

    return styles[status] || styles.Offline;
}

function MetricCard({
    label,
    value,
    description,
    icon: Icon,
    iconClass,
    descriptionClass = "text-slate-500",
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
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

            <p className={`mt-4 text-xs ${descriptionClass}`}>
                {description}
            </p>
        </div>
    );
}

export default function TimeLog() {
    const [activeTab, setActiveTab] = useState("today");
    const [agentStatus, setAgentStatus] = useState(initialAgentStatus);
    const [tasks] = useState(initialTasks);
    const [sessions, setSessions] = useState(initialSessions);


    const [selectedTaskId, setSelectedTaskId] = useState("TSK-2084");
    const [timerRunning, setTimerRunning] = useState(true);
    const [currentSessionSeconds, setCurrentSessionSeconds] = useState(0);
    const [agentEvents, setAgentEvents] = useState([]);
    const [liveTaskSeconds, setLiveTaskSeconds] = useState(0);
    const [dashboardMetrics, setDashboardMetrics] = useState({
        tasksCompleted: 0,
        ticketsSolved: 0,
        supportCalls: 0,
    });

    const [attendanceStatus, setAttendanceStatus] = useState("Present");
    const [loading, setLoading] = useState(true);
    const [apiSummary, setApiSummary] = useState(null);
    const [apiApplications, setApiApplications] = useState([]);
    const [dashboardData, setDashboardData] = useState(null);
    const [taskSessions, setTaskSessions] = useState([]);

    const applicationUsage = useMemo(() => {
    const applicationMap = new Map();

    for (const app of apiApplications) {
        const applicationName =
            app.applicationName ||
            app.application ||
            "Unknown Application";

        // Normalize name so "Google Chrome" and "google chrome"
        // are treated as the same application.
        const key = applicationName.trim().toLowerCase();

        if (!applicationMap.has(key)) {
            applicationMap.set(key, {
                ...app,
                applicationName,
                totalSeconds: 0,
                sessionCount: 0,
            });
        }

        const merged = applicationMap.get(key);

        merged.totalSeconds += Number(app.totalSeconds || 0);
        merged.sessionCount += Number(app.sessionCount || 0);

        // Keep most recent application/window information.
        const oldTime = merged.lastSeen
            ? new Date(merged.lastSeen).getTime()
            : 0;

        const newTime = app.lastSeen
            ? new Date(app.lastSeen).getTime()
            : 0;

        if (newTime >= oldTime) {
            merged.lastSeen = app.lastSeen || merged.lastSeen;

            merged.lastWindowTitle =
                app.lastWindowTitle ||
                merged.lastWindowTitle;

            merged.category =
                app.category ||
                merged.category;
        }

        // Productive takes priority if application has mixed task records.
        if (app.productivity === "Productive") {
            merged.productivity = "Productive";
        } else if (
            app.productivity === "Unproductive" &&
            merged.productivity !== "Productive"
        ) {
            merged.productivity = "Unproductive";
        } else if (!merged.productivity) {
            merged.productivity = "Neutral";
        }
    }

    const mergedApplications = Array.from(
        applicationMap.values()
    );

    const totalSeconds = mergedApplications.reduce(
        (sum, app) =>
            sum + Number(app.totalSeconds || 0),
        0
    );

    return mergedApplications
        .map((app) => ({
            ...app,

            percentage:
                totalSeconds > 0
                    ? Math.round(
                          (Number(app.totalSeconds || 0) /
                              totalSeconds) *
                              100
                      )
                    : 0,
        }))
        .sort(
            (a, b) =>
                Number(b.totalSeconds || 0) -
                Number(a.totalSeconds || 0)
        );
}, [apiApplications]);

    const timeDistribution = useMemo(() => {
        const total = apiApplications.reduce(
            (sum, app) => sum + Number(app.totalSeconds || 0),
            0
        );

        return apiApplications.map((app, index) => ({
            id: index,
            category: app.category || app.applicationName,
            seconds: app.totalSeconds || 0,
            percentage:
                total > 0
                    ? Math.round(((app.totalSeconds || 0) / total) * 100)
                    : 0,
        }));
    }, [apiApplications]);
    const [idleSessions] = useState(initialIdleSessions);
    const [dailyNotes, setDailyNotes] = useState(initialDailyNotes);

    const [noteText, setNoteText] = useState("");
    const [searchValue, setSearchValue] = useState("");
    const [activityFilter, setActivityFilter] = useState("All");


    const fetchTimeLog = async () => {
        try {
            const token =
                localStorage.getItem("client-connect-token") ||
                sessionStorage.getItem("client-connect-token");

            if (!token) return;

            const [timeRes, dashboardRes, sessionsRes, activityRes] =
                await Promise.all([
                    fetch(`${API_BASE_URL}/api/employee/time-log/today`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch(`${API_BASE_URL}/api/employee/tasks/dashboard`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch(`${API_BASE_URL}/api/employee/time-log/sessions`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch(`${API_BASE_URL}/api/employee/time-log/activity`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);

            const timeResult = await timeRes.json();
            const dashboardResult = await dashboardRes.json();
            const sessionsResult = await sessionsRes.json();
            const activityResult = await activityRes.json();


            if (sessionsResult.success) {
                setTaskSessions(sessionsResult.data);
            }
            if (activityResult.success) {
                const mappedEvents = (activityResult.data || []).map((log) => {
                    const category = log.category || "Other";
                    const productivity =
                        log.productivity ||
                        (category === "Development" ||
                        category === "Database" ||
                        category === "Design" ||
                        category === "Documentation" ||
                        category === "Office"
                            ? "Productive"
                            : category === "Entertainment" ||
                              category === "Social Media" ||
                              category === "Games"
                            ? "Unproductive"
                            : "Neutral");

                    return {
                        id: log.id || log._id,
                        capturedAt:
                            log.capturedAt || log.lastSeen || log.firstSeen || null,
                        applicationName:
                            log.applicationName ||
                            log.application ||
                            "Unknown Application",
                        windowTitle:
                            log.windowTitle || log.lastWindowTitle || "",
                        category,
                        productivity,
                        activityStatus: log.activity || "Active",
                        durationSeconds: Number(
                            log.durationSeconds ?? log.totalSeconds ?? 0
                        ),
                        sessionCount: Number(log.sessionCount ?? 0),
                        taskId: log.taskCode || "",
                        taskCode: log.taskCode || "",
                        taskTitle: log.taskTitle || "",
                        taskStatus: log.taskStatus || "",
                        ticketId: log.ticketCode || "",
                        ticketCode: log.ticketCode || "",
                        project: log.project || "",
                        client: log.client || "",
                        pcName: log.pcName || "",
                    };
                });

                setAgentEvents(mappedEvents);
            } else {
                console.error(
                    "Failed to load agent activity:",
                    activityResult?.message || "The server did not return activity data."
                );
            }

            if (timeResult.success) {
                setApiSummary(timeResult.data.summary);
                setApiApplications(timeResult.data.applications);

                setAgentStatus((prev) => ({
                    ...prev,
                    connected: true,
                    deviceId: timeResult.data.employee.deviceId || prev.deviceId,
                    lastSyncAt: timeResult.data.summary.lastSyncAt || prev.lastSyncAt,
                }));
            }

            if (dashboardResult.success) {
                setDashboardData(dashboardResult.data);
                setDashboardMetrics({
                    tasksCompleted: dashboardResult.data.tasksCompleted || 0,
                    ticketsSolved: dashboardResult.data.ticketsSolved || 0,
                    supportCalls: dashboardResult.data.supportCalls || 0,
                });

                setAttendanceStatus(
                    dashboardResult.data.attendanceStatus || "Present"
                );
            }

        } catch (error) {
            console.error("Failed to load time log/dashboard:", error);
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        fetchTimeLog();

        const refreshId = window.setInterval(fetchTimeLog, 30000);

        return () => window.clearInterval(refreshId);
    }, []);

    const activeTask =
        dashboardData?.activeTask ||
        dashboardData?.tasks?.[0] ||
        null;

    const totalTrackedSeconds =
        apiSummary?.totalTrackedSeconds || 0;

    const productiveSeconds = apiApplications
        .filter((app) => app.productivity === "Productive")
        .reduce((total, app) => total + (app.totalSeconds || 0), 0);
    const selectedTask =
        tasks.find((task) => task.id === selectedTaskId) || tasks[0] || {
            id: "",
            title: "No active task",
            client: "",
            ticketId: "",
            description: "",
        };

    const unproductiveSeconds = apiApplications
        .filter((app) => app.productivity === "Unproductive")
        .reduce((total, app) => total + (app.totalSeconds || 0), 0);

    // Real idle time from agent data
    const idleSeconds = Math.max(
        totalTrackedSeconds - productiveSeconds - unproductiveSeconds,
        0
    );

    // Real productivity score

    const productivityScore =
        totalTrackedSeconds > 0
            ? Math.round((productiveSeconds / totalTrackedSeconds) * 100)
            : 0;

    const filteredEvents = useMemo(() => {
        return agentEvents.filter((event) => {
            const search = searchValue.trim().toLowerCase();

            const matchesSearch =
                !search ||
                [
                    event.applicationName,
                    event.windowTitle,
                    event.category,
                    event.taskId,
                    event.ticketId,
                ].some((value) =>
                    String(value || "")
                        .toLowerCase()
                        .includes(search)
                );

            const matchesFilter =
                activityFilter === "All" ||
                event.productivity === activityFilter ||
                event.activityStatus === activityFilter;

            return matchesSearch && matchesFilter;
        });
    }, [agentEvents, searchValue, activityFilter]);

    const toggleTimer = async () => {
        if (!dashboardData?.activeTimer) return;

        const token =
            localStorage.getItem("client-connect-token") ||
            sessionStorage.getItem("client-connect-token");

        const action =
            dashboardData.activeTimer.status === "Paused" ? "resume" : "pause";

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/employee/tasks/${dashboardData.activeTimer._id}/${action}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const result = await response.json();

            if (result.success) {
                await fetchTimeLog();
            }
        } catch (error) {
            console.error(`Failed to ${action} task:`, error);
        }
    };
    const activeTaskSeconds = liveTaskSeconds;
useEffect(() => {
    const active = dashboardData?.activeTimer;

    if (!active) {
        setLiveTaskSeconds(0);
        return;
    }

    const savedSeconds = Number(active.elapsedSeconds || 0);

    // Paused / completed / not running:
    // just show the saved backend value.
    if (
        active.status !== "In Progress" ||
        !active.startedAt
    ) {
        setLiveTaskSeconds(savedSeconds);
        return;
    }

    const startedAtMs =
        new Date(active.startedAt).getTime();

    if (Number.isNaN(startedAtMs)) {
        setLiveTaskSeconds(savedSeconds);
        return;
    }

    const updateTimer = () => {
        const runningSeconds = Math.max(
            0,
            Math.floor(
                (Date.now() - startedAtMs) / 1000
            )
        );

        setLiveTaskSeconds(
            savedSeconds + runningSeconds
        );
    };

    // Update immediately
    updateTimer();

    const interval = window.setInterval(
        updateTimer,
        1000
    );

    return () => {
        window.clearInterval(interval);
    };
}, [
    dashboardData?.activeTimer?._id,
    dashboardData?.activeTimer?.status,
    dashboardData?.activeTimer?.startedAt,
    dashboardData?.activeTimer?.elapsedSeconds,
]);
    const endCurrentSession = async () => {
        if (!dashboardData?.activeTimer) return;

        const confirmed = window.confirm(
            `End the active session for ${dashboardData.activeTimer.taskCode}?`
        );

        if (!confirmed) return;

        const token =
            localStorage.getItem("client-connect-token") ||
            sessionStorage.getItem("client-connect-token");

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/employee/tasks/${dashboardData.activeTimer._id}/end`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const result = await response.json();

            if (result.success) {
                await fetchTimeLog();
            }
        } catch (error) {
            console.error("Failed to end session:", error);
        }
    };

    const changeTask = async (event) => {
        const nextTaskId = event.target.value;
        if (!nextTaskId) return;

        const token =
            localStorage.getItem("client-connect-token") ||
            sessionStorage.getItem("client-connect-token");

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/employee/tasks/${nextTaskId}/start`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const result = await response.json();

            if (result.success) {
                await fetchTimeLog();
            } else {
                alert(result.message || "Unable to switch task");
            }
        } catch (error) {
            console.error("Failed to switch task:", error);
            alert("Failed to switch task");
        }
    };

    const addDailyNote = (event) => {
        event.preventDefault();

        if (!noteText.trim()) return;

        setDailyNotes((current) => [
            ...current,
            {
                id: Date.now(),
                text: noteText.trim(),
                completed: false,
            },
        ]);

        setNoteText("");
    };

    const toggleNote = (noteId) => {
        setDailyNotes((current) =>
            current.map((note) =>
                note.id === noteId
                    ? {
                        ...note,
                        completed: !note.completed,
                    }
                    : note
            )
        );
    };

    const removeNote = (noteId) => {
        setDailyNotes((current) =>
            current.filter((note) => note.id !== noteId)
        );
    };

    const simulateAgentSync = () => {
        const now = new Date();

        setAgentStatus((current) => ({
            ...current,
            connected: true,
            lastSyncAt: now.toISOString(),
        }));

        setAgentEvents((current) => [
            {
                id: Date.now(),
                employeeId: "EMP-001",
                deviceId: "AKASH-PC",
                capturedAt: now.toISOString(),
                applicationName: "Visual Studio Code",
                processName: "Code.exe",
                windowTitle: "TimeLog.jsx - Client Connect",
                category: "Development",
                productivity: "Productive",
                activityStatus: "Active",
                keyboardEvents: 96,
                mouseEvents: 44,
                idleSeconds: 0,
                taskId: selectedTaskId,
                ticketId: selectedTask?.ticketId || "",
                screenshotUrl: null,
            },
            ...current,
        ]);
    };

    return (
        <div>
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
                        Employee Workspace
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                        Time Log & Productivity
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                        Track task sessions, application activity, idle
                        time and daily productivity.
                    </p>
                </div>

                <div
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${agentStatus.connected
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-rose-200 bg-rose-50"
                        }`}
                >
                    <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${agentStatus.connected
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                            }`}
                    >
                        <Laptop size={17} />
                    </div>

                    <div>
                        <p
                            className={`text-[10px] font-semibold ${agentStatus.connected
                                ? "text-emerald-700"
                                : "text-rose-700"
                                }`}
                        >
                            {agentStatus.connected
                                ? "Windows Agent Connected"
                                : "Windows Agent Offline"}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-500">
                            {agentStatus.deviceId} · Last sync{" "}
                            {formatAgentTime(agentStatus.lastSyncAt)}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={fetchTimeLog}
                        className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-700 transition hover:bg-emerald-100"
                        title="Simulate agent sync"
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <MetricCard
                    label="Tracked Time"
                    value={formatSeconds(totalTrackedSeconds)}
                    description="Task and application activity"
                    icon={Clock3}
                    iconClass="bg-violet-100 text-violet-700"
                    descriptionClass="text-violet-600"
                />

                <MetricCard
                    label="Productive Time"
                    value={formatSeconds(productiveSeconds)}
                    description="Development, support and testing"
                    icon={TrendingUp}
                    iconClass="bg-emerald-100 text-emerald-700"
                    descriptionClass="text-emerald-600"
                />

                <MetricCard
                    label="Idle Time"
                    value={formatSeconds(idleSeconds)}
                    description={`${idleSessions.length} idle sessions`}
                    icon={Coffee}
                    iconClass="bg-amber-100 text-amber-700"
                    descriptionClass="text-amber-600"
                />

                <MetricCard
                    label="Applications"
                    value={applicationUsage.length}
                    description="Applications used today"
                    icon={AppWindow}
                    iconClass="bg-blue-100 text-blue-700"
                    descriptionClass="text-blue-600"
                />

                <MetricCard
                    label="Productivity"
                    value={`${(apiSummary?.totalTrackedSeconds || 0) > 0
                        ? Math.round(
                            (apiApplications
                                .filter((a) => a.productivity === "Productive")
                                .reduce((sum, a) => sum + (a.totalSeconds || 0), 0) /
                                apiSummary.totalTrackedSeconds) * 100
                        )
                        : 0
                        }%`}
                    description="Calculated from agent activity"
                    icon={BarChart3}
                    iconClass="bg-cyan-100 text-cyan-700"
                    descriptionClass="text-cyan-700"
                />
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
                        {[
                            {
                                id: "today",
                                label: "Today",
                            },
                            {
                                id: "activity",
                                label: "Agent Activity",
                            },
                            {
                                id: "applications",
                                label: "Applications",
                            },
                            {
                                id: "sessions",
                                label: "Task Sessions",
                            },
                            {
                                id: "summary",
                                label: "Daily Summary",
                            },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`whitespace-nowrap rounded-lg px-4 py-2 text-[11px] font-semibold transition ${activeTab === tab.id
                                    ? "bg-white text-slate-950 shadow-sm"
                                    : "text-slate-500 hover:text-slate-800"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <span className="text-[10px] text-slate-400">
                        Data date: {new Date().toLocaleDateString()}
                    </span>
                </div>

                {activeTab === "today" && (
                    <div className="p-5">
                        <div className="grid gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
                            <section className="overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-[0_12px_40px_rgba(109,40,217,0.08)]">
                                <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50 to-cyan-50 px-5 py-4">
                                    <div className="flex items-center gap-2 text-violet-700">
                                        <Timer size={16} />

                                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">
                                            Active Task Session
                                        </p>
                                    </div>
                                </div>

                                <div className="p-5">
                                    <div>
                                        <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                            Current Task
                                        </label>

                                        <div className="relative">
                                            <select
                                                value={dashboardData?.activeTimer?._id || ""}
                                                onChange={changeTask}
                                                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-10 text-xs font-semibold text-slate-800 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            >
                                                {(dashboardData?.tasks || [])
                                                    .filter(
                                                        (task) =>
                                                            task.status === "In Progress" ||
                                                            task.status === "Running" ||
                                                            task.status === "Paused"
                                                    )
                                                    .map((task) => (
                                                        <option key={task._id} value={task._id}>
                                                            {task.taskCode} — {task.title}
                                                        </option>
                                                    ))}
                                            </select>

                                            <ChevronDown
                                                size={15}
                                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-5 rounded-xl bg-slate-50 p-4">
                                        <p className="text-xs font-semibold text-slate-900">
                                            {dashboardData?.activeTimer?.title || "No active task"}
                                        </p>

                                        <p className="mt-1 text-[10px] text-slate-500">
                                            {dashboardData?.activeTimer?.clientName || "Internal"}
                                            {" · "}
                                            {dashboardData?.activeTimer?.project || "General"}
                                        </p>

                                        {dashboardData?.activeTimer?.ticketCode && (
                                            <p className="mt-2 text-[10px] font-semibold text-blue-600">
                                                Related ticket: {dashboardData.activeTimer.ticketCode}
                                            </p>
                                        )}
                                    </div>

                                    <p className="mt-6 font-mono text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                                        {dashboardData?.activeTimer
                                            ? formatTimer(activeTaskSeconds)
                                            : "00:00:00"}
                                    </p>

                                    <p className="mt-2 text-[10px] text-slate-500">
                                        {dashboardData?.activeTimer
                                            ? `Status: ${dashboardData.activeTimer.status}`
                                            : "No active session"}
                                    </p>

                                    <p className="mt-2 text-[10px] text-slate-500">
                                        Session is {" "}
                                        {dashboardData?.activeTimer
                                            ? dashboardData.activeTimer.status === "Paused"
                                                ? "paused"
                                                : "currently running"
                                            : "not running"}
                                    </p>

                                    <div className="mt-6 grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={toggleTimer}
                                            disabled={!dashboardData?.activeTimer}
                                            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
                                        >
                                            {dashboardData?.activeTimer?.status === "Paused" ? (
                                                <>
                                                    <Play size={15} />
                                                    Resume
                                                </>
                                            ) : (
                                                <>
                                                    <Pause size={15} />
                                                    Pause
                                                </>
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={endCurrentSession}
                                            disabled={!dashboardData?.activeTimer}
                                            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                                        >
                                            <Square size={14} />
                                            End Session
                                        </button>


                                    </div>
                                </div>
                            </section>

                            <section className="overflow-hidden rounded-2xl border border-slate-200">
                                <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4">
                                    <h3 className="text-sm font-semibold text-slate-950">
                                        Time Distribution
                                    </h3>

                                    <p className="mt-1 text-[10px] text-slate-500">
                                        Productive work grouped by activity
                                        category
                                    </p>
                                </div>

                                <div className="space-y-5 p-5">
                                    {timeDistribution.map((item) => (
                                        <div key={item.id}>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-800">
                                                        {item.category}
                                                    </p>

                                                    <p className="mt-1 text-[10px] text-slate-500">
                                                        {formatSeconds(
                                                            item.seconds
                                                        )}
                                                    </p>
                                                </div>

                                                <span className="text-xs font-semibold text-slate-600">
                                                    {item.percentage}%
                                                </span>
                                            </div>

                                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className="h-full rounded-full bg-violet-500"
                                                    style={{
                                                        width: `${item.percentage}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        <div className="mt-5 grid gap-5 xl:grid-cols-2">
                            <section className="overflow-hidden rounded-2xl border border-slate-200">
                                <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4">
                                    <h3 className="text-sm font-semibold text-slate-950">
                                        Recent Agent Activity
                                    </h3>

                                    <p className="mt-1 text-[10px] text-slate-500">
                                        Latest application and active-window
                                        records
                                    </p>
                                </div>

                                <div className="divide-y divide-slate-100">
                                   {applicationUsage.slice(0, 5).map((app) => (
                                        <div key={app.applicationName} className="flex items-start gap-3 px-5 py-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                                                <AppWindow size={17} />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-semibold text-slate-900">
                                                        {app.applicationName}
                                                    </p>

                                                    <span className="rounded-full px-2.5 py-1 text-[9px] font-semibold ring-1 ring-inset bg-emerald-50 text-emerald-700 ring-emerald-200">
                                                        Active
                                                    </span>
                                                </div>

                                                <p className="mt-1 truncate text-[10px] text-slate-500">
                                                    {app.lastWindowTitle || app.project || app.client || "Application activity"}
                                                </p>

                                                <p className="mt-2 text-[9px] text-slate-400">
                                                    {app.lastSeen ? new Date(app.lastSeen).toLocaleTimeString() : "Recently active"}
                                                    {" · "}
                                                    {formatSeconds(app.totalSeconds || 0)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="overflow-hidden rounded-2xl border border-slate-200">
                                <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4">
                                    <h3 className="text-sm font-semibold text-slate-950">
                                        Today’s Notes
                                    </h3>

                                    <p className="mt-1 text-[10px] text-slate-500">
                                        Personal work summary and pending
                                        actions
                                    </p>
                                </div>

                                <div className="p-5">
                                    <form
                                        onSubmit={addDailyNote}
                                        className="flex gap-2"
                                    >
                                        <input
                                            value={noteText}
                                            onChange={(event) =>
                                                setNoteText(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Add work note..."
                                            className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        />

                                        <button
                                            type="submit"
                                            className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white"
                                        >
                                            <Save size={14} />
                                            Add
                                        </button>
                                    </form>

                                    <div className="mt-4 space-y-2">
                                        {dailyNotes.map((note) => (
                                            <div
                                                key={note.id}
                                                className="group flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        toggleNote(note.id)
                                                    }
                                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${note.completed
                                                        ? "border-emerald-500 bg-emerald-500 text-white"
                                                        : "border-slate-300 text-transparent"
                                                        }`}
                                                >
                                                    <Check size={12} />
                                                </button>

                                                <p
                                                    className={`flex-1 text-xs ${note.completed
                                                        ? "text-slate-400 line-through"
                                                        : "text-slate-700"
                                                        }`}
                                                >
                                                    {note.text}
                                                </p>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeNote(note.id)
                                                    }
                                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                )}

                {activeTab === "activity" && (
                    <div>
                        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/60 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="relative">
                                <Search
                                    size={15}
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    value={searchValue}
                                    onChange={(event) =>
                                        setSearchValue(event.target.value)
                                    }
                                    placeholder="Search application, window or task..."
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 sm:w-80"
                                />
                            </div>

                            <select
                                value={activityFilter}
                                onChange={(event) =>
                                    setActivityFilter(event.target.value)
                                }
                                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none"
                            >
                                <option>All</option>
                                <option>Productive</option>
                                <option>Neutral</option>
                                <option>Unproductive</option>
                                <option>Active</option>
                                <option>Idle</option>
                            </select>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1200px]">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/80">
                                        <th className="px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            Captured
                                        </th>

                                        <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            Application
                                        </th>

                                        <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            Active Window
                                        </th>

                                        <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            Task / Ticket
                                        </th>

                                        <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            Sessions
                                        </th>

                                        <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            Productivity
                                        </th>

                                        <th className="px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            Status
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {filteredEvents.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-5 py-10 text-center text-xs text-slate-500"
                                            >
                                                {agentEvents.length === 0
                                                    ? "No agent activity recorded yet today."
                                                    : "No agent activity matches the current filters."}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredEvents.map((event) => (
                                            <tr
                                                key={event.id}
                                                className="transition hover:bg-slate-50/70"
                                            >
                                                <td className="px-5 py-4 text-xs font-semibold text-slate-700">
                                                    {event.capturedAt
                                                        ? formatAgentTime(event.capturedAt)
                                                        : "--"}
                                                </td>

                                                <td className="px-4 py-4">
                                                    <p className="text-xs font-semibold text-slate-900">
                                                        {event.applicationName}
                                                    </p>
                                                    <p className="mt-1 text-[10px] text-slate-500">
                                                        {event.category}
                                                    </p>
                                                </td>

                                                <td className="max-w-80 px-4 py-4">
                                                    <p className="truncate text-xs text-slate-700">
                                                        {event.windowTitle || "--"}
                                                    </p>
                                                </td>

                                                <td className="px-4 py-4">
                                                    <p className="text-xs font-semibold text-violet-700">
                                                        {event.taskTitle ||
                                                            event.taskId ||
                                                            "No task assigned"}
                                                    </p>
                                                    {[
                                                        event.taskTitle ? event.taskId : "",
                                                        event.taskStatus,
                                                        event.ticketId,
                                                        event.project,
                                                        event.client,
                                                    ].some(Boolean) ? (
                                                        <p className="mt-1 truncate text-[10px] text-slate-500">
                                                            {[
                                                                event.taskTitle
                                                                    ? event.taskId
                                                                    : "",
                                                                event.taskStatus,
                                                                event.ticketId,
                                                                event.project,
                                                                event.client,
                                                            ]
                                                                .filter(Boolean)
                                                                .join(" / ")}
                                                        </p>
                                                    ) : null}
                                                </td>

                                                <td className="px-4 py-4">
                                                    <span className="text-xs text-slate-700">
                                                        {event.sessionCount} sessions /{" "}
                                                        {formatSeconds(event.durationSeconds)}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${getProductivityClasses(
                                                            event.productivity
                                                        )}`}
                                                    >
                                                        {event.productivity}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${getActivityClasses(
                                                            event.activityStatus
                                                        )}`}
                                                    >
                                                        {event.activityStatus}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === "applications" && (
                    <div className="p-5">
                        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                            <section className="overflow-hidden rounded-2xl border border-slate-200">
                                <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4">
                                    <h3 className="text-sm font-semibold text-slate-950">
                                        Application Usage
                                    </h3>

                                    <p className="mt-1 text-[10px] text-slate-500">
                                        Aggregated from Windows Agent activity
                                    </p>
                                </div>

                            <div className="divide-y divide-slate-100">
    {applicationUsage.map((application, index) => (
        <div
            key={application.applicationName || index}
            className="px-5 py-4"
        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                                                    <AppWindow size={17} />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <div>
                                                            <p className="text-xs font-semibold text-slate-900">
                                                                {
                                                                    application.applicationName
                                                                }
                                                            </p>

                                                            <p className="mt-1 text-[10px] text-slate-500">
                                                                {
                                                                    application.category
                                                                }
                                                            </p>
                                                        </div>

                                                        <div className="text-right">
                                                            <p className="text-xs font-semibold text-slate-900">
                                                                {formatSeconds(
                                                                    application.totalSeconds
                                                                )}
                                                            </p>

                                                            <p className="mt-1 text-[10px] text-slate-400">
                                                                {
                                                                    application.percentage
                                                                }
                                                                %
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                                                        <div
                                                            className="h-full rounded-full bg-blue-500"
                                                            style={{
                                                                width: `${application.percentage}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ring-1 ring-inset ${getProductivityClasses(
                                                        application.productivity
                                                    )}`}
                                                >
                                                    {
                                                        application.productivity
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="rounded-2xl border border-slate-200 p-5">
                                <div className="flex h-52 items-center justify-center">
                                    <div className="relative flex h-44 w-44 items-center justify-center rounded-full bg-[conic-gradient(#7c3aed_var(--score),#e2e8f0_0)]"
                                        style={{
                                            "--score": `${productivityScore}%`,
                                        }}
                                    >
                                        <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white">
                                            <p className="text-3xl font-semibold text-slate-950">
                                                {productivityScore}%
                                            </p>

                                            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                Productivity
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-center">
                                    <p className="text-sm font-semibold text-emerald-800">
                                        Excellent
                                    </p>

                                    <p className="mt-1 text-[10px] text-emerald-600">
                                        +6% compared with yesterday
                                    </p>
                                </div>
                            </section>
                        </div>
                    </div>
                )}

                {activeTab === "sessions" && (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1050px]">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/80">
                                    <th className="px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        Session
                                    </th>

                                    <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        Task
                                    </th>

                                    <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        Application
                                    </th>

                                    <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                      First Seen
                                    </th>

                                    <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        Last Seen
                                    </th>

                                    <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        Duration
                                    </th>

                                    <th className="px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {taskSessions.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                                            No task sessions recorded today.
                                        </td>
                                    </tr>
                                ) : (
                                    taskSessions.map((session) => (
                                        <tr key={session.id} className="transition hover:bg-slate-50/70">
                                      
<td className="px-5 py-4">
    <p className="text-xs font-semibold text-slate-900">
        {session.applicationName || "Unknown"}
    </p>
    <p className="mt-1 text-[10px] text-slate-500 truncate max-w-[280px]">
        {session.lastWindowTitle || "No active window"}
    </p>
</td>

                                            {/* Task */}
                                      
<td className="px-4 py-4">
  {session.taskTitle ? (
    <div className="inline-flex flex-col rounded-xl border border-violet-200 bg-violet-50 px-3 py-2">
      <span className="text-xs font-semibold text-violet-800">
        {session.taskTitle}
      </span>
      {session.taskCode && (
        <span className="text-[10px] text-violet-600 mt-0.5">
          {session.taskCode}
        </span>
      )}
    </div>
  ) : (
    <span className="text-xs text-slate-400">No task assigned</span>
  )}
</td>

                                            {/* Application */}
                                            <td className="px-4 py-4 text-xs text-slate-600">
                                                {session.applicationName || "—"}
                                            </td>

                                            {/* Start */}
                                            <td className="px-4 py-4 text-xs text-slate-700">
                                                {session.startedAt ? formatAgentTime(session.startedAt) : "--"}
                                            </td>

                                            {/* End */}
                                            <td className="px-4 py-4 text-xs text-slate-700">
                                                {session.endedAt ? formatAgentTime(session.endedAt) : "Running"}
                                            </td>

                                            {/* Duration */}
                                            <td className="px-4 py-4 text-xs font-semibold text-slate-900">
                                                {formatSeconds(session.durationSeconds || 0)}
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${session.status === "Running"
                                                            ? "bg-violet-50 text-violet-700 ring-violet-600/10"
                                                            : "bg-emerald-50 text-emerald-700 ring-emerald-600/10"
                                                        }`}
                                                >
                                                    {session.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>

                        </table>
                    </div>
                )}

                {activeTab === "summary" && (
                    <div className="p-5">
                        <div className="grid gap-5 lg:grid-cols-3">
                            <div className="rounded-2xl border border-slate-200 p-5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    Tasks completed
                                </p>
                                <p className="mt-3 text-3xl font-semibold text-slate-950">
                                    {dashboardMetrics?.tasksCompleted ?? 0}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 p-5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    Tickets solved
                                </p>
                                <p className="mt-3 text-3xl font-semibold text-slate-950">
                                    {dashboardMetrics?.ticketsSolved ?? 0}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 p-5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    Support calls
                                </p>
                                <p className="mt-3 text-3xl font-semibold text-slate-950">
                                    {dashboardMetrics?.supportCalls ?? 0}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 rounded-2xl border border-slate-200 p-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                                    <FileText size={18} />
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-slate-950">
                                        End-of-Day Report
                                    </h3>

                                    <p className="mt-1 text-[10px] text-slate-500">
                                        Generated from tasks, tickets,
                                        attendance and agent activity.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                                `{[
  {
    label: "Worked",
    value: formatSeconds(apiSummary?.totalTrackedSeconds || 0),
  },
  {
    label: "Productive",
    value: formatSeconds(
      apiApplications
        .filter((a) => a.productivity === "Productive")
        .reduce((sum, a) => sum + (a.totalSeconds || 0), 0)
    ),
  },
  {
    label: "Idle",
    value: formatSeconds(idleSeconds),
  },
  {
    label: "Productivity",
    value: `${
      (apiSummary?.totalTrackedSeconds || 0) > 0
        ? Math.round(
            (apiApplications
              .filter((a) => a.productivity === "Productive")
              .reduce((sum, a) => sum + (a.totalSeconds || 0), 0) /
              apiSummary.totalTrackedSeconds) * 100
          )
        : 0
    }%`,
  },
  {
    label: "Attendance",
    value: attendanceStatus,
  },
].map((item) => (
  <div
    key={item.label}
    className="rounded-xl bg-slate-50 p-4"
  >
    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
      {item.label}
    </p>

    <p className="mt-2 text-sm font-semibold text-slate-900">
      {item.value}
    </p>
  </div>
))}`
                            </div>
                        </div>

                        <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                            <div className="flex items-start gap-3">
                                <ShieldCheck
                                    size={18}
                                    className="mt-0.5 shrink-0 text-blue-700"
                                />

                                <div>
                                    <p className="text-xs font-semibold text-blue-800">
                                        Privacy and transparency
                                    </p>

                                    <p className="mt-2 text-xs leading-5 text-blue-700">
                                        The employee should be clearly informed
                                        when activity tracking is active.
                                        Passwords, typed content and private
                                        message contents should never be
                                        captured by the Windows Agent.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
