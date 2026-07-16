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
    const [agentEvents, setAgentEvents] = useState(initialAgentEvents);
    const [applicationUsage] = useState(initialApplicationUsage);
    const [timeDistribution] = useState(initialTimeDistribution);
    const [idleSessions] = useState(initialIdleSessions);
    const [dailyNotes, setDailyNotes] = useState(initialDailyNotes);

    const [selectedTaskId, setSelectedTaskId] = useState("TSK-2084");
    const [timerRunning, setTimerRunning] = useState(true);
    const [currentSessionSeconds, setCurrentSessionSeconds] =
        useState(12240);

    const [noteText, setNoteText] = useState("");
    const [searchValue, setSearchValue] = useState("");
    const [activityFilter, setActivityFilter] = useState("All");

    useEffect(() => {
        if (!timerRunning) return undefined;

        const intervalId = window.setInterval(() => {
            setCurrentSessionSeconds((current) => current + 1);
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, [timerRunning]);

    const selectedTask =
        tasks.find((task) => task.id === selectedTaskId) || tasks[0];

    const totalTrackedSeconds = useMemo(
        () =>
            sessions.reduce(
                (total, session) =>
                    total + Number(session.durationSeconds || 0),
                0
            ) + currentSessionSeconds,
        [sessions, currentSessionSeconds]
    );

    const productiveSeconds = useMemo(
        () =>
            applicationUsage
                .filter(
                    (application) =>
                        application.productivity === "Productive"
                )
                .reduce(
                    (total, application) =>
                        total + application.totalSeconds,
                    0
                ),
        [applicationUsage]
    );

    const unproductiveSeconds = useMemo(
        () =>
            applicationUsage
                .filter(
                    (application) =>
                        application.productivity === "Unproductive"
                )
                .reduce(
                    (total, application) =>
                        total + application.totalSeconds,
                    0
                ),
        [applicationUsage]
    );

    const idleSeconds = useMemo(
        () =>
            idleSessions.reduce(
                (total, session) =>
                    total + Number(session.durationSeconds || 0),
                0
            ),
        [idleSessions]
    );

    const productivityScore = useMemo(() => {
        const consideredTime =
            productiveSeconds + unproductiveSeconds + idleSeconds;

        if (consideredTime <= 0) return 0;

        return Math.round(
            (productiveSeconds / consideredTime) * 100
        );
    }, [productiveSeconds, unproductiveSeconds, idleSeconds]);

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

    const toggleTimer = () => {
        setTimerRunning((current) => !current);
    };

    const endCurrentSession = () => {
        if (!selectedTask || currentSessionSeconds <= 0) return;

        const confirmed = window.confirm(
            `End the active session for ${selectedTask.id}?`
        );

        if (!confirmed) return;

        const now = new Date();

        setSessions((current) => [
            ...current.map((session) =>
                session.status === "Running"
                    ? {
                          ...session,
                          status: "Completed",
                          endedAt: now.toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                          }),
                          durationSeconds:
                              Number(session.durationSeconds || 0) +
                              currentSessionSeconds,
                      }
                    : session
            ),
        ]);

        setTimerRunning(false);
        setCurrentSessionSeconds(0);
    };

    const changeTask = (event) => {
        const nextTaskId = event.target.value;

        if (
            timerRunning &&
            currentSessionSeconds > 0 &&
            nextTaskId !== selectedTaskId
        ) {
            const confirmed = window.confirm(
                "Pause the current timer and switch to another task?"
            );

            if (!confirmed) return;

            setTimerRunning(false);
        }

        setSelectedTaskId(nextTaskId);
        setCurrentSessionSeconds(0);
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
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                        agentStatus.connected
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-rose-200 bg-rose-50"
                    }`}
                >
                    <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                            agentStatus.connected
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-700"
                        }`}
                    >
                        <Laptop size={17} />
                    </div>

                    <div>
                        <p
                            className={`text-[10px] font-semibold ${
                                agentStatus.connected
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
                        onClick={simulateAgentSync}
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
                                className={`whitespace-nowrap rounded-lg px-4 py-2 text-[11px] font-semibold transition ${
                                    activeTab === tab.id
                                        ? "bg-white text-slate-950 shadow-sm"
                                        : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <span className="text-[10px] text-slate-400">
                        Data date: {DEMO_DATE}
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
                                                value={selectedTaskId}
                                                onChange={changeTask}
                                                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-10 text-xs font-semibold text-slate-800 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            >
                                                {tasks.map((task) => (
                                                    <option
                                                        key={task.id}
                                                        value={task.id}
                                                    >
                                                        {task.id} —{" "}
                                                        {task.title}
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
                                            {selectedTask.title}
                                        </p>

                                        <p className="mt-1 text-[10px] text-slate-500">
                                            {selectedTask.client} ·{" "}
                                            {selectedTask.project}
                                        </p>

                                        {selectedTask.ticketId && (
                                            <p className="mt-2 text-[10px] font-semibold text-blue-600">
                                                Related ticket:{" "}
                                                {selectedTask.ticketId}
                                            </p>
                                        )}
                                    </div>

                                    <p className="mt-6 font-mono text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                                        {formatTimer(
                                            currentSessionSeconds
                                        )}
                                    </p>

                                    <p className="mt-2 text-[10px] text-slate-500">
                                        Session is{" "}
                                        {timerRunning
                                            ? "currently running"
                                            : "paused"}
                                    </p>

                                    <div className="mt-6 grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={toggleTimer}
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
                                            onClick={endCurrentSession}
                                            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
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
                                    {agentEvents
                                        .slice(0, 5)
                                        .map((event) => (
                                            <div
                                                key={event.id}
                                                className="flex items-start gap-3 px-5 py-4"
                                            >
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                                                    <AppWindow size={17} />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <p className="text-xs font-semibold text-slate-900">
                                                            {
                                                                event.applicationName
                                                            }
                                                        </p>

                                                        <span
                                                            className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ring-1 ring-inset ${getActivityClasses(
                                                                event.activityStatus
                                                            )}`}
                                                        >
                                                            {
                                                                event.activityStatus
                                                            }
                                                        </span>
                                                    </div>

                                                    <p className="mt-1 truncate text-[10px] text-slate-500">
                                                        {event.windowTitle}
                                                    </p>

                                                    <p className="mt-2 text-[9px] text-slate-400">
                                                        {formatAgentTime(
                                                            event.capturedAt
                                                        )}{" "}
                                                        ·{" "}
                                                        {event.keyboardEvents}{" "}
                                                        keys ·{" "}
                                                        {event.mouseEvents}{" "}
                                                        mouse events
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
                                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                                        note.completed
                                                            ? "border-emerald-500 bg-emerald-500 text-white"
                                                            : "border-slate-300 text-transparent"
                                                    }`}
                                                >
                                                    <Check size={12} />
                                                </button>

                                                <p
                                                    className={`flex-1 text-xs ${
                                                        note.completed
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
                                            Input Activity
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
                                    {filteredEvents.map((event) => (
                                        <tr
                                            key={event.id}
                                            className="transition hover:bg-slate-50/70"
                                        >
                                            <td className="px-5 py-4 text-xs font-semibold text-slate-700">
                                                {formatAgentTime(
                                                    event.capturedAt
                                                )}
                                            </td>

                                            <td className="px-4 py-4">
                                                <p className="text-xs font-semibold text-slate-900">
                                                    {
                                                        event.applicationName
                                                    }
                                                </p>

                                                <p className="mt-1 text-[10px] text-slate-500">
                                                    {event.processName} ·{" "}
                                                    {event.category}
                                                </p>
                                            </td>

                                            <td className="max-w-80 px-4 py-4">
                                                <p className="truncate text-xs text-slate-700">
                                                    {event.windowTitle}
                                                </p>
                                            </td>

                                            <td className="px-4 py-4">
                                                <p className="text-xs font-semibold text-violet-700">
                                                    {event.taskId || "—"}
                                                </p>

                                                <p className="mt-1 text-[10px] text-blue-600">
                                                    {event.ticketId || ""}
                                                </p>
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                                                        <Keyboard size={14} />
                                                        {
                                                            event.keyboardEvents
                                                        }
                                                    </div>

                                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                                                        <MousePointer2
                                                            size={14}
                                                        />
                                                        {
                                                            event.mouseEvents
                                                        }
                                                    </div>
                                                </div>
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
                                                    {
                                                        event.activityStatus
                                                    }
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
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
                                    {applicationUsage.map((application) => (
                                        <div
                                            key={application.id}
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
                                        Start
                                    </th>

                                    <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        End
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
                                {sessions.map((session) => (
                                    <tr
                                        key={session.id}
                                        className="transition hover:bg-slate-50/70"
                                    >
                                        <td className="px-5 py-4">
                                            <p className="text-xs font-semibold text-slate-900">
                                                {session.title}
                                            </p>

                                            <p className="mt-1 text-[10px] text-slate-500">
                                                {session.description}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4 text-xs font-semibold text-violet-700">
                                            {session.taskId || "—"}
                                        </td>

                                        <td className="px-4 py-4 text-xs text-slate-600">
                                            {session.applicationName || "—"}
                                        </td>

                                        <td className="px-4 py-4 text-xs text-slate-700">
                                            {session.startedAt}
                                        </td>

                                        <td className="px-4 py-4 text-xs text-slate-700">
                                            {session.endedAt || "Running"}
                                        </td>

                                        <td className="px-4 py-4 text-xs font-semibold text-slate-900">
                                            {session.status === "Running"
                                                ? formatSeconds(
                                                      session.durationSeconds +
                                                          currentSessionSeconds
                                                  )
                                                : formatSeconds(
                                                      session.durationSeconds
                                                  )}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${
                                                    session.status ===
                                                    "Running"
                                                        ? "bg-violet-50 text-violet-700 ring-violet-600/10"
                                                        : "bg-emerald-50 text-emerald-700 ring-emerald-600/10"
                                                }`}
                                            >
                                                {session.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === "summary" && (
                    <div className="p-5">
                        <div className="grid gap-5 lg:grid-cols-3">
                            <div className="rounded-2xl border border-slate-200 p-5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    Tasks Completed
                                </p>

                                <p className="mt-3 text-3xl font-semibold text-slate-950">
                                    3
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 p-5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    Tickets Solved
                                </p>

                                <p className="mt-3 text-3xl font-semibold text-slate-950">
                                    2
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 p-5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    Support Calls
                                </p>

                                <p className="mt-3 text-3xl font-semibold text-slate-950">
                                    4
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
                                        value: formatSeconds(
                                            totalTrackedSeconds
                                        ),
                                    },
                                    {
                                        label: "Productive",
                                        value: formatSeconds(
                                            productiveSeconds
                                        ),
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
                                        value: "Present",
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