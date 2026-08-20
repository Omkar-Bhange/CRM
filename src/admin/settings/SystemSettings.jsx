import { useEffect, useMemo, useState } from "react";
import {
    BellRing,
    BriefcaseBusiness,
    Building2,
    Check,
    ChevronRight,
    Clock3,
    Flag,
    FolderKanban,
    GripVertical,
    KeyRound,
    Loader2,
    Mail,
    Pencil,
    Plus,
    Save,
    Settings2,
    ShieldCheck,
    Smartphone,
    Trash2,
    UserCog,
    Users,
    X,
} from "lucide-react";
import API_URL from "../../config/api";

const getAuthToken = () => {
    return (
        localStorage.getItem(
            "client-connect-token"
        ) ||
        sessionStorage.getItem(
            "client-connect-token"
        ) ||
        ""
    );
};

const SETTINGS_API_URL =
    `${API_URL}/api/settings`;

const getSettingsHeaders = (
    includeContentType = false
) => {
    const token = getAuthToken();

    const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
    };

    if (includeContentType) {
        headers["Content-Type"] =
            "application/json";
    }

    return headers;
};

const parseApiResponse = async (
    response,
    fallbackMessage
) => {
    let result = null;

    try {
        result =
            await response.json();
    } catch {
        result = null;
    }

    if (
        !response.ok ||
        !result?.success
    ) {
        throw new Error(
            result?.message ||
            fallbackMessage
        );
    }

    return result;
};



const defaultSettings = {
    company: {
        companyName: "Total Solution",
        workspaceName: "Client Connect",
        ownerName: "Mangesh Kondhare",
        email: "admin@totalsolution.in",
        mobile: "",
        gstNo: "",
        address: "",
        city: "Pune",
        state: "Maharashtra",
        country: "India",
        financialYearStart: "04",
        dateFormat: "DD/MM/YYYY",
        timezone: "Asia/Kolkata",
    },


    roles: [
        {
            id: 1,
            name: "Owner / Administrator",
            description: "Full access to every module and company setting.",
            users: 1,
            permissions: [
                "Clients",
                "AMC & Billing",
                "Tickets",
                "Team",
                "Tasks",
                "Attendance",
                "Settings",
            ],
            status: "Active",
        },
        {
            id: 2,
            name: "Support Manager",
            description: "Manage tickets, tasks, clients and support employees.",
            users: 1,
            permissions: ["Clients", "Tickets", "Team", "Tasks", "Attendance"],
            status: "Active",
        },
        {
            id: 3,
            name: "Employee",
            description: "Access assigned tasks, attendance and personal leaves.",
            users: 4,
            permissions: ["My Tasks", "My Attendance", "My Leaves"],
            status: "Active",
        },
    ],

    taskStatuses: [
        {
            id: 1,
            name: "Assigned",
            description: "Task is assigned but work has not started.",
            color: "Slate",
            order: 1,
            isFinal: false,
            status: "Active",
        },
        {
            id: 2,
            name: "In Progress",
            description: "Employee is currently working on the task.",
            color: "Violet",
            order: 2,
            isFinal: false,
            status: "Active",
        },
        {
            id: 3,
            name: "Testing",
            description: "Task is waiting for testing or verification.",
            color: "Blue",
            order: 3,
            isFinal: false,
            status: "Active",
        },
        {
            id: 4,
            name: "Blocked",
            description: "Task cannot continue because of a dependency.",
            color: "Rose",
            order: 4,
            isFinal: false,
            status: "Active",
        },
        {
            id: 5,
            name: "Completed",
            description: "Task has been successfully completed.",
            color: "Emerald",
            order: 5,
            isFinal: true,
            status: "Active",
        },
    ],

    priorities: [
        {
            id: 1,
            name: "Low",
            responseHours: 24,
            color: "Slate",
            status: "Active",
        },
        {
            id: 2,
            name: "Medium",
            responseHours: 8,
            color: "Amber",
            status: "Active",
        },
        {
            id: 3,
            name: "High",
            responseHours: 4,
            color: "Orange",
            status: "Active",
        },
        {
            id: 4,
            name: "Critical",
            responseHours: 1,
            color: "Rose",
            status: "Active",
        },
    ],

    workingHours: {
        officeStartTime: "09:00",
        officeEndTime: "18:00",
        lateAfterMinutes: 10,
        fullDayHours: 8,
        halfDayHours: 4,
        defaultBreakMinutes: 45,
        weeklyOff: ["Sunday"],
        autoMarkAbsent: true,
        absentMarkTime: "11:00",
        allowManualCorrection: true,
    },

    leaveTypes: [
        {
            id: 1,
            name: "Casual Leave",
            code: "CL",
            yearlyLimit: 12,
            paid: true,
            carryForward: false,
            requiresDocument: false,
            status: "Active",
        },
        {
            id: 2,
            name: "Sick Leave",
            code: "SL",
            yearlyLimit: 8,
            paid: true,
            carryForward: false,
            requiresDocument: true,
            status: "Active",
        },
        {
            id: 3,
            name: "Earned Leave",
            code: "EL",
            yearlyLimit: 15,
            paid: true,
            carryForward: true,
            requiresDocument: false,
            status: "Active",
        },
        {
            id: 4,
            name: "Unpaid Leave",
            code: "LWP",
            yearlyLimit: 0,
            paid: false,
            carryForward: false,
            requiresDocument: false,
            status: "Active",
        },
    ],

    notifications: {
        newTicket: {
            inApp: true,
            email: true,
            mobile: false,
        },
        taskAssigned: {
            inApp: true,
            email: true,
            mobile: true,
        },
        taskOverdue: {
            inApp: true,
            email: true,
            mobile: true,
        },
        leaveRequest: {
            inApp: true,
            email: true,
            mobile: false,
        },
        amcDue: {
            inApp: true,
            email: true,
            mobile: false,
        },
        employeeLate: {
            inApp: true,
            email: false,
            mobile: false,
        },
        amcReminderDays: 30,
        taskDueReminderHours: 4,
        dailySummaryEnabled: true,
        dailySummaryTime: "18:30",
    },
};

const navigationItems = [
    {
        id: "company",
        label: "Company",
        description: "Workspace and business details",
        icon: Building2,
    },
    {
        id: "products",
        label: "Products",
        description: "Software products sold and supported",
        icon: BriefcaseBusiness,
    },
    {
        id: "projects",
        label: "Projects",
        description: "Development and implementation work",
        icon: FolderKanban,
    },
    {
        id: "roles",
        label: "Roles & Permissions",
        description: "User access and authorization",
        icon: ShieldCheck,
    },
    {
        id: "taskStatuses",
        label: "Task Statuses",
        description: "Configure task workflow",
        icon: Settings2,
    },
    {
        id: "priorities",
        label: "Priorities",
        description: "Priority and response times",
        icon: Flag,
    },
    {
        id: "workingHours",
        label: "Working Hours",
        description: "Attendance and office timing",
        icon: Clock3,
    },
    {
        id: "leaveTypes",
        label: "Leave Types",
        description: "Leave policies and limits",
        icon: UserCog,
    },
    {
        id: "notifications",
        label: "Notifications",
        description: "Alerts and reminder rules",
        icon: BellRing,
    },
];

const emptyProduct = {
    id: null,
    productCode: "",
    productName: "",
    category: "Software",
    description: "",
    currentVersion: "v1.0.0",
    platform: "Web",
    releaseDate: "",
    status: "Active",
};
const emptyProject = {
    id: null,

    projectCode: "",
    projectName: "",

    projectType:
        "Internal Development",

    productId: "",
    productCode: "",
    productName: "",

    clientId: "",
    clientCode: "",
    clientName: "",

    description: "",

    startDate: "",
    dueDate: "",

    priority: "Medium",
    status: "Planned",

    progress: 0,
};

const emptyRole = {
    id: null,
    name: "",
    description: "",
    users: 0,
    permissions: [],
    status: "Active",
};

const emptyStatus = {
    id: null,
    name: "",
    description: "",
    color: "Slate",
    order: 1,
    isFinal: false,
    status: "Active",
};

const emptyPriority = {
    id: null,
    name: "",
    responseHours: 8,
    color: "Slate",
    status: "Active",
};

const emptyLeaveType = {
    id: null,
    name: "",
    code: "",
    yearlyLimit: 0,
    paid: true,
    carryForward: false,
    requiresDocument: false,
    status: "Active",
};

const permissionOptions = [
    "Overview",
    "Clients",
    "AMC & Billing",
    "Tickets",
    "Team",
    "Tasks",
    "Attendance",
    "Settings",
    "My Tasks",
    "My Attendance",
    "My Leaves",
];

function cloneDefaultSettings() {
    return JSON.parse(JSON.stringify(defaultSettings));
}

function readStoredSettings() {
    try {
        const storedValue =
            localStorage.getItem(
                SETTINGS_STORAGE_KEY
            );

        if (!storedValue) {
            return cloneDefaultSettings();
        }

        const parsedValue =
            JSON.parse(
                storedValue
            );

        return {
            ...cloneDefaultSettings(),
            ...parsedValue,
            company: {
                ...defaultSettings.company,
                ...(parsedValue.company ||
                    {}),
            },
            workingHours: {
                ...defaultSettings.workingHours,
                ...(parsedValue.workingHours ||
                    {}),
            },
            notifications: {
                ...defaultSettings.notifications,
                ...(parsedValue.notifications ||
                    {}),
            },
        };
    } catch (error) {
        console.error(
            "Unable to read settings:",
            error
        );

        return cloneDefaultSettings();
    }
}

function normalizeSettingRecord(
    record
) {
    return {
        ...record,

        id:
            record?.id ||
            record?._id ||
            "",
    };
}

function normalizeSettingsFromApi(
    apiSettings
) {
    const source =
        apiSettings || {};

    return {
        ...cloneDefaultSettings(),

        ...source,

        company: {
            ...defaultSettings.company,
            ...(source.company || {}),
        },

        roles:
            Array.isArray(
                source.roles
            )
                ? source.roles.map(
                    normalizeSettingRecord
                )
                : [],

        taskStatuses:
            Array.isArray(
                source.taskStatuses
            )
                ? source.taskStatuses
                    .map(
                        normalizeSettingRecord
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
                : [],

        priorities:
            Array.isArray(
                source.priorities
            )
                ? source.priorities.map(
                    normalizeSettingRecord
                )
                : [],

        workingHours: {
            ...defaultSettings.workingHours,
            ...(source.workingHours ||
                {}),
        },

        leaveTypes:
            Array.isArray(
                source.leaveTypes
            )
                ? source.leaveTypes.map(
                    normalizeSettingRecord
                )
                : [],

        notifications: {
            ...defaultSettings.notifications,
            ...(source.notifications ||
                {}),

            newTicket: {
                ...defaultSettings
                    .notifications
                    .newTicket,

                ...(source.notifications
                    ?.newTicket || {}),
            },

            taskAssigned: {
                ...defaultSettings
                    .notifications
                    .taskAssigned,

                ...(source.notifications
                    ?.taskAssigned || {}),
            },

            taskOverdue: {
                ...defaultSettings
                    .notifications
                    .taskOverdue,

                ...(source.notifications
                    ?.taskOverdue || {}),
            },

            leaveRequest: {
                ...defaultSettings
                    .notifications
                    .leaveRequest,

                ...(source.notifications
                    ?.leaveRequest || {}),
            },

            amcDue: {
                ...defaultSettings
                    .notifications
                    .amcDue,

                ...(source.notifications
                    ?.amcDue || {}),
            },

            employeeLate: {
                ...defaultSettings
                    .notifications
                    .employeeLate,

                ...(source.notifications
                    ?.employeeLate || {}),
            },
        },
    };
}

function getColorClasses(color) {
    const colors = {
        Slate: "bg-slate-100 text-slate-700 ring-slate-500/10",
        Violet: "bg-violet-50 text-violet-700 ring-violet-600/10",
        Blue: "bg-blue-50 text-blue-700 ring-blue-600/10",
        Emerald: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
        Amber: "bg-amber-50 text-amber-700 ring-amber-600/10",
        Orange: "bg-orange-50 text-orange-700 ring-orange-600/10",
        Rose: "bg-rose-50 text-rose-700 ring-rose-600/10",
    };

    return colors[color] || colors.Slate;
}

function StatusBadge({ status }) {
    const styles = {
        Active:
            "bg-emerald-50 text-emerald-700 ring-emerald-600/10",

        Inactive:
            "bg-slate-100 text-slate-600 ring-slate-500/10",

        Deprecated:
            "bg-rose-50 text-rose-700 ring-rose-600/10",

        Planned:
            "bg-blue-50 text-blue-700 ring-blue-600/10",

        "On Hold":
            "bg-amber-50 text-amber-700 ring-amber-600/10",

        Completed:
            "bg-emerald-50 text-emerald-700 ring-emerald-600/10",

        Cancelled:
            "bg-rose-50 text-rose-700 ring-rose-600/10",
    };

    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${styles[status] ||
                styles.Inactive
                }`}
        >
            {status || "Inactive"}
        </span>
    );
}

function Toggle({ enabled, onChange, disabled = false }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(!enabled)}
            className={`relative h-6 w-11 rounded-full transition ${enabled ? "bg-violet-600" : "bg-slate-200"
                } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        >
            <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${enabled ? "left-6" : "left-1"
                    }`}
            />
        </button>
    );
}

function FieldLabel({ children, required = false }) {
    return (
        <label className="mb-2 block text-xs font-semibold text-slate-700">
            {children}
            {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
    );
}

function SettingsDrawer({
    title,
    description,
    children,
    onClose,
    onSubmit,
    submitLabel = "Save",
    submitting = false,
}) {
    return (
        <>
            <button
                type="button"
                aria-label="Close drawer"
                onClick={onClose}
                className="enterprise-backdrop fixed inset-0 z-[80] bg-slate-950/40 backdrop-blur-[2px]"
            />

            <aside className="enterprise-drawer fixed inset-y-0 right-0 z-[90] flex w-full max-w-[580px] flex-col bg-white shadow-[-24px_0_70px_rgba(15,23,42,0.22)]">
                <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-600">
                            System Settings
                        </p>

                        <h2 className="mt-2 text-xl font-semibold text-slate-950">
                            {title}
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            {description}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                    >
                        <X size={17} />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
                    <div className="flex-1 space-y-5 overflow-y-auto p-6">
                        {children}
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? (
                                <Loader2
                                    size={15}
                                    className="animate-spin"
                                />
                            ) : (
                                <Save size={15} />
                            )}

                            {submitting
                                ? "Saving..."
                                : submitLabel}
                        </button>
                    </div>
                </form>
            </aside>
        </>
    );
}

export default function SystemSettings() {
    const [activeSection, setActiveSection] = useState("company");
    const [settings, setSettings] =
        useState(cloneDefaultSettings);
    const [recordSaving, setRecordSaving] =
        useState(false);

    const [settingsLoading, setSettingsLoading] =
        useState(true);

    const [settingsSaving, setSettingsSaving] =
        useState(false);

    const [settingsError, setSettingsError] =
        useState("");

    const [savedMessage, setSavedMessage] =
        useState("");
    const [drawerType, setDrawerType] =
        useState("");

    const [products, setProducts] =
        useState([]);

    const [productsLoading, setProductsLoading] =
        useState(false);

    const [productsError, setProductsError] =
        useState("");

    const [productSaving, setProductSaving] =
        useState(false);

    const [productFormError, setProductFormError] =
        useState("");

    const [productForm, setProductForm] =
        useState(emptyProduct);
    const [projects, setProjects] =
        useState([]);

    const [projectsLoading, setProjectsLoading] =
        useState(false);

    const [projectsError, setProjectsError] =
        useState("");

    const [projectSaving, setProjectSaving] =
        useState(false);

    const [projectFormError, setProjectFormError] =
        useState("");

    const [projectForm, setProjectForm] =
        useState(emptyProject);

    const [clients, setClients] =
        useState([]);

    const [clientsLoading, setClientsLoading] =
        useState(false);
    const [roleForm, setRoleForm] = useState(emptyRole);
    const [statusForm, setStatusForm] = useState(emptyStatus);
    const [priorityForm, setPriorityForm] = useState(emptyPriority);
    const [leaveTypeForm, setLeaveTypeForm] = useState(emptyLeaveType);
    const normalizeProductFromApi = (
        product
    ) => ({
        id:
            product.id ||
            product._id ||
            "",

        productCode:
            product.productCode ||
            "",

        productName:
            product.productName ||
            "",

        category:
            product.category ||
            "Software",

        description:
            product.description ||
            "",

        currentVersion:
            product.currentVersion ||
            "v1.0.0",

        platform:
            product.platform ||
            "Web",

        releaseDate:
            product.releaseDate
                ? String(
                    product.releaseDate
                ).slice(0, 10)
                : "",

        status:
            product.status ||
            "Active",

        createdAt:
            product.createdAt ||
            null,

        updatedAt:
            product.updatedAt ||
            null,
    });

    const normalizeProjectFromApi = (
        project
    ) => ({
        id:
            project.id ||
            project._id ||
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

        productId:
            project.productId ||
            "",

        productCode:
            project.productCode ||
            "",

        productName:
            project.productName ||
            "",

        clientId:
            project.clientId ||
            "",

        clientCode:
            project.clientCode ||
            "",

        clientName:
            project.clientName ||
            "",

        description:
            project.description ||
            "",

        startDate:
            project.startDate
                ? String(
                    project.startDate
                ).slice(0, 10)
                : "",

        dueDate:
            project.dueDate
                ? String(
                    project.dueDate
                ).slice(0, 10)
                : "",

        completedDate:
            project.completedDate
                ? String(
                    project.completedDate
                ).slice(0, 10)
                : "",

        priority:
            project.priority ||
            "Medium",

        status:
            project.status ||
            "Planned",

        progress:
            Number(
                project.progress || 0
            ),

        createdAt:
            project.createdAt ||
            null,

        updatedAt:
            project.updatedAt ||
            null,
    });
    const normalizeClientFromApi = (
        client
    ) => ({
        id:
            client.id ||
            client._id ||
            "",

        clientCode:
            client.clientCode ||
            "",

        companyName:
            client.companyName ||
            client.clientName ||
            "",
    });
    const loadSystemSettings = async () => {
        try {
            setSettingsLoading(true);
            setSettingsError("");

            const token =
                getAuthToken();

            if (!token) {
                throw new Error(
                    "Login token was not found. Please login again."
                );
            }

            const response = await fetch(
                SETTINGS_API_URL,
                {
                    method: "GET",

                    headers:
                        getSettingsHeaders(),
                }
            );

            const result =
                await parseApiResponse(
                    response,
                    "Unable to load system settings."
                );

            const normalizedSettings =
                normalizeSettingsFromApi(
                    result.data
                );

            setSettings(
                normalizedSettings
            );
        } catch (error) {
            console.error(
                "Load system settings error:",
                error
            );

            setSettingsError(
                error.message ||
                "Unable to load system settings."
            );
        } finally {
            setSettingsLoading(false);
        }
    };

    const loadProducts = async () => {
        try {
            setProductsLoading(true);
            setProductsError("");

            const token =
                getAuthToken();

            if (!token) {
                throw new Error(
                    "Login token was not found. Please login again."
                );
            }

            const response = await fetch(
                `${API_URL}/api/admin/products`,
                {
                    headers: {
                        Accept:
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,
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

            const rows =
                Array.isArray(result.data)
                    ? result.data
                    : [];

            setProducts(
                rows.map(
                    normalizeProductFromApi
                )
            );
        } catch (error) {
            console.error(
                "Load products error:",
                error
            );

            setProductsError(
                error.message ||
                "Unable to load products."
            );

            setProducts([]);
        } finally {
            setProductsLoading(false);
        }
    };
    const loadProjects = async () => {
        try {
            setProjectsLoading(true);
            setProjectsError("");

            const token =
                getAuthToken();

            if (!token) {
                throw new Error(
                    "Login token was not found. Please login again."
                );
            }

            const response = await fetch(
                `${API_URL}/api/admin/projects`,
                {
                    headers: {
                        Accept:
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,
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

            const rows =
                Array.isArray(result.data)
                    ? result.data
                    : [];

            setProjects(
                rows.map(
                    normalizeProjectFromApi
                )
            );
        } catch (error) {
            console.error(
                "Load projects error:",
                error
            );

            setProjectsError(
                error.message ||
                "Unable to load projects."
            );

            setProjects([]);
        } finally {
            setProjectsLoading(false);
        }
    };

    const loadClients = async () => {
        try {
            setClientsLoading(true);

            const token =
                getAuthToken();

            if (!token) {
                throw new Error(
                    "Login token was not found."
                );
            }

            const response = await fetch(
                `${API_URL}/api/admin/clients`,
                {
                    headers: {
                        Accept:
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,
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
                    "Unable to load clients."
                );
            }

            const rows =
                Array.isArray(result.data)
                    ? result.data
                    : [];

            setClients(
                rows
                    .map(
                        normalizeClientFromApi
                    )
                    .sort((a, b) =>
                        a.companyName.localeCompare(
                            b.companyName
                        )
                    )
            );
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


    const activeNavigation = useMemo(
        () =>
            navigationItems.find((item) => item.id === activeSection) ||
            navigationItems[0],
        [activeSection]
    );

    const showSavedMessage = (message) => {
        setSavedMessage(message);

        window.setTimeout(() => {
            setSavedMessage("");
        }, 2500);
    };



    useEffect(() => {
        loadSystemSettings();
        loadProducts();
        loadProjects();
        loadClients();
    }, []);
    const handleCompanyChange = (event) => {
        const { name, value } = event.target;

        setSettings((current) => ({
            ...current,
            company: {
                ...current.company,
                [name]: value,
            },
        }));
    };

    const handleWorkingHoursChange = (event) => {
        const { name, value, type, checked } = event.target;

        setSettings((current) => ({
            ...current,
            workingHours: {
                ...current.workingHours,
                [name]:
                    type === "checkbox"
                        ? checked
                        : type === "number"
                            ? Number(value)
                            : value,
            },
        }));
    };

    const updateNotificationChannel = (
        notificationKey,
        channel,
        enabled
    ) => {
        setSettings((current) => ({
            ...current,
            notifications: {
                ...current.notifications,
                [notificationKey]: {
                    ...current.notifications[notificationKey],
                    [channel]: enabled,
                },
            },
        }));
    };

    const updateNotificationValue = (name, value) => {
        setSettings((current) => ({
            ...current,
            notifications: {
                ...current.notifications,
                [name]: value,
            },
        }));
    };

    const toggleWeeklyOff = (day) => {
        setSettings((current) => {
            const currentDays = current.workingHours.weeklyOff || [];
            const exists = currentDays.includes(day);

            return {
                ...current,
                workingHours: {
                    ...current.workingHours,
                    weeklyOff: exists
                        ? currentDays.filter((item) => item !== day)
                        : [...currentDays, day],
                },
            };
        });
    };

    const saveSection = async () => {
        try {
            setSettingsSaving(true);
            setSettingsError("");

            let endpoint = "";
            let payload = {};

            switch (activeSection) {
                case "company":
                    endpoint =
                        `${SETTINGS_API_URL}/company`;

                    payload =
                        settings.company;

                    break;

                case "workingHours":
                    endpoint =
                        `${SETTINGS_API_URL}/working-hours`;

                    payload =
                        settings.workingHours;

                    break;

                case "notifications":
                    endpoint =
                        `${SETTINGS_API_URL}/notifications`;

                    payload =
                        settings.notifications;

                    break;

                default:
                    showSavedMessage(
                        `${activeNavigation.label} uses individual save actions.`
                    );

                    return;
            }

            const response = await fetch(
                endpoint,
                {
                    method: "PUT",

                    headers:
                        getSettingsHeaders(
                            true
                        ),

                    body:
                        JSON.stringify(
                            payload
                        ),
                }
            );

            const result =
                await parseApiResponse(
                    response,
                    `Unable to save ${activeNavigation.label} settings.`
                );

            setSettings(
                (current) => ({
                    ...current,

                    [activeSection]:
                        result.data,
                })
            );

            showSavedMessage(
                `${activeNavigation.label} settings saved successfully.`
            );
        } catch (error) {
            console.error(
                "Save settings error:",
                error
            );

            setSettingsError(
                error.message ||
                "Unable to save settings."
            );
        } finally {
            setSettingsSaving(false);
        }
    };

    // const closeDrawer = () => {
    //     if (productSaving) {
    //         return;
    //     }

    //     setDrawerType("");

    //     setProductForm({
    //         ...emptyProduct,
    //     });

    //     setProductFormError("");

    //     setRoleForm(emptyRole);
    //     setStatusForm(emptyStatus);
    //     setPriorityForm(emptyPriority);
    //     setLeaveTypeForm(emptyLeaveType);
    // };


    const closeDrawer = () => {
        if (
            productSaving ||
            projectSaving ||
            recordSaving
        ) {
            return;
        }

        setDrawerType("");

        setProductForm({
            ...emptyProduct,
        });

        setProductFormError("");

        setProjectForm({
            ...emptyProject,
        });

        setProjectFormError("");

        setRoleForm({
            ...emptyRole,
        });

        setStatusForm({
            ...emptyStatus,
        });

        setPriorityForm({
            ...emptyPriority,
        });

        setLeaveTypeForm({
            ...emptyLeaveType,
        });
    };

    const openProductDrawer = (
        product = null
    ) => {
        setProductFormError("");

        setProductForm(
            product
                ? {
                    ...normalizeProductFromApi(
                        product
                    ),
                }
                : {
                    ...emptyProduct,
                }
        );

        setDrawerType("product");
    };

    const openProjectDrawer = (
        project = null
    ) => {
        setProjectFormError("");

        setProjectForm(
            project
                ? {
                    ...normalizeProjectFromApi(
                        project
                    ),
                }
                : {
                    ...emptyProject,
                }
        );

        setDrawerType("project");
    };

    const saveProduct = async (
        event
    ) => {
        event.preventDefault();

        const productCode =
            productForm.productCode
                .trim()
                .toUpperCase();

        const productName =
            productForm.productName.trim();

        if (!productCode) {
            setProductFormError(
                "Product code is required."
            );
            return;
        }

        if (!productName) {
            setProductFormError(
                "Product name is required."
            );
            return;
        }

        try {
            setProductSaving(true);
            setProductFormError("");

            const editing =
                Boolean(productForm.id);

            const endpoint = editing
                ? `${API_URL}/api/admin/product/${productForm.id}`
                : `${API_URL}/api/admin/product`;

            const response = await fetch(
                endpoint,
                {
                    method: editing
                        ? "PUT"
                        : "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Accept:
                            "application/json",

                        Authorization:
                            `Bearer ${getAuthToken()}`,
                    },

                    body: JSON.stringify({
                        productCode,
                        productName,

                        category:
                            productForm.category.trim() ||
                            "Software",

                        description:
                            productForm.description.trim(),

                        currentVersion:
                            productForm.currentVersion.trim() ||
                            "v1.0.0",

                        platform:
                            productForm.platform ||
                            "Web",

                        releaseDate:
                            productForm.releaseDate ||
                            null,

                        status:
                            productForm.status ||
                            "Active",
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
                    "Unable to save product."
                );
            }

            const savedProduct =
                normalizeProductFromApi(
                    result.data
                );

            setProducts((current) => {
                if (editing) {
                    return current
                        .map((product) =>
                            String(
                                product.id
                            ) ===
                                String(
                                    savedProduct.id
                                )
                                ? savedProduct
                                : product
                        )
                        .sort((a, b) =>
                            a.productName.localeCompare(
                                b.productName
                            )
                        );
                }

                return [
                    ...current,
                    savedProduct,
                ].sort((a, b) =>
                    a.productName.localeCompare(
                        b.productName
                    )
                );
            });

            setDrawerType("");

            setProductForm({
                ...emptyProduct,
            });

            showSavedMessage(
                editing
                    ? "Product updated successfully."
                    : "Product created successfully."
            );
        } catch (error) {
            console.error(
                "Save product error:",
                error
            );

            setProductFormError(
                error.message ||
                "Unable to save product."
            );
        } finally {
            setProductSaving(false);
        }
    };

    const saveProject = async (
        event
    ) => {
        event.preventDefault();

        const projectCode =
            projectForm.projectCode
                .trim()
                .toUpperCase();

        const projectName =
            projectForm.projectName
                .trim();

        if (!projectCode) {
            setProjectFormError(
                "Project code is required."
            );
            return;
        }

        if (!projectName) {
            setProjectFormError(
                "Project name is required."
            );
            return;
        }

        const normalizedProgress =
            Math.min(
                Math.max(
                    Number(
                        projectForm.progress ||
                        0
                    ),
                    0
                ),
                100
            );

        try {
            setProjectSaving(true);
            setProjectFormError("");

            const editing =
                Boolean(projectForm.id);

            const endpoint = editing
                ? `${API_URL}/api/admin/project/${projectForm.id}`
                : `${API_URL}/api/admin/project`;

            const response = await fetch(
                endpoint,
                {
                    method: editing
                        ? "PUT"
                        : "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Accept:
                            "application/json",

                        Authorization:
                            `Bearer ${getAuthToken()}`,
                    },

                    body: JSON.stringify({
                        projectCode,
                        projectName,

                        projectType:
                            projectForm.projectType ||
                            "Internal Development",

                        productId:
                            projectForm.productId ||
                            null,

                        clientId:
                            projectForm.clientId ||
                            null,

                        description:
                            projectForm.description.trim(),

                        startDate:
                            projectForm.startDate ||
                            null,

                        dueDate:
                            projectForm.dueDate ||
                            null,

                        priority:
                            projectForm.priority ||
                            "Medium",

                        status:
                            projectForm.status ||
                            "Planned",

                        progress:
                            normalizedProgress,
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
                    "Unable to save project."
                );
            }

            const savedProject =
                normalizeProjectFromApi(
                    result.data
                );

            setProjects((current) => {
                if (editing) {
                    return current.map(
                        (project) =>
                            String(
                                project.id
                            ) ===
                                String(
                                    savedProject.id
                                )
                                ? savedProject
                                : project
                    );
                }

                return [
                    savedProject,
                    ...current,
                ];
            });

            setDrawerType("");

            setProjectForm({
                ...emptyProject,
            });

            showSavedMessage(
                editing
                    ? "Project updated successfully."
                    : "Project created successfully."
            );
        } catch (error) {
            console.error(
                "Save project error:",
                error
            );

            setProjectFormError(
                error.message ||
                "Unable to save project."
            );
        } finally {
            setProjectSaving(false);
        }
    };

    const changeProductStatus = async (
        product
    ) => {
        const nextStatus =
            product.status === "Active"
                ? "Inactive"
                : "Active";

        try {
            setProductsError("");

            const response = await fetch(
                `${API_URL}/api/admin/product/${product.id}/status`,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Accept:
                            "application/json",

                        Authorization:
                            `Bearer ${getAuthToken()}`,
                    },

                    body: JSON.stringify({
                        status: nextStatus,
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
                    "Unable to change product status."
                );
            }

            const updatedProduct =
                normalizeProductFromApi(
                    result.data
                );

            setProducts((current) =>
                current.map((item) =>
                    String(item.id) ===
                        String(updatedProduct.id)
                        ? updatedProduct
                        : item
                )
            );

            showSavedMessage(
                `Product marked ${nextStatus}.`
            );
        } catch (error) {
            console.error(
                "Change product status error:",
                error
            );

            setProductsError(
                error.message ||
                "Unable to change product status."
            );
        }
    };

    const changeProjectStatus = async (
        project,
        nextStatus
    ) => {
        try {
            setProjectsError("");

            const response = await fetch(
                `${API_URL}/api/admin/project/${project.id}/status`,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Accept:
                            "application/json",

                        Authorization:
                            `Bearer ${getAuthToken()}`,
                    },

                    body: JSON.stringify({
                        status:
                            nextStatus,

                        progress:
                            nextStatus ===
                                "Completed"
                                ? 100
                                : project.progress,
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
                    "Unable to change project status."
                );
            }

            const updatedProject =
                normalizeProjectFromApi(
                    result.data
                );

            setProjects((current) =>
                current.map((item) =>
                    String(item.id) ===
                        String(
                            updatedProject.id
                        )
                        ? updatedProject
                        : item
                )
            );

            showSavedMessage(
                `Project marked ${nextStatus}.`
            );
        } catch (error) {
            console.error(
                "Change project status error:",
                error
            );

            setProjectsError(
                error.message ||
                "Unable to change project status."
            );
        }
    };

    const deleteProduct = async (
        product
    ) => {
        const confirmed =
            window.confirm(
                `Delete product "${product.productName}"?`
            );

        if (!confirmed) {
            return;
        }

        try {
            setProductsError("");

            const response = await fetch(
                `${API_URL}/api/admin/product/${product.id}`,
                {
                    method: "DELETE",

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
                const usage =
                    result.usage;

                if (usage) {
                    throw new Error(
                        `${result.message} Clients: ${usage.clients || 0
                        }, Tickets: ${usage.tickets || 0
                        }, Tasks: ${usage.tasks || 0
                        }.`
                    );
                }

                throw new Error(
                    result.message ||
                    "Unable to delete product."
                );
            }

            setProducts((current) =>
                current.filter(
                    (item) =>
                        String(item.id) !==
                        String(product.id)
                )
            );

            showSavedMessage(
                "Product deleted successfully."
            );
        } catch (error) {
            console.error(
                "Delete product error:",
                error
            );

            setProductsError(
                error.message ||
                "Unable to delete product."
            );
        }
    };
    const deleteProject = async (
        project
    ) => {
        const confirmed =
            window.confirm(
                `Delete project "${project.projectName}"?`
            );

        if (!confirmed) {
            return;
        }

        try {
            setProjectsError("");

            const response = await fetch(
                `${API_URL}/api/admin/project/${project.id}`,
                {
                    method: "DELETE",

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
                if (result.usage) {
                    throw new Error(
                        `${result.message} Linked tasks: ${result.usage.tasks ||
                        0
                        }.`
                    );
                }

                throw new Error(
                    result.message ||
                    "Unable to delete project."
                );
            }

            setProjects((current) =>
                current.filter(
                    (item) =>
                        String(item.id) !==
                        String(project.id)
                )
            );

            showSavedMessage(
                "Project deleted successfully."
            );
        } catch (error) {
            console.error(
                "Delete project error:",
                error
            );

            setProjectsError(
                error.message ||
                "Unable to delete project."
            );
        }
    };

    const openRoleDrawer = (role = null) => {
        setRoleForm(role ? { ...role } : { ...emptyRole });
        setDrawerType("role");
    };

    const saveRole = async (
        event
    ) => {
        event.preventDefault();

        const normalizedName =
            roleForm.name.trim();

        if (!normalizedName) {
            alert(
                "Role name is required."
            );
            return;
        }

        if (
            roleForm.permissions.length ===
            0
        ) {
            alert(
                "Select at least one permission."
            );
            return;
        }

        try {
            setRecordSaving(true);
            setSettingsError("");

            const editing =
                Boolean(roleForm.id);

            const endpoint =
                editing
                    ? `${SETTINGS_API_URL}/roles/${roleForm.id}`
                    : `${SETTINGS_API_URL}/roles`;

            const response = await fetch(
                endpoint,
                {
                    method:
                        editing
                            ? "PUT"
                            : "POST",

                    headers:
                        getSettingsHeaders(
                            true
                        ),

                    body:
                        JSON.stringify({
                            name:
                                normalizedName,

                            description:
                                roleForm.description.trim(),

                            users:
                                Number(
                                    roleForm.users ||
                                    0
                                ),

                            permissions:
                                roleForm.permissions,

                            status:
                                roleForm.status ||
                                "Active",
                        }),
                }
            );

            const result =
                await parseApiResponse(
                    response,
                    "Unable to save role."
                );

            const savedRole =
                normalizeSettingRecord(
                    result.data
                );

            setSettings(
                (current) => ({
                    ...current,

                    roles:
                        editing
                            ? current.roles.map(
                                (role) =>
                                    String(
                                        role.id
                                    ) ===
                                        String(
                                            savedRole.id
                                        )
                                        ? savedRole
                                        : role
                            )
                            : [
                                ...current.roles,
                                savedRole,
                            ],
                })
            );

            closeDrawer();

            showSavedMessage(
                editing
                    ? "Role updated successfully."
                    : "Role created successfully."
            );
        } catch (error) {
            console.error(
                "Save role error:",
                error
            );

            setSettingsError(
                error.message ||
                "Unable to save role."
            );
        } finally {
            setRecordSaving(false);
        }
    };

    const togglePermission = (permission) => {
        setRoleForm((current) => {
            const exists = current.permissions.includes(permission);

            return {
                ...current,
                permissions: exists
                    ? current.permissions.filter(
                        (item) => item !== permission
                    )
                    : [...current.permissions, permission],
            };
        });
    };

    const openStatusDrawer = (status = null) => {
        setStatusForm(
            status
                ? { ...status }
                : {
                    ...emptyStatus,
                    order: settings.taskStatuses.length + 1,
                }
        );
        setDrawerType("status");
    };

    const saveTaskStatus = async (
        event
    ) => {
        event.preventDefault();

        const normalizedName =
            statusForm.name.trim();

        if (!normalizedName) {
            alert(
                "Status name is required."
            );
            return;
        }

        try {
            setRecordSaving(true);
            setSettingsError("");

            const editing =
                Boolean(statusForm.id);

            const endpoint =
                editing
                    ? `${SETTINGS_API_URL}/task-statuses/${statusForm.id}`
                    : `${SETTINGS_API_URL}/task-statuses`;

            const response = await fetch(
                endpoint,
                {
                    method:
                        editing
                            ? "PUT"
                            : "POST",

                    headers:
                        getSettingsHeaders(
                            true
                        ),

                    body:
                        JSON.stringify({
                            name:
                                normalizedName,

                            description:
                                statusForm.description.trim(),

                            color:
                                statusForm.color ||
                                "Slate",

                            order:
                                Number(
                                    statusForm.order ||
                                    1
                                ),

                            isFinal:
                                Boolean(
                                    statusForm.isFinal
                                ),

                            status:
                                statusForm.status ||
                                "Active",
                        }),
                }
            );

            const result =
                await parseApiResponse(
                    response,
                    "Unable to save task status."
                );

            const rows =
                Array.isArray(
                    result.all
                )
                    ? result.all
                    : null;

            setSettings(
                (current) => ({
                    ...current,

                    taskStatuses:
                        rows
                            ? rows
                                .map(
                                    normalizeSettingRecord
                                )
                                .sort(
                                    (
                                        a,
                                        b
                                    ) =>
                                        Number(
                                            a.order ||
                                            0
                                        ) -
                                        Number(
                                            b.order ||
                                            0
                                        )
                                )
                            : editing
                                ? current.taskStatuses
                                    .map(
                                        (
                                            status
                                        ) =>
                                            String(
                                                status.id
                                            ) ===
                                                String(
                                                    result
                                                        .data
                                                        ?._id ||
                                                    result
                                                        .data
                                                        ?.id
                                                )
                                                ? normalizeSettingRecord(
                                                    result.data
                                                )
                                                : status
                                    )
                                    .sort(
                                        (
                                            a,
                                            b
                                        ) =>
                                            Number(
                                                a.order ||
                                                0
                                            ) -
                                            Number(
                                                b.order ||
                                                0
                                            )
                                    )
                                : [
                                    ...current.taskStatuses,
                                    normalizeSettingRecord(
                                        result.data
                                    ),
                                ].sort(
                                    (
                                        a,
                                        b
                                    ) =>
                                        Number(
                                            a.order ||
                                            0
                                        ) -
                                        Number(
                                            b.order ||
                                            0
                                        )
                                ),
                })
            );

            closeDrawer();

            showSavedMessage(
                editing
                    ? "Task status updated successfully."
                    : "Task status created successfully."
            );
        } catch (error) {
            console.error(
                "Save task status error:",
                error
            );

            setSettingsError(
                error.message ||
                "Unable to save task status."
            );
        } finally {
            setRecordSaving(false);
        }
    };

    const openPriorityDrawer = (priority = null) => {
        setPriorityForm(
            priority ? { ...priority } : { ...emptyPriority }
        );
        setDrawerType("priority");
    };

    const savePriority = async (
        event
    ) => {
        event.preventDefault();

        const normalizedName =
            priorityForm.name.trim();

        if (!normalizedName) {
            alert(
                "Priority name is required."
            );
            return;
        }

        try {
            setRecordSaving(true);
            setSettingsError("");

            const editing =
                Boolean(
                    priorityForm.id
                );

            const endpoint =
                editing
                    ? `${SETTINGS_API_URL}/priorities/${priorityForm.id}`
                    : `${SETTINGS_API_URL}/priorities`;

            const response = await fetch(
                endpoint,
                {
                    method:
                        editing
                            ? "PUT"
                            : "POST",

                    headers:
                        getSettingsHeaders(
                            true
                        ),

                    body:
                        JSON.stringify({
                            name:
                                normalizedName,

                            responseHours:
                                Number(
                                    priorityForm.responseHours ||
                                    0
                                ),

                            color:
                                priorityForm.color ||
                                "Slate",

                            status:
                                priorityForm.status ||
                                "Active",
                        }),
                }
            );

            const result =
                await parseApiResponse(
                    response,
                    "Unable to save priority."
                );

            const savedPriority =
                normalizeSettingRecord(
                    result.data
                );

            setSettings(
                (current) => ({
                    ...current,

                    priorities:
                        editing
                            ? current.priorities.map(
                                (
                                    priority
                                ) =>
                                    String(
                                        priority.id
                                    ) ===
                                        String(
                                            savedPriority.id
                                        )
                                        ? savedPriority
                                        : priority
                            )
                            : [
                                ...current.priorities,
                                savedPriority,
                            ],
                })
            );

            closeDrawer();

            showSavedMessage(
                editing
                    ? "Priority updated successfully."
                    : "Priority created successfully."
            );
        } catch (error) {
            console.error(
                "Save priority error:",
                error
            );

            setSettingsError(
                error.message ||
                "Unable to save priority."
            );
        } finally {
            setRecordSaving(false);
        }
    };

    const openLeaveTypeDrawer = (leaveType = null) => {
        setLeaveTypeForm(
            leaveType ? { ...leaveType } : { ...emptyLeaveType }
        );
        setDrawerType("leaveType");
    };

    const saveLeaveType = async (
        event
    ) => {
        event.preventDefault();

        const normalizedName =
            leaveTypeForm.name.trim();

        const normalizedCode =
            leaveTypeForm.code
                .trim()
                .toUpperCase();

        if (
            !normalizedName ||
            !normalizedCode
        ) {
            alert(
                "Leave name and leave code are required."
            );
            return;
        }

        try {
            setRecordSaving(true);
            setSettingsError("");

            const editing =
                Boolean(
                    leaveTypeForm.id
                );

            const endpoint =
                editing
                    ? `${SETTINGS_API_URL}/leave-types/${leaveTypeForm.id}`
                    : `${SETTINGS_API_URL}/leave-types`;

            const response = await fetch(
                endpoint,
                {
                    method:
                        editing
                            ? "PUT"
                            : "POST",

                    headers:
                        getSettingsHeaders(
                            true
                        ),

                    body:
                        JSON.stringify({
                            name:
                                normalizedName,

                            code:
                                normalizedCode,

                            yearlyLimit:
                                Number(
                                    leaveTypeForm.yearlyLimit ||
                                    0
                                ),

                            paid:
                                Boolean(
                                    leaveTypeForm.paid
                                ),

                            carryForward:
                                Boolean(
                                    leaveTypeForm.carryForward
                                ),

                            requiresDocument:
                                Boolean(
                                    leaveTypeForm.requiresDocument
                                ),

                            status:
                                leaveTypeForm.status ||
                                "Active",
                        }),
                }
            );

            const result =
                await parseApiResponse(
                    response,
                    "Unable to save leave type."
                );

            const savedLeaveType =
                normalizeSettingRecord(
                    result.data
                );

            setSettings(
                (current) => ({
                    ...current,

                    leaveTypes:
                        editing
                            ? current.leaveTypes.map(
                                (
                                    leaveType
                                ) =>
                                    String(
                                        leaveType.id
                                    ) ===
                                        String(
                                            savedLeaveType.id
                                        )
                                        ? savedLeaveType
                                        : leaveType
                            )
                            : [
                                ...current.leaveTypes,
                                savedLeaveType,
                            ],
                })
            );

            closeDrawer();

            showSavedMessage(
                editing
                    ? "Leave type updated successfully."
                    : "Leave type created successfully."
            );
        } catch (error) {
            console.error(
                "Save leave type error:",
                error
            );

            setSettingsError(
                error.message ||
                "Unable to save leave type."
            );
        } finally {
            setRecordSaving(false);
        }
    };

    const toggleRecordStatus = async (
        collectionName,
        recordId
    ) => {
        const routeMap = {
            roles: "roles",
            taskStatuses:
                "task-statuses",
            priorities:
                "priorities",
            leaveTypes:
                "leave-types",
        };

        const routeName =
            routeMap[collectionName];

        if (!routeName) {
            return;
        }

        const record =
            settings[
                collectionName
            ]?.find(
                (item) =>
                    String(item.id) ===
                    String(recordId)
            );

        if (!record) {
            return;
        }

        const nextStatus =
            record.status ===
                "Active"
                ? "Inactive"
                : "Active";

        try {
            setSettingsError("");

            const response = await fetch(
                `${SETTINGS_API_URL}/${routeName}/${recordId}/status`,
                {
                    method: "PATCH",

                    headers:
                        getSettingsHeaders(
                            true
                        ),

                    body:
                        JSON.stringify({
                            status:
                                nextStatus,
                        }),
                }
            );

            const result =
                await parseApiResponse(
                    response,
                    "Unable to update status."
                );

            const updatedRecord =
                normalizeSettingRecord(
                    result.data
                );

            setSettings(
                (current) => ({
                    ...current,

                    [collectionName]:
                        current[
                            collectionName
                        ].map(
                            (item) =>
                                String(
                                    item.id
                                ) ===
                                    String(
                                        updatedRecord.id
                                    )
                                    ? updatedRecord
                                    : item
                        ),
                })
            );

            showSavedMessage(
                `Record marked ${nextStatus}.`
            );
        } catch (error) {
            console.error(
                "Update record status error:",
                error
            );

            setSettingsError(
                error.message ||
                "Unable to update status."
            );
        }
    };

    const deleteSettingRecord = async (
        collectionName,
        record
    ) => {
        const routeMap = {
            roles: "roles",
            taskStatuses:
                "task-statuses",
            priorities:
                "priorities",
            leaveTypes:
                "leave-types",
        };

        const labelMap = {
            roles: "role",
            taskStatuses:
                "task status",
            priorities:
                "priority",
            leaveTypes:
                "leave type",
        };

        const routeName =
            routeMap[collectionName];

        const recordLabel =
            labelMap[collectionName] ||
            "record";

        if (
            !routeName ||
            !record?.id
        ) {
            return;
        }

        if (record.isSystem) {
            setSettingsError(
                `System ${recordLabel}s cannot be deleted. Disable the record instead.`
            );

            return;
        }

        const confirmed =
            window.confirm(
                `Delete ${recordLabel} "${record.name}"?`
            );

        if (!confirmed) {
            return;
        }

        try {
            setRecordSaving(true);
            setSettingsError("");

            const response = await fetch(
                `${SETTINGS_API_URL}/${routeName}/${record.id}`,
                {
                    method: "DELETE",

                    headers:
                        getSettingsHeaders(),
                }
            );

            const result =
                await parseApiResponse(
                    response,
                    `Unable to delete ${recordLabel}.`
                );

            setSettings(
                (current) => ({
                    ...current,

                    [collectionName]:
                        current[
                            collectionName
                        ].filter(
                            (item) =>
                                String(
                                    item.id
                                ) !==
                                String(
                                    record.id
                                )
                        ),
                })
            );

            showSavedMessage(
                `${recordLabel
                    .charAt(0)
                    .toUpperCase()}${recordLabel.slice(
                        1
                    )} deleted successfully.`
            );
        } catch (error) {
            console.error(
                `Delete ${recordLabel} error:`,
                error
            );

            setSettingsError(
                error.message ||
                `Unable to delete ${recordLabel}.`
            );
        } finally {
            setRecordSaving(false);
        }
    };
    const moveTaskStatus = async (
        statusId,
        direction
    ) => {
        const currentRows = [
            ...settings.taskStatuses,
        ].sort(
            (a, b) =>
                Number(a.order) -
                Number(b.order)
        );

        const currentIndex =
            currentRows.findIndex(
                (item) =>
                    String(item.id) ===
                    String(statusId)
            );

        if (currentIndex < 0) {
            return;
        }

        const targetIndex =
            direction === "up"
                ? currentIndex - 1
                : currentIndex + 1;

        if (
            targetIndex < 0 ||
            targetIndex >=
            currentRows.length
        ) {
            return;
        }

        const reordered = [
            ...currentRows,
        ];

        [
            reordered[currentIndex],
            reordered[targetIndex],
        ] = [
                reordered[targetIndex],
                reordered[currentIndex],
            ];

        const optimisticRows =
            reordered.map(
                (item, index) => ({
                    ...item,
                    order:
                        index + 1,
                })
            );

        setSettings(
            (current) => ({
                ...current,

                taskStatuses:
                    optimisticRows,
            })
        );

        try {
            setRecordSaving(true);
            setSettingsError("");

            const response = await fetch(
                `${SETTINGS_API_URL}/task-statuses/reorder`,
                {
                    method: "PUT",

                    headers:
                        getSettingsHeaders(
                            true
                        ),

                    body:
                        JSON.stringify({
                            ids:
                                optimisticRows.map(
                                    (item) =>
                                        item.id
                                ),
                        }),
                }
            );

            const result =
                await parseApiResponse(
                    response,
                    "Unable to reorder task statuses."
                );

            setSettings(
                (current) => ({
                    ...current,

                    taskStatuses:
                        result.data
                            .map(
                                normalizeSettingRecord
                            )
                            .sort(
                                (a, b) =>
                                    Number(
                                        a.order
                                    ) -
                                    Number(
                                        b.order
                                    )
                            ),
                })
            );

            showSavedMessage(
                "Task status order updated."
            );
        } catch (error) {
            console.error(
                "Reorder task status error:",
                error
            );

            setSettingsError(
                error.message ||
                "Unable to reorder task statuses."
            );

            await loadSystemSettings();
        } finally {
            setRecordSaving(false);
        }
    };

    if (settingsLoading) {
        return (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white">
                <Loader2
                    size={30}
                    className="animate-spin text-violet-600"
                />

                <p className="mt-4 text-sm font-semibold text-slate-700">
                    Loading system settings...
                </p>

                <p className="mt-1 text-xs text-slate-500">
                    Fetching configuration from MongoDB.
                </p>
            </div>
        );
    }





    return (


        <div className="enterprise-page">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
                        Management
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                        System Settings
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                        Configure your workspace, products, workflow,
                        attendance and notification rules.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {savedMessage && (
                        <div className="flex h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-xs font-semibold text-emerald-700">
                            <Check size={15} />
                            {savedMessage}
                        </div>
                    )}
                    {[
                        "company",
                        "workingHours",
                        "notifications",
                    ].includes(activeSection) && (
                            <button
                                type="button"
                                onClick={saveSection}
                                disabled={
                                    settingsSaving ||
                                    settingsLoading
                                }
                                className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {settingsSaving ? (
                                    <Loader2
                                        size={15}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Save size={15} />
                                )}

                                {settingsSaving
                                    ? "Saving..."
                                    : "Save Changes"}
                            </button>
                        )}
                </div>
            </div>

            {settingsError && (
                <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                    <p className="text-xs font-medium text-rose-700">
                        {settingsError}
                    </p>

                    <button
                        type="button"
                        onClick={
                            loadSystemSettings
                        }
                        className="shrink-0 rounded-lg border border-rose-200 bg-white px-3 py-2 text-[10px] font-semibold text-rose-700"
                    >
                        Retry
                    </button>
                </div>
            )}
            <div className="mt-6 grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
                <aside className="enterprise-surface h-fit overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="border-b border-slate-200 px-5 py-4">
                        <p className="text-xs font-semibold text-slate-950">
                            Configuration
                        </p>

                        <p className="mt-1 text-[10px] text-slate-500">
                            Select a settings category.
                        </p>
                    </div>

                    <div className="space-y-1 p-2">
                        {navigationItems.map((item) => {
                            const Icon = item.icon;
                            const active = activeSection === item.id;

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() =>
                                        setActiveSection(item.id)
                                    }
                                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${active
                                        ? "bg-violet-50 text-violet-700"
                                        : "text-slate-600 hover:bg-slate-50"
                                        }`}
                                >
                                    <div
                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active
                                            ? "bg-violet-100"
                                            : "bg-slate-100 text-slate-500"
                                            }`}
                                    >
                                        <Icon size={17} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold">
                                            {item.label}
                                        </p>

                                        <p
                                            className={`mt-1 truncate text-[9px] ${active
                                                ? "text-violet-500"
                                                : "text-slate-400"
                                                }`}
                                        >
                                            {item.description}
                                        </p>
                                    </div>

                                    <ChevronRight
                                        size={14}
                                        className={
                                            active
                                                ? "text-violet-500"
                                                : "text-slate-300"
                                        }
                                    />
                                </button>
                            );
                        })}
                    </div>
                </aside>

                <section className="enterprise-surface min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-950">
                                {activeNavigation.label}
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                                {activeNavigation.description}
                            </p>
                        </div>
                    </div>

                    {activeSection === "company" && (
                        <div className="p-6">
                            <div className="grid gap-5 lg:grid-cols-2">
                                <div>
                                    <FieldLabel required>
                                        Company name
                                    </FieldLabel>

                                    <input
                                        name="companyName"
                                        value={
                                            settings.company.companyName
                                        }
                                        onChange={handleCompanyChange}
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    />
                                </div>

                                <div>
                                    <FieldLabel required>
                                        Workspace name
                                    </FieldLabel>

                                    <input
                                        name="workspaceName"
                                        value={
                                            settings.company.workspaceName
                                        }
                                        onChange={handleCompanyChange}
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    />
                                </div>

                                <div>
                                    <FieldLabel>Owner name</FieldLabel>

                                    <input
                                        name="ownerName"
                                        value={settings.company.ownerName}
                                        onChange={handleCompanyChange}
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    />
                                </div>

                                <div>
                                    <FieldLabel>Email address</FieldLabel>

                                    <input
                                        type="email"
                                        name="email"
                                        value={settings.company.email}
                                        onChange={handleCompanyChange}
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    />
                                </div>

                                <div>
                                    <FieldLabel>Mobile number</FieldLabel>

                                    <input
                                        name="mobile"
                                        value={settings.company.mobile}
                                        onChange={handleCompanyChange}
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    />
                                </div>

                                <div>
                                    <FieldLabel>GST number</FieldLabel>

                                    <input
                                        name="gstNo"
                                        value={settings.company.gstNo}
                                        onChange={handleCompanyChange}
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs uppercase outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    />
                                </div>

                                <div className="lg:col-span-2">
                                    <FieldLabel>Business address</FieldLabel>

                                    <textarea
                                        name="address"
                                        value={settings.company.address}
                                        onChange={handleCompanyChange}
                                        rows={4}
                                        className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    />
                                </div>

                                <div>
                                    <FieldLabel>City</FieldLabel>

                                    <input
                                        name="city"
                                        value={settings.company.city}
                                        onChange={handleCompanyChange}
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    />
                                </div>

                                <div>
                                    <FieldLabel>State</FieldLabel>

                                    <input
                                        name="state"
                                        value={settings.company.state}
                                        onChange={handleCompanyChange}
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    />
                                </div>

                                <div>
                                    <FieldLabel>Date format</FieldLabel>

                                    <select
                                        name="dateFormat"
                                        value={settings.company.dateFormat}
                                        onChange={handleCompanyChange}
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    >
                                        <option>DD/MM/YYYY</option>
                                        <option>MM/DD/YYYY</option>
                                        <option>YYYY-MM-DD</option>
                                    </select>
                                </div>

                                <div>
                                    <FieldLabel>Timezone</FieldLabel>

                                    <select
                                        name="timezone"
                                        value={settings.company.timezone}
                                        onChange={handleCompanyChange}
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    >
                                        <option value="Asia/Kolkata">
                                            Asia/Kolkata
                                        </option>
                                        <option value="UTC">UTC</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === "products" && (
                        <div>
                            <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-slate-800">
                                        Product Master
                                    </p>

                                    <p className="mt-1 text-[10px] text-slate-500">
                                        Products used by clients,
                                        tickets, tasks and AMC.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={loadProducts}
                                        disabled={productsLoading}
                                        className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                                    >
                                        <Loader2
                                            size={15}
                                            className={
                                                productsLoading
                                                    ? "animate-spin"
                                                    : ""
                                            }
                                        />

                                        Refresh
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            openProductDrawer()
                                        }
                                        className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white transition hover:bg-violet-700"
                                    >
                                        <Plus size={15} />
                                        Add Product
                                    </button>
                                </div>
                            </div>

                            {productsError && (
                                <div className="border-b border-rose-200 bg-rose-50 px-5 py-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-xs font-medium text-rose-700">
                                            {productsError}
                                        </p>

                                        <button
                                            type="button"
                                            onClick={loadProducts}
                                            className="h-8 rounded-lg border border-rose-200 bg-white px-3 text-[10px] font-semibold text-rose-700"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                </div>
                            )}

                            {productsLoading ? (
                                <div className="flex min-h-[280px] flex-col items-center justify-center">
                                    <Loader2
                                        size={28}
                                        className="animate-spin text-violet-600"
                                    />

                                    <p className="mt-3 text-xs font-semibold text-slate-600">
                                        Loading products...
                                    </p>
                                </div>
                            ) : products.length === 0 ? (
                                <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                                        <BriefcaseBusiness
                                            size={24}
                                        />
                                    </div>

                                    <p className="mt-4 text-sm font-semibold text-slate-900">
                                        No products found
                                    </p>

                                    <p className="mt-2 max-w-[360px] text-xs leading-5 text-slate-500">
                                        Add your first software
                                        product or run the backend
                                        seed API.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            openProductDrawer()
                                        }
                                        className="mt-5 flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white"
                                    >
                                        <Plus size={15} />
                                        Add Product
                                    </button>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {products.map(
                                        (product) => (
                                            <div
                                                key={product.id}
                                                className="flex flex-col gap-4 px-5 py-5 transition hover:bg-slate-50/70 lg:flex-row lg:items-center"
                                            >
                                                <div className="flex min-w-0 flex-1 items-start gap-3">
                                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                                                        <BriefcaseBusiness
                                                            size={19}
                                                        />
                                                    </div>

                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="text-sm font-semibold text-slate-900">
                                                                {
                                                                    product.productName
                                                                }
                                                            </p>

                                                            <StatusBadge
                                                                status={
                                                                    product.status
                                                                }
                                                            />

                                                            <span className="rounded-lg bg-blue-50 px-2 py-1 text-[9px] font-semibold text-blue-700">
                                                                {
                                                                    product.platform
                                                                }
                                                            </span>
                                                        </div>

                                                        <p className="mt-1 text-[10px] font-semibold text-violet-600">
                                                            {
                                                                product.productCode
                                                            }
                                                            {" · "}
                                                            {
                                                                product.category
                                                            }
                                                            {" · "}
                                                            {
                                                                product.currentVersion
                                                            }
                                                        </p>

                                                        <p className="mt-2 text-xs leading-5 text-slate-500">
                                                            {product.description ||
                                                                "No description provided."}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            changeProductStatus(
                                                                product
                                                            )
                                                        }
                                                        className="h-9 rounded-lg border border-slate-200 px-3 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
                                                    >
                                                        {product.status ===
                                                            "Active"
                                                            ? "Disable"
                                                            : "Enable"}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openProductDrawer(
                                                                product
                                                            )
                                                        }
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-violet-700"
                                                    >
                                                        <Pencil
                                                            size={14}
                                                        />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            deleteProduct(
                                                                product
                                                            )
                                                        }
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 text-rose-600 transition hover:bg-rose-50"
                                                    >
                                                        <Trash2
                                                            size={14}
                                                        />
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    )}{activeSection === "projects" && (
                        <div>
                            <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-slate-800">
                                        Project Master
                                    </p>

                                    <p className="mt-1 text-[10px] text-slate-500">
                                        Track product development,
                                        client implementation and
                                        internal work.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={loadProjects}
                                        disabled={projectsLoading}
                                        className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                                    >
                                        <Loader2
                                            size={15}
                                            className={
                                                projectsLoading
                                                    ? "animate-spin"
                                                    : ""
                                            }
                                        />

                                        Refresh
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            openProjectDrawer()
                                        }
                                        className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white transition hover:bg-violet-700"
                                    >
                                        <Plus size={15} />
                                        Add Project
                                    </button>
                                </div>
                            </div>

                            {projectsError && (
                                <div className="border-b border-rose-200 bg-rose-50 px-5 py-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-xs font-medium text-rose-700">
                                            {projectsError}
                                        </p>

                                        <button
                                            type="button"
                                            onClick={loadProjects}
                                            className="h-8 rounded-lg border border-rose-200 bg-white px-3 text-[10px] font-semibold text-rose-700"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                </div>
                            )}

                            {projectsLoading ? (
                                <div className="flex min-h-[280px] flex-col items-center justify-center">
                                    <Loader2
                                        size={28}
                                        className="animate-spin text-violet-600"
                                    />

                                    <p className="mt-3 text-xs font-semibold text-slate-600">
                                        Loading projects...
                                    </p>
                                </div>
                            ) : projects.length === 0 ? (
                                <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                                        <FolderKanban
                                            size={24}
                                        />
                                    </div>

                                    <p className="mt-4 text-sm font-semibold text-slate-900">
                                        No projects found
                                    </p>

                                    <p className="mt-2 max-w-[360px] text-xs leading-5 text-slate-500">
                                        Add a development,
                                        implementation or internal
                                        project.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            openProjectDrawer()
                                        }
                                        className="mt-5 flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white"
                                    >
                                        <Plus size={15} />
                                        Add Project
                                    </button>
                                </div>
                            ) : (
                                <div className="grid gap-4 p-5 lg:grid-cols-2">
                                    {projects.map(
                                        (project) => (
                                            <div
                                                key={project.id}
                                                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-violet-200 hover:shadow-sm"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex min-w-0 items-start gap-3">
                                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                                                            <FolderKanban
                                                                size={19}
                                                            />
                                                        </div>

                                                        <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <p className="truncate text-sm font-semibold text-slate-900">
                                                                    {
                                                                        project.projectName
                                                                    }
                                                                </p>

                                                                <StatusBadge
                                                                    status={
                                                                        project.status
                                                                    }
                                                                />
                                                            </div>

                                                            <p className="mt-1 text-[10px] font-semibold text-violet-600">
                                                                {
                                                                    project.projectCode
                                                                }
                                                                {" · "}
                                                                {
                                                                    project.projectType
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <span
                                                        className={`rounded-lg px-2 py-1 text-[9px] font-semibold ${project.priority ===
                                                            "Critical"
                                                            ? "bg-rose-50 text-rose-700"
                                                            : project.priority ===
                                                                "High"
                                                                ? "bg-orange-50 text-orange-700"
                                                                : project.priority ===
                                                                    "Medium"
                                                                    ? "bg-amber-50 text-amber-700"
                                                                    : "bg-slate-100 text-slate-600"
                                                            }`}
                                                    >
                                                        {
                                                            project.priority
                                                        }
                                                    </span>
                                                </div>

                                                <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                                                    <div>
                                                        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                            Product
                                                        </p>

                                                        <p className="mt-1 truncate text-xs font-semibold text-slate-700">
                                                            {project.productName ||
                                                                "Not linked"}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                            Client
                                                        </p>

                                                        <p className="mt-1 truncate text-xs font-semibold text-slate-700">
                                                            {project.clientName ||
                                                                "Internal project"}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                            Start date
                                                        </p>

                                                        <p className="mt-1 text-xs font-semibold text-slate-700">
                                                            {project.startDate ||
                                                                "Not set"}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                            Due date
                                                        </p>

                                                        <p className="mt-1 text-xs font-semibold text-slate-700">
                                                            {project.dueDate ||
                                                                "Not set"}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mt-4">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-[10px] font-semibold text-slate-500">
                                                            Progress
                                                        </p>

                                                        <p className="text-[10px] font-bold text-violet-700">
                                                            {
                                                                project.progress
                                                            }
                                                            %
                                                        </p>
                                                    </div>

                                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                                        <div
                                                            className="h-full rounded-full bg-violet-600 transition-all"
                                                            style={{
                                                                width: `${Math.min(
                                                                    Math.max(
                                                                        Number(
                                                                            project.progress ||
                                                                            0
                                                                        ),
                                                                        0
                                                                    ),
                                                                    100
                                                                )}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                <p className="mt-4 line-clamp-2 text-xs leading-5 text-slate-500">
                                                    {project.description ||
                                                        "No description provided."}
                                                </p>

                                                <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
                                                    {project.status !==
                                                        "Completed" && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    changeProjectStatus(
                                                                        project,
                                                                        project.status ===
                                                                            "Active"
                                                                            ? "On Hold"
                                                                            : "Active"
                                                                    )
                                                                }
                                                                className="h-9 rounded-lg border border-slate-200 px-3 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
                                                            >
                                                                {project.status ===
                                                                    "Active"
                                                                    ? "Put On Hold"
                                                                    : "Make Active"}
                                                            </button>
                                                        )}

                                                    {project.status !==
                                                        "Completed" && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    changeProjectStatus(
                                                                        project,
                                                                        "Completed"
                                                                    )
                                                                }
                                                                className="h-9 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-[10px] font-semibold text-emerald-700"
                                                            >
                                                                Complete
                                                            </button>
                                                        )}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openProjectDrawer(
                                                                project
                                                            )
                                                        }
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500"
                                                    >
                                                        <Pencil
                                                            size={14}
                                                        />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            deleteProject(
                                                                project
                                                            )
                                                        }
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 text-rose-600"
                                                    >
                                                        <Trash2
                                                            size={14}
                                                        />
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    {activeSection === "roles" && (
                        <div>
                            <div className="flex justify-end border-b border-slate-200 bg-slate-50/60 px-5 py-4">
                                <button
                                    type="button"
                                    onClick={() => openRoleDrawer()}
                                    className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white"
                                >
                                    <Plus size={15} />
                                    Add Role
                                </button>
                            </div>

                            <div className="grid gap-4 p-5 lg:grid-cols-2">
                                {settings.roles.map((role) => (
                                    <div
                                        key={role.id}
                                        className="rounded-2xl border border-slate-200 p-5"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                                                    <KeyRound size={18} />
                                                </div>

                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {role.name}
                                                    </p>

                                                    <p className="mt-1 text-[10px] text-slate-500">
                                                        {role.users} user
                                                        {role.users !== 1
                                                            ? "s"
                                                            : ""}
                                                    </p>
                                                </div>
                                            </div>

                                            <StatusBadge
                                                status={role.status}
                                            />
                                        </div>

                                        <p className="mt-4 text-xs leading-5 text-slate-500">
                                            {role.description}
                                        </p>

                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {role.permissions
                                                .slice(0, 5)
                                                .map((permission) => (
                                                    <span
                                                        key={permission}
                                                        className="rounded-lg bg-slate-100 px-2.5 py-1 text-[9px] font-semibold text-slate-600"
                                                    >
                                                        {permission}
                                                    </span>
                                                ))}

                                            {role.permissions.length >
                                                5 && (
                                                    <span className="rounded-lg bg-violet-50 px-2.5 py-1 text-[9px] font-semibold text-violet-700">
                                                        +
                                                        {role.permissions
                                                            .length - 5}{" "}
                                                        more
                                                    </span>
                                                )}
                                        </div>

                                        <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleRecordStatus(
                                                        "roles",
                                                        role.id
                                                    )
                                                }
                                                className="h-9 rounded-lg border border-slate-200 px-3 text-[10px] font-semibold text-slate-600"
                                            >
                                                {role.status ===
                                                    "Active"
                                                    ? "Disable"
                                                    : "Enable"}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openRoleDrawer(role)
                                                }
                                                className="flex h-9 items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 text-[10px] font-semibold text-violet-700"
                                            >
                                                <Pencil size={13} />
                                                Edit
                                            </button>

                                            {!role.isSystem && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        deleteSettingRecord(
                                                            "roles",
                                                            role
                                                        )
                                                    }
                                                    disabled={
                                                        recordSaving
                                                    }
                                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                            {role.isSystem && (
                                                <span className="rounded-lg bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-500">
                                                    System
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeSection === "taskStatuses" && (
                        <div>
                            <div className="flex justify-end border-b border-slate-200 bg-slate-50/60 px-5 py-4">
                                <button
                                    type="button"
                                    onClick={() =>
                                        openStatusDrawer()
                                    }
                                    className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white"
                                >
                                    <Plus size={15} />
                                    Add Status
                                </button>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {settings.taskStatuses.map(
                                    (status) => (
                                        <div
                                            key={status.id}
                                            className="flex items-center gap-4 px-5 py-4"
                                        >
                                            <GripVertical
                                                size={17}
                                                className="text-slate-300"
                                            />

                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500">
                                                {status.order}
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <button
                                                    type="button"
                                                    disabled={
                                                        recordSaving ||
                                                        status.order === 1
                                                    }
                                                    onClick={() =>
                                                        moveTaskStatus(
                                                            status.id,
                                                            "up"
                                                        )
                                                    }
                                                    className="flex h-6 w-7 items-center justify-center rounded border border-slate-200 text-[10px] text-slate-500 disabled:opacity-30"
                                                >
                                                    ↑
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={
                                                        recordSaving ||
                                                        status.order ===
                                                        settings
                                                            .taskStatuses
                                                            .length
                                                    }
                                                    onClick={() =>
                                                        moveTaskStatus(
                                                            status.id,
                                                            "down"
                                                        )
                                                    }
                                                    className="flex h-6 w-7 items-center justify-center rounded border border-slate-200 text-[10px] text-slate-500 disabled:opacity-30"
                                                >
                                                    ↓
                                                </button>
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span
                                                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${getColorClasses(
                                                            status.color
                                                        )}`}
                                                    >
                                                        {status.name}
                                                    </span>

                                                    {status.isFinal && (
                                                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700">
                                                            Final status
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="mt-2 text-xs text-slate-500">
                                                    {status.description}
                                                </p>
                                            </div>

                                            <StatusBadge
                                                status={status.status}
                                            />

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openStatusDrawer(
                                                        status
                                                    )
                                                }
                                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        toggleRecordStatus(
                                                            "taskStatuses",
                                                            status.id
                                                        )
                                                    }
                                                    disabled={
                                                        recordSaving
                                                    }
                                                    className="h-9 rounded-lg border border-slate-200 px-3 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                                                >
                                                    {status.status ===
                                                        "Active"
                                                        ? "Disable"
                                                        : "Enable"}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openStatusDrawer(
                                                            status
                                                        )
                                                    }
                                                    disabled={
                                                        recordSaving
                                                    }
                                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-50"
                                                >
                                                    <Pencil size={14} />
                                                </button>

                                                {!status.isSystem && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            deleteSettingRecord(
                                                                "taskStatuses",
                                                                status
                                                            )
                                                        }
                                                        disabled={
                                                            recordSaving
                                                        }
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}

                    {activeSection === "priorities" && (
                        <div>
                            <div className="flex justify-end border-b border-slate-200 bg-slate-50/60 px-5 py-4">
                                <button
                                    type="button"
                                    onClick={() =>
                                        openPriorityDrawer()
                                    }
                                    className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white"
                                >
                                    <Plus size={15} />
                                    Add Priority
                                </button>
                            </div>

                            <div className="grid gap-4 p-5 sm:grid-cols-2">
                                {settings.priorities.map(
                                    (priority) => (
                                        <div
                                            key={priority.id}
                                            className="rounded-2xl border border-slate-200 p-5"
                                        >
                                            <div className="flex items-start justify-between">
                                                <span
                                                    className={`rounded-full px-3 py-1.5 text-[10px] font-bold ring-1 ring-inset ${getColorClasses(
                                                        priority.color
                                                    )}`}
                                                >
                                                    {priority.name}
                                                </span>

                                                <StatusBadge
                                                    status={
                                                        priority.status
                                                    }
                                                />
                                            </div>

                                            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Target response
                                            </p>

                                            <p className="mt-2 text-xl font-semibold text-slate-900">
                                                {
                                                    priority.responseHours
                                                }{" "}
                                                hour
                                                {Number(
                                                    priority.responseHours
                                                ) !== 1
                                                    ? "s"
                                                    : ""}
                                            </p>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openPriorityDrawer(
                                                        priority
                                                    )
                                                }
                                                className="mt-5 flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-[10px] font-semibold text-slate-600"
                                            >
                                                <Pencil size={13} />
                                                Edit Priority
                                            </button>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        toggleRecordStatus(
                                                            "priorities",
                                                            priority.id
                                                        )
                                                    }
                                                    disabled={
                                                        recordSaving
                                                    }
                                                    className="h-9 rounded-lg border border-slate-200 px-3 text-[10px] font-semibold text-slate-600 disabled:opacity-50"
                                                >
                                                    {priority.status ===
                                                        "Active"
                                                        ? "Disable"
                                                        : "Enable"}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openPriorityDrawer(
                                                            priority
                                                        )
                                                    }
                                                    disabled={
                                                        recordSaving
                                                    }
                                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-50"
                                                >
                                                    <Pencil size={14} />
                                                </button>

                                                {!priority.isSystem && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            deleteSettingRecord(
                                                                "priorities",
                                                                priority
                                                            )
                                                        }
                                                        disabled={
                                                            recordSaving
                                                        }
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 text-rose-600 disabled:opacity-50"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}

                    {activeSection === "workingHours" && (
                        <div className="p-6">
                            <div className="grid gap-5 lg:grid-cols-2">
                                <div>
                                    <FieldLabel>Office start time</FieldLabel>

                                    <input
                                        type="time"
                                        name="officeStartTime"
                                        value={
                                            settings.workingHours
                                                .officeStartTime
                                        }
                                        onChange={
                                            handleWorkingHoursChange
                                        }
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    />
                                </div>

                                <div>
                                    <FieldLabel>Office end time</FieldLabel>

                                    <input
                                        type="time"
                                        name="officeEndTime"
                                        value={
                                            settings.workingHours
                                                .officeEndTime
                                        }
                                        onChange={
                                            handleWorkingHoursChange
                                        }
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    />
                                </div>

                                <div>
                                    <FieldLabel>
                                        Late after minutes
                                    </FieldLabel>

                                    <input
                                        type="number"
                                        min="0"
                                        name="lateAfterMinutes"
                                        value={
                                            settings.workingHours
                                                .lateAfterMinutes
                                        }
                                        onChange={
                                            handleWorkingHoursChange
                                        }
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    />
                                </div>

                                <div>
                                    <FieldLabel>
                                        Default break minutes
                                    </FieldLabel>

                                    <input
                                        type="number"
                                        min="0"
                                        name="defaultBreakMinutes"
                                        value={
                                            settings.workingHours
                                                .defaultBreakMinutes
                                        }
                                        onChange={
                                            handleWorkingHoursChange
                                        }
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    />
                                </div>

                                <div>
                                    <FieldLabel>Full-day hours</FieldLabel>

                                    <input
                                        type="number"
                                        min="1"
                                        name="fullDayHours"
                                        value={
                                            settings.workingHours
                                                .fullDayHours
                                        }
                                        onChange={
                                            handleWorkingHoursChange
                                        }
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    />
                                </div>

                                <div>
                                    <FieldLabel>Half-day hours</FieldLabel>

                                    <input
                                        type="number"
                                        min="1"
                                        name="halfDayHours"
                                        value={
                                            settings.workingHours
                                                .halfDayHours
                                        }
                                        onChange={
                                            handleWorkingHoursChange
                                        }
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    />
                                </div>
                            </div>

                            <div className="mt-6">
                                <FieldLabel>Weekly off days</FieldLabel>

                                <div className="flex flex-wrap gap-2">
                                    {[
                                        "Monday",
                                        "Tuesday",
                                        "Wednesday",
                                        "Thursday",
                                        "Friday",
                                        "Saturday",
                                        "Sunday",
                                    ].map((day) => {
                                        const active =
                                            settings.workingHours.weeklyOff.includes(
                                                day
                                            );

                                        return (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() =>
                                                    toggleWeeklyOff(day)
                                                }
                                                className={`rounded-xl border px-3 py-2 text-[10px] font-semibold transition ${active
                                                    ? "border-violet-200 bg-violet-50 text-violet-700"
                                                    : "border-slate-200 bg-white text-slate-500"
                                                    }`}
                                            >
                                                {day}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-800">
                                            Automatically mark absent
                                        </p>

                                        <p className="mt-1 text-[10px] text-slate-500">
                                            Mark employees absent when no
                                            login is recorded.
                                        </p>
                                    </div>

                                    <Toggle
                                        enabled={
                                            settings.workingHours
                                                .autoMarkAbsent
                                        }
                                        onChange={(enabled) =>
                                            setSettings(
                                                (current) => ({
                                                    ...current,
                                                    workingHours: {
                                                        ...current.workingHours,
                                                        autoMarkAbsent:
                                                            enabled,
                                                    },
                                                })
                                            )
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-3">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-800">
                                            Allow manual corrections
                                        </p>

                                        <p className="mt-1 text-[10px] text-slate-500">
                                            Administrators can correct
                                            login and logout records.
                                        </p>
                                    </div>

                                    <Toggle
                                        enabled={
                                            settings.workingHours
                                                .allowManualCorrection
                                        }
                                        onChange={(enabled) =>
                                            setSettings(
                                                (current) => ({
                                                    ...current,
                                                    workingHours: {
                                                        ...current.workingHours,
                                                        allowManualCorrection:
                                                            enabled,
                                                    },
                                                })
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === "leaveTypes" && (
                        <div>
                            <div className="flex justify-end border-b border-slate-200 bg-slate-50/60 px-5 py-4">
                                <button
                                    type="button"
                                    onClick={() =>
                                        openLeaveTypeDrawer()
                                    }
                                    className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white"
                                >
                                    <Plus size={15} />
                                    Add Leave Type
                                </button>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {settings.leaveTypes.map(
                                    (leaveType) => (
                                        <div
                                            key={leaveType.id}
                                            className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center"
                                        >
                                            <div className="flex min-w-0 flex-1 items-start gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                                    <Users size={19} />
                                                </div>

                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="text-sm font-semibold text-slate-900">
                                                            {
                                                                leaveType.name
                                                            }
                                                        </p>

                                                        <span className="rounded-lg bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-600">
                                                            {
                                                                leaveType.code
                                                            }
                                                        </span>

                                                        <StatusBadge
                                                            status={
                                                                leaveType.status
                                                            }
                                                        />
                                                    </div>

                                                    <p className="mt-2 text-xs text-slate-500">
                                                        Annual limit:{" "}
                                                        {leaveType.yearlyLimit >
                                                            0
                                                            ? `${leaveType.yearlyLimit} days`
                                                            : "No fixed limit"}
                                                        {" · "}
                                                        {leaveType.paid
                                                            ? "Paid"
                                                            : "Unpaid"}
                                                        {" · "}
                                                        {leaveType.carryForward
                                                            ? "Carry forward allowed"
                                                            : "No carry forward"}
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openLeaveTypeDrawer(
                                                        leaveType
                                                    )
                                                }
                                                className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-[10px] font-semibold text-slate-600"
                                            >
                                                <Pencil size={13} />
                                                Edit
                                            </button>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        toggleRecordStatus(
                                                            "leaveTypes",
                                                            leaveType.id
                                                        )
                                                    }
                                                    disabled={
                                                        recordSaving
                                                    }
                                                    className="h-9 rounded-lg border border-slate-200 px-3 text-[10px] font-semibold text-slate-600 disabled:opacity-50"
                                                >
                                                    {leaveType.status ===
                                                        "Active"
                                                        ? "Disable"
                                                        : "Enable"}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openLeaveTypeDrawer(
                                                            leaveType
                                                        )
                                                    }
                                                    disabled={
                                                        recordSaving
                                                    }
                                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-50"
                                                >
                                                    <Pencil size={14} />
                                                </button>

                                                {!leaveType.isSystem && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            deleteSettingRecord(
                                                                "leaveTypes",
                                                                leaveType
                                                            )
                                                        }
                                                        disabled={
                                                            recordSaving
                                                        }
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 text-rose-600 disabled:opacity-50"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}

                    {activeSection === "notifications" && (
                        <div className="p-6">
                            <div className="overflow-hidden rounded-2xl border border-slate-200">
                                <div className="grid grid-cols-[minmax(0,1fr)_80px_80px_80px] border-b border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        Event
                                    </p>

                                    <div className="flex justify-center">
                                        <BellRing
                                            size={14}
                                            className="text-slate-400"
                                        />
                                    </div>

                                    <div className="flex justify-center">
                                        <Mail
                                            size={14}
                                            className="text-slate-400"
                                        />
                                    </div>

                                    <div className="flex justify-center">
                                        <Smartphone
                                            size={14}
                                            className="text-slate-400"
                                        />
                                    </div>
                                </div>

                                {[
                                    {
                                        key: "newTicket",
                                        label: "New support ticket",
                                    },
                                    {
                                        key: "taskAssigned",
                                        label: "Task assigned",
                                    },
                                    {
                                        key: "taskOverdue",
                                        label: "Task becomes overdue",
                                    },
                                    {
                                        key: "leaveRequest",
                                        label: "New leave request",
                                    },
                                    {
                                        key: "amcDue",
                                        label: "AMC renewal due",
                                    },
                                    {
                                        key: "employeeLate",
                                        label: "Employee late arrival",
                                    },
                                ].map((item) => (
                                    <div
                                        key={item.key}
                                        className="grid grid-cols-[minmax(0,1fr)_80px_80px_80px] items-center border-b border-slate-100 px-4 py-4 last:border-b-0"
                                    >
                                        <p className="text-xs font-semibold text-slate-700">
                                            {item.label}
                                        </p>

                                        {[
                                            "inApp",
                                            "email",
                                            "mobile",
                                        ].map((channel) => (
                                            <div
                                                key={channel}
                                                className="flex justify-center"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        settings
                                                            .notifications[
                                                        item.key
                                                        ][channel]
                                                    }
                                                    onChange={(event) =>
                                                        updateNotificationChannel(
                                                            item.key,
                                                            channel,
                                                            event
                                                                .target
                                                                .checked
                                                        )
                                                    }
                                                    className="h-4 w-4 accent-violet-600"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 grid gap-5 lg:grid-cols-2">
                                <div>
                                    <FieldLabel>
                                        AMC reminder before due date
                                    </FieldLabel>

                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            value={
                                                settings.notifications
                                                    .amcReminderDays
                                            }
                                            onChange={(event) =>
                                                updateNotificationValue(
                                                    "amcReminderDays",
                                                    Number(
                                                        event.target
                                                            .value
                                                    )
                                                )
                                            }
                                            className="h-11 w-full rounded-xl border border-slate-200 px-3 pr-16 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        />

                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                                            days
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <FieldLabel>
                                        Task due reminder
                                    </FieldLabel>

                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            value={
                                                settings.notifications
                                                    .taskDueReminderHours
                                            }
                                            onChange={(event) =>
                                                updateNotificationValue(
                                                    "taskDueReminderHours",
                                                    Number(
                                                        event.target
                                                            .value
                                                    )
                                                )
                                            }
                                            className="h-11 w-full rounded-xl border border-slate-200 px-3 pr-16 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        />

                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                                            hours
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                                <div>
                                    <p className="text-xs font-semibold text-slate-800">
                                        Daily management summary
                                    </p>

                                    <p className="mt-1 text-[10px] text-slate-500">
                                        Send daily attendance, task and
                                        ticket summary to the administrator.
                                    </p>
                                </div>

                                <Toggle
                                    enabled={
                                        settings.notifications
                                            .dailySummaryEnabled
                                    }
                                    onChange={(enabled) =>
                                        updateNotificationValue(
                                            "dailySummaryEnabled",
                                            enabled
                                        )
                                    }
                                />
                            </div>
                        </div>
                    )}
                </section>
            </div>

            {drawerType === "product" && (
                <SettingsDrawer
                    title={
                        productForm.id
                            ? "Edit Product"
                            : "Add Product"
                    }
                    description="Configure a software product sold and supported by your company."
                    onClose={closeDrawer}
                    onSubmit={saveProduct}
                    submitLabel={
                        productSaving
                            ? "Saving..."
                            : productForm.id
                                ? "Update Product"
                                : "Create Product"
                    }
                >
                    {productFormError && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                            <p className="text-xs font-semibold text-rose-700">
                                {productFormError}
                            </p>
                        </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <FieldLabel required>
                                Product code
                            </FieldLabel>

                            <input
                                value={
                                    productForm.productCode
                                }
                                onChange={(event) =>
                                    setProductForm(
                                        (current) => ({
                                            ...current,

                                            productCode:
                                                event.target.value.toUpperCase(),
                                        })
                                    )
                                }
                                placeholder="PRD-006"
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs uppercase outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                            />
                        </div>

                        <div>
                            <FieldLabel required>
                                Product name
                            </FieldLabel>

                            <input
                                value={
                                    productForm.productName
                                }
                                onChange={(event) =>
                                    setProductForm(
                                        (current) => ({
                                            ...current,

                                            productName:
                                                event.target.value,
                                        })
                                    )
                                }
                                placeholder="Product name"
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <FieldLabel>
                                Category
                            </FieldLabel>

                            <input
                                value={
                                    productForm.category
                                }
                                onChange={(event) =>
                                    setProductForm(
                                        (current) => ({
                                            ...current,

                                            category:
                                                event.target.value,
                                        })
                                    )
                                }
                                placeholder="ERP, Billing, POS..."
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                            />
                        </div>

                        <div>
                            <FieldLabel>
                                Current version
                            </FieldLabel>

                            <input
                                value={
                                    productForm.currentVersion
                                }
                                onChange={(event) =>
                                    setProductForm(
                                        (current) => ({
                                            ...current,

                                            currentVersion:
                                                event.target.value,
                                        })
                                    )
                                }
                                placeholder="v1.0.0"
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <FieldLabel>
                                Platform
                            </FieldLabel>

                            <select
                                value={
                                    productForm.platform
                                }
                                onChange={(event) =>
                                    setProductForm(
                                        (current) => ({
                                            ...current,

                                            platform:
                                                event.target.value,
                                        })
                                    )
                                }
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                            >
                                <option>Web</option>
                                <option>Desktop</option>
                                <option>Mobile</option>
                                <option>
                                    Web + Mobile
                                </option>
                                <option>
                                    Desktop + Mobile
                                </option>
                                <option>
                                    Web + Desktop
                                </option>
                                <option>
                                    Web + Desktop + Mobile
                                </option>
                                <option>Other</option>
                            </select>
                        </div>

                        <div>
                            <FieldLabel>
                                Release date
                            </FieldLabel>

                            <input
                                type="date"
                                value={
                                    productForm.releaseDate
                                }
                                onChange={(event) =>
                                    setProductForm(
                                        (current) => ({
                                            ...current,

                                            releaseDate:
                                                event.target.value,
                                        })
                                    )
                                }
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                            />
                        </div>
                    </div>

                    <div>
                        <FieldLabel>
                            Description
                        </FieldLabel>

                        <textarea
                            value={
                                productForm.description
                            }
                            onChange={(event) =>
                                setProductForm(
                                    (current) => ({
                                        ...current,

                                        description:
                                            event.target.value,
                                    })
                                )
                            }
                            rows={5}
                            placeholder="Describe the product, purpose and supported modules."
                            className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                        />
                    </div>

                    <div>
                        <FieldLabel>
                            Status
                        </FieldLabel>

                        <select
                            value={
                                productForm.status
                            }
                            onChange={(event) =>
                                setProductForm(
                                    (current) => ({
                                        ...current,

                                        status:
                                            event.target.value,
                                    })
                                )
                            }
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                        >
                            <option>Active</option>
                            <option>Inactive</option>
                            <option>Deprecated</option>
                        </select>
                    </div>
                </SettingsDrawer>
            )}
            {drawerType === "project" && (
                <SettingsDrawer
                    title={
                        projectForm.id
                            ? "Edit Project"
                            : "Add Project"
                    }
                    description="Configure development, client implementation or internal work."
                    onClose={closeDrawer}
                    onSubmit={saveProject}
                    submitLabel={
                        projectSaving
                            ? "Saving..."
                            : projectForm.id
                                ? "Update Project"
                                : "Create Project"
                    }
                >
                    {projectFormError && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                            <p className="text-xs font-semibold text-rose-700">
                                {projectFormError}
                            </p>
                        </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <FieldLabel required>
                                Project code
                            </FieldLabel>

                            <input
                                value={
                                    projectForm.projectCode
                                }
                                onChange={(event) =>
                                    setProjectForm(
                                        (current) => ({
                                            ...current,

                                            projectCode:
                                                event.target.value.toUpperCase(),
                                        })
                                    )
                                }
                                placeholder="PROJ-001"
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs uppercase outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                            />
                        </div>

                        <div>
                            <FieldLabel required>
                                Project name
                            </FieldLabel>

                            <input
                                value={
                                    projectForm.projectName
                                }
                                onChange={(event) =>
                                    setProjectForm(
                                        (current) => ({
                                            ...current,

                                            projectName:
                                                event.target.value,
                                        })
                                    )
                                }
                                placeholder="NexERP GST Module Upgrade"
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                            />
                        </div>
                    </div>

                    <div>
                        <FieldLabel>
                            Project type
                        </FieldLabel>

                        <select
                            value={
                                projectForm.projectType
                            }
                            onChange={(event) =>
                                setProjectForm(
                                    (current) => ({
                                        ...current,

                                        projectType:
                                            event.target.value,
                                    })
                                )
                            }
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                        >
                            <option>
                                Product Development
                            </option>
                            <option>
                                Client Implementation
                            </option>
                            <option>
                                Internal Development
                            </option>
                            <option>
                                Maintenance
                            </option>
                            <option>
                                Upgrade
                            </option>
                            <option>
                                Customization
                            </option>
                            <option>
                                Research
                            </option>
                            <option>
                                Other
                            </option>
                        </select>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <FieldLabel>
                                Related product
                            </FieldLabel>

                            <select
                                value={
                                    projectForm.productId
                                }
                                onChange={(event) => {
                                    const product =
                                        products.find(
                                            (item) =>
                                                String(
                                                    item.id
                                                ) ===
                                                String(
                                                    event.target.value
                                                )
                                        );

                                    setProjectForm(
                                        (current) => ({
                                            ...current,

                                            productId:
                                                product?.id ||
                                                "",

                                            productCode:
                                                product?.productCode ||
                                                "",

                                            productName:
                                                product?.productName ||
                                                "",
                                        })
                                    );
                                }}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                            >
                                <option value="">
                                    No related product
                                </option>

                                {products
                                    .filter(
                                        (product) =>
                                            product.status ===
                                            "Active"
                                    )
                                    .map(
                                        (product) => (
                                            <option
                                                key={
                                                    product.id
                                                }
                                                value={
                                                    product.id
                                                }
                                            >
                                                {
                                                    product.productName
                                                }
                                                {" — "}
                                                {
                                                    product.productCode
                                                }
                                            </option>
                                        )
                                    )}
                            </select>
                        </div>

                        <div>
                            <FieldLabel>
                                Related client
                            </FieldLabel>

                            <select
                                value={
                                    projectForm.clientId
                                }
                                disabled={
                                    clientsLoading
                                }
                                onChange={(event) => {
                                    const client =
                                        clients.find(
                                            (item) =>
                                                String(
                                                    item.id
                                                ) ===
                                                String(
                                                    event.target.value
                                                )
                                        );

                                    setProjectForm(
                                        (current) => ({
                                            ...current,

                                            clientId:
                                                client?.id ||
                                                "",

                                            clientCode:
                                                client?.clientCode ||
                                                "",

                                            clientName:
                                                client?.companyName ||
                                                "",
                                        })
                                    );
                                }}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-50"
                            >
                                <option value="">
                                    {clientsLoading
                                        ? "Loading clients..."
                                        : "Internal / No client"}
                                </option>

                                {clients.map(
                                    (client) => (
                                        <option
                                            key={
                                                client.id
                                            }
                                            value={
                                                client.id
                                            }
                                        >
                                            {
                                                client.companyName
                                            }
                                            {client.clientCode
                                                ? ` — ${client.clientCode}`
                                                : ""}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <FieldLabel>
                                Start date
                            </FieldLabel>

                            <input
                                type="date"
                                value={
                                    projectForm.startDate
                                }
                                onChange={(event) =>
                                    setProjectForm(
                                        (current) => ({
                                            ...current,

                                            startDate:
                                                event.target.value,
                                        })
                                    )
                                }
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                            />
                        </div>

                        <div>
                            <FieldLabel>
                                Due date
                            </FieldLabel>

                            <input
                                type="date"
                                min={
                                    projectForm.startDate ||
                                    undefined
                                }
                                value={
                                    projectForm.dueDate
                                }
                                onChange={(event) =>
                                    setProjectForm(
                                        (current) => ({
                                            ...current,

                                            dueDate:
                                                event.target.value,
                                        })
                                    )
                                }
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <FieldLabel>
                                Priority
                            </FieldLabel>

                            <select
                                value={
                                    projectForm.priority
                                }
                                onChange={(event) =>
                                    setProjectForm(
                                        (current) => ({
                                            ...current,

                                            priority:
                                                event.target.value,
                                        })
                                    )
                                }
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none"
                            >
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                                <option>Critical</option>
                            </select>
                        </div>

                        <div>
                            <FieldLabel>
                                Status
                            </FieldLabel>

                            <select
                                value={
                                    projectForm.status
                                }
                                onChange={(event) =>
                                    setProjectForm(
                                        (current) => ({
                                            ...current,

                                            status:
                                                event.target.value,

                                            progress:
                                                event.target.value ===
                                                    "Completed"
                                                    ? 100
                                                    : current.progress,
                                        })
                                    )
                                }
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none"
                            >
                                <option>Planned</option>
                                <option>Active</option>
                                <option>On Hold</option>
                                <option>Completed</option>
                                <option>Cancelled</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between">
                            <FieldLabel>
                                Progress
                            </FieldLabel>

                            <span className="text-xs font-bold text-violet-700">
                                {
                                    projectForm.progress
                                }
                                %
                            </span>
                        </div>

                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            disabled={
                                projectForm.status ===
                                "Completed"
                            }
                            value={
                                projectForm.progress
                            }
                            onChange={(event) =>
                                setProjectForm(
                                    (current) => ({
                                        ...current,

                                        progress:
                                            Number(
                                                event.target.value
                                            ),
                                    })
                                )
                            }
                            className="w-full accent-violet-600"
                        />
                    </div>

                    <div>
                        <FieldLabel>
                            Description
                        </FieldLabel>

                        <textarea
                            value={
                                projectForm.description
                            }
                            onChange={(event) =>
                                setProjectForm(
                                    (current) => ({
                                        ...current,

                                        description:
                                            event.target.value,
                                    })
                                )
                            }
                            rows={5}
                            placeholder="Describe the project scope, objective and expected result."
                            className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                        />
                    </div>
                </SettingsDrawer>
            )}

            {drawerType === "role" && (
                <SettingsDrawer
                    title={
                        roleForm.id
                            ? "Edit Role"
                            : "Add Role"
                    }
                    description="Configure role access and permissions."
                    onClose={closeDrawer}
                    onSubmit={saveRole}
                    submitLabel={
                        roleForm.id
                            ? "Update Role"
                            : "Create Role"
                    }
                    submitting={recordSaving}
                >
                    <div>
                        <FieldLabel required>Role name</FieldLabel>

                        <input
                            value={roleForm.name}
                            onChange={(event) =>
                                setRoleForm((current) => ({
                                    ...current,
                                    name: event.target.value,
                                }))
                            }
                            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                        />
                    </div>

                    <div>
                        <FieldLabel>Description</FieldLabel>

                        <textarea
                            value={roleForm.description}
                            onChange={(event) =>
                                setRoleForm((current) => ({
                                    ...current,
                                    description: event.target.value,
                                }))
                            }
                            rows={4}
                            className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                        />
                    </div>

                    <div>
                        <FieldLabel required>Permissions</FieldLabel>

                        <div className="grid gap-2 sm:grid-cols-2">
                            {permissionOptions.map((permission) => (
                                <label
                                    key={permission}
                                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${roleForm.permissions.includes(
                                        permission
                                    )
                                        ? "border-violet-200 bg-violet-50"
                                        : "border-slate-200"
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={roleForm.permissions.includes(
                                            permission
                                        )}
                                        onChange={() =>
                                            togglePermission(permission)
                                        }
                                        className="h-4 w-4 accent-violet-600"
                                    />

                                    <span className="text-xs font-semibold text-slate-700">
                                        {permission}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </SettingsDrawer>
            )}

            {drawerType === "status" && (
                <SettingsDrawer
                    title={
                        statusForm.id
                            ? "Edit Task Status"
                            : "Add Task Status"
                    }
                    description="Configure a stage in the task workflow."
                    onClose={closeDrawer}
                    onSubmit={saveTaskStatus}
                >
                    <div>
                        <FieldLabel required>Status name</FieldLabel>

                        <input
                            value={statusForm.name}
                            onChange={(event) =>
                                setStatusForm((current) => ({
                                    ...current,
                                    name: event.target.value,
                                }))
                            }
                            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                        />
                    </div>

                    <div>
                        <FieldLabel>Description</FieldLabel>

                        <textarea
                            value={statusForm.description}
                            onChange={(event) =>
                                setStatusForm((current) => ({
                                    ...current,
                                    description: event.target.value,
                                }))
                            }
                            rows={4}
                            className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <FieldLabel>Color</FieldLabel>

                            <select
                                value={statusForm.color}
                                onChange={(event) =>
                                    setStatusForm((current) => ({
                                        ...current,
                                        color: event.target.value,
                                    }))
                                }
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none"
                            >
                                {[
                                    "Slate",
                                    "Violet",
                                    "Blue",
                                    "Emerald",
                                    "Amber",
                                    "Orange",
                                    "Rose",
                                ].map((color) => (
                                    <option key={color}>{color}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <FieldLabel>Workflow order</FieldLabel>

                            <input
                                type="number"
                                min="1"
                                value={statusForm.order}
                                onChange={(event) =>
                                    setStatusForm((current) => ({
                                        ...current,
                                        order: Number(
                                            event.target.value
                                        ),
                                    }))
                                }
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none"
                            />
                        </div>
                    </div>

                    <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
                        <input
                            type="checkbox"
                            checked={statusForm.isFinal}
                            onChange={(event) =>
                                setStatusForm((current) => ({
                                    ...current,
                                    isFinal: event.target.checked,
                                }))
                            }
                            className="h-4 w-4 accent-violet-600"
                        />

                        <div>
                            <p className="text-xs font-semibold text-slate-700">
                                Final workflow status
                            </p>

                            <p className="mt-1 text-[10px] text-slate-500">
                                Tasks in this status are treated as
                                completed.
                            </p>
                        </div>
                    </label>
                </SettingsDrawer>
            )}

            {drawerType === "priority" && (
                <SettingsDrawer
                    title={
                        priorityForm.id
                            ? "Edit Priority"
                            : "Add Priority"
                    }
                    description="Configure priority response time and display."
                    onClose={closeDrawer}
                    onSubmit={savePriority}
                >
                    <div>
                        <FieldLabel required>Priority name</FieldLabel>

                        <input
                            value={priorityForm.name}
                            onChange={(event) =>
                                setPriorityForm((current) => ({
                                    ...current,
                                    name: event.target.value,
                                }))
                            }
                            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none"
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <FieldLabel>
                                Response time in hours
                            </FieldLabel>

                            <input
                                type="number"
                                min="1"
                                value={priorityForm.responseHours}
                                onChange={(event) =>
                                    setPriorityForm((current) => ({
                                        ...current,
                                        responseHours: Number(
                                            event.target.value
                                        ),
                                    }))
                                }
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none"
                            />
                        </div>

                        <div>
                            <FieldLabel>Color</FieldLabel>

                            <select
                                value={priorityForm.color}
                                onChange={(event) =>
                                    setPriorityForm((current) => ({
                                        ...current,
                                        color: event.target.value,
                                    }))
                                }
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none"
                            >
                                {[
                                    "Slate",
                                    "Violet",
                                    "Blue",
                                    "Emerald",
                                    "Amber",
                                    "Orange",
                                    "Rose",
                                ].map((color) => (
                                    <option key={color}>{color}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </SettingsDrawer>
            )}

            {drawerType === "leaveType" && (
                <SettingsDrawer
                    title={
                        leaveTypeForm.id
                            ? "Edit Leave Type"
                            : "Add Leave Type"
                    }
                    description="Configure leave allowance and policy rules."
                    onClose={closeDrawer}
                    onSubmit={saveLeaveType}
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <FieldLabel required>
                                Leave name
                            </FieldLabel>

                            <input
                                value={leaveTypeForm.name}
                                onChange={(event) =>
                                    setLeaveTypeForm((current) => ({
                                        ...current,
                                        name: event.target.value,
                                    }))
                                }
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none"
                            />
                        </div>

                        <div>
                            <FieldLabel required>
                                Leave code
                            </FieldLabel>

                            <input
                                value={leaveTypeForm.code}
                                onChange={(event) =>
                                    setLeaveTypeForm((current) => ({
                                        ...current,
                                        code: event.target.value,
                                    }))
                                }
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs uppercase outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <FieldLabel>Yearly limit</FieldLabel>

                        <input
                            type="number"
                            min="0"
                            value={leaveTypeForm.yearlyLimit}
                            onChange={(event) =>
                                setLeaveTypeForm((current) => ({
                                    ...current,
                                    yearlyLimit: Number(
                                        event.target.value
                                    ),
                                }))
                            }
                            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none"
                        />
                    </div>

                    {[
                        {
                            key: "paid",
                            title: "Paid leave",
                            description:
                                "Salary is not deducted for this leave.",
                        },
                        {
                            key: "carryForward",
                            title: "Allow carry forward",
                            description:
                                "Unused balance is carried into the next year.",
                        },
                        {
                            key: "requiresDocument",
                            title: "Require supporting document",
                            description:
                                "Employee must attach a document.",
                        },
                    ].map((option) => (
                        <div
                            key={option.key}
                            className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
                        >
                            <div>
                                <p className="text-xs font-semibold text-slate-700">
                                    {option.title}
                                </p>

                                <p className="mt-1 text-[10px] text-slate-500">
                                    {option.description}
                                </p>
                            </div>

                            <Toggle
                                enabled={leaveTypeForm[option.key]}
                                onChange={(enabled) =>
                                    setLeaveTypeForm((current) => ({
                                        ...current,
                                        [option.key]: enabled,
                                    }))
                                }
                            />
                        </div>
                    ))}
                </SettingsDrawer>
            )}
        </div>
    );
}
