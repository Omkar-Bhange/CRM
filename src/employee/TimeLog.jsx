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
    Loader2,
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

const PRODUCTIVE_CATEGORIES = [
    "Development",
    "Database",
    "Remote Support",
    "Design",
    "Documentation",
    "Office",
    "File Management",
    "Communication",
    "Utility",
];

const UNPRODUCTIVE_CATEGORIES = [
    "Entertainment",
    "Social Media",
    "Games",
];

export function resolveApplicationCategoryAndProductivity(appInput, windowTitleInput, explicitCategory) {
    const app = String(appInput || "").trim().toLowerCase();
    const title = String(windowTitleInput || "").trim().toLowerCase();
    const cat = String(explicitCategory || "").trim();

    // 1. Remote Support tools (UltraViewer, AnyDesk, TeamViewer, RustDesk, RDP, etc.)
    if (
        app.includes("ultraviewer") ||
        app.includes("anydesk") ||
        app.includes("teamviewer") ||
        app.includes("rustdesk") ||
        app.includes("mstsc") ||
        app.includes("remote desktop") ||
        app.includes("zoho assist") ||
        app.includes("supremo") ||
        app.includes("ammyy") ||
        app.includes("vnc") ||
        title.includes("ultraviewer") ||
        title.includes("anydesk") ||
        title.includes("teamviewer") ||
        title.includes("rustdesk")
    ) {
        return { category: "Remote Support", productivity: "Productive" };
    }

    // 2. Database tools (SSMS, SQL Server Management Studio, DBeaver, pgAdmin, MySQL Workbench, etc.)
    if (
        app.includes("ssms") ||
        app.includes("sql server management studio") ||
        app.includes("dbeaver") ||
        app.includes("pgadmin") ||
        app.includes("mysql") ||
        app.includes("navicat") ||
        app.includes("datagrip") ||
        app.includes("heidisql") ||
        app.includes("tableplus") ||
        app.includes("compass") ||
        app.includes("studio 3t") ||
        app.includes("robo 3t") ||
        app.includes("redis") ||
        app.includes("sql") ||
        title.includes("management studio") ||
        title.includes("ssms") ||
        title.includes(".sql") ||
        title.includes("database")
    ) {
        return { category: "Database", productivity: "Productive" };
    }

    // 3. File Explorer / Windows Explorer / File Managers
    if (
        app === "explorer" ||
        app === "explorer.exe" ||
        app.includes("file explorer") ||
        app.includes("windows explorer") ||
        app.includes("total commander") ||
        app.includes("7-zip") ||
        app.includes("winrar") ||
        app.includes("everything") ||
        title.includes("file explorer")
    ) {
        return { category: "File Management", productivity: "Productive" };
    }

    // 4. Code Editors, IDEs & Developer Terminals
    if (
        app.includes("code") ||
        app.includes("visual studio") ||
        app.includes("devenv") ||
        app.includes("cursor") ||
        app.includes("sublime") ||
        app.includes("notepad++") ||
        app.includes("idea") ||
        app.includes("webstorm") ||
        app.includes("pycharm") ||
        app.includes("phpstorm") ||
        app.includes("android studio") ||
        app.includes("eclipse") ||
        app.includes("terminal") ||
        app.includes("powershell") ||
        app.includes("cmd") ||
        app.includes("git") ||
        app.includes("postman") ||
        app.includes("insomnia") ||
        app.includes("docker") ||
        title.includes("visual studio code") ||
        title.includes("cursor")
    ) {
        return { category: "Development", productivity: "Productive" };
    }

    // 5. Office, Documents & Design
    if (
        app.includes("winword") ||
        app.includes("word") ||
        app.includes("excel") ||
        app.includes("powerpnt") ||
        app.includes("powerpoint") ||
        app.includes("onenote") ||
        app.includes("acrobat") ||
        app.includes("pdf") ||
        app.includes("figma") ||
        app.includes("photoshop") ||
        app.includes("illustrator") ||
        app.includes("canva")
    ) {
        return { category: "Office", productivity: "Productive" };
    }

    // 6. Collaboration & Communication
    if (
        app.includes("teams") ||
        app.includes("slack") ||
        app.includes("zoom") ||
        app.includes("skype") ||
        app.includes("meet")
    ) {
        return { category: "Communication", productivity: "Productive" };
    }

    // 7. Entertainment, Social Media & Games (Unproductive)
    if (
        app.includes("netflix") ||
        app.includes("spotify") ||
        app.includes("steam") ||
        app.includes("game") ||
        title.includes("youtube") ||
        title.includes("facebook") ||
        title.includes("instagram") ||
        title.includes("twitter") ||
        title.includes("tiktok") ||
        title.includes("netflix")
    ) {
        return { category: "Entertainment", productivity: "Unproductive" };
    }

    // 8. Explicit category fallback
    if (cat && cat !== "Other" && cat !== "General") {
        const isProd = PRODUCTIVE_CATEGORIES.includes(cat);
        const isUnprod = UNPRODUCTIVE_CATEGORIES.includes(cat);
        return {
            category: cat,
            productivity: isProd ? "Productive" : isUnprod ? "Unproductive" : "Neutral",
        };
    }

    // Default fallback
    return { category: "Office", productivity: "Productive" };
}

function getCategoryColor(category) {
    switch (category) {
        case "Development":
            return "bg-emerald-500";
        case "Database":
            return "bg-cyan-500";
        case "Remote Support":
            return "bg-violet-600";
        case "File Management":
            return "bg-blue-500";
        case "Office":
            return "bg-amber-500";
        case "Design":
            return "bg-pink-500";
        case "Communication":
            return "bg-indigo-500";
        case "Documentation":
            return "bg-teal-500";
        case "Entertainment":
        case "Social Media":
        case "Games":
            return "bg-rose-500";
        default:
            return "bg-slate-400";
    }
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
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs transition hover:border-slate-300">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-500 truncate">
                        {label}
                    </p>

                    <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-slate-900">
                        {value}
                    </p>
                </div>

                <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
                >
                    <Icon size={18} />
                </div>
            </div>

            <p className={`mt-3 truncate text-[11px] font-medium ${descriptionClass}`}>
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
    const [manualTaskId, setManualTaskId] = useState("");
    const [isStartingSession, setIsStartingSession] = useState(false);
    const [isEndingSession, setIsEndingSession] = useState(false);
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

            const key = applicationName.trim().toLowerCase();

            const resolved = resolveApplicationCategoryAndProductivity(
                applicationName,
                app.lastWindowTitle,
                app.category
            );

            if (!applicationMap.has(key)) {
                applicationMap.set(key, {
                    ...app,
                    applicationName,
                    category: resolved.category,
                    productivity: resolved.productivity,
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

                merged.category = resolved.category;
                merged.productivity = resolved.productivity;
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
        const categoryMap = new Map();
        let total = 0;

        for (const app of apiApplications) {
            const resolved = resolveApplicationCategoryAndProductivity(
                app.applicationName || app.application,
                app.lastWindowTitle,
                app.category
            );
            const category = resolved.category || "Office";
            const seconds = Number(app.totalSeconds || 0);
            total += seconds;

            categoryMap.set(category, (categoryMap.get(category) || 0) + seconds);
        }

        return Array.from(categoryMap.entries())
            .map(([category, seconds], index) => ({
                id: index,
                category,
                seconds,
                percentage: total > 0 ? Math.round((seconds / total) * 100) : 0,
            }))
            .sort((a, b) => b.seconds - a.seconds);
    }, [apiApplications]);
    const [idleSessions] = useState(initialIdleSessions);
    const [dailyNotes, setDailyNotes] = useState([]);
    const [isSubmittingNote, setIsSubmittingNote] = useState(false);

    const [noteText, setNoteText] = useState("");
    const [searchValue, setSearchValue] = useState("");
    const [activityFilter, setActivityFilter] = useState("All");


    const fetchTimeLog = async () => {
        try {
            const token =
                localStorage.getItem("client-connect-token") ||
                sessionStorage.getItem("client-connect-token");

            if (!token) return;

            const [timeRes, dashboardRes, sessionsRes, activityRes, notesRes] =
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
                    fetch(`${API_BASE_URL}/api/employee/time-log/notes`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);

            const timeResult = await timeRes.json();
            const dashboardResult = await dashboardRes.json();
            const sessionsResult = await sessionsRes.json();
            const activityResult = await activityRes.json();
            let notesResult = null;
            try {
                notesResult = await notesRes.json();
            } catch {
                notesResult = null;
            }

            if (notesResult && notesResult.success && Array.isArray(notesResult.data)) {
                setDailyNotes(notesResult.data);
            } else if (timeResult?.data?.notes && Array.isArray(timeResult.data.notes)) {
                setDailyNotes(timeResult.data.notes);
            }


            if (sessionsResult.success) {
                setTaskSessions(sessionsResult.data);
            }
            if (activityResult.success) {
                const mappedEvents = (activityResult.data || []).map((log) => {
                    const resolved = resolveApplicationCategoryAndProductivity(
                        log.applicationName || log.application,
                        log.windowTitle || log.lastWindowTitle,
                        log.category
                    );

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
                        category: resolved.category,
                        productivity: resolved.productivity,
                        activityStatus: log.activity || (resolved.productivity === "Unproductive" ? "Idle" : "Active"),
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

    const allTasks = useMemo(() => dashboardData?.tasks || [], [dashboardData?.tasks]);

    const activeTasks = useMemo(
        () => allTasks.filter((t) => !["Completed", "Cancelled", "Closed", "Resolved", "Done"].includes(t.status)),
        [allTasks]
    );

    const completedTasks = useMemo(
        () => allTasks.filter((t) => ["Completed", "Cancelled", "Closed", "Resolved", "Done"].includes(t.status)),
        [allTasks]
    );

    const activeTask = dashboardData?.activeTimer || null;

    const currentSelectedTask = useMemo(() => {
        if (dashboardData?.activeTimer) {
            return dashboardData.activeTimer;
        }
        if (manualTaskId) {
            const found = allTasks.find((t) => String(t._id) === String(manualTaskId));
            if (found) return found;
        }
        return activeTasks[0] || null;
    }, [dashboardData?.activeTimer, manualTaskId, allTasks, activeTasks]);

    const totalTrackedSeconds =
        apiSummary?.totalTrackedSeconds || 0;

    const productiveSeconds = useMemo(() => {
        return apiApplications.reduce((sum, app) => {
            const resolved = resolveApplicationCategoryAndProductivity(
                app.applicationName || app.application,
                app.lastWindowTitle,
                app.category
            );
            return resolved.productivity === "Productive"
                ? sum + Number(app.totalSeconds || 0)
                : sum;
        }, 0);
    }, [apiApplications]);

    const selectedTask =
        tasks.find((task) => task.id === selectedTaskId) || tasks[0] || {
            id: "",
            title: "No active task",
            client: "",
            ticketId: "",
            description: "",
        };

    const unproductiveSeconds = useMemo(() => {
        return apiApplications.reduce((sum, app) => {
            const resolved = resolveApplicationCategoryAndProductivity(
                app.applicationName || app.application,
                app.lastWindowTitle,
                app.category
            );
            return resolved.productivity === "Unproductive"
                ? sum + Number(app.totalSeconds || 0)
                : sum;
        }, 0);
    }, [apiApplications]);

    // Real idle time from agent data
    const idleSeconds = useMemo(() => {
        return Math.max(
            totalTrackedSeconds - productiveSeconds - unproductiveSeconds,
            0
        );
    }, [totalTrackedSeconds, productiveSeconds, unproductiveSeconds]);

    // Real productivity score
    const productivityScore = useMemo(() => {
        return totalTrackedSeconds > 0
            ? Math.round((productiveSeconds / totalTrackedSeconds) * 100)
            : 0;
    }, [totalTrackedSeconds, productiveSeconds]);

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
        if (!dashboardData?.activeTimer || isEndingSession) return;

        const taskIdentifier =
            dashboardData.activeTimer.taskCode || dashboardData.activeTimer.title || "active task";
        const confirmed = window.confirm(
            `End the active work session for ${taskIdentifier}?`
        );

        if (!confirmed) return;

        setIsEndingSession(true);
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
                setManualTaskId("");
                await fetchTimeLog();
            } else {
                alert(result.message || "Failed to end session");
            }
        } catch (error) {
            console.error("Failed to end session:", error);
            alert("Failed to end session");
        } finally {
            setIsEndingSession(false);
        }
    };

    const startSession = async (taskIdToRun) => {
        if (isStartingSession) return;

        const idToStart = taskIdToRun || manualTaskId || activeTasks[0]?._id;
        if (!idToStart) {
            alert("Please select a task to start tracking.");
            return;
        }

        const taskObj = allTasks.find((t) => String(t._id) === String(idToStart));
        if (taskObj && ["Completed", "Cancelled", "Closed"].includes(taskObj.status)) {
            const confirmReopen = window.confirm(
                `Task "${taskObj.taskCode || ""} ${taskObj.title}" is currently marked as ${taskObj.status}. Do you want to reopen it and start work?`
            );
            if (!confirmReopen) return;
        }

        setIsStartingSession(true);
        const token =
            localStorage.getItem("client-connect-token") ||
            sessionStorage.getItem("client-connect-token");

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/employee/tasks/${idToStart}/start`,
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
                setManualTaskId("");
                await fetchTimeLog();
            } else {
                alert(result.message || "Unable to start session");
            }
        } catch (error) {
            console.error("Failed to start session:", error);
            alert("Failed to start session");
        } finally {
            setIsStartingSession(false);
        }
    };

    const changeTask = async (event) => {
        const nextTaskId = event.target.value;
        setManualTaskId(nextTaskId);
        if (!nextTaskId) return;

        if (dashboardData?.activeTimer) {
            const taskObj = allTasks.find((t) => String(t._id) === String(nextTaskId));
            if (taskObj && ["Completed", "Cancelled", "Closed"].includes(taskObj.status)) {
                const confirmReopen = window.confirm(
                    `Task "${taskObj.taskCode || ""} ${taskObj.title}" is currently marked as ${taskObj.status}. Do you want to reopen it and switch your timer?`
                );
                if (!confirmReopen) {
                    setManualTaskId(dashboardData.activeTimer._id);
                    return;
                }
            }

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
                    setManualTaskId("");
                    await fetchTimeLog();
                } else {
                    alert(result.message || "Unable to switch task");
                }
            } catch (error) {
                console.error("Failed to switch task:", error);
                alert("Failed to switch task");
            }
        }
    };

    const addDailyNote = async (event) => {
        event.preventDefault();

        const trimmedText = noteText.trim();
        if (!trimmedText || isSubmittingNote) return;

        try {
            setIsSubmittingNote(true);
            const token =
                localStorage.getItem("client-connect-token") ||
                sessionStorage.getItem("client-connect-token");

            if (!token) {
                alert("Authentication session expired. Please log in again.");
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/employee/time-log/notes`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ text: trimmedText }),
            });

            const result = await response.json();
            if (result.success && result.data) {
                setDailyNotes((current) => [...current, result.data]);
                setNoteText("");
            } else {
                alert(result.message || "Unable to save work note.");
            }
        } catch (error) {
            console.error("Failed to add daily note:", error);
            alert("Failed to save note to server.");
        } finally {
            setIsSubmittingNote(false);
        }
    };

    const toggleNote = async (noteId) => {
        const targetNote = dailyNotes.find(
            (note) => String(note.id || note._id) === String(noteId)
        );
        if (!targetNote) return;

        const nextCompletedState = !targetNote.completed;

        // Optimistic UI Update
        setDailyNotes((current) =>
            current.map((note) =>
                String(note.id || note._id) === String(noteId)
                    ? { ...note, completed: nextCompletedState }
                    : note
            )
        );

        try {
            const token =
                localStorage.getItem("client-connect-token") ||
                sessionStorage.getItem("client-connect-token");

            if (!token) return;

            const response = await fetch(
                `${API_BASE_URL}/api/employee/time-log/notes/${noteId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ completed: nextCompletedState }),
                }
            );

            const result = await response.json();
            if (!result.success) {
                // Rollback on failure
                setDailyNotes((current) =>
                    current.map((note) =>
                        String(note.id || note._id) === String(noteId)
                            ? { ...note, completed: !nextCompletedState }
                            : note
                    )
                );
                alert(result.message || "Failed to update note status.");
            }
        } catch (error) {
            console.error("Failed to toggle note status:", error);
            // Rollback on error
            setDailyNotes((current) =>
                current.map((note) =>
                    String(note.id || note._id) === String(noteId)
                        ? { ...note, completed: !nextCompletedState }
                        : note
                )
            );
        }
    };

    const removeNote = async (noteId) => {
        const previousNotes = [...dailyNotes];

        // Optimistic UI removal
        setDailyNotes((current) =>
            current.filter((note) => String(note.id || note._id) !== String(noteId))
        );

        try {
            const token =
                localStorage.getItem("client-connect-token") ||
                sessionStorage.getItem("client-connect-token");

            if (!token) return;

            const response = await fetch(
                `${API_BASE_URL}/api/employee/time-log/notes/${noteId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const result = await response.json();
            if (!result.success) {
                setDailyNotes(previousNotes);
                alert(result.message || "Failed to delete note.");
            }
        } catch (error) {
            console.error("Failed to delete daily note:", error);
            setDailyNotes(previousNotes);
            alert("Failed to delete note from server.");
        }
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
                    value={`${productivityScore}%`}
                    description="Calculated from agent activity"
                    icon={BarChart3}
                    iconClass="bg-cyan-100 text-cyan-700"
                    descriptionClass="text-cyan-700"
                />
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 scrollbar-none max-w-full">
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
                            <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                                <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
                                    <div className="flex items-center gap-2 text-violet-700">
                                        <Timer size={15} />
                                        <p className="text-[11px] font-semibold uppercase tracking-wider">
                                            Active Task Session
                                        </p>
                                    </div>
                                </div>

                                <div className="p-5">
                                    <div>
                                        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                            Current Task
                                        </label>

                                        <div className="relative">
                                            <select
                                                value={dashboardData?.activeTimer?._id || manualTaskId || (activeTasks[0]?._id || "")}
                                                onChange={changeTask}
                                                disabled={isStartingSession || isEndingSession}
                                                className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-10 text-xs font-medium text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 disabled:bg-slate-50 disabled:cursor-not-allowed"
                                            >
                                                {allTasks.length === 0 ? (
                                                    <option value="">No tasks assigned</option>
                                                ) : (
                                                    <>
                                                        <option value="">— Select an Active Task to Start —</option>
                                                        {activeTasks.length > 0 && (
                                                            <optgroup label="Active Tasks">
                                                                {activeTasks.map((task) => (
                                                                    <option key={task._id} value={task._id}>
                                                                        {task.taskCode || "TSK"} — {task.title} {task.status ? `(${task.status})` : ""}
                                                                    </option>
                                                                ))}
                                                            </optgroup>
                                                        )}
                                                        {completedTasks.length > 0 && (
                                                            <optgroup label="Completed Tasks (Will Reopen on Start)">
                                                                {completedTasks.map((task) => (
                                                                    <option key={task._id} value={task._id}>
                                                                        {task.taskCode || "TSK"} — {task.title} ({task.status})
                                                                    </option>
                                                                ))}
                                                            </optgroup>
                                                        )}
                                                    </>
                                                )}
                                            </select>

                                            <ChevronDown
                                                size={15}
                                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-xs font-semibold text-slate-900 line-clamp-1">
                                                {currentSelectedTask ? (
                                                    <>
                                                        {currentSelectedTask.taskCode ? `${currentSelectedTask.taskCode} — ` : ""}
                                                        {currentSelectedTask.title}
                                                    </>
                                                ) : (
                                                    "No active task selected"
                                                )}
                                            </p>
                                            {currentSelectedTask?.status && (
                                                <span
                                                    className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ring-1 ring-inset ${
                                                        currentSelectedTask.status === "In Progress"
                                                            ? "bg-violet-50 text-violet-700 ring-violet-600/20"
                                                            : currentSelectedTask.status === "Paused"
                                                            ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                                                            : currentSelectedTask.status === "Completed"
                                                            ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                                                            : "bg-slate-100 text-slate-600 ring-slate-400/20"
                                                    }`}
                                                >
                                                    {currentSelectedTask.status}
                                                </span>
                                            )}
                                        </div>

                                        <p className="mt-1 text-[11px] text-slate-500">
                                            {currentSelectedTask?.clientName || "Internal"}
                                            {" · "}
                                            {currentSelectedTask?.project || "General"}
                                        </p>

                                        {currentSelectedTask?.ticketCode && (
                                            <p className="mt-2 text-[10px] font-semibold text-violet-600">
                                                Related ticket: {currentSelectedTask.ticketCode}
                                            </p>
                                        )}
                                    </div>

                                    <div className="mt-5">
                                        <p className="font-mono text-3xl font-semibold tracking-tight text-slate-950">
                                            {dashboardData?.activeTimer
                                                ? formatTimer(activeTaskSeconds)
                                                : formatTimer(currentSelectedTask?.elapsedSeconds || 0)}
                                        </p>

                                        <div className="mt-1.5 flex items-center gap-2">
                                            <span
                                                className={`h-2 w-2 rounded-full ${
                                                    dashboardData?.activeTimer
                                                        ? dashboardData.activeTimer.status === "Paused"
                                                            ? "bg-amber-500"
                                                            : "bg-emerald-500 animate-pulse"
                                                        : "bg-slate-300"
                                                }`}
                                            />
                                            <span className="text-[11px] font-medium text-slate-500">
                                                {dashboardData?.activeTimer
                                                    ? `Session is ${dashboardData.activeTimer.status === "Paused" ? "paused" : "running"}`
                                                    : currentSelectedTask
                                                    ? `Ready to track · ${currentSelectedTask.status || "Idle"}`
                                                    : "No active session"}
                                            </span>
                                        </div>
                                    </div>

                                    {dashboardData?.activeTimer ? (
                                        <div className="mt-5 grid grid-cols-2 gap-2.5">
                                            <button
                                                type="button"
                                                onClick={toggleTimer}
                                                disabled={isEndingSession}
                                                className={`flex h-10 items-center justify-center gap-2 rounded-lg text-xs font-semibold transition ${
                                                    dashboardData.activeTimer.status === "Paused"
                                                        ? "bg-violet-600 text-white hover:bg-violet-700"
                                                        : "bg-amber-500 text-white hover:bg-amber-600"
                                                } disabled:opacity-50`}
                                            >
                                                {dashboardData.activeTimer.status === "Paused" ? (
                                                    <>
                                                        <Play size={14} />
                                                        Resume
                                                    </>
                                                ) : (
                                                    <>
                                                        <Pause size={14} />
                                                        Pause
                                                    </>
                                                )}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={endCurrentSession}
                                                disabled={isEndingSession}
                                                className="flex h-10 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                                            >
                                                {isEndingSession ? (
                                                    <>
                                                        <Loader2 size={13} className="animate-spin" />
                                                        Ending...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Square size={13} />
                                                        End Session
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="mt-5">
                                            <button
                                                type="button"
                                                onClick={() => startSession()}
                                                disabled={isStartingSession || !currentSelectedTask}
                                                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-violet-600 text-xs font-semibold text-white shadow-xs transition hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isStartingSession ? (
                                                    <>
                                                        <Loader2 size={14} className="animate-spin" />
                                                        Starting Session...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Play size={14} />
                                                        {currentSelectedTask && ["Completed", "Cancelled", "Closed"].includes(currentSelectedTask.status)
                                                            ? "Reopen & Start Task"
                                                            : "Start Session"}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                                <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
                                    <h3 className="text-sm font-semibold text-slate-950">
                                        Time Distribution
                                    </h3>

                                    <p className="mt-0.5 text-[10px] text-slate-500">
                                        Productive work grouped by activity category
                                    </p>
                                </div>

                                <div className="space-y-4 p-5">
                                    {timeDistribution.length === 0 ? (
                                        <p className="py-6 text-center text-xs text-slate-400">
                                            No activity records recorded today.
                                        </p>
                                    ) : (
                                        timeDistribution.map((item) => (
                                            <div key={item.id} className="group">
                                                <div className="flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`h-2 w-2 rounded-full ${getCategoryColor(item.category)}`} />
                                                        <span className="font-medium text-slate-800">
                                                            {item.category}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2.5">
                                                        <span className="text-[11px] text-slate-400">
                                                            {formatSeconds(item.seconds)}
                                                        </span>
                                                        <span className="w-8 text-right text-xs font-semibold text-slate-700">
                                                            {item.percentage}%
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                                    <div
                                                        className={`h-full rounded-full ${getCategoryColor(item.category)} transition-all duration-300`}
                                                        style={{
                                                            width: `${item.percentage}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    )}
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
                                            disabled={isSubmittingNote}
                                            placeholder="Add work note..."
                                            className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-50"
                                        />

                                        <button
                                            type="submit"
                                            disabled={isSubmittingNote || !noteText.trim()}
                                            className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSubmittingNote ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <Save size={14} />
                                            )}
                                            <span>{isSubmittingNote ? "Saving..." : "Add"}</span>
                                        </button>
                                    </form>

                                    <div className="mt-4 space-y-2">
                                        {dailyNotes.length === 0 ? (
                                            <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center">
                                                <FileText className="mx-auto h-5 w-5 text-slate-300" />
                                                <p className="mt-1.5 text-xs font-medium text-slate-600">No notes added for today yet</p>
                                                <p className="text-[10px] text-slate-400">Add work notes or reminders above</p>
                                            </div>
                                        ) : (
                                            dailyNotes.map((note) => {
                                                const noteIdentifier = note._id || note.id;
                                                return (
                                                    <div
                                                        key={noteIdentifier}
                                                        className="group flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 transition hover:border-slate-300 hover:shadow-xs"
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                toggleNote(noteIdentifier)
                                                            }
                                                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${note.completed
                                                                ? "border-emerald-500 bg-emerald-500 text-white"
                                                                : "border-slate-300 text-transparent hover:border-violet-400"
                                                                }`}
                                                        >
                                                            <Check size={12} />
                                                        </button>

                                                        <p
                                                            className={`flex-1 text-xs transition ${note.completed
                                                                ? "text-slate-400 line-through"
                                                                : "text-slate-700"
                                                                }`}
                                                        >
                                                            {note.text}
                                                        </p>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeNote(noteIdentifier)
                                                            }
                                                            title="Delete note"
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                );
                                            })
                                        )}
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
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                                                <AppWindow size={17} />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`h-2 w-2 rounded-full ${getCategoryColor(application.category)}`} />
                                                            <p className="text-xs font-semibold text-slate-900">
                                                                {application.applicationName}
                                                            </p>
                                                        </div>

                                                        <p className="mt-1 text-[10px] text-slate-500">
                                                            {application.category}
                                                            {application.lastWindowTitle ? ` · ${application.lastWindowTitle}` : ""}
                                                        </p>
                                                    </div>

                                                    <div className="text-right">
                                                        <p className="text-xs font-semibold text-slate-900">
                                                            {formatSeconds(application.totalSeconds)}
                                                        </p>

                                                        <p className="mt-1 text-[10px] text-slate-400">
                                                            {application.percentage}%
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                                                    <div
                                                        className={`h-full rounded-full ${getCategoryColor(application.category)} transition-all duration-300`}
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
                                                {application.productivity}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-2xl border border-slate-200 p-5">
                            <div className="flex h-52 items-center justify-center">
                                <div
                                    className="relative flex h-44 w-44 items-center justify-center rounded-full bg-[conic-gradient(#7c3aed_var(--score),#e2e8f0_0)]"
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
                                    {productivityScore >= 75 ? "Excellent" : productivityScore >= 50 ? "Good" : "Needs Attention"}
                                </p>

                                <p className="mt-1 text-[10px] text-emerald-600">
                                    {productivityScore}% productive time recorded today
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
                                {[
                                    {
                                        label: "Worked",
                                        value: formatSeconds(totalTrackedSeconds),
                                    },
                                    {
                                        label: "Productive",
                                        value: formatSeconds(productiveSeconds),
                                    },
                                    {
                                        label: "Idle",
                                        value: formatSeconds(idleSeconds),
                                    },
                                    {
                                        label: "Productivity",
                                        value: `${productivityScore}%`,
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
                                ))}
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
