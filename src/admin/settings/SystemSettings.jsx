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

const SETTINGS_STORAGE_KEY = "client-connect-system-settings";

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

    projects: [
        {
            id: 1,
            code: "PRJ-001",
            name: "NexERP",
            category: "ERP",
            description: "Enterprise resource planning and billing software.",
            status: "Active",
        },
        {
            id: 2,
            code: "PRJ-002",
            name: "BillFlow",
            category: "Billing",
            description: "Billing, invoicing and customer account software.",
            status: "Active",
        },
        {
            id: 3,
            code: "PRJ-003",
            name: "StockPro",
            category: "Inventory",
            description: "Stock, batch and warehouse management software.",
            status: "Active",
        },
        {
            id: 4,
            code: "PRJ-004",
            name: "RetailPOS",
            category: "POS",
            description: "Retail billing and point-of-sale software.",
            status: "Active",
        },
        {
            id: 5,
            code: "PRJ-005",
            name: "PayrollIX",
            category: "Payroll",
            description: "Employee payroll and salary management.",
            status: "Active",
        },
    ],

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
        id: "projects",
        label: "Projects",
        description: "Software products and projects",
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

const emptyProject = {
    id: null,
    code: "",
    name: "",
    category: "",
    description: "",
    status: "Active",
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
        const storedValue = localStorage.getItem(SETTINGS_STORAGE_KEY);

        if (!storedValue) {
            return cloneDefaultSettings();
        }

        const parsedValue = JSON.parse(storedValue);

        return {
            ...cloneDefaultSettings(),
            ...parsedValue,
            company: {
                ...defaultSettings.company,
                ...(parsedValue.company || {}),
            },
            workingHours: {
                ...defaultSettings.workingHours,
                ...(parsedValue.workingHours || {}),
            },
            notifications: {
                ...defaultSettings.notifications,
                ...(parsedValue.notifications || {}),
            },
        };
    } catch (error) {
        console.error("Unable to read settings:", error);
        return cloneDefaultSettings();
    }
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
    const active = status === "Active";

    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${
                active
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/10"
                    : "bg-slate-100 text-slate-500 ring-slate-500/10"
            }`}
        >
            {status}
        </span>
    );
}

function Toggle({ enabled, onChange, disabled = false }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(!enabled)}
            className={`relative h-6 w-11 rounded-full transition ${
                enabled ? "bg-violet-600" : "bg-slate-200"
            } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        >
            <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                    enabled ? "left-6" : "left-1"
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
}) {
    return (
        <>
            <button
                type="button"
                aria-label="Close drawer"
                onClick={onClose}
                className="fixed inset-0 z-[80] bg-slate-950/40 backdrop-blur-[2px]"
            />

            <aside className="fixed inset-y-0 right-0 z-[90] flex w-full max-w-[580px] flex-col bg-white shadow-[-24px_0_70px_rgba(15,23,42,0.22)]">
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
                            className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white transition hover:bg-violet-700"
                        >
                            <Save size={15} />
                            {submitLabel}
                        </button>
                    </div>
                </form>
            </aside>
        </>
    );
}

export default function SystemSettings() {
    const [activeSection, setActiveSection] = useState("company");
    const [settings, setSettings] = useState(readStoredSettings);
    const [savedMessage, setSavedMessage] = useState("");

    const [drawerType, setDrawerType] = useState("");
    const [projectForm, setProjectForm] = useState(emptyProject);
    const [roleForm, setRoleForm] = useState(emptyRole);
    const [statusForm, setStatusForm] = useState(emptyStatus);
    const [priorityForm, setPriorityForm] = useState(emptyPriority);
    const [leaveTypeForm, setLeaveTypeForm] = useState(emptyLeaveType);

    useEffect(() => {
        localStorage.setItem(
            SETTINGS_STORAGE_KEY,
            JSON.stringify(settings)
        );
    }, [settings]);

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

    const saveSection = () => {
        localStorage.setItem(
            SETTINGS_STORAGE_KEY,
            JSON.stringify(settings)
        );

        showSavedMessage(`${activeNavigation.label} settings saved.`);
    };

    const closeDrawer = () => {
        setDrawerType("");
        setProjectForm(emptyProject);
        setRoleForm(emptyRole);
        setStatusForm(emptyStatus);
        setPriorityForm(emptyPriority);
        setLeaveTypeForm(emptyLeaveType);
    };

    const openProjectDrawer = (project = null) => {
        setProjectForm(project ? { ...project } : { ...emptyProject });
        setDrawerType("project");
    };

    const saveProject = (event) => {
        event.preventDefault();

        if (!projectForm.code.trim() || !projectForm.name.trim()) {
            alert("Project code and project name are required.");
            return;
        }

        const duplicate = settings.projects.some(
            (project) =>
                project.id !== projectForm.id &&
                (project.code.toLowerCase() ===
                    projectForm.code.trim().toLowerCase() ||
                    project.name.toLowerCase() ===
                        projectForm.name.trim().toLowerCase())
        );

        if (duplicate) {
            alert("A project with the same code or name already exists.");
            return;
        }

        setSettings((current) => ({
            ...current,
            projects: projectForm.id
                ? current.projects.map((project) =>
                      project.id === projectForm.id
                          ? {
                                ...projectForm,
                                code: projectForm.code.trim(),
                                name: projectForm.name.trim(),
                            }
                          : project
                  )
                : [
                      ...current.projects,
                      {
                          ...projectForm,
                          id: Date.now(),
                          code: projectForm.code.trim(),
                          name: projectForm.name.trim(),
                      },
                  ],
        }));

        closeDrawer();
        showSavedMessage("Project saved.");
    };

    const deleteProject = (projectId) => {
        const project = settings.projects.find(
            (item) => item.id === projectId
        );

        if (!project) return;

        const confirmed = window.confirm(
            `Delete project "${project.name}"?`
        );

        if (!confirmed) return;

        setSettings((current) => ({
            ...current,
            projects: current.projects.filter(
                (item) => item.id !== projectId
            ),
        }));
    };

    const openRoleDrawer = (role = null) => {
        setRoleForm(role ? { ...role } : { ...emptyRole });
        setDrawerType("role");
    };

    const saveRole = (event) => {
        event.preventDefault();

        if (!roleForm.name.trim()) {
            alert("Role name is required.");
            return;
        }

        if (roleForm.permissions.length === 0) {
            alert("Select at least one permission.");
            return;
        }

        setSettings((current) => ({
            ...current,
            roles: roleForm.id
                ? current.roles.map((role) =>
                      role.id === roleForm.id
                          ? {
                                ...roleForm,
                                name: roleForm.name.trim(),
                            }
                          : role
                  )
                : [
                      ...current.roles,
                      {
                          ...roleForm,
                          id: Date.now(),
                          name: roleForm.name.trim(),
                      },
                  ],
        }));

        closeDrawer();
        showSavedMessage("Role saved.");
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

    const saveTaskStatus = (event) => {
        event.preventDefault();

        if (!statusForm.name.trim()) {
            alert("Status name is required.");
            return;
        }

        setSettings((current) => ({
            ...current,
            taskStatuses: (
                statusForm.id
                    ? current.taskStatuses.map((status) =>
                          status.id === statusForm.id
                              ? {
                                    ...statusForm,
                                    name: statusForm.name.trim(),
                                }
                              : status
                      )
                    : [
                          ...current.taskStatuses,
                          {
                              ...statusForm,
                              id: Date.now(),
                              name: statusForm.name.trim(),
                          },
                      ]
            ).sort((a, b) => Number(a.order) - Number(b.order)),
        }));

        closeDrawer();
        showSavedMessage("Task status saved.");
    };

    const openPriorityDrawer = (priority = null) => {
        setPriorityForm(
            priority ? { ...priority } : { ...emptyPriority }
        );
        setDrawerType("priority");
    };

    const savePriority = (event) => {
        event.preventDefault();

        if (!priorityForm.name.trim()) {
            alert("Priority name is required.");
            return;
        }

        setSettings((current) => ({
            ...current,
            priorities: priorityForm.id
                ? current.priorities.map((priority) =>
                      priority.id === priorityForm.id
                          ? {
                                ...priorityForm,
                                name: priorityForm.name.trim(),
                            }
                          : priority
                  )
                : [
                      ...current.priorities,
                      {
                          ...priorityForm,
                          id: Date.now(),
                          name: priorityForm.name.trim(),
                      },
                  ],
        }));

        closeDrawer();
        showSavedMessage("Priority saved.");
    };

    const openLeaveTypeDrawer = (leaveType = null) => {
        setLeaveTypeForm(
            leaveType ? { ...leaveType } : { ...emptyLeaveType }
        );
        setDrawerType("leaveType");
    };

    const saveLeaveType = (event) => {
        event.preventDefault();

        if (
            !leaveTypeForm.name.trim() ||
            !leaveTypeForm.code.trim()
        ) {
            alert("Leave name and leave code are required.");
            return;
        }

        setSettings((current) => ({
            ...current,
            leaveTypes: leaveTypeForm.id
                ? current.leaveTypes.map((leaveType) =>
                      leaveType.id === leaveTypeForm.id
                          ? {
                                ...leaveTypeForm,
                                name: leaveTypeForm.name.trim(),
                                code: leaveTypeForm.code
                                    .trim()
                                    .toUpperCase(),
                            }
                          : leaveType
                  )
                : [
                      ...current.leaveTypes,
                      {
                          ...leaveTypeForm,
                          id: Date.now(),
                          name: leaveTypeForm.name.trim(),
                          code: leaveTypeForm.code
                              .trim()
                              .toUpperCase(),
                      },
                  ],
        }));

        closeDrawer();
        showSavedMessage("Leave type saved.");
    };

    const toggleRecordStatus = (collectionName, recordId) => {
        setSettings((current) => ({
            ...current,
            [collectionName]: current[collectionName].map((record) =>
                record.id === recordId
                    ? {
                          ...record,
                          status:
                              record.status === "Active"
                                  ? "Inactive"
                                  : "Active",
                      }
                    : record
            ),
        }));
    };

    return (
        <div>
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
                        Management
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                        System Settings
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                        Configure your workspace, projects, workflow,
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

                    <button
                        type="button"
                        onClick={saveSection}
                        className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white transition hover:bg-violet-700"
                    >
                        <Save size={15} />
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
                <aside className="h-fit overflow-hidden rounded-2xl border border-slate-200 bg-white">
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
                                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                                        active
                                            ? "bg-violet-50 text-violet-700"
                                            : "text-slate-600 hover:bg-slate-50"
                                    }`}
                                >
                                    <div
                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                            active
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
                                            className={`mt-1 truncate text-[9px] ${
                                                active
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

                <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
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

                    {activeSection === "projects" && (
                        <div>
                            <div className="flex justify-end border-b border-slate-200 bg-slate-50/60 px-5 py-4">
                                <button
                                    type="button"
                                    onClick={() =>
                                        openProjectDrawer()
                                    }
                                    className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white"
                                >
                                    <Plus size={15} />
                                    Add Project
                                </button>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {settings.projects.map((project) => (
                                    <div
                                        key={project.id}
                                        className="flex flex-col gap-4 px-5 py-5 transition hover:bg-slate-50/70 md:flex-row md:items-center"
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
                                                        {project.name}
                                                    </p>

                                                    <StatusBadge
                                                        status={
                                                            project.status
                                                        }
                                                    />
                                                </div>

                                                <p className="mt-1 text-[10px] font-semibold text-violet-600">
                                                    {project.code} ·{" "}
                                                    {project.category}
                                                </p>

                                                <p className="mt-2 text-xs text-slate-500">
                                                    {project.description ||
                                                        "No description provided."}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleRecordStatus(
                                                        "projects",
                                                        project.id
                                                    )
                                                }
                                                className="h-9 rounded-lg border border-slate-200 px-3 text-[10px] font-semibold text-slate-600"
                                            >
                                                {project.status ===
                                                "Active"
                                                    ? "Disable"
                                                    : "Enable"}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openProjectDrawer(
                                                        project
                                                    )
                                                }
                                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500"
                                            >
                                                <Pencil size={14} />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    deleteProject(
                                                        project.id
                                                    )
                                                }
                                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 text-rose-600"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                                                className={`rounded-xl border px-3 py-2 text-[10px] font-semibold transition ${
                                                    active
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

            {drawerType === "project" && (
                <SettingsDrawer
                    title={
                        projectForm.id
                            ? "Edit Project"
                            : "Add Project"
                    }
                    description="Configure a software product or internal project."
                    onClose={closeDrawer}
                    onSubmit={saveProject}
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <FieldLabel required>
                                Project code
                            </FieldLabel>

                            <input
                                value={projectForm.code}
                                onChange={(event) =>
                                    setProjectForm((current) => ({
                                        ...current,
                                        code: event.target.value,
                                    }))
                                }
                                placeholder="PRJ-006"
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                            />
                        </div>

                        <div>
                            <FieldLabel required>
                                Project name
                            </FieldLabel>

                            <input
                                value={projectForm.name}
                                onChange={(event) =>
                                    setProjectForm((current) => ({
                                        ...current,
                                        name: event.target.value,
                                    }))
                                }
                                placeholder="Project name"
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                            />
                        </div>
                    </div>

                    <div>
                        <FieldLabel>Category</FieldLabel>

                        <input
                            value={projectForm.category}
                            onChange={(event) =>
                                setProjectForm((current) => ({
                                    ...current,
                                    category: event.target.value,
                                }))
                            }
                            placeholder="ERP, Billing, Mobile App..."
                            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                        />
                    </div>

                    <div>
                        <FieldLabel>Description</FieldLabel>

                        <textarea
                            value={projectForm.description}
                            onChange={(event) =>
                                setProjectForm((current) => ({
                                    ...current,
                                    description: event.target.value,
                                }))
                            }
                            rows={5}
                            className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                        />
                    </div>

                    <div>
                        <FieldLabel>Status</FieldLabel>

                        <select
                            value={projectForm.status}
                            onChange={(event) =>
                                setProjectForm((current) => ({
                                    ...current,
                                    status: event.target.value,
                                }))
                            }
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                        >
                            <option>Active</option>
                            <option>Inactive</option>
                        </select>
                    </div>
                </SettingsDrawer>
            )}

            {drawerType === "role" && (
                <SettingsDrawer
                    title={roleForm.id ? "Edit Role" : "Add Role"}
                    description="Configure module access for this role."
                    onClose={closeDrawer}
                    onSubmit={saveRole}
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
                                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${
                                        roleForm.permissions.includes(
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