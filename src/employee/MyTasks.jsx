import { useEffect, useMemo, useRef, useState } from "react";
import {
    AlertCircle,
    ArrowLeft,
    BriefcaseBusiness,
    CalendarDays,
    Check,
    CheckCircle2,
    ChevronDown,
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
} from "lucide-react";

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
    return new Date().toISOString().slice(0, 10);
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
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {label}
                    </p>

                    <p className="mt-2 text-2xl font-semibold text-slate-950">
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

export default function MyTasks() {
    const fileInputRef = useRef(null);
    const API_URL = "http://localhost:5000";
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
    const updateTaskStatus = async (taskId, status, progress) => {
        const response = await fetch(`${API_URL}/api/admin/task/${taskId}/status`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${getAuthToken()}`, "Content-Type": "application/json" },
            body: JSON.stringify({ status, progress }),
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Unable to update task.");
        await loadTasksDashboard();
    };

    const [tasks, setTasks] = useState([]);
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [detailsTab, setDetailsTab] = useState("overview");

    const [searchValue, setSearchValue] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [dueFilter, setDueFilter] = useState("All");
    const [filtersOpen, setFiltersOpen] = useState(false);

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

            const matchesStatus =
                statusFilter === "All" ||
                task.status === statusFilter;

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
    const inProgressCount = summary.inProgress;
    const dueTodayCount = summary.dueToday;
    const overdueCount = summary.overdue;
    const completedCount = summary.completed;

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

        try { await updateTaskStatus(selectedTask.id, nextStatus, nextStatus === "Completed" ? 100 : selectedTask.progress); } catch (error) { alert(error.message); }
    };

    const handleProgressChange = async (event) => {
        if (!selectedTask) return;

        const progress = Math.min(
            Math.max(Number(event.target.value || 0), 0),
            100
        );

        try { await updateTaskStatus(selectedTask.id, progress === 100 ? "Completed" : selectedTask.status, progress); } catch (error) { alert(error.message); }
    };

    const toggleChecklistItem = (itemId) => {
        setChecklists((current) =>
            current.map((item) =>
                item.id === itemId
                    ? {
                          ...item,
                          completed: !item.completed,
                      }
                    : item
            )
        );
    };

    const addChecklistItem = (event) => {
        event.preventDefault();

        if (!selectedTask || !checklistText.trim()) return;

        setChecklists((current) => [
            ...current,
            {
                id: Date.now(),
                taskId: selectedTask.id,
                title: checklistText.trim(),
                completed: false,
            },
        ]);

        addTimelineEntry(
            selectedTask.id,
            "created",
            "Checklist item added",
            checklistText.trim()
        );

        setChecklistText("");
    };

    const deleteChecklistItem = (itemId) => {
        setChecklists((current) =>
            current.filter((item) => item.id !== itemId)
        );
    };

    const addComment = (event) => {
        event.preventDefault();

        if (!selectedTask || !commentText.trim()) return;

        const newComment = {
            id: Date.now(),
            taskId: selectedTask.id,
            user: "Akash Pawar",
            initials: "AP",
            message: commentText.trim(),
            createdAt: new Date().toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }),
        };

        setComments((current) => [...current, newComment]);

        addTimelineEntry(
            selectedTask.id,
            "comment",
            "Comment added",
            newComment.message
        );

        setCommentText("");
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

    const uploadSelectedFile = () => {
        if (!selectedTask || !selectedFile) return;

        const uploadedFile = {
            id: Date.now(),
            taskId: selectedTask.id,
            name: selectedFile.name,
            type: selectedFile.type,
            size: selectedFile.size,
            uploadedBy: "Akash Pawar",
            uploadedAt: new Date().toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }),
        };

        setFiles((current) => [
            uploadedFile,
            ...current,
        ]);

        addTimelineEntry(
            selectedTask.id,
            "file",
            "File uploaded",
            uploadedFile.name
        );

        setSelectedFile(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
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

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-950">
                            Assigned Tasks
                        </h3>

                        <p className="mt-1 text-[10px] text-slate-500">
                            {filteredTasks.length} task
                            {filteredTasks.length !== 1 ? "s" : ""}{" "}
                            found
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
                                    setSearchValue(
                                        event.target.value
                                    )
                                }
                                placeholder="Search task, client, project..."
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 sm:w-72"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setFiltersOpen(
                                    (current) => !current
                                )
                            }
                            className={`flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-semibold transition ${
                                filtersOpen ||
                                statusFilter !== "All" ||
                                priorityFilter !== "All" ||
                                dueFilter !== "All"
                                    ? "border-violet-200 bg-violet-50 text-violet-700"
                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                            <Filter size={15} />
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

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1180px]">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/80">
                                <th className="px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    Task
                                </th>

                                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    Client / Project
                                </th>

                                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    Priority
                                </th>

                                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    Status
                                </th>

                                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    Due Date
                                </th>

                                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    Progress
                                </th>

                                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    Time
                                </th>

                                <th className="px-5 py-3 text-right text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {filteredTasks.map((task) => {
                                const overdue =
                                    isTaskOverdue(task);

                                const dueToday =
                                    isTaskDueToday(task);

                                const taskIsActive =
                                    activeTaskId === task.id;

                                return (
                                    <tr
                                        key={task.id}
                                        className={`transition hover:bg-slate-50/70 ${
                                            overdue
                                                ? "bg-rose-50/30"
                                                : ""
                                        }`}
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-start gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        startTask(task)
                                                    }
                                                    disabled={[
                                                        "Completed",
                                                        "Resolved",
                                                    ].includes(
                                                        task.status
                                                    )}
                                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                                                        taskIsActive
                                                            ? "bg-violet-600 text-white"
                                                            : "bg-violet-50 text-violet-700 hover:bg-violet-100"
                                                    } disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-300`}
                                                >
                                                    {taskIsActive &&
                                                    timerRunning ? (
                                                        <Pause
                                                            size={
                                                                15
                                                            }
                                                        />
                                                    ) : (
                                                        <Play
                                                            size={
                                                                15
                                                            }
                                                        />
                                                    )}
                                                </button>

                                                <div className="min-w-0">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openTaskDetails(
                                                                task
                                                            )
                                                        }
                                                        className="block max-w-72 truncate text-left text-xs font-semibold text-slate-900 hover:text-violet-700"
                                                    >
                                                        {task.title}
                                                    </button>

                                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                                        <span className="text-[10px] font-semibold text-violet-600">
                                                            {
                                                                task.taskNo
                                                            }
                                                        </span>

                                                        {task.ticketNo && (
                                                            <>
                                                                <span className="text-slate-300">
                                                                    ·
                                                                </span>

                                                                <span className="text-[10px] text-blue-600">
                                                                    {
                                                                        task.ticketNo
                                                                    }
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-4 py-4">
                                            <p className="text-xs font-semibold text-slate-800">
                                                {task.client}
                                            </p>

                                            <p className="mt-1 text-[10px] text-slate-500">
                                                {task.project} ·{" "}
                                                {task.module}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${getPriorityClasses(
                                                    task.priority
                                                )}`}
                                            >
                                                {task.priority}
                                            </span>
                                        </td>

                                        <td className="px-4 py-4">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${getStatusClasses(
                                                    task.status
                                                )}`}
                                            >
                                                {task.status}
                                            </span>
                                        </td>

                                        <td className="px-4 py-4">
                                            <p
                                                className={`text-xs font-semibold ${
                                                    overdue
                                                        ? "text-rose-700"
                                                        : dueToday
                                                          ? "text-amber-700"
                                                          : "text-slate-700"
                                                }`}
                                            >
                                                {formatDate(
                                                    task.dueDate
                                                )}
                                            </p>

                                            {(overdue ||
                                                dueToday) && (
                                                <p
                                                    className={`mt-1 text-[9px] font-semibold uppercase tracking-[0.08em] ${
                                                        overdue
                                                            ? "text-rose-500"
                                                            : "text-amber-500"
                                                    }`}
                                                >
                                                    {overdue
                                                        ? "Overdue"
                                                        : "Due today"}
                                                </p>
                                            )}
                                        </td>

                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                                                    <div
                                                        className="h-full rounded-full bg-violet-500"
                                                        style={{
                                                            width: `${Math.min(
                                                                task.progress,
                                                                100
                                                            )}%`,
                                                        }}
                                                    />
                                                </div>

                                                <span className="text-[10px] font-semibold text-slate-600">
                                                    {
                                                        task.progress
                                                    }
                                                    %
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-4 py-4">
                                            <p className="text-xs font-semibold text-slate-800">
                                                {formatDurationFromSeconds(
                                                    task.spentSeconds
                                                )}
                                            </p>

                                            <p className="mt-1 text-[9px] text-slate-400">
                                                of{" "}
                                                {formatEstimatedTime(
                                                    task.estimatedMinutes
                                                )}
                                            </p>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openTaskDetails(
                                                            task
                                                        )
                                                    }
                                                    className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-semibold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                                                >
                                                    Open
                                                </button>

                                                {task.status !==
                                                    "Completed" && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            completeTask(
                                                                task
                                                            )
                                                        }
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
                                                    >
                                                        <Check
                                                            size={
                                                                14
                                                            }
                                                        />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredTasks.length === 0 && (
                    <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                            <Search size={22} />
                        </div>

                        <h3 className="mt-4 text-sm font-semibold text-slate-900">
                            No tasks found
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                            Change your search or task filters.
                        </p>
                    </div>
                )}
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
                            </div>

                            <button
                                type="button"
                                onClick={closeTaskDetails}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                            >
                                <X size={17} />
                            </button>
                        </div>

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
                                        className={`whitespace-nowrap border-b-2 px-4 py-4 text-[11px] font-semibold transition ${
                                            detailsTab === tab.id
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
                                                className={`mt-3 text-xs font-semibold ${
                                                    isTaskOverdue(
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
                                                        className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                                                            item.completed
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
                                                        className={`flex-1 text-xs ${
                                                            item.completed
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
        </div>
    );
}
