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
} from "lucide-react";
const API_URL = "http://localhost:5000";



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

export default function Tasks() {

    const [tasks, setTasks] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [clients, setClients] = useState([]);

    const [tasksLoading, setTasksLoading] = useState(true);
    const [tasksError, setTasksError] = useState("");

    const [employeesLoading, setEmployeesLoading] =
        useState(false);

    const [clientsLoading, setClientsLoading] =
        useState(false);

    const [savingTask, setSavingTask] = useState(false);
    const [updatingTaskId, setUpdatingTaskId] =
        useState(null);
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

    const [projects, setProjects] =
        useState([]);
    const [products, setProducts] =
        useState([]);

    const [productsLoading, setProductsLoading] =
        useState(false);

    const [productsError, setProductsError] =
        useState("");

    const [projectsLoading, setProjectsLoading] =
        useState(false);

    const [projectsError, setProjectsError] =
        useState("");

    const [taskPriorities, setTaskPriorities] =
        useState([]);

    const [taskStatuses, setTaskStatuses] =
        useState([]);

    const [taskSettingsLoading, setTaskSettingsLoading] =
        useState(false);

    const [taskSettingsError, setTaskSettingsError] =
        useState("");

    const [createTaskForm, setCreateTaskForm] =
        useState({
            title: "",
            workType:
                "Client Support",

            taskFor:
                "Project",

            generalTaskFor:
                "",

            clientId: "",
            client:
                "Internal Development",

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

    const taskComments = Array.isArray(selectedTask?.comments)
        ? selectedTask.comments
        : [];

    const [commentText, setCommentText] = useState("");
    const [taskFiles, setTaskFiles] = useState([]);

    const [selectedFile, setSelectedFile] = useState(null);
    const taskTimeline = Array.isArray(selectedTask?.timeline)
        ? selectedTask.timeline
        : [];

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
    const [workLogs, setWorkLogs] = useState([]);
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

    const waitingCount = tasks.filter(
        (task) => task.status === "Waiting"
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
            task.projectCode,
            task.projectName,
            task.assignedEmployeeCode,
            task.assignedEmployeeName,
            task.priority,
            task.status,
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

    const matchesEmployee =
        employeeFilter === "All" ||
        String(task.assignedEmployeeId) ===
            String(employeeFilter);

    return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesEmployee
    );
});

    const selectedCreateClient = clients.find(
        (client) =>
            String(client.id) ===
            String(createTaskForm.clientId)
    );

    const selectedCreateClientProducts =
        selectedCreateClient
            ? selectedCreateClient.products
                .map((product) => {
                    if (typeof product === "string") {
                        return {
                            id: "",
                            productName: product,
                        };
                    }

                    return {
                        id: product._id || product.id || "",
                        productName:
                            product.productName ||
                            product.name ||
                            "",
                    };
                })
                .filter(
                    (product) => product.productName
                )
            : [];

    const getAuthToken = () => {
        return (
            localStorage.getItem("client-connect-token") ||
            sessionStorage.getItem("client-connect-token") ||
            ""
        );
    };

    const selectedEditClient = clients.find(
        (client) =>
            String(client.id) ===
            String(editTaskForm.clientId)
    );

    const selectedEditClientProducts =
        selectedEditClient
            ? selectedEditClient.products
                .map((product) => {
                    if (typeof product === "string") {
                        return {
                            id: "",
                            productName: product,
                        };
                    }

                    return {
                        id:
                            product._id ||
                            product.id ||
                            "",

                        productName:
                            product.productName ||
                            product.name ||
                            "",
                    };
                })
                .filter(
                    (product) =>
                        product.productName
                )
            : [];

    const formatMinutes = (minutes) => {
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

    const estimatedTimeToMinutes = (value) => {
        const text = String(value || "")
            .trim()
            .toLowerCase();

        if (!text) {
            return 0;
        }

        const hourMatch = text.match(
            /(\d+(?:\.\d+)?)\s*h/
        );

        const minuteMatch = text.match(
            /(\d+)\s*m/
        );

        let totalMinutes = 0;

        if (hourMatch) {
            totalMinutes += Math.round(
                Number(hourMatch[1]) * 60
            );
        }

        if (minuteMatch) {
            totalMinutes += Number(minuteMatch[1]);
        }

        if (!hourMatch && !minuteMatch) {
            const numericValue = Number(text);

            if (Number.isFinite(numericValue)) {
                totalMinutes = Math.round(
                    numericValue * 60
                );
            }
        }

        return Math.max(totalMinutes, 0);
    };

    const formatDateForDisplay = (dateValue) => {
        if (!dateValue) {
            return "—";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatDateForInput = (dateValue) => {
        if (!dateValue) {
            return "";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toISOString().slice(0, 10);
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

    const normalizeTaskFromApi = (task) => {
        const assignedEmployeeName =
            task.assignedEmployeeName || "";

        return {
            ...task,

            id: task._id || task.id,

            taskNo:
                task.taskCode ||
                task.taskNo ||
                "",

            clientId: task.clientId
                ? String(task.clientId)
                : "",
            productId: task.productId
                ? String(task.productId)
                : "",

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
                "",

            project:
                task.projectName ||
                task.project ||
                "",

          assignedEmployeeId:
    task.assignedEmployeeId?._id ||
    task.assignedEmployeeId
        ? String(
            task.assignedEmployeeId?._id ||
            task.assignedEmployeeId
        )
        : "",

assignedEmployeeCode:
    task.assignedEmployeeCode || "",

assignedEmployeeName:
    task.assignedEmployeeName ||
    "Not assigned",



            initials: String(
    assignedEmployeeName ||
    ""
)
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((word) =>
                    word.charAt(0).toUpperCase()
                )
                .join(""),

            priority:
                task.priority || "Medium",

            status:
                task.status || "Assigned",

            dueDate:
                formatDateForDisplay(task.dueDate),

            dueDateValue:
                formatDateForInput(task.dueDate),

            estimatedTime:
                formatMinutes(task.estimatedMinutes),

            spentTime:
                formatMinutes(task.spentMinutes),

            estimatedMinutes:
                Number(task.estimatedMinutes || 0),

            spentMinutes:
                Number(task.spentMinutes || 0),

            progress:
                Number(task.progress || 0),

            description:
                task.description || "",

            comments:
                Array.isArray(task.comments)
                    ? task.comments
                    : [],

            timeline:
                Array.isArray(task.timeline)
                    ? task.timeline
                    : [],

            attachments:
                Array.isArray(task.attachments)
                    ? task.attachments
                    : [],
        };
    };

    const normalizeEmployeeFromApi = (employee) => ({
        ...employee,

        id: employee._id || employee.id,

        name: employee.name || "",

        initials:
            employee.initials ||
            String(employee.name || "")
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((word) =>
                    word.charAt(0).toUpperCase()
                )
                .join(""),

        isActive:
            employee.isActive !== false,
    });

    const normalizeClientFromApi = (client) => ({
        ...client,

        id: client._id || client.id,

        code:
            client.clientCode ||
            client.code ||
            "",

        companyName:
            client.companyName || "",

        products:
            Array.isArray(client.products)
                ? client.products
                : [],
    });

    const loadTasks = async () => {
        try {
            setTasksLoading(true);
            setTasksError("");

            const response = await fetch(
                `${API_URL}/api/admin/tasks`,
                {
                    headers: {
                        Accept: "application/json",
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

            setTasks(normalizedTasks);

            setSelectedTask((current) => {
                if (!current) {
                    return null;
                }

                return (
                    normalizedTasks.find(
                        (task) =>
                            String(task.id) ===
                            String(current.id)
                    ) || null
                );
            });
        } catch (error) {
            console.error(
                "Load tasks error:",
                error
            );

            setTasksError(
                error.message ||
                "Unable to load tasks."
            );

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

            const response = await fetch(
                `${API_URL}/api/admin/task/${taskId}`,
                {
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${getAuthToken()}`,
                    },
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Unable to load task details."
                );
            }

            const freshTask = normalizeTaskFromApi(result.data);

            setSelectedTask(freshTask);
            setTaskDetailsTab("overview");

            setTasks((current) =>
                current.map((item) =>
                    String(item.id) === String(taskId)
                        ? freshTask
                        : item
                )
            );
        } catch (error) {
            console.error("Load task details error:", error);

            alert(
                error.message || "Unable to load task details."
            );
        } finally {
            setUpdatingTaskId(null);
        }
    };

    const loadEmployees = async () => {
        try {
            setEmployeesLoading(true);

            const response = await fetch(
                `${API_URL}/api/employee/employees`,
                {
                    headers: {
                        Accept: "application/json",
                        Authorization:
                            `Bearer ${getAuthToken()}`,
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

            const normalizedEmployees =
                Array.isArray(result.data)
                    ? result.data
                        .map(
                            normalizeEmployeeFromApi
                        )
                        .filter(
                            (employee) =>
                                employee.id &&
                                employee.isActive
                        )
                    : [];

            setEmployees(normalizedEmployees);
        } catch (error) {
            console.error(
                "Load employees error:",
                error
            );

            setEmployees([]);
        } finally {
            setEmployeesLoading(false);
        }
    };

    const loadClients = async () => {
        try {
            setClientsLoading(true);

            const response = await fetch(
                `${API_URL}/api/admin/clients`,
                {
                    headers: {
                        Accept: "application/json",
                        Authorization:
                            `Bearer ${getAuthToken()}`,
                    },
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    "Unable to load clients."
                );
            }

            const normalizedClients =
                Array.isArray(result.data)
                    ? result.data
                        .map(normalizeClientFromApi)
                        .filter(
                            (client) =>
                                client.id &&
                                client.companyName
                        )
                    : [];

            setClients(normalizedClients);
        } catch (error) {
            console.error(
                "Load clients error:",
                error
            );

            setClients([]);
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

                            responseHours:
                                Number(
                                    item.responseHours ||
                                    0
                                ),
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

                            color:
                                item.color ||
                                "Slate",

                            order:
                                Number(
                                    item.order ||
                                    0
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

            setCreateTaskForm(
                (current) => ({
                    ...current,

                    priority:
                        current.priority ||
                        priorities[0]
                            ?.name ||
                        "",

                    status:
                        current.status ||
                        statuses[0]
                            ?.name ||
                        "",
                })
            );
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
        loadTasks();
        loadEmployees();
        loadClients();
        loadProjects();
        loadProducts();
        loadTaskSettings();
    }, []);

    useEffect(() => {
        if (!taskMenu.task) {
            return undefined;
        }

        const handleOutsideClick = () => {
            closeTaskActionMenu();
        };

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                closeTaskActionMenu();
            }
        };

        const handleViewportChange = () => {
            closeTaskActionMenu();
        };

        document.addEventListener(
            "mousedown",
            handleOutsideClick
        );

        document.addEventListener(
            "keydown",
            handleEscape
        );

        window.addEventListener(
            "resize",
            handleViewportChange
        );

        window.addEventListener(
            "scroll",
            handleViewportChange,
            true
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );

            document.removeEventListener(
                "keydown",
                handleEscape
            );

            window.removeEventListener(
                "resize",
                handleViewportChange
            );

            window.removeEventListener(
                "scroll",
                handleViewportChange,
                true
            );
        };
    }, [taskMenu.task]);

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
           employee:
    selectedTask.assignedEmployeeName ||
    "Not assigned",
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

            const response = await fetch(
                `${API_URL}/api/admin/task/${taskId}/comment`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${getAuthToken()}`,
                    },

                    body: JSON.stringify({
                        message,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Unable to add comment."
                );
            }

            const updatedTask = normalizeTaskFromApi(result.data);

            setSelectedTask(updatedTask);

            setTasks((current) =>
                current.map((task) =>
                    String(task.id) === String(taskId)
                        ? updatedTask
                        : task
                )
            );

            setCommentText("");
        } catch (error) {
            console.error("Add comment error:", error);

            alert(
                error.message || "Unable to add comment."
            );
        } finally {
            setSavingTask(false);
        }
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

        setSelectedFile(null);

        const input = document.getElementById("task-file-input");

        if (input) {
            input.value = "";
        }
    };

    const openEditTaskDrawer = () => {
        setCreateTaskOpen(false);

        if (!selectedTask) {
            return;
        }

        const employeeId =
            selectedTask.assignedEmployeeId
                ? String(
                    selectedTask.assignedEmployeeId
                )
                : "";

        const clientId =
            selectedTask.clientId
                ? String(
                    selectedTask.clientId
                )
                : "";

        const productId =
            selectedTask.productId
                ? String(
                    selectedTask.productId
                )
                : "";

        const projectId =
            selectedTask.projectId
                ? String(
                    selectedTask.projectId
                )
                : "";

        setEditTaskForm({
            title:
                selectedTask.title || "",

            workType:
                selectedTask.workType ||
                "Client Support",

            clientId,

            client:
                selectedTask.client ||
                "Internal Development",

            productId,

            projectId,

            projectCode:
                selectedTask.projectCode ||
                "",

            projectName:
                selectedTask.projectName ||
                selectedTask.project ||
                "",

            assignedEmployeeId:
                employeeId,

    

assignedEmployeeCode:
    selectedTask.assignedEmployeeCode ||
    "",

assignedEmployeeName:
    selectedTask.assignedEmployeeName ||
    "",

            priority:
                selectedTask.priority ||
                taskPriorities[0]?.name ||
                "",

            status:
                selectedTask.status ||
                taskStatuses[0]?.name ||
                "",

            dueDate:
                selectedTask.dueDateValue ||
                "",

            estimatedTime:
                selectedTask.estimatedTime ||
                "",

            spentTime:
                selectedTask.spentTime ||
                "0m",

            progress:
                Number(
                    selectedTask.progress ||
                    0
                ),

            description:
                selectedTask.description ||
                "",
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
    const handleUpdateTask = async (event) => {
        event.preventDefault();

        if (!selectedTask) {
            return;
        }

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
            alert(
                "Please select a project."
            );
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

        const estimatedMinutes =
            estimatedTimeToMinutes(editTaskForm.estimatedTime);

        if (estimatedMinutes <= 0) {
            alert(
                "Enter estimated time like 2h, 1h 30m or 0.5."
            );
            return;
        }

        try {
            setSavingTask(true);

            /*
             * First update normal task information.
             * Do not send status here.
             */
            const updateResponse = await fetch(
                `${API_URL}/api/admin/task/${taskId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${getAuthToken()}`,
                    },

                    body: JSON.stringify({
                        title,

                        description:
                            editTaskForm.description.trim(),

                        workType:
                            editTaskForm.workType,

                        clientId:
                            editTaskForm.clientId || null,

                        clientName:
                            editTaskForm.client ||
                            "Internal Development",

                        productId:
                            editTaskForm.productId || null,

                        projectId:
                            editTaskForm.projectId,

                        assignedEmployeeId:
                            editTaskForm.assignedEmployeeId,

                        priority:
                            editTaskForm.priority,

                        dueDate:
                            editTaskForm.dueDate,

                        estimatedMinutes,
                    }),
                }
            );

            const updateResult =
                await updateResponse.json();

            if (
                !updateResponse.ok ||
                !updateResult.success
            ) {
                throw new Error(
                    updateResult.message ||
                    "Unable to update task."
                );
            }

            let finalTask =
                normalizeTaskFromApi(updateResult.data);

            /*
             * Use dedicated status API when status changed.
             */
            if (
                editTaskForm.status !==
                selectedTask.status
            ) {


                const selectedStatusSetting =
                    taskStatuses.find(
                        (statusItem) =>
                            statusItem.name ===
                            editTaskForm.status
                    );

                const nextProgress =
                    selectedStatusSetting?.isFinal
                        ? 100
                        : Number(
                            editTaskForm.progress ||
                            finalTask.progress ||
                            0
                        );

                const statusResponse = await fetch(
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
                            status:
                                editTaskForm.status,

                            progress:
                                nextProgress,
                        }),
                    }
                );

                const statusResult =
                    await statusResponse.json();

                if (
                    !statusResponse.ok ||
                    !statusResult.success
                ) {
                    throw new Error(
                        statusResult.message ||
                        "Task details were updated, but status could not be changed."
                    );
                }

                finalTask =
                    normalizeTaskFromApi(
                        statusResult.data
                    );
            }

            setTasks((current) =>
                current.map((task) =>
                    String(task.id) === String(taskId)
                        ? finalTask
                        : task
                )
            );

            setSelectedTask(finalTask);
            setEditTaskOpen(false);

            await loadEmployees();

            alert("Task updated successfully.");
        } catch (error) {
            console.error(
                "Update task error:",
                error
            );

            alert(
                error.message ||
                "Unable to update task."
            );
        } finally {
            setSavingTask(false);
        }
    };
    const handleCreateTaskChange = (event) => {
        const { name, value } = event.target;

        setCreateTaskForm((current) => ({
            ...current,
            [name]: value,
        }));
    };
    const resetCreateTaskForm =
        () => {
            setCreateTaskForm({
                title: "",
                workType:
                    "Client Support",

                clientId: "",
                client:
                    "Internal Development",

                productId: "",

                projectId: "",
                projectCode: "",
                projectName: "",

                assignedEmployeeId: "",
             
assignedEmployeeCode: "",
assignedEmployeeName: "",
                priority:
                    taskPriorities[0]
                        ?.name ||
                    "",

                status:
                    taskStatuses[0]
                        ?.name ||
                    "",

                dueDate: "",
                estimatedTime: "",
                description: "",
                taskFor: "Project",
                generalTaskFor: "",
            });
        };

    const closeCreateTaskDrawer = () => {
        if (savingTask) {
            return;
        }

        setCreateTaskOpen(false);
        setEditTaskOpen(false);
        resetCreateTaskForm();
    };

    const handleCreateTask = async (event) => {
        event.preventDefault();

        const title = createTaskForm.title.trim();
        if (
            createTaskForm.taskFor ===
            "Project" &&
            !createTaskForm.projectId
        ) {
            alert(
                "Please select a project."
            );
            return;
        }
        if (
    createTaskForm.taskFor ===
        "General" &&
    !createTaskForm.generalTaskFor.trim()
) {
    alert(
        "Please enter who or what this general task is for."
    );
    return;
}

        if (
            createTaskForm.taskFor ===
            "Product" &&
            !createTaskForm.productId
        ) {
            alert(
                "Please select a product."
            );
            return;
        }
        if (!createTaskForm.priority) {
            alert(
                "Please select a priority."
            );
            return;
        }

        if (!createTaskForm.status) {
            alert(
                "Please select a task status."
            );
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

        const estimatedMinutes =
            estimatedTimeToMinutes(
                createTaskForm.estimatedTime
            );

        if (estimatedMinutes <= 0) {
            alert(
                "Enter estimated time like 2h, 1h 30m or 0.5."
            );
            return;
        }

        const selectedEmployee = employees.find(
            (employee) =>
                String(employee.id) ===
                String(
                    createTaskForm.assignedEmployeeId
                )
        );

        if (!selectedEmployee) {
            alert(
                "Selected employee was not found. Please select again."
            );
            return;
        }

        if (
            selectedEmployee.status === "Leave" ||
            selectedEmployee.status === "Inactive"
        ) {
            alert(
                `${selectedEmployee.name} is currently ${selectedEmployee.status}.`
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
                            createTaskForm.description.trim(),

                        workType:
                            createTaskForm.workType,

                        taskFor:
                            createTaskForm.taskFor,
                            generalTaskFor:
    createTaskForm
        .generalTaskFor
        .trim(),

                        clientId:
                            createTaskForm.clientId ||
                            null,

                        clientName:
                            createTaskForm.client ||
                            "Internal Development",

                        productId:
                            createTaskForm.productId ||
                            null,

                        projectId:
                            createTaskForm.projectId ||
                            null,

                        assignedEmployeeId:
                            createTaskForm
                                .assignedEmployeeId,

                        priority:
                            createTaskForm.priority,

                        status:
                            createTaskForm.status,

                        dueDate:
                            createTaskForm.dueDate,

                        estimatedMinutes,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    "Unable to create task."
                );
            }

            const savedTask =
                normalizeTaskFromApi(result.data);

            setTasks((current) => [
                savedTask,
                ...current,
            ]);

            setEditTaskOpen(false);
            setCreateTaskOpen(false);

            setSelectedTask(savedTask);
            setTaskDetailsTab("overview");

            resetCreateTaskForm();

            alert("Task created successfully.");

            // Refresh employee workload values.
            await loadEmployees();
        } catch (error) {
            console.error(
                "Create task error:",
                error
            );

            alert(
                error.message ||
                "Unable to create task."
            );
        } finally {
            setSavingTask(false);
        }
    };

    const updateTaskStatus = async (
        taskId,
        nextStatus
    ) => {
        if (!taskId) {
            alert("Task ID is missing.");
            return;
        }

        const selectedStatusSetting =
            taskStatuses.find(
                (item) =>
                    item.name === nextStatus
            );

        const nextProgress =
            selectedStatusSetting?.isFinal
                ? 100
                : Number(
                    selectedTask?.progress || 0
                );

        try {
            setUpdatingTaskId(taskId);

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
                        progress: nextProgress,
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

            setTasks((current) =>
                current.map((task) =>
                    String(task.id) ===
                        String(taskId)
                        ? updatedTask
                        : task
                )
            );

            setSelectedTask((current) =>
                current &&
                    String(current.id) ===
                    String(taskId)
                    ? updatedTask
                    : current
            );

            await loadEmployees();
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
    const handleDeleteTask = async (task) => {
        const taskId = task._id || task.id;

        if (!taskId) {
            alert("Task ID is missing.");
            return;
        }

        const confirmed = window.confirm(
            `Delete task "${task.title}" ?`
        );

        if (!confirmed) return;

        try {
            setDeletingTaskId(taskId);

            const response = await fetch(
                `${API_URL}/api/admin/task/${taskId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${getAuthToken()}`,
                    },
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    "Unable to delete task."
                );
            }

            setTasks((current) =>
                current.filter(
                    (t) =>
                        String(t.id) !==
                        String(taskId)
                )
            );

            if (
                selectedTask &&
                String(selectedTask.id) ===
                String(taskId)
            ) {
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

        setTaskChecklists((current) => [
            ...current,
            newItem,
        ]);

        setChecklistText("");


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

    const openTaskActionMenu = (event, task) => {
        event.stopPropagation();

        const buttonRect =
            event.currentTarget.getBoundingClientRect();

        const menuWidth = 176;
        const menuHeight = 145;
        const viewportPadding = 12;

        let left = buttonRect.right - menuWidth;
        let top = buttonRect.bottom + 6;

        if (left < viewportPadding) {
            left = viewportPadding;
        }

        if (left + menuWidth > window.innerWidth - viewportPadding) {
            left =
                window.innerWidth -
                menuWidth -
                viewportPadding;
        }

        /*
         * If insufficient space below the button,
         * open the menu above it.
         */
        if (
            top + menuHeight >
            window.innerHeight - viewportPadding
        ) {
            top =
                buttonRect.top -
                menuHeight -
                6;
        }

        setTaskMenu((current) => {
            if (
                current.task &&
                String(current.task.id) ===
                String(task.id)
            ) {
                return {
                    task: null,
                    top: 0,
                    left: 0,
                };
            }

            return {
                task,
                top,
                left,
            };
        });
    };

    const closeTaskActionMenu = () => {
        setTaskMenu({
            task: null,
            top: 0,
            left: 0,
        });
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
                    onClick={() => {
                        setSelectedTask(null);
                        setEditTaskOpen(false);
                        setCreateTaskOpen(false);

                        resetCreateTaskForm();

                        setTimeout(() => {
                            setCreateTaskOpen(true);
                        }, 0);
                    }}
                    className="flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
                >
                    <Plus size={17} />
                    Create Task
                </button>
            </div>

            {/* TASK LOADING STATE */}
            {tasksLoading && (
                <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4">
                    <RefreshCw
                        size={19}
                        className="animate-spin text-violet-600"
                    />

                    <p className="text-sm font-semibold text-slate-600">
                        Loading tasks from MongoDB...
                    </p>
                </div>
            )}

            {/* TASK ERROR STATE */}
            {tasksError && !tasksLoading && (
                <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle
                            size={20}
                            className="text-rose-600"
                        />

                        <p className="text-sm font-semibold text-rose-700">
                            {tasksError}
                        </p>
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

            {/* KPI CARDS START HERE */}


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
                                Waiting
                            </p>

                            <p className="mt-2 text-2xl font-semibold text-slate-950">
                                {waitingCount}
                            </p>
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                            <AlertCircle size={19} />
                        </div>
                    </div>

                    <p className="mt-4 text-xs text-rose-600">
                        Waiting for client or dependency
                    </p>
                </div>
            </div>

            <div
                className="relative mt-6 rounded-2xl border border-slate-200 bg-white"
                style={{ overflow: "visible" }}
            >
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
                                        <option value="All">
                                            All
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
                                    <label className="mb-2 block text-[11px] font-semibold text-slate-600">
                                        Priority
                                    </label>

                                    <select
                                        name="priority"
                                        value={
                                            createTaskForm.priority
                                        }
                                        onChange={
                                            handleCreateTaskChange
                                        }
                                        disabled={
                                            taskSettingsLoading
                                        }
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
                                    <label className="mb-2 block text-[11px] font-semibold text-slate-600">
                                        Employee
                                    </label>

                             <select
    value={employeeFilter}
    onChange={(event) =>
        setEmployeeFilter(event.target.value)
    }
    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs"
>
    <option value="All">
        All Employees
    </option>

    {employees.map((employee) => (
        <option
            key={String(employee.id)}
            value={String(employee.id)}
        >
            {employee.name}
            {employee.employeeCode
                ? ` (${employee.employeeCode})`
                : ""}
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
                    <div
                        className="relative overflow-x-auto"
                        style={{ overflowY: "visible" }}
                    >
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
                                        onClick={() => openTaskDetails(task)}
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
                                                    disabled={updatingTaskId === task.id}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        openTaskDetails(task);
                                                    }}
                                                    className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                                                >
                                                    {updatingTaskId === task.id ? (
                                                        <RefreshCw
                                                            size={14}
                                                            className="animate-spin"
                                                        />
                                                    ) : (
                                                        <BriefcaseBusiness size={14} />
                                                    )}

                                                    Open
                                                </button>


                                                <button
                                                    type="button"
                                                    aria-label="Open task actions"
                                                    onClick={(event) =>
                                                        openTaskActionMenu(event, task)
                                                    }
                                                    className={`flex h-9 w-9 items-center justify-center rounded-lg border text-slate-500 transition ${taskMenu.task &&
                                                        String(taskMenu.task.id) ===
                                                        String(task.id)
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
                                                               {task.assignedEmployeeName || "Not assigned"}
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
                                                                className={`rounded-xl px-3 py-2 ${task.status === "Completed"
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
                                                           {selectedTask.assignedEmployeeName || "Not assigned"}
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

                                            <div className="space-y-3">
                                                {taskComments.length > 0 ? (
                                                    taskComments.map((comment) => (
                                                        <div
                                                            key={comment._id || comment.id}
                                                            className="rounded-xl border border-slate-200 bg-white p-4"
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-[10px] font-semibold text-white">
                                                                    {String(
                                                                        comment.authorName || "Admin"
                                                                    )
                                                                        .split(" ")
                                                                        .filter(Boolean)
                                                                        .slice(0, 2)
                                                                        .map((word) =>
                                                                            word.charAt(0).toUpperCase()
                                                                        )
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
                                                                            ? new Date(
                                                                                comment.createdAt
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
                                                                            : "—"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
                                                        <p className="text-sm font-semibold text-slate-700">
                                                            No comments yet
                                                        </p>

                                                        <p className="mt-2 text-xs text-slate-500">
                                                            Add the first comment for this task.
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
                                            {taskTimeline.length > 0 ? (
                                                <div className="relative space-y-6">
                                                    <div className="absolute bottom-3 left-[17px] top-3 w-px bg-slate-200" />

                                                    {[...taskTimeline]
                                                        .reverse()
                                                        .map((event) => {
                                                            const eventId =
                                                                event._id ||
                                                                event.id ||
                                                                `${event.action}-${event.createdAt}`;

                                                            const eventType = String(
                                                                event.action || "Activity"
                                                            ).toLowerCase();

                                                            return (
                                                                <div
                                                                    key={eventId}
                                                                    className="relative flex gap-4"
                                                                >
                                                                    <div
                                                                        className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold ${eventType.includes("created")
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
                                                                        {String(
                                                                            event.action || "AC"
                                                                        )
                                                                            .slice(0, 2)
                                                                            .toUpperCase()}
                                                                    </div>

                                                                    <div className="min-w-0 flex-1 border-b border-slate-100 pb-5">
                                                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                                            <div>
                                                                                <p className="text-xs font-semibold text-slate-900">
                                                                                    {event.action ||
                                                                                        "Task activity"}
                                                                                </p>

                                                                                <p className="mt-2 text-xs leading-5 text-slate-600">
                                                                                    {event.description ||
                                                                                        "Task information was updated."}
                                                                                </p>

                                                                                <p className="mt-2 text-[10px] font-semibold text-violet-600">
                                                                                    {event.performedByName ||
                                                                                        "System"}
                                                                                </p>
                                                                            </div>

                                                                            <span className="shrink-0 text-[10px] text-slate-400">
                                                                                {event.createdAt
                                                                                    ? new Date(
                                                                                        event.createdAt
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

                                                    <option value="Development">
                                                        Development
                                                    </option>

                                                    <option value="Testing">
                                                        Testing
                                                    </option>

                                                    <option value="Installation">
                                                        Installation
                                                    </option>

                                                    <option value="Training">
                                                        Training
                                                    </option>

                                                    <option value="Documentation">
                                                        Documentation
                                                    </option>

                                                    <option value="Internal Work">
                                                        Internal Work
                                                    </option>

                                                    <option value="Follow-up">
                                                        Follow-up
                                                    </option>

                                                    <option value="Other">
                                                        Other
                                                    </option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-[11px] font-semibold text-slate-600">
                                                    Project
                                                </label>

                                                <div>
                                                    <label className="text-[11px] font-semibold text-slate-600">
                                                        Project / Product
                                                    </label>

                                                    {editTaskForm.clientId ? (
                                                        <select
                                                            value={editTaskForm.project}
                                                            onChange={(event) => {
                                                                const project = event.target.value;

                                                                const selectedProduct =
                                                                    selectedEditClientProducts.find(
                                                                        (product) =>
                                                                            product.productName === project
                                                                    );

                                                                setEditTaskForm((current) => ({
                                                                    ...current,
                                                                    project,
                                                                    productId: selectedProduct?.id
                                                                        ? String(selectedProduct.id)
                                                                        : "",
                                                                }));
                                                            }}
                                                            className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                        >
                                                            <option value="">
                                                                Select assigned product
                                                            </option>

                                                            {selectedEditClientProducts.map(
                                                                (product) => (
                                                                    <option
                                                                        key={
                                                                            product.id ||
                                                                            product.productName
                                                                        }
                                                                        value={product.productName}
                                                                    >
                                                                        {product.productName}
                                                                    </option>
                                                                )
                                                            )}
                                                        </select>
                                                    ) : (
                                                        <select
                                                            name="project"
                                                            value={editTaskForm.project}
                                                            onChange={handleEditTaskChange}
                                                            className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                        >
                                                            <option value="">
                                                                Select project
                                                            </option>

                                                            <option value="Internal Development">
                                                                Internal Development
                                                            </option>

                                                            <option value="NexERP">
                                                                NexERP
                                                            </option>

                                                            <option value="BillFlow">
                                                                BillFlow
                                                            </option>

                                                            <option value="StockPro">
                                                                StockPro
                                                            </option>

                                                            <option value="RetailPOS">
                                                                RetailPOS
                                                            </option>

                                                            <option value="Documentation">
                                                                Documentation
                                                            </option>

                                                            <option value="Testing">
                                                                Testing
                                                            </option>
                                                        </select>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="sm:col-span-2">
                                                <label className="text-[11px] font-semibold text-slate-600">
                                                    Client
                                                </label>

                                                <select
                                                    value={editTaskForm.clientId}
                                                    disabled={clientsLoading}
                                                    onChange={(event) => {
                                                        const clientId = event.target.value;

                                                        const selectedClient = clients.find(
                                                            (client) =>
                                                                String(client.id) ===
                                                                String(clientId)
                                                        );

                                                        setEditTaskForm((current) => ({
                                                            ...current,

                                                            clientId,

                                                            client: selectedClient
                                                                ? selectedClient.companyName
                                                                : "Internal Development",

                                                            productId: "",

                                                            project: clientId
                                                                ? ""
                                                                : "Internal Development",
                                                        }));
                                                    }}
                                                    className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:opacity-60"
                                                >
                                                    <option value="">
                                                        Internal Development
                                                    </option>

                                                    {clients.map((client) => (
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
                                            </div>

                                          <div>
    <label className="mb-2 block text-xs font-semibold text-slate-700">
        Assigned To
        <span className="ml-1 text-rose-500">
            *
        </span>
    </label>

    <select
        name="assignedEmployeeId"
        value={
            createTaskForm.assignedEmployeeId
        }
        disabled={employeesLoading}
        required
        onChange={(event) => {
            const employeeId =
                event.target.value;

            const selectedEmployee =
                employees.find(
                    (employee) =>
                        String(employee.id) ===
                        String(employeeId)
                );

            setCreateTaskForm(
                (current) => ({
                    ...current,

                    assignedEmployeeId:
                        employeeId,

                    assignedEmployeeCode:
                        selectedEmployee
                            ?.employeeCode ||
                        "",

                    assignedEmployeeName:
                        selectedEmployee
                            ?.name ||
                        "",
                })
            );
        }}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-100"
    >
        <option value="">
            {employeesLoading
                ? "Loading employees..."
                : "Select employee"}
        </option>

        {employees.map((employee) => (
            <option
                key={String(employee.id)}
                value={String(employee.id)}
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
                                                        updateTaskStatus(selectedTask.id, "Waiting")
                                                    }
                                                    className="h-10 rounded-xl border border-rose-200 bg-rose-50 px-4 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                                                >
                                                    Mark Waiting
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

                                        {selectedTask.status === "Waiting" && (
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
                                            onClick={closeEditTaskDrawer}
                                            className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                                        >
                                            Close
                                        </button>

                                        <button
                                            type="submit"
                                            disabled={savingTask}
                                            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {savingTask ? (
                                                <>
                                                    <RefreshCw
                                                        size={15}
                                                        className="animate-spin"
                                                    />
                                                    Updating...
                                                </>
                                            ) : (
                                                "Update Task"
                                            )}
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

                                                    <option value="Development">
                                                        Development
                                                    </option>

                                                    <option value="Testing">
                                                        Testing
                                                    </option>

                                                    <option value="Installation">
                                                        Installation
                                                    </option>

                                                    <option value="Training">
                                                        Training
                                                    </option>

                                                    <option value="Documentation">
                                                        Documentation
                                                    </option>

                                                    <option value="Internal Work">
                                                        Internal Work
                                                    </option>

                                                    <option value="Follow-up">
                                                        Follow-up
                                                    </option>

                                                    <option value="Other">
                                                        Other
                                                    </option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-semibold text-slate-600">
                                                    Priority
                                                </label>

                                                <select
                                                    value={priorityFilter}
                                                    onChange={(event) =>
                                                        setPriorityFilter(
                                                            event.target.value
                                                        )
                                                    }
                                                    disabled={
                                                        taskSettingsLoading
                                                    }
                                                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none"
                                                >
                                                    <option value="All">
                                                        All
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
                                                <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                    Client
                                                </label>

                                                <select
                                                    value={editTaskForm.clientId}
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

                                                        setEditTaskForm((current) => ({
                                                            ...current,

                                                            clientId,

                                                            client: selectedClient
                                                                ? selectedClient.companyName
                                                                : "Internal Development",

                                                            productId: "",
                                                            project: clientId
                                                                ? ""
                                                                : "Internal Development",
                                                        }));
                                                    }}
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                                                >
                                                    <option value="">
                                                        Internal Development
                                                    </option>

                                                    {clients.map((client) => (
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
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-xs font-medium text-slate-700">
                                                    Task For *
                                                </label>

                                                <select
                                                    name="taskFor"
                                                    value={
                                                        createTaskForm.taskFor
                                                    }
                                                    onChange={(event) => {
                                                        const nextTaskFor =
                                                            event.target.value;

                                                        setCreateTaskForm(
                                                            (current) => ({
                                                                ...current,

                                                                taskFor:
                                                                    nextTaskFor,

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
                                                            })
                                                        );
                                                    }}
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
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
                                            {createTaskForm.taskFor ===
                                                "Project" && (
                                                    <div>
                                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                            Project
                                                            <span className="ml-1 text-rose-500">
                                                                *
                                                            </span>
                                                        </label>

                                                        <select
                                                            name="projectId"
                                                            value={
                                                                createTaskForm.projectId
                                                            }
                                                            disabled={
                                                                projectsLoading
                                                            }
                                                            onChange={(event) => {
                                                                const selectedProject =
                                                                    projects.find(
                                                                        (project) =>
                                                                            String(
                                                                                project.id
                                                                            ) ===
                                                                            String(
                                                                                event.target.value
                                                                            )
                                                                    );

                                                                setCreateTaskForm(
                                                                    (current) => ({
                                                                        ...current,

                                                                        projectId:
                                                                            selectedProject
                                                                                ?.id ||
                                                                            "",

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
                                                                            "",

                                                                        client:
                                                                            selectedProject
                                                                                ?.clientName ||
                                                                            "Internal Development",

                                                                        productId:
                                                                            selectedProject
                                                                                ?.productId ||
                                                                            "",

                                                                        priority:
                                                                            selectedProject
                                                                                ?.priority ||
                                                                            current.priority,
                                                                    })
                                                                );
                                                            }}
                                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-100"
                                                        >
                                                            <option value="">
                                                                {projectsLoading
                                                                    ? "Loading projects..."
                                                                    : "Select project"}
                                                            </option>

                                                            {projects.map(
                                                                (project) => (
                                                                    <option
                                                                        key={project.id}
                                                                        value={project.id}
                                                                    >
                                                                        {project.projectCode}
                                                                        {" - "}
                                                                        {project.projectName}
                                                                    </option>
                                                                )
                                                            )}
                                                        </select>

                                                        {projectsError && (
                                                            <p className="mt-1 text-[11px] text-rose-600">
                                                                {projectsError}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                                {createTaskForm.taskFor ===
    "Product" && (
        <div>
            <label className="mb-2 block text-xs font-semibold text-slate-700">
                Product
                <span className="ml-1 text-rose-500">
                    *
                </span>
            </label>

            <select
                name="productId"
                value={
                    createTaskForm.productId
                }
                disabled={
                    productsLoading
                }
                onChange={(event) => {
                    const productId =
                        event.target.value;

                    setCreateTaskForm(
                        (current) => ({
                            ...current,

                            productId,

                            projectId:
                                "",

                            projectCode:
                                "",

                            projectName:
                                "",
                        })
                    );
                }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-100"
            >
                <option value="">
                    {productsLoading
                        ? "Loading products..."
                        : "Select product"}
                </option>

                {products.map(
                    (product) => (
                        <option
                            key={product.id}
                            value={product.id}
                        >
                            {product.productCode}
                            {" - "}
                            {product.productName}
                        </option>
                    )
                )}
            </select>

            {productsError && (
                <p className="mt-1 text-[11px] text-rose-600">
                    {productsError}
                </p>
            )}
        </div>
    )}
    {createTaskForm.taskFor ===
    "General" && (
        <div>
            <label className="mb-2 block text-xs font-semibold text-slate-700">
                Task For / Department
                <span className="ml-1 text-rose-500">
                    *
                </span>
            </label>

            <input
                type="text"
                name="generalTaskFor"
                value={
                    createTaskForm.generalTaskFor
                }
                onChange={
                    handleCreateTaskChange
                }
                placeholder="Example: Office, Accounts, Marketing, HR"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            />
        </div>
    )}

                                            <select
    name="assignedEmployeeId"
    value={createTaskForm.assignedEmployeeId}
    disabled={employeesLoading}
    required
    onChange={(event) => {
        const employeeId =
            event.target.value;

        const selectedEmployee =
            employees.find(
                (employee) =>
                    String(employee.id) ===
                    String(employeeId)
            );

        setCreateTaskForm((current) => ({
            ...current,

            assignedEmployeeId:
                employeeId,

            assignedEmployeeCode:
                selectedEmployee?.employeeCode ||
                "",

            assignedEmployeeName:
                selectedEmployee?.name ||
                "",
        }));
    }}
    className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:opacity-60"
>
    <option value="">
        {employeesLoading
            ? "Loading employees..."
            : "Select employee"}
    </option>

    {employees.map((employee) => (
        <option
            key={String(employee.id)}
            value={String(employee.id)}
            disabled={
                employee.status === "Leave" ||
                employee.status === "Inactive"
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
                                                    <option value="All">
                                                        All
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
                                    {createTaskForm.assignedEmployeeName ||
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
                                        disabled={savingTask}
                                        className="flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
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
                                            "Create Task"
                                        )}
                                    </button>
                                </div>
                            </form>
                        </aside>
                    </div>
                )}
            </div>
            {taskMenu.task &&
                createPortal(
                    <>
                        <button
                            type="button"
                            aria-label="Close task actions"
                            onClick={closeTaskActionMenu}
                            className="fixed inset-0 z-[9998] cursor-default bg-transparent"
                        />

                        <div
                            onMouseDown={(event) =>
                                event.stopPropagation()
                            }
                            className="fixed z-[9999] w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-2xl"
                            style={{
                                top: `${taskMenu.top}px`,
                                left: `${taskMenu.left}px`,
                            }}
                        >
                            <button
                                type="button"
                                onClick={async () => {
                                    const selectedMenuTask =
                                        taskMenu.task;

                                    closeTaskActionMenu();

                                    await openTaskDetails(
                                        selectedMenuTask
                                    );
                                }}
                                className="flex w-full items-center px-4 py-2.5 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Open Task
                            </button>

                            <button
                                type="button"
                                onClick={async () => {
                                    const selectedMenuTask =
                                        taskMenu.task;

                                    closeTaskActionMenu();

                                    await openTaskDetails(
                                        selectedMenuTask
                                    );

                                    /*
                                     * Open edit directly using the clicked
                                     * task, avoiding stale selectedTask state.
                                     */
                                    const employeeId =
                                        selectedMenuTask
                                            .assignedEmployeeId
                                            ? String(
                                                selectedMenuTask
                                                    .assignedEmployeeId
                                            )
                                            : "";

                                    const clientId =
                                        selectedMenuTask.clientId
                                            ? String(
                                                selectedMenuTask.clientId
                                            )
                                            : "";

                                    const productId =
                                        selectedMenuTask.productId
                                            ? String(
                                                selectedMenuTask.productId
                                            )
                                            : "";

                                    setEditTaskForm({
                                        title:
                                            selectedMenuTask.title ||
                                            "",

                                        workType:
                                            selectedMenuTask.workType ||
                                            "Client Support",

                                        clientId,

                                        client:
                                            selectedMenuTask.client ||
                                            "Internal Development",

                                        productId,

                                        project:
                                            selectedMenuTask.project ||
                                            "Internal Development",

                                        assignedEmployeeId:
                                            employeeId,

      

assignedEmployeeCode:
    selectedMenuTask.assignedEmployeeCode ||
    "",

assignedEmployeeName:
    selectedMenuTask.assignedEmployeeName ||
    "",
                                        priority:
                                            selectedMenuTask.priority ||
                                            "Medium",

                                        status:
                                            selectedMenuTask.status ||
                                            "Assigned",

                                        dueDate:
                                            selectedMenuTask
                                                .dueDateValue ||
                                            "",

                                        estimatedTime:
                                            selectedMenuTask
                                                .estimatedTime ||
                                            "",

                                        spentTime:
                                            selectedMenuTask.spentTime ||
                                            "0m",

                                        progress: Number(
                                            selectedMenuTask.progress ||
                                            0
                                        ),

                                        description:
                                            selectedMenuTask
                                                .description || "",
                                    });

                                    setSelectedTask(
                                        selectedMenuTask
                                    );

                                    setEditTaskOpen(true);
                                }}
                                className="flex w-full items-center px-4 py-2.5 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Edit Task
                            </button>

                            <div className="my-1 border-t border-slate-100" />

                            <button
                                type="button"
                                disabled={
                                    deletingTaskId ===
                                    taskMenu.task.id
                                }
                                onClick={async () => {
                                    const selectedMenuTask =
                                        taskMenu.task;

                                    closeTaskActionMenu();

                                    await handleDeleteTask(
                                        selectedMenuTask
                                    );
                                }}
                                className="flex w-full items-center px-4 py-2.5 text-left text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                            >
                                {deletingTaskId ===
                                    taskMenu.task.id
                                    ? "Deleting..."
                                    : "Delete Task"}
                            </button>
                        </div>
                    </>,
                    document.body
                )}
        </div>
    );
}