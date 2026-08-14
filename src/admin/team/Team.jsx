// Team.jsx - Updated with full-page employee details view

import { useEffect, useState } from "react";
import {
    Activity,
    AlertCircle,
    BriefcaseBusiness,
    Clock3,
    Coffee,
    MoreHorizontal,
    RefreshCw,
    Search,
    UserCheck,
    UserPlus,
    Users,
    ArrowLeft,
    Mail,
    Edit,
    User,
    Phone,
    Calendar,
    Building2,
    Briefcase,
    FileText,
    Clock,
    CheckCircle,
    UserCog,
    Shield,
    Target,
    BookOpen,
    LayoutGrid,
    ListTodo,
    Monitor,
    CalendarDays,
    UserMinus,
    Send,
  ExternalLink,
Plus,
X,
} from "lucide-react";

const API_URL = "http://localhost:5000";

const pcActivityData = {
    1: {
        "2026-07-14": {
            currentActivity: {
                application: "Visual Studio Code",
                windowTitle: "Dashboard.jsx - Client Connect",
                startedAt: "12:10 PM",
                runningTime: "38m",
                status: "Live",
                lastSyncAt: "01:28 PM",
                deviceName: "AKASH-PC",
            },
            summary: {
                productiveTime: "5h 42m",
                idleTime: "22m",
                breakTime: "35m",
                applicationsUsed: 14,
            },
            applications: [
                {
                    id: 1,
                    application: "Visual Studio Code",
                    category: "Development",
                    startedAt: "09:10 AM",
                    endedAt: "10:55 AM",
                    duration: "1h 45m",
                    productivity: "Productive",
                },
                {
                    id: 2,
                    application: "Google Chrome",
                    category: "Browser",
                    startedAt: "10:55 AM",
                    endedAt: "11:13 AM",
                    duration: "18m",
                    productivity: "Neutral",
                },
                {
                    id: 3,
                    application: "WhatsApp Business",
                    category: "Communication",
                    startedAt: "11:13 AM",
                    endedAt: "11:19 AM",
                    duration: "6m",
                    productivity: "Productive",
                },
                {
                    id: 4,
                    application: "Microsoft Excel",
                    category: "Office",
                    startedAt: "11:19 AM",
                    endedAt: "11:39 AM",
                    duration: "20m",
                    productivity: "Productive",
                },
                {
                    id: 5,
                    application: "NexERP Testing",
                    category: "Testing",
                    startedAt: "11:39 AM",
                    endedAt: "12:44 PM",
                    duration: "1h 05m",
                    productivity: "Productive",
                },
            ],
            topApplications: [
                {
                    name: "Visual Studio Code",
                    duration: "2h 45m",
                    percentage: 48,
                },
                {
                    name: "Google Chrome",
                    duration: "1h 16m",
                    percentage: 22,
                },
                {
                    name: "NexERP",
                    duration: "1h 02m",
                    percentage: 18,
                },
                {
                    name: "Microsoft Excel",
                    duration: "24m",
                    percentage: 7,
                },
                {
                    name: "Other",
                    duration: "17m",
                    percentage: 5,
                },
            ],
            idleSessions: [
                {
                    id: 1,
                    start: "11:25 AM",
                    end: "11:33 AM",
                    duration: "8m",
                },
                {
                    id: 2,
                    start: "12:40 PM",
                    end: "12:48 PM",
                    duration: "8m",
                },
            ],
        },
    },
};

function getStatusClasses(status) {
    if (status === "Working") {
        return "bg-amber-50 text-amber-700 ring-amber-600/10";
    }
    if (status === "Free") {
        return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";
    }
    if (status === "Break") {
        return "bg-blue-50 text-blue-700 ring-blue-600/10";
    }
    if (status === "Leave") {
        return "bg-rose-50 text-rose-700 ring-rose-600/10";
    }
    return "bg-slate-100 text-slate-600 ring-slate-500/10";
}

export default function Team() {
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [employeeTab, setEmployeeTab] = useState("overview");
    const [teamView, setTeamView] = useState("table");
    const [pcActivityDate, setPcActivityDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [pcActivity, setPcActivity] = useState(null);
    const [pcActivityLoading, setPcActivityLoading] = useState(false);
    const [pcActivityError, setPcActivityError] = useState("");
    const [employeeFormOpen, setEmployeeFormOpen] = useState(false);
    const [assignTaskOpen, setAssignTaskOpen] = useState(false);
    const [employeeAttendance, setEmployeeAttendance] = useState(null);
    const [employeeAttendanceLoading, setEmployeeAttendanceLoading] = useState(false);
    const [taskEmployee, setTaskEmployee] = useState(null);
    const [employeeOverview, setEmployeeOverview] = useState(null);
    const [employeeOverviewLoading, setEmployeeOverviewLoading] = useState(false);
    const [taskForm, setTaskForm] = useState({
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
        priority: "",
        status: "",
        dueDate: "",
        estimatedTime: "",
        description: "",
    });
    const [employeeForm, setEmployeeForm] = useState({
        employeeCode: "",
        name: "",
        email: "",
        mobile: "",
        role: "",
        department: "Support",
        joiningDate: "",
        status: "Free",
        password: "",
        confirmPassword: "",
    });
    const [employeeList, setEmployeeList] = useState([]);
    const [clientList, setClientList] = useState([]);
    const [projects, setProjects] = useState([]);
    const [products, setProducts] = useState([]);
    const [projectsLoading, setProjectsLoading] = useState(false);
    const [productsLoading, setProductsLoading] = useState(false);
    const [projectsError, setProjectsError] = useState("");
    const [productsError, setProductsError] = useState("");
    const [taskPriorities, setTaskPriorities] = useState([]);
    const [taskStatuses, setTaskStatuses] = useState([]);
    const [taskSettingsLoading, setTaskSettingsLoading] = useState(false);
    const [taskSettingsError, setTaskSettingsError] = useState("");
    const [clientsLoading, setClientsLoading] = useState(false);
    const [clientsError, setClientsError] = useState("");
    const [employeesLoading, setEmployeesLoading] = useState(true);
    const [employeesError, setEmployeesError] = useState("");
    const [savingEmployee, setSavingEmployee] = useState(false);
    const [editingEmployeeId, setEditingEmployeeId] = useState(null);
    const [assignedTasks, setAssignedTasks] = useState([]);
    const [tasksLoading, setTasksLoading] = useState(true);
    const [tasksError, setTasksError] = useState("");
    const [savingTask, setSavingTask] = useState(false);
    const [updatingTaskId, setUpdatingTaskId] = useState(null);

    const getAuthToken = () => {
        return (
            localStorage.getItem("client-connect-token") ||
            sessionStorage.getItem("client-connect-token") ||
            ""
        );
    };

    const formatEmployeeTime = (dateValue) => {
        if (!dateValue) return "—";
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) return "—";
        return date.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatActiveTime = (minutes) => {
        const totalMinutes = Math.max(Number(minutes || 0), 0);
        if (totalMinutes < 60) return `${totalMinutes}m`;
        const hours = Math.floor(totalMinutes / 60);
        const remainingMinutes = totalMinutes % 60;
        return remainingMinutes > 0
            ? `${hours}h ${remainingMinutes}m`
            : `${hours}h`;
    };

    const normalizeEmployeeFromApi = (employee = {}) => ({
        ...employee,
        id: employee._id || employee.id || "",
        employeeCode: employee.employeeCode || "",
        name: employee.name || "",
        initials: employee.initials ||
            String(employee.name || "")
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((word) => word.charAt(0).toUpperCase())
                .join("") || "NA",
        client: employee.client || employee.currentClient || "—",
        project: employee.project || employee.currentProject || "—",
        currentTask: employee.currentTask || "Available for assignment",
        loginTime: formatEmployeeTime(employee.loginTime),
        activeTime: formatActiveTime(employee.activeMinutes),
        openTasks: Number(employee.openTasks || 0),
        completedToday: Number(employee.completedToday || 0),
        lastActivity: employee.lastActivityAt
            ? new Date(employee.lastActivityAt).toLocaleString("en-IN")
            : "No activity yet",
        isActive: employee.isActive !== false,
    });

    const workingCount = employeeList.filter(
        (employee) => employee.status === "Working"
    ).length;
    const freeCount = employeeList.filter(
        (employee) => employee.status === "Free"
    ).length;
    const leaveCount = employeeList.filter(
        (employee) => employee.status === "Leave"
    ).length;

    const handleEmployeeFormChange = (event) => {
        const { name, value } = event.target;
        setEmployeeForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const estimatedTimeToMinutes = (value) => {
        const text = String(value || "").trim().toLowerCase();
        if (!text) return 0;
        const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*h/);
        const minuteMatch = text.match(/(\d+)\s*m/);
        let minutes = 0;
        if (hourMatch) minutes += Math.round(Number(hourMatch[1]) * 60);
        if (minuteMatch) minutes += Number(minuteMatch[1]);
        if (!hourMatch && !minuteMatch) {
            const numericValue = Number(text);
            if (Number.isFinite(numericValue)) {
                minutes = Math.round(numericValue * 60);
            }
        }
        return Math.max(minutes, 0);
    };

    const formatTaskMinutes = (minutes) => {
        const totalMinutes = Math.max(Number(minutes || 0), 0);
        if (totalMinutes === 0) return "0m";
        const hours = Math.floor(totalMinutes / 60);
        const remainingMinutes = totalMinutes % 60;
        if (hours === 0) return `${remainingMinutes}m`;
        if (remainingMinutes === 0) return `${hours}h`;
        return `${hours}h ${remainingMinutes}m`;
    };

    const normalizeTaskFromApi = (task = {}) => {
        const assignedEmployeeId = task.assignedEmployeeId?._id || task.assignedEmployeeId || "";
        const assignedEmployeeName = task.assignedEmployeeName || "";
        return {
            ...task,
            id: task._id || task.id || "",
            taskNo: task.taskCode || task.taskNo || "",
            assignedEmployeeId: assignedEmployeeId ? String(assignedEmployeeId) : "",
            assignedEmployeeCode: task.assignedEmployeeCode || "",
            assignedEmployeeName: assignedEmployeeName || "Not assigned",
            assignedEmployeeInitials: String(assignedEmployeeName)
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((word) => word.charAt(0).toUpperCase())
                .join(""),
            client: task.clientName || task.client || "Internal Development",
            projectId: task.projectId ? String(task.projectId) : "",
            projectCode: task.projectCode || "",
            projectName: task.projectName || task.project || "",
            project: task.projectName || task.project || "",
            estimatedTime: formatTaskMinutes(task.estimatedMinutes),
            spentTime: formatTaskMinutes(task.spentMinutes),
            progress: Number(task.progress || 0),
            dueDate: task.dueDate ? String(task.dueDate).slice(0, 10) : "",
            assignedAt: task.createdAt
                ? new Date(task.createdAt).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                })
                : "",
        };
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

    const loadTasks = async () => {
        try {
            setTasksLoading(true);
            setTasksError("");
            const response = await fetch(`${API_URL}/api/admin/tasks`, {
                headers: { Authorization: `Bearer ${getAuthToken()}` },
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to load tasks.");
            }
            const normalizedTasks = Array.isArray(result.data)
                ? result.data.map(normalizeTaskFromApi)
                : [];
            setAssignedTasks(normalizedTasks);
        } catch (error) {
            console.error("Load tasks error:", error);
            setTasksError(error.message || "Unable to load tasks.");
            setAssignedTasks([]);
        } finally {
            setTasksLoading(false);
        }
    };

    const openAssignTaskDrawer = (employee) => {
        setTaskEmployee(employee);
        setTaskForm({
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
            priority: taskPriorities[0]?.name || "",
            status: taskStatuses[0]?.name || "",
            dueDate: "",
            estimatedTime: "",
            description: "",
        });
        setAssignTaskOpen(true);
    };

    const closeAssignTaskDrawer = () => {
        setAssignTaskOpen(false);
        setTaskEmployee(null);
        setTaskForm({
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
            priority: taskPriorities[0]?.name || "",
            status: taskStatuses[0]?.name || "",
            dueDate: "",
            estimatedTime: "",
            description: "",
        });
    };

    const handleTaskFormChange = (event) => {
        const { name, value } = event.target;
        setTaskForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleAssignTask = async (event) => {
        event.preventDefault();
        if (!taskEmployee) {
            alert("Please select an employee.");
            return;
        }
        const employeeId = taskEmployee.id;
        if (!employeeId) {
            alert("Employee ID is missing.");
            return;
        }
        const title = taskForm.title.trim();
        if (!title) {
            alert("Please enter task title.");
            return;
        }
        if (taskForm.taskFor === "Project" && !taskForm.projectId) {
            alert("Please select a project.");
            return;
        }
        if (taskForm.taskFor === "Product" && !taskForm.productId) {
            alert("Please select a product.");
            return;
        }
        if (taskForm.taskFor === "General" && !taskForm.generalTaskFor.trim()) {
            alert("Please enter who or what this general task is for.");
            return;
        }
        if (!taskForm.priority) {
            alert("Please select priority.");
            return;
        }
        if (!taskForm.status) {
            alert("Please select initial status.");
            return;
        }
        if (!taskForm.dueDate) {
            alert("Please select a due date.");
            return;
        }
        if (!taskForm.estimatedTime.trim()) {
            alert("Please enter estimated time.");
            return;
        }
        const estimatedMinutes = estimatedTimeToMinutes(taskForm.estimatedTime);
        if (estimatedMinutes <= 0) {
            alert("Enter estimated time like 2h, 1h 30m or 0.5.");
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
                    description: taskForm.description.trim(),
                    workType: taskForm.workType,
                    taskFor: taskForm.taskFor,
                    generalTaskFor: taskForm.generalTaskFor.trim(),
                    clientId: taskForm.clientId || null,
                    clientName: taskForm.client || "Internal Development",
                    productId: taskForm.productId || null,
                    projectId: taskForm.projectId || null,
                    assignedEmployeeId: employeeId,
                    priority: taskForm.priority,
                    status: taskForm.status,
                    dueDate: taskForm.dueDate,
                    estimatedMinutes,
                }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to assign task.");
            }
            const savedTask = normalizeTaskFromApi(result.data);
            setAssignedTasks((current) => [savedTask, ...current]);
            await loadEmployees();
            setSelectedEmployee((current) => {
                if (!current || String(current.id) !== String(employeeId)) {
                    return current;
                }
                return {
                    ...current,
                    status: "Working",
                    currentTask: savedTask.title,
                    client: savedTask.client,
                    project: savedTask.project,
                    openTasks: Number(current.openTasks || 0) + 1,
                    lastActivity: "Task assigned just now",
                };
            });
            closeAssignTaskDrawer();
            alert("Task assigned successfully.");
        } catch (error) {
            console.error("Assign task error:", error);
            alert(error.message || "Unable to assign task.");
        } finally {
            setSavingTask(false);
        }
    };

    const resetEmployeeForm = () => {
        setEmployeeForm({
            employeeCode: "",
            name: "",
            email: "",
            mobile: "",
            role: "",
            department: "Support",
            joiningDate: "",
            status: "Free",
            password: "",
            confirmPassword: "",
        });
    };

    const openAddEmployeeDrawer = () => {
        setEditingEmployeeId(null);
        resetEmployeeForm();
        setEmployeeFormOpen(true);
    };

    const openEditEmployeeDrawer = (employee) => {
        const employeeId = employee.id;
        if (!employeeId) {
            alert("Employee ID is missing.");
            return;
        }
        setEditingEmployeeId(employeeId);
        setEmployeeForm({
            employeeCode: employee.employeeCode || "",
            name: employee.name || "",
            email: employee.email || "",
            mobile: employee.mobile || "",
            role: employee.role || "",
            department: employee.department || "Support",
            joiningDate: employee.joiningDate || "",
            status: employee.status || "Free",
            password: "",
            confirmPassword: "",
        });
        setEmployeeFormOpen(true);
    };

    const closeEmployeeDrawer = () => {
        if (savingEmployee) return;
        setEmployeeFormOpen(false);
        setEditingEmployeeId(null);
        resetEmployeeForm();
    };

    const handleSaveEmployee = async (event) => {
        event.preventDefault();
        const employeeCode = employeeForm.employeeCode.trim().toUpperCase();
        const name = employeeForm.name.trim();
        const email = employeeForm.email.trim().toLowerCase();
        const role = employeeForm.role.trim();
        const isEditing = Boolean(editingEmployeeId);
        if (!employeeCode) {
            alert("Please enter employee code.");
            return;
        }
        if (!name) {
            alert("Please enter employee name.");
            return;
        }
        if (!email) {
            alert("Please enter employee login email.");
            return;
        }
        if (!role) {
            alert("Please enter employee role.");
            return;
        }
        if (!isEditing && !employeeForm.password) {
            alert("Please enter a temporary login password.");
            return;
        }
        if (employeeForm.password && employeeForm.password.length < 6) {
            alert("Password must contain at least 6 characters.");
            return;
        }
        if (employeeForm.password !== employeeForm.confirmPassword) {
            alert("Passwords do not match.");
            return;
        }
        const duplicateCode = employeeList.some((employee) => {
            return (
                String(employee.id) !== String(editingEmployeeId) &&
                String(employee.employeeCode || "").trim().toLowerCase() === employeeCode.toLowerCase()
            );
        });
        if (duplicateCode) {
            alert("This employee code already exists.");
            return;
        }
        const duplicateEmail = employeeList.some((employee) => {
            return (
                String(employee.id) !== String(editingEmployeeId) &&
                String(employee.email || "").trim().toLowerCase() === email
            );
        });
        if (duplicateEmail) {
            alert("This employee email already exists.");
            return;
        }
        try {
            setSavingEmployee(true);
            const endpoint = isEditing
                ? `${API_URL}/api/employee/employees/${editingEmployeeId}`
                : `${API_URL}/api/employee/employees`;
            const payload = {
                employeeCode,
                name,
                email,
                mobile: employeeForm.mobile.trim(),
                role,
                department: employeeForm.department,
                joiningDate: employeeForm.joiningDate,
                status: employeeForm.status,
            };
            if (employeeForm.password) {
                payload.password = employeeForm.password;
            }
            const response = await fetch(endpoint, {
                method: isEditing ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getAuthToken()}`,
                },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || `Unable to ${isEditing ? "update" : "create"} employee.`);
            }
            const savedEmployee = normalizeEmployeeFromApi(result.data);
            if (isEditing) {
                setEmployeeList((current) =>
                    current.map((employee) =>
                        String(employee.id) === String(editingEmployeeId)
                            ? savedEmployee
                            : employee
                    )
                );
                setSelectedEmployee((current) =>
                    current && String(current.id) === String(editingEmployeeId)
                        ? savedEmployee
                        : current
                );
            } else {
                setEmployeeList((current) => [...current, savedEmployee]);
            }
            closeEmployeeDrawer();
            alert(isEditing
                ? "Employee updated successfully."
                : `Employee created successfully.\n\nLogin email: ${email}\nRole: Employee`);
        } catch (error) {
            console.error("Save employee error:", error);
            alert(error.message || "Unable to save employee.");
        } finally {
            setSavingEmployee(false);
        }
    };

    const loadEmployeeAttendance = async (employeeCode) => {
        if (!employeeCode) return;
        try {
            setEmployeeAttendanceLoading(true);
            const response = await fetch(
                `${API_URL}/api/admin/team/${employeeCode}/attendance`,
                {
                    headers: { Authorization: `Bearer ${getAuthToken()}` },
                }
            );
            const result = await response.json();
            if (response.ok && result.success) {
                setEmployeeAttendance(result.data);
            } else {
                setEmployeeAttendance(null);
            }
        } catch (error) {
            console.error("Load employee attendance error:", error);
            setEmployeeAttendance(null);
        } finally {
            setEmployeeAttendanceLoading(false);
        }
    };

    const loadPcActivity = async (employeeCode, date = pcActivityDate) => {
        if (!employeeCode) return;
        try {
            setPcActivityLoading(true);
            setPcActivityError("");
            const response = await fetch(
                `${API_URL}/api/admin/pc-activity/${employeeCode}?date=${date}`,
                {
                    headers: { Authorization: `Bearer ${getAuthToken()}` },
                }
            );
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || "Failed to load PC activity");
            }
            setPcActivity(result.data);
        } catch (error) {
            console.error("Load PC activity error:", error);
            setPcActivityError(error.message || "Unable to load PC activity.");
            setPcActivity(null);
        } finally {
            setPcActivityLoading(false);
        }
    };

    const loadEmployeeOverview = async (employeeCode) => {
        if (!employeeCode) return;
        try {
            setEmployeeOverviewLoading(true);
            const response = await fetch(
                `${API_URL}/api/admin/team/${employeeCode}/overview`,
                {
                    headers: { Authorization: `Bearer ${getAuthToken()}` },
                }
            );
            const result = await response.json();
            if (response.ok && result.success) {
                setEmployeeOverview(result.data);
            } else {
                setEmployeeOverview(null);
            }
        } catch (error) {
            console.error("Load employee overview error:", error);
            setEmployeeOverview(null);
        } finally {
            setEmployeeOverviewLoading(false);
        }
    };

    const loadEmployees = async () => {
        try {
            setEmployeesLoading(true);
            setEmployeesError("");
            const response = await fetch(`${API_URL}/api/employee/employees`, {
                headers: { Authorization: `Bearer ${getAuthToken()}` },
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to load employees.");
            }
            const normalizedEmployees = Array.isArray(result.data)
                ? result.data.map(normalizeEmployeeFromApi)
                : [];
            setEmployeeList(normalizedEmployees);
        } catch (error) {
            console.error("Load employees error:", error);
            setEmployeesError(error.message || "Unable to load employees.");
            setEmployeeList([]);
        } finally {
            setEmployeesLoading(false);
        }
    };

    const normalizeClientFromApi = (client = {}) => ({
        ...client,
        id: client._id || client.id || "",
        code: client.clientCode || client.code || "",
        companyName: client.companyName || client.clientName || client.name || "",
        products: Array.isArray(client.products) ? client.products : [],
    });

    const loadClients = async () => {
        try {
            setClientsLoading(true);
            setClientsError("");
            const response = await fetch(`${API_URL}/api/admin/clients`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${getAuthToken()}`,
                },
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to load clients.");
            }
            const rawClients = Array.isArray(result.data)
                ? result.data
                : Array.isArray(result.clients)
                    ? result.clients
                    : [];
            const normalizedClients = rawClients
                .map(normalizeClientFromApi)
                .filter((client) => client.id && client.companyName)
                .sort((a, b) => a.companyName.localeCompare(b.companyName));
            setClientList(normalizedClients);
        } catch (error) {
            console.error("Load clients error:", error);
            setClientList([]);
            setClientsError(error.message || "Unable to load clients.");
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
                        order: Number(item.order || 0),
                        isFinal: Boolean(item.isFinal),
                    }))
                    .filter((item) => item.name)
                : [];
            setTaskPriorities(priorities);
            setTaskStatuses(statuses);
            setTaskForm((current) => ({
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
        if (selectedEmployee?.employeeCode) {
            loadPcActivity(selectedEmployee.employeeCode, pcActivityDate);
        } else {
            setPcActivity(null);
        }
    }, [selectedEmployee, pcActivityDate]);

    useEffect(() => {
        if (selectedEmployee?.employeeCode) {
            loadEmployeeOverview(selectedEmployee.employeeCode);
            loadEmployeeAttendance(selectedEmployee.employeeCode);
        } else {
            setEmployeeOverview(null);
            setEmployeeAttendance(null);
        }
    }, [selectedEmployee]);

    useEffect(() => {
        loadEmployees();
        loadTasks();
        loadClients();
        loadProjects();
        loadProducts();
        loadTaskSettings();
    }, []);

    const selectedPcActivity = pcActivity;
    const selectedEmployeeTasks = selectedEmployee
        ? assignedTasks.filter(
            (task) => String(task.assignedEmployeeId) === String(selectedEmployee.id)
        )
        : [];

    const updateTaskStatus = async (taskId, nextStatus) => {
        if (!taskId) {
            alert("Task ID is missing.");
            return;
        }
        try {
            setUpdatingTaskId(taskId);
            const progress = nextStatus === "Completed"
                ? 100
                : nextStatus === "In Progress"
                    ? 25
                    : undefined;
            const response = await fetch(`${API_URL}/api/admin/task/${taskId}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getAuthToken()}`,
                },
                body: JSON.stringify({
                    status: nextStatus,
                    ...(progress !== undefined ? { progress } : {}),
                }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to update task status.");
            }
            const updatedTask = normalizeTaskFromApi(result.data);
            setAssignedTasks((current) =>
                current.map((task) =>
                    (task._id || task.id) === taskId ? updatedTask : task
                )
            );
            await loadEmployees();
            setSelectedEmployee((current) => {
                if (!current || String(current.id) !== String(updatedTask.assignedEmployeeId)) {
                    return current;
                }
                if (nextStatus === "Completed" || nextStatus === "Closed") {
                    const nextOpenTasks = Math.max(Number(current.openTasks || 0) - 1, 0);
                    return {
                        ...current,
                        openTasks: nextOpenTasks,
                        completedToday: Number(current.completedToday || 0) + 1,
                        status: nextOpenTasks === 0 ? "Free" : current.status,
                        currentTask: nextOpenTasks === 0 ? "Available for assignment" : current.currentTask,
                        client: nextOpenTasks === 0 ? "—" : current.client,
                        project: nextOpenTasks === 0 ? "—" : current.project,
                        lastActivity: "Task completed just now",
                    };
                }
                if (nextStatus === "In Progress") {
                    return {
                        ...current,
                        status: "Working",
                        currentTask: updatedTask.title,
                        client: updatedTask.client,
                        project: updatedTask.project,
                        lastActivity: "Task started just now",
                    };
                }
                return current;
            });
        } catch (error) {
            console.error("Update task status error:", error);
            alert(error.message || "Unable to update task status.");
        } finally {
            setUpdatingTaskId(null);
        }
    };

    const selectedTaskClient = clientList.find(
        (client) => String(client.id) === String(taskForm.clientId)
    );
    const selectedTaskProject = projects.find(
        (project) => String(project.id) === String(taskForm.projectId)
    );
    const availableProjects = projects.filter((project) => {
        if (taskForm.clientId && project.clientId && String(project.clientId) !== String(taskForm.clientId)) {
            return false;
        }
        if (taskForm.productId && project.productId && String(project.productId) !== String(taskForm.productId)) {
            return false;
        }
        return true;
    });
    const availableProducts = products.filter((product) => {
        if (!selectedTaskClient) return true;
        const clientProducts = Array.isArray(selectedTaskClient.products)
            ? selectedTaskClient.products
            : [];
        if (clientProducts.length === 0) return true;
        return clientProducts.some((clientProduct) => {
            if (typeof clientProduct === "string") {
                return clientProduct === product.productName;
            }
            const clientProductId = clientProduct?._id || clientProduct?.id || "";
            const clientProductName = clientProduct?.productName || clientProduct?.name || "";
            return String(clientProductId) === String(product.id) ||
                clientProductName === product.productName;
        });
    });

    // If employee is selected, render full-page details view
    if (selectedEmployee) {
        return (
            <div className="enterprise-page space-y-6">
                {/* Back button and Header */}
                <div>
                    <button
                        type="button"
                        onClick={() => setSelectedEmployee(null)}
                        className="group flex items-center gap-2 rounded-lg px-0 py-1 text-sm font-medium text-slate-500 transition hover:text-violet-700"
                    >
                        <ArrowLeft size={18} className="transition group-hover:-translate-x-0.5" />
                        Back to Team
                    </button>
                </div>

                {/* Employee Header */}
                <div className="enterprise-surface flex flex-col gap-4 p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-xl font-semibold text-white">
                            {selectedEmployee.initials}
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl font-bold text-slate-950">
                                    {selectedEmployee.name}
                                </h1>
                                <span
                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${getStatusClasses(
                                        selectedEmployee.status
                                    )}`}
                                >
                                    {selectedEmployee.status}
                                </span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                                <span className="flex items-center gap-1.5">
                                    <User size={14} />
                                    {selectedEmployee.employeeCode}
                                </span>
                                <span className="h-1 w-1 rounded-full bg-slate-300" />
                                <span className="flex items-center gap-1.5">
                                    <Building2 size={14} />
                                    {selectedEmployee.department || "Support"}
                                </span>
                                <span className="h-1 w-1 rounded-full bg-slate-300" />
                                <span className="flex items-center gap-1.5">
                                    <Briefcase size={14} />
                                    {selectedEmployee.role}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => openEditEmployeeDrawer(selectedEmployee)}
                            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                        >
                            <Edit size={16} />
                            Edit
                        </button>
                        <button
                            type="button"
                            onClick={() => window.location.href = `mailto:${selectedEmployee.email}`}
                            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                        >
                            <Mail size={16} />
                            Email
                        </button>
                        <button
                            type="button"
                            onClick={() => openAssignTaskDrawer(selectedEmployee)}
                            className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
                        >
                            <Plus size={16} />
                            Assign Task
                        </button>
                        <button
                            type="button"
                            className="flex h-10 items-center gap-2 rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                        >
                            <UserMinus size={16} />
                            Deactivate
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="enterprise-surface enterprise-surface--interactive p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                    Current Status
                                </p>
                                <p className="mt-2 text-lg font-semibold text-slate-950">
                                    {selectedEmployee.status}
                                </p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                                <UserCog size={18} />
                            </div>
                        </div>
                        <p className="mt-4 text-xs text-slate-500">
                            {selectedEmployee.status === "Working"
                                ? "Actively working on tasks"
                                : selectedEmployee.status === "Free"
                                    ? "Available for assignment"
                                    : selectedEmployee.status === "Break"
                                        ? "On break"
                                        : "On leave"}
                        </p>
                    </div>

                    <div className="enterprise-surface enterprise-surface--interactive p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                    Open Tasks
                                </p>
                                <p className="mt-2 text-lg font-semibold text-violet-700">
                                    {selectedEmployee.openTasks}
                                </p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                                <ListTodo size={18} />
                            </div>
                        </div>
                        <p className="mt-4 text-xs text-slate-500">
                            Tasks assigned and in progress
                        </p>
                    </div>

                    <div className="enterprise-surface enterprise-surface--interactive p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                    Attendance Today
                                </p>
                                <p className="mt-2 text-lg font-semibold text-emerald-700">
                                    {employeeAttendance?.attendanceStatus || "Present"}
                                </p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                <CalendarDays size={18} />
                            </div>
                        </div>
                        <p className="mt-4 text-xs text-slate-500">
                            {employeeAttendance?.loginTime || "Not logged in yet"}
                        </p>
                    </div>

                    <div className="enterprise-surface enterprise-surface--interactive p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                    Current Assignment
                                </p>
                                <p className="mt-2 text-lg font-semibold text-slate-950 truncate max-w-[180px]">
                                    {selectedEmployee.client !== "—" ? selectedEmployee.client : "None"}
                                </p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                                <Target size={18} />
                            </div>
                        </div>
                        <p className="mt-4 text-xs text-slate-500">
                            {selectedEmployee.client !== "—"
                                ? `Project: ${selectedEmployee.project}`
                                : "No client assigned"}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-slate-200 bg-white rounded-t-2xl">
                    <div className="flex gap-6 overflow-x-auto px-6">
                        {[
                            { id: "overview", label: "Overview" },
                            { id: "attendance", label: "Attendance" },
                            { id: "tasks", label: "Tasks" },
                            { id: "activity", label: "Activity" },
                            { id: "pc-activity", label: "PC Activity" },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setEmployeeTab(tab.id)}
                                className={`relative whitespace-nowrap py-4 text-sm font-semibold transition ${employeeTab === tab.id
                                        ? "text-violet-700"
                                        : "text-slate-500 hover:text-slate-900"
                                    }`}
                            >
                                {tab.label}
                                {employeeTab === tab.id && (
                                    <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-violet-600" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="space-y-6">
                    {employeeTab === "overview" && (
                        <>
                            {/* Two Column Info Cards */}
                            <div className="grid gap-6 lg:grid-cols-2">
                                {/* Employee Information */}
                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <h3 className="text-sm font-semibold text-slate-950">Employee Information</h3>
                                    <div className="mt-4 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    Employee Code
                                                </p>
                                                <p className="mt-1.5 text-sm font-medium text-slate-900">
                                                    {selectedEmployee.employeeCode}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    Department
                                                </p>
                                                <p className="mt-1.5 text-sm font-medium text-slate-900">
                                                    {selectedEmployee.department || "Support"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    Role
                                                </p>
                                                <p className="mt-1.5 text-sm font-medium text-slate-900">
                                                    {selectedEmployee.role}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    Joining Date
                                                </p>
                                                <p className="mt-1.5 text-sm font-medium text-slate-900">
                                                    {selectedEmployee.joiningDate || "—"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    Status
                                                </p>
                                                <span
                                                    className={`mt-1.5 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${getStatusClasses(
                                                        selectedEmployee.status
                                                    )}`}
                                                >
                                                    {selectedEmployee.status}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    Active Time
                                                </p>
                                                <p className="mt-1.5 text-sm font-medium text-slate-900">
                                                    {selectedEmployee.activeTime}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Information */}
                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <h3 className="text-sm font-semibold text-slate-950">Contact Information</h3>
                                    <div className="mt-4 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    Name
                                                </p>
                                                <p className="mt-1.5 text-sm font-medium text-slate-900">
                                                    {selectedEmployee.name}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    Mobile
                                                </p>
                                                <p className="mt-1.5 text-sm font-medium text-slate-900">
                                                    {selectedEmployee.mobile || "—"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    Email
                                                </p>
                                                <p className="mt-1.5 text-sm font-medium text-slate-900 truncate">
                                                    {selectedEmployee.email || "—"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    Reporting Manager
                                                </p>
                                                <p className="mt-1.5 text-sm font-medium text-slate-900">
                                                    {selectedEmployee.manager || "—"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    Current Client
                                                </p>
                                                <p className="mt-1.5 text-sm font-medium text-slate-900">
                                                    {selectedEmployee.client}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    Current Project
                                                </p>
                                                <p className="mt-1.5 text-sm font-medium text-slate-900">
                                                    {selectedEmployee.project}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Current Assignment */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="text-sm font-semibold text-slate-950">Current Assignment</h3>
                                <div className="mt-4 space-y-4">
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            Task
                                        </p>
                                        <p className="mt-1.5 text-sm font-medium text-slate-900">
                                            {selectedEmployee.currentTask}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Client
                                            </p>
                                            <p className="mt-1.5 text-sm font-medium text-slate-900">
                                                {selectedEmployee.client}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Project
                                            </p>
                                            <p className="mt-1.5 text-sm font-medium text-slate-900">
                                                {selectedEmployee.project}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Open Tasks
                                            </p>
                                            <p className="mt-1.5 text-sm font-medium text-violet-700">
                                                {selectedEmployee.openTasks}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Tasks */}
                            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                                <div className="border-b border-slate-200 px-6 py-4">
                                    <h3 className="text-sm font-semibold text-slate-950">Recent Tasks</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-[600px] w-full">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    Task Title
                                                </th>
                                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    Client
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
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedEmployeeTasks.length > 0 ? (
                                                selectedEmployeeTasks.slice(0, 3).map((task) => (
                                                    <tr key={task.id} className="border-t border-slate-100">
                                                        <td className="px-6 py-4">
                                                            <p className="text-xs font-semibold text-slate-900">
                                                                {task.title}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-4 text-xs text-slate-600">
                                                            {task.client}
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <span
                                                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${task.priority === "Critical"
                                                                        ? "bg-rose-50 text-rose-700"
                                                                        : task.priority === "High"
                                                                            ? "bg-orange-50 text-orange-700"
                                                                            : task.priority === "Medium"
                                                                                ? "bg-amber-50 text-amber-700"
                                                                                : "bg-slate-100 text-slate-600"
                                                                    }`}
                                                            >
                                                                {task.priority}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                                                                {task.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-xs text-slate-600">
                                                            {task.dueDate}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-8 text-center text-sm text-slate-500">
                                                        No tasks assigned
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {employeeTab === "attendance" && (
                        <div className="space-y-6">
                            <div className="grid gap-6 lg:grid-cols-2">
                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <h3 className="text-sm font-semibold text-slate-950">Today's Attendance</h3>
                                    <div className="mt-4 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    Login Time
                                                </p>
                                                <p className="mt-1.5 text-sm font-medium text-slate-900">
                                                    {employeeAttendance?.loginTime || "—"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    Logout Time
                                                </p>
                                                <p className="mt-1.5 text-sm font-medium text-slate-900">
                                                    {employeeAttendance?.logoutTime || "—"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    Status
                                                </p>
                                                <span
                                                    className={`mt-1.5 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${selectedEmployee.status === "Leave"
                                                            ? "bg-rose-50 text-rose-700"
                                                            : "bg-emerald-50 text-emerald-700"
                                                        }`}
                                                >
                                                    {employeeAttendance?.attendanceStatus || "Present"}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    Late Minutes
                                                </p>
                                                <p className="mt-1.5 text-sm font-medium text-slate-900">
                                                    {employeeAttendance?.lateMinutes || 0}m
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <h3 className="text-sm font-semibold text-slate-950">Time Summary</h3>
                                    <div className="mt-4 grid grid-cols-2 gap-4">
                                        <div className="rounded-xl bg-slate-50 p-4">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Active Time
                                            </p>
                                            <p className="mt-1.5 text-lg font-semibold text-slate-950">
                                                {employeeAttendance?.activeTime || "0m"}
                                            </p>
                                        </div>
                                        <div className="rounded-xl bg-slate-50 p-4">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Break Time
                                            </p>
                                            <p className="mt-1.5 text-lg font-semibold text-slate-950">
                                                {employeeAttendance?.breakTime || "0m"}
                                            </p>
                                        </div>
                                        <div className="rounded-xl bg-slate-50 p-4">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Idle Time
                                            </p>
                                            <p className="mt-1.5 text-lg font-semibold text-slate-950">
                                                {employeeAttendance?.idleTime || "0m"}
                                            </p>
                                        </div>
                                        <div className="rounded-xl bg-slate-50 p-4">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Productive Time
                                            </p>
                                            <p className="mt-1.5 text-lg font-semibold text-emerald-700">
                                                {employeeAttendance?.productiveTime || "0m"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                                <div className="border-b border-slate-200 px-6 py-4">
                                    <h3 className="text-sm font-semibold text-slate-950">Login Sessions</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-[600px] w-full">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    Session
                                                </th>
                                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    Start
                                                </th>
                                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    End
                                                </th>
                                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    Duration
                                                </th>
                                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(employeeAttendance?.sessions || []).map((session, index) => (
                                                <tr key={index} className="border-t border-slate-100">
                                                    <td className="px-6 py-4 text-xs font-semibold text-slate-800">
                                                        {session.name || `Session ${index + 1}`}
                                                    </td>
                                                    <td className="px-4 py-4 text-xs text-slate-600">
                                                        {session.start}
                                                    </td>
                                                    <td className="px-4 py-4 text-xs text-slate-600">
                                                        {session.end}
                                                    </td>
                                                    <td className="px-4 py-4 text-xs text-slate-600">
                                                        {session.duration}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span
                                                            className={`rounded-full px-2 py-1 text-[10px] font-bold ${session.status === "Active"
                                                                    ? "bg-violet-50 text-violet-700"
                                                                    : "bg-emerald-50 text-emerald-700"
                                                                }`}
                                                        >
                                                            {session.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(employeeAttendance?.sessions || []).length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-8 text-center text-sm text-slate-500">
                                                        No sessions recorded today
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {employeeTab === "tasks" && (
                        <div className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                        Open Tasks
                                    </p>
                                    <p className="mt-3 text-2xl font-semibold text-violet-700">
                                        {selectedEmployee.openTasks}
                                    </p>
                                    <p className="mt-2 text-xs text-slate-500">Currently assigned</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                        Completed Today
                                    </p>
                                    <p className="mt-3 text-2xl font-semibold text-emerald-700">
                                        {selectedEmployee.completedToday}
                                    </p>
                                    <p className="mt-2 text-xs text-slate-500">Tasks resolved today</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                        Current Status
                                    </p>
                                    <div className="mt-3">
                                        <span
                                            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${getStatusClasses(
                                                selectedEmployee.status
                                            )}`}
                                        >
                                            {selectedEmployee.status}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-xs text-slate-500">Current availability</p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                            Assigned Work
                                        </p>
                                        <h3 className="mt-1 text-sm font-semibold text-slate-950">Employee Task List</h3>
                                        <p className="mt-1 text-[10px] text-slate-500">
                                            {selectedEmployeeTasks.length} tasks assigned
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => openAssignTaskDrawer(selectedEmployee)}
                                        className="flex h-9 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white transition hover:bg-violet-700"
                                    >
                                        <Plus size={15} />
                                        Assign Task
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-[760px] w-full">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    Task
                                                </th>
                                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    Client / Project
                                                </th>
                                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    Priority
                                                </th>
                                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    Status
                                                </th>
                                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    Time
                                                </th>
                                                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedEmployeeTasks.map((task) => (
                                                <tr key={task.id} className="border-t border-slate-100">
                                                    <td className="px-6 py-4">
                                                        <p className="text-xs font-semibold text-slate-900">{task.title}</p>
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
                                                        <span
                                                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${task.priority === "Critical"
                                                                    ? "bg-rose-50 text-rose-700"
                                                                    : task.priority === "High"
                                                                        ? "bg-orange-50 text-orange-700"
                                                                        : task.priority === "Medium"
                                                                            ? "bg-amber-50 text-amber-700"
                                                                            : "bg-slate-100 text-slate-600"
                                                                }`}
                                                        >
                                                            {task.priority}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                                                            {task.status}
                                                        </span>
                                                        <p className="mt-2 text-[10px] text-slate-500">Due: {task.dueDate}</p>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <p className="text-xs font-semibold text-slate-800">{task.spentTime}</p>
                                                        <p className="mt-1 text-[10px] text-slate-500">of {task.estimatedTime}</p>
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {task.status === "Assigned" && (
                                                                <button
                                                                    type="button"
                                                                    disabled={updatingTaskId === task.id}
                                                                    onClick={() => updateTaskStatus(task.id, "In Progress")}
                                                                    className="rounded-lg bg-violet-50 px-3 py-2 text-[10px] font-semibold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                                >
                                                                    {updatingTaskId === task.id ? (
                                                                        <RefreshCw size={14} className="animate-spin" />
                                                                    ) : (
                                                                        "Start"
                                                                    )}
                                                                </button>
                                                            )}
                                                            {task.status === "In Progress" && (
                                                                <button
                                                                    type="button"
                                                                    disabled={updatingTaskId === task.id}
                                                                    onClick={() => updateTaskStatus(task.id, "Completed")}
                                                                    className="rounded-lg bg-emerald-50 px-3 py-2 text-[10px] font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                                >
                                                                    {updatingTaskId === task.id ? (
                                                                        <RefreshCw size={14} className="animate-spin" />
                                                                    ) : (
                                                                        "Complete"
                                                                    )}
                                                                </button>
                                                            )}
                                                            {task.status === "Completed" && (
                                                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                                                                    Done
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {selectedEmployeeTasks.length === 0 && (
                                                <tr>
                                                    <td colSpan="6" className="px-6 py-12 text-center text-sm text-slate-500">
                                                        No tasks assigned to this employee
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {employeeTab === "activity" && (
                        <div className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                        Active Time
                                    </p>
                                    <p className="mt-3 text-xl font-semibold text-slate-950">
                                        {employeeAttendance?.activeTime || "0m"}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                        Work Updates
                                    </p>
                                    <p className="mt-3 text-xl font-semibold text-violet-700">
                                        {employeeOverview?.openTasks ?? 0}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                        Tasks Completed
                                    </p>
                                    <p className="mt-3 text-xl font-semibold text-emerald-700">
                                        {employeeOverview?.completedToday ?? 0}
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="text-sm font-semibold text-slate-950">Activity Timeline</h3>
                                <div className="relative mt-6 space-y-6">
                                    <div className="absolute bottom-2 left-[17px] top-2 w-px bg-slate-200" />
                                    <div className="relative flex gap-4">
                                        <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                            <Clock3 size={16} />
                                        </div>
                                        <div className="flex-1 border-b border-slate-100 pb-5">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-900">Employee logged in</p>
                                                    <p className="mt-1 text-[11px] text-slate-500">Work session started successfully.</p>
                                                </div>
                                                <span className="whitespace-nowrap text-[10px] font-semibold text-slate-400">
                                                    {employeeAttendance?.loginTime || "—"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative flex gap-4">
                                        <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                                            <BriefcaseBusiness size={16} />
                                        </div>
                                        <div className="flex-1 border-b border-slate-100 pb-5">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-900">Current work status</p>
                                                    <p className="mt-1 text-[11px] text-slate-500">
                                                        {employeeOverview?.status === "Working"
                                                            ? "Employee is currently working on assigned tasks."
                                                            : "No active task assigned right now."}
                                                    </p>
                                                    <p className="mt-2 text-[10px] font-semibold text-violet-600">
                                                        {employeeOverview?.status || "Free"}
                                                    </p>
                                                </div>
                                                <span className="whitespace-nowrap text-[10px] font-semibold text-slate-400">
                                                    {employeeAttendance?.loginTime || "—"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative flex gap-4">
                                        <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                                            <Activity size={16} />
                                        </div>
                                        <div className="flex-1 border-b border-slate-100 pb-5">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-900">Work progress updated</p>
                                                    <p className="mt-1 text-[11px] text-slate-500">
                                                        Open tasks: {employeeOverview?.openTasks ?? 0}
                                                    </p>
                                                </div>
                                                <span className="whitespace-nowrap text-[10px] font-semibold text-slate-400">
                                                    {employeeAttendance?.activeTime || "0m"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative flex gap-4">
                                        <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                                            <Coffee size={16} />
                                        </div>
                                        <div className="flex-1 border-b border-slate-100 pb-5">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-900">Break time recorded</p>
                                                    <p className="mt-1 text-[11px] text-slate-500">
                                                        Break time today: {employeeAttendance?.breakTime || "0m"}
                                                    </p>
                                                </div>
                                                <span className="whitespace-nowrap text-[10px] font-semibold text-slate-400">
                                                    {employeeAttendance?.breakTime || "0m"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative flex gap-4">
                                        <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                                            <CheckCircle size={16} />
                                        </div>
                                        <div className="flex-1 border-b border-slate-100 pb-5">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-900">Tasks completed today</p>
                                                    <p className="mt-1 text-[11px] text-slate-500">
                                                        Completed today: {employeeOverview?.completedToday ?? 0} tasks
                                                    </p>
                                                </div>
                                                <span className="whitespace-nowrap text-[10px] font-semibold text-slate-400">
                                                    {employeeAttendance?.activeTime || "0m"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {employeeTab === "pc-activity" && selectedPcActivity && (
                        <div className="space-y-6">
                            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                        Activity Date
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Review application usage, idle time and work activity for a selected date.
                                    </p>
                                </div>
                                <input
                                    type="date"
                                    value={pcActivityDate}
                                    onChange={(event) => setPcActivityDate(event.target.value)}
                                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                        Productive Time
                                    </p>
                                    <p className="mt-3 text-2xl font-semibold text-emerald-700">
                                        {selectedPcActivity?.summary?.productiveTime || "0m"}
                                    </p>
                                    <p className="mt-2 text-xs text-slate-500">Work-related application usage</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                        Idle Time
                                    </p>
                                    <p className="mt-3 text-2xl font-semibold text-amber-700">
                                        {selectedPcActivity?.summary?.idleTime || "0m"}
                                    </p>
                                    <p className="mt-2 text-xs text-slate-500">No keyboard or mouse activity</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                        Break Time
                                    </p>
                                    <p className="mt-3 text-2xl font-semibold text-blue-700">
                                        {employeeAttendance?.breakTime || "0m"}
                                    </p>
                                    <p className="mt-2 text-xs text-slate-500">Recorded employee breaks</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                        Applications Used
                                    </p>
                                    <p className="mt-3 text-2xl font-semibold text-violet-700">
                                        {selectedPcActivity?.summary?.applicationsUsed || 0}
                                    </p>
                                    <p className="mt-2 text-xs text-slate-500">Applications opened today</p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                            Current PC Activity
                                        </p>
                                        <h3 className="mt-2 text-base font-semibold text-slate-950">
                                            {selectedPcActivity?.currentActivity?.application || "No activity"}
                                        </h3>
                                        <p className="mt-2 max-w-lg text-xs text-slate-500">
                                            {selectedPcActivity?.currentActivity?.windowTitle || "No application activity recorded."}
                                        </p>
                                    </div>
                                    <span
                                        className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold ${selectedPcActivity?.currentActivity?.status === "Working"
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "bg-slate-100 text-slate-600"
                                            }`}
                                    >
                                        {selectedPcActivity?.currentActivity?.status || "Offline"}
                                    </span>
                                </div>
                                <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
                                    <div>
                                        <p className="text-[10px] text-slate-400">Activity Started</p>
                                        <p className="mt-1 text-sm font-semibold text-slate-900">
                                            {selectedPcActivity?.currentActivity?.startedAt
                                                ? new Date(selectedPcActivity.currentActivity.startedAt).toLocaleTimeString("en-IN", {
                                                    hour: "numeric",
                                                    minute: "2-digit",
                                                })
                                                : "—"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400">Running Time</p>
                                        <p className="mt-1 text-sm font-semibold text-slate-900">
                                            {selectedPcActivity?.currentActivity?.runningTime || "0m"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400">Device Name</p>
                                        <p className="mt-1 text-sm font-semibold text-slate-900">
                                            {selectedPcActivity?.currentActivity?.deviceName || "Not registered"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400">Last Service Sync</p>
                                        <div className="mt-1 flex items-center gap-2">
                                            <span
                                                className={`h-2 w-2 rounded-full ${selectedPcActivity?.currentActivity?.status === "Working"
                                                        ? "bg-emerald-500"
                                                        : "bg-slate-300"
                                                    }`}
                                            />
                                            <p className="text-sm font-semibold text-slate-900">
                                                {selectedPcActivity?.currentActivity?.lastSyncAt
                                                    ? new Date(selectedPcActivity.currentActivity.lastSyncAt).toLocaleTimeString("en-IN", {
                                                        hour: "numeric",
                                                        minute: "2-digit",
                                                    })
                                                    : "—"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                                <div className="border-b border-slate-200 px-6 py-4">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                        Application Timeline
                                    </p>
                                    <h3 className="mt-1 text-sm font-semibold text-slate-950">Applications and time spent today</h3>
                                </div>
                                {selectedPcActivity?.applications?.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-[800px] w-full">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                        Application
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                        Category
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                        Start
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                        End
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                        Duration
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                        Classification
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedPcActivity.applications.map((activity) => (
                                                    <tr key={activity.id} className="border-t border-slate-100">
                                                        <td className="px-6 py-4 text-xs font-semibold text-slate-900">
                                                            {activity.application}
                                                        </td>
                                                        <td className="px-4 py-4 text-xs text-slate-600">{activity.category}</td>
                                                        <td className="px-4 py-4 text-xs text-slate-600">
                                                            {activity.startedAt
                                                                ? new Date(activity.startedAt).toLocaleTimeString("en-IN", {
                                                                    hour: "numeric",
                                                                    minute: "2-digit",
                                                                })
                                                                : "—"}
                                                        </td>
                                                        <td className="px-4 py-4 text-xs text-slate-600">
                                                            {activity.endedAt
                                                                ? new Date(activity.endedAt).toLocaleTimeString("en-IN", {
                                                                    hour: "numeric",
                                                                    minute: "2-digit",
                                                                })
                                                                : "—"}
                                                        </td>
                                                        <td className="px-4 py-4 text-xs font-semibold text-slate-800">
                                                            {activity.duration}
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <span
                                                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${activity.productivity === "Productive"
                                                                        ? "bg-emerald-50 text-emerald-700"
                                                                        : activity.productivity === "Unproductive"
                                                                            ? "bg-rose-50 text-rose-700"
                                                                            : "bg-slate-100 text-slate-600"
                                                                    }`}
                                                            >
                                                                {activity.productivity}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="px-6 py-12 text-center">
                                        <p className="text-sm font-semibold text-slate-700">No PC activity available</p>
                                        <p className="mt-2 text-xs text-slate-500">
                                            The Windows activity service has not synced data for this employee.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-6 lg:grid-cols-2">
                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                        Top Applications
                                    </p>
                                    <div className="mt-5 space-y-4">
                                        {selectedPcActivity?.topApplications?.length > 0 ? (
                                            selectedPcActivity.topApplications.map((application) => (
                                                <div key={application.name}>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div>
                                                            <p className="text-xs font-semibold text-slate-900">
                                                                {application.name}
                                                            </p>
                                                            <p className="mt-1 text-[10px] text-slate-500">
                                                                {application.duration}
                                                            </p>
                                                        </div>
                                                        <span className="text-xs font-semibold text-slate-700">
                                                            {application.percentage}%
                                                        </span>
                                                    </div>
                                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                                        <div
                                                            className="h-full rounded-full bg-violet-500"
                                                            style={{ width: `${application.percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-slate-500">No application summary available.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                        Idle Sessions
                                    </p>
                                    <div className="mt-5 space-y-3">
                                        {selectedPcActivity?.idleSessions?.length > 0 ? (
                                            selectedPcActivity.idleSessions.map((session) => (
                                                <div
                                                    key={session.id}
                                                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                                                >
                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-900">
                                                            {session.start} – {session.end}
                                                        </p>
                                                        <p className="mt-1 text-[10px] text-slate-500">
                                                            No keyboard or mouse activity
                                                        </p>
                                                    </div>
                                                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                                                        {session.duration}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-slate-500">No idle sessions recorded.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Original Team Table View (when no employee is selected)
    return (
        <div className="enterprise-page">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
                        Employee Management
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                        Team
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Monitor employee availability, attendance, workload and daily activity.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex rounded-xl border border-slate-200 bg-white p-1">
                        <button
                            type="button"
                            onClick={() => setTeamView("table")}
                            className={`h-8 rounded-lg px-3 text-xs font-semibold transition ${teamView === "table"
                                    ? "bg-slate-900 text-white"
                                    : "text-slate-500 hover:bg-slate-100"
                                }`}
                        >
                            Team Table
                        </button>
                        <button
                            type="button"
                            onClick={() => setTeamView("board")}
                            className={`h-8 rounded-lg px-3 text-xs font-semibold transition ${teamView === "board"
                                    ? "bg-slate-900 text-white"
                                    : "text-slate-500 hover:bg-slate-100"
                                }`}
                        >
                            Task Board
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={openAddEmployeeDrawer}
                        className="flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
                    >
                        <UserPlus size={17} />
                        Add Employee
                    </button>
                </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="enterprise-surface enterprise-surface--interactive p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Total Employees
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-slate-950">
                                {employeeList.length}
                            </p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                            <Users size={19} />
                        </div>
                    </div>
                    <p className="mt-4 text-xs text-slate-500">Active company team members</p>
                </div>
                <div className="enterprise-surface enterprise-surface--interactive p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Currently Working
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-slate-950">
                                {workingCount}
                            </p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                            <Activity size={19} />
                        </div>
                    </div>
                    <p className="mt-4 text-xs text-amber-600">Employees handling active work</p>
                </div>
                <div className="enterprise-surface enterprise-surface--interactive p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Free Now
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-slate-950">
                                {freeCount}
                            </p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                            <UserCheck size={19} />
                        </div>
                    </div>
                    <p className="mt-4 text-xs text-emerald-600">Available for new assignments</p>
                </div>
                <div className="enterprise-surface enterprise-surface--interactive p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                On Leave
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-slate-950">
                                {leaveCount}
                            </p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                            <Coffee size={19} />
                        </div>
                    </div>
                    <p className="mt-4 text-xs text-rose-600">Employees unavailable today</p>
                </div>
            </div>

            {teamView === "table" && (
                <div className="enterprise-surface mt-6 overflow-hidden">
                    <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-950">Team Workload</h3>
                            <p className="mt-1 text-xs text-slate-500">
                                {employeeList.length} employees found
                            </p>
                        </div>
                        <div className="relative w-full lg:w-80">
                            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search employee, role, task..."
                                className="enterprise-input h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="enterprise-table min-w-[1420px] w-full">
                            <thead className="bg-slate-50">
                                <tr className="border-b border-slate-200">
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        Employee
                                    </th>
                                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        Current Work
                                    </th>
                                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        Current App
                                    </th>
                                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        Login
                                    </th>
                                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        Active Time
                                    </th>
                                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        Tasks
                                    </th>
                                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        Last Activity
                                    </th>
                                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {employeesLoading ? (
                                    <tr>
                                        <td colSpan="9" className="px-6 py-16 text-center">
                                            <RefreshCw size={28} className="mx-auto animate-spin text-violet-600" />
                                            <p className="mt-3 text-sm font-semibold text-slate-700">Loading employees...</p>
                                        </td>
                                    </tr>
                                ) : employeesError ? (
                                    <tr>
                                        <td colSpan="9" className="px-6 py-16 text-center">
                                            <AlertCircle size={30} className="mx-auto text-rose-500" />
                                            <p className="mt-3 text-sm font-semibold text-rose-700">{employeesError}</p>
                                            <button
                                                type="button"
                                                onClick={loadEmployees}
                                                className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
                                            >
                                                Retry
                                            </button>
                                        </td>
                                    </tr>
                                ) : employeeList.length > 0 ? (
                                    employeeList.map((employee) => (
                                        <tr
                                            key={employee.id}
                                            onClick={() => {
                                                setSelectedEmployee(employee);
                                                setEmployeeTab("overview");
                                            }}
                                            className="cursor-pointer border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/70"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-semibold text-white">
                                                        {employee.initials}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-950">
                                                            {employee.name}
                                                        </p>
                                                        <p className="mt-1 text-[11px] text-slate-500">
                                                            {employee.employeeCode} · {employee.role}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${getStatusClasses(
                                                        employee.status
                                                    )}`}
                                                >
                                                    {employee.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="max-w-[240px] truncate text-xs font-semibold text-slate-800">
                                                    {employee.currentTask}
                                                </p>
                                                <p className="mt-1 text-[10px] text-slate-500">
                                                    {employee.client} · {employee.project}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4">
                                                {pcActivityData[employee.id]?.[pcActivityDate]?.currentActivity ? (
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                                            <p className="max-w-[180px] truncate text-xs font-semibold text-slate-800">
                                                                {pcActivityData[employee.id][pcActivityDate].currentActivity.application}
                                                            </p>
                                                        </div>
                                                        <p className="mt-1 max-w-[180px] truncate text-[10px] text-slate-500">
                                                            {pcActivityData[employee.id][pcActivityDate].currentActivity.windowTitle}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="h-2 w-2 rounded-full bg-slate-300" />
                                                            <p className="text-xs font-semibold text-slate-500">Not connected</p>
                                                        </div>
                                                        <p className="mt-1 text-[10px] text-slate-400">PC service offline</p>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                                    <Clock3 size={14} className="text-slate-400" />
                                                    {employee.loginTime}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-xs font-semibold text-slate-800">
                                                    {employee.activeTime}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="rounded-full bg-violet-50 px-2 py-1 text-[10px] font-bold text-violet-700">
                                                        {employee.openTasks} open
                                                    </span>
                                                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                                                        {employee.completedToday} done
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-xs text-slate-500">
                                                {employee.lastActivity}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {employee.status === "Free" && (
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                openAssignTaskDrawer(employee);
                                                            }}
                                                            className="flex h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                                        >
                                                            <BriefcaseBusiness size={14} />
                                                            Assign
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            openEditEmployeeDrawer(employee);
                                                        }}
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                                                        title="Edit employee"
                                                    >
                                                        <MoreHorizontal size={17} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="px-6 py-16 text-center">
                                            <Users size={30} className="mx-auto text-slate-300" />
                                            <p className="mt-3 text-sm font-semibold text-slate-700">No employees found</p>
                                            <p className="mt-1 text-xs text-slate-400">Create your first employee account.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {teamView === "board" && (
                <div className="mt-6">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-950">Task Assignment Board</h3>
                            <p className="mt-1 text-xs text-slate-500">
                                Track assigned, active and completed work across the team.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                const availableEmployee =
                                    employeeList.find((employee) => employee.status === "Free") ||
                                    employeeList[0];
                                if (availableEmployee) {
                                    openAssignTaskDrawer(availableEmployee);
                                }
                            }}
                            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white transition hover:bg-violet-700"
                        >
                            <BriefcaseBusiness size={15} />
                            Create Task
                        </button>
                    </div>
                    {tasksLoading && (
                        <div className="mb-4 rounded-xl border border-slate-200 bg-white px-5 py-4">
                            <div className="flex items-center gap-3">
                                <RefreshCw size={18} className="animate-spin text-violet-600" />
                                <p className="text-xs font-semibold text-slate-600">Loading tasks...</p>
                            </div>
                        </div>
                    )}
                    {tasksError && !tasksLoading && (
                        <div className="mb-4 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-5 py-4">
                            <div className="flex items-center gap-3">
                                <AlertCircle size={18} className="text-rose-600" />
                                <p className="text-xs font-semibold text-rose-700">{tasksError}</p>
                            </div>
                            <button
                                type="button"
                                onClick={loadTasks}
                                className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white"
                            >
                                Retry
                            </button>
                        </div>
                    )}
                    <div className="grid gap-4 xl:grid-cols-3">
                        {[
                            { id: "Assigned", title: "Assigned", description: "Tasks waiting to start", headerClass: "bg-blue-50 text-blue-700" },
                            { id: "In Progress", title: "In Progress", description: "Tasks currently being worked on", headerClass: "bg-violet-50 text-violet-700" },
                            { id: "Completed", title: "Completed", description: "Finished tasks", headerClass: "bg-emerald-50 text-emerald-700" },
                        ].map((column) => {
                            const columnTasks = assignedTasks.filter(
                                (task) => task.status === column.id
                            );
                            return (
                                <div key={column.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70">
                                    <div className="border-b border-slate-200 bg-white px-4 py-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${column.headerClass}`}>
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
                                    <div className="min-h-[420px] space-y-3 p-3">
                                        {columnTasks.length > 0 ? (
                                            columnTasks.map((task) => (
                                                <div key={task.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
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
                                                            className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold ${task.priority === "Critical"
                                                                    ? "bg-rose-50 text-rose-700"
                                                                    : task.priority === "High"
                                                                        ? "bg-orange-50 text-orange-700"
                                                                        : task.priority === "Medium"
                                                                            ? "bg-amber-50 text-amber-700"
                                                                            : "bg-slate-100 text-slate-600"
                                                                }`}
                                                        >
                                                            {task.priority}
                                                        </span>
                                                    </div>
                                                    <div className="mt-4 space-y-2">
                                                        <div className="flex items-center justify-between gap-3 text-[10px]">
                                                            <span className="text-slate-400">Employee</span>
                                                            <span className="font-semibold text-slate-700">
                                                                <div className="text-right">
                                                                    <p className="font-semibold text-slate-700">
                                                                        {task.assignedEmployeeName || "Not assigned"}
                                                                    </p>
                                                                    {task.assignedEmployeeCode && (
                                                                        <p className="mt-0.5 text-[9px] text-slate-400">
                                                                            {task.assignedEmployeeCode}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-3 text-[10px]">
                                                            <span className="text-slate-400">Client</span>
                                                            <span className="max-w-[170px] truncate font-semibold text-slate-700">
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
                                                            {task.estimatedTime}
                                                        </span>
                                                        {task.status === "Assigned" && (
                                                            <button
                                                                type="button"
                                                                disabled={updatingTaskId === task.id}
                                                                onClick={() => updateTaskStatus(task.id, "In Progress")}
                                                                className="rounded-lg bg-violet-50 px-3 py-2 text-[10px] font-semibold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                            >
                                                                {updatingTaskId === task.id ? (
                                                                    <RefreshCw size={14} className="animate-spin" />
                                                                ) : (
                                                                    "Start"
                                                                )}
                                                            </button>
                                                        )}
                                                        {task.status === "In Progress" && (
                                                            <button
                                                                type="button"
                                                                disabled={updatingTaskId === task.id}
                                                                onClick={() => updateTaskStatus(task.id, "Completed")}
                                                                className="rounded-lg bg-emerald-50 px-3 py-2 text-[10px] font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                            >
                                                                {updatingTaskId === task.id ? (
                                                                    <RefreshCw size={14} className="animate-spin" />
                                                                ) : (
                                                                    "Complete"
                                                                )}
                                                            </button>
                                                        )}
                                                        {task.status === "Completed" && (
                                                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                                                                Done
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/60 p-6 text-center">
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-600">
                                                        No {column.title.toLowerCase()} tasks
                                                    </p>
                                                    <p className="mt-2 text-[10px] text-slate-400">
                                                        Tasks will appear here when their status changes.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Employee Form Drawer */}
      {/* =========================================================
    PREMIUM ADD / EDIT EMPLOYEE DRAWER
========================================================= */}
{employeeFormOpen && (
    <div className="fixed inset-0 z-[110]">
        {/* Backdrop */}
        <button
            type="button"
            aria-label="Close employee form"
            onClick={closeEmployeeDrawer}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[3px]"
        />

        {/* Drawer */}
        <aside className="absolute inset-y-0 right-0 flex w-full max-w-[860px] flex-col overflow-hidden border-l border-slate-200 bg-[#f8fafc] shadow-[-30px_0_80px_rgba(15,23,42,0.20)]">

            {/* ================= HEADER ================= */}
            <div className="relative shrink-0 overflow-hidden border-b border-slate-200 bg-white">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-600 via-indigo-500 to-blue-500" />

                <div className="flex min-h-[100px] items-center justify-between gap-6 px-6 py-5 lg:px-8">
                    <div className="flex min-w-0 items-center gap-4">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/20">
                            {editingEmployeeId ? (
                                <Edit size={20} />
                            ) : (
                                <UserPlus size={20} />
                            )}
                        </div>

                        <div className="min-w-0">
                            <div className="mb-1 flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600">
                                    Employee Management
                                </span>

                                <span className="h-1 w-1 rounded-full bg-slate-300" />

                                <span className="text-[10px] font-medium text-slate-400">
                                    {editingEmployeeId
                                        ? "Update Employee"
                                        : "New Employee"}
                                </span>
                            </div>

                            <h2 className="text-xl font-bold tracking-[-0.025em] text-slate-950">
                                {editingEmployeeId
                                    ? "Edit Employee Profile"
                                    : "Add New Employee"}
                            </h2>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                {editingEmployeeId
                                    ? "Update employee identity, organization details and login access."
                                    : "Create the employee profile and configure their system login access."}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={closeEmployeeDrawer}
                        disabled={savingEmployee}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            <form
                onSubmit={handleSaveEmployee}
                className="flex min-h-0 flex-1 flex-col"
            >
                {/* ================= SCROLL AREA ================= */}
                <div className="flex-1 overflow-y-auto">
                    <div className="space-y-6 p-5 sm:p-6 lg:p-8">

                        {/* =====================================================
                            SECTION 1 - EMPLOYEE IDENTITY
                        ===================================================== */}
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_6px_24px_rgba(15,23,42,0.04)]">

                            <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                                    <User size={17} />
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Employee Identity
                                    </h3>

                                    <p className="mt-0.5 text-[11px] text-slate-500">
                                        Basic employee identification and contact information.
                                    </p>
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="grid gap-5 md:grid-cols-2">

                                    {/* Employee Code */}
                                    <div>
                                        <label className="mb-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                                            Employee Code
                                            <span className="text-rose-500">*</span>
                                        </label>

                                        <div className="relative">
                                            <UserCheck
                                                size={16}
                                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                            />

                                            <input
                                                required
                                                name="employeeCode"
                                                value={employeeForm.employeeCode}
                                                onChange={handleEmployeeFormChange}
                                                placeholder="EMP001"
                                                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold uppercase text-slate-800 outline-none transition-all placeholder:font-normal placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>

                                        <p className="mt-1.5 text-[10px] text-slate-400">
                                            Unique internal employee identification code.
                                        </p>
                                    </div>

                                    {/* Employee Name */}
                                    <div>
                                        <label className="mb-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                                            Full Name
                                            <span className="text-rose-500">*</span>
                                        </label>

                                        <div className="relative">
                                            <User
                                                size={16}
                                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                            />

                                            <input
                                                required
                                                name="name"
                                                value={employeeForm.name}
                                                onChange={handleEmployeeFormChange}
                                                placeholder="Employee full name"
                                                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition-all placeholder:font-normal placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>
                                    </div>

                                    {/* Mobile */}
                                    <div>
                                        <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                                            Mobile Number
                                        </label>

                                        <div className="relative">
                                            <Phone
                                                size={16}
                                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                            />

                                            <input
                                                name="mobile"
                                                value={employeeForm.mobile}
                                                onChange={handleEmployeeFormChange}
                                                placeholder="+91 98765 43210"
                                                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="mb-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                                            Login Email
                                            <span className="text-rose-500">*</span>
                                        </label>

                                        <div className="relative">
                                            <Mail
                                                size={16}
                                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                            />

                                            <input
                                                required
                                                type="email"
                                                name="email"
                                                value={employeeForm.email}
                                                onChange={handleEmployeeFormChange}
                                                placeholder="employee@company.com"
                                                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>

                                        <p className="mt-1.5 text-[10px] text-slate-400">
                                            This email will be used for employee login.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* =====================================================
                            SECTION 2 - ORGANIZATION INFORMATION
                        ===================================================== */}
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_6px_24px_rgba(15,23,42,0.04)]">

                            <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <Building2 size={17} />
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Organization Information
                                    </h3>

                                    <p className="mt-0.5 text-[11px] text-slate-500">
                                        Define employee position, department and current availability.
                                    </p>
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="grid gap-5 md:grid-cols-2">

                                    {/* Role */}
                                    <div>
                                        <label className="mb-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                                            Role / Designation
                                            <span className="text-rose-500">*</span>
                                        </label>

                                        <div className="relative">
                                            <Briefcase
                                                size={16}
                                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                            />

                                            <input
                                                required
                                                name="role"
                                                value={employeeForm.role}
                                                onChange={handleEmployeeFormChange}
                                                placeholder="Support Executive"
                                                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>
                                    </div>

                                    {/* Department */}
                                    <div>
                                        <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                                            Department
                                        </label>

                                        <div className="relative">
                                            <Building2
                                                size={16}
                                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                            />

                                            <select
                                                name="department"
                                                value={employeeForm.department}
                                                onChange={handleEmployeeFormChange}
                                                className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            >
                                                <option value="Support">
                                                    Support
                                                </option>
                                                <option value="Development">
                                                    Development
                                                </option>
                                                <option value="Implementation">
                                                    Implementation
                                                </option>
                                                <option value="Sales">
                                                    Sales
                                                </option>
                                                <option value="Accounts">
                                                    Accounts
                                                </option>
                                                <option value="Management">
                                                    Management
                                                </option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Joining Date */}
                                    <div>
                                        <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                                            Joining Date
                                        </label>

                                        <div className="relative">
                                            <CalendarDays
                                                size={16}
                                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                            />

                                            <input
                                                type="date"
                                                name="joiningDate"
                                                value={employeeForm.joiningDate}
                                                onChange={handleEmployeeFormChange}
                                                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div>
                                        <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                                            Current Status
                                        </label>

                                        <select
                                            name="status"
                                            value={employeeForm.status}
                                            onChange={handleEmployeeFormChange}
                                            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        >
                                            <option value="Free">
                                                Free
                                            </option>

                                            <option value="Working">
                                                Working
                                            </option>

                                            <option value="Break">
                                                Break
                                            </option>

                                            <option value="Leave">
                                                Leave
                                            </option>
                                        </select>
                                    </div>
                                </div>

                                {/* Status helper */}
                                <div className="mt-5 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                                        <Activity size={16} />
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold text-blue-950">
                                            Employee availability
                                        </p>

                                        <p className="mt-1 text-[10px] leading-5 text-blue-700">
                                            Free employees can receive new assignments.
                                            Working employees are currently engaged with assigned tasks.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* =====================================================
                            SECTION 3 - LOGIN SECURITY
                        ===================================================== */}
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_6px_24px_rgba(15,23,42,0.04)]">

                            <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4">

                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                    <Shield size={17} />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-sm font-bold text-slate-900">
                                            Login & Security
                                        </h3>

                                        {editingEmployeeId && (
                                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                                                Optional
                                            </span>
                                        )}
                                    </div>

                                    <p className="mt-0.5 text-[11px] text-slate-500">
                                        {editingEmployeeId
                                            ? "Leave both password fields blank to keep the existing password."
                                            : "Set a temporary password for the employee's first login."}
                                    </p>
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="grid gap-5 md:grid-cols-2">

                                    <div>
                                        <label className="mb-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                                            {editingEmployeeId
                                                ? "New Password"
                                                : "Temporary Password"}

                                            {!editingEmployeeId && (
                                                <span className="text-rose-500">*</span>
                                            )}
                                        </label>

                                        <div className="relative">
                                            <Shield
                                                size={16}
                                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                            />

                                            <input
                                                type="password"
                                                name="password"
                                                value={employeeForm.password}
                                                onChange={handleEmployeeFormChange}
                                                placeholder={
                                                    editingEmployeeId
                                                        ? "Leave blank to keep existing"
                                                        : "Minimum 6 characters"
                                                }
                                                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                                            Confirm Password

                                            {!editingEmployeeId && (
                                                <span className="text-rose-500">*</span>
                                            )}
                                        </label>

                                        <div className="relative">
                                            <Shield
                                                size={16}
                                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                            />

                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                value={employeeForm.confirmPassword}
                                                onChange={handleEmployeeFormChange}
                                                placeholder="Repeat password"
                                                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/70 p-4">
                                    <Shield
                                        size={16}
                                        className="mt-0.5 shrink-0 text-amber-600"
                                    />

                                    <div>
                                        <p className="text-xs font-semibold text-amber-900">
                                            Login Security
                                        </p>

                                        <p className="mt-1 text-[10px] leading-5 text-amber-700">
                                            Password must contain at least 6 characters.
                                            Employee email must remain unique because it is used as the login identity.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                {/* ================= STICKY FOOTER ================= */}
                <div className="shrink-0 border-t border-slate-200 bg-white/95 px-5 py-4 shadow-[0_-8px_30px_rgba(15,23,42,0.05)] backdrop-blur sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <div className="hidden sm:block">
                            <p className="text-[10px] font-semibold text-slate-500">
                                <span className="text-rose-500">*</span>{" "}
                                Required information
                            </p>

                            <p className="mt-0.5 text-[9px] text-slate-400">
                                Employee profile and login access will be saved together.
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeEmployeeDrawer}
                                disabled={savingEmployee}
                                className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={savingEmployee}
                                className="flex h-11 min-w-[155px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 text-xs font-bold text-white shadow-lg shadow-violet-600/20 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                            >
                                {savingEmployee ? (
                                    <>
                                        <RefreshCw
                                            size={15}
                                            className="animate-spin"
                                        />
                                        Saving...
                                    </>
                                ) : editingEmployeeId ? (
                                    <>
                                        <Edit size={15} />
                                        Update Employee
                                    </>
                                ) : (
                                    <>
                                        <UserPlus size={15} />
                                        Add Employee
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </aside>
    </div>
)}

            {/* Assign Task Drawer */}
            {assignTaskOpen && taskEmployee && (
                <div className="fixed inset-0 z-[120]">
                    <button
                        type="button"
                        aria-label="Close assign task form"
                        onClick={closeAssignTaskDrawer}
                        className="enterprise-backdrop absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
                    />
                    <aside className="enterprise-drawer absolute right-0 top-0 flex h-full w-full max-w-[640px] flex-col bg-white shadow-2xl">
                        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-xs font-semibold text-white">
                                    {taskEmployee.initials}
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-600">
                                        Task Assignment
                                    </p>
                                    <h2 className="mt-1 text-lg font-semibold text-slate-950">
                                        Assign Task to {taskEmployee.name}
                                    </h2>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {taskEmployee.employeeCode} · {taskEmployee.role}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={closeAssignTaskDrawer}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleAssignTask} className="flex min-h-0 flex-1 flex-col">
                            <div className="flex-1 overflow-y-auto bg-slate-50/70 p-6">
                                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="sm:col-span-2">
                                            <label className="text-[11px] font-semibold text-slate-600">Task Title</label>
                                            <input
                                                type="text"
                                                name="title"
                                                value={taskForm.title}
                                                onChange={handleTaskFormChange}
                                                placeholder="Enter task title"
                                                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-600">Work Type</label>
                                            <select
                                                name="workType"
                                                value={taskForm.workType}
                                                onChange={handleTaskFormChange}
                                                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            >
                                                <option value="Client Support">Client Support</option>
                                                <option value="Internal Development">Internal Development</option>
                                                <option value="Documentation">Documentation</option>
                                                <option value="Testing">Testing</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-600">Priority</label>
                                            <select
                                                name="priority"
                                                value={taskForm.priority}
                                                onChange={handleTaskFormChange}
                                                disabled={taskSettingsLoading}
                                                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:opacity-60"
                                            >
                                                <option value="">Select priority</option>
                                                {taskPriorities.map((priority) => (
                                                    <option key={priority.id} value={priority.name}>
                                                        {priority.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold text-slate-600">Task For *</label>
                                            <select
                                                name="taskFor"
                                                value={taskForm.taskFor}
                                                onChange={(event) => {
                                                    const value = event.target.value;
                                                    setTaskForm((current) => ({
                                                        ...current,
                                                        taskFor: value,
                                                        productId: "",
                                                        projectId: "",
                                                        projectCode: "",
                                                        projectName: "",
                                                        generalTaskFor: "",
                                                    }));
                                                }}
                                                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            >
                                                <option value="Project">Project</option>
                                                <option value="Product">Product</option>
                                                <option value="General">General / Internal</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-xs font-semibold text-slate-700">Client</label>
                                            <select
                                                name="clientId"
                                                value={taskForm.clientId}
                                                disabled={clientsLoading}
                                                onChange={(event) => {
                                                    const clientId = event.target.value;
                                                    const selectedClient = clientList.find(
                                                        (client) => String(client.id) === String(clientId)
                                                    );
                                                    setTaskForm((current) => ({
                                                        ...current,
                                                        clientId,
                                                        client: selectedClient?.companyName || "Internal Development",
                                                        productId: "",
                                                        projectId: "",
                                                        projectCode: "",
                                                        projectName: "",
                                                    }));
                                                }}
                                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:opacity-60"
                                            >
                                                <option value="">
                                                    {clientsLoading ? "Loading clients..." : "Internal Development"}
                                                </option>
                                                {clientList.map((client) => (
                                                    <option key={String(client.id)} value={String(client.id)}>
                                                        {client.companyName}
                                                        {client.code ? ` (${client.code})` : ""}
                                                    </option>
                                                ))}
                                            </select>
                                            {!clientsLoading && !clientsError && clientList.length === 0 && (
                                                <p className="mt-1 text-[10px] text-amber-600">
                                                    No clients received from Client Master.
                                                </p>
                                            )}
                                            {clientsError && (
                                                <div className="mt-1 flex items-center justify-between gap-2">
                                                    <p className="text-[10px] text-rose-600">{clientsError}</p>
                                                    <button type="button" onClick={loadClients} className="text-[10px] font-semibold text-violet-700">
                                                        Retry
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        {taskForm.taskFor === "Project" && (
                                            <div>
                                                <label className="block text-[10px] font-semibold text-slate-600">Project *</label>
                                                <select
                                                    name="projectId"
                                                    value={taskForm.projectId}
                                                    disabled={projectsLoading}
                                                    onChange={(event) => {
                                                        const projectId = event.target.value;
                                                        const selectedProject = projects.find(
                                                            (project) => String(project.id) === String(projectId)
                                                        );
                                                        setTaskForm((current) => ({
                                                            ...current,
                                                            projectId: projectId,
                                                            projectCode: selectedProject?.projectCode || "",
                                                            projectName: selectedProject?.projectName || "",
                                                            clientId: selectedProject?.clientId || current.clientId,
                                                            client: selectedProject?.clientName || current.client,
                                                            productId: selectedProject?.productId || current.productId,
                                                        }));
                                                    }}
                                                    className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:opacity-60"
                                                >
                                                    <option value="">
                                                        {projectsLoading ? "Loading projects..." : "Select project"}
                                                    </option>
                                                    {availableProjects.map((project) => (
                                                        <option key={project.id} value={project.id}>
                                                            {project.projectCode ? `${project.projectCode} - ` : ""}
                                                            {project.projectName}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        {taskForm.taskFor === "Product" && (
                                            <div>
                                                <label className="block text-[10px] font-semibold text-slate-600">Product *</label>
                                                <select
                                                    name="productId"
                                                    value={taskForm.productId}
                                                    disabled={productsLoading}
                                                    onChange={(event) => {
                                                        setTaskForm((current) => ({
                                                            ...current,
                                                            productId: event.target.value,
                                                            projectId: "",
                                                            projectCode: "",
                                                            projectName: "",
                                                        }));
                                                    }}
                                                    className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:opacity-60"
                                                >
                                                    <option value="">
                                                        {productsLoading ? "Loading products..." : "Select product"}
                                                    </option>
                                                    {availableProducts.map((product) => (
                                                        <option key={product.id} value={product.id}>
                                                            {product.productCode ? `${product.productCode} - ` : ""}
                                                            {product.productName}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        {taskForm.taskFor === "General" && (
                                            <div>
                                                <label className="block text-[10px] font-semibold text-slate-600">General Task For *</label>
                                                <input
                                                    type="text"
                                                    name="generalTaskFor"
                                                    value={taskForm.generalTaskFor}
                                                    onChange={handleTaskFormChange}
                                                    placeholder="Example: Office, Training, Internal meeting"
                                                    className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-600">Due Date</label>
                                            <input
                                                type="date"
                                                name="dueDate"
                                                value={taskForm.dueDate}
                                                onChange={handleTaskFormChange}
                                                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold text-slate-600">Initial Status *</label>
                                            <select
                                                name="status"
                                                value={taskForm.status}
                                                onChange={handleTaskFormChange}
                                                disabled={taskSettingsLoading}
                                                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:opacity-60"
                                            >
                                                <option value="">Select status</option>
                                                {taskStatuses.map((status) => (
                                                    <option key={status.id} value={status.name}>
                                                        {status.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-600">Estimated Time</label>
                                            <input
                                                type="text"
                                                name="estimatedTime"
                                                value={taskForm.estimatedTime}
                                                onChange={handleTaskFormChange}
                                                placeholder="Example: 2h 30m"
                                                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="text-[11px] font-semibold text-slate-600">Task Description</label>
                                            <textarea
                                                name="description"
                                                value={taskForm.description}
                                                onChange={handleTaskFormChange}
                                                rows={5}
                                                placeholder="Describe the work, expected result and important instructions..."
                                                className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50 p-4">
                                    <p className="text-xs font-semibold text-violet-900">Employee workload</p>
                                    <div className="mt-3 grid grid-cols-3 gap-3">
                                        <div>
                                            <p className="text-[10px] text-violet-500">Open Tasks</p>
                                            <p className="mt-1 text-sm font-semibold text-violet-900">
                                                {taskEmployee.openTasks}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-violet-500">Current Status</p>
                                            <p className="mt-1 text-sm font-semibold text-violet-900">
                                                {taskEmployee.status}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-violet-500">Active Time</p>
                                            <p className="mt-1 text-sm font-semibold text-violet-900">
                                                {taskEmployee.activeTime}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
                                <button
                                    type="button"
                                    onClick={closeAssignTaskDrawer}
                                    className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingTask}
                                    className="flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {savingTask ? (
                                        <>
                                            <RefreshCw size={16} className="animate-spin" />
                                            Assigning Task...
                                        </>
                                    ) : (
                                        <>
                                            <BriefcaseBusiness size={16} />
                                            Assign Task
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </aside>
                </div>
            )}
        </div>
    );
}
