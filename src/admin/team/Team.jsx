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
    const [pcActivityDate, setPcActivityDate] = useState("2026-07-14");
    const [employeeFormOpen, setEmployeeFormOpen] = useState(false);
    const [assignTaskOpen, setAssignTaskOpen] = useState(false);
    const [taskEmployee, setTaskEmployee] = useState(null);

    const [taskForm, setTaskForm] = useState({
        title: "",

        workType:
            "Client Support",

        taskFor:
            "Project",

        generalTaskFor:
            "",

        clientId:
            "",

        client:
            "Internal Development",

        productId:
            "",

        projectId:
            "",

        projectCode:
            "",

        projectName:
            "",

        priority:
            "",

        status:
            "",

        dueDate:
            "",

        estimatedTime:
            "",

        description:
            "",
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
    const [projects, setProjects] =
        useState([]);

    const [products, setProducts] =
        useState([]);

    const [projectsLoading, setProjectsLoading] =
        useState(false);

    const [productsLoading, setProductsLoading] =
        useState(false);

    const [projectsError, setProjectsError] =
        useState("");

    const [productsError, setProductsError] =
        useState("");

    const [taskPriorities, setTaskPriorities] =
        useState([]);

    const [taskStatuses, setTaskStatuses] =
        useState([]);

    const [
        taskSettingsLoading,
        setTaskSettingsLoading,
    ] = useState(false);

    const [
        taskSettingsError,
        setTaskSettingsError,
    ] = useState("");
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
        if (!dateValue) {
            return "—";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatActiveTime = (minutes) => {
        const totalMinutes = Math.max(Number(minutes || 0), 0);

        if (totalMinutes < 60) {
            return `${totalMinutes}m`;
        }

        const hours = Math.floor(totalMinutes / 60);
        const remainingMinutes = totalMinutes % 60;

        return remainingMinutes > 0
            ? `${hours}h ${remainingMinutes}m`
            : `${hours}h`;
    };

    const normalizeEmployeeFromApi = (
        employee = {}
    ) => ({
        ...employee,

        id:
            employee._id ||
            employee.id ||
            "",

        employeeCode:
            employee.employeeCode ||
            "",

        name:
            employee.name ||
            "",

        initials:
            employee.initials ||
            String(employee.name || "")
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((word) =>
                    word.charAt(0).toUpperCase()
                )
                .join("") ||
            "NA",

        client:
            employee.client ||
            employee.currentClient ||
            "—",

        project:
            employee.project ||
            employee.currentProject ||
            "—",

        currentTask:
            employee.currentTask ||
            "Available for assignment",

        loginTime:
            formatEmployeeTime(
                employee.loginTime
            ),

        activeTime:
            formatActiveTime(
                employee.activeMinutes
            ),

        openTasks:
            Number(employee.openTasks || 0),

        completedToday:
            Number(
                employee.completedToday || 0
            ),

        lastActivity:
            employee.lastActivityAt
                ? new Date(
                    employee.lastActivityAt
                ).toLocaleString("en-IN")
                : "No activity yet",

        isActive:
            employee.isActive !== false,
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
        const text = String(value || "")
            .trim()
            .toLowerCase();

        if (!text) {
            return 0;
        }

        const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*h/);
        const minuteMatch = text.match(/(\d+)\s*m/);

        let minutes = 0;

        if (hourMatch) {
            minutes += Math.round(
                Number(hourMatch[1]) * 60
            );
        }

        if (minuteMatch) {
            minutes += Number(minuteMatch[1]);
        }

        if (!hourMatch && !minuteMatch) {
            const numericValue = Number(text);

            if (Number.isFinite(numericValue)) {
                minutes = Math.round(numericValue * 60);
            }
        }

        return Math.max(minutes, 0);
    };

    const formatTaskMinutes = (minutes) => {
        const totalMinutes = Math.max(
            Number(minutes || 0),
            0
        );

        if (totalMinutes === 0) {
            return "0m";
        }

        const hours = Math.floor(totalMinutes / 60);
        const remainingMinutes = totalMinutes % 60;

        if (hours === 0) {
            return `${remainingMinutes}m`;
        }

        if (remainingMinutes === 0) {
            return `${hours}h`;
        }

        return `${hours}h ${remainingMinutes}m`;
    };
    const normalizeTaskFromApi = (
        task = {}
    ) => {
        const assignedEmployeeId =
            task.assignedEmployeeId?._id ||
            task.assignedEmployeeId ||
            "";

        const assignedEmployeeName =
            task.assignedEmployeeName ||
            "";

        return {
            ...task,

            id:
                task._id ||
                task.id ||
                "",

            taskNo:
                task.taskCode ||
                task.taskNo ||
                "",

            assignedEmployeeId:
                assignedEmployeeId
                    ? String(assignedEmployeeId)
                    : "",

            assignedEmployeeCode:
                task.assignedEmployeeCode ||
                "",

            assignedEmployeeName:
                assignedEmployeeName ||
                "Not assigned",

            assignedEmployeeInitials:
                String(assignedEmployeeName)
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((word) =>
                        word
                            .charAt(0)
                            .toUpperCase()
                    )
                    .join(""),

            client:
                task.clientName ||
                task.client ||
                "Internal Development",

            projectId:
                task.projectId
                    ? String(task.projectId)
                    : "",

            projectCode:
                task.projectCode ||
                "",

            projectName:
                task.projectName ||
                task.project ||
                "",

            project:
                task.projectName ||
                task.project ||
                "",

            estimatedTime:
                formatTaskMinutes(
                    task.estimatedMinutes
                ),

            spentTime:
                formatTaskMinutes(
                    task.spentMinutes
                ),

            progress:
                Number(task.progress || 0),

            dueDate:
                task.dueDate
                    ? String(task.dueDate)
                        .slice(0, 10)
                    : "",

            assignedAt:
                task.createdAt
                    ? new Date(
                        task.createdAt
                    ).toLocaleString(
                        "en-IN",
                        {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        }
                    )
                    : "",
        };
    };

    const normalizeProjectFromApi = (
        project = {}
    ) => ({
        ...project,

        id:
            project._id ||
            project.id ||
            "",

        projectCode:
            project.projectCode ||
            "",

        projectName:
            project.projectName ||
            "",

        projectType:
            project.projectType ||
            "Internal Development",

        clientId:
            project.clientId
                ? String(project.clientId)
                : "",

        clientCode:
            project.clientCode ||
            "",

        clientName:
            project.clientName ||
            "",

        productId:
            project.productId
                ? String(project.productId)
                : "",

        productCode:
            project.productCode ||
            "",

        productName:
            project.productName ||
            "",

        status:
            project.status ||
            "Planned",

        priority:
            project.priority ||
            "",
    });
    const loadTasks = async () => {
        try {
            setTasksLoading(true);
            setTasksError("");

            const response = await fetch(
                `${API_URL}/api/admin/tasks`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${getAuthToken()}`,
                    },
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    "Unable to load tasks."
                );
            }

            const normalizedTasks = Array.isArray(
                result.data
            )
                ? result.data.map(
                    normalizeTaskFromApi
                )
                : [];

            setAssignedTasks(normalizedTasks);
        } catch (error) {
            console.error(
                "Load tasks error:",
                error
            );

            setTasksError(
                error.message ||
                "Unable to load tasks."
            );

            setAssignedTasks([]);
        } finally {
            setTasksLoading(false);
        }
    };
    const openAssignTaskDrawer = (
        employee
    ) => {
        setTaskEmployee(employee);

        setTaskForm({
            title:
                "",

            workType:
                "Client Support",

            taskFor:
                "Project",

            generalTaskFor:
                "",

            clientId:
                "",

            client:
                "Internal Development",

            productId:
                "",

            projectId:
                "",

            projectCode:
                "",

            projectName:
                "",

            priority:
                taskPriorities[0]
                    ?.name ||
                "",

            status:
                taskStatuses[0]
                    ?.name ||
                "",

            dueDate:
                "",

            estimatedTime:
                "",

            description:
                "",
        });

        setAssignTaskOpen(true);
    };
    const closeAssignTaskDrawer = () => {
        setAssignTaskOpen(false);
        setTaskEmployee(null);

        setTaskForm({
            title:
                "",

            workType:
                "Client Support",

            taskFor:
                "Project",

            generalTaskFor:
                "",

            clientId:
                "",

            client:
                "Internal Development",

            productId:
                "",

            projectId:
                "",

            projectCode:
                "",

            projectName:
                "",

            priority:
                taskPriorities[0]
                    ?.name ||
                "",

            status:
                taskStatuses[0]
                    ?.name ||
                "",

            dueDate:
                "",

            estimatedTime:
                "",

            description:
                "",
        });
    };
    const handleTaskFormChange = (
        event
    ) => {
        const { name, value } =
            event.target;

        setTaskForm((current) => ({
            ...current,
            [name]:
                value,
        }));
    };
    const handleAssignTask = async (event) => {
        event.preventDefault();

        if (!taskEmployee) {
            alert("Please select an employee.");
            return;
        }

        const employeeId =
            taskEmployee.id;

        if (!employeeId) {
            alert("Employee ID is missing.");
            return;
        }

        const title =
            taskForm.title.trim();

        if (!title) {
            alert(
                "Please enter task title."
            );
            return;
        }

        if (
            taskForm.taskFor ===
            "Project" &&
            !taskForm.projectId
        ) {
            alert(
                "Please select a project."
            );
            return;
        }

        if (
            taskForm.taskFor ===
            "Product" &&
            !taskForm.productId
        ) {
            alert(
                "Please select a product."
            );
            return;
        }

        if (
            taskForm.taskFor ===
            "General" &&
            !taskForm.generalTaskFor.trim()
        ) {
            alert(
                "Please enter who or what this general task is for."
            );
            return;
        }

        if (!taskForm.priority) {
            alert(
                "Please select priority."
            );
            return;
        }

        if (!taskForm.status) {
            alert(
                "Please select initial status."
            );
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

        const estimatedMinutes =
            estimatedTimeToMinutes(
                taskForm.estimatedTime
            );

        if (estimatedMinutes <= 0) {
            alert(
                "Enter estimated time like 2h, 1h 30m or 0.5."
            );
            return;
        }

        try {
            setSavingTask(true);

            const response = await fetch(
                `${API_URL}/api/admin/task`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${getAuthToken()}`,
                    },

                    body: JSON.stringify({
                        title,

                        description:
                            taskForm.description.trim(),

                        workType:
                            taskForm.workType,

                        taskFor:
                            taskForm.taskFor,

                        generalTaskFor:
                            taskForm.generalTaskFor
                                .trim(),

                        clientId:
                            taskForm.clientId ||
                            null,

                        clientName:
                            taskForm.client ||
                            "Internal Development",

                        productId:
                            taskForm.productId ||
                            null,

                        projectId:
                            taskForm.projectId ||
                            null,

                        assignedEmployeeId:
                            employeeId,

                        priority:
                            taskForm.priority,

                        status:
                            taskForm.status,

                        dueDate:
                            taskForm.dueDate,

                        estimatedMinutes,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    "Unable to assign task."
                );
            }

            const savedTask =
                normalizeTaskFromApi(result.data);

            setAssignedTasks((current) => [
                savedTask,
                ...current,
            ]);

            await loadEmployees();

            setSelectedEmployee((current) => {
                if (
                    !current ||
                    String(current.id) !==
                    String(employeeId)
                ) {
                    return current;
                }

                return {
                    ...current,
                    status: "Working",
                    currentTask: savedTask.title,
                    client: savedTask.client,
                    project: savedTask.project,
                    openTasks:
                        Number(current.openTasks || 0) +
                        1,
                    lastActivity:
                        "Task assigned just now",
                };
            });

            closeAssignTaskDrawer();

            alert("Task assigned successfully.");
        } catch (error) {
            console.error(
                "Assign task error:",
                error
            );

            alert(
                error.message ||
                "Unable to assign task."
            );
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
        if (savingEmployee) {
            return;
        }

        setEmployeeFormOpen(false);
        setEditingEmployeeId(null);
        resetEmployeeForm();
    };

    const handleSaveEmployee = async (event) => {
        event.preventDefault();

        const employeeCode = employeeForm.employeeCode
            .trim()
            .toUpperCase();

        const name = employeeForm.name.trim();

        const email = employeeForm.email
            .trim()
            .toLowerCase();

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

        if (
            employeeForm.password &&
            employeeForm.password.length < 6
        ) {
            alert("Password must contain at least 6 characters.");
            return;
        }

        if (
            employeeForm.password !==
            employeeForm.confirmPassword
        ) {
            alert("Passwords do not match.");
            return;
        }

        const duplicateCode =
            employeeList.some((employee) => {
                return (
                    String(employee.id) !==
                    String(editingEmployeeId) &&
                    String(
                        employee.employeeCode || ""
                    )
                        .trim()
                        .toLowerCase() ===
                    employeeCode.toLowerCase()
                );
            });

        if (duplicateCode) {
            alert("This employee code already exists.");
            return;
        }

        const duplicateEmail =
            employeeList.some((employee) => {
                return (
                    String(employee.id) !==
                    String(editingEmployeeId) &&
                    String(employee.email || "")
                        .trim()
                        .toLowerCase() ===
                    email
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
                throw new Error(
                    result.message ||
                    `Unable to ${isEditing ? "update" : "create"
                    } employee.`
                );
            }

            const savedEmployee =
                normalizeEmployeeFromApi(result.data);

            if (isEditing) {
                setEmployeeList((current) =>
                    current.map((employee) =>
                        String(employee.id) ===
                            String(editingEmployeeId)
                            ? savedEmployee
                            : employee
                    )
                );

                setSelectedEmployee((current) =>
                    current &&
                        String(current.id) ===
                        String(editingEmployeeId)
                        ? savedEmployee
                        : current
                );
            } else {
                setEmployeeList((current) => [
                    ...current,
                    savedEmployee,
                ]);
            }

            closeEmployeeDrawer();

            alert(
                isEditing
                    ? "Employee updated successfully."
                    : `Employee created successfully.\n\nLogin email: ${email}\nRole: Employee`
            );
        } catch (error) {
            console.error("Save employee error:", error);

            alert(
                error.message ||
                "Unable to save employee."
            );
        } finally {
            setSavingEmployee(false);
        }
    };
    const loadEmployees = async () => {
        try {
            setEmployeesLoading(true);
            setEmployeesError("");

            const response = await fetch(
                `${API_URL}/api/employee/employees`,
                {
                    headers: {
                        Authorization: `Bearer ${getAuthToken()}`,
                    },
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    "Unable to load employees."
                );
            }

            const normalizedEmployees = Array.isArray(
                result.data
            )
                ? result.data.map(
                    normalizeEmployeeFromApi
                )
                : [];

            setEmployeeList(normalizedEmployees);
        } catch (error) {
            console.error(
                "Load employees error:",
                error
            );

            setEmployeesError(
                error.message ||
                "Unable to load employees."
            );

            setEmployeeList([]);
        } finally {
            setEmployeesLoading(false);
        }
    };
    const normalizeClientFromApi = (
    client = {}
) => ({
    ...client,

    id:
        client._id ||
        client.id ||
        "",

    code:
        client.clientCode ||
        client.code ||
        "",

    companyName:
        client.companyName ||
        client.clientName ||
        client.name ||
        "",

    products:
        Array.isArray(client.products)
            ? client.products
            : [],
});

    const loadClients = async () => {
    try {
        setClientsLoading(true);
        setClientsError("");

        const response = await fetch(
            `${API_URL}/api/admin/clients`,
            {
                method: "GET",

                headers: {
                    Accept:
                        "application/json",

                    Authorization:
                        `Bearer ${getAuthToken()}`,
                },
            }
        );

        const result =
            await response.json();

        console.log(
            "Employee assign task clients response:",
            result
        );

        if (
            !response.ok ||
            !result.success
        ) {
            throw new Error(
                result.message ||
                "Unable to load clients."
            );
        }

        /*
         * Support both possible API response structures:
         *
         * { success: true, data: [...] }
         * { success: true, clients: [...] }
         */
        const rawClients =
            Array.isArray(result.data)
                ? result.data
                : Array.isArray(
                    result.clients
                )
                    ? result.clients
                    : [];

        const normalizedClients =
            rawClients
                .map(
                    normalizeClientFromApi
                )
                .filter(
                    (client) =>
                        client.id &&
                        client.companyName
                )
                .sort((a, b) =>
                    a.companyName.localeCompare(
                        b.companyName
                    )
                );

        console.log(
            "Normalized client list:",
            normalizedClients
        );

        setClientList(
            normalizedClients
        );
    } catch (error) {
        console.error(
            "Load clients error:",
            error
        );

        setClientList([]);

        setClientsError(
            error.message ||
            "Unable to load clients."
        );
    } finally {
        setClientsLoading(false);
    }
};
    const loadProducts = async () => {
        try {
            setProductsLoading(true);
            setProductsError("");

            const response = await fetch(
                `${API_URL}/api/admin/products`,
                {
                    headers: {
                        Accept:
                            "application/json",

                        Authorization:
                            `Bearer ${getAuthToken()}`,
                    },
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
                    "Unable to load products."
                );
            }

            const normalizedProducts =
                Array.isArray(result.data)
                    ? result.data
                        .filter(
                            (product) =>
                                product.status ===
                                "Active"
                        )
                        .map((product) => ({
                            id:
                                product._id ||
                                product.id ||
                                "",

                            productCode:
                                product.productCode ||
                                "",

                            productName:
                                product.productName ||
                                "",
                        }))
                        .filter(
                            (product) =>
                                product.id &&
                                product.productName
                        )
                        .sort((a, b) =>
                            a.productName.localeCompare(
                                b.productName
                            )
                        )
                    : [];

            setProducts(
                normalizedProducts
            );
        } catch (error) {
            console.error(
                "Load products error:",
                error
            );

            setProducts([]);

            setProductsError(
                error.message ||
                "Unable to load products."
            );
        } finally {
            setProductsLoading(false);
        }
    };
    const loadProjects = async () => {
        try {
            setProjectsLoading(true);
            setProjectsError("");

            const response = await fetch(
                `${API_URL}/api/admin/projects`,
                {
                    headers: {
                        Accept:
                            "application/json",

                        Authorization:
                            `Bearer ${getAuthToken()}`,
                    },
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
                    "Unable to load projects."
                );
            }

            const normalizedProjects =
                Array.isArray(result.data)
                    ? result.data
                        .map(
                            normalizeProjectFromApi
                        )
                        .filter(
                            (project) =>
                                project.id &&
                                ![
                                    "Completed",
                                    "Cancelled",
                                ].includes(
                                    project.status
                                )
                        )
                        .sort((a, b) =>
                            a.projectName.localeCompare(
                                b.projectName
                            )
                        )
                    : [];

            setProjects(
                normalizedProjects
            );
        } catch (error) {
            console.error(
                "Load projects error:",
                error
            );

            setProjects([]);

            setProjectsError(
                error.message ||
                "Unable to load projects."
            );
        } finally {
            setProjectsLoading(false);
        }
    };

    const loadTaskSettings = async () => {
        try {
            setTaskSettingsLoading(true);
            setTaskSettingsError("");

            const response = await fetch(
                `${API_URL}/api/settings`,
                {
                    headers: {
                        Accept:
                            "application/json",

                        Authorization:
                            `Bearer ${getAuthToken()}`,
                    },
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
                    "Unable to load task settings."
                );
            }

            const settings =
                result.data || {};

            const priorities =
                Array.isArray(
                    settings.priorities
                )
                    ? settings.priorities
                        .filter(
                            (item) =>
                                item.status ===
                                "Active"
                        )
                        .map((item) => ({
                            id:
                                item._id ||
                                item.id ||
                                item.name,

                            name:
                                String(
                                    item.name ||
                                    ""
                                ).trim(),

                            color:
                                item.color ||
                                "Slate",
                        }))
                        .filter(
                            (item) =>
                                item.name
                        )
                    : [];

            const statuses =
                Array.isArray(
                    settings.taskStatuses
                )
                    ? settings.taskStatuses
                        .filter(
                            (item) =>
                                item.status ===
                                "Active"
                        )
                        .sort(
                            (a, b) =>
                                Number(
                                    a.order || 0
                                ) -
                                Number(
                                    b.order || 0
                                )
                        )
                        .map((item) => ({
                            id:
                                item._id ||
                                item.id ||
                                item.name,

                            name:
                                String(
                                    item.name ||
                                    ""
                                ).trim(),

                            order:
                                Number(
                                    item.order || 0
                                ),

                            isFinal:
                                Boolean(
                                    item.isFinal
                                ),
                        }))
                        .filter(
                            (item) =>
                                item.name
                        )
                    : [];

            setTaskPriorities(
                priorities
            );

            setTaskStatuses(
                statuses
            );

            setTaskForm((current) => ({
                ...current,

                priority:
                    current.priority ||
                    priorities[0]?.name ||
                    "",

                status:
                    current.status ||
                    statuses[0]?.name ||
                    "",
            }));
        } catch (error) {
            console.error(
                "Load task settings error:",
                error
            );

            setTaskPriorities([]);
            setTaskStatuses([]);

            setTaskSettingsError(
                error.message ||
                "Unable to load task settings."
            );
        } finally {
            setTaskSettingsLoading(false);
        }
    };

   useEffect(() => {
    loadEmployees();
    loadTasks();
    loadClients();
    loadProjects();
    loadProducts();
    loadTaskSettings();
}, []);
    const selectedPcActivity = selectedEmployee
        ? pcActivityData[selectedEmployee.id]?.[pcActivityDate] || {
            currentActivity: {
                application: "No active application",
                windowTitle: "PC activity service has not synced yet",
                startedAt: "—",
                runningTime: "—",
                status: "Offline",
                lastSyncAt: "Never",
                deviceName: "Not registered",
            },

            summary: {
                productiveTime: "0h",
                idleTime: "0m",
                breakTime: "0m",
                applicationsUsed: 0,
            },

            applications: [],

            topApplications: [],

            idleSessions: [],
        }
        : null;

    const selectedEmployeeTasks =
        selectedEmployee
            ? assignedTasks.filter(
                (task) =>
                    String(
                        task.assignedEmployeeId
                    ) ===
                    String(
                        selectedEmployee.id
                    )
            )
            : [];
    const updateTaskStatus = async (
        taskId,
        nextStatus
    ) => {
        if (!taskId) {
            alert("Task ID is missing.");
            return;
        }

        try {
            setUpdatingTaskId(taskId);

            const progress =
                nextStatus === "Completed"
                    ? 100
                    : nextStatus === "In Progress"
                        ? 25
                        : undefined;

            const response = await fetch(
                `${API_URL}/api/admin/task/${taskId}/status`,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${getAuthToken()}`,
                    },

                    body: JSON.stringify({
                        status: nextStatus,
                        ...(progress !== undefined
                            ? { progress }
                            : {}),
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    "Unable to update task status."
                );
            }

            const updatedTask =
                normalizeTaskFromApi(result.data);

            setAssignedTasks((current) =>
                current.map((task) =>
                    (task._id || task.id) === taskId
                        ? updatedTask
                        : task
                )
            );

            await loadEmployees();

            setSelectedEmployee((current) => {
                if (
                    !current ||
                    String(current.id) !==
                    String(
                        updatedTask
                            .assignedEmployeeId
                    )
                ) {
                    return current;
                }

                if (
                    nextStatus === "Completed" ||
                    nextStatus === "Closed"
                ) {
                    const nextOpenTasks = Math.max(
                        Number(current.openTasks || 0) -
                        1,
                        0
                    );

                    return {
                        ...current,
                        openTasks: nextOpenTasks,
                        completedToday:
                            Number(
                                current.completedToday || 0
                            ) + 1,
                        status:
                            nextOpenTasks === 0
                                ? "Free"
                                : current.status,
                        currentTask:
                            nextOpenTasks === 0
                                ? "Available for assignment"
                                : current.currentTask,
                        client:
                            nextOpenTasks === 0
                                ? "—"
                                : current.client,
                        project:
                            nextOpenTasks === 0
                                ? "—"
                                : current.project,
                        lastActivity:
                            "Task completed just now",
                    };
                }

                if (
                    nextStatus === "In Progress"
                ) {
                    return {
                        ...current,
                        status: "Working",
                        currentTask:
                            updatedTask.title,
                        client:
                            updatedTask.client,
                        project:
                            updatedTask.project,
                        lastActivity:
                            "Task started just now",
                    };
                }

                return current;
            });
        } catch (error) {
            console.error(
                "Update task status error:",
                error
            );

            alert(
                error.message ||
                "Unable to update task status."
            );
        } finally {
            setUpdatingTaskId(null);
        }
    };

    const selectedTaskClient = clientList.find(
        (client) =>
            String(client.id) === String(taskForm.clientId)
    );
    const selectedTaskProject =
        projects.find(
            (project) =>
                String(project.id) ===
                String(taskForm.projectId)
        );

    const availableProjects =
        projects.filter((project) => {
            if (
                taskForm.clientId &&
                project.clientId &&
                String(project.clientId) !==
                String(taskForm.clientId)
            ) {
                return false;
            }

            if (
                taskForm.productId &&
                project.productId &&
                String(project.productId) !==
                String(taskForm.productId)
            ) {
                return false;
            }

            return true;
        });

    const availableProducts =
        products.filter((product) => {
            if (!selectedTaskClient) {
                return true;
            }

            const clientProducts =
                Array.isArray(
                    selectedTaskClient.products
                )
                    ? selectedTaskClient.products
                    : [];

            if (
                clientProducts.length === 0
            ) {
                return true;
            }

            return clientProducts.some(
                (clientProduct) => {
                    if (
                        typeof clientProduct ===
                        "string"
                    ) {
                        return (
                            clientProduct ===
                            product.productName
                        );
                    }

                    const clientProductId =
                        clientProduct?._id ||
                        clientProduct?.id ||
                        "";

                    const clientProductName =
                        clientProduct
                            ?.productName ||
                        clientProduct?.name ||
                        "";

                    return (
                        String(
                            clientProductId
                        ) ===
                        String(
                            product.id
                        ) ||
                        clientProductName ===
                        product.productName
                    );
                }
            );
        });
    return (
        <div>
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
                        Employee Management
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                        Team
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Monitor employee availability, attendance, workload and
                        daily activity.
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
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
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

                    <p className="mt-4 text-xs text-slate-500">
                        Active company team members
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
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

                    <p className="mt-4 text-xs text-amber-600">
                        Employees handling active work
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
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

                    <p className="mt-4 text-xs text-emerald-600">
                        Available for new assignments
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
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

                    <p className="mt-4 text-xs text-rose-600">
                        Employees unavailable today
                    </p>
                </div>
            </div>
            {teamView === "table" && (
                <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-950">
                                Team Workload
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                                {employeeList.length} employees found
                            </p>
                        </div>

                        <div className="relative w-full lg:w-80">
                            <Search
                                size={17}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="text"
                                placeholder="Search employee, role, task..."
                                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-[1420px] w-full">
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
                                        <td
                                            colSpan="9"
                                            className="px-6 py-16 text-center"
                                        >
                                            <RefreshCw
                                                size={28}
                                                className="mx-auto animate-spin text-violet-600"
                                            />

                                            <p className="mt-3 text-sm font-semibold text-slate-700">
                                                Loading employees...
                                            </p>
                                        </td>
                                    </tr>
                                ) : employeesError ? (
                                    <tr>
                                        <td
                                            colSpan="9"
                                            className="px-6 py-16 text-center"
                                        >
                                            <AlertCircle
                                                size={30}
                                                className="mx-auto text-rose-500"
                                            />

                                            <p className="mt-3 text-sm font-semibold text-rose-700">
                                                {employeesError}
                                            </p>

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
                                                            {employee.employeeCode} ·{" "}
                                                            {employee.role}
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
                                                    {employee.client} ·{" "}
                                                    {employee.project}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4">
                                                {pcActivityData[employee.id]?.[pcActivityDate]?.currentActivity ? (
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="h-2 w-2 rounded-full bg-emerald-500" />

                                                            <p className="max-w-[180px] truncate text-xs font-semibold text-slate-800">
                                                                {
                                                                    pcActivityData[employee.id][pcActivityDate]
                                                                        .currentActivity.application
                                                                }
                                                            </p>
                                                        </div>

                                                        <p className="mt-1 max-w-[180px] truncate text-[10px] text-slate-500">
                                                            {
                                                                pcActivityData[employee.id][pcActivityDate]
                                                                    .currentActivity.windowTitle
                                                            }
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="h-2 w-2 rounded-full bg-slate-300" />

                                                            <p className="text-xs font-semibold text-slate-500">
                                                                Not connected
                                                            </p>
                                                        </div>

                                                        <p className="mt-1 text-[10px] text-slate-400">
                                                            PC service offline
                                                        </p>
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                                    <Clock3
                                                        size={14}
                                                        className="text-slate-400"
                                                    />
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
                                                            <BriefcaseBusiness
                                                                size={14}
                                                            />
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
                                        <td
                                            colSpan="9"
                                            className="px-6 py-16 text-center"
                                        >
                                            <Users
                                                size={30}
                                                className="mx-auto text-slate-300"
                                            />

                                            <p className="mt-3 text-sm font-semibold text-slate-700">
                                                No employees found
                                            </p>

                                            <p className="mt-1 text-xs text-slate-400">
                                                Create your first employee account.
                                            </p>
                                        </td>
                                    </tr>
                                )}

                            </tbody>
                        </table>
                    </div>
                </div>
            )}{teamView === "board" && (
                <div className="mt-6">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-950">
                                Task Assignment Board
                            </h3>

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
                                <RefreshCw
                                    size={18}
                                    className="animate-spin text-violet-600"
                                />

                                <p className="text-xs font-semibold text-slate-600">
                                    Loading tasks...
                                </p>
                            </div>
                        </div>
                    )}

                    {tasksError && !tasksLoading && (
                        <div className="mb-4 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-5 py-4">
                            <div className="flex items-center gap-3">
                                <AlertCircle
                                    size={18}
                                    className="text-rose-600"
                                />

                                <p className="text-xs font-semibold text-rose-700">
                                    {tasksError}
                                </p>
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
                            {
                                id: "Assigned",
                                title: "Assigned",
                                description: "Tasks waiting to start",
                                headerClass: "bg-blue-50 text-blue-700",
                            },
                            {
                                id: "In Progress",
                                title: "In Progress",
                                description: "Tasks currently being worked on",
                                headerClass: "bg-violet-50 text-violet-700",
                            },
                            {
                                id: "Completed",
                                title: "Completed",
                                description: "Finished tasks",
                                headerClass: "bg-emerald-50 text-emerald-700",
                            },
                        ].map((column) => {
                            const columnTasks = assignedTasks.filter(
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
                                                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${column.headerClass}`}
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

                                    <div className="min-h-[420px] space-y-3 p-3">
                                        {columnTasks.length > 0 ? (
                                            columnTasks.map((task) => (
                                                <div
                                                    key={task.id}
                                                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
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
                                                            <span className="text-slate-400">
                                                                Employee
                                                            </span>

                                                            <span className="font-semibold text-slate-700">
                                                                <div className="text-right">
                                                                    <p className="font-semibold text-slate-700">
                                                                        {task.assignedEmployeeName ||
                                                                            "Not assigned"}
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
                                                            <span className="text-slate-400">
                                                                Client
                                                            </span>

                                                            <span className="max-w-[170px] truncate font-semibold text-slate-700">
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
                                                            {task.estimatedTime}
                                                        </span>

                                                        {task.status === "Assigned" && (
                                                            <button
                                                                type="button"
                                                                disabled={updatingTaskId === task.id}
                                                                onClick={() =>
                                                                    updateTaskStatus(task.id, "In Progress")
                                                                }
                                                                className="rounded-lg bg-violet-50 px-3 py-2 text-[10px] font-semibold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                            >
                                                                {updatingTaskId === task.id ? (
                                                                    <RefreshCw
                                                                        size={14}
                                                                        className="animate-spin"
                                                                    />
                                                                ) : (
                                                                    "Start"
                                                                )}
                                                            </button>
                                                        )}

                                                        {task.status === "In Progress" && (
                                                            <button
                                                                type="button"
                                                                disabled={updatingTaskId === task.id}
                                                                onClick={() =>
                                                                    updateTaskStatus(task.id, "Completed")
                                                                }
                                                                className="rounded-lg bg-emerald-50 px-3 py-2 text-[10px] font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                            >
                                                                {updatingTaskId === task.id ? (
                                                                    <RefreshCw
                                                                        size={14}
                                                                        className="animate-spin"
                                                                    />
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
                                                        Tasks will appear here when their
                                                        status changes.
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
            {selectedEmployee && (
                <div className="fixed inset-0 z-[100]">
                    <button
                        type="button"
                        aria-label="Close employee details"
                        onClick={() => setSelectedEmployee(null)}
                        className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]"
                    />

                    <aside className="absolute right-0 top-0 flex h-full w-full max-w-[680px] flex-col bg-white shadow-2xl">
                        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-5">
                            <div className="flex min-w-0 items-center gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
                                    {selectedEmployee.initials}
                                </div>

                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="truncate text-lg font-semibold text-slate-950">
                                            {selectedEmployee.name}
                                        </h2>

                                        <span
                                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${getStatusClasses(
                                                selectedEmployee.status
                                            )}`}
                                        >
                                            {selectedEmployee.status}
                                        </span>
                                    </div>

                                    <p className="mt-1 text-xs text-slate-500">
                                        {selectedEmployee.employeeCode} ·{" "}
                                        {selectedEmployee.role}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedEmployee(null)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                            >
                                ×
                            </button>
                        </div>
                        <div className="shrink-0 border-b border-slate-200 bg-white px-6">
                            <div className="flex gap-6 overflow-x-auto">
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
                                        className={`relative whitespace-nowrap py-4 text-xs font-semibold transition ${employeeTab === tab.id
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

                        <div className="flex-1 overflow-y-auto bg-slate-50/70 p-6">
                            {employeeTab === "overview" && (
                                <>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                Employee Profile
                                            </p>

                                            <div className="mt-4 space-y-4">
                                                <div>
                                                    <p className="text-[10px] text-slate-400">
                                                        Role
                                                    </p>
                                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                                        {selectedEmployee.role}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-[10px] text-slate-400">
                                                        Department
                                                    </p>
                                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                                        {selectedEmployee.department}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-[10px] text-slate-400">
                                                        Employee Code
                                                    </p>
                                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                                        {selectedEmployee.employeeCode}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                Today's Attendance
                                            </p>

                                            <div className="mt-4 grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] text-slate-400">
                                                        Login Time
                                                    </p>
                                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                                        {selectedEmployee.loginTime}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-[10px] text-slate-400">
                                                        Active Time
                                                    </p>
                                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                                        {selectedEmployee.activeTime}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-[10px] text-slate-400">
                                                        Open Tasks
                                                    </p>
                                                    <p className="mt-1 text-sm font-semibold text-violet-700">
                                                        {selectedEmployee.openTasks}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-[10px] text-slate-400">
                                                        Completed Today
                                                    </p>
                                                    <p className="mt-1 text-sm font-semibold text-emerald-700">
                                                        {selectedEmployee.completedToday}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                    Current Work
                                                </p>

                                                <h3 className="mt-2 text-base font-semibold text-slate-950">
                                                    {selectedEmployee.currentTask}
                                                </h3>
                                            </div>

                                            <span className="rounded-full bg-violet-50 px-3 py-1 text-[10px] font-bold text-violet-700">
                                                {selectedEmployee.project}
                                            </span>
                                        </div>

                                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <p className="text-[10px] text-slate-400">
                                                    Client
                                                </p>
                                                <p className="mt-1 text-sm font-semibold text-slate-900">
                                                    {selectedEmployee.client}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[10px] text-slate-400">
                                                    Last Activity
                                                </p>
                                                <p className="mt-1 text-sm font-semibold text-slate-900">
                                                    {selectedEmployee.lastActivity}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                            Today's Activity Timeline
                                        </p>

                                        <div className="mt-5 space-y-5">
                                            <div className="flex gap-3">
                                                <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />

                                                <div>
                                                    <p className="text-xs font-semibold text-slate-900">
                                                        Employee logged in
                                                    </p>
                                                    <p className="mt-1 text-[11px] text-slate-500">
                                                        {selectedEmployee.loginTime}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-violet-500" />

                                                <div>
                                                    <p className="text-xs font-semibold text-slate-900">
                                                        Started current task
                                                    </p>
                                                    <p className="mt-1 text-[11px] text-slate-500">
                                                        {selectedEmployee.currentTask}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />

                                                <div>
                                                    <p className="text-xs font-semibold text-slate-900">
                                                        Last activity recorded
                                                    </p>
                                                    <p className="mt-1 text-[11px] text-slate-500">
                                                        {selectedEmployee.lastActivity}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}{employeeTab === "attendance" && (
                                <div className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                Today's Attendance
                                            </p>

                                            <div className="mt-5 space-y-4">
                                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                                    <div>
                                                        <p className="text-[10px] text-slate-400">
                                                            Login Time
                                                        </p>
                                                        <p className="mt-1 text-sm font-semibold text-slate-900">
                                                            {selectedEmployee.loginTime}
                                                        </p>
                                                    </div>

                                                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                                                        On Time
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                                    <div>
                                                        <p className="text-[10px] text-slate-400">
                                                            Logout Time
                                                        </p>
                                                        <p className="mt-1 text-sm font-semibold text-slate-900">
                                                            {selectedEmployee.status === "Leave"
                                                                ? "—"
                                                                : "Not logged out"}
                                                        </p>
                                                    </div>

                                                    <span className="text-xs text-slate-500">
                                                        Current session
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[10px] text-slate-400">
                                                            Attendance Status
                                                        </p>
                                                        <p className="mt-1 text-sm font-semibold text-slate-900">
                                                            {selectedEmployee.status === "Leave"
                                                                ? "On Leave"
                                                                : "Present"}
                                                        </p>
                                                    </div>

                                                    <span
                                                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${selectedEmployee.status === "Leave"
                                                            ? "bg-rose-50 text-rose-700"
                                                            : "bg-blue-50 text-blue-700"
                                                            }`}
                                                    >
                                                        {selectedEmployee.status === "Leave"
                                                            ? "Leave"
                                                            : "Active"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                Time Summary
                                            </p>

                                            <div className="mt-5 grid grid-cols-2 gap-4">
                                                <div className="rounded-xl bg-slate-50 p-4">
                                                    <p className="text-[10px] text-slate-400">
                                                        Active Time
                                                    </p>
                                                    <p className="mt-2 text-lg font-semibold text-slate-950">
                                                        {selectedEmployee.activeTime}
                                                    </p>
                                                </div>

                                                <div className="rounded-xl bg-slate-50 p-4">
                                                    <p className="text-[10px] text-slate-400">
                                                        Break Time
                                                    </p>
                                                    <p className="mt-2 text-lg font-semibold text-slate-950">
                                                        {selectedEmployee.status === "Leave"
                                                            ? "0m"
                                                            : "35m"}
                                                    </p>
                                                </div>

                                                <div className="rounded-xl bg-slate-50 p-4">
                                                    <p className="text-[10px] text-slate-400">
                                                        Idle Time
                                                    </p>
                                                    <p className="mt-2 text-lg font-semibold text-slate-950">
                                                        {selectedEmployee.status === "Leave"
                                                            ? "0m"
                                                            : "18m"}
                                                    </p>
                                                </div>

                                                <div className="rounded-xl bg-slate-50 p-4">
                                                    <p className="text-[10px] text-slate-400">
                                                        Productive Time
                                                    </p>
                                                    <p className="mt-2 text-lg font-semibold text-emerald-700">
                                                        {selectedEmployee.status === "Leave"
                                                            ? "0h"
                                                            : selectedEmployee.activeTime}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                    Login Sessions
                                                </p>

                                                <h3 className="mt-2 text-sm font-semibold text-slate-950">
                                                    Today's activity sessions
                                                </h3>
                                            </div>

                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-600">
                                                3 sessions
                                            </span>
                                        </div>

                                        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
                                            <table className="w-full">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
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
                                                    <tr className="border-t border-slate-100">
                                                        <td className="px-4 py-3 text-xs font-semibold text-slate-800">
                                                            Morning Work
                                                        </td>

                                                        <td className="px-4 py-3 text-xs text-slate-600">
                                                            {selectedEmployee.loginTime}
                                                        </td>

                                                        <td className="px-4 py-3 text-xs text-slate-600">
                                                            11:15 AM
                                                        </td>

                                                        <td className="px-4 py-3 text-xs text-slate-600">
                                                            2h 13m
                                                        </td>

                                                        <td className="px-4 py-3">
                                                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                                                                Completed
                                                            </span>
                                                        </td>
                                                    </tr>

                                                    <tr className="border-t border-slate-100">
                                                        <td className="px-4 py-3 text-xs font-semibold text-slate-800">
                                                            Post Break
                                                        </td>

                                                        <td className="px-4 py-3 text-xs text-slate-600">
                                                            11:30 AM
                                                        </td>

                                                        <td className="px-4 py-3 text-xs text-slate-600">
                                                            01:45 PM
                                                        </td>

                                                        <td className="px-4 py-3 text-xs text-slate-600">
                                                            2h 15m
                                                        </td>

                                                        <td className="px-4 py-3">
                                                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                                                                Completed
                                                            </span>
                                                        </td>
                                                    </tr>

                                                    <tr className="border-t border-slate-100">
                                                        <td className="px-4 py-3 text-xs font-semibold text-slate-800">
                                                            Current Session
                                                        </td>

                                                        <td className="px-4 py-3 text-xs text-slate-600">
                                                            02:15 PM
                                                        </td>

                                                        <td className="px-4 py-3 text-xs text-slate-600">
                                                            —
                                                        </td>

                                                        <td className="px-4 py-3 text-xs text-slate-600">
                                                            Running
                                                        </td>

                                                        <td className="px-4 py-3">
                                                            <span className="rounded-full bg-violet-50 px-2 py-1 text-[10px] font-bold text-violet-700">
                                                                Active
                                                            </span>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}{employeeTab === "tasks" && (
                                <div className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                Open Tasks
                                            </p>

                                            <p className="mt-3 text-2xl font-semibold text-violet-700">
                                                {selectedEmployee.openTasks}
                                            </p>

                                            <p className="mt-2 text-xs text-slate-500">
                                                Currently assigned
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                Completed Today
                                            </p>

                                            <p className="mt-3 text-2xl font-semibold text-emerald-700">
                                                {selectedEmployee.completedToday}
                                            </p>

                                            <p className="mt-2 text-xs text-slate-500">
                                                Tasks resolved today
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
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

                                            <p className="mt-3 text-xs text-slate-500">
                                                Current availability
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white">
                                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                    Assigned Work
                                                </p>

                                                <h3 className="mt-1 text-sm font-semibold text-slate-950">
                                                    Employee task list
                                                </h3>
                                                <p className="mt-1 text-[10px] text-slate-500">
                                                    {selectedEmployeeTasks.length} newly assigned tasks
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => openAssignTaskDrawer(selectedEmployee)}
                                                className="flex h-9 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white transition hover:bg-violet-700"
                                            >
                                                <BriefcaseBusiness size={15} />
                                                {savingTask ? (
                                                    <>
                                                        <RefreshCw
                                                            size={16}
                                                            className="animate-spin"
                                                        />
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

                                        <div className="overflow-x-auto">
                                            <table className="min-w-[760px] w-full">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
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
                                                        <tr
                                                            key={task.id}
                                                            className="border-t border-slate-100 bg-violet-50/20"
                                                        >
                                                            <td className="px-5 py-4">
                                                                <p className="text-xs font-semibold text-slate-900">
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

                                                                <p className="mt-2 text-[10px] text-slate-500">
                                                                    Due: {task.dueDate}
                                                                </p>
                                                            </td>

                                                            <td className="px-4 py-4">
                                                                <p className="text-xs font-semibold text-slate-800">
                                                                    {task.spentTime}
                                                                </p>

                                                                <p className="mt-1 text-[10px] text-slate-500">
                                                                    of {task.estimatedTime}
                                                                </p>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    {task.status === "Assigned" && (
                                                                        <button
                                                                            type="button"
                                                                            disabled={updatingTaskId === task.id}
                                                                            onClick={() =>
                                                                                updateTaskStatus(task.id, "In Progress")
                                                                            }
                                                                            className="rounded-lg bg-violet-50 px-3 py-2 text-[10px] font-semibold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                                        >
                                                                            {updatingTaskId === task.id ? (
                                                                                <RefreshCw
                                                                                    size={14}
                                                                                    className="animate-spin"
                                                                                />
                                                                            ) : (
                                                                                "Start"
                                                                            )}
                                                                        </button>
                                                                    )}

                                                                    {task.status === "In Progress" && (
                                                                        <button
                                                                            type="button"
                                                                            disabled={updatingTaskId === task.id}
                                                                            onClick={() =>
                                                                                updateTaskStatus(task.id, "Completed")
                                                                            }
                                                                            className="rounded-lg bg-emerald-50 px-3 py-2 text-[10px] font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                                        >
                                                                            {updatingTaskId === task.id ? (
                                                                                <RefreshCw
                                                                                    size={14}
                                                                                    className="animate-spin"
                                                                                />
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
                                                    <tr className="border-t border-slate-100">
                                                        <td className="px-5 py-4">
                                                            <p className="text-xs font-semibold text-slate-900">
                                                                {selectedEmployee.currentTask}
                                                            </p>

                                                            <p className="mt-1 text-[10px] text-slate-500">
                                                                TSK-{selectedEmployee.id}084
                                                            </p>
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <p className="text-xs font-semibold text-slate-800">
                                                                {selectedEmployee.client}
                                                            </p>

                                                            <p className="mt-1 text-[10px] text-slate-500">
                                                                {selectedEmployee.project}
                                                            </p>
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-orange-700">
                                                                High
                                                            </span>
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700">
                                                                In Progress
                                                            </span>
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <p className="text-xs font-semibold text-slate-800">
                                                                1h 45m
                                                            </p>

                                                            <p className="mt-1 text-[10px] text-slate-500">
                                                                of 2h 30m
                                                            </p>
                                                        </td>
                                                    </tr>

                                                    <tr className="border-t border-slate-100">
                                                        <td className="px-5 py-4">
                                                            <p className="text-xs font-semibold text-slate-900">
                                                                Client follow-up and verification
                                                            </p>

                                                            <p className="mt-1 text-[10px] text-slate-500">
                                                                TSK-{selectedEmployee.id}072
                                                            </p>
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <p className="text-xs font-semibold text-slate-800">
                                                                {selectedEmployee.client}
                                                            </p>

                                                            <p className="mt-1 text-[10px] text-slate-500">
                                                                {selectedEmployee.project}
                                                            </p>
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                                                                Medium
                                                            </span>
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                                                                Waiting
                                                            </span>
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <p className="text-xs font-semibold text-slate-800">
                                                                40m
                                                            </p>

                                                            <p className="mt-1 text-[10px] text-slate-500">
                                                                of 1h
                                                            </p>
                                                        </td>
                                                    </tr>

                                                    <tr className="border-t border-slate-100">
                                                        <td className="px-5 py-4">
                                                            <p className="text-xs font-semibold text-slate-900">
                                                                Prepare resolution documentation
                                                            </p>

                                                            <p className="mt-1 text-[10px] text-slate-500">
                                                                TSK-{selectedEmployee.id}065
                                                            </p>
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <p className="text-xs font-semibold text-slate-800">
                                                                Internal Development
                                                            </p>

                                                            <p className="mt-1 text-[10px] text-slate-500">
                                                                Documentation
                                                            </p>
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                                                                Low
                                                            </span>
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                                                                Completed
                                                            </span>
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <p className="text-xs font-semibold text-slate-800">
                                                                55m
                                                            </p>

                                                            <p className="mt-1 text-[10px] text-slate-500">
                                                                completed
                                                            </p>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}{employeeTab === "activity" && (
                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                    Daily Activity
                                                </p>

                                                <h3 className="mt-2 text-sm font-semibold text-slate-950">
                                                    Work timeline for today
                                                </h3>
                                            </div>

                                            <span className="rounded-full bg-violet-50 px-3 py-1 text-[10px] font-bold text-violet-700">
                                                Today
                                            </span>
                                        </div>

                                        <div className="relative mt-6 space-y-6">
                                            <div className="absolute bottom-2 left-[17px] top-2 w-px bg-slate-200" />

                                            <div className="relative flex gap-4">
                                                <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                                    <Clock3 size={16} />
                                                </div>

                                                <div className="flex-1 border-b border-slate-100 pb-5">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <p className="text-xs font-semibold text-slate-900">
                                                                Employee logged in
                                                            </p>

                                                            <p className="mt-1 text-[11px] text-slate-500">
                                                                Work session started successfully.
                                                            </p>
                                                        </div>

                                                        <span className="whitespace-nowrap text-[10px] font-semibold text-slate-400">
                                                            {selectedEmployee.loginTime}
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
                                                            <p className="text-xs font-semibold text-slate-900">
                                                                Task started
                                                            </p>

                                                            <p className="mt-1 text-[11px] text-slate-500">
                                                                {selectedEmployee.currentTask}
                                                            </p>

                                                            <p className="mt-2 text-[10px] font-semibold text-violet-600">
                                                                {selectedEmployee.client} ·{" "}
                                                                {selectedEmployee.project}
                                                            </p>
                                                        </div>

                                                        <span className="whitespace-nowrap text-[10px] font-semibold text-slate-400">
                                                            09:18 AM
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
                                                            <p className="text-xs font-semibold text-slate-900">
                                                                Work progress updated
                                                            </p>

                                                            <p className="mt-1 text-[11px] text-slate-500">
                                                                Task progress updated to 70%.
                                                            </p>
                                                        </div>

                                                        <span className="whitespace-nowrap text-[10px] font-semibold text-slate-400">
                                                            10:42 AM
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
                                                            <p className="text-xs font-semibold text-slate-900">
                                                                Break started
                                                            </p>

                                                            <p className="mt-1 text-[11px] text-slate-500">
                                                                Employee paused work for a scheduled break.
                                                            </p>
                                                        </div>

                                                        <span className="whitespace-nowrap text-[10px] font-semibold text-slate-400">
                                                            11:15 AM
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="relative flex gap-4">
                                                <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                                                    <UserCheck size={16} />
                                                </div>

                                                <div className="flex-1 border-b border-slate-100 pb-5">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <p className="text-xs font-semibold text-slate-900">
                                                                Client follow-up completed
                                                            </p>

                                                            <p className="mt-1 text-[11px] text-slate-500">
                                                                Verification completed with{" "}
                                                                {selectedEmployee.client}.
                                                            </p>
                                                        </div>

                                                        <span className="whitespace-nowrap text-[10px] font-semibold text-slate-400">
                                                            12:30 PM
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="relative flex gap-4">
                                                <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                                                    <Activity size={16} />
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <p className="text-xs font-semibold text-slate-900">
                                                                Last activity recorded
                                                            </p>

                                                            <p className="mt-1 text-[11px] text-slate-500">
                                                                {selectedEmployee.lastActivity}
                                                            </p>
                                                        </div>

                                                        <span className="whitespace-nowrap text-[10px] font-semibold text-slate-400">
                                                            Now
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                Active Time
                                            </p>

                                            <p className="mt-3 text-xl font-semibold text-slate-950">
                                                {selectedEmployee.activeTime}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                Work Updates
                                            </p>

                                            <p className="mt-3 text-xl font-semibold text-violet-700">
                                                6
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                Tasks Completed
                                            </p>

                                            <p className="mt-3 text-xl font-semibold text-emerald-700">
                                                {selectedEmployee.completedToday}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}{employeeTab === "pc-activity" && selectedPcActivity && (
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                Activity Date
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                                Review application usage, idle time and work activity for a
                                                selected date.
                                            </p>
                                        </div>

                                        <input
                                            type="date"
                                            value={pcActivityDate}
                                            onChange={(event) => setPcActivityDate(event.target.value)}
                                            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        />
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                Productive Time
                                            </p>

                                            <p className="mt-3 text-2xl font-semibold text-emerald-700">
                                                {selectedPcActivity.summary.productiveTime}
                                            </p>

                                            <p className="mt-2 text-xs text-slate-500">
                                                Work-related application usage
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                Idle Time
                                            </p>

                                            <p className="mt-3 text-2xl font-semibold text-amber-700">
                                                {selectedPcActivity.summary.idleTime}
                                            </p>

                                            <p className="mt-2 text-xs text-slate-500">
                                                No keyboard or mouse activity
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                Break Time
                                            </p>

                                            <p className="mt-3 text-2xl font-semibold text-blue-700">
                                                {selectedPcActivity.summary.breakTime}
                                            </p>

                                            <p className="mt-2 text-xs text-slate-500">
                                                Recorded employee breaks
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                Applications Used
                                            </p>

                                            <p className="mt-3 text-2xl font-semibold text-violet-700">
                                                {selectedPcActivity.summary.applicationsUsed}
                                            </p>

                                            <p className="mt-2 text-xs text-slate-500">
                                                Applications opened today
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                    Current PC Activity
                                                </p>

                                                <h3 className="mt-2 text-base font-semibold text-slate-950">
                                                    {selectedPcActivity.currentActivity.application}
                                                </h3>

                                                <p className="mt-2 max-w-lg text-xs text-slate-500">
                                                    {selectedPcActivity.currentActivity.windowTitle}
                                                </p>
                                            </div>

                                            <span
                                                className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold ${selectedPcActivity.currentActivity.status === "Live"
                                                    ? "bg-emerald-50 text-emerald-700"
                                                    : "bg-slate-100 text-slate-600"
                                                    }`}
                                            >
                                                {selectedPcActivity.currentActivity.status}
                                            </span>
                                        </div>

                                        <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
                                            <div>
                                                <p className="text-[10px] text-slate-400">
                                                    Activity Started
                                                </p>

                                                <p className="mt-1 text-sm font-semibold text-slate-900">
                                                    {selectedPcActivity.currentActivity.startedAt}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[10px] text-slate-400">
                                                    Running Time
                                                </p>

                                                <p className="mt-1 text-sm font-semibold text-slate-900">
                                                    {selectedPcActivity.currentActivity.runningTime}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[10px] text-slate-400">
                                                    Device Name
                                                </p>

                                                <p className="mt-1 text-sm font-semibold text-slate-900">
                                                    {selectedPcActivity.currentActivity.deviceName}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[10px] text-slate-400">
                                                    Last Service Sync
                                                </p>

                                                <div className="mt-1 flex items-center gap-2">
                                                    <span
                                                        className={`h-2 w-2 rounded-full ${selectedPcActivity.currentActivity.status === "Live"
                                                            ? "bg-emerald-500"
                                                            : "bg-slate-300"
                                                            }`}
                                                    />

                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {selectedPcActivity.currentActivity.lastSyncAt}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white">
                                        <div className="border-b border-slate-200 px-5 py-4">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                Application Timeline
                                            </p>

                                            <h3 className="mt-1 text-sm font-semibold text-slate-950">
                                                Applications and time spent today
                                            </h3>
                                        </div>

                                        {selectedPcActivity.applications.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="min-w-[800px] w-full">
                                                    <thead className="bg-slate-50">
                                                        <tr>
                                                            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
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
                                                            <tr
                                                                key={activity.id}
                                                                className="border-t border-slate-100"
                                                            >
                                                                <td className="px-5 py-4">
                                                                    <p className="text-xs font-semibold text-slate-900">
                                                                        {activity.application}
                                                                    </p>
                                                                </td>

                                                                <td className="px-4 py-4 text-xs text-slate-600">
                                                                    {activity.category}
                                                                </td>

                                                                <td className="px-4 py-4 text-xs text-slate-600">
                                                                    {activity.startedAt}
                                                                </td>

                                                                <td className="px-4 py-4 text-xs text-slate-600">
                                                                    {activity.endedAt}
                                                                </td>

                                                                <td className="px-4 py-4 text-xs font-semibold text-slate-800">
                                                                    {activity.duration}
                                                                </td>

                                                                <td className="px-4 py-4">
                                                                    <span
                                                                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${activity.productivity ===
                                                                            "Productive"
                                                                            ? "bg-emerald-50 text-emerald-700"
                                                                            : activity.productivity ===
                                                                                "Unproductive"
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
                                            <div className="px-5 py-12 text-center">
                                                <p className="text-sm font-semibold text-slate-700">
                                                    No PC activity available
                                                </p>

                                                <p className="mt-2 text-xs text-slate-500">
                                                    The Windows activity service has not synced data for
                                                    this employee.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid gap-4 lg:grid-cols-2">
                                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                Top Applications
                                            </p>

                                            <div className="mt-5 space-y-4">
                                                {selectedPcActivity.topApplications.length > 0 ? (
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
                                                                    style={{
                                                                        width: `${application.percentage}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-xs text-slate-500">
                                                        No application summary available.
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                Idle Sessions
                                            </p>

                                            <div className="mt-5 space-y-3">
                                                {selectedPcActivity.idleSessions.length > 0 ? (
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
                                                    <p className="text-xs text-slate-500">
                                                        No idle sessions recorded.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
                            <button
                                type="button"
                                onClick={() => setSelectedEmployee(null)}
                                className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                            >
                                Close
                            </button>

                            <button
                                type="button"
                                onClick={() => openAssignTaskDrawer(selectedEmployee)}
                                className="h-10 rounded-xl bg-violet-600 px-5 text-xs font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
                            >
                                Assign Task
                            </button>
                        </div>
                    </aside>
                </div>
            )}{employeeFormOpen && (
                <div className="fixed inset-0 z-[110]">
                    <button
                        type="button"
                        aria-label="Close employee form"
                        onClick={closeEmployeeDrawer}
                        className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]"
                    />

                    <aside className="absolute right-0 top-0 flex h-full w-full max-w-[620px] flex-col bg-white shadow-2xl">
                        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-5">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-600">
                                    Employee Management
                                </p>

                                <h2 className="mt-2 text-lg font-semibold text-slate-950">
                                    {editingEmployeeId
                                        ? "Edit Employee"
                                        : "Add Employee"}
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    {editingEmployeeId
                                        ? "Update employee profile, role and login information."
                                        : "Create a new employee profile and login account."}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeEmployeeDrawer}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                            >
                                ×
                            </button>
                        </div>

                        <form
                            onSubmit={handleSaveEmployee}
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <div className="flex-1 overflow-y-auto bg-slate-50/70 p-6">
                                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-600">
                                                Employee Code
                                            </label>

                                            <input
                                                type="text"
                                                name="employeeCode"
                                                value={employeeForm.employeeCode}
                                                onChange={handleEmployeeFormChange}
                                                placeholder="EMP-006"
                                                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-600">
                                                Full Name
                                            </label>

                                            <input
                                                type="text"
                                                name="name"
                                                value={employeeForm.name}
                                                onChange={handleEmployeeFormChange}
                                                placeholder="Enter employee name"
                                                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-600">
                                                Email
                                            </label>

                                            <input
                                                type="email"
                                                name="email"
                                                value={employeeForm.email}
                                                onChange={handleEmployeeFormChange}
                                                placeholder="employee@company.com"
                                                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-600">
                                                Mobile
                                            </label>

                                            <input
                                                type="text"
                                                name="mobile"
                                                value={employeeForm.mobile}
                                                onChange={handleEmployeeFormChange}
                                                placeholder="Enter mobile number"
                                                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-600">
                                                Role
                                            </label>

                                            <input
                                                type="text"
                                                name="role"
                                                value={employeeForm.role}
                                                onChange={handleEmployeeFormChange}
                                                placeholder="ERP Support"
                                                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-600">
                                                Department
                                            </label>

                                            <select
                                                name="department"
                                                value={employeeForm.department}
                                                onChange={handleEmployeeFormChange}
                                                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            >
                                                <option value="Support">Support</option>
                                                <option value="Development">Development</option>
                                                <option value="Operations">Operations</option>
                                                <option value="Management">Management</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-600">
                                                Joining Date
                                            </label>

                                            <input
                                                type="date"
                                                name="joiningDate"
                                                value={employeeForm.joiningDate}
                                                onChange={handleEmployeeFormChange}
                                                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-600">
                                                Initial Status
                                            </label>

                                            <select
                                                name="status"
                                                value={employeeForm.status}
                                                onChange={handleEmployeeFormChange}
                                                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            >
                                                <option value="Free">Free</option>
                                                <option value="Working">Working</option>
                                                <option value="Break">Break</option>
                                                <option value="Leave">Leave</option>
                                                <option value="Offline">Offline</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                {editingEmployeeId
                                                    ? "New Password"
                                                    : "Temporary Password *"}
                                            </label>

                                            <input
                                                type="password"
                                                name="password"
                                                value={employeeForm.password}
                                                onChange={handleEmployeeFormChange}
                                                placeholder={
                                                    editingEmployeeId
                                                        ? "Leave blank to keep current password"
                                                        : "Minimum 6 characters"
                                                }
                                                autoComplete="new-password"
                                                required={!editingEmployeeId}
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                {editingEmployeeId
                                                    ? "Confirm New Password"
                                                    : "Confirm Password *"}
                                            </label>

                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                value={employeeForm.confirmPassword}
                                                onChange={handleEmployeeFormChange}
                                                placeholder="Enter password again"
                                                autoComplete="new-password"
                                                required={!editingEmployeeId}
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
                                <button
                                    type="button"
                                    onClick={closeEmployeeDrawer}
                                    className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingEmployee}
                                    className="flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {savingEmployee ? (
                                        <>
                                            <RefreshCw
                                                size={16}
                                                className="animate-spin"
                                            />

                                            {editingEmployeeId
                                                ? "Updating Employee..."
                                                : "Creating Employee..."}
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus size={16} />

                                            {editingEmployeeId
                                                ? "Update Employee"
                                                : "Create Employee"}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </aside>
                </div>
            )}{assignTaskOpen && taskEmployee && (
                <div className="fixed inset-0 z-[120]">
                    <button
                        type="button"
                        aria-label="Close assign task form"
                        onClick={closeAssignTaskDrawer}
                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
                    />

                    <aside className="absolute right-0 top-0 flex h-full w-full max-w-[640px] flex-col bg-white shadow-2xl">
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

                        <form
                            onSubmit={handleAssignTask}
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
                                                value={taskForm.title}
                                                onChange={handleTaskFormChange}
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
                                                value={taskForm.workType}
                                                onChange={handleTaskFormChange}
                                                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            >
                                                <option value="Client Support">
                                                    Client Support
                                                </option>

                                                <option value="Internal Development">
                                                    Internal Development
                                                </option>

                                                <option value="Documentation">
                                                    Documentation
                                                </option>

                                                <option value="Testing">
                                                    Testing
                                                </option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-600">
                                                Priority
                                            </label>
                                            <select
                                                name="priority"
                                                value={taskForm.priority}
                                                onChange={
                                                    handleTaskFormChange
                                                }
                                                disabled={
                                                    taskSettingsLoading
                                                }
                                                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:opacity-60"
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
                                        <div>
                                            <label className="block text-[10px] font-semibold text-slate-600">
                                                Task For *
                                            </label>

                                            <select
                                                name="taskFor"
                                                value={taskForm.taskFor}
                                                onChange={(event) => {
                                                    const value =
                                                        event.target.value;

                                                    setTaskForm((current) => ({
                                                        ...current,

                                                        taskFor:
                                                            value,

                                                        productId:
                                                            "",

                                                        projectId:
                                                            "",

                                                        projectCode:
                                                            "",

                                                        projectName:
                                                            "",

                                                        generalTaskFor:
                                                            "",
                                                    }));
                                                }}
                                                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            >
                                                <option value="Project">
                                                    Project
                                                </option>

                                                <option value="Product">
                                                    Product
                                                </option>

                                                <option value="General">
                                                    General / Internal
                                                </option>
                                            </select>
                                        </div>

                                        <div>


                                           <div>
    <label className="mb-2 block text-xs font-semibold text-slate-700">
        Client
    </label>

    <select
        name="clientId"
        value={taskForm.clientId}
        disabled={clientsLoading}
        onChange={(event) => {
            const clientId =
                event.target.value;

            const selectedClient =
                clientList.find(
                    (client) =>
                        String(client.id) ===
                        String(clientId)
                );

            setTaskForm((current) => ({
                ...current,

                clientId,

                client:
                    selectedClient
                        ?.companyName ||
                    "Internal Development",

                productId:
                    "",

                projectId:
                    "",

                projectCode:
                    "",

                projectName:
                    "",
            }));
        }}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:opacity-60"
    >
        <option value="">
            {clientsLoading
                ? "Loading clients..."
                : "Internal Development"}
        </option>

        {clientList.map((client) => (
            <option
                key={String(client.id)}
                value={String(client.id)}
            >
                {client.companyName}

                {client.code
                    ? ` (${client.code})`
                    : ""}
            </option>
        ))}
    </select>

    {!clientsLoading &&
        !clientsError &&
        clientList.length === 0 && (
            <p className="mt-1 text-[10px] text-amber-600">
                No clients received from Client Master.
            </p>
        )}

    {clientsError && (
        <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-[10px] text-rose-600">
                {clientsError}
            </p>

            <button
                type="button"
                onClick={loadClients}
                className="text-[10px] font-semibold text-violet-700"
            >
                Retry
            </button>
        </div>
    )}
</div>
                                        </div>


                                        {taskForm.taskFor ===
                                            "Project" && (
                                                <div>
                                                    <label className="block text-[10px] font-semibold text-slate-600">
                                                        Project *
                                                    </label>

                                                    <select
                                                        name="projectId"
                                                        value={taskForm.projectId}
                                                        disabled={projectsLoading}
                                                        onChange={(event) => {
                                                            const projectId =
                                                                event.target.value;

                                                            const selectedProject =
                                                                projects.find(
                                                                    (project) =>
                                                                        String(
                                                                            project.id
                                                                        ) ===
                                                                        String(
                                                                            projectId
                                                                        )
                                                                );

                                                            setTaskForm(
                                                                (current) => ({
                                                                    ...current,

                                                                    projectId:
                                                                        projectId,

                                                                    projectCode:
                                                                        selectedProject
                                                                            ?.projectCode ||
                                                                        "",

                                                                    projectName:
                                                                        selectedProject
                                                                            ?.projectName ||
                                                                        "",

                                                                    clientId:
                                                                        selectedProject
                                                                            ?.clientId ||
                                                                        current.clientId,

                                                                    client:
                                                                        selectedProject
                                                                            ?.clientName ||
                                                                        current.client,

                                                                    productId:
                                                                        selectedProject
                                                                            ?.productId ||
                                                                        current.productId,
                                                                })
                                                            );
                                                        }}
                                                        className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:opacity-60"
                                                    >
                                                        <option value="">
                                                            {projectsLoading
                                                                ? "Loading projects..."
                                                                : "Select project"}
                                                        </option>

                                                        {availableProjects.map(
                                                            (project) => (
                                                                <option
                                                                    key={project.id}
                                                                    value={project.id}
                                                                >
                                                                    {project.projectCode
                                                                        ? `${project.projectCode} - `
                                                                        : ""}
                                                                    {project.projectName}
                                                                </option>
                                                            )
                                                        )}
                                                    </select>
                                                </div>
                                            )}
                                        {taskForm.taskFor ===
                                            "Product" && (
                                                <div>
                                                    <label className="block text-[10px] font-semibold text-slate-600">
                                                        Product *
                                                    </label>

                                                    <select
                                                        name="productId"
                                                        value={taskForm.productId}
                                                        disabled={productsLoading}
                                                        onChange={(event) => {
                                                            setTaskForm(
                                                                (current) => ({
                                                                    ...current,

                                                                    productId:
                                                                        event.target
                                                                            .value,

                                                                    projectId:
                                                                        "",

                                                                    projectCode:
                                                                        "",

                                                                    projectName:
                                                                        "",
                                                                })
                                                            );
                                                        }}
                                                        className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:opacity-60"
                                                    >
                                                        <option value="">
                                                            {productsLoading
                                                                ? "Loading products..."
                                                                : "Select product"}
                                                        </option>

                                                        {availableProducts.map(
                                                            (product) => (
                                                                <option
                                                                    key={product.id}
                                                                    value={product.id}
                                                                >
                                                                    {product.productCode
                                                                        ? `${product.productCode} - `
                                                                        : ""}
                                                                    {product.productName}
                                                                </option>
                                                            )
                                                        )}
                                                    </select>
                                                </div>
                                            )}
                                        {taskForm.taskFor ===
                                            "General" && (
                                                <div>
                                                    <label className="block text-[10px] font-semibold text-slate-600">
                                                        General Task For *
                                                    </label>

                                                    <input
                                                        type="text"
                                                        name="generalTaskFor"
                                                        value={
                                                            taskForm.generalTaskFor
                                                        }
                                                        onChange={
                                                            handleTaskFormChange
                                                        }
                                                        placeholder="Example: Office, Training, Internal meeting"
                                                        className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                    />
                                                </div>
                                            )}

                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-600">
                                                Due Date
                                            </label>

                                            <input
                                                type="date"
                                                name="dueDate"
                                                value={taskForm.dueDate}
                                                onChange={handleTaskFormChange}
                                                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold text-slate-600">
                                                Initial Status *
                                            </label>

                                            <select
                                                name="status"
                                                value={taskForm.status}
                                                onChange={
                                                    handleTaskFormChange
                                                }
                                                disabled={
                                                    taskSettingsLoading
                                                }
                                                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:opacity-60"
                                            >
                                                <option value="">
                                                    Select status
                                                </option>

                                                {taskStatuses.map(
                                                    (status) => (
                                                        <option
                                                            key={status.id}
                                                            value={status.name}
                                                        >
                                                            {status.name}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-600">
                                                Estimated Time
                                            </label>

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
                                            <label className="text-[11px] font-semibold text-slate-600">
                                                Task Description
                                            </label>

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
                                    <p className="text-xs font-semibold text-violet-900">
                                        Employee workload
                                    </p>

                                    <div className="mt-3 grid grid-cols-3 gap-3">
                                        <div>
                                            <p className="text-[10px] text-violet-500">
                                                Open Tasks
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-violet-900">
                                                {taskEmployee.openTasks}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[10px] text-violet-500">
                                                Current Status
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-violet-900">
                                                {taskEmployee.status}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[10px] text-violet-500">
                                                Active Time
                                            </p>

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
                                            <RefreshCw
                                                size={16}
                                                className="animate-spin"
                                            />
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