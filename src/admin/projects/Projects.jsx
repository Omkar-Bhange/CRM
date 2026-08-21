import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Archive,
    BriefcaseBusiness,
    CheckCircle2,
    CircleDollarSign,
    Clock3,
    PauseCircle,
    Pencil,
    Eye,
    ListTodo,
    Users,
    AlertTriangle,
    UserRound,
    Plus,
    RefreshCw,
    PackageCheck,
LockKeyhole,
PackagePlus,
    Search,
    Trash2,
    X,
} from "lucide-react";

import API_URL from "../../config/api";

const STATUS_OPTIONS = [
    "All",
    "Planned",
    "Active",
    "On Hold",
    "Completed",
    "Cancelled",
];

const PROJECT_TYPES = [
    "Product Development",
    "Client Implementation",
    "Internal Development",
    "Maintenance",
    "Upgrade",
    "Customization",
    "Research",
    "Other",
];

const PRIORITY_OPTIONS = [
    "Low",
    "Medium",
    "High",
    "Critical",
];

const EMPTY_FORM = {
    projectCode: "",
    projectName: "",
    projectType:
        "Client Implementation",

    clientId: "",
    productId: "",

    description: "",

    startDate: "",
    dueDate: "",

    priority: "Medium",
    status: "Planned",
    progress: 0,

    finalAmount: "",
    amcApplicable: false,
    proposedAmcAmount: "",
    warrantyEndDate: "",
};

function formatDate(value) {
    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "—";
    }

    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    );
}

function money(value) {
    return Number(
        value || 0
    ).toLocaleString(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }
    );
}

function getStatusStyle(status) {
    switch (status) {
        case "Active":
            return "bg-emerald-50 text-emerald-700 border-emerald-200";

        case "Completed":
            return "bg-violet-50 text-violet-700 border-violet-200";

        case "On Hold":
            return "bg-amber-50 text-amber-700 border-amber-200";

        case "Cancelled":
            return "bg-rose-50 text-rose-700 border-rose-200";

        default:
            return "bg-slate-100 text-slate-700 border-slate-200";
    }
}

export default function Projects({
    clients = [],
    products = [],
    onCreateProjectTask = null,
}) {
    const [
        projects,
        setProjects,
    ] = useState([]);

    const [
        stats,
        setStats,
    ] = useState({
        totalProjects: 0,
        plannedProjects: 0,
        activeProjects: 0,
        onHoldProjects: 0,
        completedProjects: 0,
    });

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const [
        drawerOpen,
        setDrawerOpen,
    ] = useState(false);

    const [
        editingProjectId,
        setEditingProjectId,
    ] = useState(null);

    const [
        search,
        setSearch,
    ] = useState("");

    const [
        statusFilter,
        setStatusFilter,
    ] = useState("All");

    const [
        typeFilter,
        setTypeFilter,
    ] = useState("All");

    const [
        priorityFilter,
        setPriorityFilter,
    ] = useState("All");

    const [
        form,
        setForm,
    ] = useState({
        ...EMPTY_FORM,
    });

    /* =====================================================
   PROJECT DETAILS
===================================================== */

    const [
        detailsOpen,
        setDetailsOpen,
    ] = useState(false);

    const [
        detailsLoading,
        setDetailsLoading,
    ] = useState(false);

    const [
        projectDetails,
        setProjectDetails,
    ] = useState(null);
    
const [
    completeOpen,
    setCompleteOpen,
] = useState(false);

const [
    completing,
    setCompleting,
] = useState(false);

const [
    completionForm,
    setCompletionForm,
] = useState({
    completionDate: "",
    deliveryDate: "",
    finalAmount: "",
    warrantyEndDate: "",
    amcApplicable: false,
    proposedAmcAmount: "",
});
/* =====================================================
   CONVERT PROJECT TO PRODUCT
===================================================== */

const [
    convertOpen,
    setConvertOpen,
] = useState(false);

const [
    converting,
    setConverting,
] = useState(false);

const [
    conversionForm,
    setConversionForm,
] = useState({
    productCode: "",
    productName: "",
    category: "Software",
    description: "",
    currentVersion: "v1.0.0",
    platform: "Web",
    releaseDate: "",
});

    const getAuthToken = () =>
        localStorage.getItem(
            "client-connect-token"
        ) ||
        sessionStorage.getItem(
            "client-connect-token"
        ) ||
        "";

    const loadProjects =
        async () => {
            try {
                setLoading(true);
                setError("");

                const params =
                    new URLSearchParams();

                if (
                    statusFilter !== "All"
                ) {
                    params.set(
                        "status",
                        statusFilter
                    );
                }

                if (
                    typeFilter !== "All"
                ) {
                    params.set(
                        "projectType",
                        typeFilter
                    );
                }

                if (
                    priorityFilter !== "All"
                ) {
                    params.set(
                        "priority",
                        priorityFilter
                    );
                }

                if (
                    search.trim()
                ) {
                    params.set(
                        "search",
                        search.trim()
                    );
                }

                const response =
                    await fetch(
                        `${API_URL}/api/admin/projects?${params.toString()}`,
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

                setProjects(
                    Array.isArray(
                        result.data
                    )
                        ? result.data
                        : []
                );

                setStats(
                    result.stats || {
                        totalProjects: 0,
                        plannedProjects: 0,
                        activeProjects: 0,
                        onHoldProjects: 0,
                        completedProjects: 0,
                    }
                );
            } catch (loadError) {
                console.error(
                    "Load projects error:",
                    loadError
                );

                setError(
                    loadError.message ||
                    "Unable to load projects."
                );

                setProjects([]);
            } finally {
                setLoading(false);
            }
        };

    useEffect(() => {
        loadProjects();
    }, [
        statusFilter,
        typeFilter,
        priorityFilter,
    ]);

    const filteredProjects =
        useMemo(() => {
            const value =
                search
                    .trim()
                    .toLowerCase();

            if (!value) {
                return projects;
            }

            return projects.filter(
                (project) =>
                    [
                        project.projectCode,
                        project.projectName,
                        project.clientName,
                        project.productName,
                        project.projectType,
                        project.requirementCode,
                    ].some((field) =>
                        String(
                            field || ""
                        )
                            .toLowerCase()
                            .includes(value)
                    )
            );
        }, [
            projects,
            search,
        ]);

    const resetForm =
        () => {
            setForm({
                ...EMPTY_FORM,
            });

            setEditingProjectId(
                null
            );
        };

    const openNewProject =
        () => {
            resetForm();
            setDrawerOpen(true);
        };

    const openEditProject =
        (project) => {
            const id =
                project._id ||
                project.id;

            setEditingProjectId(
                id
            );

            setForm({
                projectCode:
                    project.projectCode ||
                    "",

                projectName:
                    project.projectName ||
                    "",

                projectType:
                    project.projectType ||
                    "Client Implementation",

                clientId:
                    project.clientId ||
                    "",

                productId:
                    project.productId ||
                    "",

                description:
                    project.description ||
                    "",

                startDate:
                    project.startDate
                        ? String(
                            project.startDate
                        ).slice(
                            0,
                            10
                        )
                        : "",

                dueDate:
                    project.dueDate
                        ? String(
                            project.dueDate
                        ).slice(
                            0,
                            10
                        )
                        : "",

                priority:
                    project.priority ||
                    "Medium",

                status:
                    project.status ||
                    "Planned",

                progress:
                    Number(
                        project.progress ||
                        0
                    ),

                finalAmount:
                    project.finalAmount ||
                    "",

                amcApplicable:
                    Boolean(
                        project.amcApplicable
                    ),

                proposedAmcAmount:
                    project.proposedAmcAmount ||
                    "",

                warrantyEndDate:
                    project.warrantyEndDate
                        ? String(
                            project.warrantyEndDate
                        ).slice(
                            0,
                            10
                        )
                        : "",
            });

            setDrawerOpen(true);
        };
    const openProjectDetails =
        async (project) => {
            const id =
                project._id ||
                project.id;

            if (!id) {
                return;
            }

            try {
                setDetailsOpen(true);
                setDetailsLoading(true);
                setProjectDetails(null);

                const response =
                    await fetch(
                        `${API_URL}/api/admin/project/${id}/details`,
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
                        "Unable to load project details."
                    );
                }

                setProjectDetails(
                    result.data
                );

                /*
                 * Details API also synchronizes
                 * project progress.
                 *
                 * Refresh main project list so
                 * its progress bar also updates.
                 */
                await loadProjects();
            } catch (detailsError) {
                console.error(
                    "Project details error:",
                    detailsError
                );

                setDetailsOpen(false);

                alert(
                    detailsError.message ||
                    "Unable to load project details."
                );
            } finally {
                setDetailsLoading(false);
            }
        };


    const closeProjectDetails =
        () => {
            if (detailsLoading) {
                return;
            }

            setDetailsOpen(false);
            setProjectDetails(null);
        };

        const openCompleteProject = () => {
    const project =
        projectDetails?.project;

    if (!project) {
        return;
    }

    const summary =
        projectDetails?.summary || {};

    const totalTasks =
        Number(
            summary.totalTasks || 0
        );

    const completedTasks =
        Number(
            summary.completedTasks || 0
        );

    const progress =
        Number(
            summary.progress || 0
        );

    if (totalTasks === 0) {
        alert(
            "Create and complete at least one project task before completing the project."
        );
        return;
    }

    if (
        completedTasks !== totalTasks ||
        progress < 100
    ) {
        alert(
            `Project cannot be completed yet.\n\nCompleted Tasks: ${completedTasks}/${totalTasks}\nProgress: ${progress}%`
        );
        return;
    }

    const today =
        new Date()
            .toISOString()
            .slice(0, 10);

    setCompletionForm({
        completionDate:
            project.completedDate
                ? String(
                    project.completedDate
                ).slice(0, 10)
                : today,

        deliveryDate:
            project.deliveryDate
                ? String(
                    project.deliveryDate
                ).slice(0, 10)
                : today,

        finalAmount:
            project.finalAmount ||
            "",

        warrantyEndDate:
            project.warrantyEndDate
                ? String(
                    project.warrantyEndDate
                ).slice(0, 10)
                : "",

        amcApplicable:
            Boolean(
                project.amcApplicable
            ),

        proposedAmcAmount:
            project.proposedAmcAmount ||
            "",
    });

    setCompleteOpen(true);
};

const handleCompletionChange =
    (event) => {
        const {
            name,
            value,
            type,
            checked,
        } = event.target;

        setCompletionForm(
            (current) => ({
                ...current,

                [name]:
                    type === "checkbox"
                        ? checked
                        : value,
            })
        );
    };
    const completeProject =
    async (event) => {
        event.preventDefault();

        const project =
            projectDetails?.project;

        const id =
            project?._id ||
            project?.id;

        if (!id) {
            return;
        }

        if (
            !completionForm.completionDate
        ) {
            alert(
                "Completion date is required."
            );
            return;
        }

        if (
            !completionForm.deliveryDate
        ) {
            alert(
                "Delivery / Go-Live date is required."
            );
            return;
        }

        if (
            completionForm.amcApplicable &&
            Number(
                completionForm.proposedAmcAmount ||
                0
            ) <= 0
        ) {
            alert(
                "Enter the proposed yearly AMC amount."
            );
            return;
        }

        try {
            setCompleting(true);

            const response =
                await fetch(
                    `${API_URL}/api/admin/project/${id}/complete`,
                    {
                        method:
                            "POST",

                        headers: {
                            Accept:
                                "application/json",

                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${getAuthToken()}`,
                        },

                        body:
                            JSON.stringify({
                                completionDate:
                                    completionForm.completionDate,

                                deliveryDate:
                                    completionForm.deliveryDate,

                                finalAmount:
                                    Number(
                                        completionForm.finalAmount ||
                                            0
                                    ),

                                warrantyEndDate:
                                    completionForm.warrantyEndDate ||
                                    null,

                                amcApplicable:
                                    Boolean(
                                        completionForm.amcApplicable
                                    ),

                                proposedAmcAmount:
                                    Number(
                                        completionForm.proposedAmcAmount ||
                                            0
                                    ),
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
                    "Unable to complete project."
                );
            }

            setCompleteOpen(false);

            await loadProjects();

            /*
             * Reload Project Workspace so
             * completed status/dates appear.
             */
            await openProjectDetails({
                _id: id,
            });

            const amc =
                result.data?.amc;

            if (
                amc?.applicable &&
                !amc?.activated
            ) {
                alert(
                    amc.reason ||
                    "Project completed successfully. AMC is planned but not activated yet."
                );
            } else {
                alert(
                    "Project completed successfully."
                );
            }
        } catch (completeError) {
            console.error(
                "Complete project error:",
                completeError
            );

            alert(
                completeError.message ||
                "Unable to complete project."
            );
        } finally {
            setCompleting(false);
        }
    };

    const openConvertToProduct = () => {
    const project =
        projectDetails?.project;

    if (!project) {
        return;
    }

    if (
        project.status !==
        "Completed"
    ) {
        alert(
            "Complete the project before converting it to a product."
        );
        return;
    }

    if (
        project.convertedToProduct
    ) {
        alert(
            "This project has already been converted to a product."
        );
        return;
    }

    if (project.productId) {
        alert(
            "This project is already linked to an existing product."
        );
        return;
    }

    const today =
        new Date()
            .toISOString()
            .slice(0, 10);

    setConversionForm({
        productCode:
            "",

        productName:
            project.projectName ||
            "",

        category:
            "Software",

        description:
            project.description ||
            "",

        currentVersion:
            "v1.0.0",

        platform:
            "Web",

        releaseDate:
            project.deliveryDate
                ? String(
                    project.deliveryDate
                ).slice(0, 10)
                : project.completedDate
                ? String(
                    project.completedDate
                ).slice(0, 10)
                : today,
    });

    setConvertOpen(true);
};

const handleConversionChange =
    (event) => {
        const {
            name,
            value,
        } = event.target;

        setConversionForm(
            (current) => ({
                ...current,
                [name]:
                    value,
            })
        );
    };
    const convertProjectToProduct =
    async (event) => {
        event.preventDefault();

        const project =
            projectDetails?.project;

        const id =
            project?._id ||
            project?.id;

        if (!id) {
            return;
        }

        const productCode =
            conversionForm.productCode
                .trim()
                .toUpperCase();

        const productName =
            conversionForm.productName
                .trim();

        if (!productCode) {
            alert(
                "Product code is required."
            );
            return;
        }

        if (!productName) {
            alert(
                "Product name is required."
            );
            return;
        }

        try {
            setConverting(true);

            const response =
                await fetch(
                    `${API_URL}/api/admin/project/${id}/convert-to-product`,
                    {
                        method:
                            "POST",

                        headers: {
                            Accept:
                                "application/json",

                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${getAuthToken()}`,
                        },

                        body:
                            JSON.stringify({
                                productCode,

                                productName,

                                category:
                                    conversionForm.category ||
                                    "Software",

                                description:
                                    conversionForm.description ||
                                    "",

                                currentVersion:
                                    conversionForm.currentVersion ||
                                    "v1.0.0",

                                platform:
                                    conversionForm.platform ||
                                    "Web",

                                releaseDate:
                                    conversionForm.releaseDate ||
                                    null,
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
                    "Unable to convert project to product."
                );
            }

            setConvertOpen(false);

            await loadProjects();

            /*
             * Reload workspace.
             * Backend now returns project as
             * converted/read-only.
             */
            await openProjectDetails({
                _id: id,
            });

            alert(
                `Product ${result.data?.product?.productCode || productCode} created successfully.\n\nThis project is now read-only.`
            );
        } catch (convertError) {
            console.error(
                "Convert project to product error:",
                convertError
            );

            alert(
                convertError.message ||
                "Unable to convert project to product."
            );
        } finally {
            setConverting(false);
        }
    };
    const closeDrawer =
        () => {
            if (saving) {
                return;
            }

            setDrawerOpen(false);
            resetForm();
        };

    const handleChange =
        (event) => {
            const {
                name,
                value,
                type,
                checked,
            } = event.target;

            setForm(
                (current) => ({
                    ...current,

                    [name]:
                        type === "checkbox"
                            ? checked
                            : value,
                })
            );
        };

    const saveProject =
        async (event) => {
            event.preventDefault();

            if (
                !form.projectCode.trim()
            ) {
                alert(
                    "Project code is required."
                );

                return;
            }

            if (
                !form.projectName.trim()
            ) {
                alert(
                    "Project name is required."
                );

                return;
            }

            try {
                setSaving(true);

                const isEditing =
                    Boolean(
                        editingProjectId
                    );

                const endpoint =
                    isEditing
                        ? `${API_URL}/api/admin/project/${editingProjectId}`
                        : `${API_URL}/api/admin/project`;

                const response =
                    await fetch(
                        endpoint,
                        {
                            method:
                                isEditing
                                    ? "PUT"
                                    : "POST",

                            headers: {
                                Accept:
                                    "application/json",

                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${getAuthToken()}`,
                            },

                            body:
                                JSON.stringify({
                                    ...form,

                                    progress:
                                        Number(
                                            form.progress ||
                                            0
                                        ),

                                    finalAmount:
                                        Number(
                                            form.finalAmount ||
                                            0
                                        ),

                                    proposedAmcAmount:
                                        Number(
                                            form.proposedAmcAmount ||
                                            0
                                        ),
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

                closeDrawer();

                await loadProjects();
            } catch (saveError) {
                console.error(
                    "Save project error:",
                    saveError
                );

                alert(
                    saveError.message ||
                    "Unable to save project."
                );
            } finally {
                setSaving(false);
            }
        };

    const updateProjectStatus =
        async (
            project,
            status
        ) => {
            const id =
                project._id ||
                project.id;

            if (!id) {
                return;
            }

            try {
                const response =
                    await fetch(
                        `${API_URL}/api/admin/project/${id}/status`,
                        {
                            method:
                                "PATCH",

                            headers: {
                                Accept:
                                    "application/json",

                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${getAuthToken()}`,
                            },

                            body:
                                JSON.stringify({
                                    status,

                                    progress:
                                        status ===
                                            "Completed"
                                            ? 100
                                            : project.progress ||
                                            0,
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
                        "Unable to update project status."
                    );
                }

                await loadProjects();
            } catch (statusError) {
                alert(
                    statusError.message ||
                    "Unable to update project status."
                );
            }
        };

    const deleteProject =
        async (project) => {
            const id =
                project._id ||
                project.id;

            if (!id) {
                return;
            }

            const confirmed =
                window.confirm(
                    `Delete ${project.projectCode || "this project"}?`
                );

            if (!confirmed) {
                return;
            }

            try {
                const response =
                    await fetch(
                        `${API_URL}/api/admin/project/${id}`,
                        {
                            method:
                                "DELETE",

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
                        "Unable to delete project."
                    );
                }

                await loadProjects();
            } catch (deleteError) {
                alert(
                    deleteError.message ||
                    "Unable to delete project."
                );
            }
        };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">
                        Project Management
                    </p>

                    <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                        Projects
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Manage approved development projects, delivery, progress and AMC planning.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={
                        openNewProject
                    }
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                    <Plus size={17} />
                    New Project
                </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {[
                    {
                        label:
                            "Total Projects",
                        value:
                            stats.totalProjects,
                        icon:
                            BriefcaseBusiness,
                    },
                    {
                        label:
                            "Planned",
                        value:
                            stats.plannedProjects,
                        icon:
                            Clock3,
                    },
                    {
                        label:
                            "Active",
                        value:
                            stats.activeProjects,
                        icon:
                            CheckCircle2,
                    },
                    {
                        label:
                            "On Hold",
                        value:
                            stats.onHoldProjects,
                        icon:
                            PauseCircle,
                    },
                    {
                        label:
                            "Completed",
                        value:
                            stats.completedProjects,
                        icon:
                            CircleDollarSign,
                    },
                ].map(
                    ({
                        label,
                        value,
                        icon: Icon,
                    }) => (
                        <div
                            key={label}
                            className="rounded-2xl border border-slate-200 bg-white p-5"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-slate-500">
                                        {label}
                                    </p>

                                    <p className="mt-2 text-2xl font-semibold text-slate-950">
                                        {value}
                                    </p>
                                </div>

                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                                    <Icon
                                        size={
                                            18
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    )
                )}
            </div>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 p-4">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                        <div className="relative flex-1">
                            <Search
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                value={
                                    search
                                }
                                onChange={(
                                    event
                                ) =>
                                    setSearch(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                onKeyDown={(
                                    event
                                ) => {
                                    if (
                                        event.key ===
                                        "Enter"
                                    ) {
                                        loadProjects();
                                    }
                                }}
                                placeholder="Search project, client, product or requirement..."
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-violet-500"
                            />
                        </div>

                        <select
                            value={
                                statusFilter
                            }
                            onChange={(
                                event
                            ) =>
                                setStatusFilter(
                                    event
                                        .target
                                        .value
                                )
                            }
                            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
                        >
                            {STATUS_OPTIONS.map(
                                (status) => (
                                    <option
                                        key={
                                            status
                                        }
                                        value={
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

                        <select
                            value={
                                typeFilter
                            }
                            onChange={(
                                event
                            ) =>
                                setTypeFilter(
                                    event
                                        .target
                                        .value
                                )
                            }
                            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
                        >
                            <option value="All">
                                All Types
                            </option>

                            {PROJECT_TYPES.map(
                                (type) => (
                                    <option
                                        key={
                                            type
                                        }
                                        value={
                                            type
                                        }
                                    >
                                        {type}
                                    </option>
                                )
                            )}
                        </select>

                        <select
                            value={
                                priorityFilter
                            }
                            onChange={(
                                event
                            ) =>
                                setPriorityFilter(
                                    event
                                        .target
                                        .value
                                )
                            }
                            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
                        >
                            <option value="All">
                                All Priority
                            </option>

                            {PRIORITY_OPTIONS.map(
                                (priority) => (
                                    <option
                                        key={
                                            priority
                                        }
                                        value={
                                            priority
                                        }
                                    >
                                        {
                                            priority
                                        }
                                    </option>
                                )
                            )}
                        </select>

                        <button
                            type="button"
                            onClick={
                                loadProjects
                            }
                            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                        >
                            <RefreshCw
                                size={16}
                            />
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-700">
                        {error}
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-slate-50">
                            <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                <th className="px-5 py-3">
                                    Project
                                </th>

                                <th className="px-5 py-3">
                                    Client
                                </th>

                                <th className="px-5 py-3">
                                    Requirement
                                </th>

                                <th className="px-5 py-3">
                                    Type
                                </th>

                                <th className="px-5 py-3">
                                    Value
                                </th>

                                <th className="px-5 py-3">
                                    Due Date
                                </th>

                                <th className="px-5 py-3">
                                    Progress
                                </th>

                                <th className="px-5 py-3">
                                    Status
                                </th>

                                <th className="px-5 py-3 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="px-5 py-12 text-center text-sm text-slate-500"
                                    >
                                        Loading projects...
                                    </td>
                                </tr>
                            ) : filteredProjects.length >
                                0 ? (
                                filteredProjects.map(
                                    (
                                        project
                                    ) => {
                                        const id =
                                            project._id ||
                                            project.id;

                                        return (
                                            <tr
                                                key={
                                                    id
                                                }
                                                className="transition hover:bg-slate-50/70"
                                            >
                                                <td className="px-5 py-4">
                                                    <p className="text-xs font-semibold text-violet-600">
                                                        {
                                                            project.projectCode
                                                        }
                                                    </p>

                                                    <p className="mt-1 max-w-[220px] truncate text-sm font-medium text-slate-900">
                                                        {
                                                            project.projectName
                                                        }
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-400">
                                                        {
                                                            project.priority
                                                        }
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4 text-sm text-slate-700">
                                                    {project.clientName ||
                                                        "Internal"}
                                                </td>

                                                <td className="px-5 py-4 text-sm text-violet-600">
                                                    {project.requirementCode ||
                                                        "—"}
                                                </td>

                                                <td className="px-5 py-4 text-sm text-slate-600">
                                                    {
                                                        project.projectType
                                                    }
                                                </td>

                                                <td className="px-5 py-4 text-sm font-medium text-slate-900">
                                                    {money(
                                                        project.finalAmount
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 text-sm text-slate-600">
                                                    {formatDate(
                                                        project.dueDate
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="w-[140px]">
                                                        <div className="mb-1 flex items-center justify-between text-xs">
                                                            <span className="text-slate-500">
                                                                Progress
                                                            </span>

                                                            <span className="font-semibold text-slate-700">
                                                                {Number(
                                                                    project.progress ||
                                                                    0
                                                                )}
                                                                %
                                                            </span>
                                                        </div>

                                                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                                            <div
                                                                className="h-full rounded-full bg-violet-600"
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
                                                </td>

                                                <td className="px-5 py-4">
                                                    <select
                                                    disabled={
    Boolean(
        project.convertedToProduct ||
        project.isReadOnly
    )
}
                                                        value={
                                                            project.status
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            updateProjectStatus(
                                                                project,
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none ${getStatusStyle(
                                                            project.status
                                                        )}`}
                                                    >
              {STATUS_OPTIONS.filter(
    (status) =>
        status !== "All" &&
        (
            status !== "Completed" ||
            project.status === "Completed"
        )
).map(
                                                            (
                                                                status
                                                            ) => (
                                                                <option
                                                                    key={
                                                                        status
                                                                    }
                                                                    value={
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
                                                </td>

                                                <td className="px-5 py-4">

                                                <div className="flex justify-end gap-2">

    {/* VIEW — ALWAYS AVAILABLE */}

    <button
        type="button"
        onClick={() =>
            openProjectDetails(
                project
            )
        }
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-violet-200 text-violet-600 transition hover:bg-violet-50"
        title="View Project"
    >
        <Eye size={15} />
    </button>


    {/* LOCKED PROJECTS CANNOT BE EDITED */}

    {!(
        project.convertedToProduct ||
        project.isReadOnly
    ) && (
        <>
            <button
                type="button"
                onClick={() =>
                    openEditProject(
                        project
                    )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                title="Edit"
            >
                <Pencil
                    size={15}
                />
            </button>

            <button
                type="button"
                onClick={() =>
                    deleteProject(
                        project
                    )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 text-rose-600 transition hover:bg-rose-50"
                title="Delete"
            >
                <Trash2
                    size={15}
                />
            </button>
        </>
    )}


    {/* READ ONLY INDICATOR */}

    {(project.convertedToProduct ||
        project.isReadOnly) && (
        <div
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600"
            title="Converted to Product — Read Only"
        >
            <LockKeyhole
                size={15}
            />
        </div>
    )}
</div>
                                                </td>
                                            </tr>
                                        );
                                    }
                                )
                            ) : (
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="px-5 py-16 text-center"
                                    >
                                        <Archive
                                            size={30}
                                            className="mx-auto text-slate-300"
                                        />

                                        <p className="mt-3 text-sm font-medium text-slate-700">
                                            No projects found
                                        </p>

                                        <p className="mt-1 text-xs text-slate-400">
                                            Convert an approved requirement or create a new project.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {drawerOpen && (
                <>
                    <button
                        type="button"
                        onClick={
                            closeDrawer
                        }
                        className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-[2px]"
                    />

                    <aside className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-[720px] flex-col bg-white shadow-[-24px_0_70px_rgba(15,23,42,0.18)]">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet-600">
                                    Project Management
                                </p>

                                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                                    {editingProjectId
                                        ? "Edit Project"
                                        : "New Project"}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeDrawer
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                            >
                                <X
                                    size={17}
                                />
                            </button>
                        </div>

                        <form
                            onSubmit={
                                saveProject
                            }
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
                                <section>
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Project Details
                                    </h3>

                                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                                        <Field
                                            label="Project Code"
                                            required
                                        >
                                            <input
                                                name="projectCode"
                                                value={
                                                    form.projectCode
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-500"
                                            />
                                        </Field>

                                        <Field
                                            label="Project Name"
                                            required
                                        >
                                            <input
                                                name="projectName"
                                                value={
                                                    form.projectName
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-500"
                                            />
                                        </Field>

                                        <Field label="Project Type">
                                            <select
                                                name="projectType"
                                                value={
                                                    form.projectType
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
                                            >
                                                {PROJECT_TYPES.map(
                                                    (
                                                        type
                                                    ) => (
                                                        <option
                                                            key={
                                                                type
                                                            }
                                                            value={
                                                                type
                                                            }
                                                        >
                                                            {
                                                                type
                                                            }
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </Field>

                                        <Field label="Client">
                                            <select
                                                name="clientId"
                                                value={
                                                    form.clientId
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
                                            >
                                                <option value="">
                                                    Internal / No Client
                                                </option>

                                                {clients.map(
                                                    (
                                                        client
                                                    ) => (
                                                        <option
                                                            key={
                                                                client._id ||
                                                                client.id
                                                            }
                                                            value={
                                                                client._id ||
                                                                client.id
                                                            }
                                                        >
                                                            {client.clientCode ||
                                                                client.code}{" "}
                                                            -{" "}
                                                            {
                                                                client.companyName
                                                            }
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </Field>

                                        <Field label="Product">
                                            <select
                                                name="productId"
                                                value={
                                                    form.productId
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
                                            >
                                                <option value="">
                                                    No Product
                                                </option>

                                                {products.map(
                                                    (
                                                        product
                                                    ) => (
                                                        <option
                                                            key={
                                                                product._id ||
                                                                product.id
                                                            }
                                                            value={
                                                                product._id ||
                                                                product.id
                                                            }
                                                        >
                                                            {
                                                                product.productName
                                                            }
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </Field>

                                        <Field label="Priority">
                                            <select
                                                name="priority"
                                                value={
                                                    form.priority
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
                                            >
                                                {PRIORITY_OPTIONS.map(
                                                    (
                                                        priority
                                                    ) => (
                                                        <option
                                                            key={
                                                                priority
                                                            }
                                                            value={
                                                                priority
                                                            }
                                                        >
                                                            {
                                                                priority
                                                            }
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </Field>

                                        <Field label="Start Date">
                                            <input
                                                type="date"
                                                name="startDate"
                                                value={
                                                    form.startDate
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                                            />
                                        </Field>

                                        <Field label="Due Date">
                                            <input
                                                type="date"
                                                name="dueDate"
                                                value={
                                                    form.dueDate
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                                            />
                                        </Field>
                                    </div>

                                    <div className="mt-4">
                                        <Field label="Description / Scope">
                                            <textarea
                                                rows={5}
                                                name="description"
                                                value={
                                                    form.description
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                className="min-h-[120px] w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-violet-500"
                                            />
                                        </Field>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Progress & Commercial
                                    </h3>

                                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                                        <Field label="Status">
                                            <select
                                                name="status"
                                                value={
                                                    form.status
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
                                            >
                           {STATUS_OPTIONS.filter(
    (status) =>
        status !== "All" &&
        (
            status !== "Completed" ||
            form.status === "Completed"
        )
).map(
                                                    (
                                                        status
                                                    ) => (
                                                        <option
                                                            key={
                                                                status
                                                            }
                                                            value={
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
                                        </Field>

                                       <Field label="Progress">
    <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3">
        <div className="flex-1">
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                    className="h-full rounded-full bg-violet-600"
                    style={{
                        width: `${Math.min(
                            Math.max(
                                Number(
                                    form.progress ||
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

        <span className="ml-3 text-sm font-semibold text-violet-700">
            {Number(
                form.progress ||
                0
            )}
            %
        </span>
    </div>

    <p className="mt-1 text-[11px] text-slate-400">
        Automatically calculated from project tasks
    </p>
</Field>

                                        <Field label="Final Project Amount">
                                            <input
                                                type="number"
                                                min="0"
                                                name="finalAmount"
                                                value={
                                                    form.finalAmount
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                                            />
                                        </Field>

                                        <Field label="Warranty End Date">
                                            <input
                                                type="date"
                                                name="warrantyEndDate"
                                                value={
                                                    form.warrantyEndDate
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                                            />
                                        </Field>
                                    </div>
                                </section>

                                <section>
                                    <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
                                        <input
                                            type="checkbox"
                                            name="amcApplicable"
                                            checked={
                                                form.amcApplicable
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            className="h-4 w-4"
                                        />

                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">
                                                AMC Applicable
                                            </p>

                                            <p className="text-xs text-slate-500">
                                                Enable if this project will move into AMC after delivery/warranty.
                                            </p>
                                        </div>
                                    </label>

                                    {form.amcApplicable && (
                                        <div className="mt-4">
                                            <Field label="Proposed Yearly AMC">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    name="proposedAmcAmount"
                                                    value={
                                                        form.proposedAmcAmount
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                                                />
                                            </Field>
                                        </div>
                                    )}
                                </section>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                                <button
                                    type="button"
                                    onClick={
                                        closeDrawer
                                    }
                                    className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        saving
                                    }
                                    className="h-10 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white disabled:opacity-50"
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingProjectId
                                            ? "Update Project"
                                            : "Save Project"}
                                </button>
                            </div>
                        </form>
                    </aside>
                </>
            )}

            {/* =====================================================
    PROJECT DETAILS DRAWER
===================================================== */}

            {detailsOpen && (
                <>
                    <button
                        type="button"
                        aria-label="Close project details"
                        onClick={
                            closeProjectDetails
                        }
                        className="fixed inset-0 z-[90] bg-slate-950/40 backdrop-blur-[2px]"
                    />

                    <aside className="fixed inset-y-0 right-0 z-[100] flex w-full max-w-[900px] flex-col bg-white shadow-[-24px_0_70px_rgba(15,23,42,0.18)]">

                        {/* HEADER */}

                        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet-600">
                                    Project Workspace
                                </p>

                                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                                    {projectDetails?.project?.projectName ||
                                        "Project Details"}
                                </h2>

                                {projectDetails?.project && (
                                    <p className="mt-1 text-xs text-slate-500">
                                        {
                                            projectDetails.project.projectCode
                                        }

                                        {projectDetails.project.requirementCode
                                            ? ` • ${projectDetails.project.requirementCode}`
                                            : ""}
                                    </p>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeProjectDetails
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* BODY */}

                        <div className="flex-1 overflow-y-auto bg-slate-50/60 p-6">

                            {detailsLoading ? (
                                <div className="flex min-h-[400px] items-center justify-center">
                                    <div className="text-center">
                                        <RefreshCw
                                            size={25}
                                            className="mx-auto animate-spin text-violet-600"
                                        />

                                        <p className="mt-3 text-sm text-slate-500">
                                            Loading project details...
                                        </p>
                                    </div>
                                </div>
                            ) : projectDetails ? (
                                <div className="space-y-6">

                                    {/* PROJECT OVERVIEW */}

                                    <section className="rounded-2xl border border-slate-200 bg-white p-5">
                                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-xs font-semibold text-violet-600">
                                                        {
                                                            projectDetails.project.projectCode
                                                        }
                                                    </span>

                                                    <span
                                                        className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
                                                            projectDetails.project.status
                                                        )}`}
                                                    >
                                                        {
                                                            projectDetails.project.status
                                                        }
                                                    </span>
                                                </div>

                                                <h3 className="mt-2 text-lg font-semibold text-slate-950">
                                                    {
                                                        projectDetails.project.projectName
                                                    }
                                                </h3>

                                                <p className="mt-1 text-sm text-slate-500">
                                                    {projectDetails.project.clientName ||
                                                        "Internal Project"}

                                                    {projectDetails.project.projectType
                                                        ? ` • ${projectDetails.project.projectType}`
                                                        : ""}
                                                </p>
                                            </div>

                                            <div className="min-w-[210px]">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-medium text-slate-500">
                                                        Overall Progress
                                                    </span>

                                                    <span className="text-lg font-semibold text-violet-700">
                                                        {Number(
                                                            projectDetails.summary?.progress ||
                                                            0
                                                        )}
                                                        %
                                                    </span>
                                                </div>

                                                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                                                    <div
                                                        className="h-full rounded-full bg-violet-600 transition-all"
                                                        style={{
                                                            width: `${Math.min(
                                                                Math.max(
                                                                    Number(
                                                                        projectDetails.summary?.progress ||
                                                                        0
                                                                    ),
                                                                    0
                                                                ),
                                                                100
                                                            )}%`,
                                                        }}
                                                    />
                                                </div>

                                                <p className="mt-2 text-right text-[11px] text-slate-400">
                                                    Calculated from project tasks
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">

                                            <ProjectInfo
                                                label="Client"
                                                value={
                                                    projectDetails.project.clientName ||
                                                    "Internal"
                                                }
                                            />

                                            <ProjectInfo
                                                label="Requirement"
                                                value={
                                                    projectDetails.project.requirementCode ||
                                                    "—"
                                                }
                                            />

                                            <ProjectInfo
                                                label="Project Value"
                                                value={money(
                                                    projectDetails.project.finalAmount
                                                )}
                                            />

                                            <ProjectInfo
                                                label="Due Date"
                                                value={formatDate(
                                                    projectDetails.project.dueDate
                                                )}
                                            />
                                        </div>
                                    </section>
                                    {/* PROJECT COMPLETION ACTION */}

{projectDetails.project.status !==
    "Completed" && (
    <section
        className={`rounded-2xl border p-5 ${
            Number(
                projectDetails.summary?.totalTasks ||
                    0
            ) > 0 &&
            Number(
                projectDetails.summary?.completedTasks ||
                    0
            ) ===
                Number(
                    projectDetails.summary?.totalTasks ||
                        0
                ) &&
            Number(
                projectDetails.summary?.progress ||
                    0
            ) >= 100
                ? "border-emerald-200 bg-emerald-50/70"
                : "border-amber-200 bg-amber-50/70"
        }`}
    >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <div className="flex items-center gap-2">
                    <CheckCircle2
                        size={18}
                        className={
                            Number(
                                projectDetails.summary?.progress ||
                                    0
                            ) >= 100
                                ? "text-emerald-600"
                                : "text-amber-600"
                        }
                    />

                    <h3 className="text-sm font-semibold text-slate-900">
                        Project Completion
                    </h3>
                </div>

                <p className="mt-1 text-xs text-slate-600">
                    {Number(
                        projectDetails.summary?.totalTasks ||
                            0
                    ) === 0
                        ? "Create project tasks before completing this project."
                        : Number(
                              projectDetails.summary?.completedTasks ||
                                  0
                          ) ===
                              Number(
                                  projectDetails.summary?.totalTasks ||
                                      0
                              ) &&
                          Number(
                              projectDetails.summary?.progress ||
                                  0
                          ) >= 100
                        ? "All project tasks are completed. This project is ready for delivery and closure."
                        : `${Number(
                              projectDetails.summary?.completedTasks ||
                                  0
                          )}/${Number(
                              projectDetails.summary?.totalTasks ||
                                  0
                          )} tasks completed. Finish all tasks before completing the project.`}
                </p>
            </div>

            <button
                type="button"
                onClick={
                    openCompleteProject
                }
                disabled={
                    Number(
                        projectDetails.summary?.totalTasks ||
                            0
                    ) === 0 ||
                    Number(
                        projectDetails.summary?.completedTasks ||
                            0
                    ) !==
                        Number(
                            projectDetails.summary?.totalTasks ||
                                0
                        ) ||
                    Number(
                        projectDetails.summary?.progress ||
                            0
                    ) < 100
                }
                className="h-10 shrink-0 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
                Complete Project
            </button>
        </div>
    </section>
)}
{projectDetails.project.status ===
    "Completed" && (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
        <div className="flex items-center gap-2">
            <CheckCircle2
                size={18}
                className="text-emerald-600"
            />

            <h3 className="text-sm font-semibold text-emerald-900">
                Project Completed
            </h3>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ProjectInfo
                label="Completion Date"
                value={formatDate(
                    projectDetails.project.completedDate
                )}
            />

            <ProjectInfo
                label="Delivery / Go-Live"
                value={formatDate(
                    projectDetails.project.deliveryDate
                )}
            />

            <ProjectInfo
                label="Final Amount"
                value={money(
                    projectDetails.project.finalAmount
                )}
            />

            <ProjectInfo
                label="Completed By"
                value={
                    projectDetails.project.completedByName ||
                    "Admin"
                }
            />
        </div>
    </section>
)}


                                    {/* TASK SUMMARY */}

                                    <section>
                                        <div className="mb-3 flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm font-semibold text-slate-900">
                                                    Task Summary
                                                </h3>

                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    Live status of work linked to this project.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

                                            <ProjectStatCard
                                                label="Total Tasks"
                                                value={
                                                    projectDetails.summary?.totalTasks ||
                                                    0
                                                }
                                                icon={ListTodo}
                                            />

                                            <ProjectStatCard
                                                label="Active"
                                                value={
                                                    projectDetails.summary?.activeTasks ||
                                                    0
                                                }
                                                icon={Clock3}
                                            />

                                            <ProjectStatCard
                                                label="Completed"
                                                value={
                                                    projectDetails.summary?.completedTasks ||
                                                    0
                                                }
                                                icon={CheckCircle2}
                                            />

                                            <ProjectStatCard
                                                label="Overdue"
                                                value={
                                                    projectDetails.summary?.overdueTasks ||
                                                    0
                                                }
                                                icon={AlertTriangle}
                                            />
                                        </div>
                                    </section>

                                    {/* TEAM */}

                                    <section className="rounded-2xl border border-slate-200 bg-white p-5">
                                        <div className="flex items-center gap-2">
                                            <Users
                                                size={17}
                                                className="text-violet-600"
                                            />

                                            <h3 className="text-sm font-semibold text-slate-900">
                                                Project Team
                                            </h3>
                                        </div>

                                        {Array.isArray(
                                            projectDetails.team
                                        ) &&
                                            projectDetails.team.length >
                                            0 ? (
                                            <div className="mt-4 flex flex-wrap gap-3">
                                                {projectDetails.team.map(
                                                    (member) => (
                                                        <div
                                                            key={
                                                                member.employeeId ||
                                                                member.employeeCode
                                                            }
                                                            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                                                        >
                                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                                                                <UserRound
                                                                    size={16}
                                                                />
                                                            </div>

                                                            <div>
                                                                <p className="text-sm font-semibold text-slate-800">
                                                                    {
                                                                        member.employeeName
                                                                    }
                                                                </p>

                                                                <p className="text-[11px] text-slate-400">
                                                                    {member.employeeCode ||
                                                                        "Employee"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        ) : (
                                            <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                                                <Users
                                                    size={22}
                                                    className="mx-auto text-slate-300"
                                                />

                                                <p className="mt-2 text-sm font-medium text-slate-600">
                                                    No team members yet
                                                </p>

                                                <p className="mt-1 text-xs text-slate-400">
                                                    Employees will appear here when project tasks are assigned.
                                                </p>
                                            </div>
                                        )}
                                    </section>

                                    {/* PROJECT TASKS */}

                                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

                                        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <h3 className="text-sm font-semibold text-slate-900">
                                                    Project Tasks
                                                </h3>

                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    Tasks assigned specifically to this project.
                                                </p>
                                            </div>

                                         {!(
    projectDetails.project.convertedToProduct ||
    projectDetails.project.isReadOnly
) ? (
    <button
        type="button"
        onClick={() => {
            const project =
                projectDetails?.project;

            if (!project) {
                return;
            }

            if (
                typeof onCreateProjectTask ===
                "function"
            ) {
                onCreateProjectTask(
                    project
                );
            }
        }}
        className="flex h-9 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 text-xs font-semibold text-white transition hover:bg-violet-700"
    >
        <Plus size={14} />
        Create Task
    </button>
) : (
    <div className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-500">
        <LockKeyhole
            size={13}
        />

        Historical Tasks
    </div>
)}
                                        </div>

                                        {Array.isArray(
                                            projectDetails.tasks
                                        ) &&
                                            projectDetails.tasks.length >
                                            0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full">
                                                    <thead className="bg-slate-50">
                                                        <tr className="text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                                            <th className="px-4 py-3">
                                                                Task
                                                            </th>

                                                            <th className="px-4 py-3">
                                                                Employee
                                                            </th>

                                                            <th className="px-4 py-3">
                                                                Priority
                                                            </th>

                                                            <th className="px-4 py-3">
                                                                Due Date
                                                            </th>

                                                            <th className="px-4 py-3">
                                                                Progress
                                                            </th>

                                                            <th className="px-4 py-3">
                                                                Status
                                                            </th>
                                                        </tr>
                                                    </thead>

                                                    <tbody className="divide-y divide-slate-100">
                                                        {projectDetails.tasks.map(
                                                            (
                                                                task
                                                            ) => (
                                                                <tr
                                                                    key={
                                                                        task.id ||
                                                                        task.taskCode
                                                                    }
                                                                    className="hover:bg-slate-50/70"
                                                                >
                                                                    <td className="px-4 py-3">
                                                                        <p className="text-[11px] font-semibold text-violet-600">
                                                                            {
                                                                                task.taskCode
                                                                            }
                                                                        </p>

                                                                        <p className="mt-1 max-w-[220px] truncate text-sm font-medium text-slate-800">
                                                                            {
                                                                                task.title
                                                                            }
                                                                        </p>
                                                                    </td>

                                                                    <td className="px-4 py-3">
                                                                        <p className="text-sm text-slate-700">
                                                                            {task.assignedEmployeeName ||
                                                                                "Unassigned"}
                                                                        </p>

                                                                        <p className="text-[11px] text-slate-400">
                                                                            {
                                                                                task.assignedEmployeeCode
                                                                            }
                                                                        </p>
                                                                    </td>

                                                                    <td className="px-4 py-3 text-xs font-medium text-slate-600">
                                                                        {
                                                                            task.priority
                                                                        }
                                                                    </td>

                                                                    <td className="px-4 py-3 text-xs text-slate-600">
                                                                        {formatDate(
                                                                            task.dueDate
                                                                        )}
                                                                    </td>

                                                                    <td className="px-4 py-3">
                                                                        <div className="w-[120px]">
                                                                            <div className="mb-1 flex items-center justify-between text-[10px]">
                                                                                <span className="text-slate-400">
                                                                                    Progress
                                                                                </span>

                                                                                <span className="font-semibold text-slate-700">
                                                                                    {Number(
                                                                                        task.progress ||
                                                                                        0
                                                                                    )}
                                                                                    %
                                                                                </span>
                                                                            </div>

                                                                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                                                                <div
                                                                                    className="h-full rounded-full bg-violet-600"
                                                                                    style={{
                                                                                        width: `${Math.min(
                                                                                            Math.max(
                                                                                                Number(
                                                                                                    task.progress ||
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
                                                                    </td>

                                                                    <td className="px-4 py-3">
                                                                        <span
                                                                            className={`inline-flex rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${getTaskStatusStyle(
                                                                                task.status
                                                                            )}`}
                                                                        >
                                                                            {
                                                                                task.status
                                                                            }
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            )
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="px-5 py-12 text-center">
                                                <ListTodo
                                                    size={28}
                                                    className="mx-auto text-slate-300"
                                                />

                                                <p className="mt-3 text-sm font-medium text-slate-700">
                                                    No project tasks yet
                                                </p>

                                                <p className="mt-1 text-xs text-slate-400">
                                                    Create the first task and assign it to an employee.
                                                </p>
                                            </div>
                                        )}
                                    </section>

                                    {/* AMC */}

                                    {projectDetails.project.amcApplicable && (
                                        <section className="rounded-2xl border border-slate-200 bg-white p-5">
                                            <h3 className="text-sm font-semibold text-slate-900">
                                                AMC & Warranty
                                            </h3>

                                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                                <ProjectInfo
                                                    label="Proposed Yearly AMC"
                                                    value={money(
                                                        projectDetails.project.proposedAmcAmount
                                                    )}
                                                />

                                                <ProjectInfo
                                                    label="Warranty End"
                                                    value={formatDate(
                                                        projectDetails.project.warrantyEndDate
                                                    )}
                                                />
                                            </div>
                                        </section>
                                    )}
                                    {/* =====================================================
    PRODUCT CONVERSION
===================================================== */}

{projectDetails.project.status === "Completed" &&
    !projectDetails.project.convertedToProduct &&
    !projectDetails.project.isReadOnly &&
    !projectDetails.project.productId && (
        <section className="rounded-2xl border border-violet-200 bg-violet-50/70 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>
                    <div className="flex items-center gap-2">
                        <PackagePlus
                            size={18}
                            className="text-violet-600"
                        />

                        <h3 className="text-sm font-semibold text-slate-900">
                            Create Reusable Product
                        </h3>
                    </div>

                    <p className="mt-1 max-w-[600px] text-xs leading-5 text-slate-600">
                        If this completed development can be sold,
                        installed or supported for other clients,
                        convert it into Product Master.
                    </p>

                    <p className="mt-1 text-[11px] font-medium text-amber-700">
                        After conversion this project becomes a
                        permanent read-only development record.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openConvertToProduct}
                    className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                    <PackagePlus size={16} />

                    Convert to Product
                </button>
            </div>
        </section>
    )}


{/* =====================================================
    CONVERTED PROJECT / READ ONLY
===================================================== */}

{(projectDetails.project.convertedToProduct ||
    projectDetails.project.isReadOnly) && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5">

            <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <PackageCheck size={19} />
                </div>

                <div>
                    <div className="flex flex-wrap items-center gap-2">

                        <h3 className="text-sm font-semibold text-emerald-900">
                            Converted to Product
                        </h3>

                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            <LockKeyhole size={11} />
                            Read Only
                        </span>

                    </div>

                    <p className="mt-1 text-sm font-semibold text-slate-900">
                        {projectDetails.project.productCode || "Product"}
                        {" - "}
                        {projectDetails.project.productName ||
                            projectDetails.project.projectName}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-600">
                        Development is complete and this project is
                        retained as a permanent historical record.
                        Future sales, client assignments, support and
                        AMC should use the Product record.
                    </p>

                    {projectDetails.project.convertedProductAt && (
                        <p className="mt-2 text-[11px] text-slate-500">
                            Converted on{" "}
                            {formatDate(
                                projectDetails.project.convertedProductAt
                            )}

                            {projectDetails.project.convertedProductByName
                                ? ` by ${projectDetails.project.convertedProductByName}`
                                : ""}
                        </p>
                    )}

                </div>
            </div>
        </section>
    )}


                                </div>
                            ) : (
                                <div className="py-20 text-center text-sm text-slate-500">
                                    Project details are unavailable.
                                </div>
                            )}
                        </div>
                    </aside>
                </>
            )}
            {/* =====================================================
    COMPLETE PROJECT MODAL
===================================================== */}

{completeOpen && (
    <>
        <button
            type="button"
            onClick={() => {
                if (!completing) {
                    setCompleteOpen(
                        false
                    );
                }
            }}
            className="fixed inset-0 z-[120] bg-slate-950/50 backdrop-blur-[2px]"
        />

        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <form
                onSubmit={
                    completeProject
                }
                className="w-full max-w-[620px] overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
                <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-600">
                            Project Delivery
                        </p>

                        <h2 className="mt-1 text-xl font-semibold text-slate-950">
                            Complete Project
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            {
                                projectDetails?.project?.projectCode
                            }{" "}
                            •{" "}
                            {
                                projectDetails?.project?.projectName
                            }
                        </p>
                    </div>

                    <button
                        type="button"
                        disabled={
                            completing
                        }
                        onClick={() =>
                            setCompleteOpen(
                                false
                            )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-50"
                    >
                        <X size={17} />
                    </button>
                </div>

                <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                            <CheckCircle2
                                size={17}
                            />

                            All project tasks completed
                        </div>

                        <p className="mt-1 text-xs text-emerald-700">
                            {
                                projectDetails?.summary?.completedTasks
                            }
                            /
                            {
                                projectDetails?.summary?.totalTasks
                            }{" "}
                            tasks completed • 100% progress
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                            label="Completion Date"
                            required
                        >
                            <input
                                type="date"
                                name="completionDate"
                                value={
                                    completionForm.completionDate
                                }
                                onChange={
                                    handleCompletionChange
                                }
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-500"
                            />
                        </Field>

                        <Field
                            label="Delivery / Go-Live Date"
                            required
                        >
                            <input
                                type="date"
                                name="deliveryDate"
                                value={
                                    completionForm.deliveryDate
                                }
                                onChange={
                                    handleCompletionChange
                                }
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-500"
                            />
                        </Field>

                        <Field label="Final Project Amount">
                            <input
                                type="number"
                                min="0"
                                name="finalAmount"
                                value={
                                    completionForm.finalAmount
                                }
                                onChange={
                                    handleCompletionChange
                                }
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-500"
                            />
                        </Field>

                        <Field label="Warranty End Date">
                            <input
                                type="date"
                                name="warrantyEndDate"
                                value={
                                    completionForm.warrantyEndDate
                                }
                                onChange={
                                    handleCompletionChange
                                }
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-500"
                            />
                        </Field>
                    </div>

                    <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                        <input
                            type="checkbox"
                            name="amcApplicable"
                            checked={
                                completionForm.amcApplicable
                            }
                            onChange={
                                handleCompletionChange
                            }
                            className="mt-0.5 h-4 w-4"
                        />

                        <div>
                            <p className="text-sm font-semibold text-slate-900">
                                AMC Applicable
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                                Enable when this completed project should move into AMC after warranty/delivery.
                            </p>
                        </div>
                    </label>

                    {completionForm.amcApplicable && (
                        <Field
                            label="Proposed Yearly AMC"
                            required
                        >
                            <input
                                type="number"
                                min="0"
                                name="proposedAmcAmount"
                                value={
                                    completionForm.proposedAmcAmount
                                }
                                onChange={
                                    handleCompletionChange
                                }
                                placeholder="e.g. 8000"
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-500"
                            />
                        </Field>
                    )}

                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <p className="text-xs font-semibold text-amber-800">
                            Important
                        </p>

                        <p className="mt-1 text-xs leading-5 text-amber-700">
                            Completing the project closes the development workflow. AMC is recorded as planned here; actual AMC activation will be handled separately after the client product is available.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                    <button
                        type="button"
                        disabled={
                            completing
                        }
                        onClick={() =>
                            setCompleteOpen(
                                false
                            )
                        }
                        className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={
                            completing
                        }
                        className="flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                        {completing ? (
                            <>
                                <RefreshCw
                                    size={15}
                                    className="animate-spin"
                                />
                                Completing...
                            </>
                        ) : (
                            <>
                                <CheckCircle2
                                    size={15}
                                />
                                Complete Project
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    </>
)}
{/* =====================================================
    PRODUCT CONVERSION
===================================================== */}


{/* =====================================================
    CONVERT PROJECT TO PRODUCT MODAL
===================================================== */}

{convertOpen && (
    <>
        <button
            type="button"
            onClick={() => {
                if (!converting) {
                    setConvertOpen(
                        false
                    );
                }
            }}
            className="fixed inset-0 z-[140] bg-slate-950/50 backdrop-blur-[2px]"
        />

        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">

            <form
                onSubmit={
                    convertProjectToProduct
                }
                className="w-full max-w-[650px] overflow-hidden rounded-2xl bg-white shadow-2xl"
            >

                {/* HEADER */}

                <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet-600">
                            Product Master
                        </p>

                        <h2 className="mt-1 text-xl font-semibold text-slate-950">
                            Convert Project to Product
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            {
                                projectDetails?.project?.projectCode
                            }{" "}
                            •{" "}
                            {
                                projectDetails?.project?.projectName
                            }
                        </p>
                    </div>

                    <button
                        type="button"
                        disabled={
                            converting
                        }
                        onClick={() =>
                            setConvertOpen(
                                false
                            )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-50"
                    >
                        <X size={17} />
                    </button>
                </div>


                {/* FORM */}

                <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">

                    <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                        <div className="flex items-start gap-3">
                            <PackagePlus
                                size={18}
                                className="mt-0.5 text-violet-600"
                            />

                            <div>
                                <p className="text-sm font-semibold text-violet-900">
                                    Create Product Master
                                </p>

                                <p className="mt-1 text-xs leading-5 text-violet-700">
                                    A new reusable Product will be created from this completed Project and the original Project will become read-only.
                                </p>
                            </div>
                        </div>
                    </div>


                    <div className="grid gap-4 sm:grid-cols-2">

                        <Field
                            label="Product Code"
                            required
                        >
                            <input
                                name="productCode"
                                value={
                                    conversionForm.productCode
                                }
                                onChange={
                                    handleConversionChange
                                }
                                placeholder="e.g. TRN001"
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm uppercase outline-none focus:border-violet-500"
                            />
                        </Field>


                        <Field
                            label="Product Name"
                            required
                        >
                            <input
                                name="productName"
                                value={
                                    conversionForm.productName
                                }
                                onChange={
                                    handleConversionChange
                                }
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-500"
                            />
                        </Field>


                        <Field label="Category">
                            <input
                                name="category"
                                value={
                                    conversionForm.category
                                }
                                onChange={
                                    handleConversionChange
                                }
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-500"
                            />
                        </Field>


                        <Field label="Current Version">
                            <input
                                name="currentVersion"
                                value={
                                    conversionForm.currentVersion
                                }
                                onChange={
                                    handleConversionChange
                                }
                                placeholder="v1.0.0"
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-500"
                            />
                        </Field>


                        <Field label="Platform">
                            <select
                                name="platform"
                                value={
                                    conversionForm.platform
                                }
                                onChange={
                                    handleConversionChange
                                }
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-500"
                            >
                                <option value="Web">
                                    Web
                                </option>

                                <option value="Desktop">
                                    Desktop
                                </option>

                                <option value="Mobile">
                                    Mobile
                                </option>

                                <option value="Web + Mobile">
                                    Web + Mobile
                                </option>

                                <option value="Desktop + Mobile">
                                    Desktop + Mobile
                                </option>

                                <option value="Web + Desktop">
                                    Web + Desktop
                                </option>

                                <option value="Web + Desktop + Mobile">
                                    Web + Desktop + Mobile
                                </option>

                                <option value="Other">
                                    Other
                                </option>
                            </select>
                        </Field>


                        <Field label="Release Date">
                            <input
                                type="date"
                                name="releaseDate"
                                value={
                                    conversionForm.releaseDate
                                }
                                onChange={
                                    handleConversionChange
                                }
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-500"
                            />
                        </Field>
                    </div>


                    <Field label="Product Description">
                        <textarea
                            rows={5}
                            name="description"
                            value={
                                conversionForm.description
                            }
                            onChange={
                                handleConversionChange
                            }
                            className="min-h-[120px] w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-violet-500"
                        />
                    </Field>


                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-start gap-3">
                            <LockKeyhole
                                size={17}
                                className="mt-0.5 text-amber-600"
                            />

                            <div>
                                <p className="text-xs font-semibold text-amber-900">
                                    This action is permanent
                                </p>

                                <p className="mt-1 text-xs leading-5 text-amber-700">
                                    After conversion, this Project becomes a read-only historical development record. You will still be able to view its tasks, team, dates and completion information, but it cannot be edited or deleted.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>


                {/* FOOTER */}

                <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">

                    <button
                        type="button"
                        disabled={
                            converting
                        }
                        onClick={() =>
                            setConvertOpen(
                                false
                            )
                        }
                        className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 disabled:opacity-50"
                    >
                        Cancel
                    </button>


                    <button
                        type="submit"
                        disabled={
                            converting
                        }
                        className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
                    >
                        {converting ? (
                            <>
                                <RefreshCw
                                    size={15}
                                    className="animate-spin"
                                />

                                Converting...
                            </>
                        ) : (
                            <>
                                <PackagePlus
                                    size={15}
                                />

                                Create Product & Lock Project
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    </>
)}
        </div>
    );
}

function Field({
    label,
    required = false,
    children,
}) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                {label}

                {required && (
                    <span className="ml-1 text-rose-500">
                        *
                    </span>
                )}
            </span>

            {children}
        </label>
    );
   


  
}
 function ProjectInfo({
        label,
        value,
    }) {
        return (
            <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    {label}
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                    {value || "—"}
                </p>
            </div>
        );
    }
  function ProjectStatCard({
        label,
        value,
        icon: Icon,
    }) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500">
                            {label}
                        </p>

                        <p className="mt-1 text-xl font-semibold text-slate-900">
                            {value}
                        </p>
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                        <Icon size={16} />
                    </div>
                </div>
            </div>
        );
    }

function getTaskStatusStyle(
    status
) {
    switch (status) {
        case "Completed":
        case "Closed":
            return "border-emerald-200 bg-emerald-50 text-emerald-700";

        case "In Progress":
            return "border-blue-200 bg-blue-50 text-blue-700";

        case "On Hold":
        case "Paused":
            return "border-amber-200 bg-amber-50 text-amber-700";

        case "Cancelled":
            return "border-rose-200 bg-rose-50 text-rose-700";

        default:
            return "border-slate-200 bg-slate-50 text-slate-600";
    }
}