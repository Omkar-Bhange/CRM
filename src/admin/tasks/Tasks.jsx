    import { useState } from "react";
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
        Search,
        Timer,
        UserCheck,
    } from "lucide-react";

    const initialTasks = [
        {
            id: 1,
            taskNo: "TSK-2084",
            title: "Fix GST report mismatch",
            workType: "Client Support",
            client: "Shree Ganesh Industries",
            project: "NexERP",
            assignedTo: "Akash Pawar",
            initials: "AP",
            priority: "High",
            status: "In Progress",
            dueDate: "14 Jul 2026",
            estimatedTime: "2h 30m",
            spentTime: "1h 45m",
            progress: 70,
        },
        {
            id: 2,
            taskNo: "TSK-2083",
            title: "Complete StockPro V2 testing",
            workType: "Internal Development",
            client: "Internal Development",
            project: "StockPro",
            assignedTo: "Sneha Kale",
            initials: "SK",
            priority: "Medium",
            status: "Testing",
            dueDate: "15 Jul 2026",
            estimatedTime: "4h",
            spentTime: "2h 20m",
            progress: 58,
        },
        {
            id: 3,
            taskNo: "TSK-2081",
            title: "Prepare client onboarding document",
            workType: "Documentation",
            client: "Kavya Textiles Pvt Ltd",
            project: "BillFlow",
            assignedTo: "Pooja Shinde",
            initials: "PS",
            priority: "Low",
            status: "Assigned",
            dueDate: "16 Jul 2026",
            estimatedTime: "3h",
            spentTime: "0m",
            progress: 0,
        },
        {
            id: 4,
            taskNo: "TSK-2078",
            title: "Resolve stock quantity sync issue",
            workType: "Client Support",
            client: "GreenLeaf Agro",
            project: "StockPro",
            assignedTo: "Rohit More",
            initials: "RM",
            priority: "Critical",
            status: "Blocked",
            dueDate: "14 Jul 2026",
            estimatedTime: "2h",
            spentTime: "1h 10m",
            progress: 35,
        },
    ];


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

        if (status === "Blocked") {
            return "bg-rose-50 text-rose-700 ring-rose-600/10";
        }

        return "bg-slate-100 text-slate-600 ring-slate-500/10";
    }

    export default function Tasks() {

        const [tasks, setTasks] = useState(initialTasks);
        const [searchValue, setSearchValue] = useState("");
        const [statusFilter, setStatusFilter] = useState("All");
        const [priorityFilter, setPriorityFilter] = useState("All");
        const [employeeFilter, setEmployeeFilter] = useState("All");
        const [filtersOpen, setFiltersOpen] = useState(false);
        const [taskView, setTaskView] = useState("list");
        const [selectedTask, setSelectedTask] = useState(null);
        const [taskDetailsTab, setTaskDetailsTab] = useState("overview");
        const [editTaskOpen, setEditTaskOpen] = useState(false);
        const [createTaskOpen, setCreateTaskOpen] = useState(false);
        const [taskChecklists, setTaskChecklists] = useState([
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
                title: "Test with three sample invoices",
                completed: false,
            },
            {
                id: 4,
                taskId: 1,
                title: "Confirm result with client",
                completed: false,
            },
        ]);

        const [checklistText, setChecklistText] = useState("");

        const [createTaskForm, setCreateTaskForm] = useState({
            title: "",
            workType: "Client Support",
            client: "",
            project: "",
            assignedTo: "",
            initials: "",
            priority: "Medium",
            status: "Assigned",
            dueDate: "",
            estimatedTime: "",
            description: "",
        });

        const [editTaskForm, setEditTaskForm] = useState({
            title: "",
            workType: "",
            client: "",
            project: "",
            assignedTo: "",
            initials: "",
            priority: "Medium",
            status: "Assigned",
            dueDate: "",
            estimatedTime: "",
            spentTime: "",
            progress: 0,
        });

        const [taskComments, setTaskComments] = useState([
            {
                id: 1,
                taskId: 1,
                user: "Mangesh Kondhare",
                initials: "MK",
                message:
                    "Please verify the GST totals with at least three sample invoices before sending the update to the client.",
                createdAt: "14 Jul 2026, 10:20 AM",
            },
            {
                id: 2,
                taskId: 1,
                user: "Akash Pawar",
                initials: "AP",
                message:
                    "The mismatch is caused by taxable-value rounding. I am updating the report query and testing it now.",
                createdAt: "14 Jul 2026, 11:05 AM",
            },
        ]);

        const [commentText, setCommentText] = useState("");
        const [taskFiles, setTaskFiles] = useState([
            {
                id: 1,
                taskId: 1,
                name: "GST_Report_Sample.xlsx",
                type: "Excel",
                size: "248 KB",
                uploadedBy: "Akash Pawar",
                initials: "AP",
                uploadedAt: "14 Jul 2026, 11:32 AM",
            },
            {
                id: 2,
                taskId: 1,
                name: "GST_Mismatch_Screenshot.png",
                type: "Image",
                size: "1.2 MB",
                uploadedBy: "Mangesh Kondhare",
                initials: "MK",
                uploadedAt: "14 Jul 2026, 10:18 AM",
            },
        ]);

        const [selectedFile, setSelectedFile] = useState(null);
        const [taskTimeline, setTaskTimeline] = useState([
            {
                id: 1,
                taskId: 1,
                type: "created",
                title: "Task created",
                description: "Task was created from support ticket TKT-1042.",
                user: "Mangesh Kondhare",
                createdAt: "14 Jul 2026, 09:10 AM",
            },
            {
                id: 2,
                taskId: 1,
                type: "assigned",
                title: "Task assigned",
                description: "Task was assigned to Akash Pawar.",
                user: "Mangesh Kondhare",
                createdAt: "14 Jul 2026, 09:15 AM",
            },
            {
                id: 3,
                taskId: 1,
                type: "status",
                title: "Work started",
                description: "Task status changed from Assigned to In Progress.",
                user: "Akash Pawar",
                createdAt: "14 Jul 2026, 09:30 AM",
            },
        ]);

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
        const [workLogs, setWorkLogs] = useState([
            {
                id: 1,
                taskId: 1,
                employee: "Akash Pawar",
                initials: "AP",
                date: "14 Jul 2026",
                startTime: "09:30 AM",
                endTime: "10:45 AM",
                duration: "1h 15m",
                note: "Checked GST report calculations and identified mismatch in taxable value rounding.",
            },
            {
                id: 2,
                taskId: 1,
                employee: "Akash Pawar",
                initials: "AP",
                date: "14 Jul 2026",
                startTime: "11:10 AM",
                endTime: "11:40 AM",
                duration: "30m",
                note: "Updated report query and verified results with sample invoices.",
            },
        ]);

        const [workLogForm, setWorkLogForm] = useState({
            date: "",
            startTime: "",
            endTime: "",
            duration: "",
            note: "",
        });
        const totalTasks = tasks.length;

        const inProgressCount = tasks.filter(
            (task) => task.status === "In Progress"
        ).length;

        const completedCount = tasks.filter(
            (task) => task.status === "Completed"
        ).length;

        const blockedCount = tasks.filter(
            (task) => task.status === "Blocked"
        ).length;
        const filteredTasks = tasks.filter((task) => {
            const search = searchValue.trim().toLowerCase();

            const matchesSearch =
                !search ||
                [
                    task.taskNo,
                    task.title,
                    task.workType,
                    task.client,
                    task.project,
                    task.assignedTo,
                    task.priority,
                    task.status,
                ].some((value) =>
                    String(value || "")
                        .toLowerCase()
                        .includes(search)
                );

            const matchesStatus =
                statusFilter === "All" || task.status === statusFilter;

            const matchesPriority =
                priorityFilter === "All" || task.priority === priorityFilter;

            const matchesEmployee =
                employeeFilter === "All" || task.assignedTo === employeeFilter;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesPriority &&
                matchesEmployee
            );
        });

        const handleWorkLogChange = (event) => {
            const { name, value } = event.target;

            setWorkLogForm((current) => ({
                ...current,
                [name]: value,
            }));
        };

        const handleAddWorkLog = (event) => {
            event.preventDefault();

            if (!selectedTask) return;

            if (!workLogForm.date) {
                alert("Please select work date.");
                return;
            }

            if (!workLogForm.duration.trim()) {
                alert("Please enter work duration.");
                return;
            }

            if (!workLogForm.note.trim()) {
                alert("Please enter work description.");
                return;
            }

            const newLog = {
                id: Date.now(),
                taskId: selectedTask.id,
                employee: selectedTask.assignedTo,
                initials: selectedTask.initials,
                date: new Date(`${workLogForm.date}T00:00:00`).toLocaleDateString(
                    "en-GB",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                    }
                ),
                startTime: workLogForm.startTime || "—",
                endTime: workLogForm.endTime || "—",
                duration: workLogForm.duration.trim(),
                note: workLogForm.note.trim(),
            };

            setWorkLogs((current) => [newLog, ...current]);
            setTaskTimeline((current) => [
                {
                    id: Date.now() + 1,
                    taskId: selectedTask.id,
                    type: "worklog",
                    title: "Work log added",
                    description: `${newLog.duration} recorded: ${newLog.note}`,
                    user: newLog.employee,
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

            setWorkLogForm({
                date: "",
                startTime: "",
                endTime: "",
                duration: "",
                note: "",
            });
        };
        const handleAddComment = (event) => {
            event.preventDefault();

            if (!selectedTask) return;

            if (!commentText.trim()) {
                alert("Please enter a comment.");
                return;
            }

            const newComment = {
                id: Date.now(),
                taskId: selectedTask.id,
                user: "Mangesh Kondhare",
                initials: "MK",
                message: commentText.trim(),
                createdAt: new Date().toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            };

            setTaskComments((current) => [
                ...current,
                newComment,
            ]);
            setTaskTimeline((current) => [
                {
                    id: Date.now() + 1,
                    taskId: selectedTask.id,
                    type: "comment",
                    title: "Comment added",
                    description: newComment.message,
                    user: newComment.user,
                    createdAt: newComment.createdAt,
                },
                ...current,
            ]);

            setCommentText("");
        };

        const handleTaskFileSelect = (event) => {
            const file = event.target.files?.[0];

            if (!file || !selectedTask) return;

            const fileNameParts = file.name.split(".");
            const extension =
                fileNameParts.length > 1
                    ? fileNameParts.pop().toUpperCase()
                    : "FILE";

            const fileSize =
                file.size >= 1024 * 1024
                    ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                    : `${Math.max(1, Math.round(file.size / 1024))} KB`;

            setSelectedFile({
                file,
                name: file.name,
                type: extension,
                size: fileSize,
            });
        };

        const handleAddTaskFile = () => {
            if (!selectedTask) return;

            if (!selectedFile) {
                alert("Please select a file.");
                return;
            }

            const newFile = {
                id: Date.now(),
                taskId: selectedTask.id,
                name: selectedFile.name,
                type: selectedFile.type,
                size: selectedFile.size,
                uploadedBy: "Mangesh Kondhare",
                initials: "MK",
                uploadedAt: new Date().toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            };

            setTaskFiles((current) => [newFile, ...current]);
            setTaskTimeline((current) => [
                {
                    id: Date.now() + 1,
                    taskId: selectedTask.id,
                    type: "file",
                    title: "File uploaded",
                    description: `${newFile.name} (${newFile.size}) was attached to the task.`,
                    user: newFile.uploadedBy,
                    createdAt: newFile.uploadedAt,
                },
                ...current,
            ]);
            setSelectedFile(null);

            const input = document.getElementById("task-file-input");

            if (input) {
                input.value = "";
            }
        };


        const openEditTaskDrawer = () => {
            if (!selectedTask) return;

            setEditTaskForm({
                title: selectedTask.title || "",
                workType: selectedTask.workType || "",
                client: selectedTask.client || "",
                project: selectedTask.project || "",
                assignedTo: selectedTask.assignedTo || "",
                initials: selectedTask.initials || "",
                priority: selectedTask.priority || "Medium",
                status: selectedTask.status || "Assigned",
                dueDate: selectedTask.dueDate || "",
                estimatedTime: selectedTask.estimatedTime || "",
                spentTime: selectedTask.spentTime || "",
                progress: Number(selectedTask.progress || 0),
            });

            setEditTaskOpen(true);
        };

        const closeEditTaskDrawer = () => {
            setEditTaskOpen(false);
        };

        const handleEditTaskChange = (event) => {
            const { name, value } = event.target;

            setEditTaskForm((current) => ({
                ...current,
                [name]:
                    name === "progress"
                        ? Number(value)
                        : value,
            }));
        };
        const handleUpdateTask = (event) => {
            event.preventDefault();

            if (!selectedTask) return;

            if (!editTaskForm.title.trim()) {
                alert("Please enter task title.");
                return;
            }

            if (!editTaskForm.assignedTo.trim()) {
                alert("Please enter assigned employee.");
                return;
            }

            const updatedTask = {
                ...selectedTask,
                title: editTaskForm.title.trim(),
                workType: editTaskForm.workType.trim(),
                client: editTaskForm.client.trim(),
                project: editTaskForm.project.trim(),
                assignedTo: editTaskForm.assignedTo.trim(),
                initials: editTaskForm.initials.trim() || selectedTask.initials,
                priority: editTaskForm.priority,
                status: editTaskForm.status,
                dueDate: editTaskForm.dueDate,
                estimatedTime: editTaskForm.estimatedTime.trim(),
                spentTime: editTaskForm.spentTime.trim(),
                progress: Number(editTaskForm.progress || 0),
            };

            setTasks((current) =>
                current.map((task) =>
                    task.id === selectedTask.id
                        ? updatedTask
                        : task
                )
            );

            setSelectedTask(updatedTask);

            setTaskTimeline((current) => [
                {
                    id: Date.now(),
                    taskId: selectedTask.id,
                    type: "status",
                    title: "Task updated",
                    description: `Task details were updated. Status: ${updatedTask.status}, progress: ${updatedTask.progress}%.`,
                    user: "Mangesh Kondhare",
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

            setEditTaskOpen(false);
        };

        const handleCreateTaskChange = (event) => {
            const { name, value } = event.target;

            setCreateTaskForm((current) => ({
                ...current,
                [name]: value,
            }));
        };

        const closeCreateTaskDrawer = () => {
            setCreateTaskOpen(false);

            setCreateTaskForm({
                title: "",
                workType: "Client Support",
                client: "",
                project: "",
                assignedTo: "",
                initials: "",
                priority: "Medium",
                status: "Assigned",
                dueDate: "",
                estimatedTime: "",
                description: "",
            });
        };

        const handleCreateTask = (event) => {
            event.preventDefault();

            if (!createTaskForm.title.trim()) {
                alert("Please enter task title.");
                return;
            }

            if (!createTaskForm.project) {
                alert("Please select a project.");
                return;
            }

            if (!createTaskForm.assignedTo) {
                alert("Please select an employee.");
                return;
            }

            if (!createTaskForm.dueDate) {
                alert("Please select a due date.");
                return;
            }

            if (!createTaskForm.estimatedTime.trim()) {
                alert("Please enter estimated time.");
                return;
            }

            const nextTaskNumber =
                Math.max(
                    ...tasks.map((task) =>
                        Number(String(task.taskNo).replace(/\D/g, "")) || 0
                    ),
                    2084
                ) + 1;

            const formattedDueDate = new Date(
                `${createTaskForm.dueDate}T00:00:00`
            ).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });

            const newTask = {
                id: Date.now(),
                taskNo: `TSK-${nextTaskNumber}`,
                title: createTaskForm.title.trim(),
                workType: createTaskForm.workType,
                client:
                    createTaskForm.client.trim() ||
                    "Internal Development",
                project: createTaskForm.project,
                assignedTo: createTaskForm.assignedTo,
                initials: createTaskForm.initials,
                priority: createTaskForm.priority,
                status: createTaskForm.status,
                dueDate: formattedDueDate,
                estimatedTime: createTaskForm.estimatedTime.trim(),
                spentTime: "0m",
                progress:
                    createTaskForm.status === "Completed"
                        ? 100
                        : 0,
                description: createTaskForm.description.trim(),
            };

            setTasks((current) => [newTask, ...current]);

            setTaskTimeline((current) => [
                {
                    id: Date.now() + 1,
                    taskId: newTask.id,
                    type: "created",
                    title: "Task created",
                    description: `${newTask.taskNo} was created and assigned to ${newTask.assignedTo}.`,
                    user: "Mangesh Kondhare",
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

            closeCreateTaskDrawer();

            setSelectedTask(newTask);
            setTaskDetailsTab("overview");
        };

        const updateTaskStatus = (taskId, nextStatus) => {
            const progressByStatus = {
                Assigned: 0,
                "In Progress": 25,
                Testing: 75,
                Blocked: 50,
                Completed: 100,
            };

            let updatedTask = null;

            setTasks((current) =>
                current.map((task) => {
                    if (task.id !== taskId) return task;

                    updatedTask = {
                        ...task,
                        status: nextStatus,
                        progress:
                            nextStatus === "Completed"
                                ? 100
                                : Math.max(
                                    task.progress,
                                    progressByStatus[nextStatus] ?? task.progress
                                ),
                    };

                    return updatedTask;
                })
            );

            setSelectedTask((current) =>
                current?.id === taskId && updatedTask
                    ? updatedTask
                    : current
            );

            setTaskTimeline((current) => [
                {
                    id: Date.now(),
                    taskId,
                    type: "status",
                    title: "Status changed",
                    description: `Task status changed to ${nextStatus}.`,
                    user: "Mangesh Kondhare",
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

        const handleAddChecklistItem = (event) => {
            event.preventDefault();

            if (!selectedTask) return;

            if (!checklistText.trim()) {
                alert("Please enter checklist item.");
                return;
            }

            const newItem = {
                id: Date.now(),
                taskId: selectedTask.id,
                title: checklistText.trim(),
                completed: false,
            };

            setTaskChecklists((current) => [
                ...current,
                newItem,
            ]);

            setChecklistText("");

            setTaskTimeline((current) => [
                {
                    id: Date.now() + 1,
                    taskId: selectedTask.id,
                    type: "checklist",
                    title: "Checklist item added",
                    description: newItem.title,
                    user: "Mangesh Kondhare",
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

        const toggleChecklistItem = (itemId) => {
            setTaskChecklists((current) =>
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

        const removeChecklistItem = (itemId) => {
            setTaskChecklists((current) =>
                current.filter((item) => item.id !== itemId)
            );
        };
        return (
            <div>
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
                            Work Management
                        </p>

                        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                            Tasks
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Manage client support work, internal development,
                            employee assignments and task progress.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setCreateTaskOpen(true)}
                        className="flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
                    >
                        <Plus size={17} />
                        Create Task
                    </button>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                    Total Tasks
                                </p>

                                <p className="mt-2 text-2xl font-semibold text-slate-950">
                                    {totalTasks}
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                                <ListTodo size={19} />
                            </div>
                        </div>

                        <p className="mt-4 text-xs text-slate-500">
                            All active and completed work
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                    In Progress
                                </p>

                                <p className="mt-2 text-2xl font-semibold text-slate-950">
                                    {inProgressCount}
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                                <Timer size={19} />
                            </div>
                        </div>

                        <p className="mt-4 text-xs text-amber-600">
                            Currently being worked on
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                    Completed
                                </p>

                                <p className="mt-2 text-2xl font-semibold text-slate-950">
                                    {completedCount}
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                <CheckCircle2 size={19} />
                            </div>
                        </div>

                        <p className="mt-4 text-xs text-emerald-600">
                            Successfully completed
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                    Blocked
                                </p>

                                <p className="mt-2 text-2xl font-semibold text-slate-950">
                                    {blockedCount}
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                                <AlertCircle size={19} />
                            </div>
                        </div>

                        <p className="mt-4 text-xs text-rose-600">
                            Need admin attention
                        </p>
                    </div>
                </div>

                <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">

                        <div>
                            <h3 className="text-sm font-semibold text-slate-950">
                                All Tasks
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                                {filteredTasks.length} tasks found
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                            <div className="flex rounded-xl border border-slate-200 bg-white p-1">
                                {[
                                    { id: "list", label: "List View" },
                                    { id: "board", label: "Board View" },
                                    { id: "timeline", label: "Timeline" },
                                ].map((view) => (
                                    <button
                                        key={view.id}
                                        type="button"
                                        onClick={() => setTaskView(view.id)}
                                        className={`h-8 rounded-lg px-3 text-xs font-semibold transition ${taskView === view.id
                                            ? "bg-slate-900 text-white"
                                            : "text-slate-500 hover:bg-slate-100"
                                            }`}
                                    >
                                        {view.label}
                                    </button>
                                ))}
                            </div>
                            <div className="relative w-full sm:w-72">

                                <Search
                                    size={17}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    type="text"
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    placeholder="Search task no, title, client, project, employee..."
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => setFiltersOpen(!filtersOpen)}
                                className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                            >
                                <Filter size={15} />
                                Filters
                            </button>
                        </div>
                        {filtersOpen && (
                            <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
                                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">

                                    <div>
                                        <label className="mb-2 block text-[11px] font-semibold text-slate-600">
                                            Status
                                        </label>

                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs"
                                        >
                                            <option>All</option>
                                            <option>Assigned</option>
                                            <option>In Progress</option>
                                            <option>Testing</option>
                                            <option>Blocked</option>
                                            <option>Completed</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-[11px] font-semibold text-slate-600">
                                            Priority
                                        </label>

                                        <select
                                            value={priorityFilter}
                                            onChange={(e) => setPriorityFilter(e.target.value)}
                                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs"
                                        >
                                            <option>All</option>
                                            <option>Critical</option>
                                            <option>High</option>
                                            <option>Medium</option>
                                            <option>Low</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-[11px] font-semibold text-slate-600">
                                            Employee
                                        </label>

                                        <select
                                            value={employeeFilter}
                                            onChange={(e) => setEmployeeFilter(e.target.value)}
                                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs"
                                        >
                                            <option>All</option>

                                            {[...new Set(tasks.map((t) => t.assignedTo))].map((emp) => (
                                                <option key={emp}>{emp}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex items-end">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearchValue("");
                                                setStatusFilter("All");
                                                setPriorityFilter("All");
                                                setEmployeeFilter("All");
                                            }}
                                            className="h-10 w-full rounded-xl bg-slate-900 text-xs font-semibold text-white"
                                        >
                                            Reset Filters
                                        </button>
                                    </div>

                                </div>
                            </div>
                        )}
                    </div>
                    {taskView === "list" && (
                        <div className="overflow-x-auto">
                            <table className="min-w-[1380px] w-full">
                                <thead className="bg-slate-50">
                                    <tr className="border-b border-slate-200">
                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            Task
                                        </th>

                                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            Client / Project
                                        </th>

                                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            Assigned To
                                        </th>

                                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            Priority
                                        </th>

                                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            Status
                                        </th>

                                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            Due Date
                                        </th>

                                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            Progress
                                        </th>

                                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            Time
                                        </th>

                                        <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredTasks.map((task) => (
                                        <tr
                                            key={task.id}
                                            onClick={() => {
                                                setSelectedTask(task);
                                                setTaskDetailsTab("overview");
                                            }}
                                            className="cursor-pointer border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/70"
                                        >
                                            <td className="px-5 py-4">
                                                <p className="text-xs font-semibold text-slate-950">
                                                    {task.title}
                                                </p>

                                                <p className="mt-1 text-[10px] font-semibold text-violet-600">
                                                    {task.taskNo}
                                                </p>

                                                <p className="mt-1 text-[10px] text-slate-500">
                                                    {task.workType}
                                                </p>
                                            </td>

                                            <td className="px-4 py-4">
                                                <p className="text-xs font-semibold text-slate-800">
                                                    {task.client}
                                                </p>

                                                <p className="mt-1 text-[10px] text-slate-500">
                                                    {task.project}
                                                </p>
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-[10px] font-semibold text-white">
                                                        {task.initials}
                                                    </div>

                                                    <span className="text-xs font-semibold text-slate-700">
                                                        {task.assignedTo}
                                                    </span>
                                                </div>
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
                                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                                    <CalendarDays
                                                        size={14}
                                                        className="text-slate-400"
                                                    />
                                                    {task.dueDate}
                                                </div>
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="w-28">
                                                    <div className="mb-1 flex items-center justify-between text-[10px]">
                                                        <span className="text-slate-400">
                                                            Progress
                                                        </span>

                                                        <span className="font-semibold text-slate-700">
                                                            {task.progress}%
                                                        </span>
                                                    </div>

                                                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                                        <div
                                                            className="h-full rounded-full bg-violet-500"
                                                            style={{
                                                                width: `${task.progress}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Clock3
                                                        size={14}
                                                        className="text-slate-400"
                                                    />

                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-800">
                                                            {task.spentTime}
                                                        </p>

                                                        <p className="text-[10px] text-slate-500">
                                                            of {task.estimatedTime}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                                    >
                                                        <BriefcaseBusiness size={14} />
                                                        Open
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                                                    >
                                                        <MoreHorizontal size={17} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {taskView === "board" && (
                        <div className="grid gap-4 p-5 xl:grid-cols-4">
                            {[
                                {
                                    id: "Assigned",
                                    title: "Assigned",
                                    description: "Waiting to start",
                                    badgeClass: "bg-slate-100 text-slate-700",
                                },
                                {
                                    id: "In Progress",
                                    title: "In Progress",
                                    description: "Currently being worked on",
                                    badgeClass: "bg-violet-50 text-violet-700",
                                },
                                {
                                    id: "Testing",
                                    title: "Testing",
                                    description: "Waiting for verification",
                                    badgeClass: "bg-blue-50 text-blue-700",
                                },
                                {
                                    id: "Completed",
                                    title: "Completed",
                                    description: "Successfully finished",
                                    badgeClass: "bg-emerald-50 text-emerald-700",
                                },
                            ].map((column) => {
                                const columnTasks = filteredTasks.filter(
                                    (task) => task.status === column.id
                                );

                                return (
                                    <div
                                        key={column.id}
                                        className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70"
                                    >
                                        <div className="border-b border-slate-200 bg-white px-4 py-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${column.badgeClass}`}
                                                        >
                                                            {column.title}
                                                        </span>

                                                        <span className="text-xs font-semibold text-slate-500">
                                                            {columnTasks.length}
                                                        </span>
                                                    </div>

                                                    <p className="mt-2 text-[11px] text-slate-500">
                                                        {column.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="min-h-[440px] space-y-3 p-3">
                                            {columnTasks.length > 0 ? (
                                                columnTasks.map((task) => (
                                                    <button
                                                        key={task.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedTask(task);
                                                            setTaskDetailsTab("overview");
                                                        }}
                                                        className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <p className="truncate text-xs font-semibold text-slate-950">
                                                                    {task.title}
                                                                </p>

                                                                <p className="mt-1 text-[10px] font-semibold text-violet-600">
                                                                    {task.taskNo}
                                                                </p>
                                                            </div>

                                                            <span
                                                                className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold ${getPriorityClasses(
                                                                    task.priority
                                                                )}`}
                                                            >
                                                                {task.priority}
                                                            </span>
                                                        </div>

                                                        <div className="mt-4 space-y-2">
                                                            <div className="flex items-center justify-between gap-3 text-[10px]">
                                                                <span className="text-slate-400">
                                                                    Client
                                                                </span>

                                                                <span className="max-w-[160px] truncate font-semibold text-slate-700">
                                                                    {task.client}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center justify-between gap-3 text-[10px]">
                                                                <span className="text-slate-400">
                                                                    Project
                                                                </span>

                                                                <span className="font-semibold text-slate-700">
                                                                    {task.project}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center justify-between gap-3 text-[10px]">
                                                                <span className="text-slate-400">
                                                                    Assigned
                                                                </span>

                                                                <span className="font-semibold text-slate-700">
                                                                    {task.assignedTo}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center justify-between gap-3 text-[10px]">
                                                                <span className="text-slate-400">
                                                                    Due
                                                                </span>

                                                                <span className="font-semibold text-slate-700">
                                                                    {task.dueDate}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="mt-4">
                                                            <div className="mb-2 flex items-center justify-between text-[10px]">
                                                                <span className="text-slate-400">
                                                                    Progress
                                                                </span>

                                                                <span className="font-semibold text-slate-700">
                                                                    {task.progress}%
                                                                </span>
                                                            </div>

                                                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                                                <div
                                                                    className="h-full rounded-full bg-violet-500"
                                                                    style={{
                                                                        width: `${task.progress}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                                                            <span className="text-[10px] text-slate-400">
                                                                {task.spentTime} of {task.estimatedTime}
                                                            </span>

                                                            <div className="flex items-center gap-2">
                                                                {task.status === "Assigned" && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(event) => {
                                                                            event.stopPropagation();
                                                                            updateTaskStatus(task.id, "In Progress");
                                                                        }}
                                                                        className="rounded-lg bg-violet-50 px-2.5 py-1.5 text-[9px] font-semibold text-violet-700"
                                                                    >
                                                                        Start
                                                                    </button>
                                                                )}

                                                                {task.status === "In Progress" && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(event) => {
                                                                            event.stopPropagation();
                                                                            updateTaskStatus(task.id, "Testing");
                                                                        }}
                                                                        className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-[9px] font-semibold text-blue-700"
                                                                    >
                                                                        Testing
                                                                    </button>
                                                                )}

                                                                {task.status === "Testing" && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(event) => {
                                                                            event.stopPropagation();
                                                                            updateTaskStatus(task.id, "Completed");
                                                                        }}
                                                                        className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[9px] font-semibold text-emerald-700"
                                                                    >
                                                                        Complete
                                                                    </button>
                                                                )}

                                                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-[9px] font-semibold text-white">
                                                                    {task.initials}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="flex min-h-[380px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/60 p-6 text-center">
                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-600">
                                                            No {column.title.toLowerCase()} tasks
                                                        </p>

                                                        <p className="mt-2 text-[10px] text-slate-400">
                                                            Matching tasks will appear here.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}{taskView === "timeline" && (
                        <div className="p-5">
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                            Task Timeline
                                        </p>

                                        <h3 className="mt-1 text-sm font-semibold text-slate-950">
                                            Due-date and progress overview
                                        </h3>
                                    </div>

                                    <span className="rounded-full bg-violet-50 px-3 py-1 text-[10px] font-bold text-violet-700">
                                        {filteredTasks.length} tasks
                                    </span>
                                </div>

                                <div className="overflow-x-auto">
                                    <div className="min-w-[980px]">
                                        <div className="grid grid-cols-[260px_repeat(7,minmax(100px,1fr))] border-b border-slate-200 bg-slate-50">
                                            <div className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Task
                                            </div>

                                            {[
                                                "14 Jul",
                                                "15 Jul",
                                                "16 Jul",
                                                "17 Jul",
                                                "18 Jul",
                                                "19 Jul",
                                                "20 Jul",
                                            ].map((date) => (
                                                <div
                                                    key={date}
                                                    className="border-l border-slate-200 px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400"
                                                >
                                                    {date}
                                                </div>
                                            ))}
                                        </div>

                                        {filteredTasks.map((task) => {
                                            const dayNumber = Number(
                                                String(task.dueDate).match(/\d+/)?.[0] || 14
                                            );

                                            const startColumn = Math.min(
                                                Math.max(dayNumber - 13, 1),
                                                7
                                            );

                                            return (
                                                <div
                                                    key={task.id}
                                                    className="grid grid-cols-[260px_repeat(7,minmax(100px,1fr))] border-b border-slate-100 last:border-b-0"
                                                >
                                                    <div className="px-5 py-4">
                                                        <p className="truncate text-xs font-semibold text-slate-950">
                                                            {task.title}
                                                        </p>

                                                        <p className="mt-1 text-[10px] font-semibold text-violet-600">
                                                            {task.taskNo}
                                                        </p>

                                                        <p className="mt-1 text-[10px] text-slate-500">
                                                            {task.assignedTo}
                                                        </p>
                                                    </div>

                                                    {Array.from({ length: 7 }).map((_, index) => (
                                                        <div
                                                            key={index}
                                                            className="relative min-h-[76px] border-l border-slate-100 px-2 py-3"
                                                        >
                                                            {index + 1 === startColumn && (
                                                                <div
                                                                    className={`rounded-xl px-3 py-2 ${task.status === "Completed"
                                                                        ? "bg-emerald-100 text-emerald-800"
                                                                        : task.status === "Blocked"
                                                                            ? "bg-rose-100 text-rose-800"
                                                                            : task.status === "Testing"
                                                                                ? "bg-blue-100 text-blue-800"
                                                                                : "bg-violet-100 text-violet-800"
                                                                        }`}
                                                                >
                                                                    <p className="truncate text-[10px] font-semibold">
                                                                        {task.project}
                                                                    </p>

                                                                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/70">
                                                                        <div
                                                                            className="h-full rounded-full bg-current"
                                                                            style={{
                                                                                width: `${task.progress}%`,
                                                                            }}
                                                                        />
                                                                    </div>

                                                                    <p className="mt-1 text-[9px] font-semibold">
                                                                        {task.progress}%
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })}

                                        {filteredTasks.length === 0 && (
                                            <div className="px-5 py-14 text-center">
                                                <p className="text-sm font-semibold text-slate-700">
                                                    No tasks found
                                                </p>

                                                <p className="mt-2 text-xs text-slate-500">
                                                    Change the filters to view task timeline data.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}{selectedTask && (
                        <div className="fixed inset-0 z-[120]">
                            <button
                                type="button"
                                aria-label="Close task details"
                                onClick={() => setSelectedTask(null)}
                                className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
                            />

                            <aside className="absolute right-0 top-0 flex h-full w-full max-w-[780px] flex-col bg-white shadow-2xl">
                                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs font-semibold text-violet-600">
                                                {selectedTask.taskNo}
                                            </span>

                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${getPriorityClasses(
                                                    selectedTask.priority
                                                )}`}
                                            >
                                                {selectedTask.priority}
                                            </span>

                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${getStatusClasses(
                                                    selectedTask.status
                                                )}`}
                                            >
                                                {selectedTask.status}
                                            </span>
                                        </div>

                                        <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
                                            {selectedTask.title}
                                        </h2>

                                        <p className="mt-2 text-xs text-slate-500">
                                            {selectedTask.workType} · {selectedTask.project}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setSelectedTask(null)}
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="shrink-0 border-b border-slate-200 bg-white px-6">
                                    <div className="flex gap-6 overflow-x-auto">
                                        {[
                                            { id: "overview", label: "Overview" },
                                            { id: "checklist", label: "Checklist" },
                                            { id: "worklog", label: "Work Log" },
                                            { id: "comments", label: "Comments" },
                                            { id: "files", label: "Files" },
                                            { id: "timeline", label: "Timeline" },
                                        ].map((tab) => (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() => setTaskDetailsTab(tab.id)}
                                                className={`relative whitespace-nowrap py-4 text-xs font-semibold transition ${taskDetailsTab === tab.id
                                                    ? "text-violet-700"
                                                    : "text-slate-500 hover:text-slate-900"
                                                    }`}
                                            >
                                                {tab.label}

                                                {taskDetailsTab === tab.id && (
                                                    <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-violet-600" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto bg-slate-50/70 p-6">
                                    {taskDetailsTab === "overview" && (
                                        <div className="space-y-4">
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                        Client & Project
                                                    </p>

                                                    <div className="mt-4 space-y-4">
                                                        <div>
                                                            <p className="text-[10px] text-slate-400">
                                                                Client
                                                            </p>

                                                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                                                {selectedTask.client}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-[10px] text-slate-400">
                                                                Project
                                                            </p>

                                                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                                                {selectedTask.project}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-[10px] text-slate-400">
                                                                Work Type
                                                            </p>

                                                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                                                {selectedTask.workType}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                        Assignment
                                                    </p>

                                                    <div className="mt-4 flex items-center gap-3">
                                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-xs font-semibold text-white">
                                                            {selectedTask.initials}
                                                        </div>

                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-900">
                                                                {selectedTask.assignedTo}
                                                            </p>

                                                            <p className="mt-1 text-[10px] text-slate-500">
                                                                Assigned employee
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                                                        <div>
                                                            <p className="text-[10px] text-slate-400">
                                                                Due Date
                                                            </p>

                                                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                                                {selectedTask.dueDate}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-[10px] text-slate-400">
                                                                Status
                                                            </p>

                                                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                                                {selectedTask.status}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                            Progress
                                                        </p>

                                                        <h3 className="mt-2 text-base font-semibold text-slate-950">
                                                            Task completion
                                                        </h3>
                                                    </div>

                                                    <span className="text-lg font-semibold text-violet-700">
                                                        {selectedTask.progress}%
                                                    </span>
                                                </div>

                                                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                                                    <div
                                                        className="h-full rounded-full bg-violet-500"
                                                        style={{
                                                            width: `${selectedTask.progress}%`,
                                                        }}
                                                    />
                                                </div>

                                                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                                    <div className="rounded-xl bg-slate-50 p-4">
                                                        <p className="text-[10px] text-slate-400">
                                                            Time Spent
                                                        </p>

                                                        <p className="mt-2 text-lg font-semibold text-slate-950">
                                                            {selectedTask.spentTime}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-xl bg-slate-50 p-4">
                                                        <p className="text-[10px] text-slate-400">
                                                            Estimated Time
                                                        </p>

                                                        <p className="mt-2 text-lg font-semibold text-slate-950">
                                                            {selectedTask.estimatedTime}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                    Task Description
                                                </p>

                                                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                                    {selectedTask.description ||
                                                        "No detailed task description has been added."}
                                                </p>
                                            </div>

                                            <div className="grid gap-4 sm:grid-cols-3">
                                                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                        Related Ticket
                                                    </p>

                                                    <p className="mt-3 text-sm font-semibold text-violet-700">
                                                        TKT-{selectedTask.id}042
                                                    </p>
                                                </div>

                                                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                        Related Client
                                                    </p>

                                                    <p className="mt-3 truncate text-sm font-semibold text-slate-900">
                                                        {selectedTask.client}
                                                    </p>
                                                </div>

                                                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                        Knowledge Base
                                                    </p>

                                                    <p className="mt-3 text-sm font-semibold text-slate-900">
                                                        No article linked
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}{taskDetailsTab === "checklist" && (
                                        <div className="space-y-4">
                                            <form
                                                onSubmit={handleAddChecklistItem}
                                                className="rounded-2xl border border-slate-200 bg-white p-5"
                                            >
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                    Task Checklist
                                                </p>

                                                <h3 className="mt-2 text-sm font-semibold text-slate-950">
                                                    Add completion and verification steps
                                                </h3>

                                                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                                                    <input
                                                        type="text"
                                                        value={checklistText}
                                                        onChange={(event) =>
                                                            setChecklistText(event.target.value)
                                                        }
                                                        placeholder="Enter checklist item"
                                                        className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                    />

                                                    <button
                                                        type="submit"
                                                        className="h-10 rounded-xl bg-violet-600 px-5 text-xs font-semibold text-white transition hover:bg-violet-700"
                                                    >
                                                        Add Item
                                                    </button>
                                                </div>
                                            </form>

                                            <div className="rounded-2xl border border-slate-200 bg-white">
                                                <div className="border-b border-slate-200 px-5 py-4">
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                        Completion Progress
                                                    </p>

                                                    {(() => {
                                                        const taskItems = taskChecklists.filter(
                                                            (item) =>
                                                                item.taskId === selectedTask.id
                                                        );

                                                        const completedItems = taskItems.filter(
                                                            (item) => item.completed
                                                        ).length;

                                                        const percentage =
                                                            taskItems.length > 0
                                                                ? Math.round(
                                                                    (completedItems /
                                                                        taskItems.length) *
                                                                    100
                                                                )
                                                                : 0;

                                                        return (
                                                            <>
                                                                <div className="mt-3 flex items-center justify-between">
                                                                    <h3 className="text-sm font-semibold text-slate-950">
                                                                        {completedItems} of{" "}
                                                                        {taskItems.length} completed
                                                                    </h3>

                                                                    <span className="text-xs font-semibold text-violet-700">
                                                                        {percentage}%
                                                                    </span>
                                                                </div>

                                                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                                                                    <div
                                                                        className="h-full rounded-full bg-violet-500"
                                                                        style={{
                                                                            width: `${percentage}%`,
                                                                        }}
                                                                    />
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                </div>

                                                <div className="divide-y divide-slate-100">
                                                    {taskChecklists.filter(
                                                        (item) =>
                                                            item.taskId === selectedTask.id
                                                    ).length > 0 ? (
                                                        taskChecklists
                                                            .filter(
                                                                (item) =>
                                                                    item.taskId ===
                                                                    selectedTask.id
                                                            )
                                                            .map((item) => (
                                                                <div
                                                                    key={item.id}
                                                                    className="flex items-center gap-3 p-4"
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            toggleChecklistItem(
                                                                                item.id
                                                                            )
                                                                        }
                                                                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-[10px] font-bold transition ${item.completed
                                                                            ? "border-emerald-500 bg-emerald-500 text-white"
                                                                            : "border-slate-300 bg-white text-transparent hover:border-violet-400"
                                                                            }`}
                                                                    >
                                                                        ✓
                                                                    </button>

                                                                    <p
                                                                        className={`min-w-0 flex-1 text-xs font-semibold ${item.completed
                                                                            ? "text-slate-400 line-through"
                                                                            : "text-slate-800"
                                                                            }`}
                                                                    >
                                                                        {item.title}
                                                                    </p>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            removeChecklistItem(
                                                                                item.id
                                                                            )
                                                                        }
                                                                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[10px] font-semibold text-rose-700 transition hover:bg-rose-100"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </div>
                                                            ))
                                                    ) : (
                                                        <div className="px-5 py-12 text-center">
                                                            <p className="text-sm font-semibold text-slate-700">
                                                                No checklist items
                                                            </p>

                                                            <p className="mt-2 text-xs text-slate-500">
                                                                Add verification steps for this task.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {taskDetailsTab === "worklog" && (
                                        <div className="space-y-4">
                                            <form
                                                onSubmit={handleAddWorkLog}
                                                className="rounded-2xl border border-slate-200 bg-white p-5"
                                            >
                                                <div>
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                        Add Work Log
                                                    </p>

                                                    <h3 className="mt-2 text-sm font-semibold text-slate-950">
                                                        Record time and work completed
                                                    </h3>
                                                </div>

                                                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                                    <div>
                                                        <label className="text-[11px] font-semibold text-slate-600">
                                                            Work Date
                                                        </label>

                                                        <input
                                                            type="date"
                                                            name="date"
                                                            value={workLogForm.date}
                                                            onChange={handleWorkLogChange}
                                                            className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-[11px] font-semibold text-slate-600">
                                                            Duration
                                                        </label>

                                                        <input
                                                            type="text"
                                                            name="duration"
                                                            value={workLogForm.duration}
                                                            onChange={handleWorkLogChange}
                                                            placeholder="Example: 1h 30m"
                                                            className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-[11px] font-semibold text-slate-600">
                                                            Start Time
                                                        </label>

                                                        <input
                                                            type="time"
                                                            name="startTime"
                                                            value={workLogForm.startTime}
                                                            onChange={handleWorkLogChange}
                                                            className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-[11px] font-semibold text-slate-600">
                                                            End Time
                                                        </label>

                                                        <input
                                                            type="time"
                                                            name="endTime"
                                                            value={workLogForm.endTime}
                                                            onChange={handleWorkLogChange}
                                                            className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                        />
                                                    </div>

                                                    <div className="sm:col-span-2">
                                                        <label className="text-[11px] font-semibold text-slate-600">
                                                            Work Description
                                                        </label>

                                                        <textarea
                                                            name="note"
                                                            value={workLogForm.note}
                                                            onChange={handleWorkLogChange}
                                                            rows={4}
                                                            placeholder="Describe what was checked, fixed or completed..."
                                                            className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="mt-4 flex justify-end">
                                                    <button
                                                        type="submit"
                                                        className="h-10 rounded-xl bg-violet-600 px-5 text-xs font-semibold text-white transition hover:bg-violet-700"
                                                    >
                                                        Add Work Log
                                                    </button>
                                                </div>
                                            </form>

                                            <div className="rounded-2xl border border-slate-200 bg-white">
                                                <div className="border-b border-slate-200 px-5 py-4">
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                        Work History
                                                    </p>

                                                    <h3 className="mt-1 text-sm font-semibold text-slate-950">
                                                        Recorded work for this task
                                                    </h3>
                                                </div>

                                                <div className="divide-y divide-slate-100">
                                                    {workLogs.filter(
                                                        (log) => log.taskId === selectedTask.id
                                                    ).length > 0 ? (
                                                        workLogs
                                                            .filter((log) => log.taskId === selectedTask.id)
                                                            .map((log) => (
                                                                <div key={log.id} className="p-5">
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-[10px] font-semibold text-white">
                                                                            {log.initials}
                                                                        </div>

                                                                        <div className="min-w-0 flex-1">
                                                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                                                <div>
                                                                                    <p className="text-xs font-semibold text-slate-900">
                                                                                        {log.employee}
                                                                                    </p>

                                                                                    <p className="mt-1 text-[10px] text-slate-500">
                                                                                        {log.date} · {log.startTime} –{" "}
                                                                                        {log.endTime}
                                                                                    </p>
                                                                                </div>

                                                                                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700">
                                                                                    {log.duration}
                                                                                </span>
                                                                            </div>

                                                                            <p className="mt-3 text-xs leading-5 text-slate-600">
                                                                                {log.note}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                    ) : (
                                                        <div className="px-5 py-12 text-center">
                                                            <p className="text-sm font-semibold text-slate-700">
                                                                No work logs recorded
                                                            </p>

                                                            <p className="mt-2 text-xs text-slate-500">
                                                                Add the first work update for this task.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}{taskDetailsTab === "comments" && (
                                        <div className="space-y-4">
                                            <form
                                                onSubmit={handleAddComment}
                                                className="rounded-2xl border border-slate-200 bg-white p-5"
                                            >
                                                <div>
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                        Add Comment
                                                    </p>

                                                    <h3 className="mt-2 text-sm font-semibold text-slate-950">
                                                        Share an update or instruction
                                                    </h3>
                                                </div>

                                                <textarea
                                                    value={commentText}
                                                    onChange={(event) =>
                                                        setCommentText(event.target.value)
                                                    }
                                                    rows={4}
                                                    placeholder="Write a comment for this task..."
                                                    className="mt-5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                />

                                                <div className="mt-4 flex justify-end">
                                                    <button
                                                        type="submit"
                                                        className="h-10 rounded-xl bg-violet-600 px-5 text-xs font-semibold text-white transition hover:bg-violet-700"
                                                    >
                                                        Add Comment
                                                    </button>
                                                </div>
                                            </form>

                                            <div className="rounded-2xl border border-slate-200 bg-white">
                                                <div className="border-b border-slate-200 px-5 py-4">
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                        Conversation
                                                    </p>

                                                    <h3 className="mt-1 text-sm font-semibold text-slate-950">
                                                        Task comments and updates
                                                    </h3>
                                                </div>

                                                <div className="divide-y divide-slate-100">
                                                    {taskComments.filter(
                                                        (comment) =>
                                                            comment.taskId === selectedTask.id
                                                    ).length > 0 ? (
                                                        taskComments
                                                            .filter(
                                                                (comment) =>
                                                                    comment.taskId ===
                                                                    selectedTask.id
                                                            )
                                                            .map((comment) => (
                                                                <div
                                                                    key={comment.id}
                                                                    className="p-5"
                                                                >
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-[10px] font-semibold text-white">
                                                                            {comment.initials}
                                                                        </div>

                                                                        <div className="min-w-0 flex-1">
                                                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                                                <div>
                                                                                    <p className="text-xs font-semibold text-slate-900">
                                                                                        {comment.user}
                                                                                    </p>

                                                                                    <p className="mt-1 text-[10px] text-slate-500">
                                                                                        {
                                                                                            comment.createdAt
                                                                                        }
                                                                                    </p>
                                                                                </div>
                                                                            </div>

                                                                            <p className="mt-3 whitespace-pre-wrap text-xs leading-5 text-slate-600">
                                                                                {comment.message}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                    ) : (
                                                        <div className="px-5 py-12 text-center">
                                                            <p className="text-sm font-semibold text-slate-700">
                                                                No comments yet
                                                            </p>

                                                            <p className="mt-2 text-xs text-slate-500">
                                                                Add the first task comment.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}{taskDetailsTab === "files" && (
                                        <div className="space-y-4">
                                            <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                                <div>
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                        Upload Attachment
                                                    </p>

                                                    <h3 className="mt-2 text-sm font-semibold text-slate-950">
                                                        Add screenshots, documents or supporting files
                                                    </h3>
                                                </div>

                                                <label
                                                    htmlFor="task-file-input"
                                                    className="mt-5 flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-violet-300 hover:bg-violet-50/40"
                                                >
                                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                                                        <Plus size={18} />
                                                    </div>

                                                    <p className="mt-3 text-sm font-semibold text-slate-800">
                                                        Select a file
                                                    </p>

                                                    <p className="mt-2 text-xs text-slate-500">
                                                        Images, PDF, Excel, Word, text or ZIP files
                                                    </p>

                                                    <input
                                                        id="task-file-input"
                                                        type="file"
                                                        onChange={handleTaskFileSelect}
                                                        className="hidden"
                                                    />
                                                </label>

                                                {selectedFile && (
                                                    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                                                        <div className="min-w-0">
                                                            <p className="truncate text-xs font-semibold text-violet-900">
                                                                {selectedFile.name}
                                                            </p>

                                                            <p className="mt-1 text-[10px] text-violet-600">
                                                                {selectedFile.type} · {selectedFile.size}
                                                            </p>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedFile(null);

                                                                    const input =
                                                                        document.getElementById(
                                                                            "task-file-input"
                                                                        );

                                                                    if (input) {
                                                                        input.value = "";
                                                                    }
                                                                }}
                                                                className="h-9 rounded-lg border border-violet-200 bg-white px-3 text-[10px] font-semibold text-violet-700"
                                                            >
                                                                Remove
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={handleAddTaskFile}
                                                                className="h-9 rounded-lg bg-violet-600 px-4 text-[10px] font-semibold text-white"
                                                            >
                                                                Add File
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="rounded-2xl border border-slate-200 bg-white">
                                                <div className="border-b border-slate-200 px-5 py-4">
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                        Task Attachments
                                                    </p>

                                                    <h3 className="mt-1 text-sm font-semibold text-slate-950">
                                                        Files linked to this task
                                                    </h3>
                                                </div>

                                                <div className="divide-y divide-slate-100">
                                                    {taskFiles.filter(
                                                        (file) => file.taskId === selectedTask.id
                                                    ).length > 0 ? (
                                                        taskFiles
                                                            .filter(
                                                                (file) =>
                                                                    file.taskId === selectedTask.id
                                                            )
                                                            .map((file) => (
                                                                <div
                                                                    key={file.id}
                                                                    className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                                                                >
                                                                    <div className="flex min-w-0 items-center gap-3">
                                                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[10px] font-bold text-slate-700">
                                                                            {file.type.slice(0, 4)}
                                                                        </div>

                                                                        <div className="min-w-0">
                                                                            <p className="truncate text-xs font-semibold text-slate-900">
                                                                                {file.name}
                                                                            </p>

                                                                            <p className="mt-1 text-[10px] text-slate-500">
                                                                                {file.size} · Uploaded by{" "}
                                                                                {file.uploadedBy}
                                                                            </p>

                                                                            <p className="mt-1 text-[10px] text-slate-400">
                                                                                {file.uploadedAt}
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setTaskFiles((current) =>
                                                                                current.filter(
                                                                                    (item) =>
                                                                                        item.id !== file.id
                                                                                )
                                                                            )
                                                                        }
                                                                        className="h-9 rounded-lg border border-rose-200 bg-rose-50 px-3 text-[10px] font-semibold text-rose-700 transition hover:bg-rose-100"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </div>
                                                            ))
                                                    ) : (
                                                        <div className="px-5 py-12 text-center">
                                                            <p className="text-sm font-semibold text-slate-700">
                                                                No files uploaded
                                                            </p>

                                                            <p className="mt-2 text-xs text-slate-500">
                                                                Upload the first attachment for this task.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}{taskDetailsTab === "timeline" && (
                                        <div className="rounded-2xl border border-slate-200 bg-white">
                                            <div className="border-b border-slate-200 px-5 py-4">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                    Task Timeline
                                                </p>

                                                <h3 className="mt-1 text-sm font-semibold text-slate-950">
                                                    Complete activity history
                                                </h3>
                                            </div>

                                            <div className="p-5">
                                                {taskTimeline.filter(
                                                    (event) => event.taskId === selectedTask.id
                                                ).length > 0 ? (
                                                    <div className="relative space-y-6">
                                                        <div className="absolute bottom-3 left-[17px] top-3 w-px bg-slate-200" />

                                                        {taskTimeline
                                                            .filter(
                                                                (event) =>
                                                                    event.taskId === selectedTask.id
                                                            )
                                                            .map((event) => (
                                                                <div
                                                                    key={event.id}
                                                                    className="relative flex gap-4"
                                                                >
                                                                    <div
                                                                        className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold ${event.type === "created"
                                                                            ? "bg-slate-100 text-slate-700"
                                                                            : event.type === "assigned"
                                                                                ? "bg-blue-100 text-blue-700"
                                                                                : event.type === "status"
                                                                                    ? "bg-violet-100 text-violet-700"
                                                                                    : event.type === "worklog"
                                                                                        ? "bg-amber-100 text-amber-700"
                                                                                        : event.type === "comment"
                                                                                            ? "bg-cyan-100 text-cyan-700"
                                                                                            : "bg-emerald-100 text-emerald-700"
                                                                            }`}
                                                                    >
                                                                        {event.type
                                                                            .slice(0, 2)
                                                                            .toUpperCase()}
                                                                    </div>

                                                                    <div className="min-w-0 flex-1 border-b border-slate-100 pb-5">
                                                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                                            <div>
                                                                                <p className="text-xs font-semibold text-slate-900">
                                                                                    {event.title}
                                                                                </p>

                                                                                <p className="mt-2 text-xs leading-5 text-slate-600">
                                                                                    {event.description}
                                                                                </p>

                                                                                <p className="mt-2 text-[10px] font-semibold text-violet-600">
                                                                                    {event.user}
                                                                                </p>
                                                                            </div>

                                                                            <span className="shrink-0 text-[10px] text-slate-400">
                                                                                {event.createdAt}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                    </div>
                                                ) : (
                                                    <div className="py-12 text-center">
                                                        <p className="text-sm font-semibold text-slate-700">
                                                            No timeline events
                                                        </p>

                                                        <p className="mt-2 text-xs text-slate-500">
                                                            Task activity will appear here.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {![
                                        "overview",
                                        "checklist",
                                        "worklog",
                                        "comments",
                                        "files",
                                        "timeline",
                                    ].includes(taskDetailsTab) && (
                                            <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-700">
                                                        {taskDetailsTab
                                                            .replace("-", " ")
                                                            .replace(/\b\w/g, (letter) =>
                                                                letter.toUpperCase()
                                                            )}
                                                    </p>

                                                    <p className="mt-2 text-xs text-slate-500">
                                                        This task workspace section will be added next.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                </div>

                                <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedTask(null)}
                                        className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                                    >
                                        Close
                                    </button>

                                    <button
                                        type="button"
                                        onClick={openEditTaskDrawer}
                                        className="h-10 rounded-xl bg-violet-600 px-5 text-xs font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
                                    >
                                        Update Task
                                    </button>
                                </div>
                            </aside>
                        </div>
                    )}{editTaskOpen && selectedTask && (
                        <div className="fixed inset-0 z-[140]">
                            <button
                                type="button"
                                aria-label="Close edit task form"
                                onClick={closeEditTaskDrawer}
                                className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
                            />

                            <aside className="absolute right-0 top-0 flex h-full w-full max-w-[680px] flex-col bg-white shadow-2xl">
                                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-600">
                                            Task Management
                                        </p>

                                        <h2 className="mt-2 text-lg font-semibold text-slate-950">
                                            Update Task
                                        </h2>

                                        <p className="mt-1 text-xs text-slate-500">
                                            {selectedTask.taskNo} · Update assignment, status,
                                            progress and due details.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={closeEditTaskDrawer}
                                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                                    >
                                        ×
                                    </button>
                                </div>

                                <form
                                    onSubmit={handleUpdateTask}
                                    className="flex min-h-0 flex-1 flex-col"
                                >
                                    <div className="flex-1 overflow-y-auto bg-slate-50/70 p-6">
                                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="sm:col-span-2">
                                                    <label className="text-[11px] font-semibold text-slate-600">
                                                        Task Title
                                                    </label>

                                                    <input
                                                        type="text"
                                                        name="title"
                                                        value={editTaskForm.title}
                                                        onChange={handleEditTaskChange}
                                                        className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-[11px] font-semibold text-slate-600">
                                                        Work Type
                                                    </label>

                                                    <select
                                                        name="workType"
                                                        value={editTaskForm.workType}
                                                        onChange={handleEditTaskChange}
                                                        className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                    >
                                                        <option value="Client Support">
                                                            Client Support
                                                        </option>
                                                        <option value="Internal Development">
                                                            Internal Development
                                                        </option>
                                                        <option value="Testing">Testing</option>
                                                        <option value="Documentation">
                                                            Documentation
                                                        </option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="text-[11px] font-semibold text-slate-600">
                                                        Project
                                                    </label>

                                                    <select
                                                        name="project"
                                                        value={editTaskForm.project}
                                                        onChange={handleEditTaskChange}
                                                        className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                    >
                                                        <option value="">Select project</option>
                                                        <option value="NexERP">NexERP</option>
                                                        <option value="BillFlow">BillFlow</option>
                                                        <option value="StockPro">StockPro</option>
                                                        <option value="RetailPOS">RetailPOS</option>
                                                        <option value="PayrollIX">PayrollIX</option>
                                                    </select>
                                                </div>

                                                <div className="sm:col-span-2">
                                                    <label className="text-[11px] font-semibold text-slate-600">
                                                        Client
                                                    </label>

                                                    <input
                                                        type="text"
                                                        name="client"
                                                        value={editTaskForm.client}
                                                        onChange={handleEditTaskChange}
                                                        className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-[11px] font-semibold text-slate-600">
                                                        Assigned To
                                                    </label>

                                                    <select
                                                        name="assignedTo"
                                                        value={editTaskForm.assignedTo}
                                                        onChange={(event) => {
                                                            const value = event.target.value;

                                                            const initialsMap = {
                                                                "Akash Pawar": "AP",
                                                                "Sneha Kale": "SK",
                                                                "Rohit More": "RM",
                                                                "Pooja Shinde": "PS",
                                                                "Nilesh Jadhav": "NJ",
                                                            };

                                                            setEditTaskForm((current) => ({
                                                                ...current,
                                                                assignedTo: value,
                                                                initials:
                                                                    initialsMap[value] ||
                                                                    current.initials,
                                                            }));
                                                        }}
                                                        className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                    >
                                                        <option value="">Select employee</option>
                                                        <option value="Akash Pawar">
                                                            Akash Pawar
                                                        </option>
                                                        <option value="Sneha Kale">
                                                            Sneha Kale
                                                        </option>
                                                        <option value="Rohit More">
                                                            Rohit More
                                                        </option>
                                                        <option value="Pooja Shinde">
                                                            Pooja Shinde
                                                        </option>
                                                        <option value="Nilesh Jadhav">
                                                            Nilesh Jadhav
                                                        </option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="text-[11px] font-semibold text-slate-600">
                                                        Priority
                                                    </label>

                                                    <select
                                                        name="priority"
                                                        value={editTaskForm.priority}
                                                        onChange={handleEditTaskChange}
                                                        className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                    >
                                                        <option value="Low">Low</option>
                                                        <option value="Medium">Medium</option>
                                                        <option value="High">High</option>
                                                        <option value="Critical">Critical</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="text-[11px] font-semibold text-slate-600">
                                                        Status
                                                    </label>

                                                    <select
                                                        name="status"
                                                        value={editTaskForm.status}
                                                        onChange={handleEditTaskChange}
                                                        className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                    >
                                                        <option value="Assigned">Assigned</option>
                                                        <option value="In Progress">
                                                            In Progress
                                                        </option>
                                                        <option value="Testing">Testing</option>
                                                        <option value="Blocked">Blocked</option>
                                                        <option value="Completed">Completed</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="text-[11px] font-semibold text-slate-600">
                                                        Due Date
                                                    </label>

                                                    <input
                                                        type="text"
                                                        name="dueDate"
                                                        value={editTaskForm.dueDate}
                                                        onChange={handleEditTaskChange}
                                                        placeholder="14 Jul 2026"
                                                        className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-[11px] font-semibold text-slate-600">
                                                        Estimated Time
                                                    </label>

                                                    <input
                                                        type="text"
                                                        name="estimatedTime"
                                                        value={editTaskForm.estimatedTime}
                                                        onChange={handleEditTaskChange}
                                                        placeholder="2h 30m"
                                                        className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-[11px] font-semibold text-slate-600">
                                                        Spent Time
                                                    </label>

                                                    <input
                                                        type="text"
                                                        name="spentTime"
                                                        value={editTaskForm.spentTime}
                                                        onChange={handleEditTaskChange}
                                                        placeholder="1h 45m"
                                                        className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                    />
                                                </div>

                                                <div className="sm:col-span-2">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[11px] font-semibold text-slate-600">
                                                            Progress
                                                        </label>

                                                        <span className="text-xs font-semibold text-violet-700">
                                                            {editTaskForm.progress}%
                                                        </span>
                                                    </div>

                                                    <input
                                                        type="range"
                                                        name="progress"
                                                        min="0"
                                                        max="100"
                                                        step="5"
                                                        value={editTaskForm.progress}
                                                        onChange={handleEditTaskChange}
                                                        className="mt-3 w-full accent-violet-600"
                                                    />

                                                    <div className="mt-2 flex justify-between text-[10px] text-slate-400">
                                                        <span>0%</span>
                                                        <span>50%</span>
                                                        <span>100%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                Update Preview
                                            </p>

                                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                                <div className="rounded-xl bg-slate-50 p-4">
                                                    <p className="text-[10px] text-slate-400">
                                                        Status
                                                    </p>

                                                    <p className="mt-2 text-xs font-semibold text-slate-900">
                                                        {editTaskForm.status}
                                                    </p>
                                                </div>

                                                <div className="rounded-xl bg-slate-50 p-4">
                                                    <p className="text-[10px] text-slate-400">
                                                        Priority
                                                    </p>

                                                    <p className="mt-2 text-xs font-semibold text-slate-900">
                                                        {editTaskForm.priority}
                                                    </p>
                                                </div>

                                                <div className="rounded-xl bg-slate-50 p-4">
                                                    <p className="text-[10px] text-slate-400">
                                                        Progress
                                                    </p>

                                                    <p className="mt-2 text-xs font-semibold text-violet-700">
                                                        {editTaskForm.progress}%
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {selectedTask.status === "Assigned" && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateTaskStatus(selectedTask.id, "In Progress")
                                                    }
                                                    className="h-10 rounded-xl border border-violet-200 bg-violet-50 px-4 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
                                                >
                                                    Start Work
                                                </button>
                                            )}

                                            {selectedTask.status === "In Progress" && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateTaskStatus(selectedTask.id, "Testing")
                                                        }
                                                        className="h-10 rounded-xl border border-blue-200 bg-blue-50 px-4 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                                                    >
                                                        Send to Testing
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateTaskStatus(selectedTask.id, "Blocked")
                                                        }
                                                        className="h-10 rounded-xl border border-rose-200 bg-rose-50 px-4 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                                                    >
                                                        Mark Blocked
                                                    </button>
                                                </>
                                            )}

                                            {selectedTask.status === "Testing" && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateTaskStatus(selectedTask.id, "Completed")
                                                    }
                                                    className="h-10 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                                >
                                                    Complete Task
                                                </button>
                                            )}

                                            {selectedTask.status === "Blocked" && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateTaskStatus(selectedTask.id, "In Progress")
                                                    }
                                                    className="h-10 rounded-xl border border-violet-200 bg-violet-50 px-4 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
                                                >
                                                    Resume Work
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedTask(null)}
                                                className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                                            >
                                                Close
                                            </button>

                                            <button
                                                type="button"
                                                onClick={openEditTaskDrawer}
                                                className="h-10 rounded-xl bg-violet-600 px-5 text-xs font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
                                            >
                                                Update Task
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </aside>
                        </div>
                    )}{createTaskOpen && (
                        <div className="fixed inset-0 z-[150]">
                            <button
                                type="button"
                                aria-label="Close create task form"
                                onClick={closeCreateTaskDrawer}
                                className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
                            />

                            <aside className="absolute right-0 top-0 flex h-full w-full max-w-[680px] flex-col bg-white shadow-2xl">
                                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-600">
                                            Task Management
                                        </p>

                                        <h2 className="mt-2 text-lg font-semibold text-slate-950">
                                            Create Task
                                        </h2>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Create client support, internal development, testing or documentation work.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={closeCreateTaskDrawer}
                                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                                    >
                                        ×
                                    </button>
                                </div>

                                <form
                                    onSubmit={handleCreateTask}
                                    className="flex min-h-0 flex-1 flex-col"
                                >
                                    <div className="flex-1 overflow-y-auto bg-slate-50/70 p-6">
                                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="sm:col-span-2">
                                                    <label className="text-[11px] font-semibold text-slate-600">
                                                        Task Title
                                                    </label>

                                                    <input
                                                        type="text"
                                                        name="title"
                                                        value={createTaskForm.title}
                                                        onChange={handleCreateTaskChange}
                                                        placeholder="Enter task title"
                                                        className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-[11px] font-semibold text-slate-600">
                                                        Work Type
                                                    </label>

                                                    <select
                                                        name="workType"
                                                        value={createTaskForm.workType}
                                                        onChange={handleCreateTaskChange}
                                                        className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                    >
                                                        <option value="Client Support">
                                                            Client Support
                                                        </option>

                                                        <option value="Internal Development">
                                                            Internal Development
                                                        </option>

                                                        <option value="Testing">
                                                            Testing
                                                        </option>

                                                        <option value="Documentation">
                                                            Documentation
                                                        </option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="text-[11px] font-semibold text-slate-600">
                                                        Priority
                                                    </label>

                                                    <select
                                                        name="priority"
                                                        value={createTaskForm.priority}
                                                        onChange={handleCreateTaskChange}
                                                        className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                    >
                                                        <option value="Low">Low</option>
                                                        <option value="Medium">Medium</option>
                                                        <option value="High">High</option>
                                                        <option value="Critical">Critical</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="text-[11px] font-semibold text-slate-600">
                                                        Client
                                                    </label>

                                                    <input
                                                        type="text"
                                                        name="client"
                                                        value={createTaskForm.client}
                                                        onChange={handleCreateTaskChange}
                                                        placeholder="Enter client name"
                                                        className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-[11px] font-semibold text-slate-600">
                                                        Project
                                                    </label>

                                                    <select
                                                        name="project"
                                                        value={createTaskForm.project}
                                                        onChange={handleCreateTaskChange}
                                                        className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                    >
                                                        <option value="">Select project</option>
                                                        <option value="NexERP">NexERP</option>
                                                        <option value="BillFlow">BillFlow</option>
                                                        <option value="StockPro">StockPro</option>
                                                        <option value="RetailPOS">RetailPOS</option>
                                                        <option value="PayrollIX">PayrollIX</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="text-[11px] font-semibold text-slate-600">
                                                        Assigned To
                                                    </label>

                                                    <select
                                                        name="assignedTo"
                                                        value={createTaskForm.assignedTo}
                                                        onChange={(event) => {
                                                            const value = event.target.value;

                                                            const initialsMap = {
                                                                "Akash Pawar": "AP",
                                                                "Sneha Kale": "SK",
                                                                "Rohit More": "RM",
                                                                "Pooja Shinde": "PS",
                                                                "Nilesh Jadhav": "NJ",
                                                            };

                                                            setCreateTaskForm((current) => ({
                                                                ...current,
                                                                assignedTo: value,
                                                                initials:
                                                                    initialsMap[value] || "",
                                                            }));
                                                        }}
                                                        className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                    >
                                                        <option value="">Select employee</option>
                                                        <option value="Akash Pawar">
                                                            Akash Pawar
                                                        </option>
                                                        <option value="Sneha Kale">
                                                            Sneha Kale
                                                        </option>
                                                        <option value="Rohit More">
                                                            Rohit More
                                                        </option>
                                                        <option value="Pooja Shinde">
                                                            Pooja Shinde
                                                        </option>
                                                        <option value="Nilesh Jadhav">
                                                            Nilesh Jadhav
                                                        </option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="text-[11px] font-semibold text-slate-600">
                                                        Initial Status
                                                    </label>

                                                    <select
                                                        name="status"
                                                        value={createTaskForm.status}
                                                        onChange={handleCreateTaskChange}
                                                        className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                    >
                                                        <option value="Assigned">Assigned</option>
                                                        <option value="In Progress">
                                                            In Progress
                                                        </option>
                                                        <option value="Testing">Testing</option>
                                                        <option value="Blocked">Blocked</option>
                                                        <option value="Completed">Completed</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="text-[11px] font-semibold text-slate-600">
                                                        Due Date
                                                    </label>

                                                    <input
                                                        type="date"
                                                        name="dueDate"
                                                        value={createTaskForm.dueDate}
                                                        onChange={handleCreateTaskChange}
                                                        className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-[11px] font-semibold text-slate-600">
                                                        Estimated Time
                                                    </label>

                                                    <input
                                                        type="text"
                                                        name="estimatedTime"
                                                        value={createTaskForm.estimatedTime}
                                                        onChange={handleCreateTaskChange}
                                                        placeholder="Example: 2h 30m"
                                                        className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                    />
                                                </div>

                                                <div className="sm:col-span-2">
                                                    <label className="text-[11px] font-semibold text-slate-600">
                                                        Description
                                                    </label>

                                                    <textarea
                                                        name="description"
                                                        value={createTaskForm.description}
                                                        onChange={handleCreateTaskChange}
                                                        rows={5}
                                                        placeholder="Describe the task, expected result and important instructions..."
                                                        className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50 p-5">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-600">
                                                Task Preview
                                            </p>

                                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                                <div className="rounded-xl bg-white/80 p-4">
                                                    <p className="text-[10px] text-violet-500">
                                                        Employee
                                                    </p>

                                                    <p className="mt-2 truncate text-xs font-semibold text-violet-950">
                                                        {createTaskForm.assignedTo ||
                                                            "Not selected"}
                                                    </p>
                                                </div>

                                                <div className="rounded-xl bg-white/80 p-4">
                                                    <p className="text-[10px] text-violet-500">
                                                        Priority
                                                    </p>

                                                    <p className="mt-2 text-xs font-semibold text-violet-950">
                                                        {createTaskForm.priority}
                                                    </p>
                                                </div>

                                                <div className="rounded-xl bg-white/80 p-4">
                                                    <p className="text-[10px] text-violet-500">
                                                        Status
                                                    </p>

                                                    <p className="mt-2 text-xs font-semibold text-violet-950">
                                                        {createTaskForm.status}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
                                        <button
                                            type="button"
                                            onClick={closeCreateTaskDrawer}
                                            className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="submit"
                                            className="h-10 rounded-xl bg-violet-600 px-5 text-xs font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
                                        >
                                            Create Task
                                        </button>
                                    </div>
                                </form>
                            </aside>
                        </div>
                    )}
                </div>
            </div>
        );
    }