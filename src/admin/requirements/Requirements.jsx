import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    CheckCircle2,
    CircleDollarSign,
    ClipboardList,
    Plus,
    RefreshCw,
    Trash2,
    X,
} from "lucide-react";

import API_URL from "../../config/api";
import DataTable from "../../components/data/DataTable";
const STATUS_OPTIONS = [
    "All",
    "New",
    "Discussion",
    "Analysis",
    "Estimate Pending",
    "Quotation Pending",
    "Quotation Sent",
    "Negotiation",
    "Approved",
    "Rejected",
    "On Hold",
    "Converted to Project",
];

const SOURCE_TYPE_OPTIONS = [
    "All",
    "Existing Client",
    "New Prospect",
];

const REQUIREMENT_TYPES = [
    "New Software",
    "Customization",
    "Mobile App",
    "Website",
    "Integration",
    "Upgrade",
    "Automation",
    "Support Requirement",
    "Other",
];

const SOURCE_OPTIONS = [
    "Existing Client",
    "Phone",
    "WhatsApp",
    "Email",
    "Website",
    "Referral",
    "Walk In",
    "Other",
];

const PRIORITY_OPTIONS = [
    "Low",
    "Medium",
    "High",
    "Critical",
];

const EMPTY_FORM = {
    sourceType: "Existing Client",

    clientId: "",

    prospectName: "",
    prospectCompany: "",
    prospectMobile: "",
    prospectEmail: "",
    prospectCity: "",

    title: "",
    requirementType: "New Software",
    description: "",
    source: "Existing Client",
    priority: "Medium",

    expectedDeliveryDate: "",

    estimatedBudget: "",
    estimatedCost: "",
    quotedAmount: "",

    quotationNo: "",
    quotationDate: "",

    assignedEmployeeId: "",

    status: "New",
    notes: "",
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
        case "Approved":
            return "bg-emerald-50 text-emerald-700 border-emerald-200";

        case "Rejected":
            return "bg-rose-50 text-rose-700 border-rose-200";

        case "Converted to Project":
            return "bg-violet-50 text-violet-700 border-violet-200";

        case "Quotation Sent":
        case "Negotiation":
            return "bg-blue-50 text-blue-700 border-blue-200";

        case "On Hold":
            return "bg-slate-100 text-slate-700 border-slate-200";

        default:
            return "bg-amber-50 text-amber-700 border-amber-200";
    }
}

export default function Requirements({
    clients = [],
    employees = [],
}) {
    const [
        requirements,
        setRequirements,
    ] = useState([]);

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
        search,
        setSearch,
    ] = useState("");

    const [
        statusFilter,
        setStatusFilter,
    ] = useState("All");

    const [
        sourceTypeFilter,
        setSourceTypeFilter,
    ] = useState("All");

    const [
        priorityFilter,
        setPriorityFilter,
    ] = useState("All");

    const [
        form,
        setForm,
    ] = useState(
        EMPTY_FORM
    );
    const [
    convertOpen,
    setConvertOpen,
] = useState(false);

const [
    converting,
    setConverting,
] = useState(false);

const [
    selectedRequirement,
    setSelectedRequirement,
] = useState(null);

const [
    convertForm,
    setConvertForm,
] = useState({
    clientId: "",
    projectCode: "",
    projectName: "",
    projectType:
        "Client Implementation",

    startDate: "",
    dueDate: "",

    priority: "Medium",

    finalAmount: "",

    amcApplicable: false,
    proposedAmcAmount: "",

    warrantyEndDate: "",
});

    const getAuthToken = () =>
        localStorage.getItem(
            "client-connect-token"
        ) ||
        sessionStorage.getItem(
            "client-connect-token"
        ) ||
        "";

    const loadRequirements =
        async () => {
            try {
                setLoading(true);
                setError("");

                const params =
                    new URLSearchParams();

                if (
                    statusFilter !==
                    "All"
                ) {
                    params.set(
                        "status",
                        statusFilter
                    );
                }

                if (
                    sourceTypeFilter !==
                    "All"
                ) {
                    params.set(
                        "sourceType",
                        sourceTypeFilter
                    );
                }

                if (
                    priorityFilter !==
                    "All"
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
                        `${API_URL}/api/admin/requirements?${params.toString()}`,
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
                        "Unable to load requirements."
                    );
                }

                setRequirements(
                    Array.isArray(
                        result.data
                    )
                        ? result.data
                        : []
                );
            } catch (loadError) {
                console.error(
                    "Load requirements error:",
                    loadError
                );

                setError(
                    loadError.message ||
                    "Unable to load requirements."
                );

                setRequirements([]);
            } finally {
                setLoading(false);
            }
        };

    useEffect(() => {
        loadRequirements();
    }, [
        statusFilter,
        sourceTypeFilter,
        priorityFilter,
    ]);

    const filteredRequirements =
        useMemo(() => {
            const value =
                search
                    .trim()
                    .toLowerCase();

            if (!value) {
                return requirements;
            }

            return requirements.filter(
                (item) =>
                    [
                        item.requirementCode,
                        item.title,
                        item.clientName,
                        item.prospectName,
                        item.prospectCompany,
                        item.requirementType,
                        item.status,
                    ].some((field) =>
                        String(
                            field || ""
                        )
                            .toLowerCase()
                            .includes(
                                value
                            )
                    )
            );
        }, [
            requirements,
            search,
        ]);

    const summary =
        useMemo(() => {
            const total =
                requirements.length;

            const newCount =
                requirements.filter(
                    (item) =>
                        item.status ===
                        "New"
                ).length;

            const approved =
                requirements.filter(
                    (item) =>
                        item.status ===
                        "Approved"
                ).length;

            const converted =
                requirements.filter(
                    (item) =>
                        item.status ===
                        "Converted to Project"
                ).length;

            return {
                total,
                newCount,
                approved,
                converted,
            };
        }, [requirements]);

    const openNewRequirement =
        () => {
            setForm({
                ...EMPTY_FORM,
            });

            setDrawerOpen(true);
        };

    const closeDrawer =
        () => {
            if (saving) {
                return;
            }

            setDrawerOpen(false);

            setForm({
                ...EMPTY_FORM,
            });
        };

    const handleChange =
        (event) => {
            const {
                name,
                value,
            } = event.target;

            setForm(
                (current) => {
                    const next = {
                        ...current,
                        [name]: value,
                    };

                    if (
                        name ===
                        "sourceType"
                    ) {
                        if (
                            value ===
                            "Existing Client"
                        ) {
                            next.source =
                                "Existing Client";
                        } else {
                            next.clientId =
                                "";

                            if (
                                next.source ===
                                "Existing Client"
                            ) {
                                next.source =
                                    "Other";
                            }
                        }
                    }

                    return next;
                }
            );
        };

    const submitRequirement =
        async (event) => {
            event.preventDefault();

            if (
                !form.title.trim()
            ) {
                alert(
                    "Requirement title is required."
                );

                return;
            }

            if (
                !form.description.trim()
            ) {
                alert(
                    "Requirement description is required."
                );

                return;
            }

            if (
                form.sourceType ===
                    "Existing Client" &&
                !form.clientId
            ) {
                alert(
                    "Please select a client."
                );

                return;
            }

            if (
                form.sourceType ===
                "New Prospect"
            ) {
                if (
                    !form.prospectName.trim()
                ) {
                    alert(
                        "Prospect name is required."
                    );

                    return;
                }

                if (
                    !form.prospectMobile.trim()
                ) {
                    alert(
                        "Prospect mobile number is required."
                    );

                    return;
                }
            }

            try {
                setSaving(true);

                const response =
                    await fetch(
                        `${API_URL}/api/admin/requirement`,
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
                                JSON.stringify(
                                    form
                                ),
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
                        "Unable to create requirement."
                    );
                }

                closeDrawer();

                await loadRequirements();
            } catch (saveError) {
                console.error(
                    "Create requirement error:",
                    saveError
                );

                alert(
                    saveError.message ||
                    "Unable to create requirement."
                );
            } finally {
                setSaving(false);
            }
        };

    const updateStatus =
        async (
            requirement,
            status
        ) => {
            const id =
                requirement._id ||
                requirement.id;

            if (!id) {
                return;
            }

            try {
                const response =
                    await fetch(
                        `${API_URL}/api/admin/requirement/${id}/status`,
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
                        "Unable to update requirement."
                    );
                }

                await loadRequirements();
            } catch (updateError) {
                alert(
                    updateError.message ||
                    "Unable to update requirement."
                );
            }
        };
        
const getSuggestedProjectType =
    (requirementType) => {
        if (
            requirementType ===
            "Customization"
        ) {
            return "Customization";
        }

        if (
            requirementType ===
            "Upgrade"
        ) {
            return "Upgrade";
        }

        return "Client Implementation";
    };


const openConvertProject =
    (requirement) => {
        const today =
            new Date()
                .toISOString()
                .slice(
                    0,
                    10
                );

        setSelectedRequirement(
            requirement
        );

        setConvertForm({
            clientId:
                requirement.clientId ||
                "",

            projectCode:
                "",

            projectName:
                requirement.title ||
                "",

            projectType:
                getSuggestedProjectType(
                    requirement.requirementType
                ),

            startDate:
                today,

            dueDate:
                requirement.expectedDeliveryDate
                    ? String(
                          requirement.expectedDeliveryDate
                      ).slice(
                          0,
                          10
                      )
                    : "",

            priority:
                requirement.priority ||
                "Medium",

            finalAmount:
                requirement.quotedAmount ||
                "",

            amcApplicable:
                false,

            proposedAmcAmount:
                "",

            warrantyEndDate:
                "",
        });

        setConvertOpen(true);
    };


const closeConvertProject =
    () => {
        if (converting) {
            return;
        }

        setConvertOpen(false);

        setSelectedRequirement(
            null
        );
    };


const handleConvertChange =
    (event) => {
        const {
            name,
            value,
            type,
            checked,
        } = event.target;

        setConvertForm(
            (current) => ({
                ...current,

                [name]:
                    type ===
                    "checkbox"
                        ? checked
                        : value,
            })
        );
    };


const convertRequirementToProject =
    async (event) => {
        event.preventDefault();

        if (
            !selectedRequirement
        ) {
            return;
        }

        const requirementId =
            selectedRequirement._id ||
            selectedRequirement.id;

        if (
            !convertForm.projectCode.trim()
        ) {
            alert(
                "Project code is required."
            );

            return;
        }

        if (
            !convertForm.projectName.trim()
        ) {
            alert(
                "Project name is required."
            );

            return;
        }

        /*
         * New Prospect must first exist as
         * a real Client.
         */

        if (
            selectedRequirement.sourceType ===
                "New Prospect" &&
            !convertForm.clientId
        ) {
            alert(
                "This is a New Prospect. First create this prospect in Clients, then select that Client here."
            );

            return;
        }

        try {
            setConverting(true);

            const response =
                await fetch(
                    `${API_URL}/api/admin/requirement/${requirementId}/convert-to-project`,
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
                                clientId:
                                    convertForm.clientId ||
                                    null,

                                projectCode:
                                    convertForm.projectCode
                                        .trim()
                                        .toUpperCase(),

                                projectName:
                                    convertForm.projectName
                                        .trim(),

                                projectType:
                                    convertForm.projectType,

                                startDate:
                                    convertForm.startDate ||
                                    null,

                                dueDate:
                                    convertForm.dueDate ||
                                    null,

                                priority:
                                    convertForm.priority,

                                finalAmount:
                                    Number(
                                        convertForm.finalAmount ||
                                        0
                                    ),

                                amcApplicable:
                                    Boolean(
                                        convertForm.amcApplicable
                                    ),

                                proposedAmcAmount:
                                    Number(
                                        convertForm.proposedAmcAmount ||
                                        0
                                    ),

                                warrantyEndDate:
                                    convertForm.warrantyEndDate ||
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
                    "Unable to convert requirement to project."
                );
            }

            closeConvertProject();

            await loadRequirements();

            alert(
                `Project ${result.data?.project?.projectCode || ""} created successfully.`
            );
        } catch (convertError) {
            console.error(
                "Convert requirement error:",
                convertError
            );

            alert(
                convertError.message ||
                "Unable to convert requirement to project."
            );
        } finally {
            setConverting(false);
        }
    };

    const deleteRequirement =
        async (requirement) => {
            const id =
                requirement._id ||
                requirement.id;

            if (!id) {
                return;
            }

            const confirmed =
                window.confirm(
                    `Delete ${requirement.requirementCode || "this requirement"}?`
                );

            if (!confirmed) {
                return;
            }

            try {
                const response =
                    await fetch(
                        `${API_URL}/api/admin/requirement/${id}`,
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
                        "Unable to delete requirement."
                    );
                }

                await loadRequirements();
            } catch (deleteError) {
                alert(
                    deleteError.message ||
                    "Unable to delete requirement."
                );
            }
        };

    return (
        <div className="space-y-4">
            {/* Module Title Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                        Business Pipeline
                    </div>
                    <h1 className="mt-0.5 text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                        Requirements & Prospects
                    </h1>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Manage client requests, prospects, quotations and project conversion workflows.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={openNewRequirement}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-[#1548D1] active:bg-[#0F3DB8] transition"
                    >
                        <Plus size={15} strokeWidth={2.5} />
                        <span>New Requirement</span>
                    </button>
                </div>
            </div>

            {/* KPI Metric Summary Cards - High-Density Linear Standard */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    {
                        label: "Total Requirements",
                        value: summary.total,
                        icon: ClipboardList,
                        style: "bg-blue-50 text-blue-600",
                    },
                    {
                        label: "New Leads",
                        value: summary.newCount,
                        icon: Plus,
                        style: "bg-amber-50 text-amber-600",
                    },
                    {
                        label: "Approved",
                        value: summary.approved,
                        icon: CheckCircle2,
                        style: "bg-emerald-50 text-emerald-600",
                    },
                    {
                        label: "Converted to Project",
                        value: summary.converted,
                        icon: CircleDollarSign,
                        style: "bg-violet-50 text-violet-600",
                    },
                ].map(({ label, value, icon: Icon, style }) => (
                    <div
                        key={label}
                        className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs hover:border-slate-300 transition"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    {label}
                                </p>
                                <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                                    {value}
                                </p>
                            </div>

                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${style}`}>
                                <Icon size={16} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modern Zoho-Grade Requirements Pipeline DataTable */}
            <DataTable
                moduleName="Requirements"
                viewTitle="All Requirements"
                views={[
                    { id: "all", label: "All Requirements" },
                    { id: "New", label: "New Leads" },
                    { id: "Under Review", label: "Under Review" },
                    { id: "Approved", label: "Approved Pipeline" },
                    { id: "Converted to Project", label: "Converted" },
                ]}
                activeView={statusFilter === "All" ? "all" : statusFilter}
                onViewChange={(id) => setStatusFilter(id === "all" ? "All" : id)}
                onCreateClick={openNewRequirement}
                createButtonLabel="New Requirement"
                selectable={true}
                columns={[
                    {
                        key: "requirementCode",
                        label: "Requirement",
                        sortable: true,
                        render: (_, item) => (
                            <div>
                                <span className="font-semibold text-violet-600 text-xs">
                                    {item.requirementCode}
                                </span>
                                <p className="font-medium text-slate-900 truncate max-w-[260px] text-xs">
                                    {item.title}
                                </p>
                                <span className="text-[10px] text-slate-400">
                                    {item.sourceType}
                                </span>
                            </div>
                        ),
                    },
                    {
                        key: "customerName",
                        label: "Client / Prospect",
                        sortable: true,
                        render: (_, item) => {
                            const customerName =
                                item.sourceType === "Existing Client"
                                    ? item.clientName || "—"
                                    : item.prospectCompany || item.prospectName || "—";
                            return (
                                <div>
                                    <p className="font-semibold text-slate-800 text-xs">
                                        {customerName}
                                    </p>
                                    {item.sourceType === "New Prospect" && item.prospectMobile && (
                                        <p className="text-[10px] text-slate-400">
                                            {item.prospectMobile}
                                        </p>
                                    )}
                                </div>
                            );
                        },
                    },
                    {
                        key: "requirementType",
                        label: "Type",
                        sortable: true,
                        render: (val) => (
                            <span className="text-slate-600 font-medium text-xs">
                                {val || "—"}
                            </span>
                        ),
                    },
                    {
                        key: "priority",
                        label: "Priority",
                        sortable: true,
                        render: (val) => {
                            const color =
                                val === "Critical"
                                    ? "bg-rose-50 text-rose-700 ring-rose-600/20"
                                    : val === "High"
                                    ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                                    : val === "Medium"
                                    ? "bg-blue-50 text-blue-700 ring-blue-600/20"
                                    : "bg-slate-100 text-slate-600 ring-slate-500/20";
                            return (
                                <span
                                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${color}`}
                                >
                                    {val || "Medium"}
                                </span>
                            );
                        },
                    },
                    {
                        key: "quotedAmount",
                        label: "Quoted",
                        sortable: true,
                        render: (val) => (
                            <span className="font-semibold text-slate-900 text-xs">
                                {money(val)}
                            </span>
                        ),
                    },
                    {
                        key: "expectedDeliveryDate",
                        label: "Delivery",
                        sortable: true,
                        render: (val) => (
                            <span className="text-slate-600 text-xs">
                                {formatDate(val)}
                            </span>
                        ),
                    },
                    {
                        key: "status",
                        label: "Status",
                        sortable: true,
                        render: (_, item) => (
                            <select
                                value={item.status}
                                disabled={item.status === "Converted to Project"}
                                onChange={(e) => updateStatus(item, e.target.value)}
                                className={`rounded-lg border px-2 py-1 text-[11px] font-semibold outline-hidden cursor-pointer ${getStatusStyle(
                                    item.status
                                )}`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {STATUS_OPTIONS.filter((s) => s !== "All").map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        ),
                    },
                ]}
                data={filteredRequirements}
                loading={loading}
                error={error}
                onRetry={loadRequirements}
                idKey="_id"
                searchPlaceholder="Search requirement, client or prospect..."
                statusFilters={STATUS_OPTIONS.map((s) => ({ label: s, value: s }))}
                activeStatusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                toolbarActions={
                    <div className="flex items-center gap-1.5 shrink-0">
                        <select
                            value={sourceTypeFilter}
                            onChange={(e) => setSourceTypeFilter(e.target.value)}
                            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-hidden hover:border-slate-300 transition"
                        >
                            {SOURCE_TYPE_OPTIONS.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>

                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-hidden"
                        >
                            <option value="All">All Priority</option>
                            {PRIORITY_OPTIONS.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>

                        <button
                            type="button"
                            onClick={loadRequirements}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                            title="Refresh"
                        >
                            <RefreshCw size={13} />
                        </button>
                    </div>
                }
                rowActions={[
                    {
                        label: "Convert to Project",
                        icon: CircleDollarSign,
                        condition: (item) => item.status === "Approved",
                        className: "text-violet-600 hover:text-violet-800 hover:bg-violet-50",
                        onClick: (item) => openConvertProject(item),
                    },
                    {
                        label: "Delete Requirement",
                        icon: Trash2,
                        condition: (item) => item.status !== "Converted to Project",
                        className: "text-rose-500 hover:text-rose-700 hover:bg-rose-50",
                        onClick: (item) => deleteRequirement(item),
                    },
                ]}
                initialPageSize={25}
                emptyTitle="No requirements found"
                emptyDescription="Create your first requirement to start the project pipeline."
            />

            {drawerOpen && (
                <>
                    <button
                        type="button"
                        aria-label="Close requirement form"
                        onClick={
                            closeDrawer
                        }
                        className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-[2px]"
                    />

                    <aside className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-[680px] flex-col bg-white shadow-[-24px_0_70px_rgba(15,23,42,0.18)]">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet-600">
                                    Requirement Management
                                </p>

                                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                                    New Requirement
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeDrawer
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X
                                    size={
                                        17
                                    }
                                />
                            </button>
                        </div>

                        <form
                            onSubmit={
                                submitRequirement
                            }
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
                                <section>
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Request Source
                                    </h3>

                                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                                        <Field
                                            label="Source Type"
                                            required
                                        >
                                            <select
                                                name="sourceType"
                                                value={
                                                    form.sourceType
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                            >
                                                <option value="Existing Client">
                                                    Existing Client
                                                </option>

                                                <option value="New Prospect">
                                                    New Prospect
                                                </option>
                                            </select>
                                        </Field>

                                        <Field label="Lead Source">
                                            <select
                                                name="source"
                                                value={
                                                    form.source
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                            >
                                                {SOURCE_OPTIONS.map(
                                                    (
                                                        item
                                                    ) => (
                                                        <option
                                                            key={
                                                                item
                                                            }
                                                            value={
                                                                item
                                                            }
                                                        >
                                                            {
                                                                item
                                                            }
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </Field>
                                    </div>

                                    {form.sourceType ===
                                    "Existing Client" ? (
                                        <div className="mt-4">
                                            <Field
                                                label="Client"
                                                required
                                            >
                                                <select
                                                    name="clientId"
                                                    value={
                                                        form.clientId
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                                >
                                                    <option value="">
                                                        Select Client
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
                                        </div>
                                    ) : (
                                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                            <Field
                                                label="Contact Person"
                                                required
                                            >
                                                <input
                                                    name="prospectName"
                                                    value={
                                                        form.prospectName
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                                />
                                            </Field>

                                            <Field label="Company">
                                                <input
                                                    name="prospectCompany"
                                                    value={
                                                        form.prospectCompany
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                                />
                                            </Field>

                                            <Field
                                                label="Mobile"
                                                required
                                            >
                                                <input
                                                    name="prospectMobile"
                                                    value={
                                                        form.prospectMobile
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                                />
                                            </Field>

                                            <Field label="Email">
                                                <input
                                                    type="email"
                                                    name="prospectEmail"
                                                    value={
                                                        form.prospectEmail
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                                />
                                            </Field>

                                            <Field label="City">
                                                <input
                                                    name="prospectCity"
                                                    value={
                                                        form.prospectCity
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                                />
                                            </Field>
                                        </div>
                                    )}
                                </section>

                                <section>
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Requirement Details
                                    </h3>

                                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                                        <Field
                                            label="Title"
                                            required
                                        >
                                            <input
                                                name="title"
                                                value={
                                                    form.title
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                            />
                                        </Field>

                                        <Field label="Requirement Type">
                                            <select
                                                name="requirementType"
                                                value={
                                                    form.requirementType
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                            >
                                                {REQUIREMENT_TYPES.map(
                                                    (
                                                        item
                                                    ) => (
                                                        <option
                                                            key={
                                                                item
                                                            }
                                                            value={
                                                                item
                                                            }
                                                        >
                                                            {
                                                                item
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
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                            >
                                                {PRIORITY_OPTIONS.map(
                                                    (
                                                        item
                                                    ) => (
                                                        <option
                                                            key={
                                                                item
                                                            }
                                                            value={
                                                                item
                                                            }
                                                        >
                                                            {
                                                                item
                                                            }
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </Field>

                                        <Field label="Expected Delivery">
                                            <input
                                                type="date"
                                                name="expectedDeliveryDate"
                                                value={
                                                    form.expectedDeliveryDate
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                            />
                                        </Field>
                                    </div>

                                    <div className="mt-4">
                                        <Field
                                            label="Description"
                                            required
                                        >
                                            <textarea
                                                rows={
                                                    5
                                                }
                                                name="description"
                                                value={
                                                    form.description
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                className="min-h-[120px] w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                            />
                                        </Field>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Commercial
                                    </h3>

                                    <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        <Field label="Expected Budget">
                                            <input
                                                type="number"
                                                min="0"
                                                name="estimatedBudget"
                                                value={
                                                    form.estimatedBudget
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                            />
                                        </Field>

                                        <Field label="Estimated Cost">
                                            <input
                                                type="number"
                                                min="0"
                                                name="estimatedCost"
                                                value={
                                                    form.estimatedCost
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                            />
                                        </Field>

                                        <Field label="Quoted Amount">
                                            <input
                                                type="number"
                                                min="0"
                                                name="quotedAmount"
                                                value={
                                                    form.quotedAmount
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                            />
                                        </Field>

                                        <Field label="Quotation No">
                                            <input
                                                name="quotationNo"
                                                value={
                                                    form.quotationNo
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                            />
                                        </Field>

                                        <Field label="Quotation Date">
                                            <input
                                                type="date"
                                                name="quotationDate"
                                                value={
                                                    form.quotationDate
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                            />
                                        </Field>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Assignment
                                    </h3>

                                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                                        <Field label="Assigned Employee">
                                            <select
                                                name="assignedEmployeeId"
                                                value={
                                                    form.assignedEmployeeId
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                            >
                                                <option value="">
                                                    Unassigned
                                                </option>

                                                {employees.map(
                                                    (
                                                        employee
                                                    ) => (
                                                        <option
                                                            key={
                                                                employee._id ||
                                                                employee.id
                                                            }
                                                            value={
                                                                employee._id ||
                                                                employee.id
                                                            }
                                                        >
                                                            {employee.employeeCode ||
                                                                ""}{" "}
                                                            -{" "}
                                                            {
                                                                employee.name
                                                            }
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </Field>

                                        <Field label="Status">
                                            <select
                                                name="status"
                                                value={
                                                    form.status
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                            >
                                                {STATUS_OPTIONS.filter(
                                                    (
                                                        status
                                                    ) =>
                                                        status !==
                                                        "All" &&
                                                        status !==
                                                        "Converted to Project"
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
                                    </div>

                                    <div className="mt-4">
                                        <Field label="Notes">
                                            <textarea
                                                rows={
                                                    3
                                                }
                                                name="notes"
                                                value={
                                                    form.notes
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                className="inputStyle min-h-[90px] resize-y py-3"
                                            />
                                        </Field>
                                    </div>
                                </section>
                            </div>

                            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
                                <button
                                    type="button"
                                    onClick={
                                        closeDrawer
                                    }
                                    disabled={
                                        saving
                                    }
                                    className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        saving
                                    }
                                    className="h-10 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                                >
                                    {saving
                                        ? "Saving..."
                                        : "Save Requirement"}
                                </button>
                            </div>
                        </form>
                    </aside>
                </>
            )}
            {convertOpen &&
    selectedRequirement && (
        <>
            <button
                type="button"
                aria-label="Close project conversion"
                onClick={
                    closeConvertProject
                }
                className="fixed inset-0 z-[90] bg-slate-950/40 backdrop-blur-[2px]"
            />

            <aside className="fixed inset-y-0 right-0 z-[100] flex w-full max-w-[680px] flex-col bg-white shadow-[-24px_0_70px_rgba(15,23,42,0.18)]">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet-600">
                            Project Conversion
                        </p>

                        <h2 className="mt-1 text-xl font-semibold text-slate-950">
                            Convert to Project
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            {
                                selectedRequirement.requirementCode
                            }{" "}
                            ·{" "}
                            {
                                selectedRequirement.title
                            }
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={
                            closeConvertProject
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X
                            size={17}
                        />
                    </button>
                </div>

                <form
                    onSubmit={
                        convertRequirementToProject
                    }
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">

                        {/* Requirement summary */}

                        <section className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-xs text-slate-500">
                                        Requirement
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                        {
                                            selectedRequirement.requirementCode
                                        }
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-500">
                                        Quoted Amount
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                        {money(
                                            selectedRequirement.quotedAmount
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-500">
                                        Source
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                        {
                                            selectedRequirement.sourceType
                                        }
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-500">
                                        Priority
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                        {
                                            selectedRequirement.priority
                                        }
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* New prospect client selection */}

                        {selectedRequirement.sourceType ===
                            "New Prospect" && (
                            <section>
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                                    This requirement came from a new prospect. Create the prospect in
                                    Clients first, then select that Client below.
                                </div>

                                <div className="mt-4">
                                    <Field
                                        label="Converted Client"
                                        required
                                    >
                                        <select
                                            name="clientId"
                                            value={
                                                convertForm.clientId
                                            }
                                            onChange={
                                                handleConvertChange
                                            }
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-violet-500"
                                        >
                                            <option value="">
                                                Select Client
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
                                </div>
                            </section>
                        )}

                        {/* Project Details */}

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
                                            convertForm.projectCode
                                        }
                                        onChange={
                                            handleConvertChange
                                        }
                                        placeholder="PRJ-2026-0001"
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm uppercase outline-none focus:border-violet-500"
                                    />
                                </Field>

                                <Field
                                    label="Project Name"
                                    required
                                >
                                    <input
                                        name="projectName"
                                        value={
                                            convertForm.projectName
                                        }
                                        onChange={
                                            handleConvertChange
                                        }
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-500"
                                    />
                                </Field>

                                <Field label="Project Type">
                                    <select
                                        name="projectType"
                                        value={
                                            convertForm.projectType
                                        }
                                        onChange={
                                            handleConvertChange
                                        }
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
                                    >
                                        <option value="Client Implementation">
                                            Client Implementation
                                        </option>

                                        <option value="Customization">
                                            Customization
                                        </option>

                                        <option value="Upgrade">
                                            Upgrade
                                        </option>

                                        <option value="Product Development">
                                            Product Development
                                        </option>

                                        <option value="Maintenance">
                                            Maintenance
                                        </option>

                                        <option value="Research">
                                            Research
                                        </option>

                                        <option value="Other">
                                            Other
                                        </option>
                                    </select>
                                </Field>

                                <Field label="Priority">
                                    <select
                                        name="priority"
                                        value={
                                            convertForm.priority
                                        }
                                        onChange={
                                            handleConvertChange
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
                                            convertForm.startDate
                                        }
                                        onChange={
                                            handleConvertChange
                                        }
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                                    />
                                </Field>

                                <Field label="Due Date">
                                    <input
                                        type="date"
                                        name="dueDate"
                                        value={
                                            convertForm.dueDate
                                        }
                                        onChange={
                                            handleConvertChange
                                        }
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                                    />
                                </Field>
                            </div>
                        </section>

                        {/* Commercial */}

                        <section>
                            <h3 className="text-sm font-semibold text-slate-900">
                                Commercial & AMC
                            </h3>

                            <div className="mt-3 grid gap-4 sm:grid-cols-2">

                                <Field label="Final Project Amount">
                                    <input
                                        type="number"
                                        min="0"
                                        name="finalAmount"
                                        value={
                                            convertForm.finalAmount
                                        }
                                        onChange={
                                            handleConvertChange
                                        }
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                                    />
                                </Field>

                                <Field label="Warranty End Date">
                                    <input
                                        type="date"
                                        name="warrantyEndDate"
                                        value={
                                            convertForm.warrantyEndDate
                                        }
                                        onChange={
                                            handleConvertChange
                                        }
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                                    />
                                </Field>
                            </div>

                            <label className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 p-4">
                                <input
                                    type="checkbox"
                                    name="amcApplicable"
                                    checked={
                                        convertForm.amcApplicable
                                    }
                                    onChange={
                                        handleConvertChange
                                    }
                                    className="h-4 w-4"
                                />

                                <div>
                                    <p className="text-sm font-semibold text-slate-900">
                                        AMC Applicable
                                    </p>

                                    <p className="text-xs text-slate-500">
                                        This project may move to AMC after delivery or warranty.
                                    </p>
                                </div>
                            </label>

                            {convertForm.amcApplicable && (
                                <div className="mt-4">
                                    <Field label="Proposed Yearly AMC">
                                        <input
                                            type="number"
                                            min="0"
                                            name="proposedAmcAmount"
                                            value={
                                                convertForm.proposedAmcAmount
                                            }
                                            onChange={
                                                handleConvertChange
                                            }
                                            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                                        />
                                    </Field>
                                </div>
                            )}
                        </section>
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
                        <button
                            type="button"
                            disabled={
                                converting
                            }
                            onClick={
                                closeConvertProject
                            }
                            className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={
                                converting
                            }
                            className="h-10 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                        >
                            {converting
                                ? "Converting..."
                                : "Create Project"}
                        </button>
                    </div>
                </form>
            </aside>
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