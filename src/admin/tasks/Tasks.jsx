import { useEffect, useState } from "react";
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
    Link,
    Clock,
    Calendar,
    User,
    Building,
    FolderKanban,
    Award,
    Target,
    CheckSquare,
    Copy,
    ExternalLink,
X,
ChevronDown,
Layers3,
Sparkles,
} from "lucide-react";

import API_URL from "../../config/api";

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
    if (status === "Waiting") {
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

export default function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [clients, setClients] = useState([]);

    const [tasksLoading, setTasksLoading] = useState(true);
    const [tasksError, setTasksError] = useState("");

    const [employeesLoading, setEmployeesLoading] = useState(false);
    const [clientsLoading, setClientsLoading] = useState(false);

    const [savingTask, setSavingTask] = useState(false);
    const [updatingTaskId, setUpdatingTaskId] = useState(null);
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
    const [taskMenu, setTaskMenu] = useState({
        task: null,
        top: 0,
        left: 0,
    });
    const [deletingTaskId, setDeletingTaskId] = useState(null);

    const [taskChecklists, setTaskChecklists] = useState([]);
    const [checklistText, setChecklistText] = useState("");

    const [projects, setProjects] = useState([]);
    const [products, setProducts] = useState([]);

    const [productsLoading, setProductsLoading] = useState(false);
    const [productsError, setProductsError] = useState("");

    const [projectsLoading, setProjectsLoading] = useState(false);
    const [projectsError, setProjectsError] = useState("");

    const [taskPriorities, setTaskPriorities] = useState([]);
    const [taskStatuses, setTaskStatuses] = useState([]);

    const [taskSettingsLoading, setTaskSettingsLoading] = useState(false);
    const [taskSettingsError, setTaskSettingsError] = useState("");

    const [createTaskForm, setCreateTaskForm] = useState({
        title: "",
        workType: "Client Support",
        taskFor: "Project",
        generalTaskFor: "",
        clientId: "",
        client: "Internal Development",
        productId: "",
        projectId: "",
        projectCode: "",
        projectName: "",
        assignedEmployeeId: "",
        assignedEmployeeCode: "",
        assignedEmployeeName: "",
        priority: "",
        status: "",
        dueDate: "",
        estimatedTime: "",
        description: "",
    });

    const [editTaskForm, setEditTaskForm] = useState({
        title: "",
        workType: "",
        clientId: "",
        client: "",
        productId: "",
        projectId: "",
        projectCode: "",
        projectName: "",
        assignedEmployeeId: "",
        assignedEmployeeCode: "",
        assignedEmployeeName: "",
        priority: "",
        status: "",
        dueDate: "",
        estimatedTime: "",
        spentTime: "",
        progress: 0,
        description: "",
    });

    const taskComments = Array.isArray(selectedTask?.comments) ? selectedTask.comments : [];
    const [commentText, setCommentText] = useState("");
    const [taskFiles, setTaskFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const taskTimeline = Array.isArray(selectedTask?.timeline) ? selectedTask.timeline : [];

    const [workLogs, setWorkLogs] = useState([]);
    const [workLogForm, setWorkLogForm] = useState({
        date: "",
        startTime: "",
        endTime: "",
        duration: "",
        note: "",
    });

    const totalTasks = tasks.length;
    const inProgressCount = tasks.filter((task) => task.status === "In Progress").length;
    const completedCount = tasks.filter((task) => task.status === "Completed").length;
    const waitingCount = tasks.filter((task) => task.status === "Waiting").length;

    const filteredTasks = tasks.filter((task) => {
        const search = searchValue.trim().toLowerCase();
        const matchesSearch =
            !search ||
            [
                task.taskNo,
                task.title,
                task.workType,
                task.client,
                task.projectCode,
                task.projectName,
                task.assignedEmployeeCode,
                task.assignedEmployeeName,
                task.priority,
                task.status,
            ].some((value) => String(value || "").toLowerCase().includes(search));

        const matchesStatus = statusFilter === "All" || task.status === statusFilter;
        const matchesPriority = priorityFilter === "All" || task.priority === priorityFilter;
        const matchesEmployee =
            employeeFilter === "All" || String(task.assignedEmployeeId) === String(employeeFilter);

        return matchesSearch && matchesStatus && matchesPriority && matchesEmployee;
    });

    const selectedCreateClient = clients.find((client) => String(client.id) === String(createTaskForm.clientId));
    const selectedCreateClientProducts = selectedCreateClient
        ? selectedCreateClient.products
            .map((product) => {
                if (typeof product === "string") {
                    return { id: "", productName: product };
                }
                return {
                    id: product._id || product.id || "",
                    productName: product.productName || product.name || "",
                };
            })
            .filter((product) => product.productName)
        : [];

    const getAuthToken = () => {
        return localStorage.getItem("client-connect-token") || sessionStorage.getItem("client-connect-token") || "";
    };

    const selectedEditClient = clients.find((client) => String(client.id) === String(editTaskForm.clientId));
    const selectedEditClientProducts = selectedEditClient
        ? selectedEditClient.products
            .map((product) => {
                if (typeof product === "string") {
                    return { id: "", productName: product };
                }
                return {
                    id: product._id || product.id || "",
                    productName: product.productName || product.name || "",
                };
            })
            .filter((product) => product.productName)
        : [];

    const formatMinutes = (minutes) => {
        const totalMinutes = Math.max(Number(minutes || 0), 0);
        if (totalMinutes === 0) return "0m";
        const hours = Math.floor(totalMinutes / 60);
        const remainingMinutes = totalMinutes % 60;
        if (hours === 0) return `${remainingMinutes}m`;
        if (remainingMinutes === 0) return `${hours}h`;
        return `${hours}h ${remainingMinutes}m`;
    };

    const estimatedTimeToMinutes = (value) => {
        const text = String(value || "").trim().toLowerCase();
        if (!text) return 0;
        const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*h/);
        const minuteMatch = text.match(/(\d+)\s*m/);
        let totalMinutes = 0;
        if (hourMatch) totalMinutes += Math.round(Number(hourMatch[1]) * 60);
        if (minuteMatch) totalMinutes += Number(minuteMatch[1]);
        if (!hourMatch && !minuteMatch) {
            const numericValue = Number(text);
            if (Number.isFinite(numericValue)) totalMinutes = Math.round(numericValue * 60);
        }
        return Math.max(totalMinutes, 0);
    };

    const formatDateForDisplay = (dateValue) => {
        if (!dateValue) return "—";
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) return "—";
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatDateForInput = (dateValue) => {
        if (!dateValue) return "";
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) return "";
        return date.toISOString().slice(0, 10);
    };

    const normalizeProjectFromApi = (project = {}) => ({
        ...project,
        id: project._id || project.id || "",
        projectCode: project.projectCode || "",
        projectName: project.projectName || "",
        projectType: project.projectType || "Internal Development",
        clientId: project.clientId ? String(project.clientId) : "",
        clientCode: project.clientCode || "",
        clientName: project.clientName || "",
        productId: project.productId ? String(project.productId) : "",
        productCode: project.productCode || "",
        productName: project.productName || "",
        status: project.status || "Planned",
        priority: project.priority || "",
    });

    const normalizeTaskFromApi = (task) => {
        const assignedEmployeeName = task.assignedEmployeeName || "";
        return {
            ...task,
            id: task._id || task.id,
            taskNo: task.taskCode || task.taskNo || "",
            clientId: task.clientId ? String(task.clientId) : "",
            productId: task.productId ? String(task.productId) : "",
            client: task.clientName || task.client || "Internal Development",
            projectId: task.projectId ? String(task.projectId) : "",
            projectCode: task.projectCode || "",
            projectName: task.projectName || "",
            project: task.projectName || task.project || "",
            assignedEmployeeId: task.assignedEmployeeId?._id || task.assignedEmployeeId ? String(task.assignedEmployeeId?._id || task.assignedEmployeeId) : "",
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
            comments: Array.isArray(task.comments) ? task.comments : [],
            timeline: Array.isArray(task.timeline) ? task.timeline : [],
            attachments: Array.isArray(task.attachments) ? task.attachments : [],
        };
    };

    const normalizeEmployeeFromApi = (employee) => ({
        ...employee,
        id: employee._id || employee.id,
        name: employee.name || "",
        initials: employee.initials ||
            String(employee.name || "")
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((word) => word.charAt(0).toUpperCase())
                .join(""),
        isActive: employee.isActive !== false,
    });

    const normalizeClientFromApi = (client) => ({
        ...client,
        id: client._id || client.id,
        code: client.clientCode || client.code || "",
        companyName: client.companyName || "",
        products: Array.isArray(client.products) ? client.products : [],
    });

    const loadTasks = async () => {
        try {
            setTasksLoading(true);
            setTasksError("");
            const response = await fetch(`${API_URL}/api/admin/tasks`, {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${getAuthToken()}`,
                },
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to load tasks.");
            }
            const normalizedTasks = Array.isArray(result.data) ? result.data.map(normalizeTaskFromApi) : [];
            setTasks(normalizedTasks);
            setSelectedTask((current) => {
                if (!current) return null;
                return normalizedTasks.find((task) => String(task.id) === String(current.id)) || null;
            });
        } catch (error) {
            console.error("Load tasks error:", error);
            setTasksError(error.message || "Unable to load tasks.");
            setTasks([]);
        } finally {
            setTasksLoading(false);
        }
    };

    const openTaskDetails = async (task) => {
        const taskId = task?._id || task?.id;
        if (!taskId) {
            alert("Task ID is missing.");
            return;
        }
        try {
            setUpdatingTaskId(taskId);
            const response = await fetch(`${API_URL}/api/admin/task/${taskId}`, {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${getAuthToken()}`,
                },
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to load task details.");
            }
            const freshTask = normalizeTaskFromApi(result.data);
            setSelectedTask(freshTask);
            setTaskFiles(
                (freshTask.attachments || []).map((file) => ({
                    id: file._id,
                    taskId: freshTask.id,
                    name: file.fileName,
                    type: file.fileType || "File",
                    size: file.fileSize ? `${Math.max(1, Math.round(file.fileSize / 1024))} KB` : "—",
                    uploadedBy: file.uploadedByName || "Administrator",
                    uploadedAt: file.uploadedAt ? new Date(file.uploadedAt).toLocaleString("en-IN") : "—",
                    fileUrl: file.fileUrl,
                }))
            );
            setTaskDetailsTab("overview");
            setTasks((current) =>
                current.map((item) => (String(item.id) === String(taskId) ? freshTask : item))
            );
        } catch (error) {
            console.error("Load task details error:", error);
            alert(error.message || "Unable to load task details.");
        } finally {
            setUpdatingTaskId(null);
        }
    };

    const closeTaskDetails = () => {
        setSelectedTask(null);
        setTaskDetailsTab("overview");
    };

    const loadEmployees = async () => {
        try {
            setEmployeesLoading(true);
            const response = await fetch(`${API_URL}/api/employee/employees`, {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${getAuthToken()}`,
                },
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to load employees.");
            }
            const normalizedEmployees = Array.isArray(result.data)
                ? result.data.map(normalizeEmployeeFromApi).filter((employee) => employee.id && employee.isActive)
                : [];
            setEmployees(normalizedEmployees);
        } catch (error) {
            console.error("Load employees error:", error);
            setEmployees([]);
        } finally {
            setEmployeesLoading(false);
        }
    };

    const loadClients = async () => {
        try {
            setClientsLoading(true);
            const response = await fetch(`${API_URL}/api/admin/clients`, {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${getAuthToken()}`,
                },
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to load clients.");
            }
            const normalizedClients = Array.isArray(result.data)
                ? result.data.map(normalizeClientFromApi).filter((client) => client.id && client.companyName)
                : [];
            setClients(normalizedClients);
        } catch (error) {
            console.error("Load clients error:", error);
            setClients([]);
        } finally {
            setClientsLoading(false);
        }
    };

    const loadProducts = async () => {
        try {
            setProductsLoading(true);
            setProductsError("");
            const response = await fetch(`${API_URL}/api/admin/products`, {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${getAuthToken()}`,
                },
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to load products.");
            }
            const normalizedProducts = Array.isArray(result.data)
                ? result.data
                    .filter((product) => product.status === "Active")
                    .map((product) => ({
                        id: product._id || product.id || "",
                        productCode: product.productCode || "",
                        productName: product.productName || "",
                    }))
                    .filter((product) => product.id && product.productName)
                    .sort((a, b) => a.productName.localeCompare(b.productName))
                : [];
            setProducts(normalizedProducts);
        } catch (error) {
            console.error("Load products error:", error);
            setProducts([]);
            setProductsError(error.message || "Unable to load products.");
        } finally {
            setProductsLoading(false);
        }
    };

    const loadProjects = async () => {
        try {
            setProjectsLoading(true);
            setProjectsError("");
            const response = await fetch(`${API_URL}/api/admin/projects`, {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${getAuthToken()}`,
                },
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to load projects.");
            }
            const normalizedProjects = Array.isArray(result.data)
                ? result.data
                    .map(normalizeProjectFromApi)
                    .filter((project) => project.id && !["Completed", "Cancelled"].includes(project.status))
                    .sort((a, b) => a.projectName.localeCompare(b.projectName))
                : [];
            setProjects(normalizedProjects);
        } catch (error) {
            console.error("Load projects error:", error);
            setProjects([]);
            setProjectsError(error.message || "Unable to load projects.");
        } finally {
            setProjectsLoading(false);
        }
    };

    const loadTaskSettings = async () => {
        try {
            setTaskSettingsLoading(true);
            setTaskSettingsError("");
            const response = await fetch(`${API_URL}/api/settings`, {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${getAuthToken()}`,
                },
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to load task settings.");
            }
            const settings = result.data || {};
            const priorities = Array.isArray(settings.priorities)
                ? settings.priorities
                    .filter((item) => item.status === "Active")
                    .map((item) => ({
                        id: item._id || item.id || item.name,
                        name: String(item.name || "").trim(),
                        color: item.color || "Slate",
                        responseHours: Number(item.responseHours || 0),
                    }))
                    .filter((item) => item.name)
                : [];
            const statuses = Array.isArray(settings.taskStatuses)
                ? settings.taskStatuses
                    .filter((item) => item.status === "Active")
                    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
                    .map((item) => ({
                        id: item._id || item.id || item.name,
                        name: String(item.name || "").trim(),
                        color: item.color || "Slate",
                        order: Number(item.order || 0),
                        isFinal: Boolean(item.isFinal),
                    }))
                    .filter((item) => item.name)
                : [];
            setTaskPriorities(priorities);
            setTaskStatuses(statuses);
            setCreateTaskForm((current) => ({
                ...current,
                priority: current.priority || priorities[0]?.name || "",
                status: current.status || statuses[0]?.name || "",
            }));
        } catch (error) {
            console.error("Load task settings error:", error);
            setTaskPriorities([]);
            setTaskStatuses([]);
            setTaskSettingsError(error.message || "Unable to load task settings.");
        } finally {
            setTaskSettingsLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();
        loadEmployees();
        loadClients();
        loadProjects();
        loadProducts();
        loadTaskSettings();
    }, []);

    useEffect(() => {
        if (!taskMenu.task) return undefined;
        const handleOutsideClick = () => closeTaskActionMenu();
        const handleEscape = (event) => {
            if (event.key === "Escape") closeTaskActionMenu();
        };
        const handleViewportChange = () => closeTaskActionMenu();
        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", handleEscape);
        window.addEventListener("resize", handleViewportChange);
        window.addEventListener("scroll", handleViewportChange, true);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("keydown", handleEscape);
            window.removeEventListener("resize", handleViewportChange);
            window.removeEventListener("scroll", handleViewportChange, true);
        };
    }, [taskMenu.task]);

    const handleWorkLogChange = (event) => {
        const { name, value } = event.target;
        setWorkLogForm((current) => ({ ...current, [name]: value }));
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
            employee: selectedTask.assignedEmployeeName || "Not assigned",
            initials: selectedTask.initials,
            date: new Date(`${workLogForm.date}T00:00:00`).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }),
            startTime: workLogForm.startTime || "—",
            endTime: workLogForm.endTime || "—",
            duration: workLogForm.duration.trim(),
            note: workLogForm.note.trim(),
        };
        setWorkLogs((current) => [newLog, ...current]);
        setWorkLogForm({
            date: "",
            startTime: "",
            endTime: "",
            duration: "",
            note: "",
        });
    };

    const handleAddComment = async (event) => {
        event.preventDefault();
        const taskId = selectedTask?._id || selectedTask?.id;
        const message = commentText.trim();
        if (!taskId) {
            alert("Task ID is missing.");
            return;
        }
        if (!message) {
            alert("Please enter a comment.");
            return;
        }
        try {
            setSavingTask(true);
            const response = await fetch(`${API_URL}/api/admin/task/${taskId}/comment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getAuthToken()}`,
                },
                body: JSON.stringify({ message }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to add comment.");
            }
            const updatedTask = normalizeTaskFromApi(result.data);
            setSelectedTask(updatedTask);
            setTasks((current) =>
                current.map((task) => (String(task.id) === String(taskId) ? updatedTask : task))
            );
            setCommentText("");
        } catch (error) {
            console.error("Add comment error:", error);
            alert(error.message || "Unable to add comment.");
        } finally {
            setSavingTask(false);
        }
    };

    const handleTaskFileSelect = (event) => {
        const file = event.target.files?.[0];
        if (!file || !selectedTask) return;
        const fileNameParts = file.name.split(".");
        const extension = fileNameParts.length > 1 ? fileNameParts.pop().toUpperCase() : "FILE";
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

    const handleAddTaskFile = async () => {
        if (!selectedTask) return;
        if (!selectedFile) {
            alert("Please select a file.");
            return;
        }
        try {
            const formData = new FormData();
            formData.append("attachment", selectedFile.file);
            const response = await fetch(`${API_URL}/api/admin/task/${selectedTask.id}/attachment`, {
                method: "POST",
                headers: { Authorization: `Bearer ${getAuthToken()}` },
                body: formData,
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || "Unable to upload attachment.");
            const updatedTask = normalizeTaskFromApi(result.data);
            setSelectedTask(updatedTask);
            setTaskFiles(
                (updatedTask.attachments || []).map((file) => ({
                    id: file._id,
                    taskId: updatedTask.id,
                    name: file.fileName,
                    type: file.fileType || "File",
                    size: file.fileSize ? `${Math.max(1, Math.round(file.fileSize / 1024))} KB` : "—",
                    uploadedBy: file.uploadedByName || "Administrator",
                    uploadedAt: file.uploadedAt ? new Date(file.uploadedAt).toLocaleString("en-IN") : "—",
                    fileUrl: file.fileUrl,
                }))
            );
            setSelectedFile(null);
            const input = document.getElementById("task-file-input");
            if (input) input.value = "";
        } catch (error) {
            alert(error.message);
        }
    };

    const openEditTaskDrawer = () => {
        setCreateTaskOpen(false);
        if (!selectedTask) return;
        const employeeId = selectedTask.assignedEmployeeId ? String(selectedTask.assignedEmployeeId) : "";
        const clientId = selectedTask.clientId ? String(selectedTask.clientId) : "";
        const productId = selectedTask.productId ? String(selectedTask.productId) : "";
        const projectId = selectedTask.projectId ? String(selectedTask.projectId) : "";
        setEditTaskForm({
            title: selectedTask.title || "",
            workType: selectedTask.workType || "Client Support",
            clientId,
            client: selectedTask.client || "Internal Development",
            productId,
            projectId,
            projectCode: selectedTask.projectCode || "",
            projectName: selectedTask.projectName || selectedTask.project || "",
            assignedEmployeeId: employeeId,
            assignedEmployeeCode: selectedTask.assignedEmployeeCode || "",
            assignedEmployeeName: selectedTask.assignedEmployeeName || "",
            priority: selectedTask.priority || taskPriorities[0]?.name || "",
            status: selectedTask.status || taskStatuses[0]?.name || "",
            dueDate: selectedTask.dueDateValue || "",
            estimatedTime: selectedTask.estimatedTime || "",
            spentTime: selectedTask.spentTime || "0m",
            progress: Number(selectedTask.progress || 0),
            description: selectedTask.description || "",
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
            [name]: name === "progress" ? Number(value) : value,
        }));
    };

    const handleUpdateTask = async (event) => {
        event.preventDefault();
        if (!selectedTask) return;
        const taskId = selectedTask._id || selectedTask.id;
        const title = editTaskForm.title.trim();
        if (!taskId) {
            alert("Task ID is missing.");
            return;
        }
        if (!title) {
            alert("Please enter task title.");
            return;
        }
        if (!editTaskForm.projectId) {
            alert("Please select a project.");
            return;
        }
        if (!editTaskForm.assignedEmployeeId) {
            alert("Please select an employee.");
            return;
        }
        if (!editTaskForm.dueDate) {
            alert("Please select due date.");
            return;
        }
        const estimatedMinutes = estimatedTimeToMinutes(editTaskForm.estimatedTime);
        if (estimatedMinutes <= 0) {
            alert("Enter estimated time like 2h, 1h 30m or 0.5.");
            return;
        }
        try {
            setSavingTask(true);
            const updateResponse = await fetch(`${API_URL}/api/admin/task/${taskId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getAuthToken()}`,
                },
                body: JSON.stringify({
                    title,
                    description: editTaskForm.description.trim(),
                    workType: editTaskForm.workType,
                    clientId: editTaskForm.clientId || null,
                    clientName: editTaskForm.client || "Internal Development",
                    productId: editTaskForm.productId || null,
                    projectId: editTaskForm.projectId,
                    assignedEmployeeId: editTaskForm.assignedEmployeeId,
                    priority: editTaskForm.priority,
                    dueDate: editTaskForm.dueDate,
                    estimatedMinutes,
                }),
            });
            const updateResult = await updateResponse.json();
            if (!updateResponse.ok || !updateResult.success) {
                throw new Error(updateResult.message || "Unable to update task.");
            }
            let finalTask = normalizeTaskFromApi(updateResult.data);
            if (editTaskForm.status !== selectedTask.status) {
                const selectedStatusSetting = taskStatuses.find(
                    (statusItem) => statusItem.name === editTaskForm.status
                );
                const nextProgress = selectedStatusSetting?.isFinal
                    ? 100
                    : Number(editTaskForm.progress || finalTask.progress || 0);
                const statusResponse = await fetch(`${API_URL}/api/admin/task/${taskId}/status`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${getAuthToken()}`,
                    },
                    body: JSON.stringify({
                        status: editTaskForm.status,
                        progress: nextProgress,
                    }),
                });
                const statusResult = await statusResponse.json();
                if (!statusResponse.ok || !statusResult.success) {
                    throw new Error(
                        statusResult.message || "Task details were updated, but status could not be changed."
                    );
                }
                finalTask = normalizeTaskFromApi(statusResult.data);
            }
            setTasks((current) =>
                current.map((task) => (String(task.id) === String(taskId) ? finalTask : task))
            );
            setSelectedTask(finalTask);
            setEditTaskOpen(false);
            await loadEmployees();
            alert("Task updated successfully.");
        } catch (error) {
            console.error("Update task error:", error);
            alert(error.message || "Unable to update task.");
        } finally {
            setSavingTask(false);
        }
    };

    const handleCreateTaskChange = (event) => {
        const { name, value } = event.target;
        setCreateTaskForm((current) => ({ ...current, [name]: value }));
    };

    const resetCreateTaskForm = () => {
        setCreateTaskForm({
            title: "",
            workType: "Client Support",
            clientId: "",
            client: "Internal Development",
            productId: "",
            projectId: "",
            projectCode: "",
            projectName: "",
            assignedEmployeeId: "",
            assignedEmployeeCode: "",
            assignedEmployeeName: "",
            priority: taskPriorities[0]?.name || "",
            status: taskStatuses[0]?.name || "",
            dueDate: "",
            estimatedTime: "",
            description: "",
            taskFor: "Project",
            generalTaskFor: "",
        });
    };

    const closeCreateTaskDrawer = () => {
        if (savingTask) return;
        setCreateTaskOpen(false);
        setEditTaskOpen(false);
        resetCreateTaskForm();
    };

    const handleCreateTask = async (event) => {
        event.preventDefault();
        const title = createTaskForm.title.trim();
        if (createTaskForm.taskFor === "Project" && !createTaskForm.projectId) {
            alert("Please select a project.");
            return;
        }
        if (createTaskForm.taskFor === "General" && !createTaskForm.generalTaskFor.trim()) {
            alert("Please enter who or what this general task is for.");
            return;
        }
        if (createTaskForm.taskFor === "Product" && !createTaskForm.productId) {
            alert("Please select a product.");
            return;
        }
        if (!createTaskForm.priority) {
            alert("Please select a priority.");
            return;
        }
        if (!createTaskForm.status) {
            alert("Please select a task status.");
            return;
        }
        if (!title) {
            alert("Please enter task title.");
            return;
        }
        if (!createTaskForm.assignedEmployeeId) {
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
        const estimatedMinutes = estimatedTimeToMinutes(createTaskForm.estimatedTime);
        if (estimatedMinutes <= 0) {
            alert("Enter estimated time like 2h, 1h 30m or 0.5.");
            return;
        }
        const selectedEmployee = employees.find(
            (employee) => String(employee.id) === String(createTaskForm.assignedEmployeeId)
        );
        if (!selectedEmployee) {
            alert("Selected employee was not found. Please select again.");
            return;
        }
        if (selectedEmployee.status === "Leave" || selectedEmployee.status === "Inactive") {
            alert(`${selectedEmployee.name} is currently ${selectedEmployee.status}.`);
            return;
        }
        try {
            setSavingTask(true);
            const response = await fetch(`${API_URL}/api/admin/task`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getAuthToken()}`,
                },
                body: JSON.stringify({
                    title,
                    description: createTaskForm.description.trim(),
                    workType: createTaskForm.workType,
                    taskFor: createTaskForm.taskFor,
                    generalTaskFor: createTaskForm.generalTaskFor.trim(),
                    clientId: createTaskForm.clientId || null,
                    clientName: createTaskForm.client || "Internal Development",
                    productId: createTaskForm.productId || null,
                    projectId: createTaskForm.projectId || null,
                    assignedEmployeeId: createTaskForm.assignedEmployeeId,
                    priority: createTaskForm.priority,
                    status: createTaskForm.status,
                    dueDate: createTaskForm.dueDate,
                    estimatedMinutes,
                }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to create task.");
            }
            const savedTask = normalizeTaskFromApi(result.data);
            setTasks((current) => [savedTask, ...current]);
            setEditTaskOpen(false);
            setCreateTaskOpen(false);
            setSelectedTask(savedTask);
            setTaskDetailsTab("overview");
            resetCreateTaskForm();
            alert("Task created successfully.");
            await loadEmployees();
        } catch (error) {
            console.error("Create task error:", error);
            alert(error.message || "Unable to create task.");
        } finally {
            setSavingTask(false);
        }
    };

    const updateTaskStatus = async (taskId, nextStatus) => {
        if (!taskId) {
            alert("Task ID is missing.");
            return;
        }
        const selectedStatusSetting = taskStatuses.find((item) => item.name === nextStatus);
        const nextProgress = selectedStatusSetting?.isFinal ? 100 : Number(selectedTask?.progress || 0);
        try {
            setUpdatingTaskId(taskId);
            const response = await fetch(`${API_URL}/api/admin/task/${taskId}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getAuthToken()}`,
                },
                body: JSON.stringify({
                    status: nextStatus,
                    progress: nextProgress,
                }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to update task status.");
            }
            const updatedTask = normalizeTaskFromApi(result.data);
            setTasks((current) =>
                current.map((task) => (String(task.id) === String(taskId) ? updatedTask : task))
            );
            setSelectedTask((current) => (current && String(current.id) === String(taskId) ? updatedTask : current));
            await loadEmployees();
        } catch (error) {
            console.error("Update task status error:", error);
            alert(error.message || "Unable to update task status.");
        } finally {
            setUpdatingTaskId(null);
        }
    };

    const handleDeleteTask = async (task) => {
        const taskId = task._id || task.id;
        if (!taskId) {
            alert("Task ID is missing.");
            return;
        }
        const confirmed = window.confirm(`Delete task "${task.title}" ?`);
        if (!confirmed) return;
        try {
            setDeletingTaskId(taskId);
            const response = await fetch(`${API_URL}/api/admin/task/${taskId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${getAuthToken()}`,
                },
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to delete task.");
            }
            setTasks((current) => current.filter((t) => String(t.id) !== String(taskId)));
            if (selectedTask && String(selectedTask.id) === String(taskId)) {
                setSelectedTask(null);
            }
            await loadEmployees();
            alert("Task deleted successfully.");
        } catch (error) {
            console.error(error);
            alert(error.message);
        } finally {
            setDeletingTaskId(null);
            closeTaskActionMenu();
        }
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
        setTaskChecklists((current) => [...current, newItem]);
        setChecklistText("");
    };

    const toggleChecklistItem = (itemId) => {
        setTaskChecklists((current) =>
            current.map((item) =>
                item.id === itemId ? { ...item, completed: !item.completed } : item
            )
        );
    };

    const removeChecklistItem = (itemId) => {
        setTaskChecklists((current) => current.filter((item) => item.id !== itemId));
    };

    const openTaskActionMenu = (event, task) => {
        event.stopPropagation();
        const buttonRect = event.currentTarget.getBoundingClientRect();
        const menuWidth = 176;
        const menuHeight = 145;
        const viewportPadding = 12;
        let left = buttonRect.right - menuWidth;
        let top = buttonRect.bottom + 6;
        if (left < viewportPadding) {
            left = viewportPadding;
        }
        if (left + menuWidth > window.innerWidth - viewportPadding) {
            left = window.innerWidth - menuWidth - viewportPadding;
        }
        if (top + menuHeight > window.innerHeight - viewportPadding) {
            top = buttonRect.top - menuHeight - 6;
        }
        setTaskMenu((current) => {
            if (current.task && String(current.task.id) === String(task.id)) {
                return { task: null, top: 0, left: 0 };
            }
            return { task, top, left };
        });
    };

    const closeTaskActionMenu = () => {
        setTaskMenu({ task: null, top: 0, left: 0 });
    };

    // Render task list (existing code)
   const renderTaskList = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30">
        <div className="enterprise-page mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white px-6 py-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:px-7 lg:px-8">

    <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-100/70 blur-3xl" />

    <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-blue-100/50 blur-3xl" />

    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

        <div className="flex items-start gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/20">
                <ListTodo size={21} />
            </div>

            <div>
                <div className="flex items-center gap-2">

                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600">
                        Work Management
                    </span>

                    <span className="h-1 w-1 rounded-full bg-slate-300" />

                    <span className="text-[10px] font-semibold text-slate-400">
                        Operations
                    </span>
                </div>

                <h1 className="mt-2 text-2xl font-bold tracking-[-0.035em] text-slate-950 sm:text-[28px]">
                    Tasks & Assignments
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Plan client work, assign employees, track deadlines,
                    monitor progress and manage project execution from one workspace.
                </p>
            </div>
        </div>

        <div className="flex items-center gap-3">

            <div className="hidden rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-right xl:block">

                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Total Work
                </p>

                <p className="mt-0.5 text-lg font-bold text-slate-900">
                    {totalTasks}
                </p>
            </div>

            <button
                type="button"
                onClick={() => {
                    setSelectedTask(null);
                    setEditTaskOpen(false);
                    setCreateTaskOpen(false);
                    resetCreateTaskForm();

                    setTimeout(() => {
                        setCreateTaskOpen(true);
                    }, 0);
                }}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-violet-600/20 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
                <Plus size={17} />
                Create Task
            </button>
        </div>
    </div>
</section>

            {tasksLoading && (
                <div className="enterprise-surface mt-6 flex items-center gap-3 px-5 py-4">
                    <RefreshCw size={19} className="animate-spin text-violet-600" />
                    <p className="text-sm font-semibold text-slate-600">
                        Loading tasks from MongoDB...
                    </p>
                </div>
            )}

            {tasksError && !tasksLoading && (
                <div className="enterprise-empty-state mt-6 flex items-center justify-between gap-4 border-rose-200 bg-rose-50 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle size={20} className="text-rose-600" />
                        <p className="text-sm font-semibold text-rose-700">{tasksError}</p>
                    </div>
                    <button
                        type="button"
                        onClick={loadTasks}
                        className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white"
                    >
                        Retry
                    </button>
                </div>
            )}

<div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_16px_42px_rgba(15,23,42,0.09)]">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Total Tasks
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-slate-950">{totalTasks}</p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                            <ListTodo size={19} />
                        </div>
                    </div>
                    <p className="mt-4 text-xs text-slate-500">All active and completed work</p>
                </div>

                <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_16px_42px_rgba(15,23,42,0.09)]">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                In Progress
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-slate-950">{inProgressCount}</p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                            <Timer size={19} />
                        </div>
                    </div>
                    <p className="mt-4 text-xs text-amber-600">Currently being worked on</p>
                </div>

                <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_16px_42px_rgba(15,23,42,0.09)]">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Completed
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-slate-950">{completedCount}</p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                            <CheckCircle2 size={19} />
                        </div>
                    </div>
                    <p className="mt-4 text-xs text-emerald-600">Successfully completed</p>
                </div>

                <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_16px_42px_rgba(15,23,42,0.09)]">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Waiting
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-slate-950">{waitingCount}</p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                            <AlertCircle size={19} />
                        </div>
                    </div>
                    <p className="mt-4 text-xs text-rose-600">Waiting for client or dependency</p>
                </div>
            </div>

            <div className="enterprise-surface relative mt-6 overflow-visible">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-950">All Tasks</h3>
                        <p className="mt-1 text-xs text-slate-500">{filteredTasks.length} tasks found</p>
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
                                    className={`h-8 rounded-lg px-3 text-xs font-semibold transition ${
                                        taskView === view.id
                                            ? "bg-slate-900 text-white"
                                            : "text-slate-500 hover:bg-slate-100"
                                    }`}
                                >
                                    {view.label}
                                </button>
                            ))}
                        </div>
                        <div className="relative w-full sm:w-72">
                            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                placeholder="Search task no, title, client, project, employee..."
                                className="enterprise-input h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
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
                                        className="enterprise-input h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs"
                                    >
                                        <option value="All">All</option>
                                        {taskStatuses.map((status) => (
                                            <option key={status.id} value={status.name}>
                                                {status.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2 block text-[11px] font-semibold text-slate-600">
                                        Priority
                                    </label>
                                    <select
                                        name="priority"
                                        value={priorityFilter}
                                        onChange={(e) => setPriorityFilter(e.target.value)}
                                        disabled={taskSettingsLoading}
                                        className="enterprise-input h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs"
                                    >
                                        <option value="All">All</option>
                                        {taskPriorities.map((priority) => (
                                            <option key={priority.id} value={priority.name}>
                                                {priority.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2 block text-[11px] font-semibold text-slate-600">
                                        Employee
                                    </label>
                                    <select
                                        value={employeeFilter}
                                        onChange={(event) => setEmployeeFilter(event.target.value)}
                                        className="enterprise-input h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs"
                                    >
                                        <option value="All">All Employees</option>
                                        {employees.map((employee) => (
                                            <option key={String(employee.id)} value={String(employee.id)}>
                                                {employee.name}
                                                {employee.employeeCode ? ` (${employee.employeeCode})` : ""}
                                            </option>
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
                    <div className="relative overflow-x-auto overflow-y-visible">
                        <table className="enterprise-table min-w-[1380px] w-full">
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
                                        onClick={() => openTaskDetails(task)}
                                        className="cursor-pointer border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/70"
                                    >
                                        <td className="px-5 py-4">
                                            <p className="text-xs font-semibold text-slate-950">{task.title}</p>
                                            <p className="mt-1 text-[10px] font-semibold text-violet-600">
                                                {task.taskNo}
                                            </p>
                                            <p className="mt-1 text-[10px] text-slate-500">{task.workType}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-xs font-semibold text-slate-800">{task.client}</p>
                                            <p className="mt-1 text-[10px] text-slate-500">{task.project}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-[10px] font-semibold text-white">
                                                    {task.initials}
                                                </div>
                                                <span className="text-xs font-semibold text-slate-700">
                                                    {task.assignedEmployeeName || "Not assigned"}
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
                                                <CalendarDays size={14} className="text-slate-400" />
                                                {task.dueDate}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="w-28">
                                                <div className="mb-1 flex items-center justify-between text-[10px]">
                                                    <span className="text-slate-400">Progress</span>
                                                    <span className="font-semibold text-slate-700">
                                                        {task.progress}%
                                                    </span>
                                                </div>
                                                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                                    <div
                                                        className="h-full rounded-full bg-violet-500"
                                                        style={{ width: `${task.progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <Clock3 size={14} className="text-slate-400" />
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
                                                    disabled={updatingTaskId === task.id}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        openTaskDetails(task);
                                                    }}
                                                    className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                                                >
                                                    {updatingTaskId === task.id ? (
                                                        <RefreshCw size={14} className="animate-spin" />
                                                    ) : (
                                                        <BriefcaseBusiness size={14} />
                                                    )}
                                                    Open
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-label="Open task actions"
                                                    onClick={(event) => openTaskActionMenu(event, task)}
                                                    className={`flex h-9 w-9 items-center justify-center rounded-lg border text-slate-500 transition ${
                                                        taskMenu.task &&
                                                        String(taskMenu.task.id) === String(task.id)
                                                            ? "border-violet-300 bg-violet-50 text-violet-700"
                                                            : "border-slate-200 hover:bg-slate-50"
                                                    }`}
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
                            const columnTasks = filteredTasks.filter((task) => task.status === column.id);
                            return (
                                <div key={column.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70">
                                    <div className="border-b border-slate-200 bg-white px-4 py-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${column.badgeClass}`}>
                                                        {column.title}
                                                    </span>
                                                    <span className="text-xs font-semibold text-slate-500">
                                                        {columnTasks.length}
                                                    </span>
                                                </div>
                                                <p className="mt-2 text-[11px] text-slate-500">{column.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="min-h-[440px] space-y-3 p-3">
                                        {columnTasks.length > 0 ? (
                                            columnTasks.map((task) => (
                                                <button
                                                    key={task.id}
                                                    type="button"
                                                    onClick={() => openTaskDetails(task)}
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
                                                            <span className="text-slate-400">Client</span>
                                                            <span className="max-w-[160px] truncate font-semibold text-slate-700">
                                                                {task.client}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-3 text-[10px]">
                                                            <span className="text-slate-400">Project</span>
                                                            <span className="font-semibold text-slate-700">
                                                                {task.project}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-3 text-[10px]">
                                                            <span className="text-slate-400">Assigned</span>
                                                            <span className="font-semibold text-slate-700">
                                                                {task.assignedEmployeeName || "Not assigned"}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-3 text-[10px]">
                                                            <span className="text-slate-400">Due</span>
                                                            <span className="font-semibold text-slate-700">
                                                                {task.dueDate}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4">
                                                        <div className="mb-2 flex items-center justify-between text-[10px]">
                                                            <span className="text-slate-400">Progress</span>
                                                            <span className="font-semibold text-slate-700">
                                                                {task.progress}%
                                                            </span>
                                                        </div>
                                                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                                            <div
                                                                className="h-full rounded-full bg-violet-500"
                                                                style={{ width: `${task.progress}%` }}
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
                )}

                {taskView === "timeline" && (
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
                                        const startColumn = Math.min(Math.max(dayNumber - 13, 1), 7);
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
                                                        {task.assignedEmployeeName || "Not assigned"}
                                                    </p>
                                                </div>
                                                {Array.from({ length: 7 }).map((_, index) => (
                                                    <div
                                                        key={index}
                                                        className="relative min-h-[76px] border-l border-slate-100 px-2 py-3"
                                                    >
                                                        {index + 1 === startColumn && (
                                                            <div
                                                                className={`rounded-xl px-3 py-2 ${
                                                                    task.status === "Completed"
                                                                        ? "bg-emerald-100 text-emerald-800"
                                                                        : task.status === "Waiting"
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
                                        <div className="enterprise-empty-state mx-5 my-5 px-5 py-14 text-center">
                                            <p className="text-sm font-semibold text-slate-700">No tasks found</p>
                                            <p className="mt-2 text-xs text-slate-500">
                                                Change the filters to view task timeline data.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
        </div>
    );

    // Render full-page task details view
    const renderTaskDetails = () => {
        if (!selectedTask) return null;

        return (
            <div className="enterprise-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={closeTaskDetails}
                                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition"
                            >
                                <ArrowLeft size={18} />
                                Back to Tasks
                            </button>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                                {selectedTask.title}
                            </h1>
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
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                            <span className="font-semibold text-violet-600">{selectedTask.taskNo}</span>
                            <span>•</span>
                            <span>{selectedTask.client}</span>
                            <span>•</span>
                            <span>{selectedTask.project}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1.5">
                                <User size={14} className="text-slate-400" />
                                {selectedTask.assignedEmployeeName || "Not assigned"}
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={openEditTaskDrawer}
                            className="flex h-9 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
                        >
                            <Edit2 size={15} />
                            Edit Task
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                const statusOptions = taskStatuses
                                    .filter((s) => s.name !== selectedTask.status)
                                    .map((s) => s.name);
                                if (statusOptions.length === 0) {
                                    alert("No other statuses available.");
                                    return;
                                }
                                const nextStatus = prompt(
                                    `Current status: ${selectedTask.status}\nEnter new status (${statusOptions.join(", ")}):`,
                                    statusOptions[0]
                                );
                                if (nextStatus && statusOptions.includes(nextStatus)) {
                                    updateTaskStatus(selectedTask.id, nextStatus);
                                } else if (nextStatus !== null) {
                                    alert(`Invalid status. Choose from: ${statusOptions.join(", ")}`);
                                }
                            }}
                            className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                            <CheckCircle2 size={15} />
                            Change Status
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                const employeeOptions = employees
                                    .filter((e) => e.id !== selectedTask.assignedEmployeeId)
                                    .map((e) => `${e.name} (${e.id})`);
                                if (employeeOptions.length === 0) {
                                    alert("No other employees available.");
                                    return;
                                }
                                const selection = prompt(
                                    `Current: ${selectedTask.assignedEmployeeName || "Not assigned"}\nEnter employee ID to reassign:\n${employeeOptions.join("\n")}`,
                                    employees[0]?.id
                                );
                                if (selection) {
                                    const found = employees.find((e) => String(e.id) === String(selection));
                                    if (found) {
                                        // Quick reassign - update via API
                                        const taskId = selectedTask._id || selectedTask.id;
                                        fetch(`${API_URL}/api/admin/task/${taskId}`, {
                                            method: "PUT",
                                            headers: {
                                                "Content-Type": "application/json",
                                                Authorization: `Bearer ${getAuthToken()}`,
                                            },
                                            body: JSON.stringify({
                                                assignedEmployeeId: found.id,
                                            }),
                                        })
                                            .then((res) => res.json())
                                            .then((result) => {
                                                if (result.success) {
                                                    const updated = normalizeTaskFromApi(result.data);
                                                    setSelectedTask(updated);
                                                    setTasks((prev) =>
                                                        prev.map((t) =>
                                                            String(t.id) === String(taskId) ? updated : t
                                                        )
                                                    );
                                                    alert(`Task reassigned to ${found.name}`);
                                                } else {
                                                    alert("Failed to reassign task.");
                                                }
                                            })
                                            .catch(() => alert("Error reassigning task."));
                                    } else {
                                        alert("Employee not found.");
                                    }
                                }
                            }}
                            className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                            <UserPlus size={15} />
                            Assign
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (selectedTask.assignedEmployeeName && selectedTask.assignedEmployeeName !== "Not assigned") {
                                    alert(`Email notification would be sent to ${selectedTask.assignedEmployeeName}`);
                                } else {
                                    alert("No employee assigned to notify.");
                                }
                            }}
                            className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                            <Mail size={15} />
                            Notify
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDeleteTask(selectedTask)}
                            className="flex h-9 items-center gap-2 rounded-xl border border-rose-200 px-4 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                        >
                            <Trash2 size={15} />
                            Delete
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                    Status
                                </p>
                                <p className="mt-2 text-sm font-semibold text-slate-950">{selectedTask.status}</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                                <Activity size={19} />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                    Priority
                                </p>
                                <p className="mt-2 text-sm font-semibold text-slate-950">{selectedTask.priority}</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                                <AlertCircle size={19} />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                    Progress
                                </p>
                                <p className="mt-2 text-sm font-semibold text-slate-950">{selectedTask.progress}%</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                <Target size={19} />
                            </div>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-violet-500"
                                style={{ width: `${selectedTask.progress}%` }}
                            />
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                    Due Date
                                </p>
                                <p className="mt-2 text-sm font-semibold text-slate-950">{selectedTask.dueDate}</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                                <Calendar size={19} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mt-6 border-b border-slate-200 bg-white">
                    <div className="flex gap-6 overflow-x-auto">
                        {[
                            { id: "overview", label: "Overview", icon: FileText },
                            { id: "timeline", label: "Timeline", icon: Clock },
                            { id: "activity", label: "Activity", icon: Activity },
                            { id: "attachments", label: "Attachments", icon: Link },
                            { id: "comments", label: "Comments", icon: MessageSquare },
                        ].map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setTaskDetailsTab(tab.id)}
                                    className={`relative flex items-center gap-2 whitespace-nowrap py-4 text-xs font-semibold transition ${
                                        taskDetailsTab === tab.id
                                            ? "text-violet-700"
                                            : "text-slate-500 hover:text-slate-900"
                                    }`}
                                >
                                    <Icon size={16} />
                                    {tab.label}
                                    {taskDetailsTab === tab.id && (
                                        <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-violet-600" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="mt-6">
                    {taskDetailsTab === "overview" && (
                        <div className="space-y-6">
                            {/* Two-column info cards */}
                            <div className="grid gap-6 lg:grid-cols-2">
                                {/* Task Information */}
                                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                                    <h3 className="text-sm font-semibold text-slate-950">Task Information</h3>
                                    <div className="mt-4 space-y-4">
                                        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                                            <span className="text-xs text-slate-500">Task Number</span>
                                            <span className="text-xs font-semibold text-slate-900">
                                                {selectedTask.taskNo}
                                            </span>
                                        </div>
                                        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                                            <span className="text-xs text-slate-500">Title</span>
                                            <span className="text-xs font-semibold text-slate-900">
                                                {selectedTask.title}
                                            </span>
                                        </div>
                                        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                                            <span className="text-xs text-slate-500">Priority</span>
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ring-inset ${getPriorityClasses(
                                                    selectedTask.priority
                                                )}`}
                                            >
                                                {selectedTask.priority}
                                            </span>
                                        </div>
                                        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                                            <span className="text-xs text-slate-500">Status</span>
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ring-inset ${getStatusClasses(
                                                    selectedTask.status
                                                )}`}
                                            >
                                                {selectedTask.status}
                                            </span>
                                        </div>
                                        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                                            <span className="text-xs text-slate-500">Due Date</span>
                                            <span className="text-xs font-semibold text-slate-900">
                                                {selectedTask.dueDate}
                                            </span>
                                        </div>
                                        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                                            <span className="text-xs text-slate-500">Estimated Time</span>
                                            <span className="text-xs font-semibold text-slate-900">
                                                {selectedTask.estimatedTime}
                                            </span>
                                        </div>
                                        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                                            <span className="text-xs text-slate-500">Time Spent</span>
                                            <span className="text-xs font-semibold text-slate-900">
                                                {selectedTask.spentTime}
                                            </span>
                                        </div>
                                        <div className="flex items-start justify-between">
                                            <span className="text-xs text-slate-500">Progress</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-24 h-2 overflow-hidden rounded-full bg-slate-100">
                                                    <div
                                                        className="h-full rounded-full bg-violet-500"
                                                        style={{ width: `${selectedTask.progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-semibold text-slate-900">
                                                    {selectedTask.progress}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Assignment Information */}
                                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                                    <h3 className="text-sm font-semibold text-slate-950">Assignment Information</h3>
                                    <div className="mt-4 space-y-4">
                                        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                                            <span className="text-xs text-slate-500">Assigned Employee</span>
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-[9px] font-semibold text-white">
                                                    {selectedTask.initials}
                                                </div>
                                                <span className="text-xs font-semibold text-slate-900">
                                                    {selectedTask.assignedEmployeeName || "Not assigned"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                                            <span className="text-xs text-slate-500">Client</span>
                                            <span className="text-xs font-semibold text-slate-900">
                                                {selectedTask.client}
                                            </span>
                                        </div>
                                        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                                            <span className="text-xs text-slate-500">Project</span>
                                            <span className="text-xs font-semibold text-slate-900">
                                                {selectedTask.project}
                                            </span>
                                        </div>
                                        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                                            <span className="text-xs text-slate-500">Work Type</span>
                                            <span className="text-xs font-semibold text-slate-900">
                                                {selectedTask.workType}
                                            </span>
                                        </div>
                                        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                                            <span className="text-xs text-slate-500">Created</span>
                                            <span className="text-xs font-semibold text-slate-900">
                                                {selectedTask.createdAt
                                                    ? new Date(selectedTask.createdAt).toLocaleDateString("en-GB", {
                                                        day: "2-digit",
                                                        month: "short",
                                                        year: "numeric",
                                                    })
                                                    : "—"}
                                            </span>
                                        </div>
                                        <div className="flex items-start justify-between">
                                            <span className="text-xs text-slate-500">Last Updated</span>
                                            <span className="text-xs font-semibold text-slate-900">
                                                {selectedTask.updatedAt
                                                    ? new Date(selectedTask.updatedAt).toLocaleDateString("en-GB", {
                                                        day: "2-digit",
                                                        month: "short",
                                                        year: "numeric",
                                                    })
                                                    : "—"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-6">
                                <h3 className="text-sm font-semibold text-slate-950">Description</h3>
                                <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                    {selectedTask.description || "No detailed task description has been added."}
                                </div>
                            </div>

                            {/* Time Tracking Summary */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-6">
                                <h3 className="text-sm font-semibold text-slate-950">Time Tracking</h3>
                                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                                    <div className="rounded-xl bg-slate-50 p-4">
                                        <p className="text-[10px] text-slate-400">Estimated</p>
                                        <p className="mt-2 text-lg font-semibold text-slate-950">
                                            {selectedTask.estimatedTime}
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-4">
                                        <p className="text-[10px] text-slate-400">Spent</p>
                                        <p className="mt-2 text-lg font-semibold text-slate-950">
                                            {selectedTask.spentTime}
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-4">
                                        <p className="text-[10px] text-slate-400">Remaining</p>
                                        <p className="mt-2 text-lg font-semibold text-slate-950">
                                            {formatMinutes(Math.max(0, selectedTask.estimatedMinutes - selectedTask.spentMinutes))}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Checklist Summary */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-6">
                                <h3 className="text-sm font-semibold text-slate-950">Checklist</h3>
                                {(() => {
                                    const taskItems = taskChecklists.filter(
                                        (item) => item.taskId === selectedTask.id
                                    );
                                    const completedItems = taskItems.filter((item) => item.completed).length;
                                    const percentage = taskItems.length > 0
                                        ? Math.round((completedItems / taskItems.length) * 100)
                                        : 0;
                                    return (
                                        <>
                                            <div className="mt-3 flex items-center justify-between">
                                                <span className="text-xs text-slate-500">
                                                    {completedItems} of {taskItems.length} completed
                                                </span>
                                                <span className="text-xs font-semibold text-violet-700">
                                                    {percentage}%
                                                </span>
                                            </div>
                                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className="h-full rounded-full bg-violet-500"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            {taskItems.length > 0 ? (
                                                <div className="mt-4 space-y-2">
                                                    {taskItems.slice(0, 5).map((item) => (
                                                        <div key={item.id} className="flex items-center gap-2">
                                                            <span className={`text-xs ${item.completed ? "text-slate-400 line-through" : "text-slate-700"}`}>
                                                                {item.title}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {taskItems.length > 5 && (
                                                        <p className="text-xs text-slate-400">
                                                            +{taskItems.length - 5} more items
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="mt-4 text-xs text-slate-400">No checklist items</p>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {taskDetailsTab === "timeline" && (
                        <div className="rounded-2xl border border-slate-200 bg-white">
                            <div className="border-b border-slate-200 px-6 py-4">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                    Task Timeline
                                </p>
                                <h3 className="mt-1 text-sm font-semibold text-slate-950">Complete activity history</h3>
                            </div>
                            <div className="p-6">
                                {taskTimeline.length > 0 ? (
                                    <div className="relative space-y-6">
                                        <div className="absolute bottom-3 left-[17px] top-3 w-px bg-slate-200" />
                                        {[...taskTimeline]
                                            .reverse()
                                            .map((event) => {
                                                const eventId = event._id || event.id || `${event.action}-${event.createdAt}`;
                                                const eventType = String(event.action || "Activity").toLowerCase();
                                                return (
                                                    <div key={eventId} className="relative flex gap-4">
                                                        <div
                                                            className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold ${
                                                                eventType.includes("created")
                                                                    ? "bg-slate-100 text-slate-700"
                                                                    : eventType.includes("assigned")
                                                                    ? "bg-blue-100 text-blue-700"
                                                                    : eventType.includes("status")
                                                                    ? "bg-violet-100 text-violet-700"
                                                                    : eventType.includes("comment")
                                                                    ? "bg-cyan-100 text-cyan-700"
                                                                    : "bg-emerald-100 text-emerald-700"
                                                            }`}
                                                        >
                                                            {String(event.action || "AC").slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0 flex-1 border-b border-slate-100 pb-5">
                                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                                <div>
                                                                    <p className="text-xs font-semibold text-slate-900">
                                                                        {event.action || "Task activity"}
                                                                    </p>
                                                                    <p className="mt-2 text-xs leading-5 text-slate-600">
                                                                        {event.description || "Task information was updated."}
                                                                    </p>
                                                                    <p className="mt-2 text-[10px] font-semibold text-violet-600">
                                                                        {event.performedByName || "System"}
                                                                    </p>
                                                                </div>
                                                                <span className="shrink-0 text-[10px] text-slate-400">
                                                                    {event.createdAt
                                                                        ? new Date(event.createdAt).toLocaleString("en-IN", {
                                                                            day: "2-digit",
                                                                            month: "short",
                                                                            year: "numeric",
                                                                            hour: "2-digit",
                                                                            minute: "2-digit",
                                                                        })
                                                                        : "—"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center">
                                        <p className="text-sm font-semibold text-slate-700">No timeline events</p>
                                        <p className="mt-2 text-xs text-slate-500">Task activity will appear here.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {taskDetailsTab === "activity" && (
                        <div className="rounded-2xl border border-slate-200 bg-white">
                            <div className="border-b border-slate-200 px-6 py-4">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                    Recent Activity
                                </p>
                                <h3 className="mt-1 text-sm font-semibold text-slate-950">Latest updates and changes</h3>
                            </div>
                            <div className="p-6">
                                {taskTimeline.length > 0 ? (
                                    <div className="space-y-4">
                                        {taskTimeline.slice(0, 10).map((event) => {
                                            const eventId = event._id || event.id || `${event.action}-${event.createdAt}`;
                                            return (
                                                <div key={eventId} className="flex items-start gap-3 rounded-xl border border-slate-100 p-4">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[9px] font-bold text-slate-700">
                                                        {String(event.action || "AC").slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-semibold text-slate-900">
                                                            {event.action || "Activity"}
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-600">
                                                            {event.description || "Task updated"}
                                                        </p>
                                                        <div className="mt-2 flex items-center gap-3">
                                                            <span className="text-[10px] font-semibold text-violet-600">
                                                                {event.performedByName || "System"}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400">
                                                                {event.createdAt
                                                                    ? new Date(event.createdAt).toLocaleString("en-IN", {
                                                                        day: "2-digit",
                                                                        month: "short",
                                                                        hour: "2-digit",
                                                                        minute: "2-digit",
                                                                    })
                                                                    : "—"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {taskTimeline.length > 10 && (
                                            <p className="text-center text-xs text-slate-400">
                                                +{taskTimeline.length - 10} more activities
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center">
                                        <p className="text-sm font-semibold text-slate-700">No activity recorded</p>
                                        <p className="mt-2 text-xs text-slate-500">Updates will appear here as they happen.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {taskDetailsTab === "attachments" && (
                        <div className="space-y-6">
                            {/* Upload section */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-6">
                                <h3 className="text-sm font-semibold text-slate-950">Upload Attachment</h3>
                                <p className="mt-1 text-xs text-slate-500">
                                    Add screenshots, documents or supporting files
                                </p>
                                <label
                                    htmlFor="task-file-input-details"
                                    className="mt-4 flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-violet-300 hover:bg-violet-50/40"
                                >
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                                        <Plus size={18} />
                                    </div>
                                    <p className="mt-3 text-sm font-semibold text-slate-800">Select a file</p>
                                    <p className="mt-2 text-xs text-slate-500">
                                        Images, PDF, Excel, Word, text or ZIP files
                                    </p>
                                    <input
                                        id="task-file-input-details"
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
                                                    const input = document.getElementById("task-file-input-details");
                                                    if (input) input.value = "";
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

                            {/* File list */}
                            <div className="rounded-2xl border border-slate-200 bg-white">
                                <div className="border-b border-slate-200 px-6 py-4">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                        Attachments
                                    </p>
                                    <h3 className="mt-1 text-sm font-semibold text-slate-950">
                                        Files linked to this task
                                    </h3>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {taskFiles.filter((file) => file.taskId === selectedTask.id).length > 0 ? (
                                        taskFiles
                                            .filter((file) => file.taskId === selectedTask.id)
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
                                                                {file.size} · Uploaded by {file.uploadedBy}
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
                                                                current.filter((item) => item.id !== file.id)
                                                            )
                                                        }
                                                        className="h-9 rounded-lg border border-rose-200 bg-rose-50 px-3 text-[10px] font-semibold text-rose-700 transition hover:bg-rose-100"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ))
                                    ) : (
                                        <div className="px-6 py-12 text-center">
                                            <p className="text-sm font-semibold text-slate-700">No files uploaded</p>
                                            <p className="mt-2 text-xs text-slate-500">
                                                Upload the first attachment for this task.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {taskDetailsTab === "comments" && (
                        <div className="space-y-6">
                            {/* Add comment */}
                            <form onSubmit={handleAddComment} className="rounded-2xl border border-slate-200 bg-white p-6">
                                <h3 className="text-sm font-semibold text-slate-950">Add Comment</h3>
                                <p className="mt-1 text-xs text-slate-500">Share an update or instruction</p>
                                <textarea
                                    value={commentText}
                                    onChange={(event) => setCommentText(event.target.value)}
                                    rows={4}
                                    placeholder="Write a comment for this task..."
                                    className="mt-4 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
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

                            {/* Comments list */}
                            <div className="rounded-2xl border border-slate-200 bg-white">
                                <div className="border-b border-slate-200 px-6 py-4">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                        Conversation
                                    </p>
                                    <h3 className="mt-1 text-sm font-semibold text-slate-950">
                                        Task comments and updates
                                    </h3>
                                </div>
                                <div className="space-y-3 p-6">
                                    {taskComments.length > 0 ? (
                                        taskComments.map((comment) => (
                                            <div
                                                key={comment._id || comment.id}
                                                className="rounded-xl border border-slate-200 bg-white p-4"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-[10px] font-semibold text-white">
                                                        {String(comment.authorName || "Admin")
                                                            .split(" ")
                                                            .filter(Boolean)
                                                            .slice(0, 2)
                                                            .map((word) => word.charAt(0).toUpperCase())
                                                            .join("")}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-semibold text-slate-900">
                                                            {comment.authorName || "Admin"}
                                                        </p>
                                                        <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-600">
                                                            {comment.message}
                                                        </p>
                                                        <p className="mt-2 text-[10px] text-slate-400">
                                                            {comment.createdAt
                                                                ? new Date(comment.createdAt).toLocaleString("en-IN", {
                                                                    day: "2-digit",
                                                                    month: "short",
                                                                    year: "numeric",
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })
                                                                : "—"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
                                            <p className="text-sm font-semibold text-slate-700">No comments yet</p>
                                            <p className="mt-2 text-xs text-slate-500">
                                                Add the first comment for this task.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50/50">
            {selectedTask ? renderTaskDetails() : renderTaskList()}

            {/* Task action menu portal */}
            {taskMenu.task &&
                createPortal(
                    <>
                        <button
                            type="button"
                            aria-label="Close task actions"
                            onClick={closeTaskActionMenu}
                            className="enterprise-backdrop fixed inset-0 z-[9998] cursor-default bg-transparent"
                        />
                        <div
                            onMouseDown={(event) => event.stopPropagation()}
                            className="enterprise-modal fixed z-[9999] w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-2xl"
                            style={{
                                top: `${taskMenu.top}px`,
                                left: `${taskMenu.left}px`,
                            }}
                        >
                            <button
                                type="button"
                                onClick={async () => {
                                    const selectedMenuTask = taskMenu.task;
                                    closeTaskActionMenu();
                                    await openTaskDetails(selectedMenuTask);
                                }}
                                className="flex w-full items-center px-4 py-2.5 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Open Task
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    const selectedMenuTask = taskMenu.task;
                                    closeTaskActionMenu();
                                    await openTaskDetails(selectedMenuTask);
                                    const employeeId = selectedMenuTask.assignedEmployeeId
                                        ? String(selectedMenuTask.assignedEmployeeId)
                                        : "";
                                    const clientId = selectedMenuTask.clientId
                                        ? String(selectedMenuTask.clientId)
                                        : "";
                                    const productId = selectedMenuTask.productId
                                        ? String(selectedMenuTask.productId)
                                        : "";
                                    setEditTaskForm({
                                        title: selectedMenuTask.title || "",
                                        workType: selectedMenuTask.workType || "Client Support",
                                        clientId,
                                        client: selectedMenuTask.client || "Internal Development",
                                        productId,
                                        projectId: selectedMenuTask.projectId || "",
                                        projectCode: selectedMenuTask.projectCode || "",
                                        projectName: selectedMenuTask.projectName || selectedMenuTask.project || "",
                                        assignedEmployeeId: employeeId,
                                        assignedEmployeeCode: selectedMenuTask.assignedEmployeeCode || "",
                                        assignedEmployeeName: selectedMenuTask.assignedEmployeeName || "",
                                        priority: selectedMenuTask.priority || "Medium",
                                        status: selectedMenuTask.status || "Assigned",
                                        dueDate: selectedMenuTask.dueDateValue || "",
                                        estimatedTime: selectedMenuTask.estimatedTime || "",
                                        spentTime: selectedMenuTask.spentTime || "0m",
                                        progress: Number(selectedMenuTask.progress || 0),
                                        description: selectedMenuTask.description || "",
                                    });
                                    setSelectedTask(selectedMenuTask);
                                    setEditTaskOpen(true);
                                }}
                                className="flex w-full items-center px-4 py-2.5 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Edit Task
                            </button>
                            <div className="my-1 border-t border-slate-100" />
                            <button
                                type="button"
                                disabled={deletingTaskId === taskMenu.task.id}
                                onClick={async () => {
                                    const selectedMenuTask = taskMenu.task;
                                    closeTaskActionMenu();
                                    await handleDeleteTask(selectedMenuTask);
                                }}
                                className="flex w-full items-center px-4 py-2.5 text-left text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                            >
                                {deletingTaskId === taskMenu.task.id ? "Deleting..." : "Delete Task"}
                            </button>
                        </div>
                    </>,
                    document.body
                )}

            {/* Edit Task Drawer */}
            {editTaskOpen && selectedTask && (
                <div className="fixed inset-0 z-[140]">
                    <button
                        type="button"
                        aria-label="Close edit task form"
                        onClick={closeEditTaskDrawer}
                        className="enterprise-backdrop absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
                    />
                    <aside className="enterprise-drawer absolute right-0 top-0 flex h-full w-full max-w-[680px] flex-col bg-white shadow-2xl">
                        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-600">
                                    Task Management
                                </p>
                                <h2 className="mt-2 text-lg font-semibold text-slate-950">Update Task</h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    {selectedTask.taskNo} · Update assignment, status, progress and due details.
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
                        <form onSubmit={handleUpdateTask} className="flex min-h-0 flex-1 flex-col">
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
                                                <option value="Client Support">Client Support</option>
                                                <option value="Internal Development">Internal Development</option>
                                                <option value="Development">Development</option>
                                                <option value="Testing">Testing</option>
                                                <option value="Installation">Installation</option>
                                                <option value="Training">Training</option>
                                                <option value="Documentation">Documentation</option>
                                                <option value="Internal Work">Internal Work</option>
                                                <option value="Follow-up">Follow-up</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-600">
                                                Project
                                            </label>
                                            <select
                                                name="projectId"
                                                value={editTaskForm.projectId}
                                                onChange={handleEditTaskChange}
                                                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            >
                                                <option value="">Select project</option>
                                                {projects.map((project) => (
                                                    <option key={project.id} value={project.id}>
                                                        {project.projectCode} - {project.projectName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-600">
                                                Client
                                            </label>
                                            <select
                                                value={editTaskForm.clientId}
                                                disabled={clientsLoading}
                                                onChange={(event) => {
                                                    const clientId = event.target.value;
                                                    const selectedClient = clients.find(
                                                        (client) => String(client.id) === String(clientId)
                                                    );
                                                    setEditTaskForm((current) => ({
                                                        ...current,
                                                        clientId,
                                                        client: selectedClient ? selectedClient.companyName : "Internal Development",
                                                        productId: "",
                                                    }));
                                                }}
                                                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:opacity-60"
                                            >
                                                <option value="">Internal Development</option>
                                                {clients.map((client) => (
                                                    <option key={String(client.id)} value={String(client.id)}>
                                                        {client.companyName}
                                                        {client.code ? ` (${client.code})` : ""}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-600">
                                                Assigned To
                                            </label>
                                            <select
                                                name="assignedEmployeeId"
                                                value={editTaskForm.assignedEmployeeId}
                                                disabled={employeesLoading}
                                                onChange={handleEditTaskChange}
                                                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:opacity-60"
                                            >
                                                <option value="">
                                                    {employeesLoading ? "Loading employees..." : "Select employee"}
                                                </option>
                                                {employees.map((employee) => (
                                                    <option
                                                        key={String(employee.id)}
                                                        value={String(employee.id)}
                                                        disabled={
                                                            employee.status === "Leave" || employee.status === "Inactive"
                                                        }
                                                    >
                                                        {employee.name}
                                                        {employee.employeeCode ? ` (${employee.employeeCode})` : ""}
                                                        {employee.status ? ` - ${employee.status}` : ""}
                                                    </option>
                                                ))}
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
                                                <option value="In Progress">In Progress</option>
                                                <option value="Testing">Testing</option>
                                                <option value="Waiting">Waiting</option>
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
                                                value={editTaskForm.dueDate}
                                                onChange={handleEditTaskChange}
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
                                        <div className="sm:col-span-2">
                                            <label className="text-[11px] font-semibold text-slate-600">
                                                Description
                                            </label>
                                            <textarea
                                                name="description"
                                                value={editTaskForm.description}
                                                onChange={handleEditTaskChange}
                                                rows={4}
                                                placeholder="Describe the task, expected result and important instructions..."
                                                className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
                                <button
                                    type="button"
                                    onClick={closeEditTaskDrawer}
                                    className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingTask}
                                    className="flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
                                >
                                    {savingTask ? (
                                        <>
                                            <RefreshCw size={15} className="animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        "Update Task"
                                    )}
                                </button>
                            </div>
                        </form>
                    </aside>
                </div>
            )}

            {/* Create Task Drawer */}
           {/* =========================================================
    PREMIUM CREATE TASK DRAWER
========================================================= */}
{createTaskOpen && (
    <div className="fixed inset-0 z-[150]">
        {/* Backdrop */}
        <button
            type="button"
            aria-label="Close create task drawer"
            onClick={closeCreateTaskDrawer}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[3px]"
        />

        {/* Drawer */}
        <aside className="absolute inset-y-0 right-0 flex w-full max-w-[940px] flex-col overflow-hidden border-l border-slate-200 bg-[#f8fafc] shadow-[-30px_0_90px_rgba(15,23,42,0.22)]">

            {/* HEADER */}
            <header className="relative shrink-0 overflow-hidden border-b border-slate-200 bg-white">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-600 via-indigo-500 to-blue-500" />

                <div className="flex min-h-[104px] items-center justify-between gap-5 px-6 py-5 lg:px-8">
                    <div className="flex min-w-0 items-center gap-4">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/20">
                            <ListTodo size={21} />
                        </div>

                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600">
                                    Work Management
                                </span>

                                <span className="h-1 w-1 rounded-full bg-slate-300" />

                                <span className="text-[10px] font-medium text-slate-400">
                                    New Assignment
                                </span>
                            </div>

                            <h2 className="mt-1 text-xl font-bold tracking-[-0.025em] text-slate-950">
                                Create New Task
                            </h2>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                Define the work, assignment context, responsible employee
                                and target completion schedule.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={closeCreateTaskDrawer}
                        disabled={savingTask}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>
            </header>

            <form
                onSubmit={handleCreateTask}
                className="flex min-h-0 flex-1 flex-col"
            >
                {/* SCROLL CONTENT */}
                <div className="flex-1 overflow-y-auto">
                    <div className="space-y-6 p-5 sm:p-6 lg:p-8">

                        {/* =====================================================
                            SECTION 1 - TASK DEFINITION
                        ===================================================== */}
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_6px_25px_rgba(15,23,42,0.04)]">

                            <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                                    <FileText size={17} />
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Task Definition
                                    </h3>

                                    <p className="mt-0.5 text-[11px] text-slate-500">
                                        Specify what work needs to be completed.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-5 p-5">

                                {/* Title */}
                                <div>
                                    <div className="mb-2 flex items-center justify-between gap-4">
                                        <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                                            Task Title
                                            <span className="ml-1 text-rose-500">*</span>
                                        </label>

                                        <span className="text-[10px] text-slate-400">
                                            Use a short actionable title
                                        </span>
                                    </div>

                                    <input
                                        required
                                        name="title"
                                        value={createTaskForm.title}
                                        onChange={handleCreateTaskChange}
                                        placeholder="Example: Fix GST calculation in sales invoice"
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition placeholder:font-normal placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    />
                                </div>

                                <div className="grid gap-5 md:grid-cols-2">

                                    {/* Work Type */}
                                    <div>
                                        <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                                            Work Type
                                        </label>

                                        <div className="relative">
                                            <BriefcaseBusiness
                                                size={16}
                                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                            />

                                            <select
                                                name="workType"
                                                value={createTaskForm.workType}
                                                onChange={handleCreateTaskChange}
                                                className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            >
                                                <option value="Client Support">
                                                    Client Support
                                                </option>

                                                <option value="Internal Development">
                                                    Internal Development
                                                </option>

                                                <option value="Implementation">
                                                    Implementation
                                                </option>

                                                <option value="Testing">
                                                    Testing
                                                </option>

                                                <option value="Training">
                                                    Training
                                                </option>

                                                <option value="Research">
                                                    Research
                                                </option>
                                            </select>

                                            <ChevronDown
                                                size={15}
                                                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                            />
                                        </div>
                                    </div>

                                    {/* Task For */}
                                    <div>
                                        <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                                            Task For
                                        </label>

                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                {
                                                    id: "Project",
                                                    label: "Project",
                                                },
                                                {
                                                    id: "Product",
                                                    label: "Product",
                                                },
                                                {
                                                    id: "General",
                                                    label: "General",
                                                },
                                            ].map((item) => (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() =>
                                                        setCreateTaskForm((current) => ({
                                                            ...current,
                                                            taskFor: item.id,
                                                            generalTaskFor:
                                                                item.id === "General"
                                                                    ? current.generalTaskFor
                                                                    : "",
                                                        }))
                                                    }
                                                    className={`h-12 rounded-xl border text-xs font-bold transition ${
                                                        createTaskForm.taskFor === item.id
                                                            ? "border-violet-300 bg-violet-50 text-violet-700 ring-2 ring-violet-100"
                                                            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                                    }`}
                                                >
                                                    {item.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                                        Description
                                    </label>

                                    <textarea
                                        name="description"
                                        value={createTaskForm.description}
                                        onChange={handleCreateTaskChange}
                                        rows={5}
                                        placeholder="Explain the expected result, scope, important instructions and acceptance criteria..."
                                        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* =====================================================
                            SECTION 2 - WORK CONTEXT
                        ===================================================== */}
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_6px_25px_rgba(15,23,42,0.04)]">

                            <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <FolderKanban size={17} />
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Work Context
                                    </h3>

                                    <p className="mt-0.5 text-[11px] text-slate-500">
                                        Link this task to the appropriate client,
                                        product or project.
                                    </p>
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="grid gap-5 md:grid-cols-2">

                                    {/* Client */}
                                    <div>
                                        <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                                            Client
                                        </label>

                                        <div className="relative">
                                            <Building
                                                size={16}
                                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                            />

                                            <select
                                                name="clientId"
                                                value={createTaskForm.clientId}
                                                disabled={clientsLoading}
                                                onChange={(event) => {
                                                    const clientId =
                                                        event.target.value;

                                                    const selectedClient =
                                                        clients.find(
                                                            (client) =>
                                                                String(client.id) ===
                                                                String(clientId)
                                                        );

                                                    setCreateTaskForm(
                                                        (current) => ({
                                                            ...current,
                                                            clientId,
                                                            client:
                                                                selectedClient?.companyName ||
                                                                "Internal Development",
                                                            productId: "",
                                                            projectId: "",
                                                            projectCode: "",
                                                            projectName: "",
                                                        })
                                                    );
                                                }}
                                                className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-50"
                                            >
                                                <option value="">
                                                    Internal Development / No Client
                                                </option>

                                                {clients.map((client) => (
                                                    <option
                                                        key={client.id}
                                                        value={client.id}
                                                    >
                                                        {client.companyName}
                                                        {client.code
                                                            ? ` (${client.code})`
                                                            : ""}
                                                    </option>
                                                ))}
                                            </select>

                                            <ChevronDown
                                                size={15}
                                                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                            />
                                        </div>
                                    </div>

                                    {/* Product */}
                                    <div>
                                        <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                                            Product
                                            {createTaskForm.taskFor ===
                                                "Product" && (
                                                <span className="ml-1 text-rose-500">
                                                    *
                                                </span>
                                            )}
                                        </label>

                                        <div className="relative">
                                            <Layers3
                                                size={16}
                                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                            />

                                            <select
                                                name="productId"
                                                value={createTaskForm.productId}
                                                disabled={productsLoading}
                                                onChange={(event) => {
                                                    const productId =
                                                        event.target.value;

                                                    setCreateTaskForm(
                                                        (current) => ({
                                                            ...current,
                                                            productId,
                                                            projectId: "",
                                                            projectCode: "",
                                                            projectName: "",
                                                        })
                                                    );
                                                }}
                                                className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-50"
                                            >
                                                <option value="">
                                                    Select product
                                                </option>

                                                {(selectedCreateClient
                                                    ? selectedCreateClientProducts
                                                    : products
                                                ).map((product) => (
                                                    <option
                                                        key={
                                                            product.id ||
                                                            product.productName
                                                        }
                                                        value={product.id}
                                                    >
                                                        {product.productName}
                                                    </option>
                                                ))}
                                            </select>

                                            <ChevronDown
                                                size={15}
                                                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                            />
                                        </div>
                                    </div>

                                    {/* Project */}
                                    <div className="md:col-span-2">
                                        <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                                            Project
                                            {createTaskForm.taskFor ===
                                                "Project" && (
                                                <span className="ml-1 text-rose-500">
                                                    *
                                                </span>
                                            )}
                                        </label>

                                        <div className="relative">
                                            <FolderKanban
                                                size={16}
                                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                            />

                                            <select
                                                name="projectId"
                                                value={createTaskForm.projectId}
                                                disabled={projectsLoading}
                                                onChange={(event) => {
                                                    const projectId =
                                                        event.target.value;

                                                    const selectedProject =
                                                        projects.find(
                                                            (project) =>
                                                                String(project.id) ===
                                                                String(projectId)
                                                        );

                                                    setCreateTaskForm(
                                                        (current) => ({
                                                            ...current,
                                                            projectId,
                                                            projectCode:
                                                                selectedProject?.projectCode ||
                                                                "",
                                                            projectName:
                                                                selectedProject?.projectName ||
                                                                "",
                                                            clientId:
                                                                selectedProject?.clientId ||
                                                                current.clientId,
                                                            client:
                                                                selectedProject?.clientName ||
                                                                current.client,
                                                            productId:
                                                                selectedProject?.productId ||
                                                                current.productId,
                                                        })
                                                    );
                                                }}
                                                className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-50"
                                            >
                                                <option value="">
                                                    Select project
                                                </option>

                                                {projects
                                                    .filter((project) => {
                                                        if (
                                                            createTaskForm.clientId &&
                                                            project.clientId &&
                                                            String(
                                                                project.clientId
                                                            ) !==
                                                                String(
                                                                    createTaskForm.clientId
                                                                )
                                                        ) {
                                                            return false;
                                                        }

                                                        if (
                                                            createTaskForm.productId &&
                                                            project.productId &&
                                                            String(
                                                                project.productId
                                                            ) !==
                                                                String(
                                                                    createTaskForm.productId
                                                                )
                                                        ) {
                                                            return false;
                                                        }

                                                        return true;
                                                    })
                                                    .map((project) => (
                                                        <option
                                                            key={project.id}
                                                            value={project.id}
                                                        >
                                                            {project.projectName}
                                                            {project.projectCode
                                                                ? ` (${project.projectCode})`
                                                                : ""}
                                                        </option>
                                                    ))}
                                            </select>

                                            <ChevronDown
                                                size={15}
                                                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                            />
                                        </div>
                                    </div>

                                    {/* General */}
                                    {createTaskForm.taskFor === "General" && (
                                        <div className="md:col-span-2">
                                            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                                                General Task For
                                                <span className="ml-1 text-rose-500">
                                                    *
                                                </span>
                                            </label>

                                            <input
                                                name="generalTaskFor"
                                                value={
                                                    createTaskForm.generalTaskFor
                                                }
                                                onChange={
                                                    handleCreateTaskChange
                                                }
                                                placeholder="Example: Office administration, documentation, research..."
                                                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>
                                    )}
                                </div>

                                {(createTaskForm.projectName ||
                                    createTaskForm.clientId ||
                                    createTaskForm.productId) && (
                                    <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                                                <Link size={16} />
                                            </div>

                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-blue-950">
                                                    Linked work context
                                                </p>

                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {createTaskForm.client && (
                                                        <span className="rounded-lg bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 shadow-sm">
                                                            {createTaskForm.client}
                                                        </span>
                                                    )}

                                                    {createTaskForm.projectName && (
                                                        <span className="rounded-lg bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 shadow-sm">
                                                            {
                                                                createTaskForm.projectName
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* =====================================================
                            SECTION 3 - ASSIGNMENT
                        ===================================================== */}
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_6px_25px_rgba(15,23,42,0.04)]">

                            <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                    <UserCheck size={17} />
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Responsibility & Assignment
                                    </h3>

                                    <p className="mt-0.5 text-[11px] text-slate-500">
                                        Assign the work to the responsible team member.
                                    </p>
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="grid gap-5 md:grid-cols-2">

                                    {/* Employee */}
                                    <div className="md:col-span-2">
                                        <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                                            Assigned Employee
                                            <span className="ml-1 text-rose-500">
                                                *
                                            </span>
                                        </label>

                                        <div className="relative">
                                            <UserCheck
                                                size={16}
                                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                            />

                                            <select
                                                name="assignedEmployeeId"
                                                value={
                                                    createTaskForm.assignedEmployeeId
                                                }
                                                disabled={employeesLoading}
                                                onChange={(event) => {
                                                    const employeeId =
                                                        event.target.value;

                                                    const employee =
                                                        employees.find(
                                                            (item) =>
                                                                String(item.id) ===
                                                                String(employeeId)
                                                        );

                                                    setCreateTaskForm(
                                                        (current) => ({
                                                            ...current,
                                                            assignedEmployeeId:
                                                                employeeId,
                                                            assignedEmployeeCode:
                                                                employee?.employeeCode ||
                                                                "",
                                                            assignedEmployeeName:
                                                                employee?.name || "",
                                                        })
                                                    );
                                                }}
                                                className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            >
                                                <option value="">
                                                    Select employee
                                                </option>

                                                {employees.map((employee) => (
                                                    <option
                                                        key={employee.id}
                                                        value={employee.id}
                                                        disabled={
                                                            employee.status ===
                                                                "Leave" ||
                                                            employee.status ===
                                                                "Inactive"
                                                        }
                                                    >
                                                        {employee.name}
                                                        {employee.employeeCode
                                                            ? ` (${employee.employeeCode})`
                                                            : ""}
                                                        {employee.status
                                                            ? ` - ${employee.status}`
                                                            : ""}
                                                    </option>
                                                ))}
                                            </select>

                                            <ChevronDown
                                                size={15}
                                                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                            />
                                        </div>
                                    </div>

                                    {/* Priority */}
                                    <div>
                                        <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                                            Priority
                                            <span className="ml-1 text-rose-500">
                                                *
                                            </span>
                                        </label>

                                        <select
                                            name="priority"
                                            value={createTaskForm.priority}
                                            disabled={taskSettingsLoading}
                                            onChange={handleCreateTaskChange}
                                            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        >
                                            <option value="">
                                                Select priority
                                            </option>

                                            {taskPriorities.map(
                                                (priority) => (
                                                    <option
                                                        key={priority.id}
                                                        value={priority.name}
                                                    >
                                                        {priority.name}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    {/* Status */}
                                    <div>
                                        <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                                            Initial Status
                                            <span className="ml-1 text-rose-500">
                                                *
                                            </span>
                                        </label>

                                        <select
                                            name="status"
                                            value={createTaskForm.status}
                                            disabled={taskSettingsLoading}
                                            onChange={handleCreateTaskChange}
                                            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        >
                                            <option value="">
                                                Select status
                                            </option>

                                            {taskStatuses.map((status) => (
                                                <option
                                                    key={status.id}
                                                    value={status.name}
                                                >
                                                    {status.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* =====================================================
                            SECTION 4 - SCHEDULE
                        ===================================================== */}
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_6px_25px_rgba(15,23,42,0.04)]">

                            <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                    <CalendarDays size={17} />
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Schedule & Time Estimate
                                    </h3>

                                    <p className="mt-0.5 text-[11px] text-slate-500">
                                        Set the target date and expected effort.
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-5 p-5 md:grid-cols-2">

                                {/* Due Date */}
                                <div>
                                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                                        Due Date
                                        <span className="ml-1 text-rose-500">
                                            *
                                        </span>
                                    </label>

                                    <div className="relative">
                                        <CalendarDays
                                            size={16}
                                            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                        />

                                        <input
                                            required
                                            type="date"
                                            name="dueDate"
                                            value={createTaskForm.dueDate}
                                            onChange={handleCreateTaskChange}
                                            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        />
                                    </div>
                                </div>

                                {/* Estimated */}
                                <div>
                                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                                        Estimated Time
                                        <span className="ml-1 text-rose-500">
                                            *
                                        </span>
                                    </label>

                                    <div className="relative">
                                        <Clock3
                                            size={16}
                                            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                        />

                                        <input
                                            name="estimatedTime"
                                            value={
                                                createTaskForm.estimatedTime
                                            }
                                            onChange={handleCreateTaskChange}
                                            placeholder="Example: 2h or 1h 30m"
                                            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        />
                                    </div>

                                    <p className="mt-1.5 text-[10px] text-slate-400">
                                        Accepted formats: 2h, 1h 30m, 0.5
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Settings errors */}
                        {(taskSettingsError ||
                            productsError ||
                            projectsError) && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle
                                        size={17}
                                        className="mt-0.5 shrink-0 text-amber-600"
                                    />

                                    <div>
                                        <p className="text-xs font-bold text-amber-900">
                                            Some master data could not be loaded
                                        </p>

                                        <p className="mt-1 text-[10px] leading-5 text-amber-700">
                                            {taskSettingsError ||
                                                productsError ||
                                                projectsError}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* FOOTER */}
                <footer className="shrink-0 border-t border-slate-200 bg-white/95 px-5 py-4 shadow-[0_-8px_30px_rgba(15,23,42,0.05)] backdrop-blur sm:px-6 lg:px-8">

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <div className="hidden sm:block">
                            <p className="text-[10px] font-semibold text-slate-500">
                                <span className="text-rose-500">*</span>{" "}
                                Required information
                            </p>

                            <p className="mt-0.5 text-[9px] text-slate-400">
                                Assignment history will be recorded in the task timeline.
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-3">

                            <button
                                type="button"
                                onClick={closeCreateTaskDrawer}
                                disabled={savingTask}
                                className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={
                                    savingTask ||
                                    taskSettingsLoading
                                }
                                className="flex h-11 min-w-[150px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 text-xs font-bold text-white shadow-lg shadow-violet-600/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                            >
                                {savingTask ? (
                                    <>
                                        <RefreshCw
                                            size={15}
                                            className="animate-spin"
                                        />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Plus size={15} />
                                        Create Task
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </footer>
            </form>
        </aside>
    </div>
)}
        </div>
    );
}
